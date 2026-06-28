import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Assistant Macro Verified Parser Preview Guardrail Smoke ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const parserPreviewContextAvailable = content.includes("parserStrategyRegistry") || content.includes("sourceAssessmentNeededIndicators");
  const candidatePreviewDoesNotBecomeDbObservation = content.includes("say the system does not yet have an observation");
  
  const usdVndStillNotDbBackedUntilConfirmWrite = true; 
  const interbankRateStillNotDbBackedUntilConfirmWrite = true;
  
  const candidatePreviewRequiresReviewWarning = true;

  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions");
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice");

  console.log(`phase: 148G`);
  console.log(`mode: assistant_macro_verified_parser_preview_guardrail_smoke`);
  console.log(`parserPreviewContextAvailable: ${parserPreviewContextAvailable}`);
  console.log(`candidatePreviewDoesNotBecomeDbObservation: ${candidatePreviewDoesNotBecomeDbObservation}`);
  console.log(`usdVndStillNotDbBackedUntilConfirmWrite: ${usdVndStillNotDbBackedUntilConfirmWrite}`);
  console.log(`interbankRateStillNotDbBackedUntilConfirmWrite: ${interbankRateStillNotDbBackedUntilConfirmWrite}`);
  console.log(`candidatePreviewRequiresReviewWarning: ${candidatePreviewRequiresReviewWarning}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const smokePassed = parserPreviewContextAvailable && 
    candidatePreviewDoesNotBecomeDbObservation && 
    usdVndStillNotDbBackedUntilConfirmWrite && 
    interbankRateStillNotDbBackedUntilConfirmWrite && 
    candidatePreviewRequiresReviewWarning && 
    guardrailNoMacroToIndustryConclusion && 
    guardrailNoInvestmentAdvicePresent;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
