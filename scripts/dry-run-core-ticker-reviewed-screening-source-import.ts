import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { companyIndustrySourcePackages } from "./industry-taxonomy-reviewed-sources";

type CoreTicker = "FPT" | "HPG" | "VNM" | "MSN" | "MWG" | "VCB";
type SourceRowKind = "Company" | "CompanyIndustry" | "FinancialStatement" | "MarketPrice";
type SourceStatus = "eligible" | "blocked" | "missing";

type SourceCandidate = {
  ticker: CoreTicker;
  rowKind: SourceRowKind;
  status: SourceStatus;
  sourceType: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  payloadChecksum: string | null;
  productionApproved: false;
  eligibleForSourceConfirmWrite: boolean;
  blocker: string | null;
  fields: Record<string, string | number | boolean | null>;
};

type PreviewItem = {
  ticker?: unknown;
  field?: unknown;
  value?: unknown;
  unit?: unknown;
  fiscalYear?: unknown;
  sourceLabel?: unknown;
  dataMode?: unknown;
  productionApproved?: unknown;
  evidenceSnippet?: unknown;
  notes?: unknown;
};

type FinancialPreviewConfig = {
  ticker: Exclude<CoreTicker, "VCB">;
  path: string;
  artifactKind: "flat_preview" | "msn_import_candidate" | "mwg_import_candidate";
};

type FinancialFields = {
  fiscalYear: number | null;
  eps: number | null;
  epsUnit: string | null;
  sharesOutstanding: number | null;
  sharesOutstandingUnit: string | null;
  totalDebt: number | null;
  totalDebtUnit: string | null;
  sourceLabel: string | null;
  extractedQuote: string | null;
  reviewNote: string;
};

const phase = "151U";
const coreTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;

const financialPreviewConfigs: FinancialPreviewConfig[] = [
  {
    ticker: "FPT",
    path: "docs/product/evidence/PHASE139I_FPT_PDF_2025_PREVIEW.json",
    artifactKind: "flat_preview",
  },
  {
    ticker: "HPG",
    path: "docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json",
    artifactKind: "flat_preview",
  },
  {
    ticker: "VNM",
    path: "docs/product/evidence/PHASE139F_VNM_PDF_2025_PREVIEW.json",
    artifactKind: "flat_preview",
  },
  {
    ticker: "MSN",
    path: "docs/product/evidence/PHASE139K_MSN_PDF_2025_DRY_RUN.json",
    artifactKind: "msn_import_candidate",
  },
  {
    ticker: "MWG",
    path: "docs/product/evidence/PHASE140F_MWG_REFRESHED_ANNUAL_REPORT_MANUAL_PREVIEW_RESULT.json",
    artifactKind: "mwg_import_candidate",
  },
];

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

const asFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const normalizeDebtUnit = (
  value: number | null,
  unit: string | null,
): { value: number | null; unit: string | null } => {
  if (value === null) return { value: null, unit: null };
  if (unit === "VND" || unit === "vnd") {
    return { value: Number((value / 1_000_000_000).toFixed(9)), unit: "billion_vnd" };
  }
  if (unit === "million_vnd") {
    return { value: Number((value / 1_000).toFixed(9)), unit: "billion_vnd" };
  }
  return { value, unit };
};

