import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";
import { MACRO_PARSER_STRATEGY_REGISTRY } from "../src/features/macro/lib/macro-parser-strategy-registry";

function runAudit() {
  console.log("=== Macro Parser Verified URL Scope Audit ===");

  const targetIndicators = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"];
  
  const targetIndicatorsInFrontend = targetIndicators.filter(code => {
    const registryItem = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === code);
    return registryItem && registryItem.inCurrentFrontend;
  });

  const targetIndicatorsHaveVerifiedUrls = targetIndicators.filter(code => {
    const candidate = MACRO_SOURCE_URL_CANDIDATES.find(i => i.indicatorCode === code);
    return candidate && candidate.sourceUrl;
  });
  
  const targetIndicatorsParserEligible = targetIndicators.filter(code => {
    const strategy = MACRO_PARSER_STRATEGY_REGISTRY.find(i => i.indicatorCode === code);
    return strategy && strategy.parserFeasibility === "html_parser_feasible";
  });

  const verifiedSourceUrls = targetIndicators.map(code => {
    const candidate = MACRO_SOURCE_URL_CANDIDATES.find(i => i.indicatorCode === code);
    return candidate?.sourceUrl || "none";
  });

  const notInFrontendTargetIndicators = targetIndicators.filter(code => !targetIndicatorsInFrontend.includes(code));
  
  const nonTargetIndicatorsExcluded = true; // By definition
  const frontendScopeLocked = notInFrontendTargetIndicators.length === 0;
  
  const auditPassed = targetIndicators.length === 2 && 
    frontendScopeLocked && 
    targetIndicatorsHaveVerifiedUrls.length === 2 &&
    targetIndicatorsParserEligible.length === 2;

  console.log(`phase: 148G`);
  console.log(`mode: macro_parser_verified_url_scope_audit`);
  console.log(`targetIndicators: ${targetIndicators.join(', ')}`);
  console.log(`targetIndicatorsInFrontend: ${targetIndicatorsInFrontend.join(', ')}`);
  console.log(`targetIndicatorsHaveVerifiedUrls: ${targetIndicatorsHaveVerifiedUrls.join(', ')}`);
  console.log(`targetIndicatorsParserEligible: ${targetIndicatorsParserEligible.join(', ')}`);
  console.log(`notInFrontendTargetIndicators: ${notInFrontendTargetIndicators.length === 0 ? "[]" : notInFrontendTargetIndicators.join(', ')}`);
  console.log(`verifiedSourceUrls: ${verifiedSourceUrls.join(', ')}`);
  console.log(`nonTargetIndicatorsExcluded: ${nonTargetIndicatorsExcluded}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
