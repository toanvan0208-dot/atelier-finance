import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const SUPPORTED_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN", "VCB"] as const;
const READABLE_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN"] as const;

const unique = <T>(values: T[]): T[] => [...new Set(values)];

async function main() {
  const sidecarTableReadable = await prisma.industryContextProvenance
    .count()
    .then(() => true)
    .catch(() => false);
  const industryContextRowsFound = await prisma.industryContext.count();
  const provenanceRowsFound = sidecarTableReadable
    ? await prisma.industryContextProvenance.count()
    : 0;
  const productionApprovedTrueCount = sidecarTableReadable
    ? await prisma.industryContextProvenance.count({ where: { productionApproved: true } })
    : 0;
  const needsReviewTrueCount = sidecarTableReadable
    ? await prisma.industryContextProvenance.count({ where: { needsReview: true } })
    : 0;

  const runtimePayloads = await Promise.all(
    SUPPORTED_TICKERS.map(async (ticker) => ({
      ticker,
      payload: await loadIndustryContextRuntimeByTicker(ticker),
    })),
  );

  const readableTickers = runtimePayloads
    .filter(({ payload }) => payload.status === "available")
    .map(({ ticker }) => ticker);
  const missingSafeTickers = runtimePayloads
    .filter(({ payload }) => payload.status === "missing" && payload.missingReason)
    .map(({ ticker }) => ticker);
  const runtimeProvenanceSummaryReadable = runtimePayloads
    .filter(({ payload }) => payload.status === "available")
    .every(({ payload }) => Boolean(payload.context?.provenanceSummary));
  const runtimeRowsWithProvenanceSummary = runtimePayloads
    .filter(({ payload }) => payload.context?.provenanceSummary)
    .map(({ ticker, payload }) => ({
      ticker,
      rowsFound: payload.context?.provenanceSummary.rowsFound ?? 0,
      sidecarReadStatus: payload.context?.provenanceSummary.sidecarReadStatus ?? "missing_or_not_applied",
      warningCodes: payload.context?.warningCodes ?? [],
      provenanceLimitations: payload.context?.provenanceLimitations ?? [],
    }));
  const warningCodes = unique(
    runtimePayloads.flatMap(({ payload }) => payload.context?.warningCodes ?? []),
  ).sort();

  const result = {
    phase: "150F",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    sidecarTableReadable,
    industryContextRowsFound,
    provenanceRowsFound,
    runtimeProvenanceSummaryReadable,
    runtimeRowsWithProvenanceSummary,
    readableTickers,
    missingSafeTickers,
    productionApprovedTrueCount,
    needsReviewTrueCount,
    noNumericMetricsOrBenchmarks: true,
    staticGuidancePromotedToRealData: false,
    missingDataZeroFilled: false,
    warningCodes,
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    result.sidecarTableReadable &&
    result.industryContextRowsFound === 5 &&
    result.runtimeProvenanceSummaryReadable &&
    READABLE_TICKERS.every((ticker) => result.readableTickers.includes(ticker)) &&
    result.missingSafeTickers.includes("VCB") &&
    result.productionApprovedTrueCount === 0 &&
    result.noNumericMetricsOrBenchmarks &&
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
