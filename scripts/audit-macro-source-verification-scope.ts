import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";

function runAudit() {
  console.log("=== Macro Source Verification Scope Audit ===");

  const frontendLockedIndicators = MACRO_INDICATOR_UNIVERSE.filter(i => i.inCurrentFrontend);
  const dbBackedIndicators = frontendLockedIndicators.filter(i => i.supportStatus === "db_backed").map(i => i.indicatorCode);
  const needsSourceVerificationIndicators = frontendLockedIndicators.filter(i => i.supportStatus !== "db_backed").map(i => i.indicatorCode);
  const providerExpansionEligibleIndicators = frontendLockedIndicators.filter(i => i.providerExpansionEligible).map(i => i.indicatorCode);
  const notInFrontendIndicators = MACRO_INDICATOR_UNIVERSE.filter(i => !i.inCurrentFrontend);
  const notInFrontendEligibleCount = notInFrontendIndicators.filter(i => i.providerExpansionEligible).length;

  const frontendScopeLocked = notInFrontendEligibleCount === 0;
  const auditPassed = notInFrontendEligibleCount === 0 && frontendScopeLocked;

  console.log(`phase: 148C`);
  console.log(`mode: macro_source_verification_scope_audit`);
  console.log(`frontendLockedIndicators: ${frontendLockedIndicators.map(i => i.indicatorCode).join(', ')}`);
  console.log(`frontendLockedCount: ${frontendLockedIndicators.length}`);
  console.log(`dbBackedIndicators: ${dbBackedIndicators.join(', ')}`);
  console.log(`needsSourceVerificationIndicators: ${needsSourceVerificationIndicators.join(', ')}`);
  console.log(`providerExpansionEligibleIndicators: ${providerExpansionEligibleIndicators.join(', ')}`);
  console.log(`notInFrontendIndicators: ${notInFrontendIndicators.map(i => i.indicatorCode).join(', ')}`);
  console.log(`notInFrontendEligibleCount: ${notInFrontendEligibleCount}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
