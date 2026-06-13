import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { FinancialMetricResult, FinancialStatementInput, MetricLevel } from "../types";
import { average, buildMetricResult, getMissingFields, hasPositiveNumber, isFiniteNumber, resolveTotalDebt, safeDivide } from "../utils";

const marginLevel = (value: number | null): MetricLevel => {
  if (value === null) return "unknown";
  if (value >= DEFAULT_THRESHOLDS.margin.good) return "good";
  if (value >= DEFAULT_THRESHOLDS.margin.watch) return "neutral";
  if (value >= DEFAULT_THRESHOLDS.margin.risk) return "watch";
  return "risk";
};

const margin = (input: FinancialStatementInput, key: string, label: string, numerator: keyof FinancialStatementInput) => {
  const value = hasPositiveNumber(input.revenue) && isFiniteNumber(input[numerator]) ? safeDivide(input[numerator] as number, input.revenue) : null;
  const fields = [numerator, "revenue"] as string[];
  return buildMetricResult({
    key,
    label,
    value,
    unit: "%",
    formula: `${String(numerator)} / revenue`,
    inputFields: fields,
    missingFields: getMissingFields(input, fields),
    level: marginLevel(value),
    warning: !hasPositiveNumber(input.revenue) ? "Doanh thu không dương hoặc thiếu nên không thể đọc biên lợi nhuận." : null,
    moduleUsage: ["financials", "valuation", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateGrossMargin = (input: FinancialStatementInput) => margin(input, "grossMargin", "Biên lợi nhuận gộp", "grossProfit");
export const calculateOperatingMargin = (input: FinancialStatementInput) => margin(input, "operatingMargin", "Biên lợi nhuận hoạt động", "operatingProfit");
export const calculateNetMargin = (input: FinancialStatementInput) => margin(input, "netMargin", "Biên lợi nhuận ròng", "netProfit");
export const calculateEbitdaMargin = (input: FinancialStatementInput) => margin(input, "ebitdaMargin", "Biên EBITDA", "ebitda");

export const calculateRoa = (input: FinancialStatementInput): FinancialMetricResult => {
  const avgAssets = average(input.totalAssets, input.previousTotalAssets);
  const value = hasPositiveNumber(avgAssets) && isFiniteNumber(input.netProfit) ? safeDivide(input.netProfit, avgAssets) : null;
  const lowConfidence = isFiniteNumber(input.totalAssets) && !isFiniteNumber(input.previousTotalAssets);
  return buildMetricResult({
    key: "roa",
    label: "ROA",
    value,
    unit: "%",
    formula: "netProfit / average(totalAssets)",
    inputFields: ["netProfit", "totalAssets", "previousTotalAssets"],
    missingFields: getMissingFields(input, ["netProfit", "totalAssets"]),
    level: value === null ? "unknown" : value >= DEFAULT_THRESHOLDS.roa.good ? "good" : value >= DEFAULT_THRESHOLDS.roa.watch ? "neutral" : value >= 0 ? "watch" : "risk",
    dataQuality: lowConfidence ? "low_confidence" : undefined,
    warning: lowConfidence ? "Thiếu tài sản kỳ trước nên ROA dùng tài sản cuối kỳ, độ tin cậy thấp hơn." : null,
    moduleUsage: ["financials", "valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateRoe = (input: FinancialStatementInput): FinancialMetricResult => {
  const avgEquity = average(input.totalEquity, input.previousTotalEquity);
  const value = hasPositiveNumber(avgEquity) && isFiniteNumber(input.netProfit) ? safeDivide(input.netProfit, avgEquity) : null;
  const debt = resolveTotalDebt(input);
  const debtToEquity = hasPositiveNumber(input.totalEquity) && isFiniteNumber(debt) ? debt / input.totalEquity : null;
  const weakCash = isFiniteNumber(input.operatingCashFlow) && isFiniteNumber(input.netProfit) && input.netProfit > 0 && input.operatingCashFlow < input.netProfit * 0.5;
  const highLeverage = debtToEquity !== null && debtToEquity > DEFAULT_THRESHOLDS.leverage.debtToEquityWatch;
  return buildMetricResult({
    key: "roe",
    label: "ROE",
    value,
    unit: "%",
    formula: "netProfit / average(totalEquity)",
    inputFields: ["netProfit", "totalEquity", "previousTotalEquity"],
    missingFields: getMissingFields(input, ["netProfit", "totalEquity"]),
    level: !hasPositiveNumber(avgEquity) ? "not_applicable" : value === null ? "unknown" : value >= DEFAULT_THRESHOLDS.roe.good ? "good" : value >= DEFAULT_THRESHOLDS.roe.watch ? "neutral" : value >= 0 ? "watch" : "risk",
    dataQuality: isFiniteNumber(input.totalEquity) && !isFiniteNumber(input.previousTotalEquity) ? "low_confidence" : undefined,
    warning: !hasPositiveNumber(avgEquity)
      ? "Vốn chủ không dương hoặc thiếu nên ROE không thể diễn giải theo cách thông thường."
      : highLeverage || weakCash
        ? "ROE cần đọc cùng nợ vay và dòng tiền; ROE cao có thể đến từ đòn bẩy hoặc lợi nhuận chưa chuyển thành tiền."
        : null,
    moduleUsage: ["financials", "valuation", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};
