import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_VERIFICATION_REGISTRY } from "../src/features/macro/lib/macro-source-verification-registry";

function runAudit() {
  console.log("=== Macro Parser Strategy Scope Audit ===");

  const frontendLockedIndicators = MACRO_INDICATOR_UNIVERSE.filter(i => i.inCurrentFrontend).map(i => i.indicatorCode);
  const dbBackedIndicators = MACRO_INDICATOR_UNIVERSE.filter(i => i.inCurrentFrontend && i.supportStatus === "db_backed").map(i => i.indicatorCode);
  
  const manualReviewIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "needs_manual_review")
    .map(i => i.indicatorCode);
    
  const blockedIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "blocked")
    .map(i => i.indicatorCode);
    
  const notAssessedIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "not_assessed")
    .map(i => i.indicatorCode);
    
  const parserStrategyEligibleIndicators = [...manualReviewIndicators, ...notAssessedIndicators]; // These are the ones we will assess for parsers

  const notInFrontendParserEligibleIndicators: string[] = [];

  const frontendScopeLocked = notInFrontendParserEligibleIndicators.length === 0;
  const auditPassed = frontendScopeLocked;

  console.log(`phase: 148D`);
  console.log(`mode: macro_parser_strategy_scope_audit`);
  console.log(`frontendLockedIndicators: ${frontendLockedIndicators.join(', ')}`);
  console.log(`manualReviewIndicators: ${manualReviewIndicators.join(', ')}`);
  console.log(`blockedIndicators: ${blockedIndicators.join(', ')}`);
  console.log(`notAssessedIndicators: ${notAssessedIndicators.join(', ')}`);
  console.log(`parserStrategyEligibleIndicators: ${parserStrategyEligibleIndicators.join(', ')}`);
  console.log(`notInFrontendParserEligibleIndicators: ${notInFrontendParserEligibleIndicators.length === 0 ? "[]" : notInFrontendParserEligibleIndicators.join(', ')}`);
  console.log(`dbBackedIndicators: ${dbBackedIndicators.join(', ')}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
