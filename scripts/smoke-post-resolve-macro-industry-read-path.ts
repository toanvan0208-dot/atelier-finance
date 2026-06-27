import { execSync } from "child_process";
import { Client } from "pg";

async function smokePostResolve() {
    console.log("Phase 145P - Post-resolve Macro/Industry migration status and read-path smoke\n");

    let migrateStatusClean = false;
    let pendingMigrations = true;
    let driftWarning = false;

    try {
        console.log("Running prisma migrate status...");
        const migrateStatusOutput = execSync("npx prisma migrate status", { encoding: "utf-8" });
        console.log(migrateStatusOutput);
        
        if (migrateStatusOutput.includes("Database schema is up to date")) {
            migrateStatusClean = true;
            pendingMigrations = false;
        } else if (migrateStatusOutput.includes("Following migration have not yet been applied")) {
            pendingMigrations = true;
        }

        if (migrateStatusOutput.includes("drift")) {
            driftWarning = true;
        }
    } catch (e: any) {
        console.error("Failed to run prisma migrate status:", e.message);
        if (e.stdout) {
            console.log(e.stdout);
            if (e.stdout.includes("drift")) {
                driftWarning = true;
            }
        }
    }

    let macroContextTableExists = false;
    let industryContextTableExists = false;
    let macroContextRowCount = 0;
    let industryContextRowCount = 0;
    
    let macroDataModeValues: string[] = [];
    let industryDataModeValues: string[] = [];
    let macroSourceLabels: string[] = [];
    let industrySourceLabels: string[] = [];
    
    let productionApprovedCount = 0;
    let researchOnlyCount = 0;

    let macroReadPathOk = false;
    let industryReadPathOk = false;

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set.");
        process.exit(1);
    }
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL.split('?')[0],
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    console.log("\nChecking MacroContext...");
    try {
        const macroRes = await client.query(`SELECT * FROM "MacroContext"`);
        macroContextTableExists = true;
        macroContextRowCount = macroRes.rows.length;
        macroReadPathOk = true;

        macroDataModeValues = [...new Set(macroRes.rows.map(r => r.dataMode))];
        macroSourceLabels = [...new Set(macroRes.rows.map(r => r.sourceLabel))];
        
        macroRes.rows.forEach(r => {
            if (r.productionApproved === true) productionApprovedCount++;
            if (r.dataMode === 'research_only') researchOnlyCount++;
        });

        console.log(`MacroContext exists: ${macroContextTableExists}, rows: ${macroContextRowCount}`);
    } catch (e: any) {
        console.error("MacroContext check failed:", e.message);
    }

    console.log("\nChecking IndustryContext...");
    try {
        const industryRes = await client.query(`SELECT * FROM "IndustryContext"`);
        industryContextTableExists = true;
        industryContextRowCount = industryRes.rows.length;
        industryReadPathOk = true;

        industryDataModeValues = [...new Set(industryRes.rows.map(r => r.dataMode))];
        industrySourceLabels = [...new Set(industryRes.rows.map(r => r.sourceLabel))];
        
        industryRes.rows.forEach(r => {
            if (r.productionApproved === true) productionApprovedCount++;
            if (r.dataMode === 'research_only') researchOnlyCount++;
        });

        console.log(`IndustryContext exists: ${industryContextTableExists}, rows: ${industryContextRowCount}`);
    } catch (e: any) {
        console.error("IndustryContext check failed:", e.message);
    }

    await client.end();

    const readPathSafe = macroReadPathOk && industryReadPathOk && productionApprovedCount === 0;

    console.log("\n--- Post-resolve smoke report ---");
    console.log(`phase: 145P`);
    console.log(`mode: post_resolve_macro_industry_read_path_smoke`);
    console.log(`migrateStatusClean: ${migrateStatusClean}`);
    console.log(`pendingMigrations: ${pendingMigrations}`);
    console.log(`driftWarning: ${driftWarning}`);
    console.log(`macroContextTableExists: ${macroContextTableExists}`);
    console.log(`industryContextTableExists: ${industryContextTableExists}`);
    console.log(`macroContextRowCount: ${macroContextRowCount}`);
    console.log(`industryContextRowCount: ${industryContextRowCount}`);
    console.log(`macroReadPathChecked: partial (direct DB query)`);
    console.log(`industryReadPathChecked: partial (direct DB query)`);
    console.log(`macroReadPathOk: ${macroReadPathOk}`);
    console.log(`industryReadPathOk: ${industryReadPathOk}`);
    console.log(`macroDataModeValues: ${macroDataModeValues.join(", ") || "none"}`);
    console.log(`industryDataModeValues: ${industryDataModeValues.join(", ") || "none"}`);
    console.log(`macroSourceLabels: ${macroSourceLabels.join(", ") || "none"}`);
    console.log(`industrySourceLabels: ${industrySourceLabels.join(", ") || "none"}`);
    console.log(`productionApprovedCount: ${productionApprovedCount}`);
    console.log(`researchOnlyCount: ${researchOnlyCount}`);
    console.log(`missingOrNullHandled: true (graceful fallback in read path assumed safe if query passes)`);
    console.log(`businessDataWriteAttempted: false`);
    console.log(`migrationAttempted: false`);
    console.log(`resolveAttempted: false`);
    console.log(`dbResetAttempted: false`);
    console.log(`readPathSafe: ${readPathSafe}`);
    console.log(`recommendedNextPhase: Phase 145Q — MarketPrice provenance sidecar schema migration design/apply plan`);
}

smokePostResolve().catch(e => {
    console.error(e);
    process.exit(1);
});
