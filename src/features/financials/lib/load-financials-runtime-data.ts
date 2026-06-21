import type {
  FinancialStatementSeriesResult,
  getFinancialStatementSeries,
} from "../../../lib/data-sources/financial-statement-read-service";
import { financialsPageData } from "../data/financials.data";
import {
  adaptFinancialStatementSeries,
  type AdaptFinancialStatementSeriesResult,
} from "./adapt-financial-statement-records";
import { buildFinancialsUnitMetadata } from "./financials-unit-metadata-contract";
import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";
import type { FinancialsRuntimeData, FinancialsRuntimeDataQuality, FinancialsRuntimeReadPath } from "./financials-runtime-types";
import { PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL } from "./phase109-controlled-financials-constants";

export type LoadFinancialsRuntimeDataOptions = {
  ticker?: string;
  preferDb?: boolean;
  allowFallback?: boolean;
  sourceLabel?: string;
  dataMode?: string;
  env?: Record<string, string | undefined>;
};

export type LoadFinancialsRuntimeDataDeps = {
  readSeries?: typeof getFinancialStatementSeries;
  adaptSeries?: typeof adaptFinancialStatementSeries;
};

const DB_ENV_FLAG = "ATELIER_FINANCIALS_DB_SOURCE";
const DEFAULT_TICKER = "FPT";
const DEFAULT_DB_SOURCE_LABEL = PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL;
const DEFAULT_DATA_MODE = "research_only";
const SAMPLE_SOURCE_LABEL = "static_sample_financials";

const isDbDisabled = (options: LoadFinancialsRuntimeDataOptions): boolean =>
  options.preferDb === false || options.env?.[DB_ENV_FLAG] === "disabled" || process.env[DB_ENV_FLAG] === "disabled";

const sampleSnapshot = (ticker: string): FinancialsStatementSnapshot => ({
  ticker: financialsPageData.header.ticker || ticker,
  period: financialsPageData.header.reportPeriod,
  periodType: "annual",
  sourceName: SAMPLE_SOURCE_LABEL,
  collectedAt: null,
  revenue: null,
  previousRevenue: null,
  grossProfit: null,
  operatingProfit: null,
  netProfit: null,
  previousNetProfit: null,
  totalAssets: null,
  previousTotalAssets: null,
  totalLiabilities: null,
  totalEquity: null,
  previousTotalEquity: null,
  currentAssets: null,
  currentLiabilities: null,
  operatingCashFlow: null,
  previousOperatingCashFlow: null,
  capitalExpenditure: null,
  sharesOutstanding: null,
  eps: null,
});

const sampleFallback = ({
  ticker,
  warnings = [],
  errors = [],
}: {
  ticker: string;
  warnings?: string[];
  errors?: string[];
}): FinancialsRuntimeData => ({
  runtimeStatus: "sample_fallback",
  source: {
    sourceLabel: SAMPLE_SOURCE_LABEL,
    dataMode: "sample",
    productionApproved: false,
    fallbackUsed: true,
    readPath: "sample_static",
    ticker,
    asOf: null,
    fiscalYear: null,
    periodType: "annual",
  },
  dataQuality: {
    status: "unavailable",
    missingFields: [],
    warnings: [
      "Financials runtime is using static sample data; no usable local DB financial statements were available.",
      ...warnings,
    ],
    errors,
  },
  statementSnapshot: sampleSnapshot(ticker),
  unitMetadata: buildFinancialsUnitMetadata({
    dataMode: "sample",
    snapshot: sampleSnapshot(ticker),
    sourceLabel: SAMPLE_SOURCE_LABEL,
  }),
  readResult: null,
});

const unavailableResult = ({
  ticker,
  sourceLabel,
  dataMode,
  status = "unavailable",
  warnings = [],
  errors = [],
  readPath = "unavailable",
  readResult = null,
}: {
  ticker: string;
  sourceLabel: string;
  dataMode: string;
  status?: FinancialsRuntimeDataQuality["status"];
  warnings?: string[];
  errors?: string[];
  readPath?: FinancialsRuntimeReadPath;
  readResult?: FinancialStatementSeriesResult | null;
}): FinancialsRuntimeData => ({
  runtimeStatus: errors.length > 0 ? "read_error" : "unavailable",
  source: {
    sourceLabel,
    dataMode,
    productionApproved: false,
    fallbackUsed: false,
    readPath,
    ticker,
    asOf: null,
    fiscalYear: null,
    periodType: null,
  },
  dataQuality: {
    status,
    missingFields: [],
    warnings,
    errors,
  },
  statementSnapshot: null,
  unitMetadata: buildFinancialsUnitMetadata({ dataMode, snapshot: null, sourceLabel }),
  readResult,
});

