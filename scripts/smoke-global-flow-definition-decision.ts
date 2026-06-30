import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry.js";
import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data.js";
import { prisma } from "../src/lib/database/client.js";

const EVIDENCE_PATH = "docs/product/evidence/PHASE149R_GLOBAL_FLOW_DEFINITION_DECISION.md";
const PARSER_STRATEGY_PATH = "docs/product/MACRO_PARSER_STRATEGY.md";
const BOUNDARIES_PATH = "docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md";
const READINESS_GATES_PATH = "docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md";

export async function runGlobalFlowDefinitionDecisionSmoke() {
  const globalFlowObservationCount = await prisma.macroObservation.count({
    where: { indicatorCode: "GLOBAL_FLOW" },
  });
  const globalFlowProvenanceCount = await prisma.macroObservationProvenance.count({
    where: { indicatorCode: "GLOBAL_FLOW" },
  });
  const productionApprovedTrueCount = await prisma.macroObservation.count({
    where: { productionApproved: true },
  });
  const runtimeData = await loadMacroRuntimeData();
  const globalFlowRegistry = MACRO_INDICATOR_UNIVERSE.find(
    (item) => item.indicatorCode === "GLOBAL_FLOW",
  );
  const globalFlowRuntime = runtimeData.indicatorUniverse?.find(
    (item) => item.indicatorCode === "GLOBAL_FLOW",
  );

  const evidence = readFileSync(EVIDENCE_PATH, "utf-8");
  const parserStrategy = readFileSync(PARSER_STRATEGY_PATH, "utf-8");
  const boundaries = readFileSync(BOUNDARIES_PATH, "utf-8");
  const readinessGates = readFileSync(READINESS_GATES_PATH, "utf-8");
  const combinedDocs = [evidence, parserStrategy, boundaries, readinessGates].join("\n");

  const results = {
    phase: "149R",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    indicatorCode: "GLOBAL_FLOW",
    globalFlowObservationCount,
    globalFlowProvenanceCount,
    globalFlowStillUnpopulated:
      globalFlowObservationCount === 0 &&
      globalFlowProvenanceCount === 0 &&
      !globalFlowRuntime?.latestObservation &&
      !(runtimeData.dbBackedIndicators ?? []).includes("GLOBAL_FLOW"),
    frontendIndicatorUniverseExpanded:
      MACRO_INDICATOR_UNIVERSE.filter((item) => item.inCurrentFrontend).length !== 14,
    registryStillFrontendLocked: globalFlowRegistry?.inCurrentFrontend === true,
    chosenDefinitionDocumented:
      combinedDocs.includes("emerging_market_equity_fund_flow") &&
      combinedDocs.includes("Emerging-market equity fund net flow"),
    manualCsvSchemaDocumented:
      combinedDocs.includes("period,period_type,global_flow_value,unit,definition,scope,flow_type,source_name,source_url,publication_date,extracted_quote,notes"),
    noRiskProxySubstitution:
      combinedDocs.includes("Do not substitute DXY/VIX or other existing indicators") ||
      combinedDocs.includes("Do not substitute DXY/VIX"),
    productionApprovedTrueCount,
    smokePassed: false,
  };

  results.smokePassed =
    results.dbReadAttempted &&
    results.dbWriteAttempted === false &&
    results.providerFetchAttempted === false &&
    results.csvImportAttempted === false &&
    results.globalFlowStillUnpopulated &&
    results.frontendIndicatorUniverseExpanded === false &&
    results.registryStillFrontendLocked &&
    results.chosenDefinitionDocumented &&
    results.manualCsvSchemaDocumented &&
    results.noRiskProxySubstitution &&
    results.productionApprovedTrueCount === 0;

  console.log(JSON.stringify(results, null, 2));

  if (!results.smokePassed) {
    throw new Error("Phase 149R GLOBAL_FLOW definition decision smoke failed.");
  }

  return results;
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runGlobalFlowDefinitionDecisionSmoke()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
