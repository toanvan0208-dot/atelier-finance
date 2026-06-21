import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  buildFinancialsUnitMetadata,
  financialsUnitContracts,
  financialsUnitsForValuation,
  isFinancialsUnitAccepted,
  type FinancialsNumericField,
  type FinancialsUnitMetadataMap,
} from "./financials-unit-metadata-contract";
import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";
import {
  buildFinancialStatementCsvImportTrialPlan,
  validateFinancialStatementCsvImportTrialPlan,
  type FinancialStatementCsvTrialBasis,
  type FinancialStatementCsvTrialPeriodType,
  type FinancialStatementCsvTrialStatementType,
} from "./financial-statement-csv-import-trial-plan";

export type FptLocalResearchTrialField = FinancialsNumericField;

export type FptLocalResearchTrialRow = {
  ticker: "FPT";
  period: "2024";
  periodType: FinancialStatementCsvTrialPeriodType;
  statementType: FinancialStatementCsvTrialStatementType;
  field: FptLocalResearchTrialField;
  value: number | null;
  unit: ValuationUnit | "unknown" | null;
  currency: "VND";
  sourceLabel: "phase78_fpt_local_research_financial_statement_trial";
  sourceUrl: "";
  sourceDocumentRef: string;
  sourceOwner: "user_provided_local_research";
  asOf: "2026-06-21";
  dataMode: "research_only";
  productionApproved: false;
  evidenceNote: string;
  basis: FinancialStatementCsvTrialBasis;
};

export type FptLocalResearchTrialValidationStatus = "ready_for_future_write_trial" | "blocked";

export type FptLocalResearchTrialValidationResult = {
  status: FptLocalResearchTrialValidationStatus;
  readyForFutureWriteTrial: boolean;
  productionApproved: false;
  blockedReasons: string[];
  warnings: string[];
  rowCount: number;
  ticker: "FPT" | "invalid";
  basis: FinancialStatementCsvTrialBasis | "mixed" | "missing";
};

export type FptLocalResearchFinancialStatementDraft = {
  writeIntent: "draft_only_no_db_write";
  ticker: "FPT";
  period: "2024";
  periodType: "year";
  basis: FinancialStatementCsvTrialBasis;
  dataMode: "research_only";
  sourceLabel: "phase78_fpt_local_research_financial_statement_trial";
  asOf: "2026-06-21";
  productionApproved: false;
  values: Partial<Record<FinancialsNumericField, number | null>>;
  unitMetadata: FinancialsUnitMetadataMap;
  valuationUnits: ReturnType<typeof financialsUnitsForValuation>;
  warnings: string[];
};

export type FptLocalResearchPreWriteChecklistItem = {
  id: string;
  passed: boolean;
  message: string;
};

const SOURCE_LABEL = "phase78_fpt_local_research_financial_statement_trial" as const;
const SOURCE_DOCUMENT_REF = "phase78-inline-test-fixture-no-raw-csv" as const;
const EVIDENCE_NOTE =
  "Inline local research trial fixture; not official, not realtime, not source-approved, not for investment decision.";

const row = ({
  field,
  statementType,
  unit,
  value,
}: {
  field: FptLocalResearchTrialField;
  statementType: FinancialStatementCsvTrialStatementType;
  unit: ValuationUnit;
  value: number;
}): FptLocalResearchTrialRow => ({
  asOf: "2026-06-21",
  basis: "consolidated",
  currency: "VND",
  dataMode: "research_only",
  evidenceNote: EVIDENCE_NOTE,
  field,
  period: "2024",
  periodType: "annual",
  productionApproved: false,
  sourceDocumentRef: SOURCE_DOCUMENT_REF,
  sourceLabel: SOURCE_LABEL,
  sourceOwner: "user_provided_local_research",
  sourceUrl: "",
  statementType,
  ticker: "FPT",
  unit,
  value,
});

