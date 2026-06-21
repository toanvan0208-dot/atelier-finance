import {
  runFinancialStatementSafeImportMvp,
  type FinancialStatementSafeImportMvpInput,
  type FinancialStatementSafeImportMvpResult,
} from "@/lib/data-sources/financial-statement-safe-import-mvp";
import { buildOverviewCrossModuleReadinessSummary } from "@/features/overview/lib/overview-cross-module-readiness";
import { buildRiskFinancialsRuntimeConsumption } from "@/features/risk/lib/risk-financials-runtime-consumption";
import { buildValuationFinancialsRuntimeReadiness } from "@/features/valuation/lib/valuation-financials-runtime-readiness";
import { loadFinancialsRuntimeData, type LoadFinancialsRuntimeDataDeps } from "./load-financials-runtime-data";
import type { FinancialsRuntimeData } from "./financials-runtime-types";
import {
  PHASE109_CONTROLLED_FINANCIALS_AS_OF,
  PHASE109_CONTROLLED_FINANCIALS_DATA_MODE,
  PHASE109_CONTROLLED_FINANCIALS_PERIOD,
  PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
  PHASE109_CONTROLLED_FINANCIALS_TICKERS,
  type Phase109ControlledFinancialsTicker,
} from "./phase109-controlled-financials-constants";

type StatementType = "income_statement" | "balance_sheet" | "cash_flow";
type FinancialsField =
  | "revenue"
  | "grossProfit"
  | "netIncome"
  | "totalAssets"
  | "totalEquity"
  | "totalLiabilities"
  | "currentAssets"
  | "currentLiabilities"
  | "operatingCashFlow";

type ControlledFinancialsMetric = {
  field: FinancialsField;
  statementType: StatementType;
  value: number;
  unit?: "billion_vnd";
};

export type Phase109TickerAudit = {
  ticker: string;
  sourceLabel: typeof PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL | null;
  dataMode: typeof PHASE109_CONTROLLED_FINANCIALS_DATA_MODE | null;
  productionApproved: false;
  confirmWrite: boolean;
  dryRun: boolean;
  inputRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  writtenRows: number;
  skippedReason: string | null;
  importResult: FinancialStatementSafeImportMvpResult | null;
  runtimeProof: {
    checked: boolean;
    runtimeStatus: FinancialsRuntimeData["runtimeStatus"] | null;
    fallbackUsed: boolean | null;
    readPath: FinancialsRuntimeData["source"]["readPath"] | null;
    sourceLabel: string | null;
    dataMode: string | null;
    productionApproved: false;
    sharesOutstanding: number | null;
    eps: number | null;
    missingFields: string[];
  };
  crossModuleReadiness: {
    overviewFinancialsStatus: string | null;
    overviewValuationStatus: string | null;
    valuationConsumesFinancialsRuntime: boolean | null;
    canClaimValuationDbBacked: false;
    valuationMarketCapReadiness: string | null;
    riskSourceMode: string | null;
    canClaimRiskDbBacked: false;
    riskLeverageReadiness: string | null;
  };
};

export type Phase109ControlledFinancialsActivationOptions = {
  confirmWrite?: boolean;
  databaseUrl?: string;
  verifyRuntimeRead?: boolean;
  tickers?: string[];
  csvTextByTicker?: Partial<Record<string, string>>;
  db?: FinancialStatementSafeImportMvpInput["db"];
  runtimeDeps?: LoadFinancialsRuntimeDataDeps;
};

export type Phase109ControlledFinancialsActivationReport = {
  phase: "Phase 109";
  sourceLabel: typeof PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL;
  dataMode: typeof PHASE109_CONTROLLED_FINANCIALS_DATA_MODE;
  productionApproved: false;
  confirmWrite: boolean;
  dryRun: boolean;
  tickerAudits: Phase109TickerAudit[];
  totals: {
    inputRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
    writtenRows: number;
  };
};

