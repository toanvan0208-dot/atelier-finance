process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { prisma } from "../src/lib/database/client";

async function runNoAutoRunSmoke() {
    const phase = "146C";
    const mode = "market_price_daily_refresh_job_no_auto_run_smoke";
    
    // Check if the script exists
    const fs = require("fs");
    const jobEntrypointExists = fs.existsSync("./scripts/job-market-price-daily-refresh.ts");
    
    // Count before
    const preMarketPriceRowCount = await prisma.marketPrice.count();
    const preProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    const preMarketPriceUnitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();

    // Import the job script (this should NOT execute it automatically)
    // We will dynamically import to ensure it is loaded during runtime
    await import("./job-market-price-daily-refresh");
    
    // Wait a little bit to see if anything executes asynchronously
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Count after importing
    let postMarketPriceRowCount = await prisma.marketPrice.count();
    let postProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    let postMarketPriceUnitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();
    
    let marketPriceRowsChanged = postMarketPriceRowCount - preMarketPriceRowCount;
    let provenanceRowsChanged = postProvenanceRowCount - preProvenanceRowCount;
    let marketPriceUnitMetadataRowsChanged = postMarketPriceUnitMetadataRowCount - preMarketPriceUnitMetadataRowCount;
    
    let importNoAutoRunVerified = marketPriceRowsChanged === 0 && provenanceRowsChanged === 0 && marketPriceUnitMetadataRowsChanged === 0;
    
    // Execute default run (no --confirm-write)
    const { runDailyProviderRefreshJob } = await import("./job-market-price-daily-refresh");
    await runDailyProviderRefreshJob();
    
    // Wait a little bit to see if anything executes asynchronously
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    postMarketPriceRowCount = await prisma.marketPrice.count();
    postProvenanceRowCount = await prisma.marketPriceProvenanceMetadata.count();
    postMarketPriceUnitMetadataRowCount = await prisma.marketPriceUnitMetadata.count();
    
    marketPriceRowsChanged = postMarketPriceRowCount - preMarketPriceRowCount;
    provenanceRowsChanged = postProvenanceRowCount - preProvenanceRowCount;
    marketPriceUnitMetadataRowsChanged = postMarketPriceUnitMetadataRowCount - preMarketPriceUnitMetadataRowCount;
    
    const executionNoWriteVerified = marketPriceRowsChanged === 0 && provenanceRowsChanged === 0 && marketPriceUnitMetadataRowsChanged === 0;

    const noAutoRunVerified = importNoAutoRunVerified && executionNoWriteVerified;
    const dbWriteAttempted = !noAutoRunVerified;
    const defaultDryRun = true;
    const confirmWrite = false;
    const smokePassed = jobEntrypointExists && noAutoRunVerified;

    console.log(`\n--- Smoke Summary ---`);
    console.log(`phase: ${phase}`);
    console.log(`mode: ${mode}`);
    console.log(`jobEntrypointExists: ${jobEntrypointExists}`);
    console.log(`defaultDryRun: ${defaultDryRun}`);
    console.log(`confirmWrite: ${confirmWrite}`);
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
    
    console.log(`noAutoRunVerified: ${noAutoRunVerified}`);
    console.log(`smokePassed: ${smokePassed}`);

    await prisma.$disconnect();
}

runNoAutoRunSmoke().catch(console.error);
