import fs from 'fs';
import path from 'path';

async function runSmoke() {
  console.log("=== Smoke Test: Assistant Macro Universe No Fake ===");
  const rootDir = process.cwd();
  
  const routePath = path.join(rootDir, "src/app/api/assistant/route.ts");

  if (!fs.existsSync(routePath)) {
    console.error("smokeResult: FAIL - File not found");
    return;
  }

  const content = fs.readFileSync(routePath, "utf-8");

  const injectsDbBacked = content.includes("dbBackedIndicators:");
  const injectsPlanned = content.includes("plannedIndicators:");
  const injectsSourceNeeded = content.includes("sourceAssessmentNeededIndicators:");
  const injectsGuardrail = content.includes("guardrail: \"Do not fabricate data");

  console.log(`injectsDbBacked: ${injectsDbBacked}`);
  console.log(`injectsPlanned: ${injectsPlanned}`);
  console.log(`injectsSourceNeeded: ${injectsSourceNeeded}`);
  console.log(`injectsGuardrail: ${injectsGuardrail}`);

  if (injectsDbBacked && injectsPlanned && injectsSourceNeeded && injectsGuardrail) {
    console.log("smokeResult: PASS");
  } else {
    console.log("smokeResult: FAIL");
  }
}

runSmoke();
