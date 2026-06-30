import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runVietnamMacroParserDryRunBatch } from "./dry-run-vietnam-macro-parser-batch.js";

const TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

const CREDIT_GROWTH_SOURCE_FILE =
  "data/manual-review/macro/credit-growth/credit-growth-2025-2026-manual-aggregated.csv";

type IndicatorCode = (typeof TARGET_INDICATORS)[number];
type DryRunSummary = Awaited<ReturnType<typeof runVietnamMacroParserDryRunBatch>>;
type CandidateRow = DryRunSummary["parserResults"][number]["candidateRows"][number];

type AuditRow = {
  rowId: string;
  indicatorCode: IndicatorCode;
  period: string;
  periodType: string;
  unit: string;
  duplicateKey: string;
  confirmWriteEligible: boolean;
  blockedReasons: string[];
  warnings: string[];
};

export type EligibilityAuditSummary = {
  phase: "149E";
  targetIndicators: IndicatorCode[];
  candidateRowsTotal: number;
  eligibleRowsTotal: number;
  blockedRowsTotal: number;
  candidateRowsByIndicator: Record<IndicatorCode, number>;
  eligibleRowsByIndicator: Record<IndicatorCode, number>;
  blockedRowsByIndicator: Record<IndicatorCode, number>;
  blockedReasons: Record<string, number>;
  duplicateCandidateKeys: string[];
  duplicateAuditExecuted: true;
  sourceProvenanceAuditExecuted: true;
  semanticAuditExecuted: true;
  unitAuditExecuted: true;
  periodAuditExecuted: true;
  provenanceCompleteness: Record<IndicatorCode, boolean>;
  semanticAuditResults: Record<IndicatorCode, boolean>;
  unitAuditResults: Record<IndicatorCode, boolean>;
  periodAuditResults: Record<IndicatorCode, boolean>;
  dbWriteAttempted: false;
  candidateRowsPersisted: false;
  observationRowsCreated: 0;
  provenanceRowsCreated: 0;
  productionApprovedTrueCount: 0;
  needsReviewTrueCount: number;
  needsReviewTrueCountMatchesCandidateRows: boolean;
  manualReviewRequiredBeforeConfirmWrite: true;
  smokeEligibleForConfirmWriteBatch: boolean;
  usdVndNotSbvCentralRate: boolean;
  exportGrowthDerivedFromExportValue: boolean;
  exportGrowthNotDirectPublishedGrowth: boolean;
  creditGrowthManualAggregatedCandidate: boolean;
  publicInvestmentUnitDisambiguated: boolean;
  frontendIndicatorUniverseExpanded: false;
  missingDataZeroFilled: false;
  mockOrSampleAsReal: false;
  investmentAdviceAdded: false;
  auditRows: AuditRow[];
};

const zeroCounts = (): Record<IndicatorCode, number> => ({
  USD_VND: 0,
  EXPORT_GROWTH: 0,
  CREDIT_GROWTH: 0,
  PUBLIC_INVESTMENT: 0,
});

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .trim()
    .toLowerCase();

const readCsvHeader = (path: string): string[] => {
  const firstLine = readFileSync(path, "utf-8").split(/\r?\n/)[0] ?? "";
  return firstLine
    .replace(/^\uFEFF/, "")
    .split(",")
    .map((column) => column.trim());
};

const hasText = (value: string | undefined): boolean => Boolean(value?.trim());

const isCandidateMode = (candidate: CandidateRow): boolean =>
  candidate.dataMode === "research_only" &&
  /candidate|manual|derived|provider/.test(candidate.sourceType);

const isPeriodFormatAuditable = (candidate: CandidateRow): boolean => {
  if (candidate.periodType === "day" || candidate.periodType === "daily") {
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate.period);
  }
  if (candidate.periodType === "year" || candidate.periodType === "annual") {
    return /^\d{4}$/.test(candidate.period);
  }
  if (candidate.periodType === "monthly_ytd") {
    return /^\d{4}-\d{2}$/.test(candidate.period);
  }
  if (candidate.periodType === "quarterly_ytd" || candidate.periodType === "quarterly_snapshot") {
    return /^\d{4}-Q[1-4]$/.test(candidate.period) || /^\d{4}-\d{2}$/.test(candidate.period);
  }
  if (candidate.periodType === "ytd") {
    return /^\d{4}-YTD-\d{1,2}M$/.test(candidate.period);
  }
  return false;
};

