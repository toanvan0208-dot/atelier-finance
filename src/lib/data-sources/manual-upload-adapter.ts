import type {
  DataPeriod,
  FinancialStatementRecord,
  MarketDataRecord,
  ReadinessStatus,
  ValuationInputRecord,
} from "../data-contract";
import {
  bridgeFinancialsContract,
  bridgeValuationContract,
} from "../data-contract";
import { assessFinancialStatementReadiness, assessMarketReadiness, assessValuationReadiness } from "../data-contract";
import { buildAdapterMetadata, combineReadiness } from "./adapter-contract";
import {
  normalizeCompanyType,
  normalizeManualUploadRow,
  type ManualUploadCanonicalField,
} from "./manual-upload-schema";
import { parseManualUploadCsv } from "./manual-upload-parser";
import { normalizeCurrencyAmount, parseNullableNumber } from "./normalization";
import type { AdapterError, AdapterResult, AdapterWarning, RawSourceRecord } from "./types";

export type ManualUploadInput =
  | { kind: "rows"; rows: RawSourceRecord[]; batch?: ManualUploadBatchMetadata }
  | { kind: "csv"; csvText: string; batch?: ManualUploadBatchMetadata };

export type ManualUploadBatchMetadata = {
  source?: string | null;
  asOf?: string | null;
  period?: string | null;
  collectedAt?: string | null;
  currency?: string | null;
  unit?: string | null;
  isDemoData?: boolean;
};

export type ManualUploadCanonicalData = {
  financialStatements: FinancialStatementRecord[];
  marketData: MarketDataRecord[];
  valuationInputs: ValuationInputRecord[];
};

export type ManualUploadRowResult = {
  rowIndex: number;
  readiness: ReadinessStatus;
  financialStatement: FinancialStatementRecord | null;
  marketData: MarketDataRecord | null;
  valuationInput: ValuationInputRecord | null;
  warnings: AdapterWarning[];
  errors: AdapterError[];
  unmappedFields: string[];
  missingFields: string[];
};

export type ManualUploadSummary = {
  totalRows: number;
  parsedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  missingFieldCounts: Record<string, number>;
  unmappedFieldCounts: Record<string, number>;
};

export type ManualUploadAdapterResult = AdapterResult<ManualUploadCanonicalData> & {
  rowResults: ManualUploadRowResult[];
  summary: ManualUploadSummary;
};

const missingTokens = new Set(["", " ", "-", "N/A", "NA", "null", "undefined"]);

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const valueOrBatch = (
  row: Partial<Record<ManualUploadCanonicalField, RawSourceRecord[string]>>,
  field: ManualUploadCanonicalField,
  batch: ManualUploadBatchMetadata | undefined,
): RawSourceRecord[string] | null | undefined => row[field] ?? batch?.[field as keyof ManualUploadBatchMetadata] ?? null;

const isMissingToken = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && missingTokens.has(value.trim()));

const parsePeriod = (value: unknown): { period: DataPeriod | null; warnings: AdapterWarning[] } => {
  const text = stringValue(value);
  if (!text) {
    return {
      period: null,
      warnings: [{ code: "PERIOD_MISSING", message: "Manual upload row is missing period.", field: "period" }],
    };
  }

  const quarterMatch = text.match(/^(\d{4})[- ]?Q([1-4])$/i);
  if (quarterMatch) {
    return {
      period: {
        type: "quarter",
        value: text,
        fiscalYear: Number(quarterMatch[1]),
        fiscalQuarter: Number(quarterMatch[2]),
      },
      warnings: [],
    };
  }

  const yearMatch = text.match(/^(\d{4})$/);
  if (yearMatch) {
    return {
      period: {
        type: "year",
        value: text,
        fiscalYear: Number(yearMatch[1]),
      },
      warnings: [],
    };
  }

  if (text.toLowerCase().includes("ttm")) {
    return { period: { type: "ttm", value: text }, warnings: [] };
  }

  return {
    period: { type: "unknown", value: text },
    warnings: [{ code: "PERIOD_FORMAT_UNKNOWN", message: "Period format is not recognized.", field: "period" }],
  };
};

const countFields = (target: Record<string, number>, fields: string[]): void => {
  for (const field of fields) {
    target[field] = (target[field] ?? 0) + 1;
  }
};

const numberField = ({
  value,
  field,
  currency,
}: {
  value: unknown;
  field: string;
  currency: string | null;
}) => {
  if (isMissingToken(value)) {
    return parseNullableNumber(value, field);
  }

  return normalizeCurrencyAmount({ value, currency: currency ?? "VND", field });
};

const sharesField = (value: unknown, field: string) => parseNullableNumber(value, field);

