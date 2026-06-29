import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/database/client.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import {
  PHASE_149B_TARGET_INDICATORS,
  PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION,
} from "../src/features/macro/lib/vietnam-macro-source-acquisition.js";

const metricIdsByIndicator = new Map(
  PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.map((item) => [
    item.indicatorCode,
    item.frontendMetricId,
  ]),
);

async function runSmoke() {
  const runtimeData = await loadMacroRuntimeData();
  const visibleMetrics = [...runtimeData.vietnamMetrics, ...runtimeData.worldMetrics];
  const currentFrontendIndicators = MACRO_INDICATOR_UNIVERSE
    .filter((item) => item.inCurrentFrontend)
    .map((item) => item.indicatorCode);

  const visibleByIndicator = Object.fromEntries(
    PHASE_149B_TARGET_INDICATORS.map((indicatorCode) => {
      const metricId = metricIdsByIndicator.get(indicatorCode);
      const registryItem = MACRO_INDICATOR_UNIVERSE.find((item) => item.indicatorCode === indicatorCode);
      const metric = visibleMetrics.find((item) => item.id === metricId);

      return [
        indicatorCode,
        Boolean(metric && registryItem?.inCurrentFrontend),
      ];
    }),
  );

  const targetMetrics = PHASE_149B_TARGET_INDICATORS.map((indicatorCode) => {
    const metricId = metricIdsByIndicator.get(indicatorCode);
    return visibleMetrics.find((item) => item.id === metricId);
  });

  const targetObservationRows = await prisma.macroObservation.count({
    where: {
      indicatorCode: {
        in: [...PHASE_149B_TARGET_INDICATORS],
      },
    },
  });

  const targetProvenanceRows = await prisma.macroObservationProvenance.count({
    where: {
      indicatorCode: {
        in: [...PHASE_149B_TARGET_INDICATORS],
      },
    },
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

  const sourceResults = Object.fromEntries(
    PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.map((item) => [
      item.indicatorCode,
      {
        sourceUrlStatus: item.sourceUrlStatus,
        providerFetchAttempted: item.providerFetchAttempted,
        providerFetchSucceeded: item.providerFetchSucceeded,
        httpStatus: item.httpStatus,
        contentType: item.contentType,
        sourceShape: item.sourceShape,
        parserReadiness: item.parserReadiness,
        readyForParserDryRun: item.readyForParserDryRun,
        blockedReasons: item.blockedReasons,
      },
    ]),
  );

  const results = {
    phase: "149B",
    targetIndicators: [...PHASE_149B_TARGET_INDICATORS],
    usdVndFrontendVisible: visibleByIndicator.USD_VND === true,
    exportGrowthFrontendVisible: visibleByIndicator.EXPORT_GROWTH === true,
    creditGrowthFrontendVisible: visibleByIndicator.CREDIT_GROWTH === true,
    publicInvestmentFrontendVisible: visibleByIndicator.PUBLIC_INVESTMENT === true,
    frontendVisibility: visibleByIndicator,
    sourceResults,
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.some((item) => item.providerFetchAttempted),
    providerFetchSucceeded: PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.some((item) => item.providerFetchSucceeded),
    numericValuesExtracted: PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.reduce((sum, item) => sum + item.numericValuesExtracted, 0),
    candidateMacroRows: PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.reduce((sum, item) => sum + item.candidateMacroRows, 0),
    candidateProvenanceRows: PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION.reduce((sum, item) => sum + item.candidateProvenanceRows, 0),
    observationRowsCreated: targetObservationRows,
    provenanceRowsCreated: targetProvenanceRows,
    productionApprovedTrueCount,
    missingIndicatorsDoNotZeroFill: targetMetrics.every((metric) => metric?.value === null),
    assistantDoesNotInventVietnamMacro,
    guardrailNoInvestmentAdvicePresent,
    frontendIndicatorUniverseNotExpanded: currentFrontendIndicators.length === 14,
    smokePassed: false,
  };

  results.smokePassed =
    results.usdVndFrontendVisible &&
    results.exportGrowthFrontendVisible &&
    results.creditGrowthFrontendVisible &&
    results.publicInvestmentFrontendVisible &&
    results.dbReadAttempted &&
    !results.dbWriteAttempted &&
    results.providerFetchAttempted &&
    results.providerFetchSucceeded &&
    results.numericValuesExtracted === 0 &&
    results.candidateMacroRows === 0 &&
    results.candidateProvenanceRows === 0 &&
    results.observationRowsCreated === 0 &&
    results.provenanceRowsCreated === 0 &&
    results.productionApprovedTrueCount === 0 &&
    results.missingIndicatorsDoNotZeroFill &&
    results.assistantDoesNotInventVietnamMacro &&
    results.guardrailNoInvestmentAdvicePresent &&
    results.frontendIndicatorUniverseNotExpanded;

  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();

  if (!results.smokePassed) {
    process.exit(1);
  }
}

runSmoke().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