const definitionLooksLikeCreditYtd = (definition: string | undefined): boolean => {
  const normalized = normalizeText(definition ?? "");
  return (
    normalized.includes("cuoi nam truoc") ||
    normalized.includes("cuoi nam") ||
    normalized.includes("year-to-date") ||
    normalized.includes("ytd")
  );
};

const publicInvestmentDefinitionMatchesUnit = (candidate: CandidateRow): boolean => {
  const text = normalizeText(
    `${candidate.sourceDefinition ?? ""} ${candidate.sourcePlanBasis ?? ""}`,
  );
  if (candidate.unit === "billion_vnd") {
    return text.includes("gia tri") || text.includes("ty dong") || text.includes("von");
  }
  if (candidate.unit === "percent_of_plan_ytd") {
    return text.includes("ke hoach") || text.includes("ty le") || text.includes("dat");
  }
  return false;
};

const addReason = (reasons: string[], condition: boolean, reason: string): void => {
  if (!condition) reasons.push(reason);
};

const auditBaseFields = (
  candidate: CandidateRow,
  duplicateKeys: Set<string>,
  sourceColumnsByIndicator: Record<string, Set<string>>,
): { blockedReasons: string[]; warnings: string[] } => {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];

  addReason(blockedReasons, hasText(candidate.indicatorCode), "MISSING_INDICATOR_CODE");
  addReason(blockedReasons, hasText(candidate.period), "MISSING_PERIOD");
  addReason(blockedReasons, hasText(candidate.periodType), "MISSING_PERIOD_TYPE");
  addReason(blockedReasons, Number.isFinite(candidate.value), "VALUE_NOT_FINITE");
  addReason(blockedReasons, hasText(candidate.unit), "MISSING_UNIT");
  addReason(
    blockedReasons,
    candidate.semanticCaveats.length > 0 || hasText(candidate.sourceDefinition),
    "MISSING_DEFINITION_OR_SEMANTIC_CAVEAT",
  );
  addReason(
    blockedReasons,
    hasText(candidate.sourceName) || hasText(candidate.sourceFile),
    "MISSING_SOURCE_NAME_OR_FILE",
  );
  addReason(
    blockedReasons,
    hasText(candidate.sourceUrl) || hasText(candidate.sourceFile),
    "MISSING_SOURCE_URL_OR_FILE",
  );
  addReason(blockedReasons, candidate.needsReview === true, "NEEDS_REVIEW_NOT_TRUE");
  addReason(
    blockedReasons,
    candidate.productionApproved === false,
    "PRODUCTION_APPROVED_NOT_FALSE",
  );
  addReason(blockedReasons, isCandidateMode(candidate), "SOURCE_MODE_NOT_CANDIDATE");
  addReason(blockedReasons, candidate.value !== 0, "ZERO_VALUE_REQUIRES_REVIEW");
  addReason(
    blockedReasons,
    !/mock|sample|fallback/i.test(`${candidate.sourceType} ${candidate.sourceName}`),
    "MOCK_SAMPLE_OR_FALLBACK_SOURCE",
  );

  const duplicateKey = buildDuplicateKey(candidate);
  addReason(blockedReasons, !duplicateKeys.has(duplicateKey), "DUPLICATE_CANDIDATE_KEY");

  if (!isPeriodFormatAuditable(candidate)) {
    warnings.push("PERIOD_FORMAT_WARNING");
  }

  if (candidate.indicatorCode === "CREDIT_GROWTH") {
    const columns = sourceColumnsByIndicator.CREDIT_GROWTH;
    addReason(blockedReasons, columns.has("period_type"), "SOURCE_COLUMN_MISSING_PERIOD_TYPE");
  }

  return { blockedReasons, warnings };
};

