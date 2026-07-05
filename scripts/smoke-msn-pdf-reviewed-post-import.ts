import { buildAssistantScreenContextPacket } from "../src/components/layout/assistant-screen-context";
import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { buildRiskFinancialsRuntimeReadiness } from "../src/features/risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../src/features/valuation/lib/valuation-financials-runtime-readiness";

import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
async function run() {
  requirePostgresDatabaseUrl("smoke-msn-pdf-reviewed-post-import.ts");

  const runtime = await loadFinancialsRuntimeData({
    ticker: "MSN",
    preferDb: true,
    allowFallback: false,
  });
  const risk = buildRiskFinancialsRuntimeReadiness({
    financialsRuntimeData: runtime,
    hasStaticRiskPath: false,
    riskConsumesFinancialsRuntime: true,
  });
  const valuation = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData: runtime,
    hasPersistedLocalInputBridge: false,
    valuationConsumesFinancialsRuntime: true,
  });
  const assistant = buildAssistantScreenContextPacket({
    ticker: "MSN",
    activeModule: "financials",
    financialsRuntimeData: runtime,
  });

  const summary = {
    runtime: {
      sourceLabel: runtime.source.sourceLabel,
      dataMode: runtime.source.dataMode,
      productionApproved: runtime.source.productionApproved,
      fallbackUsed: runtime.source.fallbackUsed,
      eps: runtime.statementSnapshot?.eps ?? null,
      sharesOutstanding: runtime.statementSnapshot?.sharesOutstanding ?? null,
      totalDebt: runtime.statementSnapshot?.totalDebt ?? null,
      missingFields: runtime.dataQuality.missingFields,
    },
    risk: {
      totalDebt: risk.inputSnapshot.totalDebt,
      leverageRisk: risk.calculationReadiness.leverageRisk,
      productionApproved: risk.productionApproved,
    },
    valuation: {
      productionApproved: valuation.productionApproved,
      canClaimValuationDbBacked: valuation.canClaimValuationDbBacked,
      boundaryNote: valuation.boundaryNote,
    },
    checklist: {
      totalDebtMissing: runtime.dataQuality.missingFields.includes("totalDebt"),
      substituteZeroForMissing: risk.missingValuePolicy.substituteZeroForMissing,
    },
    assistant: {
      sourceLabel: assistant.dataQuality.sourceLabel,
      dataMode: assistant.dataQuality.dataMode,
      productionApproved: assistant.dataQuality.productionApproved,
      containsEps: assistant.allowedNumericValues.includes(2710),
      containsShares: assistant.allowedNumericValues.includes(1520491927),
      containsTotalDebt: assistant.allowedNumericValues.includes(64877.178),
      constraints: assistant.constraints,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (
    summary.runtime.sourceLabel !==
      "annual_report_2025_pdf_reviewed_preview" ||
    summary.runtime.eps !== 2710 ||
    summary.runtime.sharesOutstanding !== 1520491927 ||
    summary.runtime.totalDebt !== 64877.178 ||
    summary.runtime.productionApproved !== false ||
    summary.runtime.fallbackUsed !== false ||
    summary.checklist.totalDebtMissing ||
    summary.valuation.productionApproved !== false ||
    summary.valuation.canClaimValuationDbBacked !== false ||
    !summary.assistant.containsEps ||
    !summary.assistant.containsShares ||
    !summary.assistant.containsTotalDebt
  ) {
    throw new Error("MSN post-import smoke verification failed.");
  }
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
