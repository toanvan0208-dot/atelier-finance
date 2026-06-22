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
    currentPrice: 100_000,
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
  marketUnitMetadata: {
    marketPrice: {
      field: "marketPrice",
      owner: "market_pvt",
      productionApproved: false,
      source: "persisted_market_bridge",
      status: "ready",
      unit: "vnd_per_share",
      value: 100_000,
      warnings: [],
    },
  } as unknown as LoadTechnicalDeskDataResult["marketUnitMetadata"],
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

const noReviewedCandidates = async () => ({});

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
        totalDebt: "billion_vnd",
      },
      snapshot: { ...snapshot, totalDebt: snapshot.totalLiabilities },
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
      readTraceableInputCandidates: noReviewedCandidates,
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
      expect(item.financials.coverage.totalLiabilities).toEqual({
        status: "available",
        unit: "billion_vnd",
        value: 39_000,
      });
      expect(item.financials.coverage.totalDebt).toEqual({ status: "unavailable", unit: null, value: null });
      expect(item.financials.coverage.operatingCashFlow.status).toBe("available");
      expect(item.sharesOutstanding).toEqual({ status: "unavailable", unit: null, value: null });
      expect(item.sharesOutstanding.value).not.toBe(0);
      expect(item.eps).toEqual({ status: "unavailable", value: null });
      expect(item.eps.value).not.toBe(0);
      expect(item.sourceDecisions.totalDebt).toMatchObject({
        activationStatus: "deferred",
        sourceLabel: null,
        status: "unavailable",
        value: null,
      });
      expect(item.sourceDecisions.eps.status).toBe("unavailable");
      expect(item.sourceDecisions.sharesOutstanding.status).toBe("unavailable");
    }
  });

  it("blocks valuation metrics when EPS and sharesOutstanding are unavailable", async () => {
    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readTraceableInputCandidates: noReviewedCandidates,
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
      readTraceableInputCandidates: noReviewedCandidates,
      readIssuerMetadata: getIssuerMetadata,
    });
    const mwg = result.tickers.find((item) => item.ticker === "MWG");

    expect(mwg?.risk.status).toBe("partial");
    expect(mwg?.risk.cashFlowQuality).toBe("insufficient_data");
    expect(mwg?.risk.leverageRisk).toBe("insufficient_data");
    expect(mwg?.risk.canClaimRiskDbBacked).toBe(false);
    expect(mwg?.missingInputs).toEqual(expect.arrayContaining(["operatingCashFlow", "equity", "totalDebt"]));
  });

  it("shows available cash-flow, liquidity, and liabilities coverage while debt leverage remains blocked", async () => {
    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readTraceableInputCandidates: noReviewedCandidates,
      readIssuerMetadata: getIssuerMetadata,
    });

    for (const item of result.tickers) {
      expect(item.risk.cashFlowQuality).toBe("ready");
      expect(item.risk.liquidityRisk).toBe("ready");
      expect(item.risk.leverageRisk).toBe("insufficient_data");
      expect(item.missingInputs).toContain("totalDebt");
      expect(item.missingInputs).not.toContain("totalLiabilities");
    }
  });

  it("fails financial coverage closed when required unit metadata is invalid", async () => {
    const runtime = financialsRuntime("FPT");
    runtime.unitMetadata.operatingCashFlow = {
      ...runtime.unitMetadata.operatingCashFlow,
      status: "invalid_unit",
      unit: "shares",
    };
    const result = await loadPortfolioReadiness({
      loadFinancials: async () => runtime,
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readTraceableInputCandidates: noReviewedCandidates,
      readIssuerMetadata: getIssuerMetadata,
    });

    expect(result.tickers[0].financials.coverage.operatingCashFlow).toEqual({
      status: "invalid_unit",
      unit: null,
      value: 9_800,
    });
  });

  it("improves only the matching ticker and metric for a fully traceable candidate", async () => {
    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readTraceableInputCandidates: noReviewedCandidates,
      readIssuerMetadata: getIssuerMetadata,
      traceableInputCandidates: {
        FPT: {
          eps: {
            asOf: "2026-06-22",
            dataMode: "research_only",
            field: "eps",
            period: "2024",
            productionApproved: false,
            sourceLabel: "traceable_research_financial_input",
            ticker: "FPT",
            unit: "vnd_per_share",
            value: 5_000,
          },
        },
      },
    });
    const fpt = result.tickers.find((item) => item.ticker === "FPT");
    const mwg = result.tickers.find((item) => item.ticker === "MWG");

    expect(fpt?.sourceDecisions.eps.status).toBe("available");
    expect(fpt?.valuation.pe).toBe("ready");
    expect(fpt?.valuation.marketCap).toBe("insufficient_data");
    expect(fpt?.valuation.canClaimValuationDbBacked).toBe(false);
    expect(mwg?.sourceDecisions.eps.status).toBe("unavailable");
    expect(mwg?.valuation.pe).toBe("insufficient_data");
  });

  it("does not leak a debt value into Risk when its unit decision fails closed", async () => {
    const runtime = financialsRuntime("FPT", { totalDebt: 500 });
    runtime.unitMetadata.totalDebt = {
      ...runtime.unitMetadata.totalDebt,
      status: "invalid_unit",
      unit: "shares",
    };
    const result = await loadPortfolioReadiness({
      loadFinancials: async () => runtime,
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readTraceableInputCandidates: noReviewedCandidates,
      readIssuerMetadata: getIssuerMetadata,
    });

    expect(result.tickers[0].sourceDecisions.totalDebt.status).toBe("insufficient_source");
    expect(result.tickers[0].risk.leverageRisk).toBe("insufficient_data");
    expect(result.tickers[0].missingInputs).toContain("totalDebt");
  });

  it("improves leverage only for tickers with valid traceable debt candidates", async () => {
    const debtCandidate = (ticker: "FPT" | "MWG", value: number) => ({
      asOf: "2026-06-22",
      dataMode: "research_only",
      field: "totalDebt" as const,
      period: "2024",
      productionApproved: false as const,
      sourceLabel: "traceable_research_debt_input",
      ticker,
      unit: "billion_vnd" as const,
      value,
    });

    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readTraceableInputCandidates: noReviewedCandidates,
      readIssuerMetadata: getIssuerMetadata,
      traceableInputCandidates: {
        FPT: { totalDebt: debtCandidate("FPT", 500) },
        MWG: { totalDebt: debtCandidate("MWG", 700) },
      },
    });

    const fpt = result.tickers.find((item) => item.ticker === "FPT");
    const mwg = result.tickers.find((item) => item.ticker === "MWG");
    const vnm = result.tickers.find((item) => item.ticker === "VNM");

    expect(fpt?.sourceDecisions.totalDebt.status).toBe("available");
    expect(fpt?.sourceDecisions.totalDebt.activationStatus).toBe("activated");
    expect(fpt?.risk.leverageRisk).toBe("ready");
    expect(mwg?.sourceDecisions.totalDebt.status).toBe("available");
    expect(mwg?.risk.leverageRisk).toBe("ready");
    expect(vnm?.sourceDecisions.totalDebt.status).toBe("unavailable");
    expect(vnm?.risk.leverageRisk).toBe("insufficient_data");
    expect(fpt?.valuation.pe).toBe("insufficient_data");
    expect(fpt?.valuation.marketCap).toBe("insufficient_data");
    expect(fpt?.valuation.bvps).toBe("insufficient_data");
    expect(fpt?.valuation.pb).toBe("insufficient_data");
    expect(fpt?.valuation.ps).toBe("insufficient_data");
    expect(fpt?.valuation.canClaimValuationDbBacked).toBe(false);
  });

  it("activates reviewed debt, EPS, and shares candidates for guarded valuation and risk readiness", async () => {
    const reviewedCandidate = (
      ticker: "FPT" | "MWG" | "VNM",
      field: "totalDebt" | "eps" | "sharesOutstanding",
      value: number,
    ) => ({
      asOf: "2024-12-31",
      dataMode: "research_only",
      field,
      period: "2024",
      productionApproved: false as const,
      sourceLabel: "manual_reviewed_financial_statement_2024",
      ticker,
      unit:
        field === "eps"
          ? ("vnd_per_share" as const)
          : field === "sharesOutstanding"
            ? ("shares" as const)
            : ("billion_vnd" as const),
      value,
    });
    const result = await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical: async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"),
      readIssuerMetadata: getIssuerMetadata,
      traceableInputCandidates: {
        FPT: {
          eps: reviewedCandidate("FPT", "eps", 4_944),
          sharesOutstanding: reviewedCandidate("FPT", "sharesOutstanding", 1_471_069_183),
          totalDebt: reviewedCandidate("FPT", "totalDebt", 14_947.354),
        },
        MWG: {
          eps: reviewedCandidate("MWG", "eps", 2_546),
          sharesOutstanding: reviewedCandidate("MWG", "sharesOutstanding", 1_454_644_497),
          totalDebt: reviewedCandidate("MWG", "totalDebt", 27_300.247),
        },
        VNM: {
          eps: reviewedCandidate("VNM", "eps", 4_130),
          sharesOutstanding: reviewedCandidate("VNM", "sharesOutstanding", 2_089_955_445),
          totalDebt: reviewedCandidate("VNM", "totalDebt", 10_059.066),
        },
      },
    });

    for (const item of result.tickers) {
      expect(item.sourceDecisions.totalDebt.status).toBe("available");
      expect(item.sourceDecisions.eps.status).toBe("available");
      expect(item.sourceDecisions.sharesOutstanding.status).toBe("available");
      expect(item.risk.leverageRisk).toBe("ready");
      expect(item.valuation.pe).toBe("ready");
      expect(item.valuation.marketCap).toBe("ready");
      expect(item.valuation.bvps).toBe("ready");
      expect(item.valuation.pb).toBe("ready");
      expect(item.valuation.ps).toBe("partial");
      expect(item.valuation.canClaimValuationDbBacked).toBe(false);
      expect(item.blockedMetrics).toEqual([]);
    }
  });

  it("passes bounded VNStock technical read parameters for every ticker", async () => {
    const loadTechnical = vi.fn(async (input = {}) => technicalRuntime(input.ticker ?? "UNKNOWN"));

    await loadPortfolioReadiness({
      loadFinancials: async (input = {}) => financialsRuntime(input.ticker ?? "UNKNOWN"),
      loadTechnical,
      readTraceableInputCandidates: noReviewedCandidates,
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
