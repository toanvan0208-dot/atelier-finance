import { prisma } from "../src/lib/database/client";
import { execSync } from "child_process";
import fs from "fs";

async function smokeTest() {
    const entrypoint = "scripts/staging-scheduled-market-price-daily-refresh.ts";
    const entrypointExists = fs.existsSync(entrypoint);

    const preMarketPriceRowCount = await prisma.marketPrice.count();
    const preProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    const preMarketPriceUnitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();
    
    const productionApprovedTrueCountBefore = await prisma.marketPriceProvenanceMetadata.count({
        where: { productionApproved: true }
    });

    let output = "";
    if (entrypointExists) {
        try {
            output = execSync(`npx tsx ${entrypoint}`, { encoding: "utf-8" });
        } catch (e) {
            console.error("Failed to run staging scheduled dry-run.");
            const error = e as Error & { stdout?: string; stderr?: string };
            if (error.stdout) console.log(error.stdout);
            if (error.stderr) console.error(error.stderr);
        }
    }

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

    const dbWriteAttempted = marketPriceRowsChanged !== 0 || provenanceRowsChanged !== 0 || marketPriceUnitMetadataRowsChanged !== 0 || productionApprovedTrueCountChanged !== 0;
    const noWriteVerified = dbWriteAttempted === false;

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

    const scheduledDryRun = extract("scheduledDryRun", true);
    const confirmWriteAllowed = extract("confirmWriteAllowed", true);
    const confirmWrite = extract("confirmWrite", true);
    const cronRegistered = extract("cronRegistered", true);
    const productionCronEnabled = extract("productionCronEnabled", true);
    const readyForStagingScheduledDryRun = extract("readyForStagingScheduledDryRun", true);
    const readyForProductionCron = extract("readyForProductionCron", true);

    const smokePassed = 
        entrypointExists && 
        noWriteVerified && 
        scheduledDryRun === true && 
        confirmWriteAllowed === false && 
        confirmWrite === false && 
        productionCronEnabled === false;

    console.log(`phase: 146F`);
    console.log(`mode: staging_scheduled_market_price_refresh_dry_run_smoke`);
    console.log(`entrypointExists: ${entrypointExists}`);
    console.log(`scheduledDryRun: ${scheduledDryRun}`);
    console.log(`confirmWriteAllowed: ${confirmWriteAllowed}`);
    console.log(`confirmWrite: ${confirmWrite}`);
    console.log(`cronRegistered: ${cronRegistered}`);
    console.log(`productionCronEnabled: ${productionCronEnabled}`);
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
    console.log(`readyForStagingScheduledDryRun: ${readyForStagingScheduledDryRun}`);
    console.log(`readyForProductionCron: ${readyForProductionCron}`);
    console.log(`noWriteVerified: ${noWriteVerified}`);
    console.log(`smokePassed: ${smokePassed}`);

    await prisma.$disconnect();
}

smokeTest().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
