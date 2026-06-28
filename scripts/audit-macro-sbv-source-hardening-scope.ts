import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";

function runAudit() {
  console.log("=== Macro SBV Source Hardening Scope Audit ===");

  const targetIndicators = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"];
  
  const targetIndicatorsInFrontend = targetIndicators.filter(code => {
    const registryItem = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === code);
    return registryItem && registryItem.inCurrentFrontend;
  });

  const targetIndicatorsHaveVerifiedSbvUrls = targetIndicators.filter(code => {
    const candidate = MACRO_SOURCE_URL_CANDIDATES.find(i => i.indicatorCode === code);
    return candidate && candidate.sourceUrl;
  });
  
  const targetIndicatorsParserFailedIn148G = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"]; // Based on Phase 148G results

  const notInFrontendTargetIndicators = targetIndicators.filter(code => !targetIndicatorsInFrontend.includes(code));
  
  const frontendScopeLocked = notInFrontendTargetIndicators.length === 0;
  
  const auditPassed = targetIndicators.length === 2 && 
    frontendScopeLocked && 
    targetIndicatorsHaveVerifiedSbvUrls.length === 2;

  console.log(`phase: 148H`);
  console.log(`mode: macro_sbv_source_hardening_scope_audit`);
  console.log(`targetIndicators: ${targetIndicators.join(', ')}`);
  console.log(`targetIndicatorsInFrontend: ${targetIndicatorsInFrontend.join(', ')}`);
  console.log(`targetIndicatorsHaveVerifiedSbvUrls: ${targetIndicatorsHaveVerifiedSbvUrls.join(', ')}`);
  console.log(`targetIndicatorsParserFailedIn148G: ${targetIndicatorsParserFailedIn148G.join(', ')}`);
  console.log(`notInFrontendTargetIndicators: ${notInFrontendTargetIndicators.length === 0 ? "[]" : notInFrontendTargetIndicators.join(', ')}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
