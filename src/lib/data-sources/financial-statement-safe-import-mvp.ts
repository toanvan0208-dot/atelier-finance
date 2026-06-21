import {
  buildFinancialsUnitMetadata,
  type FinancialsNumericField,
} from "@/features/financials/lib/financials-unit-metadata-contract";
import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  parseFinancialStatementCsvParserBoundary,
  type FinancialStatementCsvDraft,
  type FinancialStatementCsvParserBoundaryResult,
} from "@/features/financials/lib/financial-statement-csv-parser-boundary";
import {
  runFinancialStatementLocalWriteTrial,
  type FinancialStatementLocalWriteConfirmations,
  type FinancialStatementLocalWriteDb,
  type FinancialStatementLocalWriteTrialReport,
} from "./financial-statement-local-write-service";
import type { NormalizedFinancialStatementImportRow } from "./financial-statement-import-contract";
import {
  buildLocalImportAuditResult,
  type LocalImportAuditResult,
} from "./local-import-audit-trail";

export type FinancialStatementSafeImportMvpInput = {
  csvText: string;
  dryRun?: boolean;
  confirmWrite?: boolean;
  confirmations?: FinancialStatementLocalWriteConfirmations;
  databaseUrl?: string;
  db?: FinancialStatementLocalWriteDb;
  audit?: {
    importJobId?: string;
    startedAt?: Date | string;
    completedAt?: Date | string;
    now?: () => Date;
  };
};

export type FinancialStatementSafeImportMvpSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  writtenRows: number;
  skippedRows: number;
  warnings: string[];
  errors: string[];
  dryRun: boolean;
};

export type FinancialStatementSafeImportMvpResult = {
  status: "preview_ready" | "import_completed" | "import_completed_with_skips" | "import_rejected";
  dryRun: boolean;
  productionApproved: false;
  sourceType: "user_input";
  dataMode: "research_only";
  summary: FinancialStatementSafeImportMvpSummary;
  parserResult: FinancialStatementCsvParserBoundaryResult;
  acceptedRows: NormalizedFinancialStatementImportRow[];
  invalidRows: FinancialStatementCsvParserBoundaryResult["blockedRows"];
  writeReport: FinancialStatementLocalWriteTrialReport | null;
  audit: LocalImportAuditResult;
  valuationClaimCreated: false;
  sourceApprovalCreated: false;
};

const allConfirmations = (): Required<FinancialStatementLocalWriteConfirmations> => ({
  confirmLocalResearchOnly: true,
  confirmNoProductionDatabase: true,
  confirmNoProductionSource: true,
  confirmReviewedDryRun: true,
});

const firstParsedRowForDraft = (
  parserResult: FinancialStatementCsvParserBoundaryResult,
  draft: FinancialStatementCsvDraft,
) =>
  parserResult.parsedRows.find(
    (row) =>
      row.ticker === draft.ticker &&
      row.period === draft.period &&
      row.periodType === draft.periodType &&
      row.basis === draft.basis &&
      row.sourceLabel === draft.sourceLabel &&
      row.dataMode === draft.dataMode,
  ) ?? null;

const parseFiscalPeriod = (
  draft: FinancialStatementCsvDraft,
): { fiscalYear: number | null; fiscalQuarter: number | null; error?: string } => {
  if (draft.periodType === "annual") {
    const fiscalYear = Number(draft.period);
    if (!Number.isInteger(fiscalYear)) return { fiscalYear: null, fiscalQuarter: null, error: "annual_period_invalid" };
    return { fiscalYear, fiscalQuarter: null };
  }

  const match = /^(\d{4})Q([1-4])$/i.exec(draft.period.trim());
  if (!match) return { fiscalYear: null, fiscalQuarter: null, error: "quarterly_period_invalid" };
  return { fiscalYear: Number(match[1]), fiscalQuarter: Number(match[2]) };
};

const valueFor = (draft: FinancialStatementCsvDraft, field: keyof FinancialStatementCsvDraft["values"]): number | null =>
  draft.values[field] ?? null;

const explicitUnitsFromDraft = (draft: FinancialStatementCsvDraft): Partial<Record<FinancialsNumericField, ValuationUnit>> => {
  const pairs: Array<[FinancialsNumericField, keyof FinancialStatementCsvDraft["unitMetadata"]]> = [
    ["currentAssets", "currentAssets"],
    ["currentLiabilities", "currentLiabilities"],
    ["eps", "eps"],
    ["equity", "totalEquity"],
    ["netIncome", "netIncome"],
    ["operatingCashFlow", "operatingCashFlow"],
    ["revenue", "revenue"],
    ["sharesOutstanding", "sharesOutstanding"],
    ["totalAssets", "totalAssets"],
    ["totalDebt", "totalLiabilities"],
  ];

  return Object.fromEntries(
    pairs.flatMap(([target, source]) => {
      const unit = draft.unitMetadata[source]?.unit;
      return unit ? [[target, unit]] : [];
    }),
  ) as Partial<Record<FinancialsNumericField, ValuationUnit>>;
};

