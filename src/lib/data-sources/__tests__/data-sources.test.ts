import { describe, expect, it } from "vitest";

import {
  checkStaleByDataGroup,
  getSourcePolicy,
  isSourceUsableForProductRuntime,
  mockSourceAdapter,
  normalizeCurrencyAmount,
  normalizeSourcePolicyEntry,
  parseAsOfDate,
  parseNullableNumber,
  type SourceRegistryEntry,
} from "../index";

describe("data source normalization", () => {
  it("does not parse missing values as zero", () => {
    for (const value of ["N/A", "", "-", null, undefined]) {
      const result = parseNullableNumber(value, "field");

      expect(result.value).toBeNull();
      expect(result.value).not.toBe(0);
      expect(result.readiness).toBe("insufficient_data");
    }
  });

  it("rejects invalid asOf without silently accepting it", () => {
    const result = parseAsOfDate("not-a-date");

    expect(result.value).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_AS_OF" }),
      ]),
    );
  });

  it("does not auto-convert non-VND currency without exchange-rate source", () => {
    const result = normalizeCurrencyAmount({
      value: 10,
      currency: "USD",
      field: "revenue",
    });

    expect(result.value).toBeNull();
    expect(result.readiness).toBe("needs_review");
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CURRENCY_NEEDS_REVIEW" }),
      ]),
    );
  });
});

describe("source policy", () => {
  it("does not mark unapproved sources usable for production", () => {
    const policy = getSourcePolicy("mock-inline-fixture");

    expect(policy.usageStatus).toBe("research_only");
    expect(isSourceUsableForProductRuntime(policy)).toBe(false);
  });

  it("blocks private or undocumented sources even if mistakenly marked approved", () => {
    const entry: SourceRegistryEntry = {
      id: "bad-source",
      name: "Bad source",
      sourceType: "unknown",
      supportedDataGroups: ["market"],
      usageStatus: "approved",
      licenseStatus: "approved",
      tosStatus: "approved",
      redistributionAllowed: true,
      cachingAllowed: true,
      accessMethod: "undocumented_api",
      evidence: ["placeholder"],
      notes: "",
    };

    const normalized = normalizeSourcePolicyEntry(entry);

    expect(normalized.usageStatus).toBe("blocked");
    expect(isSourceUsableForProductRuntime(normalized)).toBe(false);
  });
});

describe("stale thresholds", () => {
  it("uses data-group-specific freshness thresholds", () => {
    const now = new Date("2026-06-17T00:00:00.000Z");

    expect(checkStaleByDataGroup("2026-06-10", "market", now).isStale).toBe(true);
    expect(checkStaleByDataGroup("2026-04-01", "financial_statement", now).isStale).toBe(false);
    expect(checkStaleByDataGroup("2025-01-01", "industry", now).isStale).toBe(true);
  });
});

describe("mock source adapter", () => {
  it("maps raw aliases to canonical financial fields and preserves metadata", () => {
    const result = mockSourceAdapter.normalizeFinancialData({
      ticker: "AAA",
      companyType: "non_financial",
      netProfit: "100",
      totalAssets: "2000",
      totalEquity: "800",
      operatingCashFlow: "120",
      currency: "VND",
      source: "Inline fixture",
      asOf: "2026-06-17",
      period: "2026-Q2",
      periodType: "quarter",
      collectedAt: "2026-06-17T01:00:00.000Z",
      isDemoData: true,
    });

    expect(result.data?.netIncome).toBe(100);
    expect(result.data?.equity).toBe(800);
    expect(result.metadata?.source).toBe("Inline fixture");
    expect(result.metadata?.asOf).toBe("2026-06-17");
    expect(result.metadata?.period?.value).toBe("2026-Q2");
    expect(result.metadata?.isDemoData).toBe(true);
    expect(result.readiness).toBe("needs_review");
  });

  it("maps valuation aliases to canonical fields", () => {
    const result = mockSourceAdapter.normalizeValuationData({
      ticker: "AAA",
      eps: "2",
      bookValuePerShare: "10",
      sharesOutstanding: "1000000",
      currency: "VND",
      asOf: "2026-06-17",
      period: "TTM-2026-Q2",
      periodType: "ttm",
    });

    expect(result.data?.eps).toBe(2);
    expect(result.data?.bvps).toBe(10);
    expect(result.data?.sharesOutstanding).toBe(1_000_000);
  });

  it("returns clear errors and readiness for invalid asOf", () => {
    const result = mockSourceAdapter.normalizeMarketData({
      ticker: "AAA",
      lastPrice: "20",
      volume: "1000",
      asOf: "not-a-date",
      period: "2026-06-17",
      periodType: "day",
    });

    expect(result.data).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_AS_OF" }),
      ]),
    );
  });
});