const controlledFinancialsByTicker: Record<Phase109ControlledFinancialsTicker, ControlledFinancialsMetric[]> = {
  FPT: [
    { field: "revenue", statementType: "income_statement", value: 62_000 },
    { field: "grossProfit", statementType: "income_statement", value: 24_800 },
    { field: "netIncome", statementType: "income_statement", value: 8_700 },
    { field: "totalAssets", statementType: "balance_sheet", value: 75_000 },
    { field: "totalEquity", statementType: "balance_sheet", value: 36_000 },
    { field: "totalLiabilities", statementType: "balance_sheet", value: 39_000 },
    { field: "currentAssets", statementType: "balance_sheet", value: 30_000 },
    { field: "currentLiabilities", statementType: "balance_sheet", value: 17_000 },
    { field: "operatingCashFlow", statementType: "cash_flow", value: 9_800 },
  ],
  MWG: [
    { field: "revenue", statementType: "income_statement", value: 134_000 },
    { field: "grossProfit", statementType: "income_statement", value: 28_500 },
    { field: "netIncome", statementType: "income_statement", value: 3_800 },
    { field: "totalAssets", statementType: "balance_sheet", value: 68_000 },
    { field: "totalEquity", statementType: "balance_sheet", value: 24_000 },
    { field: "totalLiabilities", statementType: "balance_sheet", value: 44_000 },
    { field: "currentAssets", statementType: "balance_sheet", value: 42_000 },
    { field: "currentLiabilities", statementType: "balance_sheet", value: 35_000 },
    { field: "operatingCashFlow", statementType: "cash_flow", value: 5_200 },
  ],
  VNM: [
    { field: "revenue", statementType: "income_statement", value: 61_000 },
    { field: "grossProfit", statementType: "income_statement", value: 25_000 },
    { field: "netIncome", statementType: "income_statement", value: 9_200 },
    { field: "totalAssets", statementType: "balance_sheet", value: 55_000 },
    { field: "totalEquity", statementType: "balance_sheet", value: 36_000 },
    { field: "totalLiabilities", statementType: "balance_sheet", value: 19_000 },
    { field: "currentAssets", statementType: "balance_sheet", value: 33_000 },
    { field: "currentLiabilities", statementType: "balance_sheet", value: 11_000 },
    { field: "operatingCashFlow", statementType: "cash_flow", value: 10_500 },
  ],
};

const header = [
  "ticker",
  "period",
  "periodType",
  "statementType",
  "field",
  "value",
  "unit",
  "currency",
  "sourceLabel",
  "sourceOwner",
  "sourceUrl",
  "sourceDocumentRef",
  "asOf",
  "dataMode",
  "productionApproved",
  "evidenceNote",
  "basis",
].join(",");

const evidenceNote = "Controlled local research financial data no source legal approval recorded";

const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase();

const isControlledTicker = (ticker: string): ticker is Phase109ControlledFinancialsTicker =>
  (PHASE109_CONTROLLED_FINANCIALS_TICKERS as readonly string[]).includes(ticker);

const csvRow = (ticker: Phase109ControlledFinancialsTicker, metric: ControlledFinancialsMetric): string =>
  [
    ticker,
    PHASE109_CONTROLLED_FINANCIALS_PERIOD,
    "annual",
    metric.statementType,
    metric.field,
    String(metric.value),
    metric.unit ?? "billion_vnd",
    "VND",
    PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
    "controlled_local_research",
    "",
    `phase109-inline-controlled-local-financials-${ticker.toLowerCase()}`,
    PHASE109_CONTROLLED_FINANCIALS_AS_OF,
    PHASE109_CONTROLLED_FINANCIALS_DATA_MODE,
    "false",
    evidenceNote,
    "consolidated",
  ].join(",");

export const buildPhase109ControlledFinancialsCsv = (ticker: string): string | null => {
  const normalized = normalizeTicker(ticker);
  if (!isControlledTicker(normalized)) return null;
  return [header, ...controlledFinancialsByTicker[normalized].map((metric) => csvRow(normalized, metric))].join("\n");
};

const emptyRuntimeProof = (): Phase109TickerAudit["runtimeProof"] => ({
  checked: false,
  dataMode: null,
  eps: null,
  fallbackUsed: null,
  missingFields: [],
  productionApproved: false,
  readPath: null,
  runtimeStatus: null,
  sharesOutstanding: null,
  sourceLabel: null,
});

const runtimeProofFrom = (runtime: FinancialsRuntimeData | null): Phase109TickerAudit["runtimeProof"] =>
  runtime
    ? {
        checked: true,
        dataMode: runtime.source.dataMode,
        eps: runtime.statementSnapshot?.eps ?? null,
        fallbackUsed: runtime.source.fallbackUsed,
        missingFields: runtime.dataQuality.missingFields,
        productionApproved: false,
        readPath: runtime.source.readPath,
        runtimeStatus: runtime.runtimeStatus,
        sharesOutstanding: runtime.statementSnapshot?.sharesOutstanding ?? null,
        sourceLabel: runtime.source.sourceLabel,
      }
    : emptyRuntimeProof();

const crossModuleReadinessFrom = (runtime: FinancialsRuntimeData | null): Phase109TickerAudit["crossModuleReadiness"] => {
  if (!runtime) {
    return {
      canClaimRiskDbBacked: false,
      canClaimValuationDbBacked: false,
      overviewFinancialsStatus: null,
      overviewValuationStatus: null,
      riskLeverageReadiness: null,
      riskSourceMode: null,
      valuationConsumesFinancialsRuntime: null,
      valuationMarketCapReadiness: null,
    };
  }

  const overview = buildOverviewCrossModuleReadinessSummary(runtime);
  const valuation = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData: runtime,
    valuationConsumesFinancialsRuntime: true,
  });
  const risk = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: runtime });

  return {
    canClaimRiskDbBacked: false,
    canClaimValuationDbBacked: false,
    overviewFinancialsStatus: overview.items.find((item) => item.moduleKey === "financials")?.status ?? null,
    overviewValuationStatus: overview.items.find((item) => item.moduleKey === "valuation")?.status ?? null,
    riskLeverageReadiness: risk.calculationReadiness.leverageRisk,
    riskSourceMode: risk.riskSourceMode,
    valuationConsumesFinancialsRuntime: valuation.valuationConsumesFinancialsRuntime,
    valuationMarketCapReadiness: valuation.calculationReadiness.marketCap,
  };
};

