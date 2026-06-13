import type { FinancialStatementInput, ValuationReadinessResult, ValuationReadinessStatus } from "../types";
import { getMissingFields, hasPositiveNumber, isFiniteNumber } from "../utils";
import { calculateValuationConfidence } from "./valuation-confidence";

export const calculateValuationReadiness = (input: FinancialStatementInput): ValuationReadinessResult => {
  const coreFields = ["closePrice", "sharesOutstanding", "revenue", "netProfit", "totalEquity", "operatingCashFlow"];
  const missingFields = getMissingFields(input, coreFields);
  const usableMethods: string[] = [];
  if (hasPositiveNumber(input.closePrice) && (hasPositiveNumber(input.eps) || (hasPositiveNumber(input.sharesOutstanding) && isFiniteNumber(input.netProfit) && input.netProfit > 0))) usableMethods.push("P/E");
  if (hasPositiveNumber(input.closePrice) && (hasPositiveNumber(input.bvps) || (hasPositiveNumber(input.sharesOutstanding) && hasPositiveNumber(input.totalEquity)))) usableMethods.push("P/B");
  if (hasPositiveNumber(input.revenue) && hasPositiveNumber(input.sharesOutstanding) && hasPositiveNumber(input.closePrice)) usableMethods.push("P/S");
  if (
    hasPositiveNumber(input.closePrice) &&
    hasPositiveNumber(input.sharesOutstanding) &&
    hasPositiveNumber(input.ebitda) &&
    (hasPositiveNumber(input.totalDebt) || (isFiniteNumber(input.shortTermDebt) && isFiniteNumber(input.longTermDebt))) &&
    isFiniteNumber(input.cashAndEquivalents)
  ) usableMethods.push("EV/EBITDA");

  const status: ValuationReadinessStatus =
    usableMethods.length >= 3 && missingFields.length <= 1 ? "ready" : usableMethods.length > 0 ? "partial" : missingFields.length === coreFields.length ? "unknown" : "not_ready";

  const warnings = [
    ...(missingFields.length > 0 ? [`Thiếu dữ liệu cốt lõi: ${missingFields.join(", ")}.`] : []),
    ...(usableMethods.length === 0 ? ["Chưa có phương pháp định giá cơ bản nào đủ dữ liệu."] : []),
  ];

  return {
    status,
    confidence: calculateValuationConfidence(input),
    missingFields,
    usableMethods,
    warnings,
    beginnerInterpretation:
      status === "ready"
        ? "Dữ liệu đủ để đọc định giá sơ bộ với nhiều góc nhìn."
        : status === "partial"
          ? "Có thể đọc một phần định giá nhưng phải ghi rõ dữ liệu thiếu và giới hạn phương pháp."
          : "Chưa đủ dữ liệu để đọc định giá có ý nghĩa.",
  };
};
