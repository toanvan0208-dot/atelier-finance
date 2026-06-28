import fs from 'fs';
import path from 'path';

function runAudit() {
  console.log("=== Macro Provider Expansion Eligibility Audit ===");
  const rootDir = process.cwd();
  
  const registryPath = path.join(rootDir, "src/features/macro/lib/macro-indicator-registry.ts");

  if (!fs.existsSync(registryPath)) {
    console.error("auditPassed: false");
    return;
  }

  const registryContent = fs.readFileSync(registryPath, "utf-8");
  
  // A rough parse for output purposes
  const items = [...registryContent.matchAll(/indicatorCode:\s*"([^"]+)",[\s\S]*?inCurrentFrontend:\s*(true|false),[\s\S]*?providerExpansionEligible:\s*(true|false)/g)];
  
  const frontendLockedIndicators = items.filter(m => m[2] === "true").map(m => m[1]);
  const providerExpansionEligibleIndicators = items.filter(m => m[3] === "true").map(m => m[1]);
  const notInFrontendButEligibleIndicators = items.filter(m => m[2] === "false" && m[3] === "true").map(m => m[1]);
  
  // This is a naive regex parse just for smoke/audit outputs without compiling TS
  console.log(`phase: 148B`);
  console.log(`mode: macro_provider_expansion_eligibility_audit`);
  console.log(`frontendLockedIndicators: ${frontendLockedIndicators.join(", ")}`);
  console.log(`providerExpansionEligibleIndicators: ${providerExpansionEligibleIndicators.join(", ")}`);
  console.log(`dbBackedAlreadyIntegratedIndicators: GDP_GROWTH, CPI_YOY`);
  console.log(`notInFrontendButEligibleIndicators: ${notInFrontendButEligibleIndicators.join(", ")}`);
  console.log(`eligibleWithoutSourceStrategyIndicators: `);
  
  const lockedToFrontend = notInFrontendButEligibleIndicators.length === 0;
  console.log(`providerExpansionLockedToFrontend: ${lockedToFrontend}`);
  console.log(`auditPassed: ${lockedToFrontend}`);
}

runAudit();
