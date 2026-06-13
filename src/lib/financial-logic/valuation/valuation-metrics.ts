import type { FinancialMetricResult, FinancialStatementInput } from "../types";
import { calculateFreeCashFlow } from "../metrics/cash-flow";
import { buildMetricResult, getMissingFields, hasPositiveNumber, isFiniteNumber, resolveTotalDebt, safeDivide } from "../utils";

export const calculateEps = (input: FinancialStatementInput): FinancialMetricResult => {
  const derived = hasPositiveNumber(input.sharesOutstanding) && isFiniteNumber(input.netProfit) ? safeDivide(input.netProfit, input.sharesOutstanding) : null;
  const value = isFiniteNumber(input.eps) ? input.eps : derived;
  return buildMetricResult({
    key: "eps",
    label: "EPS",
    value,
    unit: "vnd",
    formula: "eps hoặc netProfit / sharesOutstanding",
    inputFields: ["eps", "netProfit", "sharesOutstanding"],
    missingFields: value === null ? getMissingFields(input, ["eps", "netProfit", "sharesOutstanding"]) : [],
    level: value === null ? "unknown" : value > 0 ? "neutral" : "watch",
    dataQuality: isFiniteNumber(input.eps) ? "sufficient" : value === null ? "missing" : "low_confidence",
    warning: !isFiniteNumber(input.eps) && value !== null ? "EPS được suy ra từ lợi nhuận và số cổ phiếu; cần kiểm tra đơn vị dữ liệu đầu vào." : null,
    moduleUsage: ["valuation", "financials"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateBvps = (input: FinancialStatementInput): FinancialMetricResult => {
  const equityNotConventional = isFiniteNumber(input.totalEquity) && input.totalEquity <= 0;
  const derived = hasPositiveNumber(input.sharesOutstanding) && isFiniteNumber(input.totalEquity) ? safeDivide(input.totalEquity, input.sharesOutstanding) : null;
  const value = equityNotConventional ? null : isFiniteNumber(input.bvps) ? input.bvps : derived;
  return buildMetricResult({
    key: "bvps",
    label: "BVPS",
    value,
    unit: "vnd",
    formula: "bvps hoặc totalEquity / sharesOutstanding",
    inputFields: ["bvps", "totalEquity", "sharesOutstanding"],
    missingFields: value === null ? getMissingFields(input, ["bvps", "totalEquity", "sharesOutstanding"]) : [],
    level: equityNotConventional ? "not_applicable" : value === null ? "unknown" : value > 0 ? "neutral" : "not_applicable",
    dataQuality: equityNotConventional ? "not_applicable" : isFiniteNumber(input.bvps) ? "sufficient" : value === null ? "missing" : "low_confidence",
    warning: equityNotConventional || (value !== null && value <= 0) ? "Vốn chủ hoặc BVPS không dương nên P/B không thể diễn giải theo cách thông thường." : null,
    moduleUsage: ["valuation", "financials"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculatePeRatio = (input: FinancialStatementInput): FinancialMetricResult => {
  const eps = calculateEps(input).value;
  const value = hasPositiveNumber(input.closePrice) && hasPositiveNumber(eps) ? safeDivide(input.closePrice, eps) : null;
  return buildMetricResult({
    key: "peRatio",
    label: "P/E",
    value,
    unit: "x",
    formula: "closePrice / eps",
    inputFields: ["closePrice", "eps"],
    missingFields: getMissingFields(input, ["closePrice"]).concat(hasPositiveNumber(eps) ? [] : ["eps"]),
    level: !hasPositiveNumber(eps) ? "not_applicable" : value === null ? "unknown" : "neutral",
    dataQuality: !hasPositiveNumber(eps) ? "not_applicable" : undefined,
    warning: !hasPositiveNumber(eps) ? "EPS không dương nên P/E không phù hợp để diễn giải mức định giá." : "P/E là chỉ số so sánh, không tự tạo kết luận độc lập về mức định giá.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculatePbRatio = (input: FinancialStatementInput): FinancialMetricResult => {
  const equityNotConventional = isFiniteNumber(input.totalEquity) && input.totalEquity <= 0;
  const bvps = calculateBvps(input).value;
  const value = !equityNotConventional && hasPositiveNumber(input.closePrice) && hasPositiveNumber(bvps) ? safeDivide(input.closePrice, bvps) : null;
  return buildMetricResult({
    key: "pbRatio",
    label: "P/B",
    value,
    unit: "x",
    formula: "closePrice / bvps",
    inputFields: ["closePrice", "bvps"],
    missingFields: getMissingFields(input, ["closePrice"]).concat(hasPositiveNumber(bvps) ? [] : ["bvps"]),
    level: equityNotConventional || !hasPositiveNumber(bvps) ? "not_applicable" : value === null ? "unknown" : "neutral",
    dataQuality: equityNotConventional ? "not_applicable" : undefined,
    warning: equityNotConventional || !hasPositiveNumber(bvps) ? "BVPS hoặc vốn chủ không dương nên P/B không thể diễn giải theo cách thông thường." : "P/B cần đọc cùng ROE, chất lượng tài sản và ngành.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateMarketCap = (input: FinancialStatementInput): FinancialMetricResult => {
  const value = isFiniteNumber(input.closePrice) && isFiniteNumber(input.sharesOutstanding) ? input.closePrice * input.sharesOutstanding : null;
  return buildMetricResult({
    key: "marketCap",
    label: "Vốn hóa thị trường",
    value,
    unit: "vnd",
    formula: "closePrice * sharesOutstanding",
    inputFields: ["closePrice", "sharesOutstanding"],
    missingFields: getMissingFields(input, ["closePrice", "sharesOutstanding"]),
    moduleUsage: ["valuation", "technical"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculatePsRatio = (input: FinancialStatementInput): FinancialMetricResult => {
  const marketCap = calculateMarketCap(input).value;
  const value = hasPositiveNumber(input.revenue) && isFiniteNumber(marketCap) ? safeDivide(marketCap, input.revenue) : null;
  return buildMetricResult({
    key: "psRatio",
    label: "P/S",
    value,
    unit: "x",
    formula: "marketCap / revenue",
    inputFields: ["closePrice", "sharesOutstanding", "revenue"],
    missingFields: getMissingFields(input, ["revenue"]).concat(isFiniteNumber(marketCap) ? [] : ["marketCap"]),
    level: value === null ? "unknown" : "neutral",
    warning: "P/S bỏ qua biên lợi nhuận và dòng tiền, chỉ dùng như dữ kiện so sánh.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateEnterpriseValue = (input: FinancialStatementInput): FinancialMetricResult => {
  const marketCap = calculateMarketCap(input).value;
  const debt = resolveTotalDebt(input);
  const value = isFiniteNumber(marketCap) && isFiniteNumber(debt) && isFiniteNumber(input.cashAndEquivalents)
    ? marketCap + debt - input.cashAndEquivalents
    : null;
  return buildMetricResult({
    key: "enterpriseValue",
    label: "Enterprise Value",
    value,
    unit: "vnd",
    formula: "marketCap + totalDebt - cashAndEquivalents",
    inputFields: ["marketCap", "totalDebt", "cashAndEquivalents"],
    missingFields: [
      ...(isFiniteNumber(marketCap) ? [] : ["marketCap"]),
      ...(isFiniteNumber(debt) ? [] : ["totalDebt"]),
      ...getMissingFields(input, ["cashAndEquivalents"]),
    ],
    level: value === null ? "unknown" : "neutral",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateEvToEbitda = (input: FinancialStatementInput): FinancialMetricResult => {
  const ev = calculateEnterpriseValue(input).value;
  const value = isFiniteNumber(ev) && hasPositiveNumber(input.ebitda) ? safeDivide(ev, input.ebitda) : null;
  return buildMetricResult({
    key: "evToEbitda",
    label: "EV/EBITDA",
    value,
    unit: "x",
    formula: "enterpriseValue / ebitda",
    inputFields: ["enterpriseValue", "ebitda"],
    missingFields: getMissingFields(input, ["ebitda"]).concat(isFiniteNumber(ev) ? [] : ["enterpriseValue"]),
    level: !hasPositiveNumber(input.ebitda) ? "not_applicable" : value === null ? "unknown" : "neutral",
    warning: !hasPositiveNumber(input.ebitda) ? "EBITDA không dương nên EV/EBITDA không phù hợp để diễn giải." : "EV/EBITDA cần đọc cùng capex, nợ và chu kỳ ngành.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateEarningsYield = (input: FinancialStatementInput): FinancialMetricResult => {
  const eps = calculateEps(input).value;
  const value = hasPositiveNumber(input.closePrice) && isFiniteNumber(eps) ? safeDivide(eps, input.closePrice) : null;
  return buildMetricResult({
    key: "earningsYield",
    label: "Earnings yield",
    value,
    unit: "%",
    formula: "eps / closePrice",
    inputFields: ["eps", "closePrice"],
    missingFields: getMissingFields(input, ["closePrice"]).concat(isFiniteNumber(eps) ? [] : ["eps"]),
    level: value === null ? "unknown" : "neutral",
    warning: "Earnings yield là cách đảo góc nhìn P/E, không phải lãi suất chắc chắn.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateDividendYield = (input: FinancialStatementInput): FinancialMetricResult => {
  const value = hasPositiveNumber(input.closePrice) && isFiniteNumber(input.dividendPerShare) ? safeDivide(input.dividendPerShare, input.closePrice) : null;
  return buildMetricResult({
    key: "dividendYield",
    label: "Tỷ suất cổ tức",
    value,
    unit: "%",
    formula: "dividendPerShare / closePrice",
    inputFields: ["dividendPerShare", "closePrice"],
    missingFields: getMissingFields(input, ["dividendPerShare", "closePrice"]),
    level: value === null ? "unknown" : "neutral",
    warning: "Cổ tức quá khứ không đảm bảo dòng tiền cổ tức tương lai.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateFcfYield = (input: FinancialStatementInput): FinancialMetricResult => {
  const fcf = calculateFreeCashFlow(input).value;
  const marketCap = calculateMarketCap(input).value;
  const value = hasPositiveNumber(marketCap) && isFiniteNumber(fcf) ? safeDivide(fcf, marketCap) : null;
  return buildMetricResult({
    key: "fcfYield",
    label: "FCF yield",
    value,
    unit: "%",
    formula: "freeCashFlow / marketCap",
    inputFields: ["freeCashFlow", "marketCap"],
    missingFields: (isFiniteNumber(fcf) ? [] : ["freeCashFlow"]).concat(isFiniteNumber(marketCap) ? [] : ["marketCap"]),
    level: value === null ? "unknown" : "neutral",
    warning: "FCF yield phụ thuộc mạnh vào chu kỳ đầu tư và quy ước capex.",
    moduleUsage: ["valuation"],
    period: input.period,
    periodType: input.periodType,
  });
};