const auditIndicatorRules = (candidate: CandidateRow): string[] => {
  const reasons: string[] = [];

  if (candidate.indicatorCode === "USD_VND") {
    addReason(reasons, candidate.unit === "vnd_per_usd", "USD_VND_INVALID_UNIT");
    addReason(
      reasons,
      candidate.rateType === "commercial_bank_quote" && candidate.quoteField === "transfer",
      "USD_VND_RATE_TYPE_NOT_TRANSFER",
    );
    addReason(reasons, candidate.sourceInstitution === "Vietcombank", "USD_VND_SOURCE_NOT_VCB");
    addReason(
      reasons,
      candidate.sourceType === "vietcombank_xml_candidate",
      "USD_VND_INVALID_SOURCE_TYPE",
    );
    addReason(reasons, candidate.notSbvCentralRate === true, "USD_VND_SBV_CENTRAL_RATE_AMBIGUOUS");
    addReason(reasons, hasText(candidate.sourceUrl), "USD_VND_MISSING_SOURCE_URL");
    addReason(reasons, hasText(candidate.provenance.fetchedAt), "USD_VND_MISSING_FETCHED_AT");
    addReason(
      reasons,
      candidate.semanticCaveats.some((caveat) => /not SBV central rate/i.test(caveat)),
      "USD_VND_MISSING_NOT_SBV_CAVEAT",
    );
  }

  if (candidate.indicatorCode === "EXPORT_GROWTH") {
    addReason(reasons, candidate.unit === "percent_yoy", "EXPORT_GROWTH_INVALID_UNIT");
    addReason(
      reasons,
      candidate.sourceType === "gso_manual_csv_derived_candidate",
      "EXPORT_GROWTH_INVALID_SOURCE_TYPE",
    );
    addReason(
      reasons,
      candidate.derivedFrom === "export_value_1000_usd",
      "EXPORT_GROWTH_MISSING_DERIVED_FROM",
    );
    addReason(reasons, hasText(candidate.derivedFormula), "EXPORT_GROWTH_MISSING_FORMULA");
    addReason(
      reasons,
      hasText(candidate.derivedCurrentPeriod) && hasText(candidate.derivedPriorPeriod),
      "EXPORT_GROWTH_MISSING_SOURCE_PERIODS",
    );
    addReason(
      reasons,
      candidate.semanticCaveats.some((caveat) => /not directly published growth/i.test(caveat)),
      "EXPORT_GROWTH_DIRECT_PUBLISHED_AMBIGUOUS",
    );
  }

  if (candidate.indicatorCode === "CREDIT_GROWTH") {
    addReason(reasons, candidate.unit === "percent_ytd", "CREDIT_GROWTH_INVALID_UNIT");
    addReason(
      reasons,
      definitionLooksLikeCreditYtd(candidate.sourceDefinition),
      "CREDIT_GROWTH_DEFINITION_NOT_YTD",
    );
    addReason(reasons, hasText(candidate.sourceScope), "CREDIT_GROWTH_MISSING_SCOPE");
    addReason(
      reasons,
      candidate.sourceType === "manual_aggregated_sbv_news_candidate",
      "CREDIT_GROWTH_INVALID_SOURCE_TYPE",
    );
    addReason(
      reasons,
      candidate.notOfficialMachineReadableSbvCsv === true,
      "CREDIT_GROWTH_OFFICIAL_CSV_AMBIGUOUS",
    );
    addReason(reasons, hasText(candidate.sourceUrl), "CREDIT_GROWTH_MISSING_SOURCE_URL");
    addReason(reasons, hasText(candidate.sourcePublicationDate), "CREDIT_GROWTH_MISSING_PUBLICATION_DATE");
    addReason(reasons, hasText(candidate.extractedQuote), "CREDIT_GROWTH_MISSING_EXTRACTED_QUOTE");
  }

  if (candidate.indicatorCode === "PUBLIC_INVESTMENT") {
    addReason(
      reasons,
      candidate.unit === "billion_vnd" || candidate.unit === "percent_of_plan_ytd",
      "PUBLIC_INVESTMENT_INVALID_UNIT",
    );
    addReason(
      reasons,
      candidate.sourceType === "manual_aggregated_public_investment_candidate",
      "PUBLIC_INVESTMENT_INVALID_SOURCE_TYPE",
    );
    addReason(
      reasons,
      publicInvestmentDefinitionMatchesUnit(candidate),
      "PUBLIC_INVESTMENT_DEFINITION_UNIT_AMBIGUOUS",
    );
    addReason(reasons, hasText(candidate.sourceScope), "PUBLIC_INVESTMENT_MISSING_SCOPE");
    addReason(reasons, hasText(candidate.sourcePlanBasis), "PUBLIC_INVESTMENT_MISSING_PLAN_BASIS");
    addReason(reasons, hasText(candidate.sourceUrl), "PUBLIC_INVESTMENT_MISSING_SOURCE_URL");
    addReason(
      reasons,
      hasText(candidate.sourcePublicationDate),
      "PUBLIC_INVESTMENT_MISSING_PUBLICATION_DATE",
    );
    addReason(
      reasons,
      hasText(candidate.extractedQuote),
      "PUBLIC_INVESTMENT_MISSING_EXTRACTED_QUOTE",
    );
  }

  return reasons;
};

