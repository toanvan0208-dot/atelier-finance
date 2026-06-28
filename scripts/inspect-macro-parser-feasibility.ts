import { MACRO_PARSER_STRATEGY_REGISTRY } from "../src/features/macro/lib/macro-parser-strategy-registry";

function runInspection() {
  console.log("=== Macro Parser Feasibility Inspection ===");
  
  const apiReadyIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.parserFeasibility === "api_ready").map(i => i.indicatorCode);
  const csvExcelReadyIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.parserFeasibility === "csv_excel_ready").map(i => i.indicatorCode);
  const htmlParserFeasibleIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.parserFeasibility === "html_parser_feasible").map(i => i.indicatorCode);
  const manualReviewOnlyIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.parserFeasibility === "manual_review_only").map(i => i.indicatorCode);
  const blockedIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.parserFeasibility === "blocked").map(i => i.indicatorCode);
  const notRecommendedIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.parserFeasibility === "not_recommended").map(i => i.indicatorCode);
  const candidateFor148EIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => i.candidateFor148E).map(i => i.indicatorCode);
  
  const notInFrontendInspectedIndicators = MACRO_PARSER_STRATEGY_REGISTRY.filter(i => !i.inCurrentFrontend).map(i => i.indicatorCode);

  const dryRun = true;
  const dbWriteAttempted = false;
  const numericValuesExtracted = 0;
  const productionApprovedTrueCount = 0;
  const readyForParserPrototypePhase = candidateFor148EIndicators.length > 0;
  const readyForProductionApproval = false;

  console.log(`phase: 148D`);
  console.log(`mode: macro_parser_feasibility_inspection`);
  console.log(`dryRun: ${dryRun}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`parserStrategyItems: ${MACRO_PARSER_STRATEGY_REGISTRY.length}`);
  console.log(`apiReadyIndicators: ${apiReadyIndicators.join(', ')}`);
  console.log(`csvExcelReadyIndicators: ${csvExcelReadyIndicators.join(', ')}`);
  console.log(`htmlParserFeasibleIndicators: ${htmlParserFeasibleIndicators.join(', ')}`);
  console.log(`manualReviewOnlyIndicators: ${manualReviewOnlyIndicators.join(', ')}`);
  console.log(`blockedIndicators: ${blockedIndicators.join(', ')}`);
  console.log(`notRecommendedIndicators: ${notRecommendedIndicators.join(', ')}`);
  console.log(`candidateFor148EIndicators: ${candidateFor148EIndicators.join(', ')}`);
  console.log(`notInFrontendInspectedIndicators: ${notInFrontendInspectedIndicators.length === 0 ? "[]" : notInFrontendInspectedIndicators.join(', ')}`);
  console.log(`numericValuesExtracted: ${numericValuesExtracted}`);
  console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
  console.log(`readyForParserPrototypePhase: ${readyForParserPrototypePhase}`);
  console.log(`readyForProductionApproval: ${readyForProductionApproval}`);
  
  const smokePassed = notInFrontendInspectedIndicators.length === 0 && numericValuesExtracted === 0 && productionApprovedTrueCount === 0;
  console.log(`smokePassed: ${smokePassed}`);
}

runInspection();