const mapDraftToAcceptedRow = (
  draft: FinancialStatementCsvDraft,
  parserResult: FinancialStatementCsvParserBoundaryResult,
  rowIndex: number,
): { row: NormalizedFinancialStatementImportRow | null; error?: string } => {
  const period = parseFiscalPeriod(draft);
  if (period.error || period.fiscalYear === null) return { row: null, error: period.error ?? "period_invalid" };

  const parsedRow = firstParsedRowForDraft(parserResult, draft);
  const missingFields = ([
    "revenue",
    "netIncome",
    "operatingCashFlow",
    "totalAssets",
    "totalEquity",
  ] as const).filter((field) => valueFor(draft, field) === null);
  const sourceLabel = draft.sourceLabel;
  const dataMode = "research_only";
  const unitMetadata = buildFinancialsUnitMetadata({
    dataMode,
    explicitUnits: explicitUnitsFromDraft(draft),
    snapshot: {
      currentAssets: valueFor(draft, "currentAssets"),
      currentLiabilities: valueFor(draft, "currentLiabilities"),
      eps: valueFor(draft, "eps"),
      netProfit: valueFor(draft, "netIncome"),
      operatingCashFlow: valueFor(draft, "operatingCashFlow"),
      revenue: valueFor(draft, "revenue"),
      sharesOutstanding: valueFor(draft, "sharesOutstanding"),
      sourceName: sourceLabel,
      totalAssets: valueFor(draft, "totalAssets"),
      totalDebt: valueFor(draft, "totalLiabilities"),
      totalEquity: valueFor(draft, "totalEquity"),
    },
    sourceLabel,
  });

  return {
    row: {
      capitalExpenditure: valueFor(draft, "capitalExpenditure"),
      cashAndEquivalents: valueFor(draft, "cashAndEquivalents"),
      currency: parsedRow?.currency ?? "VND",
      currentAssets: valueFor(draft, "currentAssets"),
      currentLiabilities: valueFor(draft, "currentLiabilities"),
      dataMode,
      eps: valueFor(draft, "eps"),
      fiscalQuarter: period.fiscalQuarter,
      fiscalYear: period.fiscalYear,
      grossProfit: valueFor(draft, "grossProfit"),
      missingFields,
      netIncome: valueFor(draft, "netIncome"),
      operatingCashFlow: valueFor(draft, "operatingCashFlow"),
      operatingIncome: null,
      periodType: draft.periodType,
      productionApproved: false,
      revenue: valueFor(draft, "revenue"),
      rowIndex,
      sharesOutstanding: valueFor(draft, "sharesOutstanding"),
      sourceLabel,
      sourceRowNumber: rowIndex + 1,
      statementDate: parsedRow?.asOf ?? null,
      ticker: draft.ticker,
      totalAssets: valueFor(draft, "totalAssets"),
      totalDebt: null,
      totalEquity: valueFor(draft, "totalEquity"),
      totalLiabilities: valueFor(draft, "totalLiabilities"),
      unitMetadata,
      warnings: [
        ...parserResult.warnings,
        `basis:${draft.basis}`,
        "local_research_manual_data_production_approved_false",
      ],
    },
  };
};

const buildSummary = ({
  dryRun,
  parserResult,
  writeReport,
  writeErrors = [],
}: {
  dryRun: boolean;
  parserResult: FinancialStatementCsvParserBoundaryResult;
  writeReport: FinancialStatementLocalWriteTrialReport | null;
  writeErrors?: string[];
}): FinancialStatementSafeImportMvpSummary => ({
  dryRun,
  errors: [
    ...parserResult.blockedRows.flatMap((row) =>
      row.blockedReasons.map((reason) => `row ${row.sourceRowNumber}: ${reason}`),
    ),
    ...writeErrors,
    ...(writeReport?.errors ?? []),
  ],
  invalidRows: parserResult.blockedRows.length,
  skippedRows: writeReport?.skippedExistingCount ?? 0,
  totalRows: parserResult.parsedRows.length + parserResult.blockedRows.length,
  validRows: parserResult.parsedRows.length,
  warnings: [...parserResult.warnings, ...(writeReport?.warnings ?? [])],
  writtenRows: writeReport?.insertedCount ?? 0,
});

const tickersForAudit = (
  acceptedRows: NormalizedFinancialStatementImportRow[],
  parserResult: FinancialStatementCsvParserBoundaryResult,
): string[] => [
  ...acceptedRows.map((row) => row.ticker),
  ...parserResult.drafts.map((draft) => draft.ticker),
];

