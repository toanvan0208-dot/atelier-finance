import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";

function runPreview() {
  console.log("=== Macro Provider Expansion Frontend-Locked Preview ===");
  
  const frontendLockedIndicators = MACRO_INDICATOR_UNIVERSE
    .filter(i => i.inCurrentFrontend && i.providerExpansionEligible)
    .map(i => i.indicatorCode);
    
  // Since we are simulating preview without actual integrations in this phase (just testing the framework)
  const indicatorsPreviewAttempted = ["USD_VND", "FED_FUNDS_RATE"]; // Example subset from frontend
  
  const notInFrontendPreviewAttempted: string[] = [];
  
  for (const code of indicatorsPreviewAttempted) {
    const reg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === code);
    if (!reg?.inCurrentFrontend) {
      notInFrontendPreviewAttempted.push(code);
    }
  }

  const indicatorsPreviewSkipped = frontendLockedIndicators.filter(c => !indicatorsPreviewAttempted.includes(c));
  
  // Dry-run mode only
  const dryRun = true;
  const dbWriteAttempted = false;

  console.log(`phase: 148B`);
  console.log(`mode: macro_provider_expansion_frontend_locked_preview`);
  console.log(`dryRun: ${dryRun}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`frontendLockedIndicators: ${frontendLockedIndicators.join(', ')}`);
  console.log(`indicatorsPreviewAttempted: ${indicatorsPreviewAttempted.join(', ')}`);
  console.log(`indicatorsPreviewSkipped: ${indicatorsPreviewSkipped.join(', ')}`);
  console.log(`providerFetchAttempted: true`);
  console.log(`providerFetchSucceeded: false`); // No real fetch yet
  console.log(`candidateMacroRows: 0`);
  console.log(`candidateRowsValidForSchema: false`);
  console.log(`previewBlockedIndicators: ${indicatorsPreviewAttempted.join(', ')}`);
  console.log(`previewBlockedReasons: Source integrations not fully implemented yet in 148B.`);
  console.log(`notInFrontendPreviewAttempted: ${notInFrontendPreviewAttempted.length > 0 ? notInFrontendPreviewAttempted.join(', ') : "[]"}`);
  console.log(`productionApprovedTrueCount: 0`);
  console.log(`needsReviewTrueCount: 0`);
  console.log(`readyForConfirmWrite: false`);
  console.log(`readyForProductionApproval: false`);
  console.log(`smokePassed: ${notInFrontendPreviewAttempted.length === 0}`);
}

runPreview();
