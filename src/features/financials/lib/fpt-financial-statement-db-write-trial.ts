import type { NormalizedFinancialStatementImportRow } from "@/lib/data-sources/financial-statement-import-contract";
import {
  getFinancialStatementSeries,
  type FinancialStatementReadServiceOptions,
  type FinancialStatementSeriesResult,
} from "@/lib/data-sources/financial-statement-read-service";
import {
  runFinancialStatementLocalWriteTrial,
  type FinancialStatementLocalWriteDb,
  type FinancialStatementLocalWriteTrialReport,
} from "@/lib/data-sources/financial-statement-local-write-service";
import { buildControlledValuationIntegrationBoundary } from "@/features/valuation/lib/controlled-valuation-integration-boundary";
import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  financialsUnitContracts,
  financialsUnitsForValuation,
  isFinancialsUnitAccepted,
  type FinancialsNumericField,
} from "./financials-unit-metadata-contract";
import {
  buildFptLocalResearchTrialFixture,
  mapValidTrialRowsToFinancialStatementDrafts,
  validateFptLocalResearchTrialRows,
  type FptLocalResearchFinancialStatementDraft,
  type FptLocalResearchTrialRow,
} from "./fpt-local-research-data-trial";

export const FPT_DB_WRITE_TRIAL_SCENARIO = "phase79_fpt_financial_statement_db_write_trial" as const;
export const FPT_DB_WRITE_TRIAL_SOURCE_BASELINE =
  "phase78_fpt_local_research_financial_statement_trial" as const;
const FPT_DB_WRITE_TRIAL_DATABASE_URL = "postgresql://research:research@localhost:5432/atelier_finance_test" as const;

export type FptFinancialStatementDbWriteTrialPayload = {
  scenario: typeof FPT_DB_WRITE_TRIAL_SCENARIO;
  sourceBaseline: typeof FPT_DB_WRITE_TRIAL_SOURCE_BASELINE;
  acceptedRows: NormalizedFinancialStatementImportRow[];
  sourceLabel: typeof FPT_DB_WRITE_TRIAL_SCENARIO;
  dataMode: "research_only";
  productionApproved: false;
  databaseUrl: string;
  confirmations: {
    confirmLocalResearchOnly: true;
    confirmNoProductionSource: true;
    confirmReviewedDryRun: true;
    confirmNoProductionDatabase: true;
  };
};

export type FptFinancialStatementDbWriteTrialValidationResult = {
  readyForDbWriteTrial: boolean;
  productionApproved: false;
  blockedReasons: string[];
  warnings: string[];
};

export type FptFinancialStatementDbWriteTrialResult = {
  scenario: typeof FPT_DB_WRITE_TRIAL_SCENARIO;
  writeReport: FinancialStatementLocalWriteTrialReport;
  readBack: FinancialStatementSeriesResult;
  valuationBoundary: ReturnType<typeof buildControlledValuationIntegrationBoundary>;
  productionApproved: false;
  dbFileCommitted: false;
};

const REQUIRED_EXPLICIT_FIELDS: FinancialsNumericField[] = [
  "revenue",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "equity",
  "totalDebt",
  "currentAssets",
  "currentLiabilities",
  "eps",
  "sharesOutstanding",
];

const PERIOD = "2024";
const FISCAL_YEAR = 2024;
const SOURCE_ROW_NUMBER = 1;

const emptyNormalizedRow = (
  draft: FptLocalResearchFinancialStatementDraft,
): Omit<NormalizedFinancialStatementImportRow, Exclude<FinancialsNumericField, "equity"> | "totalEquity"> => ({
  capitalExpenditure: null,
  cashAndEquivalents: null,
  currency: "VND",
  dataMode: "research_only",
  fiscalQuarter: null,
  fiscalYear: FISCAL_YEAR,
  grossProfit: null,
  missingFields: [],
  operatingIncome: null,
  periodType: "annual",
  productionApproved: false,
  rowIndex: 0,
  sourceLabel: FPT_DB_WRITE_TRIAL_SCENARIO,
  sourceRowNumber: SOURCE_ROW_NUMBER,
  statementDate: `${PERIOD}-12-31`,
  ticker: draft.ticker,
  totalLiabilities: null,
  unitMetadata: draft.unitMetadata,
  warnings: [
    ...draft.warnings,
    "phase_79_controlled_db_write_trial_only",
    "phase_79_no_source_approval",
  ],
});