const runImport = ({
  confirmWrite,
  csvText,
  databaseUrl,
  db,
  ticker,
}: {
  confirmWrite: boolean;
  csvText: string;
  databaseUrl?: string;
  db?: FinancialStatementSafeImportMvpInput["db"];
  ticker: string;
}) =>
  runFinancialStatementSafeImportMvp({
    audit: {
      completedAt: "2026-06-22T01:05:00.000Z",
      importJobId: `phase109-controlled-financials-${ticker.toLowerCase()}`,
      startedAt: "2026-06-22T01:00:00.000Z",
    },
    confirmWrite,
    csvText,
    databaseUrl,
    db,
    dryRun: !confirmWrite,
  });

export const runPhase109ControlledFinancialsActivation = async (
  options: Phase109ControlledFinancialsActivationOptions = {},
): Promise<Phase109ControlledFinancialsActivationReport> => {
  const confirmWrite = options.confirmWrite === true;
  const requestedTickers =
    options.tickers && options.tickers.length > 0
      ? Array.from(new Set(options.tickers.map(normalizeTicker)))
      : [...PHASE109_CONTROLLED_FINANCIALS_TICKERS];

  const tickerAudits = await Promise.all(
    requestedTickers.map(async (ticker): Promise<Phase109TickerAudit> => {
      const csvText = options.csvTextByTicker?.[ticker] ?? buildPhase109ControlledFinancialsCsv(ticker);
      if (!csvText) {
        return {
          confirmWrite,
          crossModuleReadiness: crossModuleReadinessFrom(null),
          dataMode: null,
          dryRun: true,
          importResult: null,
          inputRows: 0,
          invalidRows: 0,
          productionApproved: false,
          runtimeProof: emptyRuntimeProof(),
          skippedReason: "controlled_financials_data_unavailable",
          skippedRows: 0,
          sourceLabel: null,
          ticker,
          validRows: 0,
          writtenRows: 0,
        };
      }

      const preflight = await runImport({
        confirmWrite: false,
        csvText,
        databaseUrl: options.databaseUrl ?? process.env.DATABASE_URL,
        db: options.db,
        ticker,
      });
      const shouldWrite = confirmWrite && preflight.summary.invalidRows === 0 && preflight.acceptedRows.length > 0;
      const importResult = shouldWrite
        ? await runImport({
            confirmWrite: true,
            csvText,
            databaseUrl: options.databaseUrl ?? process.env.DATABASE_URL,
            db: options.db,
            ticker,
          })
        : preflight;
      const shouldVerifyRuntime =
        options.verifyRuntimeRead === true &&
        (importResult.summary.writtenRows > 0 || importResult.summary.skippedRows > 0);
      const runtime = shouldVerifyRuntime
        ? await loadFinancialsRuntimeData(
            {
              allowFallback: false,
              dataMode: PHASE109_CONTROLLED_FINANCIALS_DATA_MODE,
              preferDb: true,
              sourceLabel: PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
              ticker,
            },
            options.runtimeDeps,
          )
        : null;

      return {
        confirmWrite,
        crossModuleReadiness: crossModuleReadinessFrom(runtime),
        dataMode: PHASE109_CONTROLLED_FINANCIALS_DATA_MODE,
        dryRun: importResult.dryRun,
        importResult,
        inputRows: importResult.summary.totalRows,
        invalidRows: importResult.summary.invalidRows,
        productionApproved: false,
        runtimeProof: runtimeProofFrom(runtime),
        skippedReason: importResult.summary.invalidRows > 0 ? "validation_failed" : null,
        skippedRows: importResult.summary.skippedRows,
        sourceLabel: PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
        ticker,
        validRows: importResult.summary.validRows,
        writtenRows: importResult.summary.writtenRows,
      };
    }),
  );

  const totals = tickerAudits.reduce(
    (sum, audit) => ({
      inputRows: sum.inputRows + audit.inputRows,
      invalidRows: sum.invalidRows + audit.invalidRows,
      skippedRows: sum.skippedRows + audit.skippedRows,
      validRows: sum.validRows + audit.validRows,
      writtenRows: sum.writtenRows + audit.writtenRows,
    }),
    { inputRows: 0, invalidRows: 0, skippedRows: 0, validRows: 0, writtenRows: 0 },
  );

  return {
    confirmWrite,
    dataMode: PHASE109_CONTROLLED_FINANCIALS_DATA_MODE,
    dryRun: !confirmWrite || tickerAudits.every((audit) => audit.dryRun),
    phase: "Phase 109",
    productionApproved: false,
    sourceLabel: PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
    tickerAudits,
    totals,
  };
};
