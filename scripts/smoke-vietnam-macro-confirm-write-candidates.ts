import { prisma } from "../src/lib/database/client.js";

const DATA_MODE = "vietnam_macro_candidate";
const ALL_TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

const countByIndicator = (rows: Array<{ indicatorCode: string }>): Record<string, number> =>
  rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.indicatorCode] = (counts[row.indicatorCode] ?? 0) + 1;
    return counts;
  }, {});

async function runSmoke() {
  const observations = await prisma.macroObservation.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...ALL_TARGET_INDICATORS] },
    },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...ALL_TARGET_INDICATORS] },
    },
  });

  const observationKeySet = new Set(
    observations.map((row) =>
      [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
    ),
  );
  const provenanceKeySet = new Set(
    provenance.map((row) =>
      [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
    ),
  );

  const productionApprovedTrueCount =
    observations.filter((row) => row.productionApproved).length +
    provenance.filter((row) => row.productionApproved).length;
  const needsReviewTrueCount = observations.filter((row) => row.needsReview).length;
  const candidateSourceTypes = provenance.filter((row) =>
    /candidate/.test(row.providerType) || /candidate/.test(row.sourceLabel),
  );

  const usdVndRows = observations.filter((row) => row.indicatorCode === "USD_VND");
  const exportGrowthRows = observations.filter((row) => row.indicatorCode === "EXPORT_GROWTH");
  const publicInvestmentRows = observations.filter(
    (row) => row.indicatorCode === "PUBLIC_INVESTMENT",
  );
  const creditGrowthRows = observations.filter((row) => row.indicatorCode === "CREDIT_GROWTH");

  const usdEvidence = provenance
    .filter((row) => row.indicatorCode === "USD_VND")
    .map((row) => row.evidenceNotes ?? "")
    .join("\n");
  const exportEvidence = provenance
    .filter((row) => row.indicatorCode === "EXPORT_GROWTH")
    .map((row) => row.evidenceNotes ?? "")
    .join("\n");
  const publicUnits = new Set(publicInvestmentRows.map((row) => row.unit));

  const results = {
    phase: "149F",
    dbWriteAttempted: true,
    readBackRows: observations.length,
    readBackProvenanceRows: provenance.length,
    createdRows: "see confirm-write summary",
    updatedRows: "see confirm-write summary",
    existingRows: observations.length,
    rowsWrittenTotal: observations.length,
    rowsByIndicator: countByIndicator(observations),
    usdVndCandidateRowExists: usdVndRows.length === 1,
    exportGrowthCandidateRowsExist: exportGrowthRows.length === 2,
    publicInvestmentCandidateRowsExist: publicInvestmentRows.length === 34,
    creditGrowthRowsWritten: creditGrowthRows.length,
    productionApprovedTrueCount,
    needsReviewTrueCount,
    allWrittenRowsHaveProvenance:
      observations.length > 0 &&
      observations.every((row) =>
        provenanceKeySet.has(
          [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
        ),
      ),
    allProvenanceRowsHaveObservation:
      provenance.length > 0 &&
      provenance.every((row) =>
        observationKeySet.has(
          [row.indicatorCode, row.region, row.observationDate.toISOString(), row.sourceLabel].join("|"),
        ),
      ),
    allWrittenRowsHaveCandidateSourceType: candidateSourceTypes.length === provenance.length,
    usdVndNotSbvCentralRate:
      usdEvidence.includes("not SBV central rate") &&
      usdEvidence.includes("commercial_bank_transfer"),
    exportGrowthDerivedFromExportValue:
      exportEvidence.includes("export_value_1000_usd") &&
      exportEvidence.includes("currentPeriodExportValue"),
    publicInvestmentUnitDisambiguated:
      publicUnits.has("billion_vnd") && publicUnits.has("percent_of_plan_ytd"),
    smokePassed: false,
  };

  results.smokePassed =
    results.usdVndCandidateRowExists &&
    results.exportGrowthCandidateRowsExist &&
    results.publicInvestmentCandidateRowsExist &&
    results.creditGrowthRowsWritten === 0 &&
    results.rowsWrittenTotal === 37 &&
    results.readBackProvenanceRows === 37 &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewTrueCount === 37 &&
    results.allWrittenRowsHaveProvenance &&
    results.allProvenanceRowsHaveObservation &&
    results.allWrittenRowsHaveCandidateSourceType &&
    results.usdVndNotSbvCentralRate &&
    results.exportGrowthDerivedFromExportValue &&
    results.publicInvestmentUnitDisambiguated &&
    results.dbWriteAttempted === true;

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();

  if (!results.smokePassed) process.exit(1);
}

runSmoke().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
