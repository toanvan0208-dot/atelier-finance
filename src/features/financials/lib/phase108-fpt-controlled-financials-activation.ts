import {
  runFinancialStatementSafeImportMvp,
  type FinancialStatementSafeImportMvpInput,
  type FinancialStatementSafeImportMvpResult,
} from "@/lib/data-sources/financial-statement-safe-import-mvp";
import { loadFinancialsRuntimeData, type LoadFinancialsRuntimeDataDeps } from "./load-financials-runtime-data";
import type { FinancialsRuntimeData } from "./financials-runtime-types";
import {
  PHASE108_FPT_CONTROLLED_FINANCIALS_AS_OF,
  PHASE108_FPT_CONTROLLED_FINANCIALS_DATA_MODE,
  PHASE108_FPT_CONTROLLED_FINANCIALS_PERIOD,
  PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL,
  PHASE108_FPT_CONTROLLED_FINANCIALS_TICKER,
} from "./phase108-fpt-controlled-financials-constants";

export type Phase108FptFinancialsActivationOptions = {
  confirmWrite?: boolean;
  databaseUrl?: string;
  verifyRuntimeRead?: boolean;
  csvText?: string;
  db?: FinancialStatementSafeImportMvpInput["db"];
  runtimeDeps?: LoadFinancialsRuntimeDataDeps;
};

export type Phase108FptFinancialsActivationReport = {
  phase: "Phase 108";
  ticker: typeof PHASE108_FPT_CONTROLLED_FINANCIALS_TICKER;
  sourceLabel: typeof PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL;
  dataMode: typeof PHASE108_FPT_CONTROLLED_FINANCIALS_DATA_MODE;
  productionApproved: false;
  confirmWrite: boolean;
  dryRun: boolean;
  inputRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  writtenRows: number;
  importResult: FinancialStatementSafeImportMvpResult;
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

const row = ({
  field,
  statementType,
  unit = "billion_vnd",
  value,
}: {
  field: string;
  statementType: "income_statement" | "balance_sheet" | "cash_flow";
  unit?: "billion_vnd";
  value: number;
}) =>
  [
    PHASE108_FPT_CONTROLLED_FINANCIALS_TICKER,
    PHASE108_FPT_CONTROLLED_FINANCIALS_PERIOD,
    "annual",
    statementType,
    field,
    String(value),
    unit,
    "VND",
    PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL,
    "controlled_local_research",
    "",
    "phase108-inline-controlled-local-financials",
    PHASE108_FPT_CONTROLLED_FINANCIALS_AS_OF,
    PHASE108_FPT_CONTROLLED_FINANCIALS_DATA_MODE,
    "false",
    evidenceNote,
    "consolidated",
  ].join(",");

export const buildPhase108FptControlledFinancialsCsv = (): string =>
  [
    header,
    row({ field: "revenue", statementType: "income_statement", value: 62_000 }),
    row({ field: "grossProfit", statementType: "income_statement", value: 24_800 }),
    row({ field: "netIncome", statementType: "income_statement", value: 8_700 }),
    row({ field: "totalAssets", statementType: "balance_sheet", value: 75_000 }),
    row({ field: "totalEquity", statementType: "balance_sheet", value: 36_000 }),
    row({ field: "totalLiabilities", statementType: "balance_sheet", value: 39_000 }),
    row({ field: "currentAssets", statementType: "balance_sheet", value: 30_000 }),
    row({ field: "currentLiabilities", statementType: "balance_sheet", value: 17_000 }),
    row({ field: "operatingCashFlow", statementType: "cash_flow", value: 9_800 }),
  ].join("\n");

const runtimeProofFrom = (runtime: FinancialsRuntimeData | null): Phase108FptFinancialsActivationReport["runtimeProof"] => ({
  checked: runtime !== null,
  dataMode: runtime?.source.dataMode ?? null,
  eps: runtime?.statementSnapshot?.eps ?? null,
  fallbackUsed: runtime?.source.fallbackUsed ?? null,
  missingFields: runtime?.dataQuality.missingFields ?? [],
  productionApproved: false,
  readPath: runtime?.source.readPath ?? null,
  runtimeStatus: runtime?.runtimeStatus ?? null,
  sharesOutstanding: runtime?.statementSnapshot?.sharesOutstanding ?? null,
  sourceLabel: runtime?.source.sourceLabel ?? null,
});

export const runPhase108FptFinancialsActivation = async (
  options: Phase108FptFinancialsActivationOptions = {},
): Promise<Phase108FptFinancialsActivationReport> => {
  const confirmWrite = options.confirmWrite === true;
  const csvText = options.csvText ?? buildPhase108FptControlledFinancialsCsv();
  const preflight = await runFinancialStatementSafeImportMvp({
    audit: {
      completedAt: "2026-06-22T00:05:00.000Z",
      importJobId: "phase108-fpt-controlled-financials",
      startedAt: "2026-06-22T00:00:00.000Z",
    },
    confirmWrite: false,
    csvText,
    databaseUrl: options.databaseUrl ?? process.env.DATABASE_URL,
    db: options.db,
    dryRun: true,
  });
  const shouldWrite = confirmWrite && preflight.summary.invalidRows === 0 && preflight.acceptedRows.length > 0;
  const importResult = shouldWrite
    ? await runFinancialStatementSafeImportMvp({
        audit: {
          completedAt: "2026-06-22T00:05:00.000Z",
          importJobId: "phase108-fpt-controlled-financials",
          startedAt: "2026-06-22T00:00:00.000Z",
        },
        confirmWrite: true,
        csvText,
        databaseUrl: options.databaseUrl ?? process.env.DATABASE_URL,
        db: options.db,
        dryRun: false,
      })
    : preflight;

  const runtime =
    options.verifyRuntimeRead === true && importResult.summary.writtenRows > 0
      ? await loadFinancialsRuntimeData(
          {
            allowFallback: false,
            dataMode: PHASE108_FPT_CONTROLLED_FINANCIALS_DATA_MODE,
            preferDb: true,
            sourceLabel: PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL,
            ticker: PHASE108_FPT_CONTROLLED_FINANCIALS_TICKER,
          },
          options.runtimeDeps,
        )
      : null;

  return {
    confirmWrite,
    dataMode: PHASE108_FPT_CONTROLLED_FINANCIALS_DATA_MODE,
    dryRun: importResult.dryRun,
    importResult,
    inputRows: importResult.summary.totalRows,
    invalidRows: importResult.summary.invalidRows,
    phase: "Phase 108",
    productionApproved: false,
    runtimeProof: runtimeProofFrom(runtime),
    skippedRows: importResult.summary.skippedRows,
    sourceLabel: PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL,
    ticker: PHASE108_FPT_CONTROLLED_FINANCIALS_TICKER,
    validRows: importResult.summary.validRows,
    writtenRows: importResult.summary.writtenRows,
  };
};
