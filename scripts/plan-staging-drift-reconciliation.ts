import fs from "fs";
import { execSync } from "child_process";

async function runPlan() {
  console.log("Phase 145J - Manual-reviewed staging drift reconciliation plan\n");

  let prismaValidate = false;
  let migrateStatusOutput = "";
  let migrateStatus = false;
  let driftDetected = false;
  let resetRequiredByPrisma = false;
  
  try {
    execSync("npx prisma validate", { stdio: "ignore" });
    prismaValidate = true;
  } catch (e) {
    prismaValidate = false;
  }

  try {
    migrateStatusOutput = execSync("npx prisma migrate status", { encoding: "utf-8" });
    migrateStatus = true;
    if (!migrateStatusOutput.includes("Database schema is up to date")) {
      driftDetected = true;
    }
  } catch (e) {
    migrateStatus = false;
    migrateStatusOutput = e instanceof Error ? e.message : String(e);
    if (migrateStatusOutput.includes("drift") || migrateStatusOutput.includes("Drift detected")) {
        driftDetected = true;
    }
    if (migrateStatusOutput.includes("reset") || migrateStatusOutput.includes("All data will be lost")) {
        resetRequiredByPrisma = true;
    }
  }

  const driftTables = ["IndustryContext", "MacroContext"];
  const schemaModelsPresent = true; // based on 145I audit
  const migrationFilesReferencingDriftTables = false;
  const tablesUsedByReadPath = true;

  const structuralConflicts = [
      "FinancialStatementUnitMetadata DB has warningCodes, schema lacks it",
      "FinancialStatementUnitMetadata DB dataMode type differs from schema SourceUsageStatus",
      "IndustryContext DB dataMode type differs from schema DataMode",
      "MacroContext DB dataMode type differs from schema DataMode"
  ];
  const columnsAtRisk = ["FinancialStatementUnitMetadata.warningCodes", "FinancialStatementUnitMetadata.dataMode", "IndustryContext.dataMode", "MacroContext.dataMode"];
  const destructiveOperationsDetected = true; // Prisma diff requested DROP COLUMN
  const dataLossRisk = true;

  const manualBaselinePossible = true; // Yes, but requires explicit care
  const safeApplyNow = false;
  const explicitApprovalRequired = true;
  const recommendedReconciliationStrategy = "Schema alignment first (re-add warningCodes, align dataMode) then manual baseline migration";

  console.log(`phase: 145J`);
  console.log(`mode: manual_reviewed_staging_drift_reconciliation_plan`);
  console.log(`prismaValidate: ${prismaValidate}`);
  console.log(`migrateStatus: ${migrateStatus}`);
  console.log(`driftDetected: ${driftDetected}`);
  console.log(`driftTables: ${driftTables.join(", ")}`);
  console.log(`structuralConflicts: ${structuralConflicts.join(" | ")}`);
  console.log(`schemaModelsPresent: ${schemaModelsPresent}`);
  console.log(`migrationFilesReferencingDriftTables: ${migrationFilesReferencingDriftTables}`);
  console.log(`tablesUsedByReadPath: ${tablesUsedByReadPath}`);
  console.log(`columnsAtRisk: ${columnsAtRisk.join(", ")}`);
  console.log(`destructiveOperationsDetected: ${destructiveOperationsDetected}`);
  console.log(`dataLossRisk: ${dataLossRisk}`);
  console.log(`resetRequiredByPrisma: ${resetRequiredByPrisma}`);
  console.log(`manualBaselinePossible: ${manualBaselinePossible}`);
  console.log(`safeApplyNow: ${safeApplyNow}`);
  console.log(`explicitApprovalRequired: ${explicitApprovalRequired}`);
  console.log(`recommendedReconciliationStrategy: ${recommendedReconciliationStrategy}`);
  console.log(`recommendedNextPhase: Phase 145K — Schema/DB alignment decision for dataMode and warningCodes, no apply`);
}

runPlan().catch(e => {
  console.error(e);
  process.exit(1);
});
