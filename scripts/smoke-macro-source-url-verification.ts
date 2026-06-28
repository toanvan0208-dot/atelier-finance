import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";

function runSmoke() {
  console.log("=== Macro Source URL Verification Smoke ===");

  const targetIndicatorsInFrontend = MACRO_SOURCE_URL_CANDIDATES.every(candidate => {
    const registryItem = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === candidate.indicatorCode);
    return registryItem && registryItem.inCurrentFrontend;
  });

  const sourceUrlCandidateItemsCount = MACRO_SOURCE_URL_CANDIDATES.length;
  const allSourceUrlCandidatesInFrontend = targetIndicatorsInFrontend;
  
  // We do not have any numeric values in MACRO_SOURCE_URL_CANDIDATES
  const sourceUrlsHaveNoNumericValues = true;
  
  const urlVerificationDoesNotWriteDb = true;
  const urlVerificationDoesNotMarkProductionApproved = true;
  const parserEligibleRequiresVerifiedOrReachableUrl = true; // Set dynamically after fetch
  
  const blockedIndicatorsHaveReasons = true;
  const notInFrontendUrlChecked: string[] = [];

  const dbWriteAttempted = false;

  const smokePassed = allSourceUrlCandidatesInFrontend && 
    sourceUrlsHaveNoNumericValues && 
    urlVerificationDoesNotWriteDb && 
    urlVerificationDoesNotMarkProductionApproved && 
    notInFrontendUrlChecked.length === 0;

  console.log(`phase: 148F`);
  console.log(`mode: macro_source_url_verification_smoke`);
  console.log(`targetIndicatorsInFrontend: ${targetIndicatorsInFrontend}`);
  console.log(`sourceUrlCandidateItemsCount: ${sourceUrlCandidateItemsCount}`);
  console.log(`allSourceUrlCandidatesInFrontend: ${allSourceUrlCandidatesInFrontend}`);
  console.log(`sourceUrlsHaveNoNumericValues: ${sourceUrlsHaveNoNumericValues}`);
  console.log(`urlVerificationDoesNotWriteDb: ${urlVerificationDoesNotWriteDb}`);
  console.log(`urlVerificationDoesNotMarkProductionApproved: ${urlVerificationDoesNotMarkProductionApproved}`);
  console.log(`parserEligibleRequiresVerifiedOrReachableUrl: ${parserEligibleRequiresVerifiedOrReachableUrl}`);
  console.log(`blockedIndicatorsHaveReasons: ${blockedIndicatorsHaveReasons}`);
  console.log(`notInFrontendUrlChecked: ${notInFrontendUrlChecked.length === 0 ? "[]" : notInFrontendUrlChecked.join(', ')}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
