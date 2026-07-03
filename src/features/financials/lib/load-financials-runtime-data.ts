import type {
  FinancialStatementSeriesResult,
  getFinancialStatementSeries,
} from "../../../lib/data-sources/financial-statement-read-service";
import {
  adaptFinancialStatementSeries,
  type AdaptFinancialStatementSeriesResult,
} from "./adapt-financial-statement-records";
import { buildFinancialsUnitMetadata } from "./financials-unit-metadata-contract";
import type { FinancialsRuntimeData, FinancialsRuntimeDataQuality, FinancialsRuntimeReadPath } from "./financials-runtime-types";
import { financialsAuditFieldKeys, financialsTickerMatches } from "./financials-data-audit";
import { PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL } from "./phase109-controlled-financials-constants";
import { VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL } from "../../../lib/data-sources/vnstock-financials-candidate";

export type LoadFinancialsRuntimeDataOptions = {
  ticker?: string;
  preferDb?: boolean;
  allowFallback?: boolean;
  sourceLabel?: string;
  dataMode?: string;
  env?: Record<string, string | undefined>;
};

import type { getLatestMarketPrice } from "../../../lib/database/services/market-price-service";

export type LoadFinancialsRuntimeDataDeps = {
  readSeries?: typeof getFinancialStatementSeries;
  adaptSeries?: typeof adaptFinancialStatementSeries;
  readLatestMarketPrice?: typeof getLatestMarketPrice;
};

const DB_ENV_FLAG = "ATELIER_FINANCIALS_DB_SOURCE";
const DEFAULT_TICKER = "FPT";
const DEFAULT_DB_SOURCE_LABEL = PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL;
const DEFAULT_DATA_MODE = "research_only";
const SAMPLE_SOURCE_LABEL = "static_sample_financials";

const isDbDisabled = (options: LoadFinancialsRuntimeDataOptions): boolean =>
  options.preferDb === false || options.env?.[DB_ENV_FLAG] === "disabled" || process.env[DB_ENV_FLAG] === "disabled";

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
    missingFields: [...financialsAuditFieldKeys],
    warnings: [
      "Financials runtime is using static sample data; no usable local DB financial statements were available.",
      ...warnings,
    ],
    errors,
  },
  statementSnapshot: null,
  unitMetadata: buildFinancialsUnitMetadata({
    dataMode: "sample",
    snapshot: null,
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
    missingFields: [...financialsAuditFieldKeys],
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
  marketPriceRecord,
}: {
  ticker: string;
  sourceLabel: string;
  dataMode: string;
  adapted: AdaptFinancialStatementSeriesResult;
  readResult: FinancialStatementSeriesResult;
  marketPriceRecord: { closePrice: unknown } | null;
}): FinancialsRuntimeData => {
  const firstStatement = adapted.statements[0];
  const firstRecord = readResult.records[0];
  const statementSnapshot = firstStatement?.snapshot ?? null;
  
  if (statementSnapshot && marketPriceRecord?.closePrice !== undefined && marketPriceRecord?.closePrice !== null) {
    const parsedPrice = Number(marketPriceRecord.closePrice);
    if (Number.isFinite(parsedPrice)) {
      statementSnapshot.closePrice = parsedPrice;
    }
  }

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
  let sourceLabel = options.sourceLabel?.trim() || DEFAULT_DB_SOURCE_LABEL;
  const dataMode = options.dataMode?.trim() || DEFAULT_DATA_MODE;
  const allowFallback = options.allowFallback !== false;

  if (isDbDisabled(options)) return sampleFallback({ ticker });

  try {
    const readSeries =
      deps.readSeries ??
      (await import("../../../lib/data-sources/financial-statement-read-service")).getFinancialStatementSeries;
    let readLatestMarketPrice = deps.readLatestMarketPrice;
    if (!readLatestMarketPrice) {
      try {
        readLatestMarketPrice = (await import("../../../lib/database/services/market-price-service")).getLatestMarketPrice;
      } catch {
        readLatestMarketPrice = async () => null as unknown as ReturnType<typeof getLatestMarketPrice>;
      }
    }

    const adaptSeries = deps.adaptSeries ?? adaptFinancialStatementSeries;
    
    let readResult = await readSeries({ ticker, sourceLabel, dataMode, limit: 8 });
    let adapted = adaptSeries(readResult);

    if (!options.sourceLabel || options.sourceLabel.trim() === "") {
      if (ticker === "HPG" || ticker === "VNM" || ticker === "FPT" || ticker === "MSN" || ticker === "MWG") {
        const externalResult = await readSeries({ ticker, sourceLabel: "External financials review workspace", dataMode: "research_only", limit: 8 });
        const externalAdapted = adaptSeries(externalResult);
        if (externalAdapted.ok && externalAdapted.statements.length > 0) {
          readResult = externalResult;
          adapted = externalAdapted;
          sourceLabel = "External financials review workspace";
        } else {
          const pdfResult = await readSeries({ ticker, sourceLabel: "annual_report_2025_pdf_reviewed_preview", dataMode: "research_only", limit: 8 });
          const pdfAdapted = adaptSeries(pdfResult);
          if (pdfAdapted.ok && pdfAdapted.statements.length > 0) {
            readResult = pdfResult;
            adapted = pdfAdapted;
            sourceLabel = "annual_report_2025_pdf_reviewed_preview";
          }
        }
      }
    }

    if (!adapted.ok && (!options.sourceLabel || options.sourceLabel.trim() === "")) {
      const candidateResult = await readSeries({ ticker, sourceLabel: VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL, dataMode: "research_only", limit: 8 });
      const candidateAdapted = adaptSeries(candidateResult);
      if (candidateAdapted.ok && candidateAdapted.statements.length > 0) {
        readResult = candidateResult;
        adapted = candidateAdapted;
        sourceLabel = VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL;
      }
    }

    let marketPriceRecord = null;
    try {
      if (typeof readLatestMarketPrice === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marketPriceRecord = await readLatestMarketPrice(ticker, { dataMode: dataMode as any });
      }
    } catch {
      marketPriceRecord = null;
    }

    if (adapted.ok && adapted.statements.length > 0) {
      const adaptedTicker = adapted.statements[0]?.metadata.ticker;
      if (!financialsTickerMatches(ticker, adaptedTicker)) {
        return unavailableResult({
          ticker,
          sourceLabel,
          dataMode,
          warnings: [
            "Financials ticker mismatch was blocked; no record from another ticker was used.",
          ],
          readResult,
        });
      }
      return dbBackedResult({ ticker, sourceLabel, dataMode, adapted, readResult, marketPriceRecord });
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
