import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Assistant Macro Frontend-Locked No Fake Smoke ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const frontendLockedIndicatorsInjected = content.includes("frontendLockedIndicators");
  const missingObservationIndicatorsInjected = content.includes("missingObservationIndicators");
  const staleIndicatorsInjected = content.includes("staleIndicators");
  const notInFrontendIndicatorsInjected = content.includes("notInFrontendIndicators");

  const missingIndicatorDoesNotInventValue = content.includes("say the system does not yet have an observation");
  const notInFrontendIndicatorDoesNotInventValue = content.includes("say the system currently does not support this metric in the Macro module");
  const staleIndicatorWarningPresent = content.includes("warn that the data might be out of date");
  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions");
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice");

  console.log(`phase: 148B`);
  console.log(`mode: assistant_macro_frontend_locked_no_fake_smoke`);
  console.log(`frontendLockedIndicatorsInjected: ${frontendLockedIndicatorsInjected}`);
  console.log(`missingObservationIndicatorsInjected: ${missingObservationIndicatorsInjected}`);
  console.log(`staleIndicatorsInjected: ${staleIndicatorsInjected}`);
  console.log(`notInFrontendIndicatorsInjected: ${notInFrontendIndicatorsInjected}`);
  console.log(`missingIndicatorDoesNotInventValue: ${missingIndicatorDoesNotInventValue}`);
  console.log(`notInFrontendIndicatorDoesNotInventValue: ${notInFrontendIndicatorDoesNotInventValue}`);
  console.log(`staleIndicatorWarningPresent: ${staleIndicatorWarningPresent}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const smokePassed = frontendLockedIndicatorsInjected && 
    missingObservationIndicatorsInjected && 
    staleIndicatorsInjected && 
    notInFrontendIndicatorsInjected && 
    missingIndicatorDoesNotInventValue && 
    notInFrontendIndicatorDoesNotInventValue && 
    staleIndicatorWarningPresent && 
    guardrailNoMacroToIndustryConclusion && 
    guardrailNoInvestmentAdvicePresent;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
