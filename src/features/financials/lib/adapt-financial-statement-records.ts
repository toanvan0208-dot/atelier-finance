import type {
  FinancialStatementLocalRecord,
  FinancialStatementSeriesResult,
} from "../../../lib/data-sources/financial-statement-read-service";
import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

export type FinancialStatementAdapterStatus =
  | "available"
  | "partial"
  | "insufficient_data"
  | "unavailable";

export type AdaptedFinancialStatement = {
  snapshot: FinancialsStatementSnapshot;
  metadata: {
    ticker: string;
    period: string;
    periodType: FinancialStatementLocalRecord["periodType"];
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
    fallbackUsed: false;
  };
  dataQuality: {
    status: FinancialStatementAdapterStatus;
    missingFields: string[];
    availableFields: string[];
    invalidFields: string[];
    warnings: string[];
  };
};

export type AdaptFinancialStatementSeriesResult = {
  ok: boolean;
  status: FinancialStatementAdapterStatus;
  productionApproved: false;
  statements: AdaptedFinancialStatement[];
  missingFields: string[];
  warnings: string[];
  errors: string[];
};

const periodTypeToSnapshotType = (
  periodType: FinancialStatementLocalRecord["periodType"],
): FinancialsStatementSnapshot["periodType"] => {
  if (periodType === "year") return "annual";
  if (periodType === "quarter") return "quarter";
  if (periodType === "ttm") return "ttm";
  return "unknown";
};

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const adaptRecord = (
  record: FinancialStatementLocalRecord,
  previous?: FinancialStatementLocalRecord,
): AdaptedFinancialStatement => ({
  snapshot: {
    ticker: record.ticker,
    period: record.period,
    periodType: periodTypeToSnapshotType(record.periodType),
    sourceName: record.source.sourceLabel,
    collectedAt: record.source.importedAt ?? record.source.asOf,
    revenue: record.values.revenue,
    previousRevenue: previous?.values.revenue ?? null,
    grossProfit: record.values.grossProfit,
    operatingProfit: record.values.operatingIncome,
    netProfit: record.values.netIncome,
    previousNetProfit: previous?.values.netIncome ?? null,
    totalAssets: record.values.totalAssets,
    previousTotalAssets: previous?.values.totalAssets ?? null,
    totalLiabilities: record.values.totalLiabilities,
    totalEquity: record.values.totalEquity,
    previousTotalEquity: previous?.values.totalEquity ?? null,
    currentAssets: record.values.currentAssets,
    currentLiabilities: record.values.currentLiabilities,
    operatingCashFlow: record.values.operatingCashFlow,
    previousOperatingCashFlow: previous?.values.operatingCashFlow ?? null,
    capitalExpenditure: record.values.capitalExpenditure,
    sharesOutstanding: record.values.sharesOutstanding,
    eps: record.values.eps,
  },
  metadata: {
    ticker: record.ticker,
    period: record.period,
    periodType: record.periodType,
    sourceLabel: record.source.sourceLabel,
    dataMode: record.source.dataMode,
    productionApproved: false,
    fallbackUsed: false,
  },
  dataQuality: {
    status: record.dataQuality.status,
    missingFields: record.dataQuality.missingFields,
    availableFields: record.dataQuality.availableFields,
    invalidFields: record.dataQuality.invalidFields,
    warnings: record.dataQuality.warnings,
  },
});

export const adaptFinancialStatementSeries = (
  result: FinancialStatementSeriesResult,
): AdaptFinancialStatementSeriesResult => {
  if (!result.ok || result.records.length === 0) {
    return {
      ok: false,
      status: result.status === "invalid_input" || result.status === "database_error" ? "unavailable" : result.status,
      productionApproved: false,
      statements: [],
      missingFields: [],
      warnings: result.warnings,
      errors: result.errors,
    };
  }

  const statements = result.records.map((record, index) => adaptRecord(record, result.records[index + 1]));
  const missingFields = unique(statements.flatMap((statement) => statement.dataQuality.missingFields));
  const warnings = unique([
    ...result.warnings,
    ...statements.flatMap((statement) => statement.dataQuality.warnings),
  ]);
  const hasAvailable = statements.some((statement) => statement.dataQuality.status === "available");
  const hasPartial = statements.some((statement) => statement.dataQuality.status === "partial");
  const status: FinancialStatementAdapterStatus =
    hasAvailable && missingFields.length === 0
      ? "available"
      : hasAvailable || hasPartial
        ? "partial"
        : "insufficient_data";

  return {
    ok: status === "available" || status === "partial",
    status,
    productionApproved: false,
    statements,
    missingFields,
    warnings,
    errors: result.errors,
  };
};
