import { describe, expect, it } from "vitest";

import type { FinancialStatementSeriesResult } from "../../../../lib/data-sources/financial-statement-read-service";
import { loadFinancialsRuntimeData } from "../load-financials-runtime-data";

const sourceLabel = "phase45_synthetic_financial_statement_local_write";

const seriesResult = (
  patch: Partial<FinancialStatementSeriesResult> = {},
): FinancialStatementSeriesResult => ({
  ok: true,
  status: "available",
  ticker: "FPT",
  sourceLabel,
  dataMode: "research_only",
  productionApproved: false,
  warnings: ["Financial statement read path is local academic/research only; production approval remains false."],
  errors: [],
  records: [
    {
      id: "statement-1",
      ticker: "FPT",
      fiscalYear: 2024,
      fiscalQuarter: null,
      period: "2024",
      periodType: "year",
      statementDate: null,
      source: {
        sourceLabel,
        dataMode: "research_only",
        productionApproved: false,
        importedAt: "2026-06-20",
        asOf: "2024-12-31",
        fiscalPeriod: "2024",
        ticker: "FPT",
        statementType: "financial_statement",
        currency: "VND",
        periodType: "year",
        limitations: ["Local/research-only financial statement data is not production-approved."],
        warnings: ["Financial statement read path is local academic/research only; production approval remains false."],
      },
      values: {
        revenue: 1000,
        grossProfit: null,
        operatingIncome: null,
        netIncome: 100,
        totalAssets: 5000,
        totalLiabilities: null,
        totalEquity: 2000,
        cashAndEquivalents: null,
        currentAssets: null,
        currentLiabilities: null,
        operatingCashFlow: 300,
        capitalExpenditure: null,
        sharesOutstanding: null,
        eps: null,
      },
      dataQuality: {
        status: "available",
        missingFields: [],
        availableFields: ["revenue", "netIncome", "totalAssets", "totalEquity", "operatingCashFlow"],
        invalidFields: [],
        warnings: [],
      },
    },
  ],
  ...patch,
});

describe("loadFinancialsRuntimeData", () => {
  it("uses sample fallback by default without reading DB", async () => {
    let readCalled = false;

    const result = await loadFinancialsRuntimeData(
      {},
      {
        readSeries: async () => {
          readCalled = true;
          return seriesResult();
        },
      },
    );

    expect(readCalled).toBe(false);
    expect(result.runtimeStatus).toBe("sample_fallback");
    expect(result.source.readPath).toBe("sample_static");
    expect(result.source.fallbackUsed).toBe(true);
    expect(result.source.productionApproved).toBe(false);
  });

  it("reads DB-backed records when explicitly requested", async () => {
    const result = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, sourceLabel, dataMode: "research_only" },
      { readSeries: async () => seriesResult() },
    );

    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.source).toMatchObject({
      sourceLabel,
      dataMode: "research_only",
      productionApproved: false,
      fallbackUsed: false,
      readPath: "local_db",
    });
    expect(result.statementSnapshot?.revenue).toBe(1000);
  });

  it("keeps missing DB values partial and null instead of substituting zero", async () => {
    const mwg = seriesResult({
      status: "partial",
      ticker: "MWG",
      records: [
        {
          ...seriesResult().records[0],
          ticker: "MWG",
          values: {
            ...seriesResult().records[0].values,
            revenue: null,
            operatingCashFlow: null,
          },
          dataQuality: {
            status: "partial",
            missingFields: ["revenue", "operatingCashFlow"],
            availableFields: ["netIncome", "totalAssets", "totalEquity"],
            invalidFields: [],
            warnings: ["operatingCashFlow is missing; cash-quality checks remain limited."],
          },
        },
      ],
    });

    const result = await loadFinancialsRuntimeData(
      { ticker: "MWG", preferDb: true, sourceLabel, dataMode: "research_only" },
      { readSeries: async () => mwg },
    );

    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.dataQuality.status).toBe("partial");
    expect(result.dataQuality.missingFields).toEqual(["revenue", "operatingCashFlow"]);
    expect(result.statementSnapshot?.revenue).toBeNull();
    expect(result.statementSnapshot?.operatingCashFlow).toBeNull();
    expect(result.statementSnapshot?.revenue).not.toBe(0);
  });

  it("falls back safely when explicit DB mode returns empty and fallback is allowed", async () => {
    const result = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: true, sourceLabel, dataMode: "research_only" },
      {
        readSeries: async () =>
          seriesResult({
            ok: false,
            status: "unavailable",
            records: [],
            warnings: ["No local financial statement records were found."],
          }),
      },
    );

    expect(result.runtimeStatus).toBe("sample_fallback");
    expect(result.source.fallbackUsed).toBe(true);
    expect(result.source.readPath).toBe("sample_static");
    expect(result.dataQuality.warnings.join(" ")).toContain("no usable adapted statements");
  });

  it("returns unavailable when explicit DB mode returns empty and fallback is disabled", async () => {
    const result = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: false, sourceLabel, dataMode: "research_only" },
      {
        readSeries: async () =>
          seriesResult({
            ok: false,
            status: "unavailable",
            records: [],
            warnings: ["No local financial statement records were found."],
          }),
      },
    );

    expect(result.runtimeStatus).toBe("unavailable");
    expect(result.source.fallbackUsed).toBe(false);
    expect(result.statementSnapshot).toBeNull();
  });

  it("handles read errors without uncaught throw", async () => {
    const fallback = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: true, sourceLabel, dataMode: "research_only" },
      {
        readSeries: async () => {
          throw new Error("read failed");
        },
      },
    );
    const unavailable = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: false, sourceLabel, dataMode: "research_only" },
      {
        readSeries: async () => {
          throw new Error("read failed");
        },
      },
    );

    expect(fallback.runtimeStatus).toBe("sample_fallback");
    expect(unavailable.runtimeStatus).toBe("read_error");
    expect(unavailable.dataQuality.errors).toContain("read failed");
  });

  it("does not expose investment action wording in runtime metadata", async () => {
    const result = await loadFinancialsRuntimeData({ preferDb: true }, { readSeries: async () => seriesResult() });
    const output = JSON.stringify(result).toLowerCase();
    const blockedPhrases = [
      ["nen", "mua"],
      ["nen", "ban"],
      ["tin", "hieu", "mua"],
      ["tin", "hieu", "ban"],
      ["diem", "mua"],
    ].map((parts) => parts.join(" "));

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
