import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { getLatestMarketPrice } from "../src/lib/database/services/market-price-service";

import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
const run = async () => {
  requirePostgresDatabaseUrl("verify-vnstock-candidate-runtime.ts");
  const tickers = ["FPT", "MWG", "VNM", "HPG", "VCB", "MSN"];

  console.log("=== RUNTIME CANDIDATE READ PATH VERIFICATION ===");

  for (const ticker of tickers) {
    const runtimeData = await loadFinancialsRuntimeData({ ticker }, { readLatestMarketPrice: getLatestMarketPrice });
    
    console.log(`\nTicker: ${ticker}`);
    console.log(`Status: ${runtimeData.runtimeStatus}`);
    console.log(`Source Label: ${runtimeData.source.sourceLabel}`);
    console.log(`Data Mode: ${runtimeData.source.dataMode}`);
    console.log(`Production Approved: ${runtimeData.source.productionApproved}`);
    console.log(`Fallback Used: ${runtimeData.source.fallbackUsed}`);
    console.log(`Readiness: ${runtimeData.dataQuality.status}`);
    
    if (runtimeData.statementSnapshot) {
      console.log(`EPS: ${runtimeData.statementSnapshot.eps ?? "null"}`);
      console.log(`Shares Outstanding: ${runtimeData.statementSnapshot.sharesOutstanding ?? "null"}`);
      console.log(`Total Debt: ${runtimeData.statementSnapshot.totalDebt ?? "null"}`);
    } else {
      console.log(`EPS: null (No snapshot)`);
      console.log(`Shares Outstanding: null (No snapshot)`);
      console.log(`Total Debt: null (No snapshot)`);
    }

    if (runtimeData.dataQuality.missingFields.length > 0) {
      console.log(`Missing Fields: ${runtimeData.dataQuality.missingFields.join(", ")}`);
    } else {
      console.log("Missing Fields: None");
    }
  }
};

run().catch(console.error);
