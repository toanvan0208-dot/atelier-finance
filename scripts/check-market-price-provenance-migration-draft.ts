import * as fs from 'fs';
import * as path from 'path';

function checkMigrationDraft() {
    console.log("Phase 145Q - Check MarketPrice provenance migration draft\n");

    const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaModelExists = false;
    if (fs.existsSync(prismaSchemaPath)) {
        const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
        if (schemaContent.includes('model MarketPriceProvenanceMetadata {')) {
            schemaModelExists = true;
        }
    }

    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    let migrationFolder = "";
    let migrationSqlPath = "";
    let migrationDraftCreated = false;
    let targetTable = "MarketPriceProvenanceMetadata";
    let containsOnlyExpectedTargets = true;
    let dropTableDetected = false;
    let dropColumnDetected = false;
    let truncateDetected = false;
    let deleteDetected = false;
    let insertDetected = false;
    let updateStatementDetected = false;
    let updateKeywordFalsePositive = false; // like updatedAt
    let alterDropDetected = false;
    let destructiveSqlDetected = false;
    let dataWriteSqlDetected = false;
    
    let productionApprovedDefaultFalse = false;
    let needsReviewDefaultTrue = false;
    let adjustmentStatusDefaultAdjusted = false;
    
    let marketPriceTableAltered = false;
    let marketPriceUnitMetadataAltered = false;
    let macroIndustryAltered = false;

    if (fs.existsSync(migrationsDir)) {
        const folders = fs.readdirSync(migrationsDir).filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());
        const targetFolders = folders.filter(f => f.includes('add_market_price_provenance_metadata'));
        if (targetFolders.length > 0) {
            targetFolders.sort();
            migrationFolder = targetFolders[targetFolders.length - 1];
            migrationSqlPath = path.join(migrationsDir, migrationFolder, 'migration.sql');
            
            if (fs.existsSync(migrationSqlPath)) {
                migrationDraftCreated = true;
                const sqlContent = fs.readFileSync(migrationSqlPath, 'utf8');
                
                const lines = sqlContent.split('\n');
                lines.forEach(line => {
                    const uLine = line.toUpperCase();
                    if (uLine.includes('DROP TABLE')) dropTableDetected = true;
                    if (uLine.includes('DROP COLUMN')) dropColumnDetected = true;
                    if (uLine.includes('TRUNCATE')) truncateDetected = true;
                    if (uLine.includes('DELETE FROM')) deleteDetected = true;
                    if (uLine.includes('INSERT INTO')) insertDetected = true;
                    
                    if (uLine.match(/\bUPDATE\s+"/)) updateStatementDetected = true;
                    if (uLine.includes('ALTER TABLE') && uLine.includes('DROP')) alterDropDetected = true;

                    if (uLine.includes('ALTER TABLE "MarketPrice"')) marketPriceTableAltered = true;
                    if (uLine.includes('ALTER TABLE "MarketPriceUnitMetadata"')) marketPriceUnitMetadataAltered = true;
                    if (uLine.includes('ALTER TABLE "MacroContext"')) macroIndustryAltered = true;
                    if (uLine.includes('ALTER TABLE "IndustryContext"')) macroIndustryAltered = true;
                });
                
                if (dropTableDetected || dropColumnDetected || truncateDetected || deleteDetected || alterDropDetected) {
                    destructiveSqlDetected = true;
                }
                
                if (insertDetected || updateStatementDetected) {
                    dataWriteSqlDetected = true;
                }

                if (marketPriceTableAltered || marketPriceUnitMetadataAltered || macroIndustryAltered) {
                    containsOnlyExpectedTargets = false;
                }

                if (sqlContent.includes('"productionApproved" BOOLEAN NOT NULL DEFAULT false')) {
                    productionApprovedDefaultFalse = true;
                }
                if (sqlContent.includes('"needsReview" BOOLEAN NOT NULL DEFAULT true')) {
                    needsReviewDefaultTrue = true;
                }
                if (sqlContent.includes('DEFAULT \'adjusted\'')) {
                    adjustmentStatusDefaultAdjusted = true;
                }
            }
        }
    }

    const safeForManualReview = schemaModelExists &&
                                migrationDraftCreated &&
                                containsOnlyExpectedTargets &&
                                !destructiveSqlDetected &&
                                !dataWriteSqlDetected &&
                                productionApprovedDefaultFalse &&
                                needsReviewDefaultTrue &&
                                !adjustmentStatusDefaultAdjusted;

    console.log(`--- MarketPrice Provenance Migration Draft Report ---`);
    console.log(`phase: 145Q`);
    console.log(`mode: market_price_provenance_migration_draft_no_apply`);
    console.log(`migrationFolder: ${migrationFolder}`);
    console.log(`migrationSqlPath: ${migrationSqlPath}`);
    console.log(`schemaModelExists: ${schemaModelExists}`);
    console.log(`migrationDraftCreated: ${migrationDraftCreated}`);
    console.log(`targetTable: ${targetTable}`);
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
    console.log(`productionApprovedDefaultFalse: ${productionApprovedDefaultFalse}`);
    console.log(`needsReviewDefaultTrue: ${needsReviewDefaultTrue}`);
    console.log(`adjustmentStatusDefaultAdjusted: ${adjustmentStatusDefaultAdjusted}`);
    console.log(`marketPriceTableAltered: ${marketPriceTableAltered}`);
    console.log(`marketPriceUnitMetadataAltered: ${marketPriceUnitMetadataAltered}`);
    console.log(`macroIndustryAltered: ${macroIndustryAltered}`);
    console.log(`migrationApplyAttempted: false`);
    console.log(`migrationResolveAttempted: false`);
    console.log(`dbWriteAttempted: false`);
    console.log(`safeForManualReview: ${safeForManualReview}`);
    console.log(`safeToApplyNow: false`);
    console.log(`explicitApprovalRequired: true`);
    
    if (safeForManualReview) {
        console.log(`recommendedNextPhase: Phase 145R — Explicitly approved MarketPrice provenance schema migration apply on staging`);
    } else {
        console.log(`recommendedNextPhase: Cannot proceed. Migration draft is not safe.`);
    }
}

checkMigrationDraft();
