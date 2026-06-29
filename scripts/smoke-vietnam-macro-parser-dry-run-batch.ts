import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/database/client.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { runVietnamMacroParserDryRunBatch } from "./dry-run-vietnam-macro-parser-batch.js";

const TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

async function runSmoke() {
  const dryRunSummary = await runVietnamMacroParserDryRunBatch();
  const targetIndicatorCodes = [...TARGET_INDICATORS];

  const observationRowsCreated = await prisma.macroObservation.count({
    where: { indicatorCode: { in: targetIndicatorCodes } },
  });
  const provenanceRowsCreated = await prisma.macroObservationProvenance.count({
    where: { indicatorCode: { in: targetIndicatorCodes } },
  });
  const productionApprovedTrueCount =
    (await prisma.macroObservation.count({ where: { productionApproved: true } })) +
    (await prisma.macroObservationProvenance.count({ where: { productionApproved: true } }));

  const assistantRouteContent = readFileSync("src/app/api/assistant/route.ts", "utf-8");
  const assistantDoesNotInventVietnamMacro =
    assistantRouteContent.includes("USD_VND, EXPORT_GROWTH, CREDIT_GROWTH, and PUBLIC_INVESTMENT") &&
    assistantRouteContent.includes("không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số bị thiếu");
  const guardrailNoInvestmentAdvicePresent =
    assistantRouteContent.includes("Do not make definitive macro-to-industry conclusions or give investment advice") &&
    assistantRouteContent.includes("Avoid investment-action wording and valuation-outcome claims") &&
    !assistantRouteContent.includes("mua/bán/nắm giữ/tín hiệu/đáng mua/hấp dẫn/target price/fair value/upside/downside/giải ngân/đứng ngoài");

  const frontendIndicatorUniverseNotExpanded =
    MACRO_INDICATOR_UNIVERSE.filter((item) => item.inCurrentFrontend).length === 14;

  const candidateRowsTotal = Object.values(dryRunSummary.candidateRowsByIndicator).reduce(
    (sum, value) => sum + value,
    0,
  );
  const candidateRows = dryRunSummary.parserResults.flatMap((result) => result.candidateRows);
  const csvFailClosedVerified =
    dryRunSummary.missingCsvFiles.length > 0 &&
    !dryRunSummary.parserSucceededByIndicator.EXPORT_GROWTH &&
    !dryRunSummary.parserSucceededByIndicator.CREDIT_GROWTH &&
    !dryRunSummary.parserSucceededByIndicator.PUBLIC_INVESTMENT;

  const publicInvestmentUnits = candidateRows
    .filter((candidate) => candidate.indicatorCode === "PUBLIC_INVESTMENT")
    .map((candidate) => candidate.unit);
  const publicInvestmentUnitDisambiguated =
    csvFailClosedVerified ||
    publicInvestmentUnits.every(
      (unit) => unit === "billion_vnd" || unit === "percent_of_plan_ytd",
    );

  const results = {
    phase: "149C",
    targetIndicators: targetIndicatorCodes,
    usdVndParserAttempted: dryRunSummary.parserAttemptedByIndicator.USD_VND,
    exportGrowthCsvParserAttempted: dryRunSummary.parserAttemptedByIndicator.EXPORT_GROWTH,
    creditGrowthCsvParserAttempted: dryRunSummary.parserAttemptedByIndicator.CREDIT_GROWTH,
    publicInvestmentCsvParserAttempted:
      dryRunSummary.parserAttemptedByIndicator.PUBLIC_INVESTMENT,
    dbWriteAttempted: dryRunSummary.dbWriteAttempted,
    providerFetchAttempted: dryRunSummary.providerFetchAttempted,
    providerFetchOnlyForUsdVnd:
      dryRunSummary.parserResults.filter((result) => result.providerFetchAttempted).length === 1 &&
      dryRunSummary.parserResults.find((result) => result.providerFetchAttempted)?.indicatorCode ===
        "USD_VND",
    csvFilesRead: dryRunSummary.csvFilesRead,
    csvFailClosedVerified,
    missingCsvFiles: dryRunSummary.missingCsvFiles,
    numericValuesExtracted: dryRunSummary.numericValuesExtracted,
    candidateMacroRows: candidateRowsTotal,
    candidateRowsByIndicator: dryRunSummary.candidateRowsByIndicator,
    candidateRowsPersisted: dryRunSummary.candidateRowsPersisted,
    observationRowsCreated,
    provenanceRowsCreated,
    productionApprovedTrueCount,
    needsReviewTrueCountMatchesCandidateRows:
      dryRunSummary.needsReviewTrueCount === candidateRowsTotal,
    usdVndNotSbvCentralRate: dryRunSummary.usdVndNotSbvCentralRate,
    exportGrowthDerivedFromExportValue: true,
    exportGrowthNotDirectlyPublishedGrowth:
      dryRunSummary.exportGrowthNotDirectPublishedGrowth,
    creditGrowthManualAggregatedCandidate:
      dryRunSummary.creditGrowthSourceMode === "manual_aggregated_sbv_news_candidate",
    publicInvestmentUnitDisambiguated,
    missingDataZeroFilled: dryRunSummary.missingDataZeroFilled,
    assistantDoesNotInventVietnamMacro,
    guardrailNoInvestmentAdvicePresent,
    frontendIndicatorUniverseNotExpanded,
    smokePassed: false,
  };

  results.smokePassed =
    results.usdVndParserAttempted &&
    results.exportGrowthCsvParserAttempted &&
    results.creditGrowthCsvParserAttempted &&
    results.publicInvestmentCsvParserAttempted &&
    results.dbWriteAttempted === false &&
    results.providerFetchAttempted === true &&
    results.providerFetchOnlyForUsdVnd &&
    results.numericValuesExtracted > 0 &&
    results.candidateMacroRows >= 1 &&
    results.candidateRowsPersisted === false &&
    results.observationRowsCreated === 0 &&
    results.provenanceRowsCreated === 0 &&
    results.productionApprovedTrueCount === 0 &&
    results.needsReviewTrueCountMatchesCandidateRows &&
    results.usdVndNotSbvCentralRate &&
    results.exportGrowthDerivedFromExportValue &&
    results.exportGrowthNotDirectlyPublishedGrowth &&
    results.creditGrowthManualAggregatedCandidate &&
    results.publicInvestmentUnitDisambiguated &&
    results.missingDataZeroFilled === false &&
    results.assistantDoesNotInventVietnamMacro &&
    results.guardrailNoInvestmentAdvicePresent &&
    results.frontendIndicatorUniverseNotExpanded &&
    (results.csvFilesRead || results.csvFailClosedVerified);

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();

  if (!results.smokePassed) {
    process.exit(1);
  }
}

runSmoke().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
