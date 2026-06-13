import { calculateCfoToNetProfit } from "../metrics/cash-flow";
import { calculateNetProfitGrowth, calculateRevenueGrowth } from "../metrics/growth";
import { calculateNetMargin } from "../metrics/profitability";
import type { FinancialStatementInput, RiskScoreResult } from "../types";
import { isFiniteNumber } from "../utils";

export const calculateEarningsQualityRisk = (input: FinancialStatementInput): RiskScoreResult => {
  const cfo = calculateCfoToNetProfit(input);
  const revenueGrowth = calculateRevenueGrowth(input);
  const profitGrowth = calculateNetProfitGrowth(input);
  const netMargin = calculateNetMargin(input);
  const warnings = [cfo, revenueGrowth, profitGrowth, netMargin].flatMap((metric) => (metric.warning ? [metric.warning] : []));
  const mismatch = isFiniteNumber(input.netProfit) && input.netProfit > 0 && isFiniteNumber(input.operatingCashFlow) && input.operatingCashFlow < 0;
  const marginWeak = netMargin.value !== null && netMargin.value < 0;
  const missingFields = Array.from(new Set([cfo, revenueGrowth, profitGrowth, netMargin].flatMap((metric) => metric.missingFields)));
  const missingCoreCashFlow = missingFields.includes("operatingCashFlow") || cfo.level === "unknown";
  const missingCoreCashFlowWarning = "Thiếu dòng tiền kinh doanh nên chưa đủ dữ liệu để đánh giá chất lượng lợi nhuận.";
  const score = missingCoreCashFlow ? null : mismatch ? 70 : marginWeak || cfo.level === "risk" ? 45 : cfo.level === "watch" ? 25 : 10;
  return {
    key: "earningsQualityRisk",
    label: "Rủi ro chất lượng lợi nhuận",
    score,
    level: score === null ? "unknown" : score >= 70 ? "high" : score >= 35 ? "medium" : "low",
    dataQuality: cfo.dataQuality,
    reasons: [
      ...(missingCoreCashFlow ? ["Thiếu dòng tiền kinh doanh nên chưa thể đánh giá chất lượng lợi nhuận."] : []),
      ...(mismatch ? ["Lợi nhuận dương nhưng dòng tiền kinh doanh âm."] : []),
      ...(marginWeak ? ["Biên lợi nhuận ròng âm."] : []),
    ],
    warnings: missingCoreCashFlow ? [missingCoreCashFlowWarning, ...warnings] : warnings,
    missingFields,
    beginnerInterpretation: "Nhóm này kiểm tra lợi nhuận có đi kèm tiền và biên lợi nhuận hay không.",
  };
};
