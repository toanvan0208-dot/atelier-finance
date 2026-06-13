import type { FinancialStatementInput, RiskScoreResult } from "../types";
import { calculateValuationReadiness } from "../valuation/valuation-readiness";
import { calculatePeRatio, calculatePbRatio, calculatePsRatio } from "../valuation/valuation-metrics";

export const calculateValuationRisk = (input: FinancialStatementInput): RiskScoreResult => {
  const readiness = calculateValuationReadiness(input);
  const metrics = [calculatePeRatio(input), calculatePbRatio(input), calculatePsRatio(input)];
  const missingFields = Array.from(new Set([...readiness.missingFields, ...metrics.flatMap((metric) => metric.missingFields)]));
  const unavailable = metrics.filter((metric) => metric.level === "not_applicable" || metric.level === "unknown").length;
  const score = readiness.status === "unknown" ? null : readiness.status === "not_ready" ? 70 : readiness.status === "partial" ? 40 + unavailable * 5 : 15;
  return {
    key: "valuationRisk",
    label: "Rủi ro đọc định giá",
    score,
    level: score === null ? "unknown" : score >= 70 ? "high" : score >= 35 ? "medium" : "low",
    dataQuality: missingFields.length > 0 ? "partial" : "sufficient",
    reasons: readiness.warnings,
    warnings: metrics.flatMap((metric) => (metric.warning ? [metric.warning] : [])),
    missingFields,
    beginnerInterpretation: "Rủi ro định giá ở đây là rủi ro đọc sai vì thiếu dữ liệu hoặc phương pháp không phù hợp, không phải kết luận giá.",
  };
};
