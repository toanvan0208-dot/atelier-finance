import type { FinancialStatementInput, ValuationSummary } from "../types";
import { calculateValuationReadiness } from "./valuation-readiness";
import {
  calculateBvps,
  calculateEarningsYield,
  calculateEnterpriseValue,
  calculateEvToEbitda,
  calculateDividendYield,
  calculateEps,
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculatePsRatio,
} from "./valuation-metrics";

export * from "./valuation-metrics";
export * from "./valuation-readiness";
export * from "./valuation-confidence";

export const buildBasicValuationSummary = (input: FinancialStatementInput): ValuationSummary => {
  const metrics = [
    calculateEps(input),
    calculateBvps(input),
    calculateMarketCap(input),
    calculateEnterpriseValue(input),
    calculatePeRatio(input),
    calculatePbRatio(input),
    calculatePsRatio(input),
    calculateEvToEbitda(input),
    calculateEarningsYield(input),
    calculateDividendYield(input),
  ];
  const readiness = calculateValuationReadiness(input);
  return {
    metrics,
    readiness,
    warnings: [...readiness.warnings, ...metrics.flatMap((metric) => (metric.warning ? [metric.warning] : []))],
    beginnerInterpretation: "Định giá sơ bộ chỉ cho biết thị trường đang trả bao nhiêu cho lợi nhuận, tài sản, doanh thu hoặc EBITDA; không tự tạo kết luận hành động.",
  };
};
