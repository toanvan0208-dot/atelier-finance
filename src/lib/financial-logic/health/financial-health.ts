import { assessDataQuality } from "../data-quality/assess-data-quality";
import { calculateCfoToNetProfit } from "../metrics/cash-flow";
import { calculateDebtToEquity, calculateLiabilitiesToAssets } from "../metrics/leverage";
import { calculateNetMargin, calculateRoa, calculateRoe } from "../metrics/profitability";
import { calculateOverallRiskScore } from "../risk/overall-risk";
import type { FinancialHealthStatus, FinancialHealthSummary, FinancialStatementInput } from "../types";

export const calculateFinancialHealth = (input: FinancialStatementInput): FinancialHealthSummary => {
  const metrics = [
    calculateNetMargin(input),
    calculateRoa(input),
    calculateRoe(input),
    calculateDebtToEquity(input),
    calculateLiabilitiesToAssets(input),
    calculateCfoToNetProfit(input),
  ];
  const dataQuality = assessDataQuality(input);
  const risk = calculateOverallRiskScore(input);
  const strengths = metrics.filter((metric) => metric.level === "good").map((metric) => `${metric.label}: ${metric.displayValue}`);
  const watchPoints = metrics.filter((metric) => metric.level === "watch").map((metric) => `${metric.label}: ${metric.displayValue}`);
  const riskPoints = metrics.filter((metric) => metric.level === "risk" || metric.level === "danger").map((metric) => `${metric.label}: ${metric.displayValue}`);
  const missingFields = Array.from(new Set(metrics.flatMap((metric) => metric.missingFields).concat(dataQuality.missingFields)));
  const baseScore = risk.score === null ? null : Math.max(0, 100 - risk.score);
  const status: FinancialHealthStatus =
    baseScore === null || dataQuality.status === "missing"
      ? "unknown"
      : baseScore >= 75 && riskPoints.length === 0
        ? "healthy"
        : baseScore >= 55
          ? "acceptable"
          : baseScore >= 35
            ? "watch"
            : "risk";

  return {
    status,
    score: baseScore,
    strengths,
    watchPoints,
    riskPoints,
    missingFields,
    dataQuality: dataQuality.status === "good" ? "sufficient" : dataQuality.status === "missing" ? "missing" : "partial",
    beginnerInterpretation:
      status === "unknown"
        ? "Chưa đủ dữ liệu để tóm tắt sức khỏe tài chính."
        : "Sức khỏe tài chính là tóm tắt để định hướng phần cần đọc kỹ hơn, không thay thế phân tích từng chỉ số.",
  };
};