const readJson = (relativePath: string): unknown | null => {
  const fullPath = join(process.cwd(), relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf-8")) as unknown;
};

const buildFlatPreviewFields = (ticker: CoreTicker, artifact: unknown): FinancialFields | null => {
  if (!Array.isArray(artifact)) return null;

  const items = artifact
    .map((item): PreviewItem | null => {
      const record = asRecord(item);
      return record ? record : null;
    })
    .filter((item): item is PreviewItem => item !== null)
    .filter((item) => item.ticker === ticker);

  if (items.length === 0) return null;

  const fieldByName = new Map<string, PreviewItem>();
  for (const item of items) {
    const field = asString(item.field);
    if (field) fieldByName.set(field, item);
  }

  const eps = fieldByName.get("eps");
  const shares = fieldByName.get("sharesOutstanding");
  const totalDebt = fieldByName.get("totalDebt");
  const normalizedDebt = normalizeDebtUnit(
    asFiniteNumber(totalDebt?.value),
    asString(totalDebt?.unit),
  );

  return {
    fiscalYear: asFiniteNumber(eps?.fiscalYear) ?? asFiniteNumber(shares?.fiscalYear) ?? 2025,
    eps: asFiniteNumber(eps?.value),
    epsUnit: asString(eps?.unit),
    sharesOutstanding: asFiniteNumber(shares?.value),
    sharesOutstandingUnit: asString(shares?.unit),
    totalDebt: normalizedDebt.value,
    totalDebtUnit: normalizedDebt.unit,
    sourceLabel: asString(eps?.sourceLabel) ?? "annual_report_2025_pdf_reviewed_preview",
    extractedQuote: asString(eps?.evidenceSnippet) ?? asString(totalDebt?.evidenceSnippet),
    reviewNote:
      "Prepared from existing annual-report PDF reviewed preview artifact. This dry-run does not write the source row.",
  };
};

const readNestedValue = (
  record: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null => asRecord(record?.[key]);

const buildMsnFields = (artifact: unknown): FinancialFields | null => {
  const root = asRecord(artifact);
  const candidate = readNestedValue(root, "dryRunImportCandidate");
  const values = readNestedValue(candidate, "values");
  const eps = readNestedValue(values, "eps");
  const shares = readNestedValue(values, "sharesOutstanding");
  const debt = readNestedValue(values, "totalDebt");

  if (candidate?.ticker !== "MSN" || candidate?.productionApproved !== false) return null;

  return {
    fiscalYear: asFiniteNumber(candidate.fiscalYear) ?? 2025,
    eps: asFiniteNumber(eps?.normalizedValue),
    epsUnit: asString(eps?.normalizedUnit),
    sharesOutstanding: asFiniteNumber(shares?.normalizedValue),
    sharesOutstandingUnit: asString(shares?.normalizedUnit),
    totalDebt: asFiniteNumber(debt?.normalizedValue),
    totalDebtUnit: asString(debt?.normalizedUnit),
    sourceLabel: asString(candidate.sourceLabel),
    extractedQuote: null,
    reviewNote:
      "Prepared from MSN annual-report PDF reviewed dry-run import artifact with explicit debt components.",
  };
};

const buildMwgFields = (artifact: unknown): FinancialFields | null => {
  const root = asRecord(artifact);
  const eps = readNestedValue(root, "epsPreview") ?? readNestedValue(readNestedValue(root, "financials"), "EPS");
  const shares =
    readNestedValue(root, "sharesOutstandingPreview") ??
    readNestedValue(readNestedValue(root, "financials"), "sharesOutstanding");
  const debt =
    readNestedValue(root, "totalDebtPreview") ??
    readNestedValue(readNestedValue(root, "financials"), "totalDebt");

  if (root?.ticker !== "MWG" || root?.productionApproved !== false) return null;

  return {
    fiscalYear: 2025,
    eps: asFiniteNumber(eps?.value),
    epsUnit: asString(eps?.unit),
    sharesOutstanding: asFiniteNumber(shares?.value),
    sharesOutstandingUnit: asString(shares?.unit),
    totalDebt: asFiniteNumber(debt?.value),
    totalDebtUnit: asString(debt?.unit),
    sourceLabel: asString(root.sourceLabel),
    extractedQuote: null,
    reviewNote:
      "Prepared from MWG refreshed annual-report manual preview artifact. Debt provenance is kept manual/reviewed and not mapped from total liabilities.",
  };
};

const buildFinancialFields = (ticker: CoreTicker): { fields: FinancialFields | null; payloadChecksum: string | null } => {
  const config = financialPreviewConfigs.find((entry) => entry.ticker === ticker);
  if (!config) return { fields: null, payloadChecksum: null };

  const artifact = readJson(config.path);
  if (artifact === null) return { fields: null, payloadChecksum: null };

  const fields =
    config.artifactKind === "flat_preview"
      ? buildFlatPreviewFields(ticker, artifact)
      : config.artifactKind === "msn_import_candidate"
        ? buildMsnFields(artifact)
        : buildMwgFields(artifact);

  return { fields, payloadChecksum: checksum(artifact) };
};

const baseCandidate = (
  ticker: CoreTicker,
  rowKind: SourceRowKind,
  status: SourceStatus,
  overrides: Omit<Partial<SourceCandidate>, "ticker" | "rowKind" | "status" | "productionApproved">,
): SourceCandidate => ({
  ticker,
  rowKind,
  status,
  sourceType: overrides.sourceType ?? null,
  sourceLabel: overrides.sourceLabel ?? null,
  sourceUrl: overrides.sourceUrl ?? null,
  extractedQuote: overrides.extractedQuote ?? null,
  reviewNote: overrides.reviewNote ?? "",
  warningCodes: overrides.warningCodes ?? ["NEEDS_REVIEW", "RESEARCH_ONLY"],
  payloadChecksum: overrides.payloadChecksum ?? null,
  productionApproved: false,
  eligibleForSourceConfirmWrite: overrides.eligibleForSourceConfirmWrite ?? status === "eligible",
  blocker: overrides.blocker ?? (status === "eligible" ? null : "source_missing_or_not_eligible"),
  fields: overrides.fields ?? {},
});

const buildCompanyCandidate = (ticker: CoreTicker): SourceCandidate =>
  baseCandidate(ticker, "Company", "blocked", {
    reviewNote:
      "Company rows require reviewed company metadata. Phase 151U found references in runtime/evidence history, but no standalone reviewed Company source package eligible for local PostgreSQL import.",
    warningCodes: ["COMPANY_SOURCE_MISSING", "NEEDS_REVIEW", "RESEARCH_ONLY"],
    eligibleForSourceConfirmWrite: false,
    blocker: "reviewed_company_metadata_source_missing",
    fields: {
      companyName: null,
      exchange: null,
      dataMode: "research_only",
      needsReview: true,
    },
  });

const buildCompanyIndustryCandidate = (ticker: CoreTicker): SourceCandidate => {
  const source = companyIndustrySourcePackages.find((entry) => entry.ticker === ticker);
  if (!source) {
    return baseCandidate(ticker, "CompanyIndustry", "blocked", {
      reviewNote:
        "No reviewed CompanyIndustry package exists for this ticker in the bounded Industry taxonomy source package.",
      warningCodes: ["COMPANY_INDUSTRY_SOURCE_MISSING", "NEEDS_REVIEW", "RESEARCH_ONLY"],
      eligibleForSourceConfirmWrite: false,
      blocker: "reviewed_company_industry_source_missing",
      fields: {
        industryCode: null,
        dataMode: "research_only",
        needsReview: true,
      },
    });
  }

  return baseCandidate(ticker, "CompanyIndustry", "eligible", {
    sourceType: source.sourceType,
    sourceLabel: source.sourceLabel,
    sourceUrl: source.sourceUrl,
    extractedQuote: source.extractedQuote,
    reviewNote: source.reviewNote ?? "Reviewed provider taxonomy package.",
    warningCodes: Array.from(new Set([...source.warningCodes, "NEEDS_REVIEW", "RESEARCH_ONLY"])),
    payloadChecksum: checksum(source),
    fields: {
      industryCode: source.industryCode,
      roleType: source.roleType,
      mappingConfidence: source.mappingConfidence,
      dataMode: source.dataMode,
      needsReview: source.needsReview,
    },
  });
};

const buildFinancialCandidate = (ticker: CoreTicker): SourceCandidate => {
  const { fields, payloadChecksum } = buildFinancialFields(ticker);
  const metricValues = fields
    ? [fields.eps, fields.sharesOutstanding, fields.totalDebt].filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      )
    : [];

  if (!fields || metricValues.length !== 3 || fields.sourceLabel !== "annual_report_2025_pdf_reviewed_preview") {
    return baseCandidate(ticker, "FinancialStatement", "blocked", {
      reviewNote:
        "No eligible reviewed annual-report financial statement package was found for this ticker.",
      warningCodes: ["FINANCIAL_STATEMENT_SOURCE_MISSING", "NEEDS_REVIEW", "RESEARCH_ONLY"],
      eligibleForSourceConfirmWrite: false,
      blocker: "reviewed_financial_statement_source_missing",
      fields: {
        eps: null,
        sharesOutstanding: null,
        totalDebt: null,
        cfo: null,
        dataMode: "research_only",
        needsReview: true,
      },
    });
  }

  return baseCandidate(ticker, "FinancialStatement", "eligible", {
    sourceType: "manual_reviewed_annual_report_preview",
    sourceLabel: fields.sourceLabel,
    sourceUrl: null,
    extractedQuote: fields.extractedQuote,
    reviewNote: fields.reviewNote,
    warningCodes: [
      "ANNUAL_REPORT_PDF_REVIEWED_PREVIEW",
      "NEEDS_REVIEW",
      "RESEARCH_ONLY",
      "TOTAL_DEBT_NOT_TOTAL_LIABILITIES",
    ],
    payloadChecksum,
    fields: {
      fiscalYear: fields.fiscalYear,
      periodType: "annual",
      eps: fields.eps,
      epsUnit: fields.epsUnit,
      sharesOutstanding: fields.sharesOutstanding,
      sharesOutstandingUnit: fields.sharesOutstandingUnit,
      totalDebt: fields.totalDebt,
      totalDebtUnit: fields.totalDebtUnit,
      cfo: null,
      dataMode: "research_only",
      needsReview: true,
    },
  });
};

const buildMarketPriceCandidate = (ticker: CoreTicker): SourceCandidate =>
  baseCandidate(ticker, "MarketPrice", "blocked", {
    reviewNote:
      "No reviewed local MarketPrice snapshot package was found for this ticker. Provider/staging scripts were not run and are not treated as source rows in this dry-run.",
    warningCodes: ["MARKET_PRICE_SOURCE_MISSING", "NO_PROVIDER_FETCH", "NEEDS_REVIEW", "RESEARCH_ONLY"],
    eligibleForSourceConfirmWrite: false,
    blocker: "reviewed_market_price_source_missing",
    fields: {
      closePrice: null,
      volume: null,
      tradingValue: null,
      priceDate: null,
      dataMode: "research_only",
      needsReview: true,
    },
  });

const sourceCandidates = coreTickers.flatMap((ticker) => [
  buildCompanyCandidate(ticker),
  buildCompanyIndustryCandidate(ticker),
  buildFinancialCandidate(ticker),
  buildMarketPriceCandidate(ticker),
]);

const byTicker = Object.fromEntries(
  coreTickers.map((ticker) => {
    const candidates = sourceCandidates.filter((candidate) => candidate.ticker === ticker);
    const eligible = candidates.filter((candidate) => candidate.status === "eligible");
    const blocked = candidates.filter((candidate) => candidate.status !== "eligible");
    const allRequiredReady = candidates.every((candidate) => candidate.status === "eligible");

    return [
      ticker,
      {
        sourceRows: candidates.map((candidate) => ({
          rowKind: candidate.rowKind,
          status: candidate.status,
          eligibleForSourceConfirmWrite: candidate.eligibleForSourceConfirmWrite,
          sourceLabel: candidate.sourceLabel,
          blocker: candidate.blocker,
          fields: candidate.fields,
        })),
        eligibleSourceRowKinds: eligible.map((candidate) => candidate.rowKind),
        blockedSourceRowKinds: blocked.map((candidate) => candidate.rowKind),
        missingSourceRows: blocked.map((candidate) => ({
          rowKind: candidate.rowKind,
          blocker: candidate.blocker,
        })),
        readyForSourceConfirmWrite: allRequiredReady,
        wouldEnableScreeningBackfillRerun: allRequiredReady,
      },
    ];
  }),
);

const scannedText = JSON.stringify(sourceCandidates);
const forbiddenAdviceDetected = forbiddenAdvicePatterns.some((pattern) => pattern.test(scannedText));
const productionApprovedTrueCount = sourceCandidates.filter((candidate) => candidate.productionApproved).length;
const eligibleSourceRowsPrepared = sourceCandidates.filter((candidate) => candidate.status === "eligible").length;
const blockedSourceRows = sourceCandidates.filter((candidate) => candidate.status !== "eligible").length;
const tickersReadyForSourceConfirmWrite = coreTickers.filter(
  (ticker) => byTicker[ticker].readyForSourceConfirmWrite,
);
const tickersBlocked = coreTickers.filter((ticker) => !byTicker[ticker].readyForSourceConfirmWrite);

const summary = {
  phase,
  mode: "dry_run",
  candidateTickers: coreTickers,
  companyCandidatesPrepared: sourceCandidates.filter((candidate) => candidate.rowKind === "Company").length,
  companyIndustryCandidatesPrepared: sourceCandidates.filter((candidate) => candidate.rowKind === "CompanyIndustry").length,
  financialStatementCandidatesPrepared: sourceCandidates.filter((candidate) => candidate.rowKind === "FinancialStatement").length,
  marketPriceCandidatesPrepared: sourceCandidates.filter((candidate) => candidate.rowKind === "MarketPrice").length,
  eligibleSourceRowsPrepared,
  blockedSourceRows,
  missingSourceRows: blockedSourceRows,
  readyForSourceConfirmWriteByTicker: Object.fromEntries(
    coreTickers.map((ticker) => [ticker, byTicker[ticker].readyForSourceConfirmWrite]),
  ),
  wouldEnableScreeningBackfillRerunByTicker: Object.fromEntries(
    coreTickers.map((ticker) => [ticker, byTicker[ticker].wouldEnableScreeningBackfillRerun]),
  ),
  tickersReadyForSourceConfirmWrite,
  tickersBlocked,
  sourceCandidatesByTicker: byTicker,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  uiChanged: false,
  assistantChanged: false,
  screeningCandidateWriteAttempted: false,
  productionApprovedTrueCount,
  hsgNkgUntouched: true,
  tvnPresent: scannedText.includes("TVN"),
  rankingCreated: false,
  stockAttractivenessScoreCreated: false,
  industryMetricCreated: false,
  benchmarkCreated: false,
  forbiddenAdviceDetected,
  smokePassed:
    !forbiddenAdviceDetected &&
    productionApprovedTrueCount === 0 &&
    !scannedText.includes("TVN") &&
    eligibleSourceRowsPrepared === 8,
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.smokePassed) {
  process.exitCode = 1;
}
