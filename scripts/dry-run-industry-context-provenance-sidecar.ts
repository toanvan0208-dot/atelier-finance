import { readFileSync } from "node:fs";
import {
  loadIndustryContextByTicker,
  loadIndustryContextRuntimeByTicker,
} from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const SUPPORTED_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN", "VCB"] as const;

type SupportedTicker = (typeof SUPPORTED_TICKERS)[number];

type SidecarAvailability = {
  sidecarModelFound: boolean;
  sidecarDbTableReadable: boolean;
  provenanceRowsExisting: number;
  sidecarReadError: string | null;
};

type DryRunTickerResult = {
  ticker: SupportedTicker;
  industryContextFound: boolean;
  industryContextId: string | null;
  industryName: string | null;
  currentSourceLabel: string | null;
  dataMode: "research_only" | "missing";
  productionApproved: false;
  needsReview: true;
  candidateProvenanceRowsGenerated: 0;
  readyForReviewedImport: false;
  blockedReasons: string[];
  legacyMockLabeledTextSuppressed: boolean;
  proposedFutureSidecarFields: {
    sourceLabel: string | null;
    sourceUrl: null;
    sourceType: "reviewed_industry_context_source" | null;
    publicationDate: null;
    retrievedAt: null;
    extractedQuote: null;
    reviewNote: string;
    warningCodes: string[];
  };
};

const schema = readFileSync("prisma/schema.prisma", "utf-8");

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const summarizeError = (error: unknown): string =>
  error instanceof Error
    ? error.message
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean) ?? error.name
    : String(error);

