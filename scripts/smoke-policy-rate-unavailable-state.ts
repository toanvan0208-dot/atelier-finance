import { DOMESTIC_RATE_FRONTEND_INDICATOR_CODE } from "../src/features/macro/lib/macro-domestic-rate-semantic-mapping";
import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";
import { MACRO_SOURCE_URL_CANDIDATES } from "../src/features/macro/lib/macro-source-url-candidates";
import { macroCompassData } from "../src/features/macro/data/macroCompass.data";
import fs from "fs";
import path from "path";

async function smokeTest() {
  console.log("Running smoke test for Phase 148L - Policy Rate Unavailable State\n");

  const results = {
    policyRateSelectedForDomesticRate: DOMESTIC_RATE_FRONTEND_INDICATOR_CODE === "POLICY_RATE",
    policyRateDbBacked: false,
    policyRateNeedsReview: false,
    policyRateParserReadinessBlocked: false,
    uiUnavailableCopyPresent: false,
    assistantDomesticRateUnavailableCopyPresent: false,
  };

  const policyRateRegistry = MACRO_INDICATOR_UNIVERSE.find(i => i.indicatorCode === "POLICY_RATE");
  if (policyRateRegistry) {
    results.policyRateDbBacked = policyRateRegistry.dbBacked ?? false;
    results.policyRateNeedsReview = policyRateRegistry.needsReview ?? false;
  }

  const sourceUrl = MACRO_SOURCE_URL_CANDIDATES.find(s => s.indicatorCode === "POLICY_RATE");
  if (sourceUrl) {
    results.policyRateParserReadinessBlocked = sourceUrl.automationLevel === "blocked" || sourceUrl.verificationStatus === "blocked";
  }

  const domesticRateUI = macroCompassData.vietnamMetrics.find(m => m.id === "domestic-rate");
  if (domesticRateUI) {
    results.uiUnavailableCopyPresent = domesticRateUI.warnings?.includes("Chưa có dữ liệu lãi suất điều hành đã kiểm duyệt.") ?? false;
  }

  const assistantRouteContent = fs.readFileSync(path.join(__dirname, "../src/app/api/assistant/route.ts"), "utf-8");
  results.assistantDomesticRateUnavailableCopyPresent = assistantRouteContent.includes("Hiện hệ thống chưa có dữ liệu lãi suất điều hành đã kiểm duyệt");

  console.log(JSON.stringify(results, null, 2));

  const allPassed = 
    results.policyRateSelectedForDomesticRate === true &&
    results.policyRateDbBacked === false &&
    results.policyRateNeedsReview === true &&
    results.policyRateParserReadinessBlocked === true &&
    results.uiUnavailableCopyPresent === true &&
    results.assistantDomesticRateUnavailableCopyPresent === true;

  if (allPassed) {
    console.log("\n✅ SMOKE TEST PASSED");
    process.exit(0);
  } else {
    console.log("\n❌ SMOKE TEST FAILED");
    process.exit(1);
  }
}

smokeTest().catch(console.error);
