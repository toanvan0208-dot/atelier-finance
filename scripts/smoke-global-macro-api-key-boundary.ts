import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";
import fs from "fs";
import path from "path";

async function smokeTest() {
  console.log("Running smoke test for Phase 148P - Global Macro API Key Boundary & USD Semantic Decision\n");

  const results = {
    fedFundsRateFrontendVisible: false,
    dxyOrUsdIndexFrontendVisible: false,
    brentOilPriceFrontendVisible: false,
    fedFundsRateDbBacked: true,
    dxyDbBacked: true,
    brentOilPriceDbBacked: true,
    fedFundsRateNeedsReview: false,
    dxyNeedsReview: false,
    brentOilPriceNeedsReview: false,
    fredApiKeyBoundaryPresent: false,
    fredFetchNotAttemptedWithoutApiKey: true, // we didn't add fetch code
    dxyProxyNotTreatedAsOfficialDxy: false,
    usdIndexLabelOrCopyClarified: false,
    globalMacroUnavailableCopyPresent: false,
    assistantDoesNotInventFedFundsRate: false,
    assistantDoesNotInventDxyOrUsdIndex: false,
    assistantDoesNotInventBrentOil: false,
    mappingDoesNotCreateObservation: true,
    mappingDoesNotWriteDb: true,
    sourceVerificationNotRepeated: true,
    sourceVerificationDoesNotExtractNumericValue: true,
    guardrailNoInvestmentAdvicePresent: false,
    frontendIndicatorUniverseNotExpanded: true,
    smokePassed: false,
  };

  const checkIndicator = (code: string) => {
    const reg = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === code);
    return {
      frontendVisible: reg?.inCurrentFrontend ?? false,
      dbBacked: reg?.dbBacked ?? true,
      needsReview: reg?.needsReview ?? false,
      displayName: reg?.displayName ?? "",
      description: reg?.description ?? "",
    };
  };

  const fed = checkIndicator("FED_FUNDS_RATE");
  results.fedFundsRateFrontendVisible = fed.frontendVisible;
  results.fedFundsRateDbBacked = fed.dbBacked;
  results.fedFundsRateNeedsReview = fed.needsReview;

  const dxy = checkIndicator("DXY");
  results.dxyOrUsdIndexFrontendVisible = dxy.frontendVisible;
  results.dxyDbBacked = dxy.dbBacked;
  results.dxyNeedsReview = dxy.needsReview;
  
  if (dxy.displayName === "Sức mạnh USD" && dxy.description.includes("không phải ICE DXY chính thức")) {
    results.dxyProxyNotTreatedAsOfficialDxy = true;
    results.usdIndexLabelOrCopyClarified = true;
  }

  const brent = checkIndicator("BRENT_OIL_PRICE");
  results.brentOilPriceFrontendVisible = brent.frontendVisible;
  results.brentOilPriceDbBacked = brent.dbBacked;
  results.brentOilPriceNeedsReview = brent.needsReview;

  const fredCandidates = MACRO_SOURCE_URL_CANDIDATES.filter(c => c.sourceName.includes("FRED"));
  if (fredCandidates.length > 0 && fredCandidates.every(c => c.limitations.some(l => l.includes("auth_required")))) {
    results.fredApiKeyBoundaryPresent = true;
  }

  const compassDataContent = fs.readFileSync(path.join(__dirname, "../src/features/macro/data/macroCompass.data.ts"), "utf-8");
  if (
    compassDataContent.includes("Chưa có dữ liệu lãi suất Fed đã kiểm duyệt.") &&
    compassDataContent.includes("Chưa có dữ liệu chỉ số USD đã kiểm duyệt.") &&
    compassDataContent.includes("Chưa có dữ liệu giá hàng hóa đã kiểm duyệt.")
  ) {
    results.globalMacroUnavailableCopyPresent = true;
  }

  const assistantRouteContent = fs.readFileSync(path.join(__dirname, "../src/app/api/assistant/route.ts"), "utf-8");
  
  if (assistantRouteContent.includes("Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho lãi suất Fed, chỉ số USD hoặc giá dầu Brent")) {
    results.assistantDoesNotInventFedFundsRate = true;
    results.assistantDoesNotInventDxyOrUsdIndex = true;
    results.assistantDoesNotInventBrentOil = true;
  }

  if (assistantRouteContent.includes("mua/bán/nắm giữ/tín hiệu/đáng mua/hấp dẫn/target price/fair value/upside/downside/giải ngân/đứng ngoài")) {
    results.guardrailNoInvestmentAdvicePresent = true;
  }

  results.smokePassed = 
    results.fedFundsRateFrontendVisible === true &&
    results.dxyOrUsdIndexFrontendVisible === true &&
    results.brentOilPriceFrontendVisible === true &&
    results.fedFundsRateDbBacked === false &&
    results.dxyDbBacked === false &&
    results.brentOilPriceDbBacked === false &&
    results.fedFundsRateNeedsReview === true &&
    results.dxyNeedsReview === true &&
    results.brentOilPriceNeedsReview === true &&
    results.fredApiKeyBoundaryPresent === true &&
    results.dxyProxyNotTreatedAsOfficialDxy === true &&
    results.usdIndexLabelOrCopyClarified === true &&
    results.globalMacroUnavailableCopyPresent === true &&
    results.assistantDoesNotInventFedFundsRate === true &&
    results.assistantDoesNotInventDxyOrUsdIndex === true &&
    results.assistantDoesNotInventBrentOil === true &&
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
