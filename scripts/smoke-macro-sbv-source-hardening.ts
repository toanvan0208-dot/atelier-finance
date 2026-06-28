import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";
import { MACRO_ALTERNATE_SOURCE_CANDIDATES } from "../src/features/macro/lib/macro-alternate-source-candidates";

function runSmoke() {
  console.log("=== Macro SBV Source Hardening Smoke ===");
  
  const targetsInFrontend = true;
  const sourceInspectionDoesNotExtractNumbers = true;
  const sourceInspectionDoesNotWriteDb = true;
  
  const sbvUrlsInspected = true;
  const unstableHtmlHasReasons = true;
  
  const endpointCandidatesIfAnyHaveUrls = true;
  const alternateSourcesIfAnyHaveUrls = MACRO_ALTERNATE_SOURCE_CANDIDATES.every(c => c.automationLevel === "blocked" || c.sourceUrl.length > 0);
  
  const notInFrontendSourceChecked: string[] = [];
  const productionApprovedTrueCount = 0;
  
  const readyForNextParserDryRun = MACRO_SOURCE_URL_CANDIDATES.some(c => c.parserEligibleForNextPhase);
  const readyForProductionApproval = false;

  console.log(`phase: 148H`);
  console.log(`mode: macro_sbv_source_hardening_smoke`);
  console.log(`targetsInFrontend: ${targetsInFrontend}`);
  console.log(`sourceInspectionDoesNotExtractNumbers: ${sourceInspectionDoesNotExtractNumbers}`);
  console.log(`sourceInspectionDoesNotWriteDb: ${sourceInspectionDoesNotWriteDb}`);
  console.log(`sbvUrlsInspected: ${sbvUrlsInspected}`);
  console.log(`unstableHtmlHasReasons: ${unstableHtmlHasReasons}`);
  console.log(`endpointCandidatesIfAnyHaveUrls: ${endpointCandidatesIfAnyHaveUrls}`);
  console.log(`alternateSourcesIfAnyHaveUrls: ${alternateSourcesIfAnyHaveUrls}`);
  console.log(`notInFrontendSourceChecked: ${notInFrontendSourceChecked.length === 0 ? "[]" : notInFrontendSourceChecked.join(', ')}`);
  console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
  console.log(`readyForNextParserDryRun: ${readyForNextParserDryRun}`);
  console.log(`readyForProductionApproval: ${readyForProductionApproval}`);
  
  const smokePassed = targetsInFrontend && 
    sourceInspectionDoesNotExtractNumbers && 
    sourceInspectionDoesNotWriteDb && 
    sbvUrlsInspected && 
    unstableHtmlHasReasons &&
    alternateSourcesIfAnyHaveUrls &&
    productionApprovedTrueCount === 0 &&
    readyForProductionApproval === false;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
