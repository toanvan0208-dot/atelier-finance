import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildMsnIdentityEvidence } from "../src/lib/data-sources/annual-report-2025-msn-manual-preview";
import { buildVcbIdentityEvidence } from "../src/lib/data-sources/annual-report-2025-vcb-manual-preview";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type CandidateStatus = "eligible" | "blocked";

type CompanyMetadataCandidate = {
  ticker: CoreTicker;
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
  blocker: string | null;
  payloadChecksum: string | null;
  status: CandidateStatus;
};

type MwgArtifact = {
  ticker?: unknown;
  sourceFile?: unknown;
  sourceLabel?: unknown;
  productionApproved?: unknown;
  entityStatus?: unknown;
  documentTypeStatus?: unknown;
  auditStatus?: unknown;
  consolidatedScopeStatus?: unknown;
};

const phase = "151V";
const candidateTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;

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

const checksum = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const readJson = (relativePath: string): unknown | null => {
  const filePath = join(process.cwd(), relativePath);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
};

const baseCandidate = (
  ticker: CoreTicker,
  status: CandidateStatus,
  overrides: Partial<CompanyMetadataCandidate>,
): CompanyMetadataCandidate => ({
  ticker,
  companyName: overrides.companyName ?? null,
  exchange: overrides.exchange ?? null,
  country: overrides.country ?? "VN",
  market: overrides.market ?? "Vietnam",
  sector: overrides.sector ?? null,
  industryLabel: overrides.industryLabel ?? null,
  sourceType: overrides.sourceType ?? "unavailable",
  sourceLabel: overrides.sourceLabel ?? null,
  sourceUrl: overrides.sourceUrl ?? null,
  extractedQuote: overrides.extractedQuote ?? null,
  reviewNote: overrides.reviewNote ?? "",
  warningCodes: overrides.warningCodes ?? ["NEEDS_REVIEW", "RESEARCH_ONLY"],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
  eligibleForCompanyConfirmWrite: overrides.eligibleForCompanyConfirmWrite ?? status === "eligible",
  blocker: overrides.blocker ?? (status === "eligible" ? null : "reviewed_company_metadata_source_missing"),
  payloadChecksum: overrides.payloadChecksum ?? null,
  status,
});

const blockedLocalSeedCandidate = (ticker: CoreTicker): CompanyMetadataCandidate =>
  baseCandidate(ticker, "blocked", {
    country: null,
    market: null,
    sourceType: "controlled_local_research",
    sourceLabel: "controlled_local_company_metadata",
    reviewNote:
      "Only controlled local/research metadata or annual-report financial preview references were found. The local issuer metadata service explicitly says no source/legal approval has been recorded, so this dry-run does not treat it as reviewed Company metadata.",
    warningCodes: [
      "COMPANY_METADATA_REVIEWED_SOURCE_MISSING",
      "LOCAL_RESEARCH_SEED_NOT_ELIGIBLE",
      "NEEDS_REVIEW",
      "RESEARCH_ONLY",
    ],
    eligibleForCompanyConfirmWrite: false,
    blocker: "reviewed_company_metadata_source_missing",
  });

const buildMsnCandidate = (): CompanyMetadataCandidate => {
  const identity = buildMsnIdentityEvidence();
  const eligible = identity.status === "valid_msn_consolidated" && identity.companyName !== null;

  if (!eligible) {
    return baseCandidate("MSN", "blocked", {
      reviewNote: "MSN identity evidence did not reach valid_msn_consolidated status.",
      warningCodes: ["MSN_IDENTITY_NEEDS_REVIEW", "NEEDS_REVIEW", "RESEARCH_ONLY"],
      eligibleForCompanyConfirmWrite: false,
      blocker: "msn_identity_not_validated",
      payloadChecksum: checksum(identity),
    });
  }

  return baseCandidate("MSN", "eligible", {
    companyName: identity.companyName,
    exchange: "HOSE",
    sourceType: "company_disclosure",
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
    extractedQuote: "Company/entity: Công ty Cổ phần Tập đoàn Masan; Ticker: MSN.",
    reviewNote:
      "MSN annual-report identity evidence verifies Masan Group Corporation at consolidated group level and references the HOSE stock code MSN.",
    warningCodes: ["ANNUAL_REPORT_IDENTITY_REVIEWED", "NEEDS_REVIEW", "RESEARCH_ONLY"],
    payloadChecksum: checksum(identity),
  });
};

const buildMwgCandidate = (): CompanyMetadataCandidate => {
  const artifact = readJson(
    "docs/product/evidence/PHASE140F_MWG_REFRESHED_ANNUAL_REPORT_MANUAL_PREVIEW_RESULT.json",
  );
  const record = asRecord(artifact) as MwgArtifact | null;
  const entityStatus = asString(record?.entityStatus);
  const sourceFile = asString(record?.sourceFile);
  const sourceLabel = asString(record?.sourceLabel) ?? "annual_report_2025_pdf_reviewed_preview";
  const productionApproved = record?.productionApproved;
  const companyName = "Công ty Cổ phần Đầu tư Thế Giới Di Động";
  const entityVerified = entityStatus?.includes(companyName) === true;

  if (!record || record.ticker !== "MWG" || productionApproved !== false || !entityVerified) {
    return baseCandidate("MWG", "blocked", {
      reviewNote: "MWG reviewed annual-report identity artifact was missing or did not verify the entity.",
      warningCodes: ["MWG_IDENTITY_NEEDS_REVIEW", "NEEDS_REVIEW", "RESEARCH_ONLY"],
      eligibleForCompanyConfirmWrite: false,
      blocker: "mwg_identity_not_validated",
      payloadChecksum: artifact ? checksum(artifact) : null,
    });
  }

  return baseCandidate("MWG", "eligible", {
    companyName,
    exchange: null,
    sourceType: "company_disclosure",
    sourceLabel,
    extractedQuote: `Entity verified as ${companyName}.`,
    reviewNote:
      "MWG refreshed annual-report manual preview verifies the entity on the annual-report source file; exchange remains null because no reviewed exchange field is carried in this candidate.",
    warningCodes: ["ANNUAL_REPORT_IDENTITY_REVIEWED", "EXCHANGE_NOT_VERIFIED", "NEEDS_REVIEW", "RESEARCH_ONLY"],
    payloadChecksum: checksum({ sourceFile, entityStatus, sourceLabel, productionApproved }),
  });
};

