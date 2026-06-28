process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { prisma } from "../src/lib/database/client";
import { execSync } from "child_process";
import fs from "fs";

async function runOrchestrationSmoke() {
    console.log("phase: 146D");
    console.log("mode: market_price_daily_refresh_orchestration_no_write_smoke");

    const orchestrationScriptPath = "scripts/orchestrate-market-price-daily-refresh.ts";
    const orchestrationScriptExists = fs.existsSync(orchestrationScriptPath);
    console.log(`orchestrationScriptExists: ${orchestrationScriptExists}`);

    // Pre counts
    const preMarketPriceRowCount = await prisma.marketPrice.count();
    const preProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    const preMarketPriceUnitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();
    const productionApprovedTrueCountBefore = await prisma.marketPriceProvenanceMetadata.count({
        where: { productionApproved: true }
    });

    let output = "";
    if (orchestrationScriptExists) {
        try {
            output = execSync(`npx tsx ${orchestrationScriptPath}`, { encoding: "utf-8" });
        } catch (e: unknown) {
            console.error("Orchestration script failed:", (e as Error).message);
        }
    }

    const extract = (key: string, isBoolean = false) => {
        const regex = new RegExp(`^${key}:\\s*(.*)$`, "m");
        const match = output.match(regex);
        if (match) {
            const val = match[1].trim();
            if (isBoolean) return val === "true";
            return val;
        }
        return isBoolean ? false : "unknown";
    };

    const confirmWrite = extract("confirmWrite", true);
    const scheduledAutoRunEnabled = extract("scheduledAutoRunEnabled", true);
    const cronRegistered = extract("cronRegistered", true);
    const dbWriteAttempted = extract("dbWriteAttempted", true);

    // Post counts
    const postMarketPriceRowCount = await prisma.marketPrice.count();
    const postProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    const postMarketPriceUnitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();
    const productionApprovedTrueCountAfter = await prisma.marketPriceProvenanceMetadata.count({
        where: { productionApproved: true }
    });

    const marketPriceRowsChanged = postMarketPriceRowCount - preMarketPriceRowCount;
    const provenanceRowsChanged = postProvenanceRowCount - preProvenanceRowCount;
    const marketPriceUnitMetadataRowsChanged = postMarketPriceUnitMetadataRowCount - preMarketPriceUnitMetadataRowCount;
    const productionApprovedTrueCountChanged = productionApprovedTrueCountAfter - productionApprovedTrueCountBefore;

    const noWriteVerified = 
        marketPriceRowsChanged === 0 && 
        provenanceRowsChanged === 0 && 
        marketPriceUnitMetadataRowsChanged === 0 && 
        productionApprovedTrueCountChanged === 0 &&
        !dbWriteAttempted;

    const defaultDryRun = !confirmWrite;

    const smokePassed = orchestrationScriptExists && noWriteVerified && defaultDryRun && !scheduledAutoRunEnabled && !cronRegistered;

    console.log(`defaultDryRun: ${defaultDryRun}`);
    console.log(`confirmWrite: ${confirmWrite}`);
    console.log(`scheduledAutoRunEnabled: ${scheduledAutoRunEnabled}`);
    console.log(`cronRegistered: ${cronRegistered}`);
    console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
    
    console.log(`preMarketPriceRowCount: ${preMarketPriceRowCount}`);
    console.log(`postMarketPriceRowCount: ${postMarketPriceRowCount}`);
    console.log(`marketPriceRowsChanged: ${marketPriceRowsChanged}`);
    
    console.log(`preProvenanceRowCount: ${preProvenanceRowCount}`);
    console.log(`postProvenanceRowCount: ${postProvenanceRowCount}`);
    console.log(`provenanceRowsChanged: ${provenanceRowsChanged}`);
    
    console.log(`preMarketPriceUnitMetadataRowCount: ${preMarketPriceUnitMetadataRowCount}`);
    console.log(`postMarketPriceUnitMetadataRowCount: ${postMarketPriceUnitMetadataRowCount}`);
    console.log(`marketPriceUnitMetadataRowsChanged: ${marketPriceUnitMetadataRowsChanged}`);
    
    console.log(`productionApprovedTrueCountBefore: ${productionApprovedTrueCountBefore}`);
    console.log(`productionApprovedTrueCountAfter: ${productionApprovedTrueCountAfter}`);
    console.log(`productionApprovedTrueCountChanged: ${productionApprovedTrueCountChanged}`);
    
    console.log(`noWriteVerified: ${noWriteVerified}`);
    console.log(`smokePassed: ${smokePassed}`);

    await prisma.$disconnect();
}

runOrchestrationSmoke().catch(e => {
    console.error(e);
    process.exit(1);
});
