import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  financialsUnitContracts,
  isFinancialsUnitAccepted,
  type FinancialsNumericField,
} from "./financials-unit-metadata-contract";

export type FinancialStatementCsvTrialColumn =
  | "ticker"
  | "period"
  | "periodType"
  | "statementType"
  | "field"
  | "value"
  | "unit"
  | "currency"
  | "sourceLabel"
  | "sourceUrl"
  | "sourceDocumentRef"
  | "sourceOwner"
  | "asOf"
  | "dataMode"
  | "productionApproved"
  | "evidenceNote"
  | "basis";

export type FinancialStatementCsvTrialPeriodType = "annual" | "quarterly";

export type FinancialStatementCsvTrialStatementType =
  | "income_statement"
  | "balance_sheet"
  | "cash_flow";

export type FinancialStatementCsvTrialBasis = "consolidated" | "standalone";

export type FinancialStatementCsvTrialBlockedReason =
  | "missing_required_column"
  | "unsupported_field"
  | "missing_unit"
  | "invalid_unit"
  | "missing_value"
  | "missing_source_evidence"
  | "production_approval_not_allowed"
  | "unsupported_period_type"
  | "unsupported_statement_type"
  | "unsupported_basis"
  | "real_import_not_allowed_in_phase_77";

export type FinancialStatementCsvTrialPlan = {
  phase: 77;
  planOnly: true;
  realImportAllowedInPhase: false;
  dbWriteAllowedInPhase: false;
  requiredColumns: FinancialStatementCsvTrialColumn[];
  currentlySupportedFields: FinancialsNumericField[];
  candidateSourceFields: string[];
  acceptedUnitsByField: Record<FinancialsNumericField, ValuationUnit[]>;
  requiredSourceEvidenceColumns: FinancialStatementCsvTrialColumn[];
  allowedPeriodTypes: FinancialStatementCsvTrialPeriodType[];
  allowedStatementTypes: FinancialStatementCsvTrialStatementType[];
  allowedBasis: FinancialStatementCsvTrialBasis[];
  duplicateRowKey: FinancialStatementCsvTrialColumn[];
  futurePhase78Gates: string[];
  forbiddenOperations: string[];
};

export type FinancialStatementCsvTrialRowLike = Partial<
  Record<FinancialStatementCsvTrialColumn, string | number | boolean | null | undefined>
>;

export type FinancialStatementCsvTrialValidationResult = {
  readyForFutureWriteTrial: boolean;
  productionApproved: false;
  blockedReasons: FinancialStatementCsvTrialBlockedReason[];
  warnings: string[];
};

export const REQUIRED_FINANCIAL_STATEMENT_CSV_TRIAL_COLUMNS: FinancialStatementCsvTrialColumn[] = [
  "ticker",
  "period",
  "periodType",
  "statementType",
  "field",
  "value",
  "unit",
  "currency",
  "sourceLabel",
  "sourceUrl",
  "sourceDocumentRef",
  "sourceOwner",
  "asOf",
  "dataMode",
  "productionApproved",
  "evidenceNote",
  "basis",
];

export const REQUIRED_FINANCIAL_STATEMENT_CSV_SOURCE_EVIDENCE_COLUMNS: FinancialStatementCsvTrialColumn[] = [
  "sourceLabel",
  "sourceOwner",
  "asOf",
  "dataMode",
  "productionApproved",
  "evidenceNote",
];

export const CURRENTLY_SUPPORTED_FINANCIAL_STATEMENT_CSV_FIELDS = Object.keys(
  financialsUnitContracts,
) as FinancialsNumericField[];

export const CANDIDATE_FINANCIAL_STATEMENT_CSV_SOURCE_FIELDS = [
  "revenue",
  "grossProfit",
  "netIncome",
  "totalAssets",
  "totalLiabilities",
  "totalEquity",
  "cashAndEquivalents",
  "currentAssets",
  "currentLiabilities",
  "operatingCashFlow",
  "capitalExpenditure",
  "sharesOutstanding",
  "eps",
];

export const FINANCIAL_STATEMENT_CSV_TRIAL_FORBIDDEN_OPERATIONS = [
  "parse_real_csv",
  "write_database",
  "create_migration",
  "edit_prisma_schema",
  "call_external_api",
  "call_vnstock",
  "add_provider",
  "add_excel_parser",
  "add_pdf_parser",
  "add_public_upload_api",
  "add_ui",
  "add_metric",
  "claim_source_approval",
  "claim_production_ready",
];

const isSupportedField = (field: unknown): field is FinancialsNumericField =>
  typeof field === "string" && field in financialsUnitContracts;

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const hasValue = (value: unknown): boolean =>
  value !== null &&
  value !== undefined &&
  (typeof value === "boolean" || typeof value === "number" || text(value) !== "");

const isMissingValue = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value !== "number" && text(value) === "");

const productionApprovedValue = (value: unknown): boolean =>
  value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");

