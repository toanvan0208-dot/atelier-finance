import type { FinancialStatementInput } from "../types";
import { buildMetricResult, getMissingFields, hasPositiveNumber, isFiniteNumber, safeDivide } from "../utils";

const growthGap = (
  input: FinancialStatementInput,
  config: { key: string; label: string; current: keyof FinancialStatementInput; previous: keyof FinancialStatementInput }
) => {
  const itemRatio = isFiniteNumber(input[config.current]) && hasPositiveNumber(input[config.previous])
    ? safeDivide(input[config.current] as number, input[config.previous] as number)
    : null;
  const revenueRatio = isFiniteNumber(input.revenue) && hasPositiveNumber(input.previousRevenue)
    ? safeDivide(input.revenue, input.previousRevenue)
    : null;
  const itemGrowth = itemRatio === null ? null : itemRatio - 1;
  const revenueGrowth = revenueRatio === null ? null : revenueRatio - 1;
  const value = itemGrowth !== null && revenueGrowth !== null ? itemGrowth - revenueGrowth : null;
  return buildMetricResult({
    key: config.key,
    label: config.label,
    value,
    unit: "%",
    formula: "itemGrowth - revenueGrowth",
    inputFields: [String(config.current), String(config.previous), "revenue", "previousRevenue"],
    missingFields: getMissingFields(input, [String(config.current), String(config.previous), "revenue", "previousRevenue"]),
    level: value === null ? "unknown" : value > 0.2 ? "watch" : "neutral",
    warning: value !== null && value > 0.2 ? "Khoản mục tăng nhanh hơn doanh thu; đây là tín hiệu cần kiểm tra, không phải kết luận gian lận." : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateReceivablesGrowthVsRevenueGrowth = (input: FinancialStatementInput) =>
  growthGap(input, { key: "receivablesGrowthVsRevenueGrowth", label: "Tăng phải thu so với tăng doanh thu", current: "accountsReceivable", previous: "previousAccountsReceivable" });

export const calculateInventoryGrowthVsRevenueGrowth = (input: FinancialStatementInput) =>
  growthGap(input, { key: "inventoryGrowthVsRevenueGrowth", label: "Tăng tồn kho so với tăng doanh thu", current: "inventory", previous: "previousInventory" });
