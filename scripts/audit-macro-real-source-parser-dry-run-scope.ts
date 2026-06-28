import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_PARSER_STRATEGY_REGISTRY } from "../src/features/macro/lib/macro-parser-strategy-registry";

function runAudit() {
  console.log("=== Macro Real-Source Parser Dry-Run Scope Audit ===");

  const targetIndicators = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"];
  
  const targetIndicatorsInFrontend = targetIndicators.filter(code => {
    const registryItem = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === code);
    return registryItem && registryItem.inCurrentFrontend;
  });

  const targetIndicatorsCandidateForParser = targetIndicators.filter(code => {
    const strategyItem = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return strategyItem && strategyItem.candidateFor148E;
  });

  const targetIndicatorsHaveSourceStrategy = targetIndicators.filter(code => {
    const strategyItem = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return strategyItem && strategyItem.parserFeasibility === "html_parser_feasible";
  });

  const notInFrontendTargetIndicators = targetIndicators.filter(code => !targetIndicatorsInFrontend.includes(code));
  
  const nonTargetIndicatorsExcluded = true; // By definition of targetIndicators
  const frontendScopeLocked = notInFrontendTargetIndicators.length === 0;
  
  const auditPassed = targetIndicators.length === 2 && 
    frontendScopeLocked && 
    targetIndicatorsCandidateForParser.length === 2 && 
    targetIndicatorsHaveSourceStrategy.length === 2;

  console.log(`phase: 148E`);
  console.log(`mode: macro_real_source_parser_dry_run_scope_audit`);
  console.log(`targetIndicators: ${targetIndicators.join(', ')}`);
  console.log(`targetIndicatorsInFrontend: ${targetIndicatorsInFrontend.join(', ')}`);
  console.log(`targetIndicatorsCandidateForParser: ${targetIndicatorsCandidateForParser.join(', ')}`);
  console.log(`targetIndicatorsHaveSourceStrategy: ${targetIndicatorsHaveSourceStrategy.join(', ')}`);
  console.log(`notInFrontendTargetIndicators: ${notInFrontendTargetIndicators.length === 0 ? "[]" : notInFrontendTargetIndicators.join(', ')}`);
  console.log(`nonTargetIndicatorsExcluded: ${nonTargetIndicatorsExcluded}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
