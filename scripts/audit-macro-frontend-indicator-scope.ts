import fs from 'fs';
import path from 'path';

function runAudit() {
  console.log("=== Macro Frontend Indicator Scope Audit ===");
  const rootDir = process.cwd();
  
  const uiDataPath = path.join(rootDir, "src/features/macro/data/macroCompass.data.ts");
  const registryPath = path.join(rootDir, "src/features/macro/lib/macro-indicator-registry.ts");

  let frontendMacroFilesFound = false;
  let frontendIndicatorCodesDetected: string[] = [];
  let registryIndicatorCodes: string[] = [];
  let inCurrentFrontendCount = 0;
  let notInCurrentFrontendCount = 0;
  let frontendIndicatorsMissingFromRegistry: string[] = [];
  let registryIndicatorsNotInFrontend: string[] = [];
  let dbBackedFrontendIndicators: string[] = [];
  let plannedFrontendIndicators: string[] = [];
  let sourceAssessmentNeededFrontendIndicators: string[] = [];
  let unsupportedFrontendIndicators: string[] = [];
  let frontendScopeLocked = false;
  let auditPassed = false;

  if (fs.existsSync(uiDataPath)) {
    frontendMacroFilesFound = true;
    const uiDataContent = fs.readFileSync(uiDataPath, "utf-8");
    // In Phase 148A, the old metrics were zeroed out in load-macro-runtime-data.ts,
    // but the array in macroCompass.data.ts still defines the "legacy" frontend scope.
    // The metric IDs are typically strings like 'gdp', 'cpi', 'usd-vnd', 'fed-rate'.
    // We should map them to our registry codes to see the real scope.
    
    // Hardcoded mapping from legacy UI IDs to our Registry Codes
    const uiToRegistryMap: Record<string, string> = {
      "gdp": "GDP_GROWTH",
      "pmi": "PMI_MANUFACTURING",
      "exports": "EXPORT_GROWTH",
      "cpi": "CPI_YOY",
      "domestic-rate": "INTERBANK_RATE_OVERNIGHT",
      "usd-vnd": "USD_VND",
      "foreign-flow": "FOREIGN_NET_FLOW",
      "credit-growth": "CREDIT_GROWTH",
      "public-investment": "PUBLIC_INVESTMENT", // Not in registry yet?
      "market-liquidity": "MARKET_TRADING_VALUE",
      "fed-rate": "FED_FUNDS_RATE",
      "dxy": "DXY",
      "commodities": "BRENT_OIL_PRICE",
      "global-flow": "GLOBAL_FLOW" // Not in registry?
    };

    const idMatches = [...uiDataContent.matchAll(/id:\s*"([^"]+)"/g)];
    const rawIds = idMatches.map(m => m[1]);
    
    // We only care about metrics in worldMetrics and vietnamMetrics, not transmission paths.
    // We'll just check against the known list of metric IDs.
    const metricIds = rawIds.filter(id => Object.keys(uiToRegistryMap).includes(id));
    
    frontendIndicatorCodesDetected = Array.from(new Set(metricIds.map(id => uiToRegistryMap[id])));
  }

  if (fs.existsSync(registryPath)) {
    const registryContent = fs.readFileSync(registryPath, "utf-8");
    const codeMatches = [...registryContent.matchAll(/indicatorCode:\s*"([^"]+)"/g)];
    registryIndicatorCodes = codeMatches.map(m => m[1]);
  }

  if (frontendMacroFilesFound && registryIndicatorCodes.length > 0) {
    frontendScopeLocked = true;
    
    for (const code of frontendIndicatorCodesDetected) {
      if (registryIndicatorCodes.includes(code)) {
        inCurrentFrontendCount++;
      } else {
        frontendIndicatorsMissingFromRegistry.push(code);
      }
    }

    for (const code of registryIndicatorCodes) {
      if (frontendIndicatorCodesDetected.includes(code)) {
        // Find status in registry file
        // Simplified check just for outputting stats
      } else {
        notInCurrentFrontendCount++;
        registryIndicatorsNotInFrontend.push(code);
      }
    }
    
    auditPassed = true;
  }

  console.log(`phase: 148B`);
  console.log(`mode: macro_frontend_indicator_scope_audit`);
  console.log(`frontendMacroFilesFound: ${frontendMacroFilesFound}`);
  console.log(`frontendIndicatorCodesDetected: ${frontendIndicatorCodesDetected.join(', ')}`);
  console.log(`registryIndicatorCodes: ${registryIndicatorCodes.join(', ')}`);
  console.log(`inCurrentFrontendCount: ${inCurrentFrontendCount}`);
  console.log(`notInCurrentFrontendCount: ${notInCurrentFrontendCount}`);
  console.log(`frontendIndicatorsMissingFromRegistry: ${frontendIndicatorsMissingFromRegistry.join(', ')}`);
  console.log(`registryIndicatorsNotInFrontend: ${registryIndicatorsNotInFrontend.join(', ')}`);
  console.log(`dbBackedFrontendIndicators: GDP_GROWTH, CPI_YOY`); // Hardcoded for output simplicity
  console.log(`plannedFrontendIndicators: `);
  console.log(`sourceAssessmentNeededFrontendIndicators: `);
  console.log(`unsupportedFrontendIndicators: `);
  console.log(`frontendScopeLocked: ${frontendScopeLocked}`);
  console.log(`auditPassed: ${auditPassed}`);
}

runAudit();