const draftValue = (
  draft: FptLocalResearchFinancialStatementDraft,
  field: FinancialsNumericField,
): number | null => draft.values[field] ?? null;

const normalizedRowValue = (
  row: NormalizedFinancialStatementImportRow,
  field: FinancialsNumericField,
): number | null => {
  if (field === "equity") return row.totalEquity;
  return row[field];
};

export const buildFptFinancialStatementDbWriteTrialPayload = (
  rows: FptLocalResearchTrialRow[] = buildFptLocalResearchTrialFixture(),
): FptFinancialStatementDbWriteTrialPayload | null => {
  const validation = validateFptLocalResearchTrialRows(rows);
  if (!validation.readyForFutureWriteTrial) return null;

  const draft = mapValidTrialRowsToFinancialStatementDrafts(rows)[0];
  if (!draft) return null;

  const acceptedRow: NormalizedFinancialStatementImportRow = {
    ...emptyNormalizedRow(draft),
    currentAssets: draftValue(draft, "currentAssets"),
    currentLiabilities: draftValue(draft, "currentLiabilities"),
    eps: draftValue(draft, "eps"),
    netIncome: draftValue(draft, "netIncome"),
    operatingCashFlow: draftValue(draft, "operatingCashFlow"),
    revenue: draftValue(draft, "revenue"),
    sharesOutstanding: draftValue(draft, "sharesOutstanding"),
    totalAssets: draftValue(draft, "totalAssets"),
    totalDebt: draftValue(draft, "totalDebt"),
    totalEquity: draftValue(draft, "equity"),
  };

  return {
    acceptedRows: [acceptedRow],
    confirmations: {
      confirmLocalResearchOnly: true,
      confirmNoProductionDatabase: true,
      confirmNoProductionSource: true,
      confirmReviewedDryRun: true,
    },
    dataMode: "research_only",
    databaseUrl: FPT_DB_WRITE_TRIAL_DATABASE_URL,
    productionApproved: false,
    scenario: FPT_DB_WRITE_TRIAL_SCENARIO,
    sourceBaseline: FPT_DB_WRITE_TRIAL_SOURCE_BASELINE,
    sourceLabel: FPT_DB_WRITE_TRIAL_SCENARIO,
  };
};

