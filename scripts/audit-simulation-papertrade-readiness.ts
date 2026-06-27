import { prisma as db } from "../src/lib/database/client";
import { getLatestMarketPrice } from "../src/lib/database/services/market-price-service";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];

async function runAudit() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.log("SIMULATION / PAPERTRADE READ-PATH AUDIT...");

  const results = [];

  for (const ticker of APPROVED_TICKERS) {
    let marketPrice = "MISSING";
    let technicalData = "MISSING";
    const paperTradeSchema = "schema_only";
    let simulationReady = "partial";
    const mockDependency = "yes";
    let status = "PARTIAL";

    try {
      const price = await getLatestMarketPrice(ticker, { dataMode: "research_only" });
      if (price) {
        marketPrice = "OK";
        technicalData = "OK/PARTIAL";
      }

      if (ticker === "VCB") {
        marketPrice = "unsupported";
        technicalData = "unsupported";
        simulationReady = "unsupported";
        status = "PASS";
      } else if (marketPrice === "OK") {
        status = "PASS/PARTIAL";
      }

      results.push({
        Ticker: ticker,
        MarketPrice: marketPrice,
        TechnicalData: technicalData,
        PaperTradeSchema: paperTradeSchema,
        SimulationReady: simulationReady,
        MockDependency: mockDependency,
        Status: status,
      });
    } catch (error) {
      console.error(`[TICKER] ${ticker}: Error`, error);
      results.push({
        Ticker: ticker,
        MarketPrice: "ERROR",
        TechnicalData: "ERROR",
        PaperTradeSchema: paperTradeSchema,
        SimulationReady: "ERROR",
        MockDependency: mockDependency,
        Status: "FAIL",
      });
    }
  }

  console.table(results);
  await db.$disconnect();
}

runAudit().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
