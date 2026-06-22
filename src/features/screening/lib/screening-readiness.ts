export type ScreeningReadinessInputs = {
  eps: number | null;
  sharesOutstanding: number | null;
  equity: number | null;
  totalDebt: number | null;
  hasRiskReadiness: boolean;
  hasSourceStatusAsOf: boolean;
};

export type ScreeningReadinessBooleans = {
  canCalculatePE: boolean;
  canCalculatePB: boolean;
  canCalculateShareMetrics: boolean;
  canAssessDebt: boolean;
  canAssessRisk: boolean;
  warnings: string[];
};

export function buildScreeningReadinessBooleans(
  inputs: ScreeningReadinessInputs
): ScreeningReadinessBooleans {
  const canUseEps = inputs.eps !== null && inputs.eps > 0;
  const canUseShares = inputs.sharesOutstanding !== null && inputs.sharesOutstanding > 0;
  const canUseEquity = inputs.equity !== null && inputs.equity > 0;
  const canUseDebt = inputs.totalDebt !== null;
  const warnings: string[] = [];

  if (!canUseEps) warnings.push("EPS missing or non-positive: P/E is locked.");
  if (!canUseShares) warnings.push("sharesOutstanding missing or non-positive: share metrics are locked.");
  if (!canUseEquity) warnings.push("equity missing or non-positive: P/B is locked.");
  if (!canUseDebt) warnings.push("totalDebt missing: debt readiness is locked.");
  if (!inputs.hasRiskReadiness) warnings.push("Risk readiness missing: risk review is locked.");
  if (!inputs.hasSourceStatusAsOf) warnings.push("source/status/asOf metadata missing: candidate needs warning.");

  return {
    canCalculatePE: canUseEps,
    canCalculatePB: canUseEquity && canUseShares,
    canCalculateShareMetrics: canUseShares,
    canAssessDebt: canUseDebt,
    canAssessRisk: inputs.hasRiskReadiness && canUseDebt,
    warnings,
  };
}