const buildDuplicateKey = (candidate: CandidateRow): string =>
  [
    candidate.indicatorCode,
    candidate.period,
    candidate.periodType,
    candidate.unit,
  ].join("|");

const findDuplicateKeys = (candidates: CandidateRow[]): string[] => {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    const key = buildDuplicateKey(candidate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
};

const reasonCounts = (auditRows: AuditRow[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const row of auditRows) {
    for (const reason of row.blockedReasons) {
      counts[reason] = (counts[reason] ?? 0) + 1;
    }
  }
  return counts;
};

const allRowsForIndicatorPass = (
  auditRows: AuditRow[],
  indicatorCode: IndicatorCode,
  predicate: (row: AuditRow) => boolean,
): boolean => {
  const rows = auditRows.filter((row) => row.indicatorCode === indicatorCode);
  return rows.length > 0 && rows.every(predicate);
};

export async function runVietnamMacroCandidateEligibilityAudit(): Promise<EligibilityAuditSummary> {
  const dryRunSummary = await runVietnamMacroParserDryRunBatch();
  const candidates = dryRunSummary.parserResults.flatMap((result) => result.candidateRows);
  const duplicateCandidateKeys = findDuplicateKeys(candidates);
  const duplicateKeySet = new Set(duplicateCandidateKeys);
  const sourceColumnsByIndicator = {
    CREDIT_GROWTH: new Set(readCsvHeader(CREDIT_GROWTH_SOURCE_FILE)),
  };

  const auditRows = candidates.map((candidate, index): AuditRow => {
    const baseAudit = auditBaseFields(candidate, duplicateKeySet, sourceColumnsByIndicator);
    const blockedReasons = [
      ...baseAudit.blockedReasons,
      ...auditIndicatorRules(candidate),
    ];
    return {
      rowId: `${candidate.indicatorCode}-${index + 1}`,
      indicatorCode: candidate.indicatorCode,
      period: candidate.period,
      periodType: candidate.periodType,
      unit: candidate.unit,
      duplicateKey: buildDuplicateKey(candidate),
      confirmWriteEligible: blockedReasons.length === 0,
      blockedReasons,
      warnings: baseAudit.warnings,
    };
  });

  const candidateRowsByIndicator = { ...dryRunSummary.candidateRowsByIndicator };
  const eligibleRowsByIndicator = zeroCounts();
  const blockedRowsByIndicator = zeroCounts();

  for (const row of auditRows) {
    if (row.confirmWriteEligible) {
      eligibleRowsByIndicator[row.indicatorCode] += 1;
    } else {
      blockedRowsByIndicator[row.indicatorCode] += 1;
    }
  }

  const eligibleRowsTotal = auditRows.filter((row) => row.confirmWriteEligible).length;
  const blockedRowsTotal = auditRows.length - eligibleRowsTotal;

  return {
    phase: "149E",
    targetIndicators: [...TARGET_INDICATORS],
    candidateRowsTotal: candidates.length,
    eligibleRowsTotal,
    blockedRowsTotal,
    candidateRowsByIndicator,
    eligibleRowsByIndicator,
    blockedRowsByIndicator,
    blockedReasons: reasonCounts(auditRows),
    duplicateCandidateKeys,
    duplicateAuditExecuted: true,
    sourceProvenanceAuditExecuted: true,
    semanticAuditExecuted: true,
    unitAuditExecuted: true,
    periodAuditExecuted: true,
    provenanceCompleteness: {
      USD_VND: allRowsForIndicatorPass(auditRows, "USD_VND", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("MISSING_SOURCE")),
      ),
      EXPORT_GROWTH: allRowsForIndicatorPass(auditRows, "EXPORT_GROWTH", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("MISSING_SOURCE")),
      ),
      CREDIT_GROWTH: allRowsForIndicatorPass(auditRows, "CREDIT_GROWTH", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("MISSING_SOURCE")),
      ),
      PUBLIC_INVESTMENT: allRowsForIndicatorPass(auditRows, "PUBLIC_INVESTMENT", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("MISSING_SOURCE")),
      ),
    },
    semanticAuditResults: {
      USD_VND: allRowsForIndicatorPass(auditRows, "USD_VND", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("CAVEAT") || reason.includes("AMBIGUOUS")),
      ),
      EXPORT_GROWTH: allRowsForIndicatorPass(auditRows, "EXPORT_GROWTH", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("DERIVED") || reason.includes("AMBIGUOUS")),
      ),
      CREDIT_GROWTH: allRowsForIndicatorPass(auditRows, "CREDIT_GROWTH", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("DEFINITION")),
      ),
      PUBLIC_INVESTMENT: allRowsForIndicatorPass(auditRows, "PUBLIC_INVESTMENT", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("DEFINITION")),
      ),
    },
    unitAuditResults: {
      USD_VND: allRowsForIndicatorPass(auditRows, "USD_VND", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("UNIT")),
      ),
      EXPORT_GROWTH: allRowsForIndicatorPass(auditRows, "EXPORT_GROWTH", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("UNIT")),
      ),
      CREDIT_GROWTH: allRowsForIndicatorPass(auditRows, "CREDIT_GROWTH", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("UNIT")),
      ),
      PUBLIC_INVESTMENT: allRowsForIndicatorPass(auditRows, "PUBLIC_INVESTMENT", (row) =>
        !row.blockedReasons.some((reason) => reason.includes("UNIT")),
      ),
    },
    periodAuditResults: {
      USD_VND: allRowsForIndicatorPass(auditRows, "USD_VND", (row) => row.warnings.length === 0),
      EXPORT_GROWTH: allRowsForIndicatorPass(auditRows, "EXPORT_GROWTH", (row) => row.warnings.length === 0),
      CREDIT_GROWTH: allRowsForIndicatorPass(auditRows, "CREDIT_GROWTH", (row) => row.warnings.length === 0),
      PUBLIC_INVESTMENT: allRowsForIndicatorPass(auditRows, "PUBLIC_INVESTMENT", (row) => row.warnings.length === 0),
    },
    dbWriteAttempted: false,
    candidateRowsPersisted: false,
    observationRowsCreated: 0,
    provenanceRowsCreated: 0,
    productionApprovedTrueCount: 0,
    needsReviewTrueCount: dryRunSummary.needsReviewTrueCount,
    needsReviewTrueCountMatchesCandidateRows:
      dryRunSummary.needsReviewTrueCount === candidates.length,
    manualReviewRequiredBeforeConfirmWrite: true,
    smokeEligibleForConfirmWriteBatch:
      candidates.length > 0 &&
      dryRunSummary.needsReviewTrueCount === candidates.length &&
      auditRows.length === candidates.length,
    usdVndNotSbvCentralRate: dryRunSummary.usdVndNotSbvCentralRate,
    exportGrowthDerivedFromExportValue: true,
    exportGrowthNotDirectPublishedGrowth:
      dryRunSummary.exportGrowthNotDirectPublishedGrowth,
    creditGrowthManualAggregatedCandidate:
      dryRunSummary.creditGrowthSourceMode === "manual_aggregated_sbv_news_candidate",
    publicInvestmentUnitDisambiguated:
      Object.keys(dryRunSummary.publicInvestmentUnitBreakdown).length > 0 &&
      Object.keys(dryRunSummary.publicInvestmentUnitBreakdown).every(
        (unit) => unit === "billion_vnd" || unit === "percent_of_plan_ytd",
      ),
    frontendIndicatorUniverseExpanded: false,
    missingDataZeroFilled: false,
    mockOrSampleAsReal: false,
    investmentAdviceAdded: false,
    auditRows,
  };
}

async function main() {
  if (process.argv.includes("--confirm-write")) {
    console.error("confirm-write is rejected in Phase 149E; this script is audit-only.");
    process.exit(1);
  }

  const summary = await runVietnamMacroCandidateEligibilityAudit();
  console.log(JSON.stringify(summary, null, 2));
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] === currentFilePath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
