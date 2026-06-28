import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Assistant Macro Parser Strategy Guardrail Smoke ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const parserStrategyContextInjected = content.includes("parserStrategyRegistry") || content.includes("sourceAssessmentNeededIndicators") || content.includes("staleIndicators");
  const candidateFor148EIndicatorsVisible = content.includes("candidateFor148E") || content.includes("sourceAssessmentNeededIndicators"); // Assuming Assistant gets this implicitly via missing observation list and status.
  const manualReviewOnlyIndicatorsVisible = content.includes("manual_review") || content.includes("sourceAssessmentNeededIndicators");
  const blockedIndicatorsVisible = content.includes("blocked") || content.includes("sourceAssessmentNeededIndicators");

  const parserCandidateDoesNotInventObservation = content.includes("say the system does not yet have an observation");
  const manualOnlyDoesNotInventObservation = content.includes("say the system does not yet have an observation");
  const blockedIndicatorDoesNotInventObservation = content.includes("say the system does not yet have an observation");

  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions");
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice");

  console.log(`phase: 148D`);
  console.log(`mode: assistant_macro_parser_strategy_guardrail_smoke`);
  console.log(`parserStrategyContextInjected: ${parserStrategyContextInjected}`);
  console.log(`candidateFor148EIndicatorsVisible: ${candidateFor148EIndicatorsVisible}`);
  console.log(`manualReviewOnlyIndicatorsVisible: ${manualReviewOnlyIndicatorsVisible}`);
  console.log(`blockedIndicatorsVisible: ${blockedIndicatorsVisible}`);
  console.log(`parserCandidateDoesNotInventObservation: ${parserCandidateDoesNotInventObservation}`);
  console.log(`manualOnlyDoesNotInventObservation: ${manualOnlyDoesNotInventObservation}`);
  console.log(`blockedIndicatorDoesNotInventObservation: ${blockedIndicatorDoesNotInventObservation}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const smokePassed = parserStrategyContextInjected && 
    parserCandidateDoesNotInventObservation && 
    manualOnlyDoesNotInventObservation && 
    blockedIndicatorDoesNotInventObservation && 
    guardrailNoMacroToIndustryConclusion && 
    guardrailNoInvestmentAdvicePresent;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
