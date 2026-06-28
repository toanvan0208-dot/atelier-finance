import { MACRO_SOURCE_VERIFICATION_REGISTRY } from "../src/features/macro/lib/macro-source-verification-registry";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";

function runSmoke() {
  console.log("=== Macro Source Verification Frontend-Locked Smoke ===");
  
  const frontendLockedIndicators = MACRO_INDICATOR_UNIVERSE
    .filter(i => i.inCurrentFrontend)
    .map(i => i.indicatorCode);
    
  const allSourceItemsInFrontend = MACRO_SOURCE_VERIFICATION_REGISTRY.every(i => i.inCurrentFrontend);
  
  const notInFrontendProviderFetchEligible = MACRO_SOURCE_VERIFICATION_REGISTRY.filter(i => !i.inCurrentFrontend && i.providerFetchEligible);
  const noNotInFrontendProviderFetchEligible = notInFrontendProviderFetchEligible.length === 0;

  const providerFetchEligibleRequiresMachineReadableApi = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.providerFetchEligible)
    .every(i => i.automationLevel === "machine_readable_api");

  const blockedIndicatorsHaveReasons = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "blocked")
    .every(i => i.limitations.length > 0 || i.notes.length > 0);

  const manualReviewIndicatorsHaveReasons = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "needs_manual_review")
    .every(i => i.limitations.length > 0 || i.notes.length > 0);

  console.log(`phase: 148C`);
  console.log(`mode: macro_source_verification_frontend_locked_smoke`);
  console.log(`frontendLockedIndicators: ${frontendLockedIndicators.join(', ')}`);
  console.log(`sourceVerificationItems: ${MACRO_SOURCE_VERIFICATION_REGISTRY.length}`);
  console.log(`allSourceItemsInFrontend: ${allSourceItemsInFrontend}`);
  console.log(`noNotInFrontendProviderFetchEligible: ${noNotInFrontendProviderFetchEligible}`);
  console.log(`providerFetchEligibleRequiresMachineReadableApi: ${providerFetchEligibleRequiresMachineReadableApi}`);
  console.log(`blockedIndicatorsHaveReasons: ${blockedIndicatorsHaveReasons}`);
  console.log(`manualReviewIndicatorsHaveReasons: ${manualReviewIndicatorsHaveReasons}`);
  console.log(`dbWriteAttempted: false`);
  
  const smokePassed = allSourceItemsInFrontend && 
    noNotInFrontendProviderFetchEligible && 
    providerFetchEligibleRequiresMachineReadableApi && 
    blockedIndicatorsHaveReasons && 
    manualReviewIndicatorsHaveReasons;
    
  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
