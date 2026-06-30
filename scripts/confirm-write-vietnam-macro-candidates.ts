import { Prisma } from "../src/generated/prisma/client.js";
import { prisma } from "../src/lib/database/client.js";
import { runVietnamMacroCandidateEligibilityAudit } from "./audit-vietnam-macro-candidate-eligibility.js";
import { runVietnamMacroParserDryRunBatch } from "./dry-run-vietnam-macro-parser-batch.js";

const CONFIRM_WRITE_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

const ALL_TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

const DATA_MODE = "vietnam_macro_candidate";
const REGION = "VN";

type IndicatorCode = (typeof ALL_TARGET_INDICATORS)[number];
type WritableIndicatorCode = (typeof CONFIRM_WRITE_INDICATORS)[number];
type DryRunSummary = Awaited<ReturnType<typeof runVietnamMacroParserDryRunBatch>>;
type CandidateRow = DryRunSummary["parserResults"][number]["candidateRows"][number];

type WritePlanRow = {
  candidate: CandidateRow;
  observationDate: Date;
  sourceLabel: string;
  frequency: string;
  periodLabel: string;
};

const zeroCounts = (): Record<IndicatorCode, number> => ({
  USD_VND: 0,
  EXPORT_GROWTH: 0,
  CREDIT_GROWTH: 0,
  PUBLIC_INVESTMENT: 0,
});

const indicatorMetadata: Record<WritableIndicatorCode, {
  indicatorName: string;
  description: string;
  category: string;
  defaultUnit: string;
  defaultFrequency: string;
}> = {
  USD_VND: {
    indicatorName: "USD/VND commercial bank quote",
    description: "Vietcombank commercial bank transfer quote, not SBV central rate.",
    category: "vietnam_macro",
    defaultUnit: "vnd_per_usd",
    defaultFrequency: "daily",
  },
  EXPORT_GROWTH: {
    indicatorName: "Export growth derived from GSO export value",
    description: "Derived YoY from GSO export value CSV, not directly published growth.",
    category: "vietnam_macro",
    defaultUnit: "percent_yoy",
    defaultFrequency: "annual_or_ytd",
  },
  PUBLIC_INVESTMENT: {
    indicatorName: "Public investment candidate",
    description: "Unit disambiguates value in billion_vnd or progress as percent_of_plan_ytd.",
    category: "vietnam_macro",
    defaultUnit: "billion_vnd_or_percent_of_plan_ytd",
    defaultFrequency: "monthly_or_quarterly_ytd",
  },
};

const lastDayOfMonthUtc = (year: number, month: number): Date =>
  new Date(Date.UTC(year, month, 0, 0, 0, 0));

const observationDateFor = (candidate: CandidateRow): Date => {
  if (candidate.periodType === "day" || candidate.periodType === "daily") {
    return new Date(`${candidate.period}T00:00:00Z`);
  }

  if (candidate.periodType === "year" || /^\d{4}$/.test(candidate.period)) {
    return new Date(`${candidate.period}-12-31T00:00:00Z`);
  }

  const monthlyMatch = candidate.period.match(/^(\d{4})-(\d{2})$/);
  if (monthlyMatch) {
    return lastDayOfMonthUtc(Number(monthlyMatch[1]), Number(monthlyMatch[2]));
  }

  const ytdMatch = candidate.period.match(/^(\d{4})-YTD-(\d{1,2})M$/);
  if (ytdMatch) {
    return lastDayOfMonthUtc(Number(ytdMatch[1]), Number(ytdMatch[2]));
  }

  const quarterMatch = candidate.period.match(/^(\d{4})-Q([1-4])$/);
  if (quarterMatch) {
    return lastDayOfMonthUtc(Number(quarterMatch[1]), Number(quarterMatch[2]) * 3);
  }

  throw new Error(`Unsupported period format for ${candidate.indicatorCode}: ${candidate.period}`);
};

const frequencyFor = (candidate: CandidateRow): string => {
  if (candidate.periodType === "day" || candidate.periodType === "daily") return "daily";
  if (candidate.periodType === "year" || candidate.periodType === "annual") return "annual";
  if (candidate.periodType === "monthly_ytd") return "monthly_ytd";
  if (candidate.periodType === "quarterly_ytd") return "quarterly_ytd";
  if (candidate.periodType === "ytd") return "ytd";
  return candidate.periodType;
};

const sourceLabelFor = (candidate: CandidateRow): string => {
  if (candidate.indicatorCode === "PUBLIC_INVESTMENT") {
    return `${candidate.sourceType}:${candidate.unit}`;
  }
  return candidate.sourceType;
};

const candidateKey = (candidate: CandidateRow): string =>
  [candidate.indicatorCode, candidate.period, candidate.periodType, candidate.unit].join("|");

