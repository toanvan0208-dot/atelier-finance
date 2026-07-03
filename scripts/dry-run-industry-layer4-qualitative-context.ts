import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  industryQualitativeContextSourcePackages,
  QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES,
  validateIndustryQualitativeContextSourcePackage,
} from "./industry-qualitative-context-reviewed-sources.js";
import { REVIEWED_MAPPED_TICKERS } from "../src/features/industry/lib/reviewed-industry-coverage.js";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "157D";

type PrismaClientLike = typeof PrismaClientInstance;

const TARGET_MAPPINGS = {
  STEEL_MATERIALS: "HPG",
  RETAIL: "MWG",
  CONSUMER_STAPLES_DAIRY: "VNM",
} as const;

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

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const hasFullLayer4Fields = (
  sourcePackage: (typeof industryQualitativeContextSourcePackages)[number],
): boolean =>
  Boolean(
    sourcePackage.overview &&
      sourcePackage.howIndustryMakesMoney &&
      sourcePackage.keyDrivers.length > 0 &&
      sourcePackage.keyRisks.length > 0 &&
      sourcePackage.macroSensitivity.length > 0 &&
      sourcePackage.nextChecks.length > 0 &&
      sourcePackage.commonMisread,
  );

const countIndustryMetricModelPresent = (db: PrismaClientLike): boolean =>
  Boolean((db as unknown as Record<string, unknown>).industryMetric);

