import { evaluateMacroObservationFreshness } from "../src/features/macro/lib/macro-stale-policy";

function runSmoke() {
  console.log("=== Macro Stale Policy Smoke ===");
  
  const daily = evaluateMacroObservationFreshness({ expectedFrequency: "daily", observationDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() });
  const monthly = evaluateMacroObservationFreshness({ expectedFrequency: "monthly", observationDate: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString() });
  const quarterly = evaluateMacroObservationFreshness({ expectedFrequency: "quarterly", observationDate: new Date(Date.now() - 151 * 24 * 60 * 60 * 1000).toISOString() });
  const annual = evaluateMacroObservationFreshness({ expectedFrequency: "annual", observationDate: new Date(Date.now() - 451 * 24 * 60 * 60 * 1000).toISOString() });
  const eventBased = evaluateMacroObservationFreshness({ expectedFrequency: "event_based", observationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() });
  const unknown = evaluateMacroObservationFreshness({ expectedFrequency: "unknown", observationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() });
  
  const cpiFreshness = evaluateMacroObservationFreshness({ expectedFrequency: "annual", observationDate: "2024-01-01" });
  const gdpFreshness = evaluateMacroObservationFreshness({ expectedFrequency: "annual", observationDate: "2024-12-31" });
  
  const dailyPolicyDefined = daily.maxAgeDays === 5;
  const monthlyPolicyDefined = monthly.maxAgeDays === 60;
  const quarterlyPolicyDefined = quarterly.maxAgeDays === 150;
  const annualPolicyDefined = annual.maxAgeDays === 450;
  const eventBasedPolicyDefined = eventBased.staleStatus === "unknown";
  const unknownPolicyDefined = unknown.staleStatus === "unknown";

  const staleStatusValuesValid = 
    daily.staleStatus === "stale" &&
    monthly.staleStatus === "stale" &&
    quarterly.staleStatus === "stale" &&
    annual.staleStatus === "stale" &&
    eventBased.staleStatus === "unknown" &&
    unknown.staleStatus === "unknown";

  console.log(`phase: 148B`);
  console.log(`mode: macro_stale_policy_smoke`);
  console.log(`dailyPolicyDefined: ${dailyPolicyDefined}`);
  console.log(`monthlyPolicyDefined: ${monthlyPolicyDefined}`);
  console.log(`quarterlyPolicyDefined: ${quarterlyPolicyDefined}`);
  console.log(`annualPolicyDefined: ${annualPolicyDefined}`);
  console.log(`eventBasedPolicyDefined: ${eventBasedPolicyDefined}`);
  console.log(`unknownPolicyDefined: ${unknownPolicyDefined}`);
  console.log(`cpiFreshnessEvaluated: ${cpiFreshness.staleStatus}`);
  console.log(`gdpFreshnessEvaluated: ${gdpFreshness.staleStatus}`);
  console.log(`staleStatusValuesValid: ${staleStatusValuesValid}`);
  console.log(`dbWriteAttempted: false`);
  console.log(`smokePassed: ${staleStatusValuesValid}`);
}

runSmoke();
