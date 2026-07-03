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
  "cổ phiếu hấp dẫn",
  "đáng mua",
  "giá mục tiêu",
  "giá trị hợp lý",
  "tiềm năng tăng giá",
];

describe("ScreeningPage restored card layout", () => {
  const html = renderToStaticMarkup(
    createElement(ScreeningPage, {
      initialData: {
        candidates: [],
        screeningCandidates,
      },
    })
  );

  it("restores the pre-compact card-based Screening interface", () => {
    expect(html).toContain("Bước 3");
    expect(html).toContain("Kiểm tra nhanh mã trong phạm vi MVP");
    expect(html).toContain("Lọc theo tiêu chí");
    expect(html).toContain("Phạm vi ngành");
    expect(html).toContain("Mã trong phạm vi");
    expect(html).toContain("Tiêu chí ngành");
    expect(html).toContain("Tiêu chí dữ liệu");
    expect(html).toContain("Điểm dừng");
    expect(html).toContain("Tìm mã: HPG, HSG, NKG...");
    expect(html).toContain("Tất cả ngành");
    expect(html).toContain("Ứng viên sàng lọc");
    expect(html).toContain("Phân tích đầy đủ");
    expect(html).toContain("Dữ liệu nghiên cứu");
    expect(html).toContain("Có P/E");
    expect(html).toContain("Có P/B");
    expect(html).toContain("Có CFO");
    expect(html).toContain("Có thanh khoản");
    expect(html).toContain("Xóa lọc");
    expect(html).toContain("Kết quả sau lọc");
    expect(html).toContain("Kết luận và bước tiếp theo");
    expect(html).not.toContain("Nguồn từ module Ngành");
    expect(html).not.toContain("Bộ lọc đang áp dụng");
    expect(html).not.toContain("Phễu kiểm tra dữ liệu");
    expect(html).not.toContain("Quy trình lọc theo mức đủ dữ liệu");
    expect(html).not.toContain("Bảng screening compact");
  });

  it("keeps HSG/NKG visible as screening candidate cards and TVN absent", () => {
    expect(html).toContain("Ứng viên Screening từ bảng riêng");
    expect(html).toContain("HSG");
    expect(html).toContain("Hoa Sen Group");
    expect(html).toContain("NKG");
    expect(html).toContain("Nam Kim Steel");
    expect(html).toContain("Chưa mở phân tích sâu");
    expect(html).toContain("Cần rà soát");
    expect(html).not.toContain("TVN");
    expect(html).not.toContain("screening_candidate");
    expect(html).not.toContain("analysisEligible=false");
    expect(html).not.toContain("research_only");
    expect(html).not.toContain("needsReview=true");
    expect(html).not.toContain("full_analysis");
  });

  it("keeps user-facing metric caveats visible without source-period details", () => {
    expect(html).toContain("14.72");
    expect(html).toContain("P/E là ảnh chụp tỷ số thị trường từ nhà cung cấp");
    expect(html).toContain("CFO lấy từ nguồn lưu chuyển tiền tệ hợp nhất");
    expect(html).not.toContain("2026-Q2");
    expect(html).not.toContain("VNStock Fundamental equity ratio");
    expect(html).not.toContain("Manual consolidated cash-flow source");
  });

  it("does not introduce recommendation, ranking, or scoring copy", () => {
    const normalized = html.toLowerCase();
    for (const term of forbiddenAdviceTerms) {
      expect(normalized).not.toContain(term);
    }
    expect(normalized).not.toContain("ranking");
    expect(normalized).not.toContain("scoring");
  });
});
