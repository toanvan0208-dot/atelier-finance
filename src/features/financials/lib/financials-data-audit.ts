import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

export const financialsAuditFieldKeys = [
  "revenue",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "equity",
  "totalDebt",
  "eps",
  "sharesOutstanding",
] as const;

export type FinancialsAuditFieldStatus = "available" | "missing" | "insufficient";

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const positiveFieldStatus = (
  value: number | null | undefined,
): FinancialsAuditFieldStatus => {
  if (!isFiniteNumber(value)) return "missing";
  return value > 0 ? "available" : "insufficient";
};

export const normalizeFinancialsTicker = (
  ticker: string | null | undefined,
): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
};

export const financialsTickerMatches = (
  expectedTicker: string | null | undefined,
  actualTicker: string | null | undefined,
): boolean => {
  const expected = normalizeFinancialsTicker(expectedTicker);
  const actual = normalizeFinancialsTicker(actualTicker);
  return Boolean(expected && actual && expected === actual);
};

export const auditFinancialsStatementSnapshot = (
  snapshot: FinancialsStatementSnapshot | null,
) => {
  const eps = positiveFieldStatus(snapshot?.eps);
  const sharesOutstanding = positiveFieldStatus(snapshot?.sharesOutstanding);
  const equity = positiveFieldStatus(snapshot?.totalEquity);
  const totalDebt: FinancialsAuditFieldStatus = isFiniteNumber(snapshot?.totalDebt)
    ? "available"
    : "missing";

  return {
    eps,
    sharesOutstanding,
    equity,
    totalDebt,
    canInterpretPe: eps === "available",
    canUseShareMetrics: sharesOutstanding === "available",
    canInterpretEquityMetrics: equity === "available",
    canAssessDebt: totalDebt === "available",
  };
};
