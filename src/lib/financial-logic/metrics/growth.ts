import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { FinancialMetricResult, FinancialStatementInput, MetricLevel } from "../types";
import { buildMetricResult, getMissingFields, hasPositiveNumber, isFiniteNumber, safeDivide } from "../utils";

const growthLevel = (value: number | null): MetricLevel => {
  if (value === null) return "unknown";
  if (value >= DEFAULT_THRESHOLDS.growth.strong) return "good";
  if (value >= DEFAULT_THRESHOLDS.growth.moderate) return "neutral";
  if (value >= DEFAULT_THRESHOLDS.growth.danger) return "watch";
  return "risk";
};

const calculateGrowth = (
  input: FinancialStatementInput,
  config: { key: string; label: string; current: keyof FinancialStatementInput; previous: keyof FinancialStatementInput; moduleUsage?: string[] }
): FinancialMetricResult => {
  const current = input[config.current];
  const previous = input[config.previous];
  const inputFields = [config.current, config.previous] as string[];
  const missingFields = getMissingFields(input, inputFields);
  const ratio = isFiniteNumber(current) && hasPositiveNumber(previous) ? safeDivide(current, previous) : null;
  const value = ratio === null ? null : ratio - 1;
  const previousInvalid = isFiniteNumber(previous) && previous <= 0;
  let level = growthLevel(value);
  let warning = previousInvalid ? "Kỳ gốc nhỏ hơn hoặc bằng 0 nên không thể diễn giải tăng trưởng theo công thức thông thường." : null;

  if (config.key === "revenueGrowth" && value !== null && value > 0 && isFiniteNumber(input.netProfit) && isFiniteNumber(input.previousNetProfit) && input.netProfit < input.previousNetProfit) {
    level = value >= DEFAULT_THRESHOLDS.growth.strong ? "watch" : "neutral";
    warning = "Doanh thu tăng nhưng lợi nhuận giảm, cần kiểm tra biên lợi nhuận, chi phí và dòng tiền.";
  }

  if (config.key === "netProfitGrowth" && previousInvalid) {
    warning = "Lợi nhuận kỳ trước không dương nên không nên đọc tốc độ tăng trưởng ròng theo cách thông thường.";
  }

  return buildMetricResult({
    key: config.key,
    label: config.label,
    value,
    unit: "%",
    formula: "current / previous - 1",
    inputFields,
    missingFields,
    level,
    warning,
    moduleUsage: config.moduleUsage ?? ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateRevenueGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "revenueGrowth", label: "Tăng trưởng doanh thu", current: "revenue", previous: "previousRevenue", moduleUsage: ["financials", "valuation", "risk"] });
export const calculateGrossProfitGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "grossProfitGrowth", label: "Tăng trưởng lợi nhuận gộp", current: "grossProfit", previous: "previousGrossProfit" });
export const calculateOperatingProfitGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "operatingProfitGrowth", label: "Tăng trưởng lợi nhuận hoạt động", current: "operatingProfit", previous: "previousOperatingProfit" });
export const calculateNetProfitGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "netProfitGrowth", label: "Tăng trưởng lợi nhuận sau thuế", current: "netProfit", previous: "previousNetProfit", moduleUsage: ["financials", "valuation", "risk"] });
export const calculateAssetGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "assetGrowth", label: "Tăng trưởng tài sản", current: "totalAssets", previous: "previousTotalAssets" });
export const calculateEquityGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "equityGrowth", label: "Tăng trưởng vốn chủ", current: "totalEquity", previous: "previousTotalEquity" });
export const calculateOperatingCashFlowGrowth = (input: FinancialStatementInput) =>
  calculateGrowth(input, { key: "operatingCashFlowGrowth", label: "Tăng trưởng dòng tiền kinh doanh", current: "operatingCashFlow", previous: "previousOperatingCashFlow", moduleUsage: ["financials", "risk"] });
