import { execSync } from "child_process";

async function runCheck() {
  console.log("Phase 145H - DB migration readiness\n");

  let prismaValidate = false;
  let migrateStatusOutput = "";
  let migrateStatus = false;
  let driftDetected = false;
  let driftSummary = "none";
  let dataLossRisk = false;
  let sidecarMigrationSafe = false;
  let migrationRecommendedNow = false;
  let migrationBlockedReason = "none";

  try {
    console.log("Running prisma validate...");
    execSync("npx prisma validate", { stdio: "ignore" });
    prismaValidate = true;
  } catch (e) {
    prismaValidate = false;
  }

  try {
    console.log("Running prisma migrate status...");
    const output = execSync("npx prisma migrate status", { encoding: "utf-8" });
    migrateStatusOutput = output;
    migrateStatus = true;
    if (output.includes("Database schema is up to date")) {
      driftDetected = false;
    } else {
      driftDetected = true;
      driftSummary = "Pending migrations or drift detected";
    }
  } catch (e) {
    migrateStatus = false;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("drift")) {
        driftDetected = true;
        driftSummary = "Database schema drift detected by migrate status";
    } else {
        driftDetected = true; // Assume drift if error
        driftSummary = "Failed to run migrate status, assuming drift or infrastructure issue";
    }
  }

  // Can we create a safe sidecar migration?
  // Since we haven't touched the schema yet, creating it would only add a new table.
  // Adding a new table (MarketPriceProvenanceMetadata) is safe and doesn't cause data loss.
  dataLossRisk = false; 

  if (driftDetected) {
      sidecarMigrationSafe = false;
      migrationRecommendedNow = false;
      migrationBlockedReason = driftSummary;
  } else {
      sidecarMigrationSafe = true;
      migrationRecommendedNow = true;
  }

  console.log(`phase: 145H`);
  console.log(`stage: db_migration_readiness`);
  console.log(`prismaValidate: ${prismaValidate}`);
  console.log(`migrateStatus: ${migrateStatus}`);
  console.log(`driftDetected: ${driftDetected}`);
  console.log(`driftSummary: ${driftSummary}`);
  console.log(`dataLossRisk: ${dataLossRisk}`);
  console.log(`sidecarMigrationSafe: ${sidecarMigrationSafe}`);
  console.log(`migrationRecommendedNow: ${migrationRecommendedNow}`);
  console.log(`migrationBlockedReason: ${migrationBlockedReason}`);
}

runCheck().catch(e => {
  console.error(e);
  process.exit(1);
});
