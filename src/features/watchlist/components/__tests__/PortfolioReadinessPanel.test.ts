import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { PortfolioReadinessResult } from "../../lib/load-portfolio-readiness";
import { PortfolioReadinessPanel } from "../PortfolioReadinessPanel";

const portfolioReadiness: PortfolioReadinessResult = {
  productionApproved: false,
  sourceLabel: "portfolio_readiness_backbone",
  tickers: ["FPT", "MWG", "VNM"].map((ticker) => ({
    blockedMetrics: [
      "pe:eps_unavailable",
      "marketCap:sharesOutstanding_unavailable",
      "bvps:sharesOutstanding_unavailable",
      "pb:sharesOutstanding_unavailable",
      "ps:marketCap_unavailable",
    ],
    companyMetadata: {
      dataMode: "research_only",
      productionApproved: false,
      sourceLabel: "controlled_local_company_metadata",
      status: "available",
      verificationStatus: "controlled_local_research",
    },
    companyName: `${ticker} company`,
    dataWarnings: [],
    eps: { status: "unavailable", value: null },
    exchange: "HOSE",
    financials: {
      coverage: {
        eps: { status: "unavailable", unit: null, value: null },
        netIncome: { status: "available", unit: "billion_vnd", value: 8_700 },
        operatingCashFlow: { status: "available", unit: "billion_vnd", value: 9_800 },
        revenue: { status: "available", unit: "billion_vnd", value: 62_000 },
        sharesOutstanding: { status: "unavailable", unit: null, value: null },
        totalAssets: { status: "available", unit: "billion_vnd", value: 75_000 },
        totalDebt: { status: "unavailable", unit: null, value: null },
        totalEquity: { status: "available", unit: "billion_vnd", value: 36_000 },
        totalLiabilities: { status: "available", unit: "billion_vnd", value: 39_000 },
      },
      dataMode: "research_only",
      fallbackUsed: false,
      productionApproved: false,
      readPath: "local_db",
      runtimeStatus: "db_backed",
      sourceLabel: "phase109_controlled_local_financials",
      status: "partial",
    },
    industry: "controlled industry",
    missingInputs: ["sharesOutstanding", "eps", "totalDebt"],
    risk: {
      canClaimRiskDbBacked: false,
      cashFlowQuality: "ready",
      leverageRisk: "insufficient_data",
      liquidityRisk: "ready",
      sourceMode: "mixed_source",
      status: "partial",
    },
    sharesOutstanding: { status: "unavailable", unit: null, value: null },
    sourceDecisions: {
      eps: {
        activationStatus: "deferred",
        asOf: null,
        dataMode: null,
        field: "eps",
        period: null,
        productionApproved: false,
        reason: "No traceable eps value with explicit unit and aligned period is available.",
        reasonCode: "traceable_eps_unavailable",
        sourceLabel: null,
        status: "unavailable",
        ticker,
        unit: null,
        value: null,
      },
      sharesOutstanding: {
        activationStatus: "deferred",
        asOf: null,
        dataMode: null,
        field: "sharesOutstanding",
        period: null,
        productionApproved: false,
        reason: "No traceable sharesOutstanding value with explicit unit and aligned period is available.",
        reasonCode: "traceable_sharesOutstanding_unavailable",
        sourceLabel: null,
        status: "unavailable",
        ticker,
        unit: null,
        value: null,
      },
      totalDebt: {
        activationStatus: "deferred",
        asOf: null,
        dataMode: null,
        field: "totalDebt",
        period: null,
        pilotChecks: [
          {
            path: "financials_runtime",
            reason: `${ticker} Phase 109 runtime has no totalDebt value; totalLiabilities remains separate.`,
            status: "checked_no_value",
          },
          {
            path: "official_disclosure_adapter",
            reason: "The adapter boundary supports totalDebt, but no reviewed runtime source record is present.",
            status: "boundary_only",
          },
          {
            path: "manual_import_boundary",
            reason: "The import boundary supports totalDebt, but no reviewed traceable input artifact is present.",
            status: "boundary_only",
          },
        ],
        productionApproved: false,
        reason: "No traceable total-debt value is available; total liabilities are not treated as debt.",
        reasonCode: "traceable_total_debt_unavailable",
        sourceLabel: null,
        status: "unavailable",
        ticker,
        unit: null,
        value: null,
      },
    },
    technical: {
      dataMode: "research_only",
      fallbackUsed: false,
      productionApproved: false,
      provider: "vnstock",
      readPath: "local_db_manual_import",
      sourceLabel: "vnstock_research_candidate",
      status: "available",
    },
    ticker: ticker as "FPT" | "MWG" | "VNM",
    valuation: {
      bvps: "insufficient_data",
      canClaimValuationDbBacked: false,
      marketCap: "insufficient_data",
      pb: "insufficient_data",
      pe: "insufficient_data",
      ps: "insufficient_data",
      status: "insufficient_data",
    },
  })),
  warnings: [],
};

