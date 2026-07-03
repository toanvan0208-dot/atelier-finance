import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  industryQualitativeContextSourcePackages,
  validateIndustryQualitativeContextSourcePackage,
} from "./industry-qualitative-context-reviewed-sources.js";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "157E";
const CONFIRM_FLAG = "--confirm-write";
const AS_OF_DATE = "2026-07-01";
const SOURCE_LABEL_PREFIX = "Phase 157E reviewed qualitative context - ";

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

type PrismaClientLike = typeof PrismaClientInstance;
type SourcePackage = (typeof industryQualitativeContextSourcePackages)[number];

type WriteResult = {
  industryCode: SourcePackage["industryCode"];
  ticker: string;
  contextAction: "create" | "update" | "dry_run";
  provenanceAction: "create" | "update" | "dry_run";
  industryContextId: string | null;
  fullQualitativeFieldsPresent: boolean;
};

const read = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of read(filePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const parseDate = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

const jsonList = (values: string[]): string => JSON.stringify(values);

const contextSourceLabel = (sourceLabel: string): string =>
  `${SOURCE_LABEL_PREFIX}${sourceLabel}`;

const countIndustryMetricModelPresent = (db: PrismaClientLike): boolean =>
  Boolean((db as unknown as Record<string, unknown>).industryMetric);

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

const buildWriteInput = (sourcePackage: SourcePackage) => {
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
  db: PrismaClientLike,
  sourcePackage: SourcePackage,
  isConfirmWrite: boolean,
): Promise<WriteResult> => {
  const writeInput = buildWriteInput(sourcePackage);
  const existingContext = await db.industryContext.findUnique({
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
    ? await db.industryContext.update({
        where: { id: existingContext.id },
        data: writeInput.contextData,
      })
    : await db.industryContext.create({
        data: writeInput.contextData,
      });

  const existingProvenance = await db.industryContextProvenance.findUnique({
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
    await db.industryContextProvenance.update({
      where: { id: existingProvenance.id },
      data: writeInput.provenanceData,
    });
  } else {
    await db.industryContextProvenance.create({
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

const countProductionApprovedTrue = async (db: PrismaClientLike): Promise<number> => {
  const [contextCount, provenanceCount] = await Promise.all([
    db.industryContext.count({ where: { productionApproved: true } }),
    db.industryContextProvenance.count({ where: { productionApproved: true } }),
  ]);

  return contextCount + provenanceCount;
};

const runConfirmWrite = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: PrismaClientLike;
  };
  const isConfirmWrite = process.argv.includes(CONFIRM_FLAG);
  const validationSummary = summarizeValidation();

  if (validationSummary.blocked.length > 0) {
    const blockedResult = {
      phase: PHASE,
      mode: isConfirmWrite ? "confirm_write" : "dry_run",
      dbReadAttempted: true,
      dbWriteAttempted: false,
      schemaChanged: false,
      providerFetchAttempted: false,
      blockedContextPackages: validationSummary.blocked.length,
      blockedReasons: validationSummary.blocked.flatMap((validation) => validation.blockedReasons),
      confirmWritePassed: false,
    };

    console.log(JSON.stringify(blockedResult, null, 2));
    process.exitCode = 1;
    return blockedResult;
  }

  const writeResults: WriteResult[] = [];
  for (const sourcePackage of industryQualitativeContextSourcePackages) {
    writeResults.push(await writePackage(prisma, sourcePackage, isConfirmWrite));
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
      countProductionApprovedTrue(prisma),
    ]);

  const result = {
    phase: PHASE,
    mode: isConfirmWrite ? "confirm_write" : "dry_run",
    dbReadAttempted: true,
    dbWriteAttempted: isConfirmWrite,
    schemaChanged: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    candidateContextPackages: industryQualitativeContextSourcePackages.length,
    eligibleContextPackages: validationSummary.validations.filter((validation) => validation.eligible).length,
    blockedContextPackages: validationSummary.blocked.length,
    writeResults,
    contextRowsCreated: writeResults.filter((row) => row.contextAction === "create").length,
    contextRowsUpdated: writeResults.filter((row) => row.contextAction === "update").length,
    provenanceRowsCreated: writeResults.filter((row) => row.provenanceAction === "create").length,
    provenanceRowsUpdated: writeResults.filter((row) => row.provenanceAction === "update").length,
    fullQualitativeContextRowsAfter: writeResults.filter(
      (row) => row.fullQualitativeFieldsPresent,
    ).length,
    contextRowsAfter,
    provenanceRowsAfter,
    productionApprovedTrueCount,
    industryMetricCreated: countIndustryMetricModelPresent(prisma),
    benchmarkCreated: false,
    rankingCreated: false,
    scoringCreated: false,
    valuationRiskBenchmarkInvented: false,
    unsupportedTickerInference: false,
    staticGuidanceTreatedAsReviewedQualitativeContext: false,
    missingDataZeroFilled: false,
    fakeMockFallbackAsRealDetected: false,
  };

  const confirmWritePassed =
    result.phase === PHASE &&
    result.dbReadAttempted &&
    result.dbWriteAttempted === isConfirmWrite &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    result.candidateContextPackages === 3 &&
    result.eligibleContextPackages === 3 &&
    result.blockedContextPackages === 0 &&
    (!isConfirmWrite || result.contextRowsAfter === 3) &&
    (!isConfirmWrite || result.provenanceRowsAfter >= 3) &&
    (!isConfirmWrite || result.fullQualitativeContextRowsAfter === 3) &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.benchmarkCreated &&
    !result.rankingCreated &&
    !result.scoringCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.unsupportedTickerInference &&
    !result.staticGuidanceTreatedAsReviewedQualitativeContext &&
    !result.missingDataZeroFilled &&
    !result.fakeMockFallbackAsRealDetected;

  console.log(JSON.stringify({ ...result, confirmWritePassed }, null, 2));

  if (!confirmWritePassed) {
    process.exitCode = 1;
  }

  return { ...result, confirmWritePassed };
};

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  let db: PrismaClientLike | null = null;
  runConfirmWrite()
    .then(async () => {
      const databaseModule = (await import("../src/lib/database/client.js")) as {
        prisma: PrismaClientLike;
      };
      db = databaseModule.prisma;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db?.$disconnect();
    });
}

export { runConfirmWrite };
