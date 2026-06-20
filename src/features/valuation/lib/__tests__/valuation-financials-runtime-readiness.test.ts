import { describe, expect, it } from "vitest";

import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import { buildValuationFinancialsRuntimeReadiness } from "../valuation-financials-runtime-readiness";

const localDbFinancialsRuntime = {
  runtimeStatus: "db_backed",
  source: {
    sourceLabel: "phase45_synthetic_financial_statement_local_write",
    dataMode: "research_only",
    productionApproved: false,
    fallbackUsed: false,
    readPath: "local_db",
    ticker: "FPT",
    asOf: "2024-12-31",
    fiscalYear: 2024,
    periodType: "annual",
  },
  dataQuality: {
    status: "partial",
    missingFields: ["eps", "sharesOutstanding"],
    warnings: ["Some local research fields are missing."],
    errors: [],
  },
  statementSnapshot: {
    ticker: "FPT",
    period: "2024",
    periodType: "annual",
    sourceName: "phase45_synthetic_financial_statement_local_write",
    collectedAt: null,
    revenue: 1000,
    previousRevenue: null,
    grossProfit: null,
    operatingProfit: null,
    netProfit: 100,
    previousNetProfit: null,
    totalAssets: 2000,
    previousTotalAssets: null,
    totalLiabilities: null,
    totalEquity: 1200,
    previousTotalEquity: null,
    currentAssets: null,
    currentLiabilities: null,
    operatingCashFlow: null,
    previousOperatingCashFlow: null,
    capitalExpenditure: null,
    sharesOutstanding: null,
    eps: null,
  },
  readResult: null,
  unitMetadata: buildFinancialsUnitMetadata(),
} satisfies FinancialsRuntimeData;