describe("PortfolioReadinessPanel", () => {
  it("renders FPT, MWG, and VNM readiness without overclaiming", () => {
    const html = renderToStaticMarkup(createElement(PortfolioReadinessPanel, { data: portfolioReadiness }));

    expect(html).toContain("Portfolio readiness backbone");
    expect(html).toContain("FPT");
    expect(html).toContain("MWG");
    expect(html).toContain("VNM");
    expect(html).toContain("VNStock research candidate");
    expect(html).toContain("phase109_controlled_local_financials");
    expect(html).toContain("sharesOutstanding");
    expect(html).toContain("unavailable");
    expect(html).toContain("canClaimValuationDbBacked:false");
    expect(html).toContain("canClaimRiskDbBacked:false");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("Financial statement coverage");
    expect(html).toContain("totalLiabilities:available");
    expect(html).toContain("totalDebt:unavailable");
    expect(html).toContain("cash flow:ready");
    expect(html).toContain("liquidity:ready");
    expect(html).toContain("Traceable input decisions");
    expect(html).toContain("Total debt: unavailable");
    expect(html).toContain("Pilot checked 3 paths");
    expect(html).toContain("financials runtime:checked_no_value");
    expect(html).toContain("official disclosure adapter:boundary_only");
    expect(html).toContain("manual import boundary:boundary_only");
    expect(html).toContain("EPS: unavailable");
    expect(html).toContain("Shares outstanding: unavailable");
    expect(html).toContain("total liabilities are not treated as debt");
  });

  it("renders reviewed available source records with source, unit, and period", () => {
    const data = structuredClone(portfolioReadiness);
    const fpt = data.tickers[0];
    fpt.sourceDecisions.totalDebt = {
      activationStatus: "activated",
      asOf: "2024-12-31",
      dataMode: "research_only",
      field: "totalDebt",
      period: "2024",
      productionApproved: false,
      reason: "Reviewed candidate has matching ticker, field, unit, as-of, and period.",
      reasonCode: "traceable_totalDebt_available",
      sourceLabel: "manual_reviewed_financial_statement_2024",
      status: "available",
      ticker: "FPT",
      unit: "billion_vnd",
      value: 14_947.354,
    };
    fpt.sourceDecisions.eps = {
      activationStatus: "activated",
      asOf: "2024-12-31",
      dataMode: "research_only",
      field: "eps",
      period: "2024",
      productionApproved: false,
      reason: "Reviewed candidate has matching ticker, field, unit, as-of, and period.",
      reasonCode: "traceable_eps_available",
      sourceLabel: "manual_reviewed_financial_statement_2024",
      status: "available",
      ticker: "FPT",
      unit: "vnd_per_share",
      value: 4_944,
    };
    fpt.sourceDecisions.sharesOutstanding = {
      activationStatus: "activated",
      asOf: "2024-12-31",
      dataMode: "research_only",
      field: "sharesOutstanding",
      period: "2024",
      productionApproved: false,
      reason: "Reviewed candidate has matching ticker, field, unit, as-of, and period.",
      reasonCode: "traceable_sharesOutstanding_available",
      sourceLabel: "manual_reviewed_financial_statement_2024",
      status: "available",
      ticker: "FPT",
      unit: "shares",
      value: 1_471_069_183,
    };

    const html = renderToStaticMarkup(createElement(PortfolioReadinessPanel, { data }));

    expect(html).toContain("Total debt: available");
    expect(html).toContain("EPS: available");
    expect(html).toContain("Shares outstanding: available");
    expect(html).toContain("manual_reviewed_financial_statement_2024");
    expect(html).toContain("research_only");
    expect(html).toContain("billion_vnd");
    expect(html).toContain("vnd_per_share");
    expect(html).toContain("shares");
    expect(html).toContain("productionApproved:false");
  });

  it("does not introduce forbidden positive wording", () => {
    const html = renderToStaticMarkup(createElement(PortfolioReadinessPanel, { data: portfolioReadiness })).toLowerCase();
    const forbidden = [
      "nên mua",
      "nên bán",
      "nên nắm giữ",
      "tín hiệu mua",
      "tín hiệu bán",
      "điểm mua",
      "cổ phiếu an toàn",
      "chắc chắn rẻ",
      "chắc chắn xấu",
      "định giá hấp dẫn",
      "đang rẻ",
      "đáng mua",
      "giá mục tiêu",
      "mục tiêu giá",
      "upside",
      "downside",
      "fair value",
      "target price",
      "recommendation",
      "production-ready",
      "dữ liệu chính thức",
      "dữ liệu thời gian thực",
    ];

    for (const phrase of forbidden) {
      expect(html).not.toContain(phrase);
    }
  });
});