export const buildFptLocalResearchTrialFixture = (): FptLocalResearchTrialRow[] => [
  row({ field: "revenue", statementType: "income_statement", unit: "billion_vnd", value: 60_000 }),
  row({ field: "netIncome", statementType: "income_statement", unit: "billion_vnd", value: 8_000 }),
  row({ field: "eps", statementType: "income_statement", unit: "vnd_per_share", value: 5_000 }),
  row({ field: "totalAssets", statementType: "balance_sheet", unit: "billion_vnd", value: 70_000 }),
  row({ field: "equity", statementType: "balance_sheet", unit: "billion_vnd", value: 35_000 }),
  row({ field: "totalDebt", statementType: "balance_sheet", unit: "billion_vnd", value: 12_000 }),
  row({ field: "currentAssets", statementType: "balance_sheet", unit: "billion_vnd", value: 25_000 }),
  row({ field: "currentLiabilities", statementType: "balance_sheet", unit: "billion_vnd", value: 14_000 }),
  row({ field: "operatingCashFlow", statementType: "cash_flow", unit: "billion_vnd", value: 9_000 }),
  row({ field: "sharesOutstanding", statementType: "balance_sheet", unit: "million_shares", value: 1_500 }),
];

const basisFor = (rows: FptLocalResearchTrialRow[]): FptLocalResearchTrialValidationResult["basis"] => {
  const basisValues = Array.from(new Set(rows.map((item) => item.basis).filter(Boolean)));
  if (basisValues.length === 0) return "missing";
  if (basisValues.length > 1) return "mixed";
  return basisValues[0] as FinancialStatementCsvTrialBasis;
};

const duplicateKeys = (rows: FptLocalResearchTrialRow[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of rows) {
    const key = [
      item.ticker,
      item.period,
      item.periodType,
      item.statementType,
      item.field,
      item.basis,
      item.sourceLabel,
    ].join("|");
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }

  return Array.from(duplicates);
};

export const validateFptLocalResearchTrialRows = (
  rows: FptLocalResearchTrialRow[],
): FptLocalResearchTrialValidationResult => {
  const plan = buildFinancialStatementCsvImportTrialPlan();
  const blockedReasons: string[] = [];
  const warnings = [
    "phase_78_trial_only_no_real_csv_import",
    "phase_78_no_db_write",
    "local_research_data_production_approved_false",
  ];

  if (rows.length === 0) blockedReasons.push("empty_trial_fixture");
  if (rows.some((item) => item.ticker !== "FPT")) blockedReasons.push("ticker_must_be_fpt");
  if (rows.some((item) => item.dataMode !== "research_only")) blockedReasons.push("data_mode_must_be_research_only");
  if (rows.some((item) => item.productionApproved !== false)) {
    blockedReasons.push("production_approval_not_allowed");
  }
  if (basisFor(rows) === "missing") blockedReasons.push("basis_required");
  if (basisFor(rows) === "mixed") blockedReasons.push("mixed_basis_requires_future_reconciliation");
  if (rows.some((item) => !item.basis)) blockedReasons.push("basis_required");
  if (duplicateKeys(rows).length > 0) blockedReasons.push("duplicate_trial_row");

  for (const item of rows) {
    const rowValidation = validateFinancialStatementCsvImportTrialPlan(item);
    blockedReasons.push(...rowValidation.blockedReasons.map((reason) => `${item.field}_${reason}`));
    if (!plan.currentlySupportedFields.includes(item.field)) blockedReasons.push(`${item.field}_unsupported_field`);
    if (item.value === null) blockedReasons.push(`${item.field}_missing_value`);
    if (!item.unit || item.unit === "unknown") blockedReasons.push(`${item.field}_missing_unit`);
    if (
      item.field in financialsUnitContracts &&
      item.unit &&
      item.unit !== "unknown" &&
      !isFinancialsUnitAccepted(item.field, item.unit)
    ) {
      blockedReasons.push(`${item.field}_invalid_unit`);
    }
  }

  const uniqueBlockedReasons = Array.from(new Set(blockedReasons));

  return {
    basis: basisFor(rows),
    blockedReasons: uniqueBlockedReasons,
    productionApproved: false,
    readyForFutureWriteTrial: uniqueBlockedReasons.length === 0,
    rowCount: rows.length,
    status: uniqueBlockedReasons.length === 0 ? "ready_for_future_write_trial" : "blocked",
    ticker: rows.every((item) => item.ticker === "FPT") ? "FPT" : "invalid",
    warnings,
  };
};

