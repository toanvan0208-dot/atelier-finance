import { getLatestMarketPrice } from "../src/lib/database/services/market-price-service";

async function runSmoke() {
  console.log("=== Smoke Test: Staging Market Price Read-Path ===\n");
  
  const tickers = ["FPT", "HPG", "VNM", "MSN", "MWG"];
  let passed = true;

  for (const ticker of tickers) {
    try {
      const record = await getLatestMarketPrice(ticker, { dataMode: "research_only" });
      
      if (!record) {
        console.error(`[FAIL] ${ticker}: No market price found.`);
        passed = false;
        continue;
      }
      
      if (!record.closePrice) {
        console.error(`[FAIL] ${ticker}: closePrice is missing (null/undefined).`);
        passed = false;
        continue;
      }

      console.log(`[PASS] ${ticker}: Found price ${record.closePrice.toString()} VND (As of ${record.tradingDate.toISOString().slice(0, 10)})`);
    } catch (e: unknown) {
      console.error(`[FAIL] ${ticker}: Exception occurred - ${(e as Error).message}`);
      passed = false;
    }
  }

  console.log(`\nOverall Read-Path Smoke Test: ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    process.exit(1);
  }
}

runSmoke().catch((e) => {
  console.error(e);
  process.exit(1);
});
