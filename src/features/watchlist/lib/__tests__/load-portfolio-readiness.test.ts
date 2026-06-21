import { describe, expect, it, vi } from "vitest";

import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { PVTObservationData } from "@/features/technical/types";
import type { LoadTechnicalDeskDataResult } from "@/features/technical/lib/load-technical-desk-data";
import { getIssuerMetadata } from "@/lib/data-sources/issuer-metadata-service";
import {
  PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
  loadPortfolioReadiness,
} from "../load-portfolio-readiness";

const technicalRuntime = (ticker: string): LoadTechnicalDeskDataResult => ({
  data: {
    ticker,
    companyName: ticker,
    industry: "controlled local metadata",
    pvtChartSeries: [],
    pvtDerivedMetrics: null,
  } as unknown as PVTObservationData,
  dataQuality: {
    asOf: "2025-06-30",
    isDemoData: false,
    isStale: false,
    missingFields: [],
    source: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
  },
  errors: [],
  fallbackUsed: false,
  issuerMetadata: {
    dataMode: "research_only",
    displayName: ticker,
    industry: "controlled local metadata",
    issuerName: ticker,
    limitations: [],
    productionApproved: false,
    sector: null,
    sharesOutstanding: null,
    sharesStatus: "unavailable",
    sharesUnit: null,
    sourceLabel: "controlled_local_company_metadata",
    ticker,
    verificationStatus: "controlled_local_research",
    warnings: [],
  },
  marketUnitMetadata: {} as LoadTechnicalDeskDataResult["marketUnitMetadata"],
  ok: true,
  marketDataSource: {
    asOf: "2025-06-30",
    dataMode: "research_only",
    dateSpan: { from: "2025-06-02", to: "2025-06-30" },
    fallbackUsed: false,
    productionApproved: false,
    provider: "vnstock",
    sourceLabel: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
    sourceType: "local_db_manual_import",
    ticker,
  },
  source: {
    dataMode: "research_only",
    productionApproved: false,
    provider: "vnstock",
    sourceLabel: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
    sourceType: "local_db_manual_import",
  },
  warnings: [],
});

const financialsRuntime = (
  ticker: string,
  patch: Partial<NonNullable<FinancialsRuntimeData["statementSnapshot"]>> = {},
): FinancialsRuntimeData => {
  const snapshot = {
    capitalExpenditure: null,
    collectedAt: null,
    currentAssets: 30_000,
    currentLiabilities: 17_000,
    eps: null,
    grossProfit: 24_800,
    netProfit: 8_700,
    operatingCashFlow: 9_800,
    period: "2024",
    periodType: "annual" as const,
    previousNetProfit: null,
    previousOperatingCashFlow: null,
    previousRevenue: null,
    previousTotalAssets: null,
    previousTotalEquity: null,
    revenue: 62_000,
    sharesOutstanding: null,
    sourceName: "phase109_controlled_local_financials",
    ticker,
    totalAssets: 75_000,
    totalDebt: null,
    totalEquity: 36_000,
    totalLiabilities: 39_000,
    ...patch,
  };

  return {
    dataQuality: {
      errors: [],
      missingFields: ["eps", "sharesOutstanding"],
      status: "partial",
      warnings: [],
    },
    readResult: null,
    runtimeStatus: "db_backed",
    source: {
      asOf: "2026-06-22",
      dataMode: "research_only",
      fallbackUsed: false,
      fiscalYear: 2024,
      periodType: "annual",
      productionApproved: false,
      readPath: "local_db",
      sourceLabel: "phase109_controlled_local_financials",
      ticker,
    },
    statementSnapshot: snapshot,
    unitMetadata: buildFinancialsUnitMetadata({
      dataMode: "research_only",
      explicitUnits: {
        currentAssets: "billion_vnd",
        currentLiabilities: "billion_vnd",
        equity: "billion_vnd",
        netIncome: "billion_vnd",
        operatingCashFlow: "billion_vnd",
        revenue: "billion_vnd",
        totalAssets: "billion_vnd",
      },
      snapshot,
      sourceLabel: "phase109_controlled_local_financials",
    }),
  };
};

