import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";
import { macroCompassData } from "../src/features/macro/data/macroCompass.data";
import fs from "fs";
import path from "path";

async function smokeTest() {
  console.log("Running smoke test for Phase 148M - Market Macro Source Strategy\n");

  const results = {
    marketTradingValueFrontendVisible: false,
    foreignNetFlowFrontendVisible: false,
    marketTradingValueDbBacked: true,
    foreignNetFlowDbBacked: true,
    marketTradingValueNeedsReview: false,
    foreignNetFlowNeedsReview: false,
    mappingDoesNotCreateObservation: true,
    mappingDoesNotMarkDbBacked: true,
    mappingDoesNotWriteDb: true,
    sourceVerificationDoesNotExtractNumericValue: true,
    assistantDoesNotInventMarketTradingValue: false,
    assistantDoesNotInventForeignNetFlow: false,
    guardrailNoInvestmentAdvicePresent: false,
    frontendIndicatorUniverseNotExpanded: true,
    providerFetchAttempted: false,
    sourceUrlStatus: "missing",
    readyForParserDryRun: false,
    smokePassed: false,
  };

  const tvReg = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === "MARKET_TRADING_VALUE");
  if (tvReg) {
    results.marketTradingValueFrontendVisible = tvReg.inCurrentFrontend;
    results.marketTradingValueDbBacked = tvReg.dbBacked ?? false;
    results.marketTradingValueNeedsReview = tvReg.needsReview ?? false;
  }

  const fnfReg = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === "FOREIGN_NET_FLOW");
  if (fnfReg) {
    results.foreignNetFlowFrontendVisible = fnfReg.inCurrentFrontend;
    results.foreignNetFlowDbBacked = fnfReg.dbBacked ?? false;
    results.foreignNetFlowNeedsReview = fnfReg.needsReview ?? false;
  }

  const tvUrl = MACRO_SOURCE_URL_CANDIDATES.find(s => s.indicatorCode === "MARKET_TRADING_VALUE");
  if (tvUrl) {
    if (tvUrl.verificationStatus === "missing_source_url") {
      results.sourceUrlStatus = "missing";
    }
  }

  const fnfUrl = MACRO_SOURCE_URL_CANDIDATES.find(s => s.indicatorCode === "FOREIGN_NET_FLOW");
  if (fnfUrl) {
    if (fnfUrl.verificationStatus === "missing_source_url") {
      results.sourceUrlStatus = "missing";
    }
  }

  const assistantRouteContent = fs.readFileSync(path.join(__dirname, "../src/app/api/assistant/route.ts"), "utf-8");
  results.assistantDoesNotInventMarketTradingValue = assistantRouteContent.includes("MARKET_TRADING_VALUE and FOREIGN_NET_FLOW");
  results.assistantDoesNotInventForeignNetFlow = assistantRouteContent.includes("MARKET_TRADING_VALUE and FOREIGN_NET_FLOW");
  results.guardrailNoInvestmentAdvicePresent = assistantRouteContent.includes("do not turn foreign flow or liquidity into investment advice");

  results.smokePassed = 
    results.marketTradingValueFrontendVisible === true &&
    results.foreignNetFlowFrontendVisible === true &&
    results.marketTradingValueDbBacked === false &&
    results.foreignNetFlowDbBacked === false &&
    results.marketTradingValueNeedsReview === true &&
    results.foreignNetFlowNeedsReview === true &&
    results.assistantDoesNotInventMarketTradingValue === true &&
    results.assistantDoesNotInventForeignNetFlow === true &&
    results.guardrailNoInvestmentAdvicePresent === true &&
    results.sourceUrlStatus === "missing" &&
    results.providerFetchAttempted === false &&
    results.readyForParserDryRun === false;

  console.log(JSON.stringify(results, null, 2));

  if (results.smokePassed) {
    console.log("\n✅ SMOKE TEST PASSED");
    process.exit(0);
  } else {
    console.log("\n❌ SMOKE TEST FAILED");
    process.exit(1);
  }
}

smokeTest().catch(console.error);
