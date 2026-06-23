import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { buildRiskFinancialsRuntimeReadiness } from "../src/features/risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../src/features/valuation/lib/valuation-financials-runtime-readiness";
import { buildAssistantScreenContextPacket } from "../src/components/layout/assistant-screen-context";

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }

  console.log("=== PHASE 139G: VNM POST-IMPORT PRODUCT SMOKE ===");

  const vnm = await loadFinancialsRuntimeData({ ticker: "VNM", preferDb: true });
  console.log("\n[VNM Runtime Financials Snapshot]");
  console.log(JSON.stringify({
    sourceLabel: vnm.source.sourceLabel,
    dataMode: vnm.source.dataMode,
    productionApproved: vnm.source.productionApproved,
    fallbackUsed: vnm.source.fallbackUsed,
    eps: vnm.statementSnapshot?.eps,
    sharesOutstanding: vnm.statementSnapshot?.sharesOutstanding,
    totalDebt: vnm.statementSnapshot?.totalDebt,
    epsUnit: vnm.unitMetadata.eps.unit,
    sharesOutstandingUnit: vnm.unitMetadata.sharesOutstanding.unit,
    totalDebtUnit: vnm.unitMetadata.totalDebt.unit,
  }, null, 2));

  // Sanity check FPT/MWG/HPG
  const fpt = await loadFinancialsRuntimeData({ ticker: "FPT", preferDb: true });
  const mwg = await loadFinancialsRuntimeData({ ticker: "MWG", preferDb: true });
  const hpg = await loadFinancialsRuntimeData({ ticker: "HPG", preferDb: true });

  console.log("\n[Sanity Check: Source Priority]");
  console.log(`FPT source: ${fpt.source.sourceLabel}`);
  console.log(`MWG source: ${mwg.source.sourceLabel}`);
  console.log(`HPG source: ${hpg.source.sourceLabel}`);

  // Risk
  const riskReadiness = buildRiskFinancialsRuntimeReadiness({
    financialsRuntimeData: vnm,
    hasStaticRiskPath: false,
    riskConsumesFinancialsRuntime: true,
  });
  console.log("\n[Risk Module Behavior]");
  console.log("totalDebt missing in Risk?", riskReadiness.inputSnapshot.totalDebt === null);
  console.log("Risk totalDebt value:", riskReadiness.inputSnapshot.totalDebt);

  // Valuation
  const valuationReadiness = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData: vnm,
    hasPersistedLocalInputBridge: false,
    valuationConsumesFinancialsRuntime: true,
  });
  console.log("\n[Valuation Module Behavior]");
  console.log("Valuation source boundary approved?", valuationReadiness.productionApproved);

  // AI Assistant Context
  const context = buildAssistantScreenContextPacket({ ticker: "VNM", activeModule: "financials", financialsRuntimeData: vnm });
  console.log("\n[AI Assistant Context]");
  console.log("Context size:", JSON.stringify(context).length);
  const jsonContext = JSON.stringify(context);
  console.log("Contains EPS 4070?", jsonContext.includes("4070"));
  console.log("Contains shares 2089955445?", jsonContext.includes("2089955445"));
  console.log("Contains debt 9456.645?", jsonContext.includes("9456.645"));
  console.log("Contains correct sourceLabel?", jsonContext.includes("annual_report_2025_pdf_reviewed_preview"));
  console.log("Contains productionApproved: false?", jsonContext.includes('"productionApproved":false') || jsonContext.includes('"productionApproved": false'));
  console.log("Contains guardrails against recommendation logic?", /buy|sell|hold/i.test(jsonContext.replace(/buy_in|shareholders/gi, "")));
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