describe("valuation financials runtime readiness boundary", () => {
  it("does not let Valuation claim DB-backed when Financials local DB runtime exists but calculations are not wired", () => {
    const readiness = buildValuationFinancialsRuntimeReadiness({
      financialsRuntimeData: localDbFinancialsRuntime,
      valuationConsumesFinancialsRuntime: false,
      inputs: { eps: 100, equity: 1200, marketPrice: 50, sharesOutstanding: 100 },
    });

    expect(readiness.financialsRuntimeStatus).toBe("db_backed");
    expect(readiness.financialsReadPath).toBe("local_db");
    expect(readiness.valuationRuntimeStatus).toBe("mixed_source");
    expect(readiness.valuationConsumesFinancialsRuntime).toBe(false);
    expect(readiness.canClaimValuationDbBacked).toBe(false);
    expect(readiness.productionApproved).toBe(false);
    expect(readiness.warnings).toContain("Financials runtime available, but Valuation calculation is not yet wired.");
  });

  it("marks P/E not ready when EPS is missing without cheap or normal interpretation wording", () => {
    const readiness = buildValuationFinancialsRuntimeReadiness({
      inputs: { eps: null, equity: 1000, marketPrice: 20, sharesOutstanding: 100 },
    });
    const output = JSON.stringify(readiness).toLowerCase();

    expect(readiness.calculationReadiness.pe).toBe("insufficient_data");
    expect(output).not.toContain("cheap");
    expect(output).not.toContain("normal");
    expect(output).not.toContain("hap dan");
    expect(output).not.toContain("dang re");
  });

  it("marks P/E not applicable when EPS is zero or negative", () => {
    for (const eps of [0, -1]) {
      const readiness = buildValuationFinancialsRuntimeReadiness({
        inputs: { eps, equity: 1000, marketPrice: 20, sharesOutstanding: 100 },
      });

      expect(readiness.calculationReadiness.pe).toBe("not_applicable");
      expect(readiness.blockedReasons.join(" ")).toContain("EPS non-positive");
    }
  });

  it("marks P/B, BVPS, and ROE not ready when equity is missing and does not zero-fill it", () => {
    const readiness = buildValuationFinancialsRuntimeReadiness({
      inputs: { eps: 10, equity: null, bvps: null, marketPrice: 20, sharesOutstanding: 100 },
    });

    expect(readiness.calculationReadiness.pb).toBe("insufficient_data");
    expect(readiness.calculationReadiness.bvps).toBe("insufficient_data");
    expect(readiness.calculationReadiness.roe).toBe("insufficient_data");
    expect(readiness.inputSnapshot.equity).toBeNull();
    expect(readiness.inputSnapshot.equity).not.toBe(0);
  });

  it("marks P/B, BVPS, and ROE not applicable when equity is zero or negative", () => {
    for (const equity of [0, -1]) {
      const readiness = buildValuationFinancialsRuntimeReadiness({
        inputs: { eps: 10, equity, marketPrice: 20, sharesOutstanding: 100 },
      });

      expect(readiness.calculationReadiness.pb).toBe("not_applicable");
      expect(readiness.calculationReadiness.bvps).toBe("not_applicable");
      expect(readiness.calculationReadiness.roe).toBe("not_applicable");
      expect(readiness.blockedReasons.join(" ")).toContain("Equity or BVPS non-positive");
    }
  });

  it("marks market-based readiness not ready when market price is missing", () => {
    const readiness = buildValuationFinancialsRuntimeReadiness({
      inputs: { eps: 10, equity: 1000, marketPrice: null, sharesOutstanding: 100 },
    });

    expect(readiness.calculationReadiness.marketCap).toBe("insufficient_data");
    expect(readiness.inputSnapshot.marketPrice).toBeNull();
    expect(readiness.inputSnapshot.marketPrice).not.toBe(0);
  });

  it("marks market cap and share-based readiness not ready when shares outstanding is missing or non-positive", () => {
    for (const sharesOutstanding of [null, 0, -1]) {
      const readiness = buildValuationFinancialsRuntimeReadiness({
        inputs: { eps: 10, equity: 1000, marketPrice: 20, sharesOutstanding },
      });

      expect(readiness.calculationReadiness.marketCap).toBe("insufficient_data");
      expect(readiness.calculationReadiness.bvps).not.toBe("ready");
      expect(readiness.missingValuePolicy.divideByZeroAllowed).toBe(false);
    }
  });

  it("keeps production approval false for sample, local, and research-only data", () => {
    const sample = buildValuationFinancialsRuntimeReadiness({
      financialsRuntimeData: {
        ...localDbFinancialsRuntime,
        runtimeStatus: "sample_fallback",
        source: {
          ...localDbFinancialsRuntime.source,
          dataMode: "sample",
          fallbackUsed: true,
          readPath: "sample_static",
        },
      },
    });
    const local = buildValuationFinancialsRuntimeReadiness({ financialsRuntimeData: localDbFinancialsRuntime });
    const missing = buildValuationFinancialsRuntimeReadiness();

    expect(sample.productionApproved).toBe(false);
    expect(local.productionApproved).toBe(false);
    expect(missing.productionApproved).toBe(false);
    expect(sample.warnings).toContain("Financials fallback is active; Valuation readiness must treat it as fallback-derived.");
  });

  it("keeps missing/null policy explicit and never substitutes zero", () => {
    const readiness = buildValuationFinancialsRuntimeReadiness();

    expect(readiness.missingValuePolicy).toMatchObject({
      missingValue: "null",
      displayFallback: "unavailable",
      substituteZeroForMissing: false,
      divideByZeroAllowed: false,
    });
    expect(readiness.inputSnapshot).toMatchObject({
      eps: null,
      equity: null,
      bvps: null,
      marketPrice: null,
      sharesOutstanding: null,
    });
  });

  it("does not expose forbidden source approval, valuation, or action wording", () => {
    const output = JSON.stringify(
      buildValuationFinancialsRuntimeReadiness({
        financialsRuntimeData: localDbFinancialsRuntime,
        inputs: { eps: -1, equity: -1, marketPrice: null, sharesOutstanding: null },
      }),
    ).toLowerCase();
    const blockedPhrases = [
      "official",
      "realtime",
      "production-approved",
      "nen mua",
      "tin hieu mua",
      "dinh gia hap dan",
      "dang re",
      "dang mua",
      "cheap",
    ];

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