const metadataForGroup = ({
  row,
  batch,
  group,
  period,
  missingFields,
  warnings,
}: {
  row: Partial<Record<ManualUploadCanonicalField, RawSourceRecord[string]>>;
  batch?: ManualUploadBatchMetadata;
  group: "financial_statement" | "market" | "valuation";
  period: DataPeriod | null;
  missingFields: string[];
  warnings: AdapterWarning[];
}) => buildAdapterMetadata({
  source: stringValue(valueOrBatch(row, "source", batch)) ?? "manual_upload",
  sourceType: "user_input",
  asOf: valueOrBatch(row, "asOf", batch),
  dataGroup: group,
  period,
  collectedAt: stringValue(valueOrBatch(row, "collectedAt", batch)),
  isDemoData: batch?.isDemoData === true,
  missingFields,
  warnings,
});

const normalizeRow = (
  rawRow: RawSourceRecord,
  rowIndex: number,
  batch?: ManualUploadBatchMetadata,
): ManualUploadRowResult => {
  const { normalized, unmappedFields } = normalizeManualUploadRow(rawRow);
  const warnings: AdapterWarning[] = [];
  const errors: AdapterError[] = [];

  if (unmappedFields.length > 0) {
    warnings.push({
      code: "UNMAPPED_FIELDS",
      message: `Manual upload row contains unmapped fields: ${unmappedFields.join(", ")}.`,
    });
  }

  const { period, warnings: periodWarnings } = parsePeriod(valueOrBatch(normalized, "period", batch));
  warnings.push(...periodWarnings);

  const currency = stringValue(valueOrBatch(normalized, "currency", batch)) ?? "VND";
  const ticker = stringValue(normalized.ticker);
  const companyType = normalizeCompanyType(normalized.companyType);
  if (!normalized.companyType) {
    warnings.push({ code: "COMPANY_TYPE_UNKNOWN", message: "Company type is missing and remains unknown.", field: "companyType" });
  }

  const revenue = numberField({ value: normalized.revenue, field: "revenue", currency });
  const grossProfit = numberField({ value: normalized.grossProfit, field: "grossProfit", currency });
  const netIncome = numberField({ value: normalized.netIncome, field: "netIncome", currency });
  const operatingCashFlow = numberField({ value: normalized.operatingCashFlow, field: "operatingCashFlow", currency });
  const totalAssets = numberField({ value: normalized.totalAssets, field: "totalAssets", currency });
  const equity = numberField({ value: normalized.equity, field: "equity", currency });
  const totalDebt = numberField({ value: normalized.totalDebt, field: "totalDebt", currency });
  const currentAssets = numberField({ value: normalized.currentAssets, field: "currentAssets", currency });
  const currentLiabilities = numberField({ value: normalized.currentLiabilities, field: "currentLiabilities", currency });
  const eps = numberField({ value: normalized.eps, field: "eps", currency });
  const bvps = numberField({ value: normalized.bvps, field: "bvps", currency });
  const sharesOutstanding = sharesField(normalized.sharesOutstanding, "sharesOutstanding");
  const closePrice = numberField({ value: normalized.closePrice, field: "closePrice", currency });
  const previousClose = numberField({ value: normalized.previousClose, field: "previousClose", currency });
  const volume = sharesField(normalized.volume, "volume");
  const tradingValue = numberField({ value: normalized.tradingValue, field: "tradingValue", currency });

  const parseResults = [
    revenue,
    grossProfit,
    netIncome,
    operatingCashFlow,
    totalAssets,
    equity,
    totalDebt,
    currentAssets,
    currentLiabilities,
    eps,
    bvps,
    sharesOutstanding,
    closePrice,
    previousClose,
    volume,
    tradingValue,
  ];
  warnings.push(...parseResults.flatMap((result) => result.warnings));
  errors.push(...parseResults.flatMap((result) => result.errors));

  const financialMissing = [
    ...(ticker ? [] : ["ticker"]),
    ...(period ? [] : ["period"]),
    ...(netIncome.value === null ? ["netIncome"] : []),
    ...(totalAssets.value === null ? ["totalAssets"] : []),
    ...(equity.value === null ? ["equity"] : []),
  ];
  const financialMetadata = metadataForGroup({
    row: normalized,
    batch,
    group: "financial_statement",
    period,
    missingFields: financialMissing,
    warnings,
  });
  errors.push(...financialMetadata.errors);
  warnings.push(...financialMetadata.warnings);

  const financialStatement: FinancialStatementRecord | null = financialMetadata.metadata
    ? {
        ticker,
        companyType,
        revenue: revenue.value,
        grossProfit: grossProfit.value,
        netIncome: netIncome.value,
        operatingCashFlow: operatingCashFlow.value,
        totalAssets: totalAssets.value,
        equity: equity.value,
        totalDebt: totalDebt.value,
        currentAssets: currentAssets.value,
        currentLiabilities: currentLiabilities.value,
        metadata: financialMetadata.metadata,
      }
    : null;

  const marketMissing = [
    ...(ticker ? [] : ["ticker"]),
    ...(closePrice.value === null ? ["closePrice"] : []),
    ...(volume.value === null ? ["volume"] : []),
  ];
  const marketMetadata = metadataForGroup({
    row: normalized,
    batch,
    group: "market",
    period,
    missingFields: marketMissing,
    warnings,
  });
  errors.push(...marketMetadata.errors);
  const marketData: MarketDataRecord | null = marketMetadata.metadata
    ? {
        ticker,
        closePrice: closePrice.value,
        previousClose: previousClose.value,
        volume: volume.value,
        tradingValue: tradingValue.value,
        metadata: marketMetadata.metadata,
      }
    : null;

  const valuationMissing = [
    ...(ticker ? [] : ["ticker"]),
    ...(eps.value === null ? ["eps"] : []),
    ...(sharesOutstanding.value === null ? ["sharesOutstanding"] : []),
  ];
  const valuationMetadata = metadataForGroup({
    row: normalized,
    batch,
    group: "valuation",
    period,
    missingFields: valuationMissing,
    warnings,
  });
  errors.push(...valuationMetadata.errors);
  const valuationInput: ValuationInputRecord | null = valuationMetadata.metadata
    ? {
        ticker,
        eps: eps.value,
        bvps: bvps.value,
        sharesOutstanding: sharesOutstanding.value,
        marketCap: null,
        enterpriseValue: null,
        metadata: valuationMetadata.metadata,
      }
    : null;

  const readiness = combineReadiness([
    period ? "ready" : "not_ready",
    financialStatement ? assessFinancialStatementReadiness(financialStatement).status : "not_ready",
    marketData ? assessMarketReadiness(marketData).status : "not_ready",
    valuationInput ? assessValuationReadiness(valuationInput).status : "not_ready",
    financialMetadata.readiness,
    marketMetadata.readiness,
    valuationMetadata.readiness,
    errors.length > 0 ? "not_ready" : "ready",
    warnings.length > 0 ? "needs_review" : "ready",
  ]);

  if (financialStatement && marketData) {
    bridgeFinancialsContract({ statement: financialStatement, market: marketData });
  }
  if (financialStatement && marketData && valuationInput) {
    bridgeValuationContract({ statement: financialStatement, market: marketData, valuation: valuationInput });
  }

  return {
    rowIndex,
    readiness,
    financialStatement,
    marketData,
    valuationInput,
    warnings,
    errors,
    unmappedFields,
    missingFields: Array.from(new Set([...financialMissing, ...marketMissing, ...valuationMissing])),
  };
};

