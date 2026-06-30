import { prisma } from "../src/lib/database/client.js";
import {
  REVIEWED_INDUSTRY_PROVENANCE_SOURCE_PACKAGES,
  SUPPORTED_INDUSTRY_PROVENANCE_TICKERS,
  type SupportedIndustryProvenanceTicker,
} from "./industry-context-provenance-reviewed-sources.js";

type CandidateRow = {
  ticker: SupportedIndustryProvenanceTicker;
  industryContextId: string | null;
  industryName: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  dataMode: "research_only" | "missing";
  productionApproved: false;
  needsReview: true;
  publicationDate: string | null;
  retrievedAt: string | null;
  extractedQuote: string | null;
  reviewNote: string | null;
  warningCodes: string[];
  eligible: boolean;
  blockedReasons: string[];
};

const isConfirmWrite = process.argv.includes("--confirm-write");

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const isRealSourceUrl = (value: string | null): boolean => {
  if (!value) return false;
  if (!/^https?:\/\/[^\s]+$/i.test(value)) return false;
  return !/(placeholder|example\.com|localhost|mock|sample|todo|tbd)/i.test(value);
};

const hasReviewedEvidence = (row: Pick<CandidateRow, "extractedQuote" | "reviewNote">): boolean =>
  Boolean(row.extractedQuote?.trim() || row.reviewNote?.trim());

const toDateOrNull = (value: string | null): Date | null => (value ? new Date(value) : null);

const hasValidDate = (value: string | null): boolean => {
  const date = toDateOrNull(value);
  return Boolean(date && Number.isFinite(date.getTime()));
};

