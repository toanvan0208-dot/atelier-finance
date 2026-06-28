import { MACRO_PARSER_STRATEGY_REGISTRY } from "../src/features/macro/lib/macro-parser-strategy-registry";

function runSmoke() {
  console.log("=== Macro Parser Strategy Smoke ===");
  
  const parserStrategyItemsCount = MACRO_PARSER_STRATEGY_REGISTRY.length;
  const allParserItemsInFrontend = MACRO_PARSER_STRATEGY_REGISTRY.every(i => i.inCurrentFrontend);
  
  const candidateFor148EIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.candidateFor148E);
  const candidateFor148EAllFrontend = candidateFor148EIndicators.every(i => i.inCurrentFrontend);
  
  const candidateFor148EHaveFeasibleParser = candidateFor148EIndicators.every(i => 
    i.parserFeasibility === "api_ready" || 
    i.parserFeasibility === "csv_excel_ready" || 
    i.parserFeasibility === "html_parser_feasible"
  );

  const blockedIndicatorsHaveReasons = MACRO_PARSER_STRATEGY_REGISTRY
    .filter(i => i.parserFeasibility === "blocked")
    .every(i => i.blockedReason || i.limitations.length > 0 || i.validationNotes.length > 0);

  const manualReviewOnlyIndicatorsHaveReasons = MACRO_PARSER_STRATEGY_REGISTRY
    .filter(i => i.parserFeasibility === "manual_review_only")
    .every(i => i.limitations.length > 0 || i.validationNotes.length > 0);

  // We ensure no numeric values are present by checking the keys/types of the registry (which only has metadata).
  const noNumericValuesInStrategyRegistry = MACRO_PARSER_STRATEGY_REGISTRY.every(i => 
    !("value" in i) && !("observation" in i) && !("data" in i)
  );

  console.log(`phase: 148D`);
  console.log(`mode: macro_parser_strategy_smoke`);
  console.log(`parserStrategyItemsCount: ${parserStrategyItemsCount}`);
  console.log(`allParserItemsInFrontend: ${allParserItemsInFrontend}`);
  console.log(`candidateFor148EIndicators: ${candidateFor148EIndicators.map(i => i.indicatorCode).join(', ')}`);
  console.log(`candidateFor148EAllFrontend: ${candidateFor148EAllFrontend}`);
  console.log(`candidateFor148EHaveFeasibleParser: ${candidateFor148EHaveFeasibleParser}`);
  console.log(`blockedIndicatorsHaveReasons: ${blockedIndicatorsHaveReasons}`);
  console.log(`manualReviewOnlyIndicatorsHaveReasons: ${manualReviewOnlyIndicatorsHaveReasons}`);
  console.log(`noNumericValuesInStrategyRegistry: ${noNumericValuesInStrategyRegistry}`);
  console.log(`dbWriteAttempted: false`);
  
  const smokePassed = allParserItemsInFrontend && 
    candidateFor148EAllFrontend && 
    candidateFor148EHaveFeasibleParser && 
    blockedIndicatorsHaveReasons && 
    manualReviewOnlyIndicatorsHaveReasons &&
    noNumericValuesInStrategyRegistry;
    
  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
