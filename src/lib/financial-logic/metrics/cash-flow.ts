import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { FinancialStatementInput } from "../types";
import { buildMetricResult, getMissingFields, hasPositiveNumber, isFiniteNumber, safeDivide } from "../utils";

export const calculateOperatingCashFlowMetric = (input: FinancialStatementInput) =>
  buildMetricResult({
    key: "operatingCashFlow",
    label: "Dòng tiền kinh doanh",
    value: isFiniteNumber(input.operatingCashFlow) ? input.operatingCashFlow : null,
    unit: "billion_vnd",
    formula: "operatingCashFlow",
    inputFields: ["operatingCashFlow"],
    missingFields: getMissingFields(input, ["operatingCashFlow"]),
    level: !isFiniteNumber(input.operatingCashFlow) ? "unknown" : input.operatingCashFlow > 0 ? "neutral" : "watch",
    warning: isFiniteNumber(input.netProfit) && input.netProfit > 0 && isFiniteNumber(input.operatingCashFlow) && input.operatingCashFlow < 0 ? "Lợi nhuận dương nhưng dòng tiền kinh doanh âm, cần kiểm tra phải thu, tồn kho và khoản bất thường." : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });

export const calculateCfoToNetProfit = (input: FinancialStatementInput) => {
  const value = hasPositiveNumber(input.netProfit) && isFiniteNumber(input.operatingCashFlow) ? safeDivide(input.operatingCashFlow, input.netProfit) : null;
  return buildMetricResult({
    key: "cfoToNetProfit",
    label: "CFO / Lợi nhuận ròng",
    value,
    unit: "x",
    formula: "operatingCashFlow / netProfit",
    inputFields: ["operatingCashFlow", "netProfit"],
    missingFields: getMissingFields(input, ["operatingCashFlow", "netProfit"]),
    level: !hasPositiveNumber(input.netProfit) ? "not_applicable" : value === null ? "unknown" : value >= DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitGood ? "good" : value >= DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitWatch ? "watch" : "risk",
    warning: !hasPositiveNumber(input.netProfit)
      ? "Lợi nhuận không dương nên tỷ lệ CFO/LNST không phù hợp để diễn giải."
      : value !== null && value < DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitWatch
        ? "Lợi nhuận chưa chuyển thành tiền tương xứng, cần kiểm tra vốn lưu động và khoản bất thường."
        : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateFreeCashFlow = (input: FinancialStatementInput) => {
  const derived = isFiniteNumber(input.operatingCashFlow) && isFiniteNumber(input.capitalExpenditure) ? input.operatingCashFlow - Math.abs(input.capitalExpenditure) : null;
  const value = isFiniteNumber(input.freeCashFlow) ? input.freeCashFlow : derived;
  const usedDerived = !isFiniteNumber(input.freeCashFlow) && value !== null;
  return buildMetricResult({
    key: "freeCashFlow",
    label: "Dòng tiền tự do",
    value,
    unit: "billion_vnd",
    formula: "freeCashFlow hoặc operatingCashFlow - abs(capitalExpenditure)",
    inputFields: ["freeCashFlow", "operatingCashFlow", "capitalExpenditure"],
    missingFields: value === null ? getMissingFields(input, ["freeCashFlow", "operatingCashFlow", "capitalExpenditure"]) : [],
    level: value === null ? "unknown" : value >= 0 ? "neutral" : "watch",
    dataQuality: usedDerived ? "low_confidence" : undefined,
    warning: value !== null && value < 0 ? "FCF âm cần đọc cùng giai đoạn đầu tư; không tự động là tín hiệu xấu." : usedDerived ? "FCF được suy ra từ CFO và capex, cần kiểm tra quy ước dấu capex của nguồn dữ liệu." : null,
    moduleUsage: ["financials", "valuation", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateFcfMargin = (input: FinancialStatementInput) => {
  const fcf = calculateFreeCashFlow(input).value;
  const value = hasPositiveNumber(input.revenue) && isFiniteNumber(fcf) ? safeDivide(fcf, input.revenue) : null;
  return buildMetricResult({
    key: "fcfMargin",
    label: "Biên dòng tiền tự do",
    value,
    unit: "%",
    formula: "freeCashFlow / revenue",
    inputFields: ["freeCashFlow", "revenue"],
    missingFields: getMissingFields(input, ["revenue"]).concat(isFiniteNumber(fcf) ? [] : ["freeCashFlow"]),
    level: value === null ? "unknown" : value > 0.1 ? "good" : value >= 0 ? "neutral" : "watch",
    moduleUsage: ["financials", "valuation", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateCapexToRevenue = (input: FinancialStatementInput) => {
  const capex = isFiniteNumber(input.capitalExpenditure) ? Math.abs(input.capitalExpenditure) : null;
  const value = hasPositiveNumber(input.revenue) && isFiniteNumber(capex) ? safeDivide(capex, input.revenue) : null;
  return buildMetricResult({
    key: "capexToRevenue",
    label: "Capex / Doanh thu",
    value,
    unit: "%",
    formula: "abs(capitalExpenditure) / revenue",
    inputFields: ["capitalExpenditure", "revenue"],
    missingFields: getMissingFields(input, ["capitalExpenditure", "revenue"]),
    level: value === null ? "unknown" : "neutral",
    warning: isFiniteNumber(input.capitalExpenditure) ? "Capex được dùng theo trị tuyệt đối; cần kiểm tra quy ước dấu từ nguồn dữ liệu." : null,
    moduleUsage: ["financials", "valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateOperatingCashFlowMargin = (input: FinancialStatementInput) => {
  const value = hasPositiveNumber(input.revenue) && isFiniteNumber(input.operatingCashFlow) ? safeDivide(input.operatingCashFlow, input.revenue) : null;
  return buildMetricResult({
    key: "operatingCashFlowMargin",
    label: "Biên dòng tiền kinh doanh",
    value,
    unit: "%",
    formula: "operatingCashFlow / revenue",
    inputFields: ["operatingCashFlow", "revenue"],
    missingFields: getMissingFields(input, ["operatingCashFlow", "revenue"]),
    level: value === null ? "unknown" : value > 0.1 ? "good" : value >= 0 ? "neutral" : "watch",
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateFcfToNetProfit = (input: FinancialStatementInput) => {
  const fcf = calculateFreeCashFlow(input).value;
  const value = hasPositiveNumber(input.netProfit) && isFiniteNumber(fcf) ? safeDivide(fcf, input.netProfit) : null;
  return buildMetricResult({
    key: "fcfToNetProfit",
    label: "FCF / Lợi nhuận ròng",
    value,
    unit: "x",
    formula: "freeCashFlow / netProfit",
    inputFields: ["freeCashFlow", "netProfit"],
    missingFields: getMissingFields(input, ["netProfit"]).concat(isFiniteNumber(fcf) ? [] : ["freeCashFlow"]),
    level: !hasPositiveNumber(input.netProfit) ? "not_applicable" : value === null ? "unknown" : value >= 0.8 ? "good" : value >= 0.4 ? "watch" : "risk",
    warning: !hasPositiveNumber(input.netProfit) ? "Lợi nhuận không dương nên tỷ lệ FCF/LNST không phù hợp để diễn giải." : null,
    moduleUsage: ["financials", "valuation", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};
