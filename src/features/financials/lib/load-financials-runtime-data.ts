import type {
  FinancialStatementSeriesResult,
  getFinancialStatementSeries,
} from "../../../lib/data-sources/financial-statement-read-service";
import {
  adaptFinancialStatementSeries,
  type AdaptedFinancialStatement,
  type AdaptFinancialStatementSeriesResult,
} from "./adapt-financial-statement-records";
import {
  buildFinancialsUnitMetadata,
  type FinancialsNumericField,
  type FinancialsUnitMetadataMap,
} from "./financials-unit-metadata-contract";
import type {
  FinancialsIndustryMetricReference,
  FinancialsRuntimeData,
  FinancialsRuntimeDataQuality,
  FinancialsRuntimeReadPath,
} from "./financials-runtime-types";
import { financialsAuditFieldKeys, financialsTickerMatches } from "./financials-data-audit";
import { PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL } from "./phase109-controlled-financials-constants";
import { VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL } from "../../../lib/data-sources/vnstock-financials-candidate";
import { LONG_SAFE_FINANCIALS_SOURCE_LABEL } from "./long-safe-financials-csv-import";

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
const EXTERNAL_FINANCIALS_SOURCE_LABEL = "External financials review workspace";
const REVIEWED_PDF_SOURCE_LABEL = "annual_report_2025_pdf_reviewed_preview";
const EXTERNAL_REVIEW_INFERRED_UNIT_WARNING =
  "external_review_workspace_unit_metadata_inferred_from_source_package";

const externalReviewWorkspaceUnits: Partial<Record<FinancialsNumericField, "vnd" | "vnd_per_share" | "shares">> = {
  currentAssets: "vnd",
  currentLiabilities: "vnd",
  equity: "vnd",
  eps: "vnd_per_share",
  netIncome: "vnd",
  operatingCashFlow: "vnd",
  revenue: "vnd",
  sharesOutstanding: "shares",
  totalAssets: "vnd",
  totalDebt: "vnd",
};

const industryCodeByTicker: Record<string, string> = {
  HPG: "STEEL_MATERIALS",
  HSG: "STEEL_MATERIALS",
  NKG: "STEEL_MATERIALS",
  MWG: "RETAIL",
  VNM: "CONSUMER_STAPLES_DAIRY",
};

const isDbDisabled = (options: LoadFinancialsRuntimeDataOptions): boolean =>
  options.preferDb === false || options.env?.[DB_ENV_FLAG] === "disabled" || process.env[DB_ENV_FLAG] === "disabled";

const preferredSourceLabelsForTicker = (ticker: string): string[] => {
  if (ticker === "HPG" || ticker === "VNM" || ticker === "MWG") {
    return [EXTERNAL_FINANCIALS_SOURCE_LABEL, REVIEWED_PDF_SOURCE_LABEL, LONG_SAFE_FINANCIALS_SOURCE_LABEL];
  }
  if (ticker === "FPT" || ticker === "MSN") {
    return [REVIEWED_PDF_SOURCE_LABEL, EXTERNAL_FINANCIALS_SOURCE_LABEL];
  }
  return [];
};

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
  industryMetricReference: null,
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
  industryMetricReference: null,
  readResult,
});

const loadIndustryMetricReference = async (ticker: string): Promise<FinancialsIndustryMetricReference | null> => {
  const industryCode = industryCodeByTicker[ticker.trim().toUpperCase()];
  if (!industryCode) return null;

  try {
    const { loadIndustryMetricSummaryByIndustryCode } = await import("../../industry/lib/load-industry-context");
    const summary = await loadIndustryMetricSummaryByIndustryCode(industryCode);
    const metrics = summary.metrics
      .filter(
        (metric) =>
          metric.metricCode === "GROSS_MARGIN_COMPANY_REFERENCE" ||
          metric.metricCode === "NET_MARGIN_COMPANY_REFERENCE",
      )
      .map((metric) => ({
        metricCode: metric.metricCode as "GROSS_MARGIN_COMPANY_REFERENCE" | "NET_MARGIN_COMPANY_REFERENCE",
        metricLabelVi: metric.metricLabelVi,
        value: metric.value,
        unit: metric.unit,
        periodLabel: metric.periodLabel,
        sourceLabel: metric.sourceLabel,
        sourceKey: metric.sourceKey,
        provenanceCount: metric.provenanceCount,
      }));

    return {
      status: summary.status,
      industryCode: summary.industryCode,
      readyForUiDisplay: summary.readyForUiDisplay,
      rowsWithoutProvenance: summary.rowsWithoutProvenance,
      metrics,
      caveats: summary.caveats,
    };
  } catch {
    return {
      status: "missing",
      industryCode,
      readyForUiDisplay: false,
      rowsWithoutProvenance: 0,
      metrics: [],
      caveats: ["Chưa đọc được dữ liệu tham chiếu ngành từ cơ sở dữ liệu."],
    };
  }
};

