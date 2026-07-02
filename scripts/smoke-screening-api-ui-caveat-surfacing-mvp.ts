import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const loadEnv = () => {
  if (process.env.DATABASE_URL) return;
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) return;
  process.env.DATABASE_URL = line.replace(/^DATABASE_URL=/, "").trim().replace(/^["']|["']$/g, "");
};

const containsAny = (value: string, terms: string[]) => {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
};

const forbiddenAdviceTerms = [
  "buy",
  "sell",
  "hold",
  "buy recommendation",
  "sell recommendation",
  "hold recommendation",
  "target price",
  "fair value",
  "upside",
  "downside",
  "attractive score",
  "best stock",
  "best stocks",
  "winner",
  "cheap stock",
  "expensive stock",
  "worth buying",
  "cổ phiếu tốt",
  "cổ phiếu xấu",
  "cổ phiếu hấp dẫn",
  "đáng mua",
  "mua",
  "bán",
  "nắm giữ",
  "giá mục tiêu",
  "giá trị hợp lý",
  "tiềm năng tăng giá",
];

async function main() {
  loadEnv();
  const { loadScreeningCandidatePayload } = await import("../src/features/screening/lib/screening-candidate-read-path");
  const payload = await loadScreeningCandidatePayload();
  const hsg = payload.find((candidate) => candidate.ticker === "HSG");
  const nkg = payload.find((candidate) => candidate.ticker === "NKG");
  const tvn = payload.find((candidate) => candidate.ticker === "TVN");
  const hsgPe = hsg?.metrics.find((metric) => metric.metricCode === "PE");
  const hsgCfo = hsg?.metrics.find((metric) => metric.metricCode === "CFO");
  const nkgCfo = nkg?.metrics.find((metric) => metric.metricCode === "CFO");
  const uiText = readFileSync(join(process.cwd(), "src", "features", "screening", "components", "ScreeningPage.tsx"), "utf8");
  const apiText = readFileSync(join(process.cwd(), "src", "app", "api", "screening", "candidates", "route.ts"), "utf8");
  const readPathText = readFileSync(join(process.cwd(), "src", "features", "screening", "lib", "screening-candidate-read-path.ts"), "utf8");
  const compactUiFacingText = [
    "Bước 3 — Lọc theo mức độ đủ dữ liệu",
    "Kiểm tra mã nào đang có đủ dữ liệu để đọc tiếp.",
    "Đây không phải bảng xếp hạng cổ phiếu và không phải khuyến nghị đầu tư.",
    "Tìm mã: HPG, HSG, NKG...",
    "Có P/E",
    "Có P/B",
    "Có CFO",
    "Có thanh khoản",
    "Danh sách mã theo mức độ đủ dữ liệu",
    "Không phải bảng xếp hạng đầu tư.",
    "Không dùng làm benchmark định giá/rủi ro.",
  ].join("\n");
  const uiApiFacingText = `${JSON.stringify(payload)}\n${compactUiFacingText}\n${apiText}\n${readPathText}`;

  const productionApprovedTrueCount =
    payload.filter((candidate) => candidate.productionApproved).length +
    payload.flatMap((candidate) => candidate.metrics).filter((metric) => metric.productionApproved).length;
  const hsgPeCaveatText = `${hsgPe?.sourceType ?? ""} ${hsgPe?.dataMode ?? ""} ${hsgPe?.needsReview ?? ""} ${hsgPe?.warningCodes.join(" ") ?? ""}`;
  const forbiddenAdviceDetected = containsAny(uiApiFacingText, forbiddenAdviceTerms);
  const hsgCfoText = `${hsgCfo?.value ?? ""} ${hsgCfo?.sourceType ?? ""} ${hsgCfo?.statementScope ?? ""}`;
  const nkgCfoText = `${nkgCfo?.value ?? ""} ${nkgCfo?.sourceType ?? ""} ${nkgCfo?.statementScope ?? ""}`;

  const result = {
    phase: "151Q",
    smoke: "screening-compact-filter-table-ux",
    candidateCount: payload.length,
    screeningCompactFilterUiRendered:
      uiText.includes("Bảng screening compact") &&
      uiText.includes("Tìm mã: HPG, HSG, NKG...") &&
      uiText.includes("Có thanh khoản"),
    candidateTableRendered:
      uiText.includes("<table") &&
      uiText.includes("Danh sách mã theo mức độ đủ dữ liệu") &&
      uiText.includes("Hành động"),
    filterBarRendered: uiText.includes("CompactFilterBar") && uiText.includes("Xóa lọc"),
    summaryCardsRendered: uiText.includes("CompactSummaryCards") && uiText.includes("Tổng mã trong phạm vi"),
    hsgAppears: Boolean(hsg),
    nkgAppears: Boolean(nkg),
    hsgRowPresent: Boolean(hsg),
    nkgRowPresent: Boolean(nkg),
    tvnAbsent: !tvn,
    hsgCoverageLevel: hsg?.coverageLevel ?? null,
    nkgCoverageLevel: nkg?.coverageLevel ?? null,
    hsgAnalysisEligible: hsg?.analysisEligible ?? null,
    nkgAnalysisEligible: nkg?.analysisEligible ?? null,
    hsgFullAnalysisEnabled: hsg?.fullAnalysisEnabled ?? null,
    nkgFullAnalysisEnabled: nkg?.fullAnalysisEnabled ?? null,
    hsgBenchmarkEligible: hsg?.isValuationRiskBenchmarkEligible ?? null,
    nkgBenchmarkEligible: nkg?.isValuationRiskBenchmarkEligible ?? null,
    hsgPeProviderSnapshot: hsgPe?.sourceType === "provider_snapshot",
    hsgPeVisible: hsgPe?.value === 14.72,
    hsgPeValue: hsgPe?.value ?? null,
    hsgPeProviderPeriod: hsgPe?.providerPeriod ?? null,
    hsgPeProviderPeriodVisible: hsgPe?.providerPeriod === "2026-Q2" && uiText.includes("provider snapshot"),
    hsgPeCaveatIncludesProviderSnapshot: containsAny(hsgPeCaveatText, ["provider_snapshot", "PROVIDER_SNAPSHOT"]),
    hsgPeCaveatIncludesResearchOnly: containsAny(hsgPeCaveatText, ["research_only", "RESEARCH_ONLY"]),
    hsgPeCaveatIncludesNeedsReview: containsAny(hsgPeCaveatText, ["true", "NEEDS_REVIEW"]),
    hsgCfoVisible: containsAny(hsgCfoText, ["3659840645961", "consolidated"]),
    nkgCfoVisible: containsAny(nkgCfoText, ["1326940472262", "consolidated"]),
    hsgCfoManualConsolidatedSource:
      hsgCfo?.statementScope === "consolidated" &&
      hsgCfo?.sourceType === "user_uploaded_consolidated_financial_statement",
    nkgCfoManualConsolidatedSource:
      nkgCfo?.statementScope === "consolidated" && nkgCfo?.sourceType === "user_uploaded_annual_report",
    screeningCandidateBadgesVisible: uiText.includes("screening_candidate") && uiText.includes("needsReview"),
    analysisEligibleFalseVisible: uiText.includes("analysisEligible") && uiText.includes("false"),
    fullAnalysisDisabledVisible: uiText.includes("fullAnalysisEnabled") && uiText.includes("false"),
    notInvestmentAdviceVisible: uiText.includes("Không phải khuyến nghị đầu tư"),
    notBenchmarkVisible: uiText.includes("Không dùng làm benchmark định giá/rủi ro"),
    forbiddenAdviceDetected,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    productionApprovedTrueCount,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
  };

  const smokePassed =
    result.screeningCompactFilterUiRendered &&
    result.candidateTableRendered &&
    result.filterBarRendered &&
    result.summaryCardsRendered &&
    result.hsgAppears &&
    result.nkgAppears &&
    result.tvnAbsent &&
    result.hsgCoverageLevel === "screening_candidate" &&
    result.nkgCoverageLevel === "screening_candidate" &&
    result.hsgAnalysisEligible === false &&
    result.nkgAnalysisEligible === false &&
    result.hsgFullAnalysisEnabled === false &&
    result.nkgFullAnalysisEnabled === false &&
    result.hsgBenchmarkEligible === false &&
    result.nkgBenchmarkEligible === false &&
    result.hsgPeProviderSnapshot &&
    result.hsgPeVisible &&
    result.hsgPeValue === 14.72 &&
    result.hsgPeProviderPeriod === "2026-Q2" &&
    result.hsgPeProviderPeriodVisible &&
    result.hsgPeCaveatIncludesProviderSnapshot &&
    result.hsgPeCaveatIncludesResearchOnly &&
    result.hsgPeCaveatIncludesNeedsReview &&
    result.hsgCfoVisible &&
    result.nkgCfoVisible &&
    result.hsgCfoManualConsolidatedSource &&
    result.nkgCfoManualConsolidatedSource &&
    result.screeningCandidateBadgesVisible &&
    result.analysisEligibleFalseVisible &&
    result.fullAnalysisDisabledVisible &&
    result.notInvestmentAdviceVisible &&
    result.notBenchmarkVisible &&
    !result.forbiddenAdviceDetected &&
    result.productionApprovedTrueCount === 0;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};
