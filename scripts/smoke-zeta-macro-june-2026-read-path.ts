import "dotenv/config";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const DATA_MODE = "zeta_macro_june_2026_candidate";
const expectedIndicators = [
  "GDP_GROWTH",
  "PMI_MANUFACTURING",
  "EXPORT_GROWTH",
  "CPI_YOY",
  "CREDIT_GROWTH",
  "USD_VND",
  "DXY",
  "BRENT_OIL_PRICE",
] as const;

type RuntimeIndicator = {
  indicatorCode: string;
  latestObservation?: unknown;
};

async function run() {
  const observations = await prisma.macroObservation.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...expectedIndicators] },
    },
  });
  const provenance = await prisma.macroObservationProvenance.findMany({
    where: {
      dataMode: DATA_MODE,
      indicatorCode: { in: [...expectedIndicators] },
    },
  });
  const runtime = await loadMacroRuntimeData();

  const runtimeIndicators = (runtime.indicatorUniverse ?? []) as RuntimeIndicator[];
  const runtimeByCode = new Map(runtimeIndicators.map((item) => [item.indicatorCode, item]));
  const metricById = new Map(runtime.vietnamMetrics.map((metric) => [metric.id, metric]));
  const worldMetricById = new Map(runtime.worldMetrics.map((metric) => [metric.id, metric]));

  const results = {
    dataMode: DATA_MODE,
    expectedIndicators,
    observationsRead: observations.length,
    provenanceRead: provenance.length,
    missingObservationIndicators: expectedIndicators.filter(
      (code) => !observations.some((row) => row.indicatorCode === code),
    ),
    runtimeHasLatestObservations: expectedIndicators.every(
      (code) => Boolean(runtimeByCode.get(code)?.latestObservation),
    ),
    coreMetricValues: {
      gdp: metricById.get("gdp")?.value ?? null,
      cpi: metricById.get("cpi")?.value ?? null,
      pmi: metricById.get("pmi")?.value ?? null,
      exports: metricById.get("exports")?.value ?? null,
      creditGrowth: metricById.get("credit-growth")?.value ?? null,
      usdVnd: metricById.get("usd-vnd")?.value ?? null,
      dxy: worldMetricById.get("dxy")?.value ?? null,
      brent: worldMetricById.get("commodities")?.value ?? null,
    },
    productionApprovedTrueCount:
      observations.filter((row) => row.productionApproved).length +
      provenance.filter((row) => row.productionApproved).length,
    needsReviewFalseCount:
      observations.filter((row) => !row.needsReview).length +
      provenance.filter((row) => !row.needsReview).length,
    smokePassed: false,
  };

  results.smokePassed =
    results.observationsRead === expectedIndicators.length &&
    results.provenanceRead === expectedIndicators.length &&
    results.missingObservationIndicators.length === 0 &&
    results.runtimeHasLatestObservations &&
    results.coreMetricValues.pmi !== null &&
    results.coreMetricValues.exports !== null &&
    results.coreMetricValues.creditGrowth !== null &&
    results.coreMetricValues.usdVnd !== null &&
    results.coreMetricValues.dxy !== null &&
    results.coreMetricValues.brent !== null &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewFalseCount === 0;

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
  if (!results.smokePassed) process.exit(1);
}

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
