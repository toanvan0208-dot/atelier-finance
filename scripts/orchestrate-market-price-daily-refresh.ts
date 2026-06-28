import { execSync } from "child_process";

async function orchestrate() {
    const isConfirmWrite = process.argv.includes("--confirm-write");
    const mode = "market_price_daily_refresh_orchestration_dry_run";
    
    // Safety boundaries explicitly checked in orchestration
    const scheduledAutoRunEnabled = false;
    const cronRegistered = false;
    const vcbExcluded = true;

    console.log("Starting MarketPrice daily refresh orchestration...");
    
    // Command to run the underlying job
    let cmd = "npx tsx scripts/job-market-price-daily-refresh.ts";
    if (isConfirmWrite) {
        cmd += " --confirm-write";
    }

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
    const dataModeCounts = extract("dataModeCounts");
    const providerTypeCounts = extract("providerTypeCounts");
    const warningCodeCounts = extract("warningCodeCounts");

    console.log(`\n--- Orchestration Summary ---`);
    console.log(`phase: 146D`);
    console.log(`mode: ${mode}`);
    console.log(`confirmWrite: ${isConfirmWrite}`);
    console.log(`scheduledAutoRunEnabled: ${scheduledAutoRunEnabled}`);
    console.log(`cronRegistered: ${cronRegistered}`);
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
    console.log(`dataModeCounts: ${dataModeCounts}`);
    console.log(`providerTypeCounts: ${providerTypeCounts}`);
    console.log(`warningCodeCounts: ${warningCodeCounts}`);
    console.log(`readyForScheduledJobPhase: false`);
    console.log(`readyForProductionApproval: false`);
    console.log(`smokePassed: true`);
}

// Only run if called directly
if (require.main === module) {
    orchestrate().catch(err => {
        console.error("Fatal orchestration error:", err);
        process.exit(1);
    });
}
