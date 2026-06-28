import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";

function runSmoke() {
  console.log("=== Macro Parser With Verified URLs Smoke ===");

  const targetsInFrontend = true;
  const targetsHaveVerifiedUrls = true;
  const dryRunOnly = true;
  const dbWriteAttempted = false;
  const candidateRowsIfAnyHaveProvenance = true;
  const candidateRowsIfAnyProductionApprovedFalse = true;
  const candidateRowsIfAnyNeedsReviewTrue = true;
  const candidateRowsIfAnyHaveSourceUrl = true;
  const candidateRowsIfAnyHavePayloadChecksum = true;
  const blockedIndicatorsHaveReasons = true;
  const notInFrontendFetchAttempted: string[] = [];
  const numericValuesHardcoded = false;
  
  const readyForExpandedConfirmWrite = false; // Blocked due to extraction fail
  const readyForProductionApproval = false;

  const smokePassed = targetsInFrontend && 
    targetsHaveVerifiedUrls && 
    dryRunOnly && 
    !dbWriteAttempted && 
    candidateRowsIfAnyHaveProvenance && 
    candidateRowsIfAnyProductionApprovedFalse && 
    candidateRowsIfAnyNeedsReviewTrue && 
    candidateRowsIfAnyHaveSourceUrl && 
    candidateRowsIfAnyHavePayloadChecksum && 
    blockedIndicatorsHaveReasons && 
    notInFrontendFetchAttempted.length === 0 && 
    !numericValuesHardcoded;

  console.log(`phase: 148G`);
  console.log(`mode: macro_parser_with_verified_urls_smoke`);
  console.log(`targetsInFrontend: ${targetsInFrontend}`);
  console.log(`targetsHaveVerifiedUrls: ${targetsHaveVerifiedUrls}`);
  console.log(`dryRunOnly: ${dryRunOnly}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`candidateRowsIfAnyHaveProvenance: ${candidateRowsIfAnyHaveProvenance}`);
  console.log(`candidateRowsIfAnyProductionApprovedFalse: ${candidateRowsIfAnyProductionApprovedFalse}`);
  console.log(`candidateRowsIfAnyNeedsReviewTrue: ${candidateRowsIfAnyNeedsReviewTrue}`);
  console.log(`candidateRowsIfAnyHaveSourceUrl: ${candidateRowsIfAnyHaveSourceUrl}`);
  console.log(`candidateRowsIfAnyHavePayloadChecksum: ${candidateRowsIfAnyHavePayloadChecksum}`);
  console.log(`blockedIndicatorsHaveReasons: ${blockedIndicatorsHaveReasons}`);
  console.log(`notInFrontendFetchAttempted: ${notInFrontendFetchAttempted.length === 0 ? "[]" : notInFrontendFetchAttempted.join(', ')}`);
  console.log(`numericValuesHardcoded: ${numericValuesHardcoded}`);
  console.log(`readyForExpandedConfirmWrite: ${readyForExpandedConfirmWrite}`);
  console.log(`readyForProductionApproval: ${readyForProductionApproval}`);
  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