const buildEvidenceNotes = (candidate: CandidateRow): string =>
  JSON.stringify({
    semanticCaveats: candidate.semanticCaveats,
    sourceType: candidate.sourceType,
    sourceFile: candidate.sourceFile,
    rateType:
      candidate.indicatorCode === "USD_VND" && candidate.quoteField === "transfer"
        ? "commercial_bank_transfer"
        : candidate.rateType,
    sourceInstitution: candidate.sourceInstitution,
    notSbvCentralRate: candidate.notSbvCentralRate === true,
    derivedFrom: candidate.derivedFrom,
    derivedFormula: candidate.derivedFormula,
    derivedCurrentPeriod: candidate.derivedCurrentPeriod,
    derivedPriorPeriod: candidate.derivedPriorPeriod,
    sourceDefinition: candidate.sourceDefinition,
    sourceScope: candidate.sourceScope,
    sourcePlanBasis: candidate.sourcePlanBasis,
  });

const buildWarningCodes = (candidate: CandidateRow): string =>
  JSON.stringify([
    "CANDIDATE_ONLY",
    "NEEDS_REVIEW",
    "PRODUCTION_APPROVED_FALSE",
    candidate.sourceType,
  ]);

const publishedAtFor = (candidate: CandidateRow): Date | null =>
  candidate.sourcePublicationDate ? new Date(`${candidate.sourcePublicationDate}T00:00:00Z`) : null;

const sourceUrlFor = (candidate: CandidateRow): string | null =>
  candidate.sourceUrl ?? candidate.provenance.sourceUrl ?? null;

const payloadChecksumFor = (candidate: CandidateRow): string | null =>
  candidate.provenance.payloadChecksum ?? candidate.provenance.fileChecksum ?? null;

const buildWritePlan = async (): Promise<{
  dryRunSummary: DryRunSummary;
  auditSummary: Awaited<ReturnType<typeof runVietnamMacroCandidateEligibilityAudit>>;
  rows: WritePlanRow[];
}> => {
  const [dryRunSummary, auditSummary] = await Promise.all([
    runVietnamMacroParserDryRunBatch(),
    runVietnamMacroCandidateEligibilityAudit(),
  ]);

  const eligibleKeys = new Set(
    auditSummary.auditRows
      .filter((row) => row.confirmWriteEligible)
      .map((row) => row.duplicateKey),
  );

  const rows = dryRunSummary.parserResults
    .flatMap((result) => result.candidateRows)
    .filter((candidate) => eligibleKeys.has(candidateKey(candidate)))
    .filter((candidate): candidate is CandidateRow & { indicatorCode: WritableIndicatorCode } =>
      CONFIRM_WRITE_INDICATORS.includes(candidate.indicatorCode as WritableIndicatorCode),
    )
    .map((candidate) => ({
      candidate,
      observationDate: observationDateFor(candidate),
      sourceLabel: sourceLabelFor(candidate),
      frequency: frequencyFor(candidate),
      periodLabel: candidate.period,
    }));

  return { dryRunSummary, auditSummary, rows };
};

const countByIndicator = (rows: WritePlanRow[]): Record<IndicatorCode, number> => {
  const counts = zeroCounts();
  for (const row of rows) {
    counts[row.candidate.indicatorCode] += 1;
  }
  return counts;
};

const readBackRows = async (rows: WritePlanRow[]) => {
  const or = rows.map((row) => ({
    indicatorCode: row.candidate.indicatorCode,
    region: REGION,
    observationDate: row.observationDate,
    sourceLabel: row.sourceLabel,
  }));

  if (or.length === 0) return [];
  return prisma.macroObservation.findMany({ where: { OR: or } });
};

const readBackProvenanceRows = async (rows: WritePlanRow[]) => {
  const or = rows.map((row) => ({
    indicatorCode: row.candidate.indicatorCode,
    region: REGION,
    observationDate: row.observationDate,
    sourceLabel: row.sourceLabel,
  }));

  if (or.length === 0) return [];
  return prisma.macroObservationProvenance.findMany({ where: { OR: or } });
};