const snapshotFromRows = (rows: FptLocalResearchTrialRow[]): FinancialsStatementSnapshot => {
  const valueFor = (field: FinancialsNumericField): number | null =>
    rows.find((item) => item.field === field)?.value ?? null;

  return {
    currentAssets: valueFor("currentAssets"),
    currentLiabilities: valueFor("currentLiabilities"),
    eps: valueFor("eps"),
    netProfit: valueFor("netIncome"),
    operatingCashFlow: valueFor("operatingCashFlow"),
    revenue: valueFor("revenue"),
    sharesOutstanding: valueFor("sharesOutstanding"),
    sourceName: SOURCE_LABEL,
    totalAssets: valueFor("totalAssets"),
    totalDebt: valueFor("totalDebt"),
    totalEquity: valueFor("equity"),
  };
};

export const mapValidTrialRowsToFinancialStatementDrafts = (
  rows: FptLocalResearchTrialRow[],
): FptLocalResearchFinancialStatementDraft[] => {
  const validation = validateFptLocalResearchTrialRows(rows);
  if (!validation.readyForFutureWriteTrial) return [];

  const explicitUnits = Object.fromEntries(rows.map((item) => [item.field, item.unit])) as Partial<
    Record<FinancialsNumericField, ValuationUnit>
  >;
  const unitMetadata = buildFinancialsUnitMetadata({
    dataMode: "research_only",
    explicitUnits,
    snapshot: snapshotFromRows(rows),
    sourceLabel: SOURCE_LABEL,
  });

  return [
    {
      asOf: "2026-06-21",
      basis: validation.basis === "mixed" || validation.basis === "missing" ? "consolidated" : validation.basis,
      dataMode: "research_only",
      period: "2024",
      periodType: "year",
      productionApproved: false,
      sourceLabel: SOURCE_LABEL,
      ticker: "FPT",
      unitMetadata,
      valuationUnits: financialsUnitsForValuation(unitMetadata),
      values: Object.fromEntries(rows.map((item) => [item.field, item.value])) as Partial<
        Record<FinancialsNumericField, number | null>
      >,
      warnings: validation.warnings,
      writeIntent: "draft_only_no_db_write",
    },
  ];
};

export const buildFptLocalResearchPreWriteChecklist = (
  rows: FptLocalResearchTrialRow[] = buildFptLocalResearchTrialFixture(),
): FptLocalResearchPreWriteChecklistItem[] => {
  const validation = validateFptLocalResearchTrialRows(rows);
  const draft = mapValidTrialRowsToFinancialStatementDrafts(rows)[0] ?? null;

  return [
    {
      id: "one_ticker_fpt",
      message: "Trial fixture is limited to FPT only.",
      passed: validation.ticker === "FPT",
    },
    {
      id: "explicit_units",
      message: "Every row has explicit accepted unit metadata.",
      passed: !validation.blockedReasons.some((reason) => reason.includes("unit")),
    },
    {
      id: "source_evidence",
      message: "Every row has local research source/evidence metadata.",
      passed: !validation.blockedReasons.some((reason) => reason.includes("source")),
    },
    {
      id: "draft_only",
      message: "Rows map only to draft/write-intent objects and do not write DB.",
      passed: draft?.writeIntent === "draft_only_no_db_write",
    },
    {
      id: "production_approved_false",
      message: "Local research data remains productionApproved:false.",
      passed: validation.productionApproved === false && draft?.productionApproved === false,
    },
  ];
};