const inspectSidecarAvailability = async (): Promise<SidecarAvailability> => {
  const sidecarModelFound = /model\s+IndustryContextProvenance\s+\{/.test(schema);

  if (!sidecarModelFound) {
    return {
      sidecarModelFound,
      sidecarDbTableReadable: false,
      provenanceRowsExisting: 0,
      sidecarReadError: "SIDECAR_MODEL_NOT_FOUND_IN_SCHEMA",
    };
  }

  try {
    const provenanceRowsExisting = await prisma.industryContextProvenance.count();
    return {
      sidecarModelFound,
      sidecarDbTableReadable: true,
      provenanceRowsExisting,
      sidecarReadError: null,
    };
  } catch (error) {
    return {
      sidecarModelFound,
      sidecarDbTableReadable: false,
      provenanceRowsExisting: 0,
      sidecarReadError: `SIDECAR_TABLE_NOT_APPLIED_OR_NOT_READABLE: ${summarizeError(error)}`,
    };
  }
};

const buildTickerResult = async (ticker: SupportedTicker): Promise<DryRunTickerResult> => {
  const industryContextRow = await loadIndustryContextByTicker(ticker);
  const runtimePayload = await loadIndustryContextRuntimeByTicker(ticker);
  const context = runtimePayload.context;
  const warningCodes = context?.warningCodes ?? ["INDUSTRY_CONTEXT_MISSING"];
  const legacyMockLabeledTextSuppressed = warningCodes.includes("LEGACY_MOCK_LABELED_FIELD_SUPPRESSED");
  const qualitativeContextAvailable = Boolean(
    context?.industryName &&
      (context.industryOverview || context.keyDrivers || context.industryRisks),
  );
  const blockedReasons = unique(
    [
      context ? null : "MISSING_INDUSTRY_CONTEXT",
      context ? "MISSING_REAL_SOURCE_URL" : null,
      context ? "MISSING_PUBLICATION_DATE" : null,
      context ? "MISSING_EXTRACTED_QUOTE_OR_REVIEW_NOTE" : null,
      legacyMockLabeledTextSuppressed ? "LEGACY_MOCK_LABELED_TEXT_SUPPRESSED" : null,
      context && !qualitativeContextAvailable ? "QUALITATIVE_CONTEXT_INCOMPLETE_AFTER_SUPPRESSION" : null,
    ].filter((reason): reason is string => Boolean(reason)),
  ).sort();

  return {
    ticker,
    industryContextFound: Boolean(context),
    industryContextId: industryContextRow?.id ?? null,
    industryName: context?.industryName ?? null,
    currentSourceLabel: context?.sourceLabel ?? null,
    dataMode: context ? "research_only" : "missing",
    productionApproved: false,
    needsReview: true,
    candidateProvenanceRowsGenerated: 0,
    readyForReviewedImport: false,
    blockedReasons,
    legacyMockLabeledTextSuppressed,
    proposedFutureSidecarFields: {
      sourceLabel: context?.sourceLabel ?? null,
      sourceUrl: null,
      sourceType: context ? "reviewed_industry_context_source" : null,
      publicationDate: null,
      retrievedAt: null,
      extractedQuote: null,
      reviewNote:
        "Dry-run only. A future reviewed import must supply real sourceUrl, publicationDate, and extractedQuote or reviewNote before writing IndustryContextProvenance.",
      warningCodes,
    },
  };
};

async function main() {
  const sidecarAvailability = await inspectSidecarAvailability();
  const currentIndustryContextRowsFound = await prisma.industryContext.count();
  const productionApprovedTrueCount = await prisma.industryContext.count({
    where: { productionApproved: true },
  });
  const industryContextNeedsReviewTrueCount = await prisma.industryContext.count({
    where: { needsReview: true },
  });
  const tickerResults = await Promise.all(SUPPORTED_TICKERS.map(buildTickerResult));
  const blockedRows = tickerResults.filter((row) => row.blockedReasons.length > 0);
  const blockedReasons = unique(blockedRows.flatMap((row) => row.blockedReasons)).sort();

  const result = {
    phase: "150D",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: true,
    sidecarModelFound: sidecarAvailability.sidecarModelFound,
    sidecarDbTableReadable: sidecarAvailability.sidecarDbTableReadable,
    sidecarReadError: sidecarAvailability.sidecarReadError,
    currentIndustryContextRowsFound,
    provenanceRowsExisting: sidecarAvailability.provenanceRowsExisting,
    candidateProvenanceRowsGenerated: 0,
    readyForReviewedImportCount: 0,
    blockedRowsCount: blockedRows.length,
    blockedReasons,
    tickersChecked: [...SUPPORTED_TICKERS],
    tickersWithMissingContext: tickerResults
      .filter((row) => row.blockedReasons.includes("MISSING_INDUSTRY_CONTEXT"))
      .map((row) => row.ticker),
    tickersWithMissingRealSourceUrl: tickerResults
      .filter((row) => row.blockedReasons.includes("MISSING_REAL_SOURCE_URL"))
      .map((row) => row.ticker),
    legacyMockLabeledTextSuppressed: tickerResults.some((row) => row.legacyMockLabeledTextSuppressed),
    tickersWithLegacySuppressedText: tickerResults
      .filter((row) => row.legacyMockLabeledTextSuppressed)
      .map((row) => row.ticker),
    sidecarSchemaReadyForFutureReviewedImport: sidecarAvailability.sidecarModelFound,
    fakeSourceUrlInvented: false,
    staticGuidancePromotedToRealData: false,
    numericIndustryMetricsInvented: false,
    valuationRiskBenchmarksInvented: false,
    productionApprovedTrueCount,
    needsReviewTrueCount: sidecarAvailability.provenanceRowsExisting,
    industryContextNeedsReviewTrueCount,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    tickerResults,
    recommendedNextPhase:
      "Phase 150E should collect reviewed source URLs/publication dates/extracted quotes, then confirm-write IndustryContextProvenance rows only for rows that pass the contract.",
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    result.schemaChanged &&
    result.sidecarModelFound &&
    result.currentIndustryContextRowsFound === 5 &&
    result.provenanceRowsExisting === 0 &&
    result.candidateProvenanceRowsGenerated === 0 &&
    result.readyForReviewedImportCount === 0 &&
    result.blockedRowsCount === SUPPORTED_TICKERS.length &&
    result.tickersWithMissingContext.includes("VCB") &&
    result.tickersWithMissingRealSourceUrl.length === 5 &&
    result.legacyMockLabeledTextSuppressed &&
    !result.fakeSourceUrlInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.numericIndustryMetricsInvented &&
    !result.valuationRiskBenchmarksInvented &&
    result.productionApprovedTrueCount === 0 &&
    !result.missingDataZeroFilled &&
    !result.investmentAdviceAdded;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(summarizeError(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
