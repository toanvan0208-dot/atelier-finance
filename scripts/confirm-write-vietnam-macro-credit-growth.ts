import { Prisma } from "../src/generated/prisma/client.js";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/database/client.js";
import { runVietnamMacroCandidateEligibilityAudit } from "./audit-vietnam-macro-candidate-eligibility.js";
import { runVietnamMacroParserDryRunBatch } from "./dry-run-vietnam-macro-parser-batch.js";

const INDICATOR_CODE = "CREDIT_GROWTH";
const DATA_MODE = "vietnam_macro_candidate";
const REGION = "VN";
const EXPECTED_CREDIT_ROWS = 10;

type DryRunSummary = Awaited<ReturnType<typeof runVietnamMacroParserDryRunBatch>>;
type CandidateRow = DryRunSummary["parserResults"][number]["candidateRows"][number];
type AuditSummary = Awaited<ReturnType<typeof runVietnamMacroCandidateEligibilityAudit>>;

type CreditCandidateRow = CandidateRow & { indicatorCode: typeof INDICATOR_CODE };

type WritePlanRow = {
  candidate: CreditCandidateRow;
  observationDate: Date;
  sourceLabel: string;
  frequency: string;
  periodLabel: string;
};

const lastDayOfMonthUtc = (year: number, month: number): Date =>
  new Date(Date.UTC(year, month, 0, 0, 0, 0));

