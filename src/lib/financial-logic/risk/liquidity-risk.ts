import { calculateLiquidityStatus, calculatePriceChangePct, calculateTradingValue } from "../metrics/market";
import type { FinancialStatementInput, RiskScoreResult } from "../types";

export const calculateLiquidityRisk = (input: FinancialStatementInput): RiskScoreResult => {
  const metrics = [calculateLiquidityStatus(input), calculateTradingValue(input), calculatePriceChangePct(input)];
  const weak = metrics.filter((metric) => metric.level === "watch" || metric.level === "risk");
  const missingFields = Array.from(new Set(metrics.flatMap((metric) => metric.missingFields)));
  const score = missingFields.length >= 3 ? null : Math.min(100, weak.length * 25);
  return {
    key: "liquidityRisk",
    label: "Rủi ro thanh khoản thị trường",
    score,
    level: score === null ? "unknown" : score >= 50 ? "medium" : score >= 25 ? "medium" : "low",
    dataQuality: missingFields.length > 0 ? "partial" : "sufficient",
    reasons: weak.map((metric) => `${metric.label}: ${metric.displayValue}`),
    warnings: metrics.flatMap((metric) => (metric.warning ? [metric.warning] : [])),
    missingFields,
    beginnerInterpretation: "Thanh khoản giúp hiểu rủi ro thực thi trong mô phỏng, không nói doanh nghiệp tốt hay xấu.",
  };
};
