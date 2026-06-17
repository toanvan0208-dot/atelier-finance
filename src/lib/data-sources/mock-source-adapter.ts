import type {
  CompanyType,
  FinancialStatementRecord,
  MarketDataRecord,
  ValuationInputRecord,
} from "../data-contract";
import { assessFinancialStatementReadiness, assessMarketReadiness, assessValuationReadiness } from "../data-contract";
import { buildAdapterMetadata, combineReadiness } from "./adapter-contract";
import { normalizeCurrencyAmount, parseNullableNumber } from "./normalization";
import type { AdapterResult, RawSourceRecord, SourceAdapter } from "./types";

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const companyTypeValue = (value: unknown): CompanyType => {
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

const first = (record: RawSourceRecord, fields: string[]): unknown => {
  for (const field of fields) {
    if (record[field] !== undefined) return record[field];
  }

  return undefined;
};

const periodFromRecord = (record: RawSourceRecord) => {
  const period = stringValue(record.period);
  if (!period) return null;

  return {
    type: record.periodType === "ttm" ? "ttm" as const : record.periodType === "day" ? "day" as const : "quarter" as const,
    value: period,
  };
};

const missingFields = (entries: Record<string, unknown>): string[] =>
  Object.entries(entries)
    .filter(([, value]) => value === null || value === undefined)
    .map(([key]) => key);

export const mockSourceAdapter: SourceAdapter = {
  id: "mock-inline-fixture",
  name: "Inline mock fixture",
  sourceType: "curated_internal",
  supportedDataGroups: ["market", "financial_statement", "valuation"],
  legalStatus: "research_only",
  licenseStatus: "not_checked",

  normalizeMarketData(record: RawSourceRecord): AdapterResult<MarketDataRecord> {
    const closePrice = normalizeCurrencyAmount({
      value: first(record, ["closePrice", "lastPrice", "close"]),
      currency: stringValue(record.currency) ?? "VND",
      field: "closePrice",
    });
    const volume = parseNullableNumber(record.volume, "volume");
    const tradingValue = normalizeCurrencyAmount({
      value: record.tradingValue,
      currency: stringValue(record.currency) ?? "VND",
      field: "tradingValue",
    });
    const missing = missingFields({
      ticker: stringValue(record.ticker),
      closePrice: closePrice.value,
      volume: volume.value,
    });
    const metadataResult = buildAdapterMetadata({
      source: stringValue(record.source) ?? this.name,
      sourceType: this.sourceType,
      asOf: record.asOf,
      dataGroup: "market",
      period: periodFromRecord(record),
      collectedAt: stringValue(record.collectedAt),
      isDemoData: record.isDemoData === true,
      missingFields: missing,
      warnings: [...closePrice.warnings, ...volume.warnings, ...tradingValue.warnings],
    });
    const data: MarketDataRecord | null = metadataResult.metadata
      ? {
          ticker: stringValue(record.ticker),
          closePrice: closePrice.value,
          previousClose: parseNullableNumber(record.previousClose, "previousClose").value,
          volume: volume.value,
          tradingValue: tradingValue.value,
          metadata: metadataResult.metadata,
        }
      : null;

    return {
      data,
      metadata: metadataResult.metadata,
      warnings: metadataResult.warnings,
      errors: [...metadataResult.errors, ...closePrice.errors, ...volume.errors, ...tradingValue.errors],
      readiness: data ? assessMarketReadiness(data).status : metadataResult.readiness,
    };
  },

  normalizeFinancialData(record: RawSourceRecord): AdapterResult<FinancialStatementRecord> {
    const netIncome = normalizeCurrencyAmount({
      value: first(record, ["netIncome", "netProfit"]),
      currency: stringValue(record.currency) ?? "VND",
      field: "netIncome",
    });
    const totalAssets = normalizeCurrencyAmount({
      value: record.totalAssets,
      currency: stringValue(record.currency) ?? "VND",
      field: "totalAssets",
    });
    const equity = normalizeCurrencyAmount({
      value: first(record, ["equity", "totalEquity"]),
      currency: stringValue(record.currency) ?? "VND",
      field: "equity",
    });
    const operatingCashFlow = normalizeCurrencyAmount({
      value: record.operatingCashFlow,
      currency: stringValue(record.currency) ?? "VND",
      field: "operatingCashFlow",
    });
    const missing = missingFields({
      ticker: stringValue(record.ticker),
      netIncome: netIncome.value,
      totalAssets: totalAssets.value,
      equity: equity.value,
    });
    const metadataResult = buildAdapterMetadata({
      source: stringValue(record.source) ?? this.name,
      sourceType: this.sourceType,
      asOf: record.asOf,
      dataGroup: "financial_statement",
      period: periodFromRecord(record),
      collectedAt: stringValue(record.collectedAt),
      isDemoData: record.isDemoData === true,
      missingFields: missing,
      warnings: [
        ...netIncome.warnings,
        ...totalAssets.warnings,
        ...equity.warnings,
        ...operatingCashFlow.warnings,
      ],
    });
    const data: FinancialStatementRecord | null = metadataResult.metadata
      ? {
          ticker: stringValue(record.ticker),
          companyType: companyTypeValue(record.companyType),
          revenue: normalizeCurrencyAmount({ value: record.revenue, currency: stringValue(record.currency) ?? "VND", field: "revenue" }).value,
          grossProfit: normalizeCurrencyAmount({ value: record.grossProfit, currency: stringValue(record.currency) ?? "VND", field: "grossProfit" }).value,
          netIncome: netIncome.value,
          operatingCashFlow: operatingCashFlow.value,
          totalAssets: totalAssets.value,
          equity: equity.value,
          totalDebt: normalizeCurrencyAmount({ value: record.totalDebt, currency: stringValue(record.currency) ?? "VND", field: "totalDebt" }).value,
          currentAssets: normalizeCurrencyAmount({ value: record.currentAssets, currency: stringValue(record.currency) ?? "VND", field: "currentAssets" }).value,
          currentLiabilities: normalizeCurrencyAmount({ value: record.currentLiabilities, currency: stringValue(record.currency) ?? "VND", field: "currentLiabilities" }).value,
          metadata: metadataResult.metadata,
        }
      : null;

    return {
      data,
      metadata: metadataResult.metadata,
      warnings: metadataResult.warnings,
      errors: [...metadataResult.errors, ...netIncome.errors, ...totalAssets.errors, ...equity.errors],
      readiness: data
        ? combineReadiness([metadataResult.readiness, assessFinancialStatementReadiness(data).status])
        : metadataResult.readiness,
    };
  },

  normalizeValuationData(record: RawSourceRecord): AdapterResult<ValuationInputRecord> {
    const eps = parseNullableNumber(record.eps, "eps");
    const bvps = normalizeCurrencyAmount({
      value: first(record, ["bvps", "bookValuePerShare"]),
      currency: stringValue(record.currency) ?? "VND",
      field: "bvps",
    });
    const sharesOutstanding = parseNullableNumber(record.sharesOutstanding, "sharesOutstanding");
    const missing = missingFields({
      ticker: stringValue(record.ticker),
      eps: eps.value,
      sharesOutstanding: sharesOutstanding.value,
    });
    const metadataResult = buildAdapterMetadata({
      source: stringValue(record.source) ?? this.name,
      sourceType: this.sourceType,
      asOf: record.asOf,
      dataGroup: "valuation",
      period: periodFromRecord(record),
      collectedAt: stringValue(record.collectedAt),
      isDemoData: record.isDemoData === true,
      missingFields: missing,
      warnings: [...eps.warnings, ...bvps.warnings, ...sharesOutstanding.warnings],
    });
    const data: ValuationInputRecord | null = metadataResult.metadata
      ? {
          ticker: stringValue(record.ticker),
          eps: eps.value,
          bvps: bvps.value,
          sharesOutstanding: sharesOutstanding.value,
          marketCap: normalizeCurrencyAmount({ value: record.marketCap, currency: stringValue(record.currency) ?? "VND", field: "marketCap" }).value,
          enterpriseValue: normalizeCurrencyAmount({ value: record.enterpriseValue, currency: stringValue(record.currency) ?? "VND", field: "enterpriseValue" }).value,
          metadata: metadataResult.metadata,
        }
      : null;

    return {
      data,
      metadata: metadataResult.metadata,
      warnings: metadataResult.warnings,
      errors: [...metadataResult.errors, ...eps.errors, ...bvps.errors, ...sharesOutstanding.errors],
      readiness: data
        ? combineReadiness([metadataResult.readiness, assessValuationReadiness(data).status])
        : metadataResult.readiness,
    };
  },
};