const fiscalYearFromAdaptedStatement = (statement: AdaptedFinancialStatement): number | null => {
  const parsed = Number(statement.snapshot.period ?? statement.metadata.period);
  return Number.isFinite(parsed) ? parsed : null;
};

const addPreviousYearSnapshotValues = (
  current: AdaptFinancialStatementSeriesResult,
  history: AdaptFinancialStatementSeriesResult | null,
): AdaptFinancialStatementSeriesResult => {
  if (!current.ok || current.statements.length === 0 || !history?.ok || history.statements.length === 0) {
    return current;
  }

  const firstStatement = current.statements[0];
  const currentYear = fiscalYearFromAdaptedStatement(firstStatement);
  const previousStatement =
    currentYear === null
      ? history.statements[0]
      : history.statements
          .filter((statement) => {
            const year = fiscalYearFromAdaptedStatement(statement);
            return year !== null && year < currentYear;
          })
          .sort((a, b) => (fiscalYearFromAdaptedStatement(b) ?? 0) - (fiscalYearFromAdaptedStatement(a) ?? 0))[0];

  if (!previousStatement) return current;

  return {
    ...current,
    statements: current.statements.map((statement, index) =>
      index === 0
        ? {
            ...statement,
            snapshot: {
              ...statement.snapshot,
              previousRevenue: statement.snapshot.previousRevenue ?? previousStatement.snapshot.revenue,
              previousGrossProfit: statement.snapshot.previousGrossProfit ?? previousStatement.snapshot.grossProfit,
              previousNetProfit: statement.snapshot.previousNetProfit ?? previousStatement.snapshot.netProfit,
              previousTotalAssets: statement.snapshot.previousTotalAssets ?? previousStatement.snapshot.totalAssets,
              previousTotalEquity: statement.snapshot.previousTotalEquity ?? previousStatement.snapshot.totalEquity,
              previousOperatingCashFlow:
                statement.snapshot.previousOperatingCashFlow ?? previousStatement.snapshot.operatingCashFlow,
            },
          }
        : statement,
    ),
  };
};

const dbBackedResult = ({
  ticker,
  sourceLabel,
  dataMode,
  adapted,
  readResult,
  marketPriceRecord,
  industryMetricReference,
}: {
  ticker: string;
  sourceLabel: string;
  dataMode: string;
  adapted: AdaptFinancialStatementSeriesResult;
  readResult: FinancialStatementSeriesResult;
  marketPriceRecord: { closePrice: unknown } | null;
  industryMetricReference: FinancialsIndustryMetricReference | null;
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
  const usesExternalReviewInferredUnits =
    source.sourceLabel === EXTERNAL_FINANCIALS_SOURCE_LABEL && statementSnapshot !== null;
  const unitMetadata: FinancialsUnitMetadataMap =
    usesExternalReviewInferredUnits
      ? buildFinancialsUnitMetadata({
          dataMode: source.dataMode,
          explicitUnits: externalReviewWorkspaceUnits,
          snapshot: statementSnapshot,
          sourceLabel: source.sourceLabel,
        })
      : firstStatement?.unitMetadata ??
        buildFinancialsUnitMetadata({
          dataMode: source.dataMode,
          snapshot: statementSnapshot,
          sourceLabel: source.sourceLabel,
        });

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
      warnings: usesExternalReviewInferredUnits
        ? [...adapted.warnings, EXTERNAL_REVIEW_INFERRED_UNIT_WARNING]
        : adapted.warnings,
      errors: adapted.errors,
    },
    statementSnapshot,
    unitMetadata,
    industryMetricReference,
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
      for (const candidateSourceLabel of preferredSourceLabelsForTicker(ticker)) {
        const candidateResult = await readSeries({
          ticker,
          sourceLabel: candidateSourceLabel,
          dataMode: "research_only",
          limit: 8,
        });
        const candidateAdapted = adaptSeries(candidateResult);
        if (candidateAdapted.ok && candidateAdapted.statements.length > 0) {
          readResult = candidateResult;
          adapted = candidateAdapted;
          sourceLabel = candidateSourceLabel;
          break;
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
      if (sourceLabel === EXTERNAL_FINANCIALS_SOURCE_LABEL && (ticker === "HPG" || ticker === "VNM" || ticker === "MWG")) {
        try {
          const historyResult = await readSeries({
            ticker,
            sourceLabel: LONG_SAFE_FINANCIALS_SOURCE_LABEL,
            dataMode: "research_only",
            limit: 8,
          });
          adapted = addPreviousYearSnapshotValues(adapted, adaptSeries(historyResult));
        } catch {
          // Giữ kỳ chính 2025; nếu lịch sử lỗi thì chỉ bỏ phần tăng trưởng.
        }
      }
      const industryMetricReference = await loadIndustryMetricReference(adaptedTicker ?? ticker);
      return dbBackedResult({ ticker, sourceLabel, dataMode, adapted, readResult, marketPriceRecord, industryMetricReference });
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