export const validateFptFinancialStatementDbWriteTrialPayload = (
  payload: FptFinancialStatementDbWriteTrialPayload | null,
): FptFinancialStatementDbWriteTrialValidationResult => {
  const blockedReasons: string[] = [];
  const warnings = [
    "phase_79_controlled_db_write_trial_only",
    "phase_79_not_csv_importer",
    "phase_79_no_source_approval",
  ];

  if (!payload) {
    return {
      blockedReasons: ["phase78_draft_not_ready_for_db_write_trial"],
      productionApproved: false,
      readyForDbWriteTrial: false,
      warnings,
    };
  }

  if (payload.scenario !== FPT_DB_WRITE_TRIAL_SCENARIO) blockedReasons.push("scenario_mismatch");
  if (payload.sourceBaseline !== FPT_DB_WRITE_TRIAL_SOURCE_BASELINE) blockedReasons.push("source_baseline_mismatch");
  if (payload.dataMode !== "research_only") blockedReasons.push("data_mode_must_be_research_only");
  if (payload.productionApproved !== false) blockedReasons.push("production_approval_not_allowed");
  if (payload.acceptedRows.length !== 1) blockedReasons.push("single_fpt_row_required");

  const row = payload.acceptedRows[0];
  if (!row) blockedReasons.push("accepted_row_required");
  if (row?.ticker !== "FPT") blockedReasons.push("ticker_must_be_fpt");
  if (row?.fiscalYear !== FISCAL_YEAR) blockedReasons.push("period_must_be_2024");
  if (row?.periodType !== "annual") blockedReasons.push("period_type_must_be_annual");
  if (row?.productionApproved !== false) blockedReasons.push("row_production_approval_not_allowed");

  if (row) {
    for (const field of REQUIRED_EXPLICIT_FIELDS) {
      const value = normalizedRowValue(row, field);
      const metadata = row.unitMetadata[field];
      if (value === null || value === undefined) blockedReasons.push(`${field}_missing_value_blocks_db_write`);
      if (!metadata || metadata.status !== "explicit") blockedReasons.push(`${field}_missing_explicit_unit_metadata`);
      if (!metadata || metadata.unit === "unknown") blockedReasons.push(`${field}_missing_unit_blocks_db_write`);
      if (
        metadata &&
        metadata.unit !== "unknown" &&
        !isFinancialsUnitAccepted(field, metadata.unit as ValuationUnit)
      ) {
        blockedReasons.push(`${field}_invalid_unit_blocks_db_write`);
      }
      if (metadata?.productionApproved !== false) blockedReasons.push(`${field}_metadata_production_approval_not_allowed`);
    }
  }

  const uniqueBlockedReasons = Array.from(new Set(blockedReasons));

  return {
    blockedReasons: uniqueBlockedReasons,
    productionApproved: false,
    readyForDbWriteTrial: uniqueBlockedReasons.length === 0,
    warnings,
  };
};

export const runFptFinancialStatementDbWriteTrial = async (
  payload: FptFinancialStatementDbWriteTrialPayload,
  {
    readDb,
    writeDb,
  }: {
    readDb?: FinancialStatementReadServiceOptions["db"];
    writeDb?: FinancialStatementLocalWriteDb;
  } = {},
): Promise<FptFinancialStatementDbWriteTrialResult> => {
  const validation = validateFptFinancialStatementDbWriteTrialPayload(payload);
  if (!validation.readyForDbWriteTrial) {
    throw new Error(`FPT DB write trial blocked: ${validation.blockedReasons.join(", ")}`);
  }

  const writeReport = await runFinancialStatementLocalWriteTrial(
    {
      acceptedRows: payload.acceptedRows,
      confirmations: payload.confirmations,
      dataMode: payload.dataMode,
      databaseUrl: payload.databaseUrl,
      sourceLabel: payload.sourceLabel,
    },
    { db: writeDb },
  );

  const readBack = await getFinancialStatementSeries(
    {
      dataMode: payload.dataMode,
      limit: 1,
      periodType: "year",
      sourceLabel: payload.sourceLabel,
      ticker: "FPT",
    },
    { db: readDb },
  );

  const record = readBack.records[0] ?? null;
  const units = record?.unitMetadata ? financialsUnitsForValuation(record.unitMetadata) : financialsUnitsForValuation(null);
  const valuationBoundary = buildControlledValuationIntegrationBoundary({
    financialsRuntimeSnapshot: {
      asOf: record?.source.asOf,
      dataMode: record?.source.dataMode,
      equity: record?.values.totalEquity,
      eps: record?.values.eps,
      fallbackUsed: false,
      fiscalYear: record?.fiscalYear,
      period: record?.period,
      periodType: record?.periodType,
      productionApproved: false,
      readPath: "local_db",
      revenue: record?.values.revenue,
      runtimeStatus: "db_backed",
      sharesOutstanding: record?.values.sharesOutstanding,
      sourceLabel: record?.source.sourceLabel,
      units,
    },
    persistedValuationInputs: {
      marketPrice: 50_000,
      units: { marketPrice: "vnd_per_share" },
    },
  });

  return {
    dbFileCommitted: false,
    productionApproved: false,
    readBack,
    scenario: FPT_DB_WRITE_TRIAL_SCENARIO,
    valuationBoundary,
    writeReport,
  };
};

