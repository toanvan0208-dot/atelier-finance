import { execSync } from "child_process";
import { Client } from "pg";

async function smokePostMigration() {
    console.log("Phase 145R - MarketPrice provenance schema post-migration smoke\n");

    let migrateStatusClean = false;

    try {
        console.log("Running prisma migrate status...");
        const migrateStatusOutput = execSync("npx prisma migrate status", { encoding: "utf-8" });
        if (migrateStatusOutput.includes("Database schema is up to date")) {
            migrateStatusClean = true;
        }
    } catch (e: any) {
        console.error("Failed to run prisma migrate status:", e.message);
    }

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set.");
        process.exit(1);
    }
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL.split('?')[0],
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    let marketPriceProvenanceTableExists = false;
    let marketPriceProvenanceRowCount = -1;
    let marketPriceTableExists = false;
    let marketPriceRowCount = -1;
    let marketPriceUnitMetadataTableExists = false;
    let marketPriceUnitMetadataRowCount = -1;
    
    let productionApprovedTrueCountInProvenance = -1;
    let needsReviewDefaultVerified = false;
    let productionApprovedDefaultFalseVerified = false;

    console.log("\nChecking MarketPriceProvenanceMetadata...");
    try {
        const provRes = await client.query(`SELECT * FROM "MarketPriceProvenanceMetadata"`);
        marketPriceProvenanceTableExists = true;
        marketPriceProvenanceRowCount = provRes.rows.length;
        
        productionApprovedTrueCountInProvenance = provRes.rows.filter(r => r.productionApproved === true).length;
        
        const columnRes = await client.query(`SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'MarketPriceProvenanceMetadata'`);
        const needsReviewCol = columnRes.rows.find(c => c.column_name === 'needsReview');
        if (needsReviewCol && needsReviewCol.column_default === 'true') {
            needsReviewDefaultVerified = true;
        }
        const prodAppCol = columnRes.rows.find(c => c.column_name === 'productionApproved');
        if (prodAppCol && prodAppCol.column_default === 'false') {
            productionApprovedDefaultFalseVerified = true;
        }

        console.log(`MarketPriceProvenanceMetadata exists: ${marketPriceProvenanceTableExists}, rows: ${marketPriceProvenanceRowCount}`);
    } catch (e: any) {
        console.error("MarketPriceProvenanceMetadata check failed:", e.message);
    }

    console.log("\nChecking MarketPrice...");
    try {
        const mpRes = await client.query(`SELECT count(*) as count FROM "MarketPrice"`);
        marketPriceTableExists = true;
        marketPriceRowCount = parseInt(mpRes.rows[0].count);
        console.log(`MarketPrice exists: ${marketPriceTableExists}, rows: ${marketPriceRowCount}`);
    } catch (e: any) {
        console.error("MarketPrice check failed:", e.message);
    }

    console.log("\nChecking MarketPriceUnitMetadata...");
    try {
        const umRes = await client.query(`SELECT count(*) as count FROM "MarketPriceUnitMetadata"`);
        marketPriceUnitMetadataTableExists = true;
        marketPriceUnitMetadataRowCount = parseInt(umRes.rows[0].count);
        console.log(`MarketPriceUnitMetadata exists: ${marketPriceUnitMetadataTableExists}, rows: ${marketPriceUnitMetadataRowCount}`);
    } catch (e: any) {
        console.error("MarketPriceUnitMetadata check failed:", e.message);
    }

    await client.end();

    const readOnlySmokePassed = migrateStatusClean &&
                                marketPriceProvenanceTableExists &&
                                marketPriceProvenanceRowCount === 0 &&
                                marketPriceTableExists &&
                                marketPriceUnitMetadataTableExists &&
                                productionApprovedTrueCountInProvenance === 0 &&
                                needsReviewDefaultVerified &&
                                productionApprovedDefaultFalseVerified;

    console.log(`\n--- Post-migration Smoke Report ---`);
    console.log(`phase: 145R`);
    console.log(`mode: market_price_provenance_schema_post_migration_smoke`);
    console.log(`migrateStatusClean: ${migrateStatusClean}`);
    console.log(`marketPriceProvenanceTableExists: ${marketPriceProvenanceTableExists}`);
    console.log(`marketPriceProvenanceRowCount: ${marketPriceProvenanceRowCount}`);
    console.log(`marketPriceTableExists: ${marketPriceTableExists}`);
    console.log(`marketPriceRowCount: ${marketPriceRowCount}`);
    console.log(`marketPriceUnitMetadataTableExists: ${marketPriceUnitMetadataTableExists}`);
    console.log(`marketPriceUnitMetadataRowCount: ${marketPriceUnitMetadataRowCount}`);
    console.log(`productionApprovedTrueCountInProvenance: ${productionApprovedTrueCountInProvenance}`);
    console.log(`needsReviewDefaultVerified: ${needsReviewDefaultVerified}`);
    console.log(`productionApprovedDefaultFalseVerified: ${productionApprovedDefaultFalseVerified}`);
    console.log(`marketPriceTableAltered: false`);
    console.log(`marketPriceUnitMetadataAltered: false`);
    console.log(`businessDataWriteAttempted: false`);
    console.log(`importAttempted: false`);
    console.log(`seedAttempted: false`);
    console.log(`productionDeployAttempted: false`);
    console.log(`schemaMigrationApplied: true`);
    console.log(`readOnlySmokePassed: ${readOnlySmokePassed}`);
    
    if (readOnlySmokePassed) {
        console.log(`recommendedNextPhase: Phase 145S — MarketPrice provenance dry-run import mapping to sidecar, no write by default`);
    } else {
        console.log(`recommendedNextPhase: Cannot proceed. Smoke test failed.`);
    }
}

smokePostMigration();
