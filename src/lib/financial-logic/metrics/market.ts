import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { FinancialStatementInput } from "../types";
import { buildMetricResult, getMissingFields, hasPositiveNumber, isFiniteNumber, safeDivide } from "../utils";

export const calculatePriceChangePct = (input: FinancialStatementInput) => {
  const ratio = hasPositiveNumber(input.previousClosePrice) && isFiniteNumber(input.closePrice) ? safeDivide(input.closePrice, input.previousClosePrice) : null;
  const value = ratio === null ? null : ratio - 1;
  return buildMetricResult({
    key: "priceChangePct",
    label: "Thay đổi giá",
    value,
    unit: "%",
    formula: "closePrice / previousClosePrice - 1",
    inputFields: ["closePrice", "previousClosePrice"],
    missingFields: getMissingFields(input, ["closePrice", "previousClosePrice"]),
    level: value === null ? "unknown" : Math.abs(value) > 0.07 ? "watch" : "neutral",
    warning: value !== null && Math.abs(value) > 0.07 ? "Giá biến động mạnh chỉ là dữ kiện thị trường, không phải tín hiệu hành động độc lập." : null,
    moduleUsage: ["technical", "risk", "simulation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateTradingValue = (input: FinancialStatementInput) => {
  const value = isFiniteNumber(input.closePrice) && isFiniteNumber(input.volume) ? input.closePrice * input.volume : null;
  return buildMetricResult({
    key: "tradingValue",
    label: "Giá trị giao dịch",
    value,
    unit: "vnd",
    formula: "closePrice * volume",
    inputFields: ["closePrice", "volume"],
    missingFields: getMissingFields(input, ["closePrice", "volume"]),
    level: value === null ? "unknown" : value < DEFAULT_THRESHOLDS.market.lowTradingValue ? "watch" : "neutral",
    warning: value !== null && value < DEFAULT_THRESHOLDS.market.lowTradingValue ? "Thanh khoản thấp có thể làm giả định giao dịch khó thực hiện trong mô phỏng." : null,
    moduleUsage: ["technical", "risk", "simulation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateAvgTradingValue20d = (input: FinancialStatementInput) => {
  const value = isFiniteNumber(input.avgTradingValue20d)
    ? input.avgTradingValue20d
    : isFiniteNumber(input.closePrice) && isFiniteNumber(input.avgVolume20d)
      ? input.closePrice * input.avgVolume20d
      : null;
  return buildMetricResult({
    key: "avgTradingValue20d",
    label: "Giá trị giao dịch bình quân 20 phiên",
    value,
    unit: "vnd",
    formula: "avgTradingValue20d hoặc closePrice * avgVolume20d",
    inputFields: ["avgTradingValue20d", "closePrice", "avgVolume20d"],
    missingFields: value === null ? getMissingFields(input, ["avgTradingValue20d", "closePrice", "avgVolume20d"]) : [],
    level: value === null ? "unknown" : value < DEFAULT_THRESHOLDS.market.lowTradingValue ? "watch" : value < DEFAULT_THRESHOLDS.market.mediumTradingValue ? "neutral" : "good",
    dataQuality: isFiniteNumber(input.avgTradingValue20d) ? "sufficient" : value === null ? "missing" : "low_confidence",
    moduleUsage: ["technical", "risk", "simulation"],
    period: input.period,
    periodType: input.periodType,
  });
};

export const calculateLiquidityStatus = (input: FinancialStatementInput) => {
  const avgValue = calculateAvgTradingValue20d(input).value;
  const status = avgValue === null ? null : avgValue < DEFAULT_THRESHOLDS.market.lowTradingValue ? 0 : avgValue < DEFAULT_THRESHOLDS.market.mediumTradingValue ? 1 : 2;
  return buildMetricResult({
    key: "liquidityStatus",
    label: "Trạng thái thanh khoản",
    value: status,
    unit: "none",
    formula: "bucket(avgTradingValue20d)",
    inputFields: ["avgTradingValue20d"],
    missingFields: avgValue === null ? ["avgTradingValue20d"] : [],
    level: status === null ? "unknown" : status === 0 ? "watch" : status === 1 ? "neutral" : "good",
    warning: status === 0 ? "Thanh khoản thấp là rủi ro thực thi và mô phỏng, không phải kết luận về chất lượng doanh nghiệp." : null,
    beginnerInterpretation: status === null ? "Chưa đủ dữ liệu thanh khoản." : status === 0 ? "Thanh khoản thấp, cần thận trọng với giả định khớp lệnh." : status === 1 ? "Thanh khoản trung bình, cần xem quy mô giao dịch giả định." : "Thanh khoản tương đối tốt về mặt thực thi.",
    moduleUsage: ["technical", "risk", "simulation"],
    period: input.period,
    periodType: input.periodType,
  });
};
