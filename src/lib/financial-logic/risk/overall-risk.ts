import type { FinancialStatementInput, RiskLevel, RiskScoreResult } from "../types";
import { calculateCashFlowRisk } from "./cash-flow-risk";
import { calculateDataQualityRisk } from "./data-quality-risk";
import { calculateDebtRisk } from "./debt-risk";
import { calculateEarningsQualityRisk } from "./earnings-quality-risk";
import { calculateLiquidityRisk } from "./liquidity-risk";
import { calculateValuationRisk } from "./valuation-risk";

export const calculateOverallRiskScore = (input: FinancialStatementInput): RiskScoreResult => {
  const components = [
    calculateDebtRisk(input),
    calculateEarningsQualityRisk(input),
    calculateCashFlowRisk(input),
    calculateValuationRisk(input),
    calculateLiquidityRisk(input),
    calculateDataQualityRisk(input),
  ];
  const known = components.filter((component) => component.score !== null);
  const dataQuality = calculateDataQualityRisk(input);
  const rawScore = known.length < 3 || dataQuality.level === "unknown" ? null : Math.round(known.reduce((sum, item) => sum + (item.score ?? 0), 0) / known.length);
  const score =
    rawScore === null
      ? null
      : dataQuality.level === "high"
        ? Math.max(rawScore, 60)
        : dataQuality.level === "medium"
          ? Math.max(rawScore, 35)
          : rawScore;
  const level: RiskLevel = score === null ? "unknown" : score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return {
    key: "overallRisk",
    label: "Rủi ro tổng hợp",
    score,
    level,
    dataQuality: dataQuality.dataQuality === "sufficient" ? "sufficient" : "partial",
    reasons: components.flatMap((component) => component.reasons).slice(0, 8),
    warnings: Array.from(new Set(components.flatMap((component) => component.warnings))).slice(0, 10),
    missingFields: Array.from(new Set(components.flatMap((component) => component.missingFields))),
    beginnerInterpretation: "Điểm rủi ro tổng hợp dùng để biết cần kiểm tra phần nào trước; không phải chỉ dẫn hành động.",
  };
};
