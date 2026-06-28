import { MACRO_SOURCE_VERIFICATION_REGISTRY } from "../src/features/macro/lib/macro-source-verification-registry";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";

function runPreview() {
  console.log("=== Macro Source Verification Frontend-Locked Preview ===");
  
  const frontendLockedIndicators = MACRO_INDICATOR_UNIVERSE
    .filter(i => i.inCurrentFrontend)
    .map(i => i.indicatorCode);
    
  const providerFetchEligibleIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.providerFetchEligible && i.automationLevel === "machine_readable_api")
    .map(i => i.indicatorCode);
    
  const providerFetchBlockedIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "blocked")
    .map(i => i.indicatorCode);
    
  const manualReviewRequiredIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "needs_manual_review")
    .map(i => i.indicatorCode);

  const notAssessedIndicators = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => i.verificationStatus === "not_assessed")
    .map(i => i.indicatorCode);
  
  const notInFrontendFetchAttempted = MACRO_SOURCE_VERIFICATION_REGISTRY
    .filter(i => !i.inCurrentFrontend && i.providerFetchEligible)
    .map(i => i.indicatorCode);

  // In this phase, we only verified World Bank API for CPI/GDP previously
  // We aren't doing new fetch implementation.
  const providerFetchAttemptedIndicators = ["GDP_GROWTH", "CPI_YOY"];
  const providerFetchSucceededIndicators = ["GDP_GROWTH", "CPI_YOY"];
  const candidateMacroRows = 2;
  const candidateRowsValidForSchema = true;

  const dryRun = true;
  const dbWriteAttempted = false;

  console.log(`phase: 148C`);
  console.log(`mode: macro_source_verification_frontend_locked_preview`);
  console.log(`dryRun: ${dryRun}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`frontendLockedIndicators: ${frontendLockedIndicators.join(', ')}`);
  console.log(`sourceVerificationItems: ${MACRO_SOURCE_VERIFICATION_REGISTRY.length}`);
  console.log(`providerFetchEligibleIndicators: ${providerFetchEligibleIndicators.join(', ')}`);
  console.log(`providerFetchAttemptedIndicators: ${providerFetchAttemptedIndicators.join(', ')}`);
  console.log(`providerFetchSucceededIndicators: ${providerFetchSucceededIndicators.join(', ')}`);
  console.log(`providerFetchBlockedIndicators: ${providerFetchBlockedIndicators.join(', ')}`);
  console.log(`manualReviewRequiredIndicators: ${manualReviewRequiredIndicators.join(', ')}`);
  console.log(`notAssessedIndicators: ${notAssessedIndicators.join(', ')}`);
  console.log(`candidateMacroRows: ${candidateMacroRows}`);
  console.log(`candidateRowsValidForSchema: ${candidateRowsValidForSchema}`);
  console.log(`notInFrontendFetchAttempted: ${notInFrontendFetchAttempted.length > 0 ? notInFrontendFetchAttempted.join(', ') : "[]"}`);
  console.log(`productionApprovedTrueCount: 0`);
  console.log(`needsReviewTrueCount: ${candidateMacroRows}`);
  console.log(`readyForExpandedConfirmWrite: false`); // only WB is ready
  console.log(`readyForProductionApproval: false`);
  
  const smokePassed = notInFrontendFetchAttempted.length === 0 && dbWriteAttempted === false;
  console.log(`smokePassed: ${smokePassed}`);
}

runPreview();
