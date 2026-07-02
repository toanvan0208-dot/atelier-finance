import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type TargetTicker = "FPT" | "HPG" | "VNM";

type CompanyCandidate = {
  ticker: TargetTicker;
  companyName: string | null;
  exchange: string | null;
  country: string | null;
  market: string | null;
  sector: string | null;
  industryLabel: string | null;
  sourceType: "company_disclosure" | "controlled_local_research" | "unavailable";
  sourceLabel: string | null;
  sourceUrl: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
  eligibleForCompanyConfirmWrite: boolean;
  blocker: string;
  sourceDecision: string;
  artifactsInspected: Array<{
    path: string;
    found: boolean;
    payloadChecksum: string | null;
    decision: string;
  }>;
};

const phase = "151W";
const targetTickers = ["FPT", "HPG", "VNM"] as const;

const artifactPathsByTicker: Record<TargetTicker, string[]> = {
  FPT: [
    "docs/product/evidence/PHASE139I_FPT_PDF_2025_PROVENANCE_DRY_RUN.md",
    "docs/product/evidence/PHASE139I_FPT_PDF_2025_PREVIEW.json",
    "docs/product/evidence/PHASE139J_FPT_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md",
  ],
  HPG: [
    "docs/product/evidence/PHASE139B_HPG_PDF_2025_MANUAL_PROVENANCE_PREVIEW.md",
    "docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json",
    "docs/product/evidence/PHASE139D_HPG_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md",
  ],
  VNM: [
    "docs/product/evidence/PHASE139F_VNM_PDF_2025_PROVENANCE_DRY_RUN.md",
    "docs/product/evidence/PHASE139F_VNM_PDF_2025_PREVIEW.json",
    "docs/product/evidence/PHASE139G_VNM_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md",
  ],
};

const forbiddenAdvicePatterns = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\battractive\b/i,
  /\bworth\s+buying\b/i,
  /\bstock\s+is\s+(good|bad)\b/i,
  /\bco\s+phieu\s+(tot|xau|hap\s+dan)\b/i,
  /\bdang\s+mua\b/i,
  /\bgia\s+muc\s+tieu\b/i,
  /\bgia\s+tri\s+hop\s+ly\b/i,
  /\btiem\s+nang\s+tang\s+gia\b/i,
] as const;

const checksum = (content: string): string => createHash("sha256").update(content).digest("hex");

const inspectArtifact = (relativePath: string) => {
  const fullPath = join(process.cwd(), relativePath);
  if (!existsSync(fullPath)) {
    return {
      path: relativePath,
      found: false,
      payloadChecksum: null,
      decision: "artifact_missing",
    };
  }

  const content = readFileSync(fullPath, "utf-8");
  const lower = content.toLowerCase();
  const hasFinancialExtractionLanguage =
    lower.includes("eps") ||
    lower.includes("sharesoutstanding") ||
    lower.includes("totaldebt") ||
    lower.includes("financial");
  const hasExplicitIdentitySection =
    lower.includes("entity identity") ||
    lower.includes("entity / scope") ||
    lower.includes("entity/document");

  return {
    path: relativePath,
    found: true,
    payloadChecksum: checksum(content),
    decision: hasExplicitIdentitySection
      ? "contains_identity_wording_but_not_structured_company_metadata_contract_for_target"
      : hasFinancialExtractionLanguage
        ? "financial_provenance_only_not_company_metadata"
        : "not_company_metadata_source",
  };
};

const buildBlockedCandidate = (ticker: TargetTicker): CompanyCandidate => {
  const artifactsInspected = artifactPathsByTicker[ticker].map(inspectArtifact);
  const foundArtifactCount = artifactsInspected.filter((artifact) => artifact.found).length;

  return {
    ticker,
    companyName: null,
    exchange: null,
    country: null,
    market: null,
    sector: null,
    industryLabel: null,
    sourceType: "controlled_local_research",
    sourceLabel: "controlled_local_company_metadata",
    sourceUrl: null,
    extractedQuote: null,
    reviewNote:
      foundArtifactCount > 0
        ? "Reviewed PDF/annual-report artifacts exist, but they support financial field extraction rather than a structured Company metadata identity package. The issuer local seed is explicitly not source/legal approved, so it remains blocked."
        : "No reviewed Company metadata artifact was found. Local/runtime names are not treated as real source data.",
    warningCodes: [
      "COMPANY_METADATA_REVIEWED_SOURCE_MISSING",
      "FINANCIAL_ARTIFACT_NOT_COMPANY_METADATA",
      "LOCAL_RESEARCH_SEED_NOT_ELIGIBLE",
      "NEEDS_REVIEW",
      "RESEARCH_ONLY",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
    eligibleForCompanyConfirmWrite: false,
    blocker: "reviewed_company_identity_package_missing",
    sourceDecision:
      "blocked: existing artifacts are useful for financial statement provenance, but do not provide a structured reviewed Company metadata source package with companyName/exchange provenance.",
    artifactsInspected,
  };
};

const companyCandidates = targetTickers.map(buildBlockedCandidate);
const scannedText = JSON.stringify(companyCandidates);
const forbiddenAdviceDetected = forbiddenAdvicePatterns.some((pattern) => pattern.test(scannedText));
const eligibleCompanyCandidates = companyCandidates.filter(
  (candidate) => candidate.eligibleForCompanyConfirmWrite,
).length;
const blockedCompanyCandidates = companyCandidates.length - eligibleCompanyCandidates;

const summary = {
  phase,
  mode: "dry_run",
  targetTickers,
  companyCandidatesPrepared: companyCandidates.length,
  eligibleCompanyCandidates,
  blockedCompanyCandidates,
  readyForCompanyConfirmWriteByTicker: Object.fromEntries(
    companyCandidates.map((candidate) => [candidate.ticker, candidate.eligibleForCompanyConfirmWrite]),
  ),
  tickersReadyForCompanyConfirmWrite: companyCandidates
    .filter((candidate) => candidate.eligibleForCompanyConfirmWrite)
    .map((candidate) => candidate.ticker),
  tickersBlocked: companyCandidates
    .filter((candidate) => !candidate.eligibleForCompanyConfirmWrite)
    .map((candidate) => candidate.ticker),
  missingCompanyFieldsByTicker: Object.fromEntries(
    companyCandidates.map((candidate) => [
      candidate.ticker,
      ["companyName", "exchange", "country", "market", "sector", "industryLabel"],
    ]),
  ),
  sourceDecisionByTicker: Object.fromEntries(
    companyCandidates.map((candidate) => [candidate.ticker, candidate.sourceDecision]),
  ),
  wouldAllowAllCoreCompanyConfirmWrite: false,
  companyCandidates,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  uiChanged: false,
  assistantChanged: false,
  screeningCandidateWriteAttempted: false,
  marketPriceWriteAttempted: false,
  financialStatementWriteAttempted: false,
  companyIndustryWriteAttempted: false,
  productionApprovedTrueCount: companyCandidates.filter((candidate) => candidate.productionApproved).length,
  msnMwgVcbUntouched: true,
  hsgNkgUntouched: true,
  tvnPresent: scannedText.includes("TVN"),
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  industryMetricCreated: false,
  benchmarkCreated: false,
  forbiddenAdviceDetected,
  smokePassed:
    eligibleCompanyCandidates === 0 &&
    blockedCompanyCandidates === 3 &&
    !forbiddenAdviceDetected &&
    !scannedText.includes("TVN") &&
    companyCandidates.every((candidate) => candidate.productionApproved === false),
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.smokePassed) {
  process.exitCode = 1;
}
