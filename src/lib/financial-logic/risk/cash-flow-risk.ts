import { calculateFcfMargin, calculateFreeCashFlow, calculateOperatingCashFlowMargin } from "../metrics/cash-flow";
import type { FinancialStatementInput, RiskScoreResult } from "../types";

export const calculateCashFlowRisk = (input: FinancialStatementInput): RiskScoreResult => {
  const metrics = [calculateFreeCashFlow(input), calculateFcfMargin(input), calculateOperatingCashFlowMargin(input)];
  const weak = metrics.filter((metric) => metric.level === "watch" || metric.level === "risk");
  const missingFields = Array.from(new Set(metrics.flatMap((metric) => metric.missingFields)));
  const score = missingFields.length >= 4 ? null : Math.min(100, weak.length * 25);
  return {
    key: "cashFlowRisk",
    label: "Rủi ro dòng tiền",
    score,
    level: score === null ? "unknown" : score >= 60 ? "high" : score >= 25 ? "medium" : "low",
    dataQuality: missingFields.length > 0 ? "partial" : "sufficient",
    reasons: weak.map((metric) => `${metric.label}: ${metric.displayValue}`),
    warnings: metrics.flatMap((metric) => (metric.warning ? [metric.warning] : [])),
    missingFields,
    beginnerInterpretation: "Dòng tiền yếu cần được hiểu theo mùa vụ, vốn lưu động và giai đoạn đầu tư.",
  };
};