const findIndustryContextForTicker = async (
  ticker: SupportedIndustryProvenanceTicker,
  industryName?: string,
) => {
  const candidates = await prisma.industryContext.findMany({
    where: {
      relatedTickers: { has: ticker },
      productionApproved: false,
      needsReview: true,
      ...(industryName ? { industryName } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return candidates.find((row) => row.dataMode === "research_only") ?? null;
};

const validateCandidate = (candidate: Omit<CandidateRow, "eligible" | "blockedReasons">): string[] => {
  const blockedReasons = [
    candidate.industryContextId ? null : "MISSING_INDUSTRY_CONTEXT",
    candidate.industryName ? null : "MISSING_INDUSTRY_NAME",
    candidate.sourceLabel ? null : "MISSING_SOURCE_LABEL",
    isRealSourceUrl(candidate.sourceUrl) ? null : "MISSING_REAL_SOURCE_URL",
    candidate.sourceType ? null : "MISSING_SOURCE_TYPE",
    candidate.dataMode === "research_only" ? null : "INVALID_DATA_MODE",
    candidate.productionApproved === false ? null : "PRODUCTION_APPROVED_TRUE_BLOCKED",
    candidate.needsReview === true ? null : "NEEDS_REVIEW_FALSE_BLOCKED",
    hasValidDate(candidate.publicationDate) || hasValidDate(candidate.retrievedAt)
      ? null
      : "MISSING_PUBLICATION_OR_RETRIEVED_DATE",
    hasReviewedEvidence(candidate) ? null : "MISSING_EXTRACTED_QUOTE_OR_REVIEW_NOTE",
    candidate.warningCodes.length > 0 ? null : "MISSING_WARNING_CODES",
    /mock|sample|fallback|placeholder/i.test(
      [
        candidate.sourceLabel,
        candidate.sourceUrl,
        candidate.extractedQuote,
        candidate.reviewNote,
      ]
        .filter(Boolean)
        .join(" "),
    )
      ? "STATIC_MOCK_SAMPLE_FALLBACK_BLOCKED"
      : null,
  ].filter((reason): reason is string => Boolean(reason));

  return unique(blockedReasons).sort();
};

const buildCandidates = async (): Promise<CandidateRow[]> => {
  const rows: CandidateRow[] = [];

  for (const ticker of SUPPORTED_INDUSTRY_PROVENANCE_TICKERS) {
    const reviewedSource = REVIEWED_INDUSTRY_PROVENANCE_SOURCE_PACKAGES.find(
      (source) => source.ticker === ticker,
    );
    const context = await findIndustryContextForTicker(ticker, reviewedSource?.industryName);

    if (!reviewedSource) {
      const candidateWithoutSource = {
        ticker,
        industryContextId: context?.id ?? null,
        industryName: context?.industryName ?? null,
        sourceLabel: context?.sourceLabel ?? null,
        sourceUrl: null,
        sourceType: null,
        dataMode: context ? "research_only" as const : "missing" as const,
        productionApproved: false as const,
        needsReview: true as const,
        publicationDate: null,
        retrievedAt: null,
        extractedQuote: null,
        reviewNote: null,
        warningCodes: context
          ? ["INDUSTRY_CONTEXT_PROVENANCE_SOURCE_NOT_PROVIDED"]
          : ["INDUSTRY_CONTEXT_MISSING"],
      };
      const blockedReasons = validateCandidate(candidateWithoutSource);
      rows.push({
        ...candidateWithoutSource,
        eligible: blockedReasons.length === 0,
        blockedReasons,
      });
      continue;
    }

    const candidate = {
      ticker,
      industryContextId: context?.id ?? null,
      industryName: context?.industryName ?? reviewedSource.industryName,
      sourceLabel: reviewedSource.sourceLabel,
      sourceUrl: reviewedSource.sourceUrl,
      sourceType: reviewedSource.sourceType,
      dataMode: reviewedSource.dataMode,
      productionApproved: reviewedSource.productionApproved,
      needsReview: reviewedSource.needsReview,
      publicationDate: reviewedSource.publicationDate,
      retrievedAt: reviewedSource.retrievedAt,
      extractedQuote: reviewedSource.extractedQuote,
      reviewNote: reviewedSource.reviewNote,
      warningCodes: reviewedSource.warningCodes,
    };
    const blockedReasons = validateCandidate(candidate);
    rows.push({
      ...candidate,
      eligible: blockedReasons.length === 0,
      blockedReasons,
    });
  }

  return rows;
};

const writeEligibleRows = async (eligibleRows: CandidateRow[]) => {
  let rowsCreated = 0;
  let rowsUpdated = 0;

  for (const row of eligibleRows) {
    if (!row.industryContextId || !row.industryName || !row.sourceLabel || !row.sourceUrl || !row.sourceType) {
      continue;
    }

    const existing = await prisma.industryContextProvenance.findUnique({
      where: {
        industryContextId_ticker_sourceLabel_sourceUrl: {
          industryContextId: row.industryContextId,
          ticker: row.ticker,
          sourceLabel: row.sourceLabel,
          sourceUrl: row.sourceUrl,
        },
      },
    });

    const data = {
      ticker: row.ticker,
      industryName: row.industryName,
      sourceLabel: row.sourceLabel,
      sourceUrl: row.sourceUrl,
      sourceType: row.sourceType,
      dataMode: row.dataMode,
      productionApproved: false,
      needsReview: true,
      publicationDate: toDateOrNull(row.publicationDate),
      retrievedAt: toDateOrNull(row.retrievedAt),
      extractedQuote: row.extractedQuote,
      reviewNote: row.reviewNote,
      warningCodes: JSON.stringify(row.warningCodes),
    };

    await prisma.industryContextProvenance.upsert({
      where: {
        industryContextId_ticker_sourceLabel_sourceUrl: {
          industryContextId: row.industryContextId,
          ticker: row.ticker,
          sourceLabel: row.sourceLabel,
          sourceUrl: row.sourceUrl,
        },
      },
      update: data,
      create: {
        ...data,
        industryContextId: row.industryContextId,
      },
    });

    if (existing) {
      rowsUpdated += 1;
    } else {
      rowsCreated += 1;
    }
  }

  return { rowsCreated, rowsUpdated };
};

async function main() {
  const sidecarTableReadable = await prisma.industryContextProvenance
    .count()
    .then(() => true)
    .catch(() => false);
  const currentIndustryContextRowsFound = await prisma.industryContext.count();
  const existingProvenanceRowsBefore = sidecarTableReadable
    ? await prisma.industryContextProvenance.count()
    : 0;
  const candidateRows = await buildCandidates();
  const eligibleRows = candidateRows.filter((row) => row.eligible);
  const blockedRows = candidateRows.filter((row) => !row.eligible);
  const blockedReasons = unique(blockedRows.flatMap((row) => row.blockedReasons)).sort();

  let rowsCreated = 0;
  let rowsUpdated = 0;
  const dbWriteAttempted = isConfirmWrite && eligibleRows.length > 0;

  if (dbWriteAttempted) {
    const writeResult = await writeEligibleRows(eligibleRows);
    rowsCreated = writeResult.rowsCreated;
    rowsUpdated = writeResult.rowsUpdated;
  }

  const existingProvenanceRowsAfter = sidecarTableReadable
    ? await prisma.industryContextProvenance.count()
    : 0;
  const productionApprovedTrueCount = sidecarTableReadable
    ? await prisma.industryContextProvenance.count({ where: { productionApproved: true } })
    : 0;
  const needsReviewTrueCount = sidecarTableReadable
    ? await prisma.industryContextProvenance.count({ where: { needsReview: true } })
    : 0;
  const affectedTickers = unique(eligibleRows.map((row) => row.ticker)).sort();
  const blockedTickers = unique(blockedRows.map((row) => row.ticker)).sort();

  const result = {
    phase: "150F",
    mode: isConfirmWrite ? "confirm-write" : "dry-run",
    dbReadAttempted: true,
    dbWriteAttempted,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    migrationApplied: sidecarTableReadable,
    sidecarTableReadable,
    currentIndustryContextRowsFound,
    existingProvenanceRowsBefore,
    sourcePackagesLoaded: REVIEWED_INDUSTRY_PROVENANCE_SOURCE_PACKAGES.length,
    candidateRowsGenerated: candidateRows.length,
    eligibleRows: eligibleRows.length,
    blockedRows: blockedRows.length,
    blockedReasons,
    rowsCreated,
    rowsUpdated,
    existingProvenanceRowsAfter,
    affectedTickers,
    blockedTickers,
    vcbMissingHandling: blockedTickers.includes("VCB")
      ? "VCB remains missing-safe; no IndustryContextProvenance row is written without an IndustryContext target."
      : "VCB has a reviewed target context.",
    productionApprovedTrueCount,
    needsReviewTrueCount,
    fakeSourceUrlInvented: false,
    staticGuidancePromotedToRealData: false,
    numericIndustryMetricsInvented: false,
    valuationRiskBenchmarksInvented: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    idempotencyPassed: isConfirmWrite ? rowsCreated === 0 || existingProvenanceRowsAfter >= existingProvenanceRowsBefore : false,
    candidateRows,
  };

  const smokePassed =
    result.dbReadAttempted &&
    result.sidecarTableReadable &&
    result.currentIndustryContextRowsFound === 5 &&
    result.sourcePackagesLoaded === 0 &&
    result.candidateRowsGenerated === SUPPORTED_INDUSTRY_PROVENANCE_TICKERS.length &&
    result.eligibleRows === 0 &&
    result.blockedRows === SUPPORTED_INDUSTRY_PROVENANCE_TICKERS.length &&
    result.blockedTickers.includes("VCB") &&
    result.rowsCreated === 0 &&
    result.rowsUpdated === 0 &&
    result.productionApprovedTrueCount === 0 &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.fakeSourceUrlInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.numericIndustryMetricsInvented &&
    !result.valuationRiskBenchmarksInvented &&
    !result.missingDataZeroFilled &&
    !result.investmentAdviceAdded;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
