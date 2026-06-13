import type { FinancialStatementInput, ValuationConfidence } from "../types";
import { getMissingFields, hasPositiveNumber, isFiniteNumber } from "../utils";

export const calculateValuationConfidence = (input: FinancialStatementInput): ValuationConfidence => {
  const required = ["closePrice", "sharesOutstanding", "revenue", "netProfit", "totalEquity", "operatingCashFlow"];
  const missingCount = getMissingFields(input, required).length;
  const netProfit = isFiniteNumber(input.netProfit) ? input.netProfit : null;
  const positiveEarnings = netProfit !== null && netProfit > 0;
  const cashSupport = isFiniteNumber(input.operatingCashFlow) && (!positiveEarnings || input.operatingCashFlow >= netProfit * 0.5);
  const hasMarket = hasPositiveNumber(input.closePrice) && hasPositiveNumber(input.sharesOutstanding);

  if (missingCount >= required.length - 1 || !hasMarket) return "unknown";
  if (missingCount >= 4) return "very_low";
  if (missingCount >= 2 || !cashSupport) return "low";
  if (positiveEarnings && cashSupport) return "high";
  return "medium";
};