const sourceLabelForAudit = (
  acceptedRows: NormalizedFinancialStatementImportRow[],
  parserResult: FinancialStatementCsvParserBoundaryResult,
): string =>
  acceptedRows[0]?.sourceLabel ??
  parserResult.drafts[0]?.sourceLabel ??
  "unknown";

const financialsAudit = ({
  acceptedRows,
  confirmWrite,
  input,
  parserResult,
  summary,
  writeReport,
}: {
  acceptedRows: NormalizedFinancialStatementImportRow[];
  confirmWrite: boolean;
  input: FinancialStatementSafeImportMvpInput;
  parserResult: FinancialStatementCsvParserBoundaryResult;
  summary: FinancialStatementSafeImportMvpSummary;
  writeReport: FinancialStatementLocalWriteTrialReport | null;
}) =>
  buildLocalImportAuditResult({
    completedAt: input.audit?.completedAt,
    confirmWrite,
    dryRun: summary.dryRun,
    importJobId: input.audit?.importJobId,
    importType: "financial_statement",
    now: input.audit?.now,
    sourceKind: "user_input",
    sourceLabel: sourceLabelForAudit(acceptedRows, parserResult),
    startedAt: input.audit?.startedAt,
    summary,
    tickers: tickersForAudit(acceptedRows, parserResult),
    validationFailed: acceptedRows.length === 0 && summary.invalidRows > 0,
    writeFailed: writeReport?.status === "write_failed",
  });

export const runFinancialStatementSafeImportMvp = async (
  input: FinancialStatementSafeImportMvpInput,
): Promise<FinancialStatementSafeImportMvpResult> => {
  const dryRun = input.dryRun ?? !input.confirmWrite;
  const parserResult = parseFinancialStatementCsvParserBoundary(input.csvText);
  const mappingErrors: string[] = [];
  const acceptedRows = parserResult.drafts.flatMap((draft, index) => {
    const mapped = mapDraftToAcceptedRow(draft, parserResult, index);
    if (mapped.error) {
      mappingErrors.push(`draft ${index + 1}: ${mapped.error}`);
      return [];
    }
    return mapped.row ? [mapped.row] : [];
  });

  if (dryRun || !input.confirmWrite) {
    const summary = buildSummary({ dryRun: true, parserResult, writeErrors: mappingErrors, writeReport: null });
    return {
      acceptedRows,
      audit: financialsAudit({
        acceptedRows,
        confirmWrite: input.confirmWrite === true,
        input,
        parserResult,
        summary,
        writeReport: null,
      }),
      dataMode: "research_only",
      dryRun: true,
      invalidRows: parserResult.blockedRows,
      parserResult,
      productionApproved: false,
      sourceApprovalCreated: false,
      sourceType: "user_input",
      status: "preview_ready",
      summary,
      valuationClaimCreated: false,
      writeReport: null,
    };
  }

  if (acceptedRows.length === 0 || mappingErrors.length > 0) {
    const summary = buildSummary({ dryRun: false, parserResult, writeErrors: mappingErrors, writeReport: null });
    return {
      acceptedRows,
      audit: financialsAudit({
        acceptedRows,
        confirmWrite: true,
        input,
        parserResult,
        summary,
        writeReport: null,
      }),
      dataMode: "research_only",
      dryRun: false,
      invalidRows: parserResult.blockedRows,
      parserResult,
      productionApproved: false,
      sourceApprovalCreated: false,
      sourceType: "user_input",
      status: "import_rejected",
      summary,
      valuationClaimCreated: false,
      writeReport: null,
    };
  }

  const writeReport = await runFinancialStatementLocalWriteTrial(
    {
      acceptedRows,
      confirmations: input.confirmations ?? allConfirmations(),
      dataMode: "research_only",
      databaseUrl: input.databaseUrl,
      sourceLabel: acceptedRows[0]?.sourceLabel ?? "user_provided_local_research",
    },
    { db: input.db },
  );

  const status =
    writeReport.status === "write_completed"
      ? "import_completed"
      : writeReport.status === "write_completed_with_skips"
        ? "import_completed_with_skips"
        : "import_rejected";
  const summary = buildSummary({ dryRun: false, parserResult, writeReport });

  return {
    acceptedRows,
    audit: financialsAudit({
      acceptedRows,
      confirmWrite: true,
      input,
      parserResult,
      summary,
      writeReport,
    }),
    dataMode: "research_only",
    dryRun: false,
    invalidRows: parserResult.blockedRows,
    parserResult,
    productionApproved: false,
    sourceApprovalCreated: false,
    sourceType: "user_input",
    status,
    summary,
    valuationClaimCreated: false,
    writeReport,
  };
};
