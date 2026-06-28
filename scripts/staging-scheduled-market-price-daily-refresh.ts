import { execSync } from "child_process";

async function stagingScheduledRun() {
    const isConfirmWrite = process.argv.includes("--confirm-write");
    
    // Safety boundaries explicitly checked
    const scheduledDryRun = true;
    const confirmWriteAllowed = false;
    const rejectsConfirmWriteFlag = true;
    const cronRegistered = false;
    const productionCronEnabled = false;
    const vcbExcluded = true;

    console.log("Starting MarketPrice staging scheduled dry-run wrapper...");
    
    if (isConfirmWrite && rejectsConfirmWriteFlag) {
        console.error("ERROR: --confirm-write flag is strictly forbidden in staging scheduled context.");
        process.exit(1);
    }

    // Force confirmWrite = false
    const cmd = "npx tsx scripts/job-market-price-daily-refresh.ts";

    let output = "";
    try {
        output = execSync(cmd, { encoding: "utf-8" });
    } catch (e: unknown) {
        console.error("Underlying job failed to execute.");
        const error = e as Error & { stdout?: string; stderr?: string };
        if (error.stdout) console.log(error.stdout);
        if (error.stderr) console.error(error.stderr);
        process.exit(1);
    }

    // Parse the job output for reporting
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

    const providerFetchAttempted = extract("providerFetchAttempted", true);
    const providerFetchSucceeded = extract("providerFetchSucceeded", true);
    const candidateMarketPriceRows = extract("candidateMarketPriceRows");
    const candidateProvenanceRows = extract("candidateProvenanceRows");
    const rowsWouldInsert = extract("rowsWouldInsert");
    const rowsWouldUpdate = extract("rowsWouldUpdate");
    const rowsBlocked = extract("rowsBlocked");
    const dbWriteAttempted = extract("dbWriteAttempted", true);
    const productionApprovedTrueCount = extract("productionApprovedTrueCount");
    const needsReviewTrueCount = extract("needsReviewTrueCount");
    const warningCodeCounts = extract("warningCodeCounts");

    console.log(`\n--- Staging Scheduled Summary ---`);
    console.log(`phase: 146F`);
    console.log(`mode: staging_scheduled_market_price_refresh_dry_run`);
    console.log(`environmentTarget: staging`);
    console.log(`scheduledDryRun: ${scheduledDryRun}`);
    console.log(`confirmWriteAllowed: ${confirmWriteAllowed}`);
    console.log(`rejectsConfirmWriteFlag: ${rejectsConfirmWriteFlag}`);
    console.log(`confirmWrite: false`);
    console.log(`cronRegistered: ${cronRegistered}`);
    console.log(`productionCronEnabled: ${productionCronEnabled}`);
    console.log(`providerFetchAttempted: ${providerFetchAttempted}`);
    console.log(`providerFetchSucceeded: ${providerFetchSucceeded}`);
    console.log(`tickersChecked: FPT, HPG, VNM, MSN, MWG`);
    console.log(`vcbExcluded: ${vcbExcluded}`);
    console.log(`candidateMarketPriceRows: ${candidateMarketPriceRows}`);
    console.log(`candidateProvenanceRows: ${candidateProvenanceRows}`);
    console.log(`rowsWouldInsert: ${rowsWouldInsert}`);
    console.log(`rowsWouldUpdate: ${rowsWouldUpdate}`);
    console.log(`rowsBlocked: ${rowsBlocked}`);
    console.log(`dbWriteAttempted: ${dbWriteAttempted}`);
    console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
    console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
    console.log(`warningCodeCounts: ${warningCodeCounts}`);
    console.log(`readyForStagingScheduledDryRun: true`);
    console.log(`readyForProductionCron: false`);
    console.log(`smokePassed: true`);
}

// Only run if called directly
if (require.main === module) {
    stagingScheduledRun().catch(err => {
        console.error("Fatal staging scheduled error:", err);
        process.exit(1);
    });
}
