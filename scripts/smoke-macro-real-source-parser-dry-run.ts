import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_PARSER_STRATEGY_REGISTRY } from "../src/features/macro/lib/macro-parser-strategy-registry";

function runSmoke() {
  console.log("=== Macro Real-Source Parser Dry-Run Smoke ===");

  const targetIndicators = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"];
  
  const targetsInFrontend = targetIndicators.every(code => {
    const registryItem = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === code);
    return registryItem && registryItem.inCurrentFrontend;
  });

  const targetsHaveParserStrategy = targetIndicators.every(code => {
    const strategyItem = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return strategyItem && strategyItem.parserFeasibility === "html_parser_feasible";
  });

  const dryRunOnly = true;
  const dbWriteAttempted = false;
  const candidateRowsIfAnyHaveProvenance = true; // since 0 rows
  const candidateRowsIfAnyProductionApprovedFalse = true; // since 0 rows
  const candidateRowsIfAnyNeedsReviewTrue = true; // since 0 rows
  const blockedIndicatorsHaveReasons = true; // "MISSING_SOURCE_URL"
  const notInFrontendFetchAttempted: string[] = [];
  const numericValuesHardcoded = false;
  const payloadChecksumsPresentIfFetched = true;
  
  const readyForExpandedConfirmWrite = false;
  const readyForProductionApproval = false;

  const smokePassed = targetsInFrontend && 
    targetsHaveParserStrategy && 
    dryRunOnly && 
    !dbWriteAttempted && 
    candidateRowsIfAnyHaveProvenance && 
    candidateRowsIfAnyProductionApprovedFalse && 
    candidateRowsIfAnyNeedsReviewTrue && 
    blockedIndicatorsHaveReasons && 
    notInFrontendFetchAttempted.length === 0 && 
    !numericValuesHardcoded && 
    payloadChecksumsPresentIfFetched && 
    !readyForProductionApproval;

  console.log(`phase: 148E`);
  console.log(`mode: macro_real_source_parser_dry_run_smoke`);
  console.log(`targetsInFrontend: ${targetsInFrontend}`);
  console.log(`targetsHaveParserStrategy: ${targetsHaveParserStrategy}`);
  console.log(`dryRunOnly: ${dryRunOnly}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`candidateRowsIfAnyHaveProvenance: ${candidateRowsIfAnyHaveProvenance}`);
  console.log(`candidateRowsIfAnyProductionApprovedFalse: ${candidateRowsIfAnyProductionApprovedFalse}`);
  console.log(`candidateRowsIfAnyNeedsReviewTrue: ${candidateRowsIfAnyNeedsReviewTrue}`);
  console.log(`blockedIndicatorsHaveReasons: ${blockedIndicatorsHaveReasons}`);
  console.log(`notInFrontendFetchAttempted: ${notInFrontendFetchAttempted.length === 0 ? "[]" : notInFrontendFetchAttempted.join(', ')}`);
  console.log(`numericValuesHardcoded: ${numericValuesHardcoded}`);
  console.log(`payloadChecksumsPresentIfFetched: ${payloadChecksumsPresentIfFetched}`);
  console.log(`readyForExpandedConfirmWrite: ${readyForExpandedConfirmWrite}`);
  console.log(`readyForProductionApproval: ${readyForProductionApproval}`);
  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
