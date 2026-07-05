/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import { buildControlledValuationIntegrationBoundary } from "@/features/valuation/lib/controlled-valuation-integration-boundary";
import type { FinancialStatementSeriesResult } from "../../../../lib/data-sources/financial-statement-read-service";
import { buildFinancialsUnitMetadata } from "../financials-unit-metadata-contract";
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
        totalDebt: null,
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
  it("uses DB-backed local rows by default when valid records are available", async () => {
    let readCalled = false;

    const result = await loadFinancialsRuntimeData(
      {},
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () => {
          readCalled = true;
          return seriesResult();
        },
      },
    );

    expect(readCalled).toBe(true);
    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.source.readPath).toBe("local_db");
    expect(result.source.fallbackUsed).toBe(false);
    expect(result.source.productionApproved).toBe(false);
    expect(result.statementSnapshot?.revenue).toBe(1000);
  });

  it("uses sample fallback without reading DB when DB reads are explicitly disabled", async () => {
    let readCalled = false;

    const result = await loadFinancialsRuntimeData(
      { preferDb: false },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () => {
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
    expect(result.unitMetadata.revenue.status).toBe("missing");
    expect(result.unitMetadata.revenue.unit).toBe("unknown");
  });

  it("uses sample fallback without reading DB when the DB source env is disabled", async () => {
    let readCalled = false;

    const result = await loadFinancialsRuntimeData(
      { env: { ATELIER_FINANCIALS_DB_SOURCE: "disabled" } },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () => {
          readCalled = true;
          return seriesResult();
        },
      },
    );

    expect(readCalled).toBe(false);
    expect(result.runtimeStatus).toBe("sample_fallback");
    expect(result.source.readPath).toBe("sample_static");
    expect(result.dataQuality.warnings.join(" ")).toContain("no usable local DB financial statements were available");
  });

  it("reads DB-backed imported-local records when available", async () => {
    const importedSourceLabel = "imported_local_financial_statement";
    const importedRecord = seriesResult().records[0];
    const result = await loadFinancialsRuntimeData(
      { ticker: "FPT", sourceLabel: importedSourceLabel, dataMode: "manual" },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () =>
          seriesResult({
            sourceLabel: importedSourceLabel,
            dataMode: "manual",
            records: [
              {
                ...importedRecord,
                source: {
                  ...importedRecord.source,
                  sourceLabel: importedSourceLabel,
                  dataMode: "manual",
                },
              },
            ],
          }),
      },
    );

    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.source).toMatchObject({
      sourceLabel: importedSourceLabel,
      dataMode: "manual",
      productionApproved: false,
      fallbackUsed: false,
      readPath: "local_db",
    });
    expect(result.statementSnapshot?.revenue).toBe(1000);
    expect(result.unitMetadata.revenue).toMatchObject({
      productionApproved: false,
      status: "unknown_unit",
      unit: "unknown",
      warnings: ["revenue_financials_unit_metadata_missing"],
    });
    expect(result.unitMetadata.netIncome.status).toBe("unknown_unit");
    expect(result.unitMetadata.equity.status).toBe("unknown_unit");
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
      { readLatestMarketPrice: async () => null as any, readSeries: async () => mwg },
    );

    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.dataQuality.status).toBe("partial");
    expect(result.dataQuality.missingFields).toEqual(["revenue", "operatingCashFlow"]);
    expect(result.statementSnapshot?.revenue).toBeNull();
    expect(result.statementSnapshot?.operatingCashFlow).toBeNull();
    expect(result.statementSnapshot?.revenue).not.toBe(0);
    expect(result.unitMetadata.revenue.status).toBe("missing");
    expect(result.unitMetadata.operatingCashFlow.status).toBe("missing");
  });

  it("falls back safely when explicit DB mode returns empty and fallback is allowed", async () => {
    const result = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: true, sourceLabel, dataMode: "research_only" },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () =>
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
        readLatestMarketPrice: async () => null as any, readSeries: async () =>
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
    expect(result.unitMetadata.revenue.status).toBe("missing");
  });

  it("falls back to VNStock financials candidate if primary source yields no usable data", async () => {
    let readCount = 0;
    const result = await loadFinancialsRuntimeData(
      { ticker: "HPG", preferDb: true, dataMode: "research_only" },
      {
        readLatestMarketPrice: async () => null as any,
        readSeries: async ({ sourceLabel }) => {
          readCount++;
          if (
            sourceLabel === "phase109_controlled_local_financials" ||
            sourceLabel === "VNStock financial statements long safe CSV" ||
            sourceLabel === "External financials review workspace" ||
            sourceLabel === "annual_report_2025_pdf_reviewed_preview"
          ) {
            return seriesResult({
              ok: false,
              status: "unavailable",
              records: [],
              warnings: ["No local financial statement records were found."],
            });
          }
          if (sourceLabel === "vnstock_financials_candidate") {
            return seriesResult({
              ok: true,
              status: "partial",
              sourceLabel: "vnstock_financials_candidate",
              records: [
                {
                  ...seriesResult().records[0],
                  ticker: "HPG",
                  source: {
                    ...seriesResult().records[0].source,
                    ticker: "HPG",
                    sourceLabel: "vnstock_financials_candidate",
                  },
                  values: {
                    ...seriesResult().records[0].values,
                    eps: 1973,
                    sharesOutstanding: 7675465855,
                    revenue: null,
                    netIncome: null,
                    totalAssets: null,
                    totalEquity: null,
                    operatingCashFlow: null,
                  },
                  dataQuality: {
                    status: "partial",
                    missingFields: ["revenue", "netIncome", "totalAssets", "totalEquity", "operatingCashFlow"],
                    availableFields: ["eps", "sharesOutstanding"],
                    invalidFields: [],
                    warnings: [],
                  },
                },
              ],
            });
          }
          throw new Error(`Unexpected sourceLabel: ${sourceLabel}`);
        },
      },
    );

    expect(readCount).toBe(5);
    expect(result.runtimeStatus).toBe("db_backed");
    expect(result.source.sourceLabel).toBe("vnstock_financials_candidate");
    expect(result.statementSnapshot?.eps).toBe(1973);
    expect(result.statementSnapshot?.sharesOutstanding).toBe(7675465855);
    expect(result.statementSnapshot?.revenue).toBeNull();
    expect(result.dataQuality.status).toBe("partial");
  });

  it("handles read errors without uncaught throw", async () => {
    const fallback = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: true, sourceLabel, dataMode: "research_only" },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () => {
          throw new Error("read failed");
        },
      },
    );
    const unavailable = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, allowFallback: false, sourceLabel, dataMode: "research_only" },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () => {
          throw new Error("read failed");
        },
      },
    );

    expect(fallback.runtimeStatus).toBe("sample_fallback");
    expect(unavailable.runtimeStatus).toBe("read_error");
    expect(unavailable.dataQuality.errors).toContain("read failed");
  });

  it("passes persisted read-back sidecar units through runtime into controlled Valuation", async () => {
    const row = seriesResult().records[0];
    const runtime = await loadFinancialsRuntimeData(
      { ticker: "FPT", preferDb: true, sourceLabel, dataMode: "research_only" },
      {
        readLatestMarketPrice: async () => null as any, readSeries: async () =>
          seriesResult({
            records: [
              {
                ...row,
                values: {
                  ...row.values,
                  eps: 1200,
                  sharesOutstanding: 10,
                },
                unitMetadata: buildFinancialsUnitMetadata({
                  dataMode: "research_only",
                  explicitUnits: {
                    equity: "million_vnd",
                    eps: "vnd_per_share",
                    revenue: "million_vnd",
                    sharesOutstanding: "million_shares",
                  },
                  snapshot: {
                    eps: 1200,
                    revenue: 1000,
                    sharesOutstanding: 10,
                    totalEquity: 2000,
                  },
                  sourceLabel,
                }),
              },
            ],
          }),
      },
    );
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        dataMode: runtime.source.dataMode,
        equity: runtime.statementSnapshot?.totalEquity,
        eps: runtime.statementSnapshot?.eps,
        asOf: runtime.source.asOf,
        fallbackUsed: runtime.source.fallbackUsed,
        fiscalYear: runtime.source.fiscalYear,
        period: runtime.statementSnapshot?.period,
        periodType: runtime.source.periodType,
        productionApproved: runtime.source.productionApproved,
        readPath: runtime.source.readPath,
        revenue: runtime.statementSnapshot?.revenue,
        runtimeStatus: runtime.runtimeStatus,
        sharesOutstanding: runtime.statementSnapshot?.sharesOutstanding,
        sourceLabel: runtime.source.sourceLabel,
        units: {
          equity: runtime.unitMetadata.equity.unit,
          eps: runtime.unitMetadata.eps.unit,
          revenue: runtime.unitMetadata.revenue.unit,
          sharesOutstanding: runtime.unitMetadata.sharesOutstanding.unit,
        },
      },
      persistedValuationInputs: {
        marketPrice: 50_000,
        units: { marketPrice: "vnd_per_share" },
      },
    });

    expect(runtime.unitMetadata.revenue.status).toBe("explicit");
    expect(valuation.selectedInputs.revenue.normalizationStatus).toBe("ready");
    expect(valuation.selectedInputs.marketPrice.source).toBe("persisted_bridge");
    expect(valuation.calculation.metrics.pe.status).toBe("ready");
    expect(valuation.calculation.metrics.bvps.status).toBe("ready");
    expect(valuation.sourceBoundary.productionApproved).toBe(false);
    expect(valuation.sourceBoundary.canClaimValuationDbBacked).toBe(false);
  });

  it("does not expose investment action wording in runtime metadata", async () => {
    const result = await loadFinancialsRuntimeData({ preferDb: true }, { readLatestMarketPrice: async () => null as any, readSeries: async () => seriesResult() });
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
