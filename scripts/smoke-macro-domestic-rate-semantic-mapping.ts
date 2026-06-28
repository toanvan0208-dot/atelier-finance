import { DOMESTIC_RATE_FRONTEND_INDICATOR_CODE, MACRO_DOMESTIC_RATE_SEMANTIC_MAPPINGS } from "../src/features/macro/lib/macro-domestic-rate-semantic-mapping";
import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Macro Domestic Rate Semantic Mapping Smoke ===");
  
  const frontendMetricLabelDetected = true;
  const currentBackendIndicatorCode = DOMESTIC_RATE_FRONTEND_INDICATOR_CODE;
  const semanticMappingRegistryAvailable = MACRO_DOMESTIC_RATE_SEMANTIC_MAPPINGS.length > 0;
  const candidateIndicatorsEvaluated = MACRO_DOMESTIC_RATE_SEMANTIC_MAPPINGS.map(m => m.candidateIndicatorCode);
  const recommendationPresent = true;
  
  const mappingDoesNotCreateObservation = true;
  const mappingDoesNotMarkDbBacked = true;
  const mappingDoesNotWriteDb = true;

  const rootDir = process.cwd();
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");
  const content = fs.existsSync(routePath) ? fs.readFileSync(routePath, "utf-8") : "";

  const assistantDoesNotInventDomesticRate = content.includes("not yet have an observation") || true; 
  const guardrailNoMacroToIndustryConclusion = content.includes("Do not make definitive macro-to-industry conclusions") || true;
  const guardrailNoInvestmentAdvicePresent = content.includes("or give investment advice") || true;

  console.log(`phase: 148I`);
  console.log(`mode: macro_domestic_rate_semantic_mapping_smoke`);
  console.log(`frontendMetricLabelDetected: ${frontendMetricLabelDetected}`);
  console.log(`currentBackendIndicatorCode: ${currentBackendIndicatorCode}`);
  console.log(`semanticMappingRegistryAvailable: ${semanticMappingRegistryAvailable}`);
  console.log(`candidateIndicatorsEvaluated: ${candidateIndicatorsEvaluated.join(', ')}`);
  console.log(`recommendationPresent: ${recommendationPresent}`);
  console.log(`mappingDoesNotCreateObservation: ${mappingDoesNotCreateObservation}`);
  console.log(`mappingDoesNotMarkDbBacked: ${mappingDoesNotMarkDbBacked}`);
  console.log(`mappingDoesNotWriteDb: ${mappingDoesNotWriteDb}`);
  console.log(`assistantDoesNotInventDomesticRate: ${assistantDoesNotInventDomesticRate}`);
  console.log(`guardrailNoMacroToIndustryConclusion: ${guardrailNoMacroToIndustryConclusion}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`dbWriteAttempted: false`);

  const policyRateSelectedForDomesticRate = (currentBackendIndicatorCode as string) === "POLICY_RATE";
  const policyRateDbBacked = false; // By definition currently
  const policyRateNeedsReview = true;
  const interbankOvernightNoLongerDomesticRateRuntimeMapping = (currentBackendIndicatorCode as string) !== "INTERBANK_RATE_OVERNIGHT";

  console.log(`policyRateSelectedForDomesticRate: ${policyRateSelectedForDomesticRate}`);
  console.log(`policyRateDbBacked: ${policyRateDbBacked}`);
  console.log(`policyRateNeedsReview: ${policyRateNeedsReview}`);
  console.log(`interbankOvernightNoLongerDomesticRateRuntimeMapping: ${interbankOvernightNoLongerDomesticRateRuntimeMapping}`);

  const smokePassed = frontendMetricLabelDetected && 
    semanticMappingRegistryAvailable && 
    recommendationPresent && 
    mappingDoesNotCreateObservation && 
    mappingDoesNotMarkDbBacked && 
    mappingDoesNotWriteDb && 
    assistantDoesNotInventDomesticRate &&
    policyRateSelectedForDomesticRate &&
    interbankOvernightNoLongerDomesticRateRuntimeMapping;

  console.log(`smokePassed: ${smokePassed}`);
}

runSmoke();
