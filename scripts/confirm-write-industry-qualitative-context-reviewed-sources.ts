import {
  industryQualitativeContextSourcePackages,
  validateIndustryQualitativeContextSourcePackage,
} from "./industry-qualitative-context-reviewed-sources.js";
import { prisma } from "../src/lib/database/client.js";

const CONFIRM_FLAG = "--confirm-write";
const AS_OF_DATE = "2026-07-01";

const INDUSTRY_TICKERS = {
  STEEL_MATERIALS: "HPG",
  RETAIL: "MWG",
  CONSUMER_STAPLES_DAIRY: "VNM",
} as const;

const INDUSTRY_NAMES = {
  STEEL_MATERIALS: "Steel and Materials",
  RETAIL: "Retail",
  CONSUMER_STAPLES_DAIRY: "Consumer Staples - Dairy",
} as const;

const SOURCE_LABEL_PREFIX = "Phase 151A reviewed qualitative context - ";

type WriteResult = {
  industryCode: keyof typeof INDUSTRY_TICKERS;
  ticker: string;
  contextAction: "create" | "update" | "noop" | "dry_run";
  provenanceAction: "create" | "update" | "noop" | "dry_run";
  industryContextId: string | null;
  fullQualitativeFieldsPresent: boolean;
};

const isConfirmWrite = process.argv.includes(CONFIRM_FLAG);

const parseDate = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

const jsonList = (values: string[]): string => JSON.stringify(values);

const contextSourceLabel = (sourceLabel: string): string =>
  `${SOURCE_LABEL_PREFIX}${sourceLabel}`;

const summarizeValidation = () => {
  const validations = industryQualitativeContextSourcePackages.map(
    validateIndustryQualitativeContextSourcePackage,
  );
  const blocked = validations.filter((validation) => !validation.eligible);

  return {
    validations,
    blocked,
    productionApprovedTrueCount: industryQualitativeContextSourcePackages.filter(
      (sourcePackage) => sourcePackage.productionApproved,
    ).length,
  };
};

const countProductionApprovedTrue = async (): Promise<number> => {
  const [contextCount, provenanceCount] = await Promise.all([
    prisma.industryContext.count({ where: { productionApproved: true } }),
    prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
  ]);

  return contextCount + provenanceCount;
};

const countIndustryMetricModelPresent = (): boolean =>
  Boolean((prisma as unknown as Record<string, unknown>).industryMetric);

const buildWriteInput = (
  sourcePackage: (typeof industryQualitativeContextSourcePackages)[number],
) => {
  const industryCode = sourcePackage.industryCode;
  const ticker = INDUSTRY_TICKERS[industryCode];
  const industryName = INDUSTRY_NAMES[industryCode];
  const sourceLabel = contextSourceLabel(sourcePackage.sourceLabel);
  const asOfDate = parseDate(AS_OF_DATE);

  if (!ticker || !industryName || !asOfDate) {
    throw new Error(`Unsupported qualitative context package: ${industryCode}`);
  }

  return {
    ticker,
    contextWhere: {
      industryName_asOfDate_sourceLabel_contextLanguage: {
        industryName,
        asOfDate,
        sourceLabel,
        contextLanguage: "en",
      },
    },
    contextData: {
      industryCode,
      industryName,
      contextLanguage: "en",
      industryOverview: sourcePackage.overview,
      howIndustryMakesMoney: sourcePackage.howIndustryMakesMoney,
      keyDrivers: jsonList(sourcePackage.keyDrivers),
      industryRisks: jsonList(sourcePackage.keyRisks),
      macroSensitivity: jsonList(sourcePackage.macroSensitivity),
      nextChecks: jsonList(sourcePackage.nextChecks),
      commonMisread: sourcePackage.commonMisread,
      relatedTickers: [ticker],
      asOfDate,
      sourceLabel,
      dataMode: sourcePackage.dataMode,
      productionApproved: false,
      needsReview: true,
    },
    provenanceData: {
      ticker,
      industryName,
      sourceLabel: sourcePackage.sourceLabel,
      sourceUrl: sourcePackage.sourceUrl,
      sourceType: sourcePackage.sourceType,
      dataMode: sourcePackage.dataMode,
      productionApproved: false,
      needsReview: true,
      publicationDate: parseDate(sourcePackage.publicationDate),
      retrievedAt: parseDate(sourcePackage.retrievedAt),
      extractedQuote: sourcePackage.extractedQuote,
      reviewNote: sourcePackage.reviewNote,
      warningCodes: jsonList(sourcePackage.warningCodes),
    },
  };
};