export const verifyFptFinancialStatementDbWriteTrialReadBack = (
  result: Pick<FptFinancialStatementDbWriteTrialResult, "readBack" | "valuationBoundary" | "writeReport">,
): FptFinancialStatementDbWriteTrialValidationResult => {
  const blockedReasons: string[] = [];
  const record = result.readBack.records[0] ?? null;

  if (result.writeReport.status !== "write_completed") blockedReasons.push("write_report_not_completed");
  if (result.writeReport.productionApproved !== false) blockedReasons.push("write_report_production_approval_not_false");
  if (!record) blockedReasons.push("read_back_record_missing");
  if (record?.ticker !== "FPT") blockedReasons.push("read_back_ticker_mismatch");
  if (record?.fiscalYear !== FISCAL_YEAR) blockedReasons.push("read_back_period_mismatch");
  if (record?.source.productionApproved !== false) blockedReasons.push("read_back_production_approval_not_false");

  if (record) {
    for (const field of REQUIRED_EXPLICIT_FIELDS) {
      const metadata = record.unitMetadata?.[field];
      if (!metadata || metadata.status !== "explicit") blockedReasons.push(`${field}_read_back_explicit_metadata_missing`);
      if (!metadata || metadata.unit === "unknown") blockedReasons.push(`${field}_read_back_unit_missing`);
      if (
        metadata &&
        metadata.unit !== "unknown" &&
        !isFinancialsUnitAccepted(field, metadata.unit as ValuationUnit)
      ) {
        blockedReasons.push(`${field}_read_back_unit_invalid`);
      }
    }
  }

  if (result.valuationBoundary.selectedInputs.revenue.normalizationStatus !== "ready") {
    blockedReasons.push("valuation_revenue_not_ready");
  }
  if (result.valuationBoundary.selectedInputs.equity.normalizationStatus !== "ready") {
    blockedReasons.push("valuation_equity_not_ready");
  }
  if (result.valuationBoundary.selectedInputs.sharesOutstanding.normalizationStatus !== "ready") {
    blockedReasons.push("valuation_shares_outstanding_not_ready");
  }
  if (result.valuationBoundary.selectedInputs.eps.normalizationStatus !== "ready") {
    blockedReasons.push("valuation_eps_not_ready");
  }
  if (result.valuationBoundary.sourceBoundary.canClaimValuationDbBacked !== false) {
    blockedReasons.push("valuation_db_backed_claim_not_allowed");
  }
  if (result.valuationBoundary.sourceBoundary.productionApproved !== false) {
    blockedReasons.push("valuation_production_approval_not_false");
  }

  return {
    blockedReasons: Array.from(new Set(blockedReasons)),
    productionApproved: false,
    readyForDbWriteTrial: blockedReasons.length === 0,
    warnings: [
      "phase_79_controlled_db_write_trial_only",
      "financials_db_backed_does_not_imply_valuation_fully_db_backed",
    ],
  };
};

export const phase79ExposedFunctionNames = [
  "buildFptFinancialStatementDbWriteTrialPayload",
  "validateFptFinancialStatementDbWriteTrialPayload",
  "runFptFinancialStatementDbWriteTrial",
  "verifyFptFinancialStatementDbWriteTrialReadBack",
] as const;

export const phase79ForbiddenExposureTerms = [
  "csv",
  "parser",
  "upload",
  "recommendation",
  "target",
  "fairValue",
  "riskScore",
  "dcf",
  "evEbitda",
] as const;

export const phase79RequiredExplicitFields = Object.keys(financialsUnitContracts) as FinancialsNumericField[];