async function run() {
  const confirmWriteRequested = process.argv.includes("--confirm-write");
  const { dryRunSummary, auditSummary, rows } = await buildWritePlan();
  const rowsToWriteByIndicator = countByIndicator(rows);
  const sourceLabels = Array.from(new Set(rows.map((row) => row.sourceLabel)));

  const summary = {
    phase: "149F",
    confirmWriteRequested,
    dbWriteAttempted: confirmWriteRequested,
    candidateRowsPersisted: false,
    rowsToWriteTotal: rows.length,
    rowsWrittenTotal: 0,
    rowsCreatedTotal: 0,
    rowsUpdatedTotal: 0,
    provenanceRowsCreated: 0,
    provenanceRowsUpdated: 0,
    rowsSkippedBlockedTotal: auditSummary.blockedRowsTotal,
    rowsSkippedBlockedByIndicator: auditSummary.blockedRowsByIndicator,
    candidateRowsByIndicator: auditSummary.candidateRowsByIndicator,
    eligibleRowsByIndicator: auditSummary.eligibleRowsByIndicator,
    blockedRowsByIndicator: auditSummary.blockedRowsByIndicator,
    rowsToWriteByIndicator,
    writtenRowsByIndicator: zeroCounts(),
    productionApprovedTrueCount: 0,
    needsReviewTrueCount: 0,
    creditGrowthRowsWritten: 0,
    idempotentCheck: {
      duplicateKeySafe: auditSummary.duplicateCandidateKeys.length === 0,
      uniqueDbKeysPlanned: new Set(
        rows.map((row) =>
          [
            row.candidate.indicatorCode,
            REGION,
            row.observationDate.toISOString(),
            row.sourceLabel,
          ].join("|"),
        ),
      ).size === rows.length,
      rerunSafeUpsert: true,
    },
    readBackCheck: {
      readBackRows: 0,
      readBackProvenanceRows: 0,
      allWrittenRowsHaveProvenance: false,
      creditGrowthReadBackRows: 0,
    },
    semanticCaveats: dryRunSummary.semanticCaveats,
    guardrailResults: {
      rowsToWriteTotalIsExpected: rows.length === 37,
      writtenRowsByIndicatorExpected: false,
      creditGrowthExcluded: rowsToWriteByIndicator.CREDIT_GROWTH === 0,
      productionApprovedFalseOnly: true,
      needsReviewTrueOnly: true,
      missingDataZeroFilled: false,
      mockOrSampleAsReal: false,
      investmentAdviceAdded: false,
    },
  };

  if (rows.length !== 37) {
    console.log(JSON.stringify(summary, null, 2));
    throw new Error(`Expected 37 eligible rows to write, found ${rows.length}.`);
  }

  if (rowsToWriteByIndicator.CREDIT_GROWTH !== 0) {
    console.log(JSON.stringify(summary, null, 2));
    throw new Error("CREDIT_GROWTH rows are blocked and must not be written.");
  }

  if (confirmWriteRequested) {
    for (const row of rows) {
      const candidate = row.candidate;
      const metadata = indicatorMetadata[candidate.indicatorCode as WritableIndicatorCode];
      const existingObservation = await prisma.macroObservation.findUnique({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: candidate.indicatorCode,
            region: REGION,
            observationDate: row.observationDate,
            sourceLabel: row.sourceLabel,
          },
        },
      });
      const existingProvenance = await prisma.macroObservationProvenance.findUnique({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: candidate.indicatorCode,
            region: REGION,
            observationDate: row.observationDate,
            sourceLabel: row.sourceLabel,
          },
        },
      });

      const indicator = await prisma.macroIndicator.upsert({
        where: { indicatorCode: candidate.indicatorCode },
        update: {
          indicatorName: metadata.indicatorName,
          description: metadata.description,
          category: metadata.category,
          defaultUnit: metadata.defaultUnit,
          defaultFrequency: metadata.defaultFrequency,
          regionScope: REGION,
          sourceLabel: row.sourceLabel,
          isActive: true,
        },
        create: {
          indicatorCode: candidate.indicatorCode,
          indicatorName: metadata.indicatorName,
          description: metadata.description,
          category: metadata.category,
          defaultUnit: metadata.defaultUnit,
          defaultFrequency: metadata.defaultFrequency,
          regionScope: REGION,
          sourceLabel: row.sourceLabel,
          isActive: true,
        },
      });

      await prisma.macroObservation.upsert({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: candidate.indicatorCode,
            region: REGION,
            observationDate: row.observationDate,
            sourceLabel: row.sourceLabel,
          },
        },
        update: {
          value: new Prisma.Decimal(candidate.value),
          unit: candidate.unit,
          frequency: row.frequency,
          periodLabel: row.periodLabel,
          dataMode: DATA_MODE,
          productionApproved: false,
          needsReview: true,
        },
        create: {
          indicatorId: indicator.id,
          indicatorCode: candidate.indicatorCode,
          region: REGION,
          observationDate: row.observationDate,
          value: new Prisma.Decimal(candidate.value),
          unit: candidate.unit,
          frequency: row.frequency,
          periodLabel: row.periodLabel,
          sourceLabel: row.sourceLabel,
          dataMode: DATA_MODE,
          productionApproved: false,
          needsReview: true,
        },
      });

      await prisma.macroObservationProvenance.upsert({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: candidate.indicatorCode,
            region: REGION,
            observationDate: row.observationDate,
            sourceLabel: row.sourceLabel,
          },
        },
        update: {
          providerType: candidate.sourceType,
          dataMode: DATA_MODE,
          productionApproved: false,
          needsReview: true,
          sourceUrl: sourceUrlFor(candidate),
          retrievedAt: candidate.provenance.fetchedAt
            ? new Date(candidate.provenance.fetchedAt)
            : new Date(),
          publishedAt: publishedAtFor(candidate),
          payloadChecksum: payloadChecksumFor(candidate),
          rawPayloadSnippet: null,
          warningCodes: buildWarningCodes(candidate),
          evidenceNotes: buildEvidenceNotes(candidate),
        },
        create: {
          indicatorCode: candidate.indicatorCode,
          region: REGION,
          observationDate: row.observationDate,
          sourceLabel: row.sourceLabel,
          providerType: candidate.sourceType,
          dataMode: DATA_MODE,
          productionApproved: false,
          needsReview: true,
          sourceUrl: sourceUrlFor(candidate),
          retrievedAt: candidate.provenance.fetchedAt
            ? new Date(candidate.provenance.fetchedAt)
            : new Date(),
          publishedAt: publishedAtFor(candidate),
          payloadChecksum: payloadChecksumFor(candidate),
          rawPayloadSnippet: null,
          warningCodes: buildWarningCodes(candidate),
          evidenceNotes: buildEvidenceNotes(candidate),
        },
      });

      summary.rowsWrittenTotal += 1;
      summary.writtenRowsByIndicator[candidate.indicatorCode] += 1;
      if (existingObservation) {
        summary.rowsUpdatedTotal += 1;
      } else {
        summary.rowsCreatedTotal += 1;
      }
      if (existingProvenance) {
        summary.provenanceRowsUpdated += 1;
      } else {
        summary.provenanceRowsCreated += 1;
      }
    }
  }

  const readBack = await readBackRows(rows);
  const readBackProvenance = await readBackProvenanceRows(rows);
  summary.candidateRowsPersisted = confirmWriteRequested && readBack.length === rows.length;
  summary.productionApprovedTrueCount = readBack.filter((row) => row.productionApproved).length;
  summary.needsReviewTrueCount = readBack.filter((row) => row.needsReview).length;
  summary.creditGrowthRowsWritten = readBack.filter(
    (row) => row.indicatorCode === "CREDIT_GROWTH",
  ).length;
  summary.readBackCheck = {
    readBackRows: readBack.length,
    readBackProvenanceRows: readBackProvenance.length,
    allWrittenRowsHaveProvenance: readBackProvenance.length === readBack.length,
    creditGrowthReadBackRows: summary.creditGrowthRowsWritten,
  };
  summary.guardrailResults.writtenRowsByIndicatorExpected =
    summary.writtenRowsByIndicator.USD_VND === (confirmWriteRequested ? 1 : 0) &&
    summary.writtenRowsByIndicator.EXPORT_GROWTH === (confirmWriteRequested ? 2 : 0) &&
    summary.writtenRowsByIndicator.PUBLIC_INVESTMENT === (confirmWriteRequested ? 34 : 0) &&
    summary.writtenRowsByIndicator.CREDIT_GROWTH === 0;
  summary.guardrailResults.productionApprovedFalseOnly =
    summary.productionApprovedTrueCount === 0;
  summary.guardrailResults.needsReviewTrueOnly =
    !confirmWriteRequested || summary.needsReviewTrueCount === rows.length;

  const sourceScopedApproved = await prisma.macroObservation.count({
    where: {
      indicatorCode: { in: [...ALL_TARGET_INDICATORS] },
      sourceLabel: { in: sourceLabels },
      productionApproved: true,
    },
  });
  const sourceScopedProvenanceApproved = await prisma.macroObservationProvenance.count({
    where: {
      indicatorCode: { in: [...ALL_TARGET_INDICATORS] },
      sourceLabel: { in: sourceLabels },
      productionApproved: true,
    },
  });
  summary.productionApprovedTrueCount += sourceScopedApproved + sourceScopedProvenanceApproved;

  console.log(JSON.stringify(summary, null, 2));

  await prisma.$disconnect();

  if (confirmWriteRequested) {
    const passed =
      summary.rowsWrittenTotal === 37 &&
      summary.writtenRowsByIndicator.USD_VND === 1 &&
      summary.writtenRowsByIndicator.EXPORT_GROWTH === 2 &&
      summary.writtenRowsByIndicator.PUBLIC_INVESTMENT === 34 &&
      summary.writtenRowsByIndicator.CREDIT_GROWTH === 0 &&
      summary.creditGrowthRowsWritten === 0 &&
      summary.productionApprovedTrueCount === 0 &&
      summary.needsReviewTrueCount === 37 &&
      summary.readBackCheck.readBackRows === 37 &&
      summary.readBackCheck.allWrittenRowsHaveProvenance;
    if (!passed) process.exit(1);
  }
}

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
