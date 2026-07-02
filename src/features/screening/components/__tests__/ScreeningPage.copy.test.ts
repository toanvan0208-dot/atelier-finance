import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScreeningPage } from "../ScreeningPage";
import type { ScreeningCandidatePayload } from "../../lib/screening-candidate-read-path";

const buildMetric = (
  metricCode: string,
  value: number,
  overrides: Partial<ScreeningCandidatePayload["metrics"][number]> = {}
): ScreeningCandidatePayload["metrics"][number] => ({
  metricCode,
  value,
  unit: metricCode === "CFO" ? "vnd" : metricCode === "LIQUIDITY" ? "VND_AVERAGE_TRADING_VALUE_30D" : "ratio",
  period: null,
  periodType: metricCode === "PE" ? "provider_ratio_snapshot" : null,
  providerPeriod: metricCode === "PE" ? "2026-Q2" : null,
  snapshotDate: null,
  fiscalYearEnd: metricCode === "CFO" ? "2025-09-30" : null,
  statementScope: metricCode === "CFO" ? "consolidated" : null,
  sourceType: metricCode === "PE" ? "provider_snapshot" : "user_uploaded_consolidated_financial_statement",
  sourceLabel: metricCode === "PE" ? "VNStock Fundamental equity ratio" : "Manual consolidated cash-flow source",
  sourceUrl: null,
  warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW"],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  provenanceSummary: [],
  ...overrides,
});

const screeningCandidates: ScreeningCandidatePayload[] = [
  {
    ticker: "HSG",
    companyName: "Hoa Sen Group",
    industryCode: "STEEL_MATERIALS",
    peerRole: "direct_peer",
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    needsReview: true,
    dataMode: "research_only",
    researchOnly: true,
    productionApproved: false,
    warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW"],
    caveats: ["screening_candidate"],
    metrics: [
      buildMetric("PE", 14.72),
      buildMetric("PB", 0.95),
      buildMetric("CFO", 3_659_840_645_961),
      buildMetric("LIQUIDITY", 210_000_000),
    ],
    isValuationRiskBenchmarkEligible: false,
    isFullAnalysisEligible: false,
    fullAnalysisEnabled: false,
  },
  {
    ticker: "NKG",
    companyName: "Nam Kim Steel",
    industryCode: "STEEL_MATERIALS",
    peerRole: "direct_peer",
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    needsReview: true,
    dataMode: "research_only",
    researchOnly: true,
    productionApproved: false,
    warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW"],
    caveats: ["screening_candidate"],
    metrics: [
      buildMetric("PE", 16.1, { providerPeriod: null, sourceLabel: "Reviewed package" }),
      buildMetric("PB", 0.85),
      buildMetric("CFO", 1_326_940_472_262),
      buildMetric("LIQUIDITY", 160_000_000),
    ],
    isValuationRiskBenchmarkEligible: false,
    isFullAnalysisEligible: false,
    fullAnalysisEnabled: false,
  },
];

const forbiddenAdviceTerms = [
  "target price",
  "fair value",
  "upside",
  "downside",
  "attractive",
  "worth buying",
  "cổ phiếu tốt",
  "cổ phiếu xấu",
  "cổ phiếu hấp dẫn",
  "đáng mua",
  "giá mục tiêu",
  "giá trị hợp lý",
  "tiềm năng tăng giá",
];

const forbiddenAdvicePatterns = [/\bbuy\b/, /\bsell\b/, /\bhold\b/];

describe("ScreeningPage compact filter table", () => {
  const html = renderToStaticMarkup(
    createElement(ScreeningPage, {
      initialData: {
        candidates: [],
        screeningCandidates,
      },
    })
  );

  it("renders the compact filter/table MVP instead of large audit cards", () => {
    expect(html).toContain("Bước 3");
    expect(html).toContain("Tìm mã: HPG, HSG, NKG...");
    expect(html).toContain("Tất cả ngành");
    expect(html).toContain("Thép / vật liệu xây dựng");
    expect(html).toContain("Có P/E");
    expect(html).toContain("Có P/B");
    expect(html).toContain("Có CFO");
    expect(html).toContain("Có thanh khoản");
    expect(html).toContain("Tổng mã trong phạm vi");
    expect(html).toContain("Danh sách mã theo mức độ đủ dữ liệu");
    expect(html).toContain("Bảng screening compact");
  });

  it("renders HSG/NKG as screening candidates and keeps TVN absent", () => {
    expect(html).toContain("HSG");
    expect(html).toContain("Hoa Sen Group");
    expect(html).toContain("NKG");
    expect(html).toContain("Nam Kim Steel");
    expect(html).toContain("screening_candidate");
    expect(html).toContain("research_only");
    expect(html).toContain("needsReview");
    expect(html).toContain("Chưa mở phân tích sâu");
    expect(html).not.toContain("TVN");
  });

  it("shows compact metric values and the provider period caveat", () => {
    expect(html).toContain("14,72");
    expect(html).toContain("2026-Q2");
    expect(html).toContain("3.659,84 tỷ VND");
    expect(html).toContain("1.326,94 tỷ VND");
    expect(html).toContain("210.000.000 VND_AVERAGE_TRADING_VALUE_30D");
    expect(html).toContain("Xem nguồn / caveat");
  });

  it("does not introduce recommendation, ranking, scoring, or deep-analysis CTA copy", () => {
    const normalized = html.toLowerCase();
    for (const term of forbiddenAdviceTerms) {
      expect(normalized).not.toContain(term);
    }
    for (const pattern of forbiddenAdvicePatterns) {
      expect(normalized).not.toMatch(pattern);
    }
    expect(normalized).not.toContain("ranking");
    expect(normalized).not.toContain("scoring");
    expect(normalized).not.toContain("financials");
    expect(normalized).not.toContain("valuation");
    expect(normalized).not.toContain("risk deep-analysis");
  });
});