const emptySummary = (totalRows: number): ManualUploadSummary => ({
  totalRows,
  parsedRows: 0,
  validRows: 0,
  warningRows: 0,
  errorRows: 0,
  missingFieldCounts: {},
  unmappedFieldCounts: {},
});

export const normalizeManualUpload = (input: ManualUploadInput): ManualUploadAdapterResult => {
  const parseResult = input.kind === "csv"
    ? parseManualUploadCsv(input.csvText)
    : { rows: input.rows, warnings: [], errors: [] };
  const summary = emptySummary(parseResult.rows.length);

  if (parseResult.errors.length > 0) {
    return {
      data: null,
      metadata: null,
      warnings: parseResult.warnings,
      errors: parseResult.errors,
      readiness: "not_ready",
      rowResults: [],
      summary,
    };
  }

  const rowResults = parseResult.rows.map((row, index) => normalizeRow(row, index + 1, input.batch));
  const financialStatements = rowResults.flatMap((row) => row.financialStatement ? [row.financialStatement] : []);
  const marketData = rowResults.flatMap((row) => row.marketData ? [row.marketData] : []);
  const valuationInputs = rowResults.flatMap((row) => row.valuationInput ? [row.valuationInput] : []);
  const warnings = [...parseResult.warnings, ...rowResults.flatMap((row) => row.warnings)];
  const errors = rowResults.flatMap((row) => row.errors);

  summary.parsedRows = parseResult.rows.length;
  summary.validRows = rowResults.filter((row) => row.errors.length === 0 && row.readiness !== "not_ready").length;
  summary.warningRows = rowResults.filter((row) => row.warnings.length > 0).length;
  summary.errorRows = rowResults.filter((row) => row.errors.length > 0).length;
  for (const row of rowResults) {
    countFields(summary.missingFieldCounts, row.missingFields);
    countFields(summary.unmappedFieldCounts, row.unmappedFields);
  }

  return {
    data: errors.length > 0
      ? null
      : {
          financialStatements,
          marketData,
          valuationInputs,
        },
    metadata: financialStatements[0]?.metadata ?? marketData[0]?.metadata ?? valuationInputs[0]?.metadata ?? null,
    warnings,
    errors,
    readiness: combineReadiness([
      errors.length > 0 ? "not_ready" : "ready",
      rowResults.some((row) => row.readiness === "not_ready") ? "not_ready" : "ready",
      warnings.length > 0 ? "needs_review" : "ready",
    ]),
    rowResults,
    summary,
  };
};
