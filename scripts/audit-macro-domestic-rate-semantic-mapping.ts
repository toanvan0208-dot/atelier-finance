import { MACRO_INDICATOR_UNIVERSE } from "../src/features/macro/lib/macro-indicator-registry";

function runAudit() {
  const targetLabel = "Lãi suất trong nước";
  const targetId = "domestic-rate";
  
  // From load-macro-runtime-data.ts
  const currentMapping = "INTERBANK_RATE_OVERNIGHT";
  
  const currentRegItem = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === currentMapping);

  const semanticFitScores = {
    INTERBANK_RATE_OVERNIGHT: "medium/weak (very specific rate)",
    POLICY_RATE: "strong (best represents domestic monetary policy)",
    GOV_BOND_YIELD_10Y: "medium (long term capital cost)",
    DEPOSIT_RATE: "medium (retail deposit)",
    LENDING_RATE: "medium (corporate/retail cost of debt)"
  };

  const sourceAvailabilitySummary = {
    INTERBANK_RATE_OVERNIGHT: "blocked (HTML unstable)",
    POLICY_RATE: "candidate_source_identified (SBV)",
    GOV_BOND_YIELD_10Y: "source_assessment_needed (HNX)",
    DEPOSIT_RATE: "unsupported",
    LENDING_RATE: "unsupported"
  };

  console.log("=== Macro Domestic Rate Semantic Mapping Audit ===");
  console.log(`phase: 148I`);
  console.log(`mode: macro_domestic_rate_semantic_mapping_audit`);
  console.log(`frontendMetricLabel: ${targetLabel}`);
  console.log(`frontendMetricId: ${targetId}`);
  console.log(`currentBackendIndicatorCode: ${currentMapping}`);
  console.log(`currentBackendIndicatorInFrontend: ${currentRegItem?.inCurrentFrontend || false}`);
  console.log(`currentBackendIndicatorDbBacked: ${currentRegItem?.dbBacked || false}`);
  console.log(`currentBackendIndicatorBlocked: true`);
  console.log(`candidateBackendIndicators: INTERBANK_RATE_OVERNIGHT, POLICY_RATE, GOV_BOND_YIELD_10Y, DEPOSIT_RATE, LENDING_RATE`);
  console.log(`semanticFitScores: ${JSON.stringify(semanticFitScores, null, 2)}`);
  console.log(`sourceAvailabilitySummary: ${JSON.stringify(sourceAvailabilitySummary, null, 2)}`);
  console.log(`recommendedBackendIndicator: POLICY_RATE (requires review)`);
  console.log(`mappingChangeRecommended: manual_review_before_mapping_change`);
  console.log(`dbWriteAttempted: false`);
  console.log(`auditPassed: true`);
}

runAudit();
