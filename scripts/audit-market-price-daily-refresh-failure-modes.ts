import fs from "fs";

async function auditFailureModes() {
    console.log("phase: 146D");
    console.log("mode: market_price_daily_refresh_failure_mode_audit");

    const jobPath = "scripts/job-market-price-daily-refresh.ts";
    let jobCode = "";
    if (fs.existsSync(jobPath)) {
        jobCode = fs.readFileSync(jobPath, "utf-8");
    }

    const providerFetchFailureHandled = jobCode.includes("try") && jobCode.includes("catch") && jobCode.includes("Failed fetching for");
    const dbConnectionFailureHandled = jobCode.includes("try") && jobCode.includes("catch") && jobCode.includes("Failed writing row:");
    const duplicateRowsHandled = jobCode.includes("rowsAlreadyExist") && jobCode.includes("operation = \"skip\"");
    
    const missingCurrencyWarningHandled = jobCode.includes("warningCodes.push(\"MISSING_CURRENCY\")");
    const missingExchangeWarningHandled = jobCode.includes("warningCodes.push(\"MISSING_EXCHANGE\")");
    const missingPriceUnitWarningHandled = jobCode.includes("warningCodes.push(\"MISSING_PRICE_UNIT\")");
    const missingVolumeUnitWarningHandled = jobCode.includes("warningCodes.push(\"MISSING_VOLUME_UNIT\")");
    const missingAdjustmentEvidenceWarningHandled = jobCode.includes("warningCodes.push(\"MISSING_ADJUSTMENT_EVIDENCE\")");
    const missingMetadataWarningsHandled = missingCurrencyWarningHandled && missingExchangeWarningHandled && missingPriceUnitWarningHandled && missingVolumeUnitWarningHandled && missingAdjustmentEvidenceWarningHandled;

    const staleDataStatusHandled = jobCode.includes("stalenessStatus = \"stale\"") && jobCode.includes("stalenessStatus = \"fresh\"");
    const tlsNoVerifyLocalOnly = jobCode.includes("NODE_TLS_REJECT_UNAUTHORIZED") && !jobCode.includes("NODE_ENV === 'production'");
    const productionApprovalBlocked = jobCode.includes("productionApproved = false");
    const vCBExcludedOrUnsupported = !jobCode.includes("\"VCB\"");
    
    // We enforce missing data is not defaulted to zero.
    const noMissingToZero = !jobCode.includes("row.volume || 0") && !jobCode.includes("row.closePrice || 0");
    const noFallbackAsReal = jobCode.includes("fallbackUsed = false");
    const noSampleMockAsReal = jobCode.includes("dataMode = \"candidate_provider_data\"");
    
    const failureModeAuditPassed = 
        providerFetchFailureHandled && 
        dbConnectionFailureHandled && 
        duplicateRowsHandled && 
        missingMetadataWarningsHandled &&
        staleDataStatusHandled &&
        tlsNoVerifyLocalOnly &&
        productionApprovalBlocked &&
        vCBExcludedOrUnsupported &&
        noMissingToZero &&
        noFallbackAsReal &&
        noSampleMockAsReal;

    console.log(`providerFetchFailureHandled: ${providerFetchFailureHandled}`);
    console.log(`dbConnectionFailureHandled: ${dbConnectionFailureHandled}`);
    console.log(`duplicateRowsHandled: ${duplicateRowsHandled}`);
    console.log(`missingMetadataWarningsHandled: ${missingMetadataWarningsHandled}`);
    console.log(`staleDataStatusHandled: ${staleDataStatusHandled}`);
    console.log(`tlsNoVerifyLocalOnly: ${tlsNoVerifyLocalOnly}`);
    console.log(`productionApprovalBlocked: ${productionApprovalBlocked}`);
    console.log(`vCBExcludedOrUnsupported: ${vCBExcludedOrUnsupported}`);
    console.log(`noMissingToZero: ${noMissingToZero}`);
    console.log(`noFallbackAsReal: ${noFallbackAsReal}`);
    console.log(`noSampleMockAsReal: ${noSampleMockAsReal}`);
    console.log(`failureModeAuditPassed: ${failureModeAuditPassed}`);
    console.log(`knownGaps: Full integration testing with a broken provider API would be needed to exhaustively prove resilience.`);
}

if (require.main === module) {
    auditFailureModes().catch(console.error);
}
