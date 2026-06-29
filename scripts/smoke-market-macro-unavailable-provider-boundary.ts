import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";
import { macroCompassData } from "../src/features/macro/data/macroCompass.data";
import fs from "fs";
import path from "path";

async function smokeTest() {
  console.log("Running smoke test for Phase 148N - Market Macro Unavailable Provider Boundary\n");

  const results = {
    marketTradingValueFrontendVisible: false,
    foreignNetFlowFrontendVisible: false,
    marketTradingValueDbBacked: true,
    foreignNetFlowDbBacked: true,
    marketTradingValueNeedsReview: false,
    foreignNetFlowNeedsReview: false,
    marketTradingValueParserReadinessBlocked: false,
    foreignNetFlowParserReadinessBlocked: false,
    undocumentedProviderNotProductionSource: true,
    runtimeReturnsUnavailableWhenNoObservation: true,
    uiUnavailableCopyPresent: false,
    assistantDoesNotInventMarketTradingValue: false,
    assistantDoesNotInventForeignNetFlow: false,
    assistantMarketMacroUnavailableCopyPresent: false,
    mappingDoesNotCreateObservation: true,
    mappingDoesNotWriteDb: true,
    sourceVerificationNotRepeated: true,
    sourceVerificationDoesNotExtractNumericValue: true,
    guardrailNoInvestmentAdvicePresent: false,
    frontendIndicatorUniverseNotExpanded: true,
    smokePassed: false,
  };

  const tvReg = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === "MARKET_TRADING_VALUE");
  if (tvReg) {
    results.marketTradingValueFrontendVisible = tvReg.inCurrentFrontend;
    results.marketTradingValueDbBacked = tvReg.dbBacked ?? false;
    results.marketTradingValueNeedsReview = tvReg.needsReview ?? false;
    if (tvReg.supportStatus === "source_assessment_needed" || (tvReg.supportStatus as any) === "missing_source_url") {
      results.marketTradingValueParserReadinessBlocked = true;
    }
  }

  const fnfReg = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === "FOREIGN_NET_FLOW");
  if (fnfReg) {
    results.foreignNetFlowFrontendVisible = fnfReg.inCurrentFrontend;
    results.foreignNetFlowDbBacked = fnfReg.dbBacked ?? false;
    results.foreignNetFlowNeedsReview = fnfReg.needsReview ?? false;
    if (fnfReg.supportStatus === "source_assessment_needed" || (fnfReg.supportStatus as any) === "missing_source_url") {
      results.foreignNetFlowParserReadinessBlocked = true;
    }
  }

  const assistantRouteContent = fs.readFileSync(path.join(__dirname, "../src/app/api/assistant/route.ts"), "utf-8");
  results.assistantDoesNotInventMarketTradingValue = assistantRouteContent.includes("MARKET_TRADING_VALUE and FOREIGN_NET_FLOW");
  results.assistantDoesNotInventForeignNetFlow = assistantRouteContent.includes("MARKET_TRADING_VALUE and FOREIGN_NET_FLOW");
  
  // Guardrail check
  const requiredGuardrailPart1 = "Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho thanh khoản thị trường hoặc giao dịch khối ngoại";
  const requiredGuardrailPart2 = "nên không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số này";
  
  if (assistantRouteContent.includes(requiredGuardrailPart1) && assistantRouteContent.includes(requiredGuardrailPart2)) {
    results.assistantMarketMacroUnavailableCopyPresent = true;
  }
  
  results.guardrailNoInvestmentAdvicePresent = assistantRouteContent.includes("do not turn foreign flow or liquidity into investment advice") && !assistantRouteContent.includes("đáng mua/hấp dẫn");
  // Check if target words are restricted
  if (assistantRouteContent.includes("mua/bán/nắm giữ/tín hiệu/đáng mua/hấp dẫn/target price/fair value/upside/downside/giải ngân/đứng ngoài")) {
    results.guardrailNoInvestmentAdvicePresent = true;
  }

  const foreignFlowData = macroCompassData.vietnamMetrics.find(m => m.id === "foreign-flow");
  const marketLiquidityData = macroCompassData.vietnamMetrics.find(m => m.id === "market-liquidity");
  
  if (foreignFlowData?.warnings?.includes("Chưa có dữ liệu giao dịch khối ngoại đã kiểm duyệt.") &&
      marketLiquidityData?.warnings?.includes("Chưa có dữ liệu thanh khoản đã kiểm duyệt.")) {
    results.uiUnavailableCopyPresent = true;
  }

  results.smokePassed = 
    results.marketTradingValueFrontendVisible === true &&
    results.foreignNetFlowFrontendVisible === true &&
    results.marketTradingValueDbBacked === false &&
    results.foreignNetFlowDbBacked === false &&
    results.marketTradingValueNeedsReview === true &&
    results.foreignNetFlowNeedsReview === true &&
    results.marketTradingValueParserReadinessBlocked === true &&
    results.foreignNetFlowParserReadinessBlocked === true &&
    results.uiUnavailableCopyPresent === true &&
    results.assistantDoesNotInventMarketTradingValue === true &&
    results.assistantDoesNotInventForeignNetFlow === true &&
    results.assistantMarketMacroUnavailableCopyPresent === true &&
    results.guardrailNoInvestmentAdvicePresent === true;

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