const dbBackedResult = ({
  ticker,
  sourceLabel,
  dataMode,
  adapted,
  readResult,
}: {
  ticker: string;
  sourceLabel: string;
  dataMode: string;
  adapted: AdaptFinancialStatementSeriesResult;
  readResult: FinancialStatementSeriesResult;
}): FinancialsRuntimeData => {
  const firstStatement = adapted.statements[0];
  const firstRecord = readResult.records[0];
  const statementSnapshot = firstStatement?.snapshot ?? null;
  const source = {
    sourceLabel: firstStatement?.metadata.sourceLabel ?? sourceLabel,
    dataMode: firstStatement?.metadata.dataMode ?? dataMode,
  };

  return {
    runtimeStatus: "db_backed",
    source: {
      sourceLabel: source.sourceLabel,
      dataMode: source.dataMode,
      productionApproved: false,
      fallbackUsed: false,
      readPath: "local_db",
      ticker: firstStatement?.metadata.ticker ?? ticker,
      asOf: firstRecord?.source.asOf ?? null,
      fiscalYear: firstRecord?.fiscalYear ?? null,
      periodType: statementSnapshot?.periodType ?? null,
    },
    dataQuality: {
      status: adapted.status,
      missingFields: adapted.missingFields,
      warnings: adapted.warnings,
      errors: adapted.errors,
    },
    statementSnapshot,
    unitMetadata:
      firstStatement?.unitMetadata ??
      buildFinancialsUnitMetadata({
        dataMode: source.dataMode,
        snapshot: statementSnapshot,
        sourceLabel: source.sourceLabel,
      }),
    readResult,
  };
};

export const loadFinancialsRuntimeData = async (
  options: LoadFinancialsRuntimeDataOptions = {},
  deps: LoadFinancialsRuntimeDataDeps = {},
): Promise<FinancialsRuntimeData> => {
  const ticker = (options.ticker?.trim() || DEFAULT_TICKER).toUpperCase();
  const sourceLabel = options.sourceLabel?.trim() || DEFAULT_DB_SOURCE_LABEL;
  const dataMode = options.dataMode?.trim() || DEFAULT_DATA_MODE;
  const allowFallback = options.allowFallback !== false;

  if (isDbDisabled(options)) return sampleFallback({ ticker });

  try {
    const readSeries =
      deps.readSeries ??
      (await import("../../../lib/data-sources/financial-statement-read-service")).getFinancialStatementSeries;
    const adaptSeries = deps.adaptSeries ?? adaptFinancialStatementSeries;
    const readResult = await readSeries({ ticker, sourceLabel, dataMode, limit: 8 });
    const adapted = adaptSeries(readResult);

    if (adapted.ok && adapted.statements.length > 0) {
      return dbBackedResult({ ticker, sourceLabel, dataMode, adapted, readResult });
    }

    const warnings = [
      "Financials DB-backed runtime read returned no usable adapted statements.",
      ...readResult.warnings,
      ...adapted.warnings,
    ];
    const errors = [...readResult.errors, ...adapted.errors];

    return allowFallback
      ? sampleFallback({ ticker, warnings, errors })
      : unavailableResult({
          ticker,
          sourceLabel,
          dataMode,
          status: readResult.status === "insufficient_data" ? "insufficient_data" : "unavailable",
          warnings,
          errors,
          readResult,
        });
  } catch (error) {
    const errors = [error instanceof Error ? error.message : "Financials runtime DB read failed."];
    return allowFallback
      ? sampleFallback({ ticker, warnings: ["Financials DB-backed runtime read failed; sample fallback used."], errors })
      : unavailableResult({ ticker, sourceLabel, dataMode, errors, readPath: "unavailable" });
  }
};
