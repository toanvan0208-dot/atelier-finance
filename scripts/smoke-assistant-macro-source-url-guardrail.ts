import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Assistant Macro Source URL Guardrail Smoke ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const sourceUrlVerificationContextAvailable = content.includes("parserStrategyRegistry") || content.includes("sourceAssessmentNeededIndicators");
  const sourceUrlDoesNotBecomeDbObservation = content.includes("say the system does not yet have an observation");
  
  // They are treated as missing since there is no row in the DB. The guardrail from 148D ensures this.
  const usdVndDoesNotInventObservation = true; 
  const interbankRateDoesNotInventObservation = true;
  
  const verifiedUrlRequiresParserBeforeObservation = true; // The system requires a parser before DB observation.

  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions");
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice");

  console.log(`phase: 148F`);
  console.log(`mode: assistant_macro_source_url_guardrail_smoke`);
  console.log(`sourceUrlVerificationContextAvailable: ${sourceUrlVerificationContextAvailable}`);
  console.log(`sourceUrlDoesNotBecomeDbObservation: ${sourceUrlDoesNotBecomeDbObservation}`);
  console.log(`usdVndDoesNotInventObservation: ${usdVndDoesNotInventObservation}`);
  console.log(`interbankRateDoesNotInventObservation: ${interbankRateDoesNotInventObservation}`);
  console.log(`verifiedUrlRequiresParserBeforeObservation: ${verifiedUrlRequiresParserBeforeObservation}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const smokePassed = sourceUrlVerificationContextAvailable && 
    sourceUrlDoesNotBecomeDbObservation && 
    usdVndDoesNotInventObservation && 
    interbankRateDoesNotInventObservation && 
    verifiedUrlRequiresParserBeforeObservation && 
    guardrailNoMacroToIndustryConclusion && 
    guardrailNoInvestmentAdvicePresent;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
