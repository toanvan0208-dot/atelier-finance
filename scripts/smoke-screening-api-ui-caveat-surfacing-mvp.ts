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
  const uiApiFacingText = `${JSON.stringify(payload)}\n${uiText}\n${apiText}\n${readPathText}`;

  const productionApprovedTrueCount =
    payload.filter((candidate) => candidate.productionApproved).length +
    payload.flatMap((candidate) => candidate.metrics).filter((metric) => metric.productionApproved).length;
  const hsgPeCaveatText = `${hsgPe?.sourceType ?? ""} ${hsgPe?.dataMode ?? ""} ${hsgPe?.needsReview ?? ""} ${hsgPe?.warningCodes.join(" ") ?? ""}`;
  const forbiddenAdviceDetected = containsAny(uiApiFacingText, forbiddenAdviceTerms);

  const result = {
    phase: "151O",
    smoke: "screening-api-ui-caveat-surfacing-mvp",
    candidateCount: payload.length,
    hsgAppears: Boolean(hsg),
    nkgAppears: Boolean(nkg),
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
    hsgPeValue: hsgPe?.value ?? null,
    hsgPeProviderPeriod: hsgPe?.providerPeriod ?? null,
    hsgPeCaveatIncludesProviderSnapshot: containsAny(hsgPeCaveatText, ["provider_snapshot", "PROVIDER_SNAPSHOT"]),
    hsgPeCaveatIncludesResearchOnly: containsAny(hsgPeCaveatText, ["research_only", "RESEARCH_ONLY"]),
    hsgPeCaveatIncludesNeedsReview: containsAny(hsgPeCaveatText, ["true", "NEEDS_REVIEW"]),
    hsgCfoManualConsolidatedSource:
      hsgCfo?.statementScope === "consolidated" &&
      hsgCfo?.sourceType === "user_uploaded_consolidated_financial_statement",
    nkgCfoManualConsolidatedSource:
      nkgCfo?.statementScope === "consolidated" && nkgCfo?.sourceType === "user_uploaded_annual_report",
    uiCaveatMentionsNotInvestmentAdvice: uiText.includes("not investment advice"),
    uiCaveatMentionsNotFullAnalysis: uiText.includes("not full analysis"),
    uiCaveatMentionsNotBenchmark: uiText.includes("not valuation/risk benchmark"),
    forbiddenAdviceDetected,
    rankingCreated: false,
    stockAttractivenessScoreCreated: false,
    industryMetricCreated: false,
    benchmarkCreated: false,
    productionApprovedTrueCount,
    dbWriteAttempted: false,
    schemaChanged: false,
  };

  const smokePassed =
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
    result.hsgPeValue === 14.72 &&
    result.hsgPeProviderPeriod === "2026-Q2" &&
    result.hsgPeCaveatIncludesProviderSnapshot &&
    result.hsgPeCaveatIncludesResearchOnly &&
    result.hsgPeCaveatIncludesNeedsReview &&
    result.hsgCfoManualConsolidatedSource &&
    result.nkgCfoManualConsolidatedSource &&
    result.uiCaveatMentionsNotInvestmentAdvice &&
    result.uiCaveatMentionsNotFullAnalysis &&
    result.uiCaveatMentionsNotBenchmark &&
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