const hasSourceEvidence = (row: FinancialStatementCsvTrialRowLike): boolean =>
  Boolean(
    text(row.sourceLabel) &&
      text(row.sourceOwner) &&
      text(row.asOf) &&
      text(row.dataMode) &&
      text(row.evidenceNote) &&
      (text(row.sourceUrl) || text(row.sourceDocumentRef)),
  );

export const buildFinancialStatementCsvImportTrialPlan = (): FinancialStatementCsvTrialPlan => ({
  acceptedUnitsByField: Object.fromEntries(
    CURRENTLY_SUPPORTED_FINANCIAL_STATEMENT_CSV_FIELDS.map((field) => [
      field,
      financialsUnitContracts[field].acceptedUnits,
    ]),
  ) as Record<FinancialsNumericField, ValuationUnit[]>,
  allowedBasis: ["consolidated", "standalone"],
  allowedPeriodTypes: ["annual", "quarterly"],
  allowedStatementTypes: ["income_statement", "balance_sheet", "cash_flow"],
  candidateSourceFields: CANDIDATE_FINANCIAL_STATEMENT_CSV_SOURCE_FIELDS,
  currentlySupportedFields: CURRENTLY_SUPPORTED_FINANCIAL_STATEMENT_CSV_FIELDS,
  dbWriteAllowedInPhase: false,
  duplicateRowKey: ["ticker", "period", "periodType", "statementType", "field", "basis", "sourceLabel"],
  forbiddenOperations: FINANCIAL_STATEMENT_CSV_TRIAL_FORBIDDEN_OPERATIONS,
  futurePhase78Gates: [
    "Use one small controlled local research dataset, preferably one ticker first.",
    "Keep real CSV files outside the repository and do not commit raw data.",
    "Require explicit units for every supported numeric field before any write trial.",
    "Require source evidence metadata before any write trial.",
    "Run dry-run validation before any controlled write.",
    "Preserve productionApproved:false for local research/manual data.",
    "Keep missing data null and fail closed on missing or invalid units.",
  ],
  phase: 77,
  planOnly: true,
  realImportAllowedInPhase: false,
  requiredColumns: REQUIRED_FINANCIAL_STATEMENT_CSV_TRIAL_COLUMNS,
  requiredSourceEvidenceColumns: REQUIRED_FINANCIAL_STATEMENT_CSV_SOURCE_EVIDENCE_COLUMNS,
});

export const getRequiredFinancialStatementCsvTrialColumns = (): FinancialStatementCsvTrialColumn[] => [
  ...REQUIRED_FINANCIAL_STATEMENT_CSV_TRIAL_COLUMNS,
];

export const getFinancialStatementCsvImportTrialBlockedReasons = (
  row: FinancialStatementCsvTrialRowLike,
): FinancialStatementCsvTrialBlockedReason[] => {
  const reasons: FinancialStatementCsvTrialBlockedReason[] = [];
  const field = text(row.field);

  for (const column of REQUIRED_FINANCIAL_STATEMENT_CSV_TRIAL_COLUMNS) {
    if (column === "sourceUrl" || column === "sourceDocumentRef") continue;
    if (!hasValue(row[column])) reasons.push("missing_required_column");
  }

  if (!text(row.sourceUrl) && !text(row.sourceDocumentRef)) reasons.push("missing_source_evidence");
  if (!hasSourceEvidence(row)) reasons.push("missing_source_evidence");
  if (!isSupportedField(field)) reasons.push("unsupported_field");

  if (isMissingValue(row.value)) reasons.push("missing_value");
  if (!hasValue(row.unit) || text(row.unit) === "unknown") {
    reasons.push("missing_unit");
  } else if (isSupportedField(field) && !isFinancialsUnitAccepted(field, text(row.unit) as ValuationUnit)) {
    reasons.push("invalid_unit");
  }

  if (row.periodType !== "annual" && row.periodType !== "quarterly") reasons.push("unsupported_period_type");
  if (
    row.statementType !== "income_statement" &&
    row.statementType !== "balance_sheet" &&
    row.statementType !== "cash_flow"
  ) {
    reasons.push("unsupported_statement_type");
  }
  if (row.basis !== "consolidated" && row.basis !== "standalone") reasons.push("unsupported_basis");
  if (productionApprovedValue(row.productionApproved)) reasons.push("production_approval_not_allowed");

  return Array.from(new Set(reasons));
};

export const validateFinancialStatementCsvImportTrialPlan = (
  row: FinancialStatementCsvTrialRowLike,
): FinancialStatementCsvTrialValidationResult => {
  const blockedReasons = getFinancialStatementCsvImportTrialBlockedReasons(row);
  return {
    blockedReasons,
    productionApproved: false,
    readyForFutureWriteTrial: blockedReasons.length === 0,
    warnings: [
      "phase_77_plan_only_no_real_csv_import",
      "missing_values_must_remain_null",
      "units_must_not_be_inferred_from_magnitude",
      "local_research_manual_data_production_approved_false",
    ],
  };
};
