import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { buildRiskFinancialsRuntimeReadiness } from "../src/features/risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../src/features/valuation/lib/valuation-financials-runtime-readiness";
import { buildAssistantScreenContextPacket } from "../src/components/layout/assistant-screen-context";

import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
async function main() {
  requirePostgresDatabaseUrl("smoke-hpg-pdf-reviewed-post-import.ts");

  console.log("=== PHASE 139E: HPG POST-IMPORT PRODUCT SMOKE ===");

  const hpg = await loadFinancialsRuntimeData({ ticker: "HPG", preferDb: true });
  console.log("\n[HPG Runtime Financials Snapshot]");
  console.log(JSON.stringify({
    sourceLabel: hpg.source.sourceLabel,
    dataMode: hpg.source.dataMode,
    productionApproved: hpg.source.productionApproved,
    fallbackUsed: hpg.source.fallbackUsed,
    eps: hpg.statementSnapshot?.eps,
    sharesOutstanding: hpg.statementSnapshot?.sharesOutstanding,
    totalDebt: hpg.statementSnapshot?.totalDebt,
    epsUnit: hpg.unitMetadata.eps.unit,
    sharesOutstandingUnit: hpg.unitMetadata.sharesOutstanding.unit,
    totalDebtUnit: hpg.unitMetadata.totalDebt.unit,
  }, null, 2));

  // Sanity check FPT/MWG/VNM
  const fpt = await loadFinancialsRuntimeData({ ticker: "FPT", preferDb: true });
  const mwg = await loadFinancialsRuntimeData({ ticker: "MWG", preferDb: true });
  const vnm = await loadFinancialsRuntimeData({ ticker: "VNM", preferDb: true });

  console.log("\n[Sanity Check: Source Priority]");
  console.log(`FPT source: ${fpt.source.sourceLabel}`);
  console.log(`MWG source: ${mwg.source.sourceLabel}`);
  console.log(`VNM source: ${vnm.source.sourceLabel}`);

  // Risk
  const riskReadiness = buildRiskFinancialsRuntimeReadiness({
    financialsRuntimeData: hpg,
    hasStaticRiskPath: false,
    riskConsumesFinancialsRuntime: true,
  });
  console.log("\n[Risk Module Behavior]");
  console.log("totalDebt missing in Risk?", riskReadiness.inputSnapshot.totalDebt === null);
  console.log("Risk totalDebt value:", riskReadiness.inputSnapshot.totalDebt);

  // Valuation
  const valuationReadiness = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData: hpg,
    hasPersistedLocalInputBridge: false,
    valuationConsumesFinancialsRuntime: true,
  });
  console.log("\n[Valuation Module Behavior]");
  console.log("Valuation source boundary approved?", valuationReadiness.productionApproved);

  // AI Assistant Context
  const context = buildAssistantScreenContextPacket({ ticker: "HPG", activeModule: "financials", financialsRuntimeData: hpg });
  console.log("\n[AI Assistant Context]");
  console.log("Context size:", JSON.stringify(context).length);
  const jsonContext = JSON.stringify(context);
  console.log("Contains EPS 1973?", jsonContext.includes("1973"));
  console.log("Contains shares 7675465855?", jsonContext.includes("7675465855"));
  console.log("Contains debt 92174.151302217?", jsonContext.includes("92174.151302217"));
  console.log("Contains correct sourceLabel?", jsonContext.includes("annual_report_2025_pdf_reviewed_preview"));
  console.log("Contains productionApproved: false?", jsonContext.includes('"productionApproved":false') || jsonContext.includes('"productionApproved": false'));
  console.log("Contains guardrails against recommendation logic?", /buy|sell|hold/i.test(jsonContext.replace(/buy_in|shareholders/gi, "")));
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
