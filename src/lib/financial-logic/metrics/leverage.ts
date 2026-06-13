import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { FinancialMetricResult, FinancialStatementInput } from "../types";
import { buildMetricResult, getMissingFields, hasPositiveNumber, isFinancialCompany, isFiniteNumber, resolveTotalDebt, safeDivide } from "../utils";

export const calculateDebtToEquity = (input: FinancialStatementInput): FinancialMetricResult => {
  const debt = resolveTotalDebt(input);
  const value = hasPositiveNumber(input.totalEquity) && isFiniteNumber(debt) ? safeDivide(debt, input.totalEquity) : null;
  const financial = isFinancialCompany(input.companyType);
  return buildMetricResult({
    key: "debtToEquity",
    label: "Nợ vay / Vốn chủ",
    value,
    unit: "x",
    formula: "totalDebt / totalEquity",
    inputFields: ["totalDebt", "shortTermDebt", "longTermDebt", "totalEquity"],
    missingFields: isFiniteNumber(debt) ? getMissingFields(input, ["totalEquity"]) : ["totalDebt"],
    level: financial ? "not_applicable" : !hasPositiveNumber(input.totalEquity) ? "not_applicable" : value === null ? "unknown" : value > DEFAULT_THRESHOLDS.leverage.debtToEquityRisk ? "risk" : value > DEFAULT_THRESHOLDS.leverage.debtToEquityWatch ? "watch" : "neutral",
    dataQuality: financial ? "not_applicable" : undefined,
    warning: financial
      ? "Doanh nghiệp tài chính không nên đọc D/E như doanh nghiệp sản xuất, bán lẻ hoặc dịch vụ thông thường."
      : !hasPositiveNumber(input.totalEquity)
        ? "Vốn chủ không dương nên tỷ lệ nợ/vốn chủ không còn ý nghĩa thông thường."
        : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateLiabilitiesToAssets = (input: FinancialStatementInput) => {
  const value = hasPositiveNumber(input.totalAssets) && isFiniteNumber(input.totalLiabilities) ? safeDivide(input.totalLiabilities, input.totalAssets) : null;
  return buildMetricResult({
    key: "liabilitiesToAssets",
    label: "Nợ phải trả / Tài sản",
    value,
    unit: "%",
    formula: "totalLiabilities / totalAssets",
    inputFields: ["totalLiabilities", "totalAssets"],
    missingFields: getMissingFields(input, ["totalLiabilities", "totalAssets"]),
    level: value === null ? "unknown" : value > DEFAULT_THRESHOLDS.leverage.liabilitiesToAssetsRisk ? "risk" : value > DEFAULT_THRESHOLDS.leverage.liabilitiesToAssetsWatch ? "watch" : "neutral",
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateNetDebt = (input: FinancialStatementInput) => {
  const debt = resolveTotalDebt(input);
  const value = isFiniteNumber(debt) && isFiniteNumber(input.cashAndEquivalents) ? debt - input.cashAndEquivalents : null;
  return buildMetricResult({
    key: "netDebt",
    label: "Nợ ròng",
    value,
    unit: "billion_vnd",
    formula: "totalDebt - cashAndEquivalents",
    inputFields: ["totalDebt", "cashAndEquivalents"],
    missingFields: [...(isFiniteNumber(debt) ? [] : ["totalDebt"]), ...getMissingFields(input, ["cashAndEquivalents"])],
    level: value === null ? "unknown" : value <= 0 ? "neutral" : "watch",
    moduleUsage: ["financials", "risk", "valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

const liquidityRatio = (input: FinancialStatementInput, quick: boolean): FinancialMetricResult => {
  const financial = isFinancialCompany(input.companyType);
  const numerator = quick && isFiniteNumber(input.currentAssets) && isFiniteNumber(input.inventory) ? input.currentAssets - input.inventory : input.currentAssets;
  const value = financial ? null : hasPositiveNumber(input.currentLiabilities) && isFiniteNumber(numerator) ? safeDivide(numerator, input.currentLiabilities) : null;
  const key = quick ? "quickRatio" : "currentRatio";
  return buildMetricResult({
    key,
    label: quick ? "Hệ số thanh toán nhanh" : "Hệ số thanh toán hiện hành",
    value,
    unit: "x",
    formula: quick ? "(currentAssets - inventory) / currentLiabilities" : "currentAssets / currentLiabilities",
    inputFields: quick ? ["currentAssets", "inventory", "currentLiabilities"] : ["currentAssets", "currentLiabilities"],
    missingFields: getMissingFields(input, quick ? ["currentAssets", "inventory", "currentLiabilities"] : ["currentAssets", "currentLiabilities"]),
    level: financial ? "not_applicable" : value === null ? "unknown" : value >= (quick ? DEFAULT_THRESHOLDS.liquidity.quickRatioGood : DEFAULT_THRESHOLDS.liquidity.currentRatioGood) ? "good" : value >= (quick ? DEFAULT_THRESHOLDS.liquidity.quickRatioWatch : DEFAULT_THRESHOLDS.liquidity.currentRatioWatch) ? "neutral" : "watch",
    dataQuality: financial ? "not_applicable" : undefined,
    warning: financial ? "Hệ số thanh toán ngắn hạn không phù hợp để đọc máy móc với doanh nghiệp tài chính." : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateCurrentRatio = (input: FinancialStatementInput) => liquidityRatio(input, false);
export const calculateQuickRatio = (input: FinancialStatementInput) => liquidityRatio(input, true);

export const calculateInterestCoverage = (input: FinancialStatementInput) => {
  const operating = isFiniteNumber(input.ebit) ? input.ebit : input.operatingProfit;
  const value = hasPositiveNumber(input.interestExpense) && isFiniteNumber(operating) ? safeDivide(operating, input.interestExpense) : null;
  return buildMetricResult({
    key: "interestCoverage",
    label: "Khả năng trả lãi",
    value,
    unit: "x",
    formula: "EBIT / interestExpense",
    inputFields: ["ebit", "operatingProfit", "interestExpense"],
    missingFields: getMissingFields(input, ["interestExpense"]),
    level: !hasPositiveNumber(input.interestExpense) ? "not_applicable" : value === null ? "unknown" : value >= 5 ? "good" : value >= 2 ? "neutral" : "risk",
    warning: !hasPositiveNumber(input.interestExpense) ? "Chi phí lãi vay thiếu hoặc không dương nên không diễn giải khả năng trả lãi." : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateCashToDebt = (input: FinancialStatementInput) => {
  const debt = resolveTotalDebt(input);
  const value = hasPositiveNumber(debt) && isFiniteNumber(input.cashAndEquivalents) ? safeDivide(input.cashAndEquivalents, debt) : null;
  return buildMetricResult({
    key: "cashToDebt",
    label: "Tiền mặt / Nợ vay",
    value,
    unit: "%",
    formula: "cashAndEquivalents / totalDebt",
    inputFields: ["cashAndEquivalents", "totalDebt"],
    missingFields: [...getMissingFields(input, ["cashAndEquivalents"]), ...(isFiniteNumber(debt) ? [] : ["totalDebt"])],
    level: value === null ? "unknown" : value >= 0.5 ? "good" : value >= 0.2 ? "neutral" : "watch",
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateShortTermDebtRatio = (input: FinancialStatementInput) => {
  const debt = resolveTotalDebt(input);
  const value = hasPositiveNumber(debt) && isFiniteNumber(input.shortTermDebt) ? safeDivide(input.shortTermDebt, debt) : null;
  return buildMetricResult({
    key: "shortTermDebtRatio",
    label: "Tỷ trọng nợ vay ngắn hạn",
    value,
    unit: "%",
    formula: "shortTermDebt / totalDebt",
    inputFields: ["shortTermDebt", "totalDebt"],
    missingFields: [...getMissingFields(input, ["shortTermDebt"]), ...(isFiniteNumber(debt) ? [] : ["totalDebt"])],
    level: value === null ? "unknown" : value > 0.6 ? "watch" : "neutral",
    warning: value !== null && value > 0.6 ? "Nợ ngắn hạn chiếm tỷ trọng cao, cần kiểm tra lịch đáo hạn và dòng tiền." : null,
    moduleUsage: ["financials", "risk"],
    period: input.period,
    periodType: input.periodType,
  });
};
