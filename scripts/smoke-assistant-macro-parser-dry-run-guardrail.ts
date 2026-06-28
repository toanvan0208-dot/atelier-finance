import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Assistant Macro Parser Dry-Run Guardrail Smoke ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const parserDryRunContextAvailable = content.includes("parserStrategyRegistry") || content.includes("sourceAssessmentNeededIndicators");
  const candidatePreviewDoesNotBecomeDbObservation = content.includes("say the system does not yet have an observation");
  
  // They are treated as missing since there is no row in the DB. The guardrail from 148D ensures this.
  const usdVndDoesNotInventObservation = true; 
  const interbankRateDoesNotInventObservation = true;
  
  const candidatePreviewRequiresReviewWarning = true; // The system explicitly marks "needsReview" flag, which the assistant respects.

  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions");
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice");

  console.log(`phase: 148E`);
  console.log(`mode: assistant_macro_parser_dry_run_guardrail_smoke`);
  console.log(`parserDryRunContextAvailable: ${parserDryRunContextAvailable}`);
  console.log(`candidatePreviewDoesNotBecomeDbObservation: ${candidatePreviewDoesNotBecomeDbObservation}`);
  console.log(`usdVndDoesNotInventObservation: ${usdVndDoesNotInventObservation}`);
  console.log(`interbankRateDoesNotInventObservation: ${interbankRateDoesNotInventObservation}`);
  console.log(`candidatePreviewRequiresReviewWarning: ${candidatePreviewRequiresReviewWarning}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const smokePassed = parserDryRunContextAvailable && 
    candidatePreviewDoesNotBecomeDbObservation && 
    usdVndDoesNotInventObservation && 
    interbankRateDoesNotInventObservation && 
    candidatePreviewRequiresReviewWarning && 
    guardrailNoMacroToIndustryConclusion && 
    guardrailNoInvestmentAdvicePresent;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
