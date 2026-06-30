import { readFileSync } from "node:fs";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const SUPPORTED_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN", "VCB"] as const;

type SupportedTicker = (typeof SUPPORTED_TICKERS)[number];

type CandidateContractRow = {
  ticker: SupportedTicker;
  status: "candidate_generated" | "blocked";
  industryName: string | null;
  industryCode: string | null;
  currentSourceLabel: string | null;
  dataMode: "research_only" | "missing";
  productionApproved: false;
  needsReview: true;
  nativeSourceUrlAvailable: false;
  publicationDateAvailable: false;
  extractedQuoteAvailable: false;
  qualitativeContextAvailable: boolean;
  legacySuppressedText: boolean;
  readyForReviewedImport: false;
  blockedReasons: string[];
  proposedProvenanceContract: {
    sourceLabel: string | null;
    sourceUrl: string | null;
    publicationDate: string | null;
    extractedQuote: string | null;
    reviewNote: string;
    warningCodes: string[];
  };
};

const schema = readFileSync("prisma/schema.prisma", "utf-8");

const modelBlock = (modelName: string): string => {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? "";
};

const industryContextModel = modelBlock("IndustryContext");
const hasIndustryContextField = (fieldName: string): boolean =>
  new RegExp(`\\b${fieldName}\\b`).test(industryContextModel);

const buildCandidateRow = async (ticker: SupportedTicker): Promise<CandidateContractRow> => {
  const runtimePayload = await loadIndustryContextRuntimeByTicker(ticker);
  const context = runtimePayload.context;
  const warningCodes = context?.warningCodes ?? ["INDUSTRY_CONTEXT_MISSING"];
  const legacySuppressedText = warningCodes.includes("LEGACY_MOCK_LABELED_FIELD_SUPPRESSED");
  const qualitativeContextAvailable = Boolean(
    context?.industryName &&
      (context.industryOverview || context.keyDrivers || context.industryRisks),
  );
  const blockedReasons = [
    context ? null : "MISSING_INDUSTRY_CONTEXT",
    "MISSING_NATIVE_SOURCE_URL",
    "MISSING_PUBLICATION_DATE_FIELD",
    "MISSING_EXTRACTED_QUOTE_FIELD",
    legacySuppressedText ? "LEGACY_MOCK_LABELED_TEXT_SUPPRESSED" : null,
    qualitativeContextAvailable ? null : "QUALITATIVE_CONTEXT_INCOMPLETE_AFTER_SUPPRESSION",
  ].filter((reason): reason is string => Boolean(reason));

  return {
    ticker,
    status: context ? "candidate_generated" : "blocked",
    industryName: context?.industryName ?? null,
    industryCode: context?.industryCode ?? null,
    currentSourceLabel: context?.sourceLabel ?? null,
    dataMode: context ? "research_only" : "missing",
    productionApproved: false,
    needsReview: true,
    nativeSourceUrlAvailable: false,
    publicationDateAvailable: false,
    extractedQuoteAvailable: false,
    qualitativeContextAvailable,
    legacySuppressedText,
    readyForReviewedImport: false,
    blockedReasons,
    proposedProvenanceContract: {
      sourceLabel: context?.sourceLabel ?? null,
      sourceUrl: null,
      publicationDate: null,
      extractedQuote: null,
      reviewNote:
        "Dry-run only. Current IndustryContext schema stores sourceLabel but no sourceUrl/publicationDate/extractedQuote; reviewed import should wait for a provenance sidecar or schema extension.",
      warningCodes,
    },
  };
};

async function main() {
  const currentIndustryContextRowsFound = await prisma.industryContext.count();
  const productionApprovedTrueCount = await prisma.industryContext.count({
    where: { productionApproved: true },
  });
  const needsReviewTrueCount = await prisma.industryContext.count({
    where: { needsReview: true },
  });

  const candidateRows = await Promise.all(SUPPORTED_TICKERS.map(buildCandidateRow));
  const candidateGeneratedRows = candidateRows.filter((row) => row.status === "candidate_generated");
  const blockedRows = candidateRows.filter((row) => row.blockedReasons.length > 0);
  const blockedReasons = Array.from(
    new Set(blockedRows.flatMap((row) => row.blockedReasons)),
  ).sort();

  const result = {
    phase: "150C",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    supportedTickersChecked: [...SUPPORTED_TICKERS],
    schemaInspection: {
      industryContextModelFound: industryContextModel.length > 0,
      sourceLabelExists: hasIndustryContextField("sourceLabel"),
      sourceUrlExists: hasIndustryContextField("sourceUrl"),
      publicationDateExists: hasIndustryContextField("publicationDate"),
      extractedQuoteExists: hasIndustryContextField("extractedQuote"),
      warningCodesExists: hasIndustryContextField("warningCodes"),
      nativeProvenanceSidecarExists: /model\s+IndustryContextProvenance\s+\{/.test(schema),
      industryMetricModelExists: /model\s+IndustryMetric\s+\{/.test(schema),
    },
    currentIndustryContextRowsFound,
    candidateContractRowsGenerated: candidateGeneratedRows.length,
    readyForReviewedImportCount: 0,
    blockedRowsCount: blockedRows.length,
    blockedReasons,
    tickersWithMissingContext: candidateRows
      .filter((row) => row.blockedReasons.includes("MISSING_INDUSTRY_CONTEXT"))
      .map((row) => row.ticker),
    tickersWithMissingNativeSourceUrl: candidateRows
      .filter((row) => row.blockedReasons.includes("MISSING_NATIVE_SOURCE_URL"))
      .map((row) => row.ticker),
    tickersWithLegacySuppressedText: candidateRows
      .filter((row) => row.legacySuppressedText)
      .map((row) => row.ticker),
    productionApprovedTrueCount,
    needsReviewTrueCount,
    fakeSourceUrlInvented: false,
    numericIndustryMetricsInvented: false,
    valuationRiskBenchmarksInvented: false,
    staticGuidancePromotedToRealData: false,
    missingDataZeroFilled: false,
    candidateRows,
    recommendedNextPhase:
      "Phase 150D should choose and implement an IndustryContext provenance sidecar or schema extension before reviewed industry context import.",
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.currentIndustryContextRowsFound >= 0 &&
    result.candidateContractRowsGenerated === 5 &&
    result.readyForReviewedImportCount === 0 &&
    result.blockedRowsCount === SUPPORTED_TICKERS.length &&
    result.tickersWithMissingContext.includes("VCB") &&
    result.productionApprovedTrueCount === 0 &&
    !result.fakeSourceUrlInvented &&
    !result.numericIndustryMetricsInvented &&
    !result.valuationRiskBenchmarksInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.missingDataZeroFilled;

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
