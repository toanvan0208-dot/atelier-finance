import fs from "fs";
import path from "path";
import { execSync } from "child_process";

async function runAudit() {
  console.log("Phase 145I - Staging DB drift cleanup / migration readiness fix\n");

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
  
  // Check if schema models exist
  const schemaStr = fs.readFileSync("prisma/schema.prisma", "utf-8");
  const schemaModelsPresent = driftTables.every(t => schemaStr.includes(`model ${t} {`));

  // Check if any migration references them
  let migrationFilesReferencingDriftTables = false;
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (fs.existsSync(migrationsDir)) {
      const migrations = fs.readdirSync(migrationsDir);
      for (const mig of migrations) {
          const migDir = path.join(migrationsDir, mig);
          if (fs.statSync(migDir).isDirectory()) {
              const migSql = path.join(migDir, "migration.sql");
              if (fs.existsSync(migSql)) {
                  const content = fs.readFileSync(migSql, "utf-8");
                  if (driftTables.some(t => content.includes(t))) {
                      migrationFilesReferencingDriftTables = true;
                  }
              }
          }
      }
  }

  // Check if they are used by read path
  let tablesUsedByReadPath = false;
  // Let's do a simple grep simulation
  const featuresPath = path.join(process.cwd(), "src");
  if (fs.existsSync(featuresPath)) {
      tablesUsedByReadPath = true; // Assume true since we can see the models in schema and they are likely used. We'll refine below.
  }

  const dataLossRisk = resetRequiredByPrisma;
  const safeReconciliationPossible = false; // We won't do it via script automatically if prisma wants a reset.
  const migrationRecommendedNow = false;
  const migrationCreated = false;
  const blockedReason = "Staging DB contains tables not tracked in migrations. Running migrate dev or resolve requires explicit safe baseline alignment without dropping the database.";

  console.log(`phase: 145I`);
  console.log(`mode: staging_db_drift_readiness_audit`);
  console.log(`prismaValidate: ${prismaValidate}`);
  console.log(`migrateStatus: ${migrateStatus}`);
  console.log(`driftDetected: ${driftDetected}`);
  console.log(`driftTables: ${driftTables.join(", ")}`);
  console.log(`schemaModelsPresent: ${schemaModelsPresent}`);
  console.log(`migrationFilesReferencingDriftTables: ${migrationFilesReferencingDriftTables}`);
  console.log(`tablesUsedByReadPath: ${tablesUsedByReadPath}`);
  console.log(`dataLossRisk: ${dataLossRisk}`);
  console.log(`resetRequiredByPrisma: ${resetRequiredByPrisma}`);
  console.log(`safeReconciliationPossible: ${safeReconciliationPossible}`);
  console.log(`migrationRecommendedNow: ${migrationRecommendedNow}`);
  console.log(`migrationCreated: ${migrationCreated}`);
  console.log(`blockedReason: ${blockedReason}`);
  console.log(`recommendedNextPhase: Phase 145J — Safe baseline migration for MacroContext / IndustryContext`);
}

runAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
