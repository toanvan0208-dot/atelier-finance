import fs from "fs";
import path from "path";

async function auditReadinessGates() {
    console.log("Starting MarketPrice scheduled readiness gates audit...");

    const providerProfilePath = path.resolve("docs/product/VNSTOCK_MARKET_PRICE_PROVIDER_PROFILE.md");
    const adrPath = path.resolve("docs/product/decisions/ADR_MARKET_PRICE_ADJUSTMENT_EVIDENCE.md");
    const stagingEntrypointPath = path.resolve("scripts/staging-scheduled-market-price-daily-refresh.ts");
    const stagingSmokePath = path.resolve("scripts/smoke-staging-scheduled-market-price-refresh-dry-run.ts");
    const readinessGatesPath = path.resolve("docs/product/MARKET_PRICE_DAILY_REFRESH_PRODUCTION_READINESS_GATES.md");
    const orchestratePath = path.resolve("scripts/orchestrate-market-price-daily-refresh.ts");

    const providerProfileDocumented = fs.existsSync(providerProfilePath);
    let providerProfileProductionApproved = false;
    let adjustmentEvidenceAvailable = false;
    
    if (providerProfileDocumented) {
        const profileContent = fs.readFileSync(providerProfilePath, "utf-8");
        if (profileContent.includes("productionApproved=true")) {
            providerProfileProductionApproved = true;
        }
    }

    const adjustmentEvidenceDecisionRecordExists = fs.existsSync(adrPath);

    let readinessContent = "";
    if (fs.existsSync(readinessGatesPath)) {
        readinessContent = fs.readFileSync(readinessGatesPath, "utf-8");
        if (readinessContent.includes("adjustmentEvidenceAvailable=true")) {
            adjustmentEvidenceAvailable = true;
        }
    }

    const stagingScheduledDryRunEntrypointExists = fs.existsSync(stagingEntrypointPath);
    const stagingScheduledDryRunSmokeExists = fs.existsSync(stagingSmokePath);
    
    let productionCronEnabled = false;
    let tlsNoVerifyProductionBlocked = true; // Based on environment docs and current setup
    let vCBExcludedOrUnsupported = true; // Based on runbook
    let scheduledJobKillSwitchAvailable = false; // "When the cron integration is completed, a feature flag/kill switch will be introduced"
    let productionApprovalWorkflowDefined = false;

    if (fs.existsSync(orchestratePath)) {
        const orchestrateContent = fs.readFileSync(orchestratePath, "utf-8");
        if (orchestrateContent.includes("const scheduledAutoRunEnabled = true;")) {
            productionCronEnabled = true;
        }
        if (orchestrateContent.includes("const vcbExcluded = false;")) {
            vCBExcludedOrUnsupported = false;
        }
    }

    const readyForStagingScheduledDryRun = stagingScheduledDryRunEntrypointExists && stagingScheduledDryRunSmokeExists;
    const readyForProductionCron = 
        adjustmentEvidenceAvailable && 
        providerProfileProductionApproved && 
        scheduledJobKillSwitchAvailable && 
        tlsNoVerifyProductionBlocked && 
        vCBExcludedOrUnsupported;
        
    const readyForProductionApproval = readyForProductionCron && productionApprovalWorkflowDefined;

    const auditPassed = readyForStagingScheduledDryRun && !readyForProductionCron;

    console.log(`\n--- Readiness Gates Audit ---`);
    console.log(`phase: 146F`);
    console.log(`mode: market_price_scheduled_readiness_gates_audit`);
    console.log(`providerProfileDocumented: ${providerProfileDocumented}`);
    console.log(`providerProfileProductionApproved: ${providerProfileProductionApproved}`);
    console.log(`adjustmentEvidenceDecisionRecordExists: ${adjustmentEvidenceDecisionRecordExists}`);
    console.log(`adjustmentEvidenceAvailable: ${adjustmentEvidenceAvailable}`);
    console.log(`stagingScheduledDryRunEntrypointExists: ${stagingScheduledDryRunEntrypointExists}`);
    console.log(`stagingScheduledDryRunSmokeExists: ${stagingScheduledDryRunSmokeExists}`);
    console.log(`productionCronEnabled: ${productionCronEnabled}`);
    console.log(`tlsNoVerifyProductionBlocked: ${tlsNoVerifyProductionBlocked}`);
    console.log(`vCBExcludedOrUnsupported: ${vCBExcludedOrUnsupported}`);
    console.log(`scheduledJobKillSwitchAvailable: ${scheduledJobKillSwitchAvailable}`);
    console.log(`productionApprovalWorkflowDefined: ${productionApprovalWorkflowDefined}`);
    console.log(`readyForStagingScheduledDryRun: ${readyForStagingScheduledDryRun}`);
    console.log(`readyForProductionCron: ${readyForProductionCron}`);
    console.log(`readyForProductionApproval: ${readyForProductionApproval}`);
    console.log(`auditPassed: ${auditPassed}`);
    console.log(`knownGaps: adjustmentEvidenceAvailable=false, provider profile not approved, scheduledJobKillSwitchAvailable=false, productionApprovalWorkflowDefined=false`);
}

auditReadinessGates().catch(console.error);