const writePackage = async (
  sourcePackage: (typeof industryQualitativeContextSourcePackages)[number],
): Promise<WriteResult> => {
  const writeInput = buildWriteInput(sourcePackage);
  const existingContext = await prisma.industryContext.findUnique({
    where: writeInput.contextWhere,
  });

  if (!isConfirmWrite) {
    return {
      industryCode: sourcePackage.industryCode,
      ticker: writeInput.ticker,
      contextAction: "dry_run",
      provenanceAction: "dry_run",
      industryContextId: existingContext?.id ?? null,
      fullQualitativeFieldsPresent: Boolean(
        existingContext?.howIndustryMakesMoney &&
          existingContext.macroSensitivity &&
          existingContext.nextChecks &&
          existingContext.commonMisread,
      ),
    };
  }

  const context = existingContext
    ? await prisma.industryContext.update({
        where: { id: existingContext.id },
        data: writeInput.contextData,
      })
    : await prisma.industryContext.create({
        data: writeInput.contextData,
      });

  const existingProvenance = await prisma.industryContextProvenance.findUnique({
    where: {
      industryContextId_ticker_sourceLabel_sourceUrl: {
        industryContextId: context.id,
        ticker: writeInput.ticker,
        sourceLabel: writeInput.provenanceData.sourceLabel,
        sourceUrl: writeInput.provenanceData.sourceUrl,
      },
    },
  });

  if (existingProvenance) {
    await prisma.industryContextProvenance.update({
      where: { id: existingProvenance.id },
      data: writeInput.provenanceData,
    });
  } else {
    await prisma.industryContextProvenance.create({
      data: {
        ...writeInput.provenanceData,
        industryContextId: context.id,
      },
    });
  }

  return {
    industryCode: sourcePackage.industryCode,
    ticker: writeInput.ticker,
    contextAction: existingContext ? "update" : "create",
    provenanceAction: existingProvenance ? "update" : "create",
    industryContextId: context.id,
    fullQualitativeFieldsPresent: Boolean(
      context.howIndustryMakesMoney &&
        context.macroSensitivity &&
        context.nextChecks &&
        context.commonMisread,
    ),
  };
};

async function main() {
  const validationSummary = summarizeValidation();

  if (validationSummary.blocked.length > 0) {
    console.log(
      JSON.stringify(
        {
          phase: "151B",
          confirmWrite: isConfirmWrite,
          dbReadAttempted: true,
          dbWriteAttempted: false,
          blockedContextPackages: validationSummary.blocked.length,
          blockedReasons: validationSummary.blocked.flatMap((validation) => validation.blockedReasons),
          smokePassed: false,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const writeResults = [];
  for (const sourcePackage of industryQualitativeContextSourcePackages) {
    writeResults.push(await writePackage(sourcePackage));
  }

  const [contextRowsAfter, provenanceRowsAfter, productionApprovedTrueCount] =
    await Promise.all([
      prisma.industryContext.count({
        where: {
          sourceLabel: {
            startsWith: SOURCE_LABEL_PREFIX,
          },
          dataMode: "research_only",
          productionApproved: false,
          needsReview: true,
        },
      }),
      prisma.industryContextProvenance.count({
        where: {
          sourceLabel: {
            in: industryQualitativeContextSourcePackages.map((sourcePackage) => sourcePackage.sourceLabel),
          },
          dataMode: "research_only",
          productionApproved: false,
          needsReview: true,
        },
      }),
      countProductionApprovedTrue(),
    ]);

  const result = {
    phase: "151B",
    confirmWrite: isConfirmWrite,
    dbReadAttempted: true,
    dbWriteAttempted: isConfirmWrite,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: true,
    candidateContextPackages: industryQualitativeContextSourcePackages.length,
    eligibleContextPackages: validationSummary.validations.filter((validation) => validation.eligible).length,
    blockedContextPackages: validationSummary.blocked.length,
    writeResults,
    contextRowsCreated: writeResults.filter((result) => result.contextAction === "create").length,
    contextRowsUpdated: writeResults.filter((result) => result.contextAction === "update").length,
    provenanceRowsCreated: writeResults.filter((result) => result.provenanceAction === "create").length,
    provenanceRowsUpdated: writeResults.filter((result) => result.provenanceAction === "update").length,
    fullQualitativeContextRowsAfter: writeResults.filter(
      (result) => result.fullQualitativeFieldsPresent,
    ).length,
    contextRowsAfter,
    provenanceRowsAfter,
    productionApprovedTrueCount,
    industryMetricCreated: countIndustryMetricModelPresent(),
    benchmarkCreated: false,
    valuationRiskBenchmarkInvented: false,
    retailPeerGroupCreated: false,
    vnmPeerGroupCreated: false,
    unsupportedTickerInference: false,
    staticGuidanceTreatedAsReviewedQualitativeContext: false,
  };

  const smokePassed =
    result.phase === "151B" &&
    result.dbReadAttempted &&
    result.dbWriteAttempted === isConfirmWrite &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    result.schemaChanged &&
    result.candidateContextPackages === 3 &&
    result.eligibleContextPackages === 3 &&
    result.blockedContextPackages === 0 &&
    (!isConfirmWrite || result.contextRowsAfter === 3) &&
    (!isConfirmWrite || result.provenanceRowsAfter >= 3) &&
    (!isConfirmWrite || result.fullQualitativeContextRowsAfter === 3) &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.benchmarkCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.retailPeerGroupCreated &&
    !result.vnmPeerGroupCreated &&
    !result.unsupportedTickerInference &&
    !result.staticGuidanceTreatedAsReviewedQualitativeContext;

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
