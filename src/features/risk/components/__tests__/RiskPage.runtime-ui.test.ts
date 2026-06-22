import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { RiskPage } from "../RiskPage";

const reviewedRuntimeData = {
  dataQuality: {
    errors: [],
    missingFields: [],
    status: "available",
    warnings: [],
  },
  readResult: null,
  runtimeStatus: "db_backed",
  source: {
    asOf: "2024-12-31",
    dataMode: "research_only",
    fallbackUsed: false,
    fiscalYear: 2024,
    periodType: "annual",
    productionApproved: false,
    readPath: "local_db",
    sourceLabel: "manual_reviewed_financial_statement_2024",
    ticker: "FPT",
  },
  statementSnapshot: {
    capitalExpenditure: null,
    companyType: "unknown",
    currentAssets: null,
    currentLiabilities: null,
    eps: 4_944,
    grossProfit: null,
    netProfit: 8_700,
    operatingCashFlow: 9_800,
    operatingProfit: null,
    period: "2024",
    periodType: "annual",
    previousNetProfit: null,
    previousOperatingCashFlow: null,
    previousRevenue: null,
    previousTotalAssets: null,
    previousTotalEquity: null,
    revenue: 62_000,
    sharesOutstanding: 1_471_069_183,
    sourceName: "manual_reviewed_financial_statement_2024",
    ticker: "FPT",
    totalAssets: 75_000,
    totalDebt: 14_947.354,
    totalEquity: 36_000,
    totalLiabilities: 39_000,
  },
  unitMetadata: buildFinancialsUnitMetadata({
    dataMode: "research_only",
    sourceLabel: "manual_reviewed_financial_statement_2024",
    snapshot: {
      eps: 4_944,
      netProfit: 8_700,
      operatingCashFlow: 9_800,
      revenue: 62_000,
      sharesOutstanding: 1_471_069_183,
      totalAssets: 75_000,
      totalDebt: 14_947.354,
      totalEquity: 36_000,
      totalLiabilities: 39_000,
    },
  }),
} satisfies FinancialsRuntimeData;

describe("RiskPage missing-data UI", () => {
  it("renders data-readiness copy without raw runtime flags", () => {
    const html = renderToStaticMarkup(
      createElement(RiskPage, {
        initialFinancialsRuntimeData: reviewedRuntimeData,
        onNavigate: () => undefined,
      }),
    );

    expect(html).toContain("Rủi ro dữ liệu còn thiếu");
    expect(html).toContain("Nợ vay");
    expect(html).toContain("Có thể kiểm tra");
    expect(html).toContain("Dữ liệu nghiên cứu");
    expect(html).toContain("Chưa đủ dữ liệu");
    expect(html).toContain("Chỉ số chưa thể tính");
    expect(html).not.toContain("runtimeStatus");
    expect(html).not.toContain("fallbackUsed");
    expect(html).not.toContain("readPath");
    expect(html).not.toContain("sourceLabel");
    expect(html).not.toContain("canClaimRiskDbBacked");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain("db_backed");
    expect(html).not.toContain("local_db");
    expect(html).not.toContain("nên mua");
    expect(html).not.toContain("fair value");
    expect(html).not.toContain("target price");
  });
});
