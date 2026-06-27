import fs from "fs";
import path from "path";

async function checkMigrationFolder() {
  console.log("Phase 145N - Baseline migration folder readiness\n");

  const sourceDraftPath = "docs/product/evidence/sql/PHASE145L_baseline_macro_industry_context.sql";
  const absSourceDraftPath = path.join(process.cwd(), sourceDraftPath);
  const sourceDraftExists = fs.existsSync(absSourceDraftPath);
  
  const migrationFolder = "prisma/migrations/20260627081000_baseline_macro_industry_context";
  const migrationSqlPath = `${migrationFolder}/migration.sql`;
  const absMigrationSqlPath = path.join(process.cwd(), migrationSqlPath);
  
  const migrationFolderCreated = fs.existsSync(path.join(process.cwd(), migrationFolder));
  let migrationSqlMatchesDraft = false;

  if (sourceDraftExists && fs.existsSync(absMigrationSqlPath)) {
      const sourceContent = fs.readFileSync(absSourceDraftPath, "utf-8").trim();
      const migrationContent = fs.readFileSync(absMigrationSqlPath, "utf-8").trim();
      migrationSqlMatchesDraft = sourceContent === migrationContent;
  }

  const targetTables = "MacroContext, IndustryContext";
  let containsOnlyExpectedTargets = true;
  let dropTableDetected = false;
  let dropColumnDetected = false;
  let truncateDetected = false;
  let deleteDetected = false;
  let insertDetected = false;
  let updateStatementDetected = false;
  let updateKeywordFalsePositive = false;
  let alterDropDetected = false;
  let dataWriteSqlDetected = false;
  let marketPriceProvenanceDetected = false;
  let productionApprovedChangeDetected = false;

  if (fs.existsSync(absMigrationSqlPath)) {
    const draftSql = fs.readFileSync(absMigrationSqlPath, "utf-8");
    const lines = draftSql.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineUpper = line.toUpperCase();
        
        if (lineUpper.includes("DROP TABLE")) dropTableDetected = true;
        if (lineUpper.includes("DROP COLUMN")) dropColumnDetected = true;
        if (lineUpper.includes("TRUNCATE")) truncateDetected = true;
        if (lineUpper.includes("DELETE FROM")) deleteDetected = true;
        if (lineUpper.match(/ALTER TABLE .* DROP/i)) alterDropDetected = true;
        if (lineUpper.match(/ALTER TYPE .* DROP/i)) alterDropDetected = true;
        
        if (lineUpper.includes("INSERT INTO") || lineUpper.match(/^\s*INSERT\s+/i)) insertDetected = true;
        
        // Detect UPDATE statement vs updatedAt / ON UPDATE CASCADE
        if (lineUpper.match(/^\s*UPDATE\s+/i) || lineUpper.match(/;\s*UPDATE\s+/i)) {
            updateStatementDetected = true;
        } else if (lineUpper.includes("UPDATE")) {
            // Probably ON UPDATE CASCADE or updatedAt
            updateKeywordFalsePositive = true;
        }

        if (line.includes("MarketPriceProvenanceMetadata")) marketPriceProvenanceDetected = true;
        if (lineUpper.includes("PRODUCTIONAPPROVED") && lineUpper.includes("TRUE")) productionApprovedChangeDetected = true;

        if (lineUpper.includes("CREATE TABLE") && !lineUpper.includes("MACROCONTEXT") && !lineUpper.includes("INDUSTRYCONTEXT")) {
            containsOnlyExpectedTargets = false;
        }
    }
  }

  const destructiveSqlDetected = dropTableDetected || dropColumnDetected || truncateDetected || deleteDetected || alterDropDetected;
  dataWriteSqlDetected = insertDetected || updateStatementDetected;

  const readyForExplicitResolvePhase = migrationFolderCreated && migrationSqlMatchesDraft && containsOnlyExpectedTargets && !destructiveSqlDetected && !dataWriteSqlDetected;

  console.log(`phase: 145N`);
  console.log(`mode: baseline_migration_folder_readiness_no_resolve`);
  console.log(`sourceDraftPath: ${sourceDraftPath}`);
  console.log(`migrationFolder: ${migrationFolder}`);
  console.log(`migrationSqlPath: ${migrationSqlPath}`);
  console.log(`sourceDraftExists: ${sourceDraftExists}`);
  console.log(`migrationFolderCreated: ${migrationFolderCreated}`);
  console.log(`migrationSqlMatchesDraft: ${migrationSqlMatchesDraft}`);
  console.log(`targetTables: ${targetTables}`);
  console.log(`containsOnlyExpectedTargets: ${containsOnlyExpectedTargets}`);
  console.log(`dropTableDetected: ${dropTableDetected}`);
  console.log(`dropColumnDetected: ${dropColumnDetected}`);
  console.log(`truncateDetected: ${truncateDetected}`);
  console.log(`deleteDetected: ${deleteDetected}`);
  console.log(`insertDetected: ${insertDetected}`);
  console.log(`updateStatementDetected: ${updateStatementDetected}`);
  console.log(`updateKeywordFalsePositive: ${updateKeywordFalsePositive}`);
  console.log(`alterDropDetected: ${alterDropDetected}`);
  console.log(`destructiveSqlDetected: ${destructiveSqlDetected}`);
  console.log(`dataWriteSqlDetected: ${dataWriteSqlDetected}`);
  console.log(`marketPriceProvenanceDetected: ${marketPriceProvenanceDetected}`);
  console.log(`productionApprovedChangeDetected: ${productionApprovedChangeDetected}`);
  console.log(`migrationApplyAttempted: false`);
  console.log(`migrationResolveAttempted: false`);
  console.log(`dbWriteAttempted: false`);
  console.log(`readyForExplicitResolvePhase: ${readyForExplicitResolvePhase}`);
  console.log(`safeToApplyNow: false`);
  console.log(`explicitApprovalRequired: true`);
  console.log(`recommendedNextPhase: ${readyForExplicitResolvePhase ? "Phase 145O — Explicitly approved baseline resolve execution for staging" : "Phase 145O — Baseline migration folder blocker closure, no resolve"}`);
}

checkMigrationFolder().catch(e => {
  console.error(e);
  process.exit(1);
});
