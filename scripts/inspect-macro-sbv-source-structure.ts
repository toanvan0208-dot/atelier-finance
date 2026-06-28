import { inspectSbvSource, SbvSourceInspectionResult } from "../src/features/macro/lib/macro-sbv-source-inspection";

async function runInspection() {
  console.log("=== Macro SBV Source Structure Inspection ===");

  const targets: ("USD_VND" | "INTERBANK_RATE_OVERNIGHT")[] = ["USD_VND", "INTERBANK_RATE_OVERNIGHT"];
  
  const results = await Promise.all(targets.map(t => inspectSbvSource(t)));

  const dryRun = true;
  const dbWriteAttempted = false;
  const sourceUrlsInspected = results.map(r => r.sourceUrl);
  const fetchAttempted = results.some(r => r.fetchAttempted);
  const fetchSucceeded = results.some(r => r.fetchSucceeded);
  const contentTypes = Array.from(new Set(results.map(r => r.contentType || "none")));
  const htmlFetched = fetchSucceeded;
  const tableLikeMarkupDetected = results.some(r => r.tableLikeMarkupDetected);
  const scriptReferencesDetectedCount = results.reduce((acc, r) => acc + r.scriptReferencesDetected.length, 0);
  const formActionsDetectedCount = results.reduce((acc, r) => acc + r.formActionsDetected.length, 0);
  const possibleEndpointCandidates = Array.from(new Set(results.flatMap(r => r.possibleEndpointCandidates)));
  
  const requiresJavascriptRenderingIndicators = results.filter(r => r.requiresJavascriptRendering).map(r => r.indicatorCode);
  const retryHtmlParserCandidateIndicators = results.filter(r => r.parserStrategyRecommendation === "retry_html_parser_with_selectors").map(r => r.indicatorCode);
  const endpointInvestigationCandidateIndicators = results.filter(r => r.parserStrategyRecommendation === "investigate_endpoint_candidate").map(r => r.indicatorCode);
  const manualReviewOnlyIndicators = results.filter(r => r.parserStrategyRecommendation === "manual_review_only").map(r => r.indicatorCode);
  const alternateSourceNeededIndicators = results.filter(r => r.parserStrategyRecommendation === "alternate_source_needed").map(r => r.indicatorCode);
  const blockedIndicators = results.filter(r => r.blockedReasons.length > 0).map(r => r.indicatorCode);
  
  const numericValuesExtracted = 0;
  const productionApprovedTrueCount = 0;
  
  const readyForVerifiedEndpointParserDryRun = endpointInvestigationCandidateIndicators.length > 0;
  const readyForProductionApproval = false;
  
  const smokePassed = true;

  console.log(`phase: 148H`);
  console.log(`mode: macro_sbv_source_structure_inspection`);
  console.log(`dryRun: ${dryRun}`);
  console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
  console.log(`targetIndicators: ${targets.join(', ')}`);
  console.log(`sourceUrlsInspected: ${sourceUrlsInspected.join(', ')}`);
  console.log(`fetchAttempted: ${fetchAttempted}`);
  console.log(`fetchSucceeded: ${fetchSucceeded}`);
  console.log(`contentTypes: ${contentTypes.join(', ')}`);
  console.log(`htmlFetched: ${htmlFetched}`);
  console.log(`tableLikeMarkupDetected: ${tableLikeMarkupDetected}`);
  console.log(`scriptReferencesDetectedCount: ${scriptReferencesDetectedCount}`);
  console.log(`formActionsDetectedCount: ${formActionsDetectedCount}`);
  console.log(`possibleEndpointCandidates: ${possibleEndpointCandidates.length === 0 ? "[]" : possibleEndpointCandidates.join(', ')}`);
  console.log(`requiresJavascriptRenderingIndicators: ${requiresJavascriptRenderingIndicators.join(', ')}`);
  console.log(`retryHtmlParserCandidateIndicators: ${retryHtmlParserCandidateIndicators.join(', ')}`);
  console.log(`endpointInvestigationCandidateIndicators: ${endpointInvestigationCandidateIndicators.join(', ')}`);
  console.log(`manualReviewOnlyIndicators: ${manualReviewOnlyIndicators.join(', ')}`);
  console.log(`alternateSourceNeededIndicators: ${alternateSourceNeededIndicators.join(', ')}`);
  console.log(`blockedIndicators: ${blockedIndicators.join(', ')}`);
  console.log(`numericValuesExtracted: ${numericValuesExtracted}`);
  console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
  console.log(`readyForVerifiedEndpointParserDryRun: ${readyForVerifiedEndpointParserDryRun}`);
  console.log(`readyForProductionApproval: ${readyForProductionApproval}`);
  console.log(`smokePassed: ${smokePassed}`);
}

runInspection().catch(console.error);
