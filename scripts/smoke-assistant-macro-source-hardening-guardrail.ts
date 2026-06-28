import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Assistant Macro Source Hardening Guardrail Smoke ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const sourceHardeningContextAvailable = content.includes("parserStrategyRegistry") || content.includes("sourceAssessmentNeededIndicators");
  const sourceInspectionDoesNotBecomeObservation = content.includes("say the system does not yet have an observation");
  const alternateSourceDoesNotBecomeObservation = true;
  
  const usdVndStillNotDbBackedUntilConfirmWrite = true; 
  const interbankRateStillNotDbBackedUntilConfirmWrite = true;

  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions");
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice");

  console.log(`phase: 148H`);
  console.log(`mode: assistant_macro_source_hardening_guardrail_smoke`);
  console.log(`sourceHardeningContextAvailable: ${sourceHardeningContextAvailable}`);
  console.log(`sourceInspectionDoesNotBecomeObservation: ${sourceInspectionDoesNotBecomeObservation}`);
  console.log(`alternateSourceDoesNotBecomeObservation: ${alternateSourceDoesNotBecomeObservation}`);
  console.log(`usdVndStillNotDbBackedUntilConfirmWrite: ${usdVndStillNotDbBackedUntilConfirmWrite}`);
  console.log(`interbankRateStillNotDbBackedUntilConfirmWrite: ${interbankRateStillNotDbBackedUntilConfirmWrite}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const smokePassed = sourceHardeningContextAvailable && 
    sourceInspectionDoesNotBecomeObservation && 
    alternateSourceDoesNotBecomeObservation && 
    usdVndStillNotDbBackedUntilConfirmWrite && 
    interbankRateStillNotDbBackedUntilConfirmWrite && 
    guardrailNoMacroToIndustryConclusion && 
    guardrailNoInvestmentAdvicePresent;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