describe("loadPortfolioReadiness", () => {
  it("returns FPT, MWG, and VNM with metadata, Technical/PVT, and Financials readiness", async () => {
    const loadTechnical = vi.fn(async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"));
    const loadFinancials = vi.fn(async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"));

    const result = await loadPortfolioReadiness({
      loadFinancials,
      loadTechnical,
      readIssuerMetadata: getIssuerMetadata,
    });

    expect(result.productionApproved).toBe(false);
    expect(result.tickers.map((item) => item.ticker)).toEqual(["FPT", "MWG", "VNM"]);

    for (const item of result.tickers) {
      expect(item.companyMetadata).toMatchObject({
        productionApproved: false,
        sourceLabel: "controlled_local_company_metadata",
        status: "available",
      });
      expect(item.technical).toMatchObject({
        fallbackUsed: false,
        provider: "vnstock",
        productionApproved: false,
        sourceLabel: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
        status: "available",
      });
      expect(item.financials).toMatchObject({
        fallbackUsed: false,
        productionApproved: false,
        readPath: "local_db",
        runtimeStatus: "db_backed",
        sourceLabel: "phase109_controlled_local_financials",
      });
      expect(item.sharesOutstanding).toEqual({ status: "unavailable", unit: null, value: null });
      expect(item.sharesOutstanding.value).not.toBe(0);
      expect(item.eps).toEqual({ status: "unavailable", value: null });
      expect(item.eps.value).not.toBe(0);
    }
  });

  it("blocks valuation metrics when EPS and sharesOutstanding are unavailable", async () => {
    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readIssuerMetadata: getIssuerMetadata,
    });
    const fpt = result.tickers.find((item) => item.ticker === "FPT");

    expect(fpt?.valuation.status).toBe("insufficient_data");
    expect(fpt?.valuation.pe).toBe("insufficient_data");
    expect(fpt?.valuation.marketCap).toBe("insufficient_data");
    expect(fpt?.valuation.bvps).toBe("insufficient_data");
    expect(fpt?.valuation.pb).toBe("insufficient_data");
    expect(fpt?.valuation.ps).toBe("insufficient_data");
    expect(fpt?.valuation.canClaimValuationDbBacked).toBe(false);
    expect(fpt?.blockedMetrics).toEqual(
      expect.arrayContaining([
        "pe:eps_unavailable",
        "marketCap:sharesOutstanding_unavailable",
        "bvps:sharesOutstanding_unavailable",
        "pb:sharesOutstanding_unavailable",
        "ps:marketCap_unavailable",
      ]),
    );
  });

  it("keeps Risk partial/insufficient when debt, CFO, or equity inputs are missing", async () => {
    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) =>
        financialsRuntime(input.ticker ?? "UNKNOWN", {
          operatingCashFlow: null,
          totalEquity: null,
        }),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readIssuerMetadata: getIssuerMetadata,
    });
    const mwg = result.tickers.find((item) => item.ticker === "MWG");

    expect(mwg?.risk.status).toBe("partial");
    expect(mwg?.risk.cashFlowQuality).toBe("insufficient_data");
    expect(mwg?.risk.leverageRisk).toBe("insufficient_data");
    expect(mwg?.risk.canClaimRiskDbBacked).toBe(false);
    expect(mwg?.missingInputs).toEqual(expect.arrayContaining(["operatingCashFlow", "equity", "totalDebt"]));
  });

  it("passes bounded VNStock technical read parameters for every ticker", async () => {
    const loadTechnical = vi.fn(async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"));

    await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical,
      readIssuerMetadata: getIssuerMetadata,
    });

    expect(loadTechnical).toHaveBeenCalledTimes(3);
    expect(loadTechnical).toHaveBeenCalledWith(
      {
        from: "2025-06-02",
        preferDb: true,
        sourceLabel: PORTFOLIO_READINESS_TECHNICAL_SOURCE_LABEL,
        ticker: "FPT",
        to: "2025-06-30",
      },
      undefined,
    );
  });
});
