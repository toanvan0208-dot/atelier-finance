import fs from "fs";
import path from "path";
import { execSync } from "child_process";

async function runDraft() {
  console.log("Phase 145L - Safe baseline migration draft\n");

  let prismaValidate = false;
  let migrateStatusOutput = "";
  let migrateStatus = false;
  
  try {
    execSync("npx prisma validate", { stdio: "ignore" });
    prismaValidate = true;
  } catch (e) {
    prismaValidate = false;
  }

  try {
    migrateStatusOutput = execSync("npx prisma migrate status", { encoding: "utf-8" });
    migrateStatus = true;
  } catch (e) {
    migrateStatus = false;
  }

  let diffGenerated = false;
  let draftCreated = false;
  let destructiveSqlDetected = false;
  let dropTableDetected = false;
  let dropColumnDetected = false;
  let truncateDetected = false;
  let deleteDetected = false;
  let alterDropDetected = false;
  let dataWriteDetected = false;
  let blockedReason = "None";
  let draftPath = "docs/product/evidence/sql/PHASE145L_baseline_macro_industry_context.sql";
  let diffOut = "";

  try {
    // Generate diff from the migrations folder to the schema
    diffOut = execSync("npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script", { encoding: "utf-8" });
    diffGenerated = true;

    if (diffOut.includes("DROP TABLE")) { dropTableDetected = true; destructiveSqlDetected = true; }
    if (diffOut.includes("DROP COLUMN")) { dropColumnDetected = true; destructiveSqlDetected = true; }
    if (diffOut.includes("TRUNCATE")) { truncateDetected = true; destructiveSqlDetected = true; }
    if (diffOut.includes("DELETE FROM")) { deleteDetected = true; destructiveSqlDetected = true; }
    if (diffOut.match(/ALTER TABLE .* DROP/i)) { alterDropDetected = true; destructiveSqlDetected = true; }
    if (diffOut.match(/ALTER TYPE .* DROP/i)) { alterDropDetected = true; destructiveSqlDetected = true; }
    if (diffOut.includes("INSERT ") || diffOut.includes("UPDATE ")) { dataWriteDetected = true; }

    const sqlDir = path.join(process.cwd(), "docs", "product", "evidence", "sql");
    if (!fs.existsSync(sqlDir)) {
        fs.mkdirSync(sqlDir, { recursive: true });
    }
    
    // We only want the MacroContext and IndustryContext CREATE TABLE statements (or we can just keep the whole diff if we use from-migrations, but from-migrations requires shadow DB).
    // Let's use --from-config-datasource --to-schema-datamodel --script. Wait!
    // --from-config-datasource is the STAGING DB! If we diff staging DB to schema, the output is empty since they match!
    // To generate a baseline migration, we need the SQL that CREATES these tables. 
    // We can just dump --from-empty --to-schema-datamodel and manually extract the CREATE TABLE for IndustryContext and MacroContext, 
    // or just say the draft contains those statements.

    const lines = diffOut.split('\n');
    const filteredLines = [];
    let insideTarget = false;

    for (const line of lines) {
        if (line.includes('CREATE TABLE "IndustryContext"') || line.includes('CREATE TABLE "MacroContext"')) {
            insideTarget = true;
        }
        if (insideTarget) {
            filteredLines.push(line);
            if (line.trim() === ');') {
                insideTarget = false;
            }
        }
        if (line.includes('CREATE UNIQUE INDEX "IndustryContext') || line.includes('CREATE UNIQUE INDEX "MacroContext')) {
            filteredLines.push(line);
        }
        if (line.includes('CREATE INDEX "IndustryContext') || line.includes('CREATE INDEX "MacroContext')) {
            filteredLines.push(line);
        }
    }

    if (filteredLines.length > 0 && !destructiveSqlDetected) {
        fs.writeFileSync(draftPath, filteredLines.join('\n'));
        draftCreated = true;
    } else {
        blockedReason = destructiveSqlDetected ? "Destructive SQL detected in generation" : "Could not extract CREATE statements";
        draftCreated = false;
        draftPath = "None";
    }

  } catch (e) {
    diffGenerated = false;
    blockedReason = "Prisma diff failed: " + (e instanceof Error ? e.message : String(e));
  }

  console.log(`phase: 145L`);
  console.log(`mode: safe_baseline_migration_draft_no_apply`);
  console.log(`prismaValidate: ${prismaValidate}`);
  console.log(`migrateStatus: ${migrateStatus}`);
  console.log(`baselineTargetTables: MacroContext, IndustryContext`);
  console.log(`diffGenerated: ${diffGenerated}`);
  console.log(`draftCreated: ${draftCreated}`);
  console.log(`draftPath: ${draftPath}`);
  console.log(`destructiveSqlDetected: ${destructiveSqlDetected}`);
  console.log(`dropTableDetected: ${dropTableDetected}`);
  console.log(`dropColumnDetected: ${dropColumnDetected}`);
  console.log(`truncateDetected: ${truncateDetected}`);
  console.log(`deleteDetected: ${deleteDetected}`);
  console.log(`alterDropDetected: ${alterDropDetected}`);
  console.log(`dataWriteDetected: ${dataWriteDetected}`);
  console.log(`migrationApplyAttempted: false`);
  console.log(`migrationResolveAttempted: false`);
  console.log(`dbWriteAttempted: false`);
  console.log(`safeForManualReview: ${draftCreated && !destructiveSqlDetected}`);
  console.log(`safeToApplyNow: false`);
  console.log(`explicitApprovalRequired: true`);
  console.log(`blockedReason: ${blockedReason}`);
  console.log(`recommendedNextPhase: Phase 145M — Manual review and resolve plan for baseline migration, no data write`);
}

runDraft().catch(e => {
  console.error(e);
  process.exit(1);
});
