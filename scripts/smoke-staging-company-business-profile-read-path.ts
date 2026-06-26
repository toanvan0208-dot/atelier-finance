import { loadCompanyBusinessProfile } from "../src/features/business/lib/load-company-business-profile";
import { getCompanyByTicker } from "../src/lib/database";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const REJECTED_WORDS = ["official", "khuyến nghị", "buy", "sell", "hold", "trading signal", "target price", "fair value", "upside", "downside"];

async function runSmoke() {
  console.log("=== Smoke Test: Staging Company Business Profile Read-Path ===\n");
  let hasError = false;

  for (const ticker of APPROVED_TICKERS) {
    const profile = await loadCompanyBusinessProfile(ticker);
    
    if (!profile) {
      console.error(`[ERROR] ${ticker}: Failed to fetch business profile.`);
      hasError = true;
      continue;
    }

    if (profile.sourceLabel !== "staging_company_business_profile_research_seed") {
      console.error(`[ERROR] ${ticker}: Invalid sourceLabel: ${profile.sourceLabel}`);
      hasError = true;
    }
    if (profile.dataMode !== "research_only") {
      console.error(`[ERROR] ${ticker}: Invalid dataMode: ${profile.dataMode}`);
      hasError = true;
    }
    if (profile.productionApproved !== false) {
      console.error(`[ERROR] ${ticker}: Invalid productionApproved: ${profile.productionApproved}`);
      hasError = true;
    }
    if (profile.needsReview !== true) {
      console.error(`[ERROR] ${ticker}: Invalid needsReview: ${profile.needsReview}`);
      hasError = true;
    }
    if (profile.businessDescription === "0") {
      console.error(`[ERROR] ${ticker}: Missing-to-zero rule violation.`);
      hasError = true;
    }

    const contentToCheck = `${profile.businessDescription} ${profile.mainProducts} ${profile.businessRiskNotes}`.toLowerCase();
    for (const word of REJECTED_WORDS) {
      if (contentToCheck.includes(word.toLowerCase())) {
        console.error(`[ERROR] ${ticker}: Contains rejected guardrail word: ${word}`);
        hasError = true;
      }
    }

    console.log(`[OK] ${ticker}: Profile loaded successfully.`);
    console.log(`     DataMode: ${profile.dataMode}, sourceLabel: ${profile.sourceLabel}`);
    console.log(`     Desc: ${profile.businessDescription.substring(0, 50)}...`);
  }

  // Check VCB
  const vcbProfile = await loadCompanyBusinessProfile("VCB");
  if (vcbProfile) {
    console.error("[ERROR] VCB returned a profile but it should not have one.");
    hasError = true;
  } else {
    console.log("[OK] VCB profile is correctly absent (null).");
  }

  console.log("\n=== Result ===");
  if (hasError) {
    console.error("SMOKE FAILED.");
    process.exit(1);
  } else {
    console.log("SMOKE PASSED.");
  }
}

runSmoke().catch(err => {
  console.error(err);
  process.exit(1);
});
