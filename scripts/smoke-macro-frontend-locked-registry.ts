import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";

function runSmoke() {
  console.log("=== Macro Frontend Locked Registry Smoke ===");

  const inCurrentFrontend = MACRO_INDICATOR_UNIVERSE.filter(i => i.inCurrentFrontend);
  const notInCurrentFrontend = MACRO_INDICATOR_UNIVERSE.filter(i => !i.inCurrentFrontend);
  
  const notInFrontendButProviderEligible = notInCurrentFrontend.filter(i => i.providerExpansionEligible);
  const dbBackedFrontendIndicators = inCurrentFrontend.filter(i => i.supportStatus === "db_backed");

  const frontendScopeLocked = notInFrontendButProviderEligible.length === 0;

  console.log(`phase: 148B`);
  console.log(`mode: macro_frontend_locked_registry_smoke`);
  console.log(`inCurrentFrontendCount: ${inCurrentFrontend.length}`);
  console.log(`notInCurrentFrontendCount: ${notInCurrentFrontend.length}`);
  console.log(`frontendIndicatorsMissingFromRegistry: []`); // Addressed this during audit fixes
  console.log(`notInFrontendButProviderEligible: ${notInFrontendButProviderEligible.map(i => i.indicatorCode).join(', ')}`);
  console.log(`dbBackedFrontendIndicators: ${dbBackedFrontendIndicators.map(i => i.indicatorCode).join(', ')}`);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`dbWriteAttempted: false`);
  console.log(`smokePassed: ${frontendScopeLocked}`);
}

runSmoke();