const buildVcbCandidate = (): CompanyMetadataCandidate => {
  const identity = buildVcbIdentityEvidence();
  const eligible = identity.status === "valid_vcb_consolidated" && identity.companyName !== null;

  if (!eligible) {
    return baseCandidate("VCB", "blocked", {
      reviewNote: "VCB identity evidence did not reach valid_vcb_consolidated status.",
      warningCodes: ["VCB_IDENTITY_NEEDS_REVIEW", "BANK_SPECIFIC_NEEDS_REVIEW", "RESEARCH_ONLY"],
      eligibleForCompanyConfirmWrite: false,
      blocker: "vcb_identity_not_validated",
      payloadChecksum: checksum(identity),
    });
  }

  return baseCandidate("VCB", "eligible", {
    companyName: identity.companyName,
    exchange: null,
    sector: "Financials",
    industryLabel: "Bank",
    sourceType: "company_disclosure",
    sourceLabel: "annual_report_2025_pdf_reviewed_preview",
    extractedQuote: "Entity: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank / VCB).",
    reviewNote:
      "VCB annual-report identity evidence validates the Vietcombank / VCB entity. This closes Company metadata only; bank-specific financial metrics remain separately controlled.",
    warningCodes: [
      "ANNUAL_REPORT_IDENTITY_REVIEWED",
      "BANK_SPECIFIC_CAVEAT",
      "EXCHANGE_NOT_VERIFIED",
      "NEEDS_REVIEW",
      "RESEARCH_ONLY",
    ],
    payloadChecksum: checksum(identity),
  });
};

const buildCandidate = (ticker: CoreTicker): CompanyMetadataCandidate => {
  if (ticker === "MSN") return buildMsnCandidate();
  if (ticker === "MWG") return buildMwgCandidate();
  if (ticker === "VCB") return buildVcbCandidate();
  return blockedLocalSeedCandidate(ticker);
};

const candidates = candidateTickers.map(buildCandidate);
const scannedText = JSON.stringify(candidates);
const forbiddenAdviceDetected = forbiddenAdvicePatterns.some((pattern) => pattern.test(scannedText));
const eligibleCompanyCandidates = candidates.filter((candidate) => candidate.status === "eligible").length;
const blockedCompanyCandidates = candidates.length - eligibleCompanyCandidates;
const readyForCompanyConfirmWriteByTicker = Object.fromEntries(
  candidates.map((candidate) => [candidate.ticker, candidate.eligibleForCompanyConfirmWrite]),
);
const tickersReadyForCompanyConfirmWrite = candidates
  .filter((candidate) => candidate.eligibleForCompanyConfirmWrite)
  .map((candidate) => candidate.ticker);
const tickersBlocked = candidates
  .filter((candidate) => !candidate.eligibleForCompanyConfirmWrite)
  .map((candidate) => candidate.ticker);

const summary = {
  phase,
  mode: "dry_run",
  candidateTickers,
  companyCandidatesPrepared: candidates.length,
  eligibleCompanyCandidates,
  blockedCompanyCandidates,
  missingCompanyFieldsByTicker: Object.fromEntries(
    candidates.map((candidate) => [
      candidate.ticker,
      [
        ...(candidate.companyName ? [] : ["companyName"]),
        ...(candidate.exchange ? [] : ["exchange"]),
        ...(candidate.country ? [] : ["country"]),
        ...(candidate.industryLabel ? [] : ["industryLabel"]),
      ],
    ]),
  ),
  readyForCompanyConfirmWriteByTicker,
  tickersReadyForCompanyConfirmWrite,
  tickersBlocked,
  wouldClose151UCompanyBlockerByTicker: readyForCompanyConfirmWriteByTicker,
  companyCandidates: candidates,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  uiChanged: false,
  assistantChanged: false,
  screeningCandidateWriteAttempted: false,
  marketPriceWriteAttempted: false,
  financialStatementWriteAttempted: false,
  companyIndustryWriteAttempted: false,
  productionApprovedTrueCount: candidates.filter((candidate) => candidate.productionApproved).length,
  hsgNkgUntouched: true,
  tvnPresent: scannedText.includes("TVN"),
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  industryMetricCreated: false,
  benchmarkCreated: false,
  forbiddenAdviceDetected,
  smokePassed:
    !forbiddenAdviceDetected &&
    !scannedText.includes("TVN") &&
    eligibleCompanyCandidates === 3 &&
    candidates.every((candidate) => candidate.productionApproved === false),
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.smokePassed) {
  process.exitCode = 1;
}
