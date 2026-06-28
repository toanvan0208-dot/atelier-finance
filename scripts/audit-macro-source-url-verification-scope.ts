import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_PARSER_STRATEGY_REGISTRY } from "../src/features/macro/lib/macro-parser-strategy-registry";

function runAudit() {
  console.log("=== Macro Source URL Verification Scope Audit ===");

  const targetIndicators = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"];
  
  const targetIndicatorsInFrontend = targetIndicators.filter(code => {
    const registryItem = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === code);
    return registryItem && registryItem.inCurrentFrontend;
  });

  const targetIndicatorsNeedSourceUrl = targetIndicators.filter(code => {
    const strategyItem = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return strategyItem && strategyItem.parserFeasibility === "html_parser_feasible" && !strategyItem.sourceUrl;
  });
  
  const currentSourceUrls = targetIndicators.map(code => {
    const strategyItem = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return strategyItem?.sourceUrl || "none";
  });

  const missingSourceUrlIndicators = targetIndicators.filter(code => {
    const strategyItem = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return !strategyItem?.sourceUrl;
  });

  const notInFrontendTargetIndicators = targetIndicators.filter(code => !targetIndicatorsInFrontend.includes(code));
  
  const nonTargetIndicatorsExcluded = true; // By definition of targetIndicators
  const frontendScopeLocked = notInFrontendTargetIndicators.length === 0;
  
  const auditPassed = targetIndicators.length === 2 && 
    frontendScopeLocked && 
    missingSourceUrlIndicators.length === 2;

  console.log(`phase: 148F`);
  console.log(`mode: macro_source_url_verification_scope_audit`);
  console.log(`targetIndicators: ${targetIndicators.join(', ')}`);
  console.log(`targetIndicatorsInFrontend: ${targetIndicatorsInFrontend.join(', ')}`);
  console.log(`targetIndicatorsNeedSourceUrl: ${targetIndicatorsNeedSourceUrl.join(', ')}`);
  console.log(`currentSourceUrls: ${currentSourceUrls.join(', ')}`);
  console.log(`missingSourceUrlIndicators: ${missingSourceUrlIndicators.join(', ')}`);
  console.log(`notInFrontendTargetIndicators: ${notInFrontendTargetIndicators.length === 0 ? "[]" : notInFrontendTargetIndicators.join(', ')}`);
  console.log(`nonTargetIndicatorsExcluded: ${nonTargetIndicatorsExcluded}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
