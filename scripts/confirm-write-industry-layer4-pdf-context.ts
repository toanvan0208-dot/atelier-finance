import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  buildWriteInput,
  candidatePackages,
  validatePackage,
  type PdfBackedLayer4Package,
} from "./dry-run-confirm-write-industry-layer4-pdf-context.js";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "158E";
const CONFIRM_FLAG = "--confirm-write";

type PrismaClientLike = typeof PrismaClientInstance;

type WriteResult = {
  industryCode: PdfBackedLayer4Package["industryCode"];
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

const hasFullLayer4Fields = (sourcePackage: PdfBackedLayer4Package): boolean =>
  Boolean(
    sourcePackage.overview &&
      sourcePackage.howIndustryMakesMoney &&
      sourcePackage.keyDrivers.length > 0 &&
      sourcePackage.keyRisks.length > 0 &&
      sourcePackage.macroSensitivity.length > 0 &&
      sourcePackage.nextChecks.length > 0 &&
      sourcePackage.commonMisread,
  );

const writePackage = async (
  db: PrismaClientLike,
  sourcePackage: PdfBackedLayer4Package,
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
      fullQualitativeFieldsPresent: hasFullLayer4Fields(sourcePackage),
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
    fullQualitativeFieldsPresent: hasFullLayer4Fields(sourcePackage),
  };
};

const countProductionApprovedTrue = async (db: PrismaClientLike): Promise<number> => {
  const [contextCount, provenanceCount] = await Promise.all([
    db.industryContext.count({ where: { productionApproved: true } }),
    db.industryContextProvenance.count({ where: { productionApproved: true } }),
  ]);

  return contextCount + provenanceCount;
};

const countIndustryMetricModelPresent = (db: PrismaClientLike): boolean =>
  Boolean((db as unknown as Record<string, unknown>).industryMetric);

const runConfirmWrite = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: PrismaClientLike;
  };
  const isConfirmWrite = process.argv.includes(CONFIRM_FLAG);
  const validations = candidatePackages.map(validatePackage);
  const blocked = validations.filter((validation) => !validation.eligible);

  if (blocked.length > 0) {
    const blockedResult = {
      phase: PHASE,
      mode: isConfirmWrite ? "confirm_write" : "dry_run",
      dbReadAttempted: true,
      dbWriteAttempted: false,
      schemaChanged: false,
      providerFetchAttempted: false,
      blockedContextPackages: blocked.length,
      blockedReasons: [...new Set(blocked.flatMap((validation) => validation.blockedReasons))].sort(),
      confirmWritePassed: false,
    };

    console.log(JSON.stringify(blockedResult, null, 2));
    process.exitCode = 1;
    return blockedResult;
  }

  const rowsBefore = await Promise.all([
    prisma.industryContext.count(),
    prisma.industryContextProvenance.count(),
  ]);
  const writeResults: WriteResult[] = [];

  for (const sourcePackage of candidatePackages) {
    writeResults.push(await writePackage(prisma, sourcePackage, isConfirmWrite));
  }

  const [industryContextRowsAfter, industryContextProvenanceRowsAfter, productionApprovedTrueCount] =
    await Promise.all([
      prisma.industryContext.count(),
      prisma.industryContextProvenance.count(),
      countProductionApprovedTrue(prisma),
    ]);

  const contextRowsCreated = writeResults.filter((row) => row.contextAction === "create").length;
  const provenanceRowsCreated = writeResults.filter((row) => row.provenanceAction === "create").length;

  const result = {
    phase: PHASE,
    mode: isConfirmWrite ? "confirm_write" : "dry_run",
    dbReadAttempted: true,
    dbWriteAttempted: isConfirmWrite,
    schemaChanged: false,
    providerFetchAttempted: false,
    sourceFilesCommitted: false,
    rawPdfTextCommitted: false,
    candidateContextPackages: candidatePackages.length,
    eligibleContextPackages: validations.filter((validation) => validation.eligible).length,
    blockedContextPackages: blocked.length,
    writeResults,
    contextRowsCreated,
    contextRowsUpdated: writeResults.filter((row) => row.contextAction === "update").length,
    provenanceRowsCreated,
    provenanceRowsUpdated: writeResults.filter((row) => row.provenanceAction === "update").length,
    industryContextRowsBefore: rowsBefore[0],
    industryContextProvenanceRowsBefore: rowsBefore[1],
    industryContextRowsAfter,
    industryContextProvenanceRowsAfter,
    fullQualitativeContextRowsAfter: writeResults.filter(
      (row) => row.fullQualitativeFieldsPresent,
    ).length,
    productionApprovedTrueCount,
    forbiddenAdviceDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    buySellHoldDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    targetPriceFairValueUpsideDownsideDetected: validations.some(
      (validation) => validation.forbiddenAdviceDetected,
    ),
    stockAttractivenessDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    benchmarkRankingScoringDetected: validations.some(
      (validation) => validation.layer5OrScoringLanguageDetected,
    ),
    industryMetricIntroduced: false,
    industryMetricModelPresent: countIndustryMetricModelPresent(prisma),
    layer5MetricComparisonIntroduced: false,
    missingDataZeroFilled: false,
    fakeMockFallbackAsRealDetected: false,
  };

  const expectedContextRowsAfter = isConfirmWrite
    ? rowsBefore[0] + contextRowsCreated
    : rowsBefore[0];
  const expectedProvenanceRowsAfter = isConfirmWrite
    ? rowsBefore[1] + provenanceRowsCreated
    : rowsBefore[1];

  const confirmWritePassed =
    result.phase === PHASE &&
    result.dbReadAttempted &&
    result.dbWriteAttempted === isConfirmWrite &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    !result.sourceFilesCommitted &&
    !result.rawPdfTextCommitted &&
    result.candidateContextPackages === 3 &&
    result.eligibleContextPackages === 3 &&
    result.blockedContextPackages === 0 &&
    result.writeResults.length === 3 &&
    result.fullQualitativeContextRowsAfter === 3 &&
    result.industryContextRowsAfter === expectedContextRowsAfter &&
    result.industryContextProvenanceRowsAfter === expectedProvenanceRowsAfter &&
    result.productionApprovedTrueCount === 0 &&
    !result.forbiddenAdviceDetected &&
    !result.benchmarkRankingScoringDetected &&
    !result.industryMetricIntroduced &&
    !result.industryMetricModelPresent &&
    !result.layer5MetricComparisonIntroduced &&
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