const observationDateFor = (candidate: CandidateRow): Date => {
  if (candidate.periodType === "day" || candidate.periodType === "daily") {
    return new Date(`${candidate.period}T00:00:00Z`);
  }

  if (candidate.periodType === "year" || candidate.periodType === "annual") {
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

  throw new Error(`Unsupported CREDIT_GROWTH period format: ${candidate.period}`);
};

const frequencyFor = (candidate: CandidateRow): string => {
  if (candidate.periodType === "day" || candidate.periodType === "daily") return "daily";
  if (candidate.periodType === "year" || candidate.periodType === "annual") return "annual";
  if (candidate.periodType === "monthly_ytd") return "monthly_ytd";
  if (candidate.periodType === "quarterly_ytd") return "quarterly_ytd";
  if (candidate.periodType === "quarterly_snapshot") return "quarterly_snapshot";
  if (candidate.periodType === "ytd") return "ytd";
  return candidate.periodType;
};

const sourceLabelFor = (candidate: CandidateRow): string => candidate.sourceType;

const candidateKey = (candidate: CandidateRow): string =>
  [candidate.indicatorCode, candidate.period, candidate.periodType, candidate.unit].join("|");

const sourceUrlFor = (candidate: CandidateRow): string | null =>
  candidate.sourceUrl ?? candidate.provenance.sourceUrl ?? null;

const payloadChecksumFor = (candidate: CandidateRow): string | null =>
  candidate.provenance.payloadChecksum ?? candidate.provenance.fileChecksum ?? null;

const publishedAtFor = (candidate: CandidateRow): Date | null =>
  candidate.sourcePublicationDate ? new Date(`${candidate.sourcePublicationDate}T00:00:00Z`) : null;

const buildWarningCodes = (candidate: CandidateRow): string =>
  JSON.stringify([
    "CANDIDATE_ONLY",
    "NEEDS_REVIEW",
    "PRODUCTION_APPROVED_FALSE",
    "NOT_OFFICIAL_MACHINE_READABLE_SBV_CSV",
    candidate.sourceType,
  ]);

const buildEvidenceNotes = (candidate: CandidateRow): string =>
  JSON.stringify({
    semanticCaveats: candidate.semanticCaveats,
    sourceType: candidate.sourceType,
    sourceFile: candidate.sourceFile,
    notOfficialMachineReadableSbvCsv: candidate.notOfficialMachineReadableSbvCsv === true,
    sourceDefinition: candidate.sourceDefinition,
    sourceScope: candidate.sourceScope,
    sourcePublicationDate: candidate.sourcePublicationDate,
    extractedQuotePresent: Boolean(candidate.extractedQuote),
  });

const buildWritePlan = async (): Promise<{
  dryRunSummary: DryRunSummary;
  auditSummary: AuditSummary;
  rows: WritePlanRow[];
}> => {
  const [dryRunSummary, auditSummary] = await Promise.all([
    runVietnamMacroParserDryRunBatch(),
    runVietnamMacroCandidateEligibilityAudit(),
  ]);

  const eligibleKeys = new Set(
    auditSummary.auditRows
      .filter((row) => row.indicatorCode === INDICATOR_CODE && row.confirmWriteEligible)
      .map((row) => row.duplicateKey),
  );

  const rows = dryRunSummary.parserResults
    .flatMap((result) => result.candidateRows)
    .filter((candidate): candidate is CreditCandidateRow =>
      candidate.indicatorCode === INDICATOR_CODE && eligibleKeys.has(candidateKey(candidate)),
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

const readBackObservations = async (rows: WritePlanRow[]) => {
  if (rows.length === 0) return [];
  return prisma.macroObservation.findMany({
    where: {
      OR: rows.map((row) => ({
        indicatorCode: INDICATOR_CODE,
        region: REGION,
        observationDate: row.observationDate,
        sourceLabel: row.sourceLabel,
      })),
    },
  });
};

const readBackProvenanceRows = async (rows: WritePlanRow[]) => {
  if (rows.length === 0) return [];
  return prisma.macroObservationProvenance.findMany({
    where: {
      OR: rows.map((row) => ({
        indicatorCode: INDICATOR_CODE,
        region: REGION,
        observationDate: row.observationDate,
        sourceLabel: row.sourceLabel,
      })),
    },
  });
};

export async function runVietnamMacroCreditGrowthConfirmWrite(confirmWriteRequested: boolean) {
  const { dryRunSummary, auditSummary, rows } = await buildWritePlan();
  const creditCandidateRows = dryRunSummary.candidateRowsByIndicator.CREDIT_GROWTH;
  const creditEligibleRows = auditSummary.eligibleRowsByIndicator.CREDIT_GROWTH;
  const creditBlockedRows = auditSummary.blockedRowsByIndicator.CREDIT_GROWTH;

  const summary = {
    phase: "149H",
    indicatorCode: INDICATOR_CODE,
    confirmWriteRequested,
    dbWriteAttempted: confirmWriteRequested,
    candidateRowsTotal: creditCandidateRows,
    eligibleRowsTotal: creditEligibleRows,
    blockedRowsTotal: creditBlockedRows,
    rowsToWriteTotal: rows.length,
    rowsWrittenTotal: 0,
    rowsCreatedTotal: 0,
    rowsUpdatedTotal: 0,
    provenanceRowsCreated: 0,
    provenanceRowsUpdated: 0,
    rowsSkippedBlockedTotal: creditBlockedRows,
    productionApprovedTrueCount: 0,
    needsReviewTrueCount: 0,
    readBackCheck: {
      readBackRows: 0,
      readBackProvenanceRows: 0,
      allWrittenRowsHaveProvenance: false,
    },
    idempotentCheck: {
      expectedRows: EXPECTED_CREDIT_ROWS,
      duplicateKeySafe: auditSummary.duplicateCandidateKeys.length === 0,
      uniqueDbKeysPlanned:
        new Set(
          rows.map((row) =>
            [INDICATOR_CODE, REGION, row.observationDate.toISOString(), row.sourceLabel].join("|"),
          ),
        ).size === rows.length,
      rerunSafeUpsert: true,
    },
    semanticCaveats:
      dryRunSummary.semanticCaveats.CREDIT_GROWTH ??
      [
        "CREDIT_GROWTH is manually aggregated from SBV/news/publication sources, not an official machine-readable SBV CSV.",
      ],
    guardrailResults: {
      onlyCreditGrowthRowsSelected: rows.every((row) => row.candidate.indicatorCode === INDICATOR_CODE),
      rowsToWriteTotalIsExpected: rows.length === EXPECTED_CREDIT_ROWS,
      productionApprovedFalseOnly: true,
      needsReviewTrueOnly: true,
      notOfficialMachineReadableSbvCsv: rows.every(
        (row) => row.candidate.notOfficialMachineReadableSbvCsv === true,
      ),
      missingDataZeroFilled: false,
      mockOrSampleAsReal: false,
      investmentAdviceAdded: false,
    },
  };

  if (rows.length !== EXPECTED_CREDIT_ROWS) {
    console.log(JSON.stringify(summary, null, 2));
    throw new Error(`Expected ${EXPECTED_CREDIT_ROWS} eligible CREDIT_GROWTH rows, found ${rows.length}.`);
  }

  if (confirmWriteRequested) {
    for (const row of rows) {
      const candidate = row.candidate;
      const existingObservation = await prisma.macroObservation.findUnique({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: INDICATOR_CODE,
            region: REGION,
            observationDate: row.observationDate,
            sourceLabel: row.sourceLabel,
          },
        },
      });
      const existingProvenance = await prisma.macroObservationProvenance.findUnique({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: INDICATOR_CODE,
            region: REGION,
            observationDate: row.observationDate,
            sourceLabel: row.sourceLabel,
          },
        },
      });

      const indicator = await prisma.macroIndicator.upsert({
        where: { indicatorCode: INDICATOR_CODE },
        update: {
          indicatorName: "Credit growth manual aggregated candidate",
          description:
            "Manually aggregated credit growth candidate from SBV/news/publication sources, not an official machine-readable SBV CSV.",
          category: "vietnam_macro",
          defaultUnit: "percent_ytd",
          defaultFrequency: "monthly_or_quarterly_snapshot",
          regionScope: REGION,
          sourceLabel: row.sourceLabel,
          isActive: true,
        },
        create: {
          indicatorCode: INDICATOR_CODE,
          indicatorName: "Credit growth manual aggregated candidate",
          description:
            "Manually aggregated credit growth candidate from SBV/news/publication sources, not an official machine-readable SBV CSV.",
          category: "vietnam_macro",
          defaultUnit: "percent_ytd",
          defaultFrequency: "monthly_or_quarterly_snapshot",
          regionScope: REGION,
          sourceLabel: row.sourceLabel,
          isActive: true,
        },
      });

      await prisma.macroObservation.upsert({
        where: {
          indicatorCode_region_observationDate_sourceLabel: {
            indicatorCode: INDICATOR_CODE,
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
          indicatorCode: INDICATOR_CODE,
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
            indicatorCode: INDICATOR_CODE,
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
          retrievedAt: new Date(),
          publishedAt: publishedAtFor(candidate),
          payloadChecksum: payloadChecksumFor(candidate),
          rawPayloadSnippet: null,
          warningCodes: buildWarningCodes(candidate),
          evidenceNotes: buildEvidenceNotes(candidate),
        },
        create: {
          indicatorCode: INDICATOR_CODE,
          region: REGION,
          observationDate: row.observationDate,
          sourceLabel: row.sourceLabel,
          providerType: candidate.sourceType,
          dataMode: DATA_MODE,
          productionApproved: false,
          needsReview: true,
          sourceUrl: sourceUrlFor(candidate),
          retrievedAt: new Date(),
          publishedAt: publishedAtFor(candidate),
          payloadChecksum: payloadChecksumFor(candidate),
          rawPayloadSnippet: null,
          warningCodes: buildWarningCodes(candidate),
          evidenceNotes: buildEvidenceNotes(candidate),
        },
      });

      summary.rowsWrittenTotal += 1;
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

  const readBack = await readBackObservations(rows);
  const readBackProvenance = await readBackProvenanceRows(rows);
  summary.readBackCheck = {
    readBackRows: readBack.length,
    readBackProvenanceRows: readBackProvenance.length,
    allWrittenRowsHaveProvenance: readBack.length === readBackProvenance.length,
  };
  summary.productionApprovedTrueCount =
    readBack.filter((row) => row.productionApproved).length +
    readBackProvenance.filter((row) => row.productionApproved).length;
  summary.needsReviewTrueCount = readBack.filter((row) => row.needsReview).length;
  summary.guardrailResults.productionApprovedFalseOnly =
    summary.productionApprovedTrueCount === 0;
  summary.guardrailResults.needsReviewTrueOnly =
    !confirmWriteRequested || summary.needsReviewTrueCount === EXPECTED_CREDIT_ROWS;

  return summary;
}

async function main() {
  const confirmWriteRequested = process.argv.includes("--confirm-write");
  const summary = await runVietnamMacroCreditGrowthConfirmWrite(confirmWriteRequested);
  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();

  if (confirmWriteRequested) {
    const passed =
      summary.rowsWrittenTotal === EXPECTED_CREDIT_ROWS &&
      summary.productionApprovedTrueCount === 0 &&
      summary.needsReviewTrueCount === EXPECTED_CREDIT_ROWS &&
      summary.readBackCheck.readBackRows === EXPECTED_CREDIT_ROWS &&
      summary.readBackCheck.allWrittenRowsHaveProvenance;
    if (!passed) process.exit(1);
  }
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] === currentFilePath) {
  main().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
