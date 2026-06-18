import type { CompanyType } from "../data-contract";
import type { RawSourceRecord } from "./types";

export type ManualUploadCanonicalField =
  | "ticker"
  | "period"
  | "companyType"
  | "revenue"
  | "grossProfit"
  | "netIncome"
  | "operatingCashFlow"
  | "totalAssets"
  | "equity"
  | "totalDebt"
  | "currentAssets"
  | "currentLiabilities"
  | "eps"
  | "bvps"
  | "sharesOutstanding"
  | "closePrice"
  | "previousClose"
  | "volume"
  | "tradingValue"
  | "source"
  | "asOf"
  | "collectedAt"
  | "currency"
  | "unit";

export const MANUAL_UPLOAD_FIELD_ALIASES: Record<string, ManualUploadCanonicalField> = {
  ticker: "ticker",
  symbol: "ticker",
  period: "period",
  fiscalPeriod: "period",
  yearQuarter: "period",
  companyType: "companyType",
  revenue: "revenue",
  grossProfit: "grossProfit",
  netIncome: "netIncome",
  netProfit: "netIncome",
  profitAfterTax: "netIncome",
  operatingCashFlow: "operatingCashFlow",
  cfo: "operatingCashFlow",
  totalAssets: "totalAssets",
  assets: "totalAssets",
  equity: "equity",
  totalEquity: "equity",
  ownersEquity: "equity",
  totalDebt: "totalDebt",
  currentAssets: "currentAssets",
  currentLiabilities: "currentLiabilities",
  eps: "eps",
  bvps: "bvps",
  bookValuePerShare: "bvps",
  sharesOutstanding: "sharesOutstanding",
  closePrice: "closePrice",
  close: "closePrice",
  lastPrice: "closePrice",
  previousClose: "previousClose",
  volume: "volume",
  tradingVolume: "volume",
  tradingValue: "tradingValue",
  source: "source",
  asOf: "asOf",
  collectedAt: "collectedAt",
  currency: "currency",
  unit: "unit",
};

export const FINANCIAL_REQUIRED_FIELDS: ManualUploadCanonicalField[] = [
  "ticker",
  "period",
  "source",
  "asOf",
  "netIncome",
  "totalAssets",
  "equity",
];

export const normalizeManualUploadRow = (
  row: RawSourceRecord,
): {
  normalized: Partial<Record<ManualUploadCanonicalField, RawSourceRecord[string]>>;
  unmappedFields: string[];
} => {
  const normalized: Partial<Record<ManualUploadCanonicalField, RawSourceRecord[string]>> = {};
  const unmappedFields: string[] = [];

  for (const [field, value] of Object.entries(row)) {
    const canonicalField = MANUAL_UPLOAD_FIELD_ALIASES[field];
    if (!canonicalField) {
      unmappedFields.push(field);
      continue;
    }

    normalized[canonicalField] = value;
  }

  return { normalized, unmappedFields };
};

export const normalizeCompanyType = (value: unknown): CompanyType => {
  if (
    value === "non_financial" ||
    value === "bank" ||
    value === "securities" ||
    value === "insurance" ||
    value === "unknown"
  ) {
    return value;
  }

  return "unknown";
};

