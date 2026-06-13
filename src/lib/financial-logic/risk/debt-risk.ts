import { calculateCashToDebt, calculateDebtToEquity, calculateInterestCoverage, calculateLiabilitiesToAssets } from "../metrics/leverage";
import type { FinancialStatementInput, RiskScoreResult } from "../types";

export const calculateDebtRisk = (input: FinancialStatementInput): RiskScoreResult => {
  const metrics = [calculateDebtToEquity(input), calculateLiabilitiesToAssets(input), calculateInterestCoverage(input), calculateCashToDebt(input)];
  const riskCount = metrics.filter((metric) => metric.level === "risk" || metric.level === "danger").length;
  const watchCount = metrics.filter((metric) => metric.level === "watch").length;
  const missingFields = Array.from(new Set(metrics.flatMap((metric) => metric.missingFields)));
  const score = missingFields.length >= 4 ? null : Math.min(100, riskCount * 35 + watchCount * 15);
  return {
    key: "debtRisk",
    label: "Rủi ro nợ vay",
    score,
    level: score === null ? "unknown" : score >= 70 ? "high" : score >= 35 ? "medium" : "low",
    dataQuality: missingFields.length > 0 ? "partial" : "sufficient",
    reasons: metrics.filter((metric) => metric.level === "risk" || metric.level === "watch").map((metric) => `${metric.label}: ${metric.displayValue}`),
    warnings: metrics.flatMap((metric) => (metric.warning ? [metric.warning] : [])),
    missingFields,
    beginnerInterpretation: "Nhóm này kiểm tra nợ, khả năng trả lãi và bộ đệm tiền; kết quả chỉ là bản đồ rủi ro cần đọc thêm.",
  };
};
