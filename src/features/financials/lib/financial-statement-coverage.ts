import type { FinancialsRuntimeData } from "./financials-runtime-types";

export const FINANCIAL_STATEMENT_COVERAGE_FIELDS = [
  "revenue",
  "netIncome",
  "totalAssets",
  "totalEquity",
  "totalLiabilities",
  "totalDebt",
  "operatingCashFlow",
  "eps",
  "sharesOutstanding",
] as const;

export type FinancialStatementCoverageField = (typeof FINANCIAL_STATEMENT_COVERAGE_FIELDS)[number];
export type FinancialStatementFieldCoverage = {
  status: "available" | "unavailable" | "invalid_unit";
  value: number | null;
  unit: string | null;
};
export type FinancialStatementCoverage = Record<FinancialStatementCoverageField, FinancialStatementFieldCoverage>;

const valueFor = (runtime: FinancialsRuntimeData, field: FinancialStatementCoverageField): number | null => {
  const snapshot = runtime.statementSnapshot;
  if (!snapshot) return null;
  if (field === "netIncome") return snapshot.netProfit ?? null;
  return snapshot[field] ?? null;
};

const unitFieldFor = (field: FinancialStatementCoverageField) => {
  if (field === "netIncome") return "netIncome" as const;
  if (field === "totalEquity") return "equity" as const;
  if (field === "totalLiabilities") return "totalDebt" as const;
  return field;
};

export const buildFinancialStatementCoverage = (runtime: FinancialsRuntimeData): FinancialStatementCoverage =>
  Object.fromEntries(
    FINANCIAL_STATEMENT_COVERAGE_FIELDS.map((field) => {
      const value = valueFor(runtime, field);
      const metadata = runtime.unitMetadata[unitFieldFor(field)];
      const status = value === null ? "unavailable" : metadata.status === "explicit" ? "available" : "invalid_unit";

      return [field, { status, unit: status === "available" ? metadata.unit : null, value }];
    }),
  ) as FinancialStatementCoverage;