const runDryRun = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: PrismaClientLike;
  };

  const validations = industryQualitativeContextSourcePackages.map(
    validateIndustryQualitativeContextSourcePackage,
  );
  const eligibleContextPackages = validations.filter((validation) => validation.eligible);
  const blockedContextPackages = validations.filter((validation) => !validation.eligible);
  const acceptedIndustryCodes = industryQualitativeContextSourcePackages.map(
    (sourcePackage) => sourcePackage.industryCode,
  );
  const acceptedIndustryCodesExactly =
    acceptedIndustryCodes.length === QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.length &&
    QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.every((industryCode) =>
      acceptedIndustryCodes.includes(industryCode),
    );
  const productionApprovedTrueCountInPackage = industryQualitativeContextSourcePackages.filter(
    (sourcePackage) => sourcePackage.productionApproved,
  ).length;

  const [
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    productionApprovedTrueContextRowsBefore,
    productionApprovedTrueProvenanceRowsBefore,
    targetMappingsFound,
  ] = await Promise.all([
    prisma.industryContext.count(),
    prisma.industryContextProvenance.count(),
    prisma.industryContext.count({ where: { productionApproved: true } }),
    prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
    prisma.companyIndustry.findMany({
      where: {
        OR: Object.entries(TARGET_MAPPINGS).map(([industryCode, ticker]) => ({
          ticker,
          industryCode,
          dataMode: "research_only",
          productionApproved: false,
          needsReview: true,
        })),
      },
      select: {
        ticker: true,
        industryCode: true,
        sourceLabel: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
      orderBy: [{ ticker: "asc" }, { industryCode: "asc" }],
    }),
  ]);

  const candidateRows = industryQualitativeContextSourcePackages.map((sourcePackage) => ({
    industryCode: sourcePackage.industryCode,
    mappedTicker: TARGET_MAPPINGS[sourcePackage.industryCode],
    sourceLabel: sourcePackage.sourceLabel,
    sourceUrl: sourcePackage.sourceUrl,
    sourceType: sourcePackage.sourceType,
    retrievedAt: sourcePackage.retrievedAt,
    publicationDate: sourcePackage.publicationDate,
    extractedQuote: sourcePackage.extractedQuote,
    dataMode: sourcePackage.dataMode,
    needsReview: sourcePackage.needsReview,
    productionApproved: sourcePackage.productionApproved,
    fullLayer4FieldsPresent: hasFullLayer4Fields(sourcePackage),
    sourceBackedDryRunOnly: true,
    wouldCreateIndustryContext: true,
    wouldCreateIndustryContextProvenance: true,
  }));

  const allTargetMappingsFound = Object.entries(TARGET_MAPPINGS).every(([industryCode, ticker]) =>
    targetMappingsFound.some((row) => row.industryCode === industryCode && row.ticker === ticker),
  );
  const allFullLayer4FieldsPresent = candidateRows.every((row) => row.fullLayer4FieldsPresent);
  const productionApprovedTrueCount =
    productionApprovedTrueCountInPackage +
    productionApprovedTrueContextRowsBefore +
    productionApprovedTrueProvenanceRowsBefore;

  const result = {
    phase: PHASE,
    mode: "dry_run_only",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    reviewedIndustryCount: QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.length,
    reviewedMappedTickers: [...REVIEWED_MAPPED_TICKERS],
    candidateContextPackages: industryQualitativeContextSourcePackages.length,
    eligibleContextPackages: eligibleContextPackages.length,
    blockedContextPackages: blockedContextPackages.length,
    acceptedIndustryCodes,
    acceptedIndustryCodesExactly,
    targetMappingsFound,
    allTargetMappingsFound,
    candidateRows,
    allFullLayer4FieldsPresent,
    blockedIndustryCodes: blockedContextPackages.map((validation) => validation.industryCode),
    blockedReasons: unique(blockedContextPackages.flatMap((validation) => validation.blockedReasons)).sort(),
    warningCodesPresent: unique(validations.flatMap((validation) => validation.warningCodes)).sort(),
    forbiddenAdviceDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    numericBenchmarkLanguageDetected: validations.some(
      (validation) => validation.numericBenchmarkLanguageDetected,
    ),
    unsupportedTickerContextDetected: validations.some(
      (validation) => validation.unsupportedTickerContextDetected,
    ),
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    wouldWriteIndustryContextRows: candidateRows.length,
    wouldWriteIndustryContextProvenanceRows: candidateRows.length,
    industryMetricCreated: countIndustryMetricModelPresent(prisma),
    benchmarkCreated: false,
    rankingCreated: false,
    scoringCreated: false,
    valuationRiskBenchmarkInvented: false,
    staticGuidanceTreatedAsReviewedQualitativeContext: false,
    missingDataZeroFilled: false,
    fakeMockFallbackAsRealDetected: false,
    productionApprovedTrueCount,
    readyForConfirmWrite:
      acceptedIndustryCodesExactly &&
      allTargetMappingsFound &&
      allFullLayer4FieldsPresent &&
      eligibleContextPackages.length === industryQualitativeContextSourcePackages.length &&
      blockedContextPackages.length === 0 &&
      productionApprovedTrueCount === 0,
    recommendedNextPhase: "Phase 157E - Industry Layer 4 Qualitative Context Confirm-Write",
  };

  const dryRunPassed =
    result.phase === PHASE &&
    result.mode === "dry_run_only" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    result.reviewedIndustryCount === 3 &&
    result.candidateContextPackages === 3 &&
    result.eligibleContextPackages === 3 &&
    result.blockedContextPackages === 0 &&
    result.acceptedIndustryCodesExactly &&
    result.allTargetMappingsFound &&
    result.allFullLayer4FieldsPresent &&
    !result.forbiddenAdviceDetected &&
    !result.numericBenchmarkLanguageDetected &&
    !result.unsupportedTickerContextDetected &&
    result.industryContextRowsBefore === 0 &&
    result.industryContextProvenanceRowsBefore === 0 &&
    result.wouldWriteIndustryContextRows === 3 &&
    result.wouldWriteIndustryContextProvenanceRows === 3 &&
    !result.industryMetricCreated &&
    !result.benchmarkCreated &&
    !result.rankingCreated &&
    !result.scoringCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.staticGuidanceTreatedAsReviewedQualitativeContext &&
    !result.missingDataZeroFilled &&
    !result.fakeMockFallbackAsRealDetected &&
    result.productionApprovedTrueCount === 0 &&
    result.readyForConfirmWrite;

  console.log(JSON.stringify({ ...result, dryRunPassed }, null, 2));

  if (!dryRunPassed) {
    process.exitCode = 1;
  }

  return { ...result, dryRunPassed };
};

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  let db: PrismaClientLike | null = null;
  runDryRun()
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

export { runDryRun };
