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
