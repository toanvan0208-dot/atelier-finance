export type FinancialStatementImportPeriodType = "annual" | "quarterly" | "unknown";

export type FinancialStatementImportRow = {
  ticker?: unknown;
  fiscalYear?: unknown;
  fiscalQuarter?: unknown;
  periodType?: unknown;
  statementDate?: unknown;
  currency?: unknown;
  revenue?: unknown;
  grossProfit?: unknown;
  operatingIncome?: unknown;
  netIncome?: unknown;
  totalAssets?: unknown;
  totalLiabilities?: unknown;
  totalEquity?: unknown;
  equity?: unknown;
  currentAssets?: unknown;
  currentLiabilities?: unknown;
  cashAndEquivalents?: unknown;
  operatingCashFlow?: unknown;
  capitalExpenditure?: unknown;
  sharesOutstanding?: unknown;
  eps?: unknown;
  sourceLabel?: unknown;
  dataMode?: unknown;
  productionApproved?: unknown;
};

export type FinancialStatementImportNumericField =
  | "revenue"
  | "grossProfit"
  | "operatingIncome"
  | "netIncome"
  | "totalAssets"
  | "totalLiabilities"
  | "totalEquity"
  | "currentAssets"
  | "currentLiabilities"
  | "cashAndEquivalents"
  | "operatingCashFlow"
  | "capitalExpenditure"
  | "sharesOutstanding"
  | "eps";

export type NormalizedFinancialStatementImportRow = {
  ticker: string;
  fiscalYear: number;
  fiscalQuarter: number | null;
  periodType: FinancialStatementImportPeriodType;
  statementDate: string | null;
  currency: string | null;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  cashAndEquivalents: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  sharesOutstanding: number | null;
  eps: number | null;
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
  missingFields: string[];
  warnings: string[];
  rowIndex: number;
  sourceRowNumber: number;
};

export type FinancialStatementImportRejectedRow = {
  rowIndex: number;
  sourceRowNumber: number;
  errors: string[];
  invalidFields: string[];
  rawRow: FinancialStatementImportRow;
  productionApproved: false;
};

export type FinancialStatementImportSkippedRow = {
  rowIndex: number;
  sourceRowNumber: number;
  reason: string;
  duplicateKey?: string;
  rawRow: FinancialStatementImportRow;
  productionApproved: false;
};

export type FinancialStatementImportDryRunReport = {
  status: "completed" | "completed_with_rejections" | "failed";
  dryRun: true;
  writePlanned: false;
  noDbWrite: true;
  productionApproved: false;
  dataMode: string;
  normalizedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
  acceptedRows: NormalizedFinancialStatementImportRow[];
  rejectedRows: FinancialStatementImportRejectedRow[];
  skippedRows: FinancialStatementImportSkippedRow[];
  sourceSummary: {
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
    rowCount: number;
    acceptedTickers: string[];
  };
};

export type FinancialStatementImportDryRunOptions = {
  sourceLabel?: string;
  dataMode?: string;
};

const DEFAULT_SOURCE_LABEL = "user_provided_local_research";
const DEFAULT_DATA_MODE = "research_only";
const MIN_FISCAL_YEAR = 1990;
const MAX_FISCAL_YEAR = 2100;

const NUMERIC_FIELDS: FinancialStatementImportNumericField[] = [
  "revenue",
  "grossProfit",
  "operatingIncome",
  "netIncome",
  "totalAssets",
  "totalLiabilities",
  "totalEquity",
  "currentAssets",
  "currentLiabilities",
  "cashAndEquivalents",
  "operatingCashFlow",
  "capitalExpenditure",
  "sharesOutstanding",
  "eps",
];

const REQUIRED_REVIEW_FIELDS: FinancialStatementImportNumericField[] = [
  "revenue",
  "netIncome",
  "totalAssets",
  "totalEquity",
  "operatingCashFlow",
];

const NON_NEGATIVE_FIELDS = new Set<FinancialStatementImportNumericField>([
  "totalAssets",
  "totalLiabilities",
  "sharesOutstanding",
]);

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "");

const normalizeText = (value: unknown): string | null => {
  if (isBlank(value)) return null;
  return String(value).trim();
};

const normalizeTicker = (value: unknown): { value: string | null; error?: string } => {
  const ticker = normalizeText(value)?.toUpperCase() ?? null;
  if (!ticker) return { value: null, error: "ticker is required." };
  if (!/^[A-Z0-9._-]{1,16}$/.test(ticker)) {
    return { value: null, error: "ticker contains unsupported characters." };
  }
  return { value: ticker };
};

const normalizeFiscalYear = (value: unknown): { value: number | null; error?: string } => {
  if (isBlank(value)) return { value: null, error: "fiscalYear is required." };
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < MIN_FISCAL_YEAR || parsed > MAX_FISCAL_YEAR) {
    return { value: null, error: "fiscalYear must be an integer between 1990 and 2100." };
  }
  return { value: parsed };
};

const normalizePeriodType = (value: unknown): FinancialStatementImportPeriodType => {
  const text = normalizeText(value)?.toLowerCase();
  if (!text) return "unknown";
  if (["annual", "year", "yearly", "fy"].includes(text)) return "annual";
  if (["quarterly", "quarter", "q"].includes(text)) return "quarterly";
  return "unknown";
};

const normalizeQuarter = (
  value: unknown,
  periodType: FinancialStatementImportPeriodType,
): { value: number | null; error?: string; warning?: string } => {
  if (periodType === "annual") {
    return {
      value: null,
      warning: isBlank(value) ? undefined : "fiscalQuarter ignored for annual rows.",
    };
  }

  if (isBlank(value)) {
    return periodType === "quarterly"
      ? { value: null, error: "fiscalQuarter is required for quarterly rows." }
      : { value: null };
  }

  const parsed = typeof value === "number" ? value : Number(String(value).trim().replace(/^q/i, ""));
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
    return { value: null, error: "fiscalQuarter must be an integer from 1 to 4." };
  }
  return { value: parsed };
};

const normalizeDateText = (value: unknown): { value: string | null; error?: string } => {
  const text = normalizeText(value);
  if (!text) return { value: null };
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return { value: null, error: "statementDate is invalid." };
  return { value: parsed.toISOString().slice(0, 10) };
};

const normalizeNullableNumber = (
  field: FinancialStatementImportNumericField,
  value: unknown,
): { value: number | null; error?: string } => {
  if (isBlank(value)) return { value: null };
  const numericText = typeof value === "string" ? value.trim().replace(/,/g, "") : value;
  const parsed = typeof numericText === "number" ? numericText : Number(numericText);
  if (!Number.isFinite(parsed)) return { value: null, error: `${field} must be numeric when provided.` };
  if (NON_NEGATIVE_FIELDS.has(field) && parsed < 0) {
    return { value: null, error: `${field} cannot be negative.` };
  }
  return { value: parsed };
};

const readNumericInput = (
  row: FinancialStatementImportRow,
  field: FinancialStatementImportNumericField,
): unknown => {
  if (field === "totalEquity" && row.totalEquity === undefined) return row.equity;
  return row[field];
};

const duplicateKeyFor = (row: NormalizedFinancialStatementImportRow): string =>
  [row.ticker, row.fiscalYear, row.periodType, row.fiscalQuarter ?? "none"].join("|");

const sanitizeRawRow = (row: FinancialStatementImportRow): FinancialStatementImportRow => ({
  ...row,
  productionApproved: false,
});

const isProductionApprovalAttempt = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  return ["true", "1", "yes", "approved"].includes(value.trim().toLowerCase());
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const buildStatus = (
  rowCount: number,
  acceptedCount: number,
  rejectedCount: number,
  skippedCount: number,
): FinancialStatementImportDryRunReport["status"] => {
  if (rowCount > 0 && acceptedCount === 0 && skippedCount === 0) return "failed";
  if (rejectedCount > 0 || skippedCount > 0) return "completed_with_rejections";
  return "completed";
};

export const buildFinancialStatementImportDryRun = (
  rows: FinancialStatementImportRow[],
  options: FinancialStatementImportDryRunOptions = {},
): FinancialStatementImportDryRunReport => {
  const sourceLabel = normalizeText(options.sourceLabel) ?? DEFAULT_SOURCE_LABEL;
  const dataMode = normalizeText(options.dataMode) ?? DEFAULT_DATA_MODE;
  const acceptedRows: NormalizedFinancialStatementImportRow[] = [];
  const rejectedRows: FinancialStatementImportRejectedRow[] = [];
  const skippedRows: FinancialStatementImportSkippedRow[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((row, rowIndex) => {
    const sourceRowNumber = rowIndex + 1;
    const rowWarnings: string[] = [];
    const rowErrors: string[] = [];
    const invalidFields: string[] = [];

    const ticker = normalizeTicker(row.ticker);
    if (ticker.error) {
      rowErrors.push(ticker.error);
      invalidFields.push("ticker");
    }

    const fiscalYear = normalizeFiscalYear(row.fiscalYear);
    if (fiscalYear.error) {
      rowErrors.push(fiscalYear.error);
      invalidFields.push("fiscalYear");
    }

    const periodType = normalizePeriodType(row.periodType);
    const quarter = normalizeQuarter(row.fiscalQuarter, periodType);
    if (quarter.error) {
      rowErrors.push(quarter.error);
      invalidFields.push("fiscalQuarter");
    }
    if (quarter.warning) rowWarnings.push(quarter.warning);

    const statementDate = normalizeDateText(row.statementDate);
    if (statementDate.error) {
      rowErrors.push(statementDate.error);
      invalidFields.push("statementDate");
    }

    const values = {} as Record<FinancialStatementImportNumericField, number | null>;
    for (const field of NUMERIC_FIELDS) {
      const normalized = normalizeNullableNumber(field, readNumericInput(row, field));
      values[field] = normalized.value;
      if (normalized.error) {
        rowErrors.push(normalized.error);
        invalidFields.push(field);
      }
    }

    if (isProductionApprovalAttempt(row.productionApproved)) {
      rowWarnings.push("Input production approval was ignored; dry-run output remains unapproved.");
    }

    if (rowErrors.length > 0 || !ticker.value || fiscalYear.value === null) {
      rejectedRows.push({
        rowIndex,
        sourceRowNumber,
        errors: rowErrors,
        invalidFields: unique(invalidFields),
        rawRow: sanitizeRawRow(row),
        productionApproved: false,
      });
      errors.push(...rowErrors.map((error) => `row ${sourceRowNumber}: ${error}`));
      return;
    }

    const missingFields = REQUIRED_REVIEW_FIELDS.filter((field) => values[field] === null);
    if (missingFields.length > 0) {
      rowWarnings.push(`Missing review fields: ${missingFields.join(", ")}.`);
    }

    const normalizedRow: NormalizedFinancialStatementImportRow = {
      ticker: ticker.value,
      fiscalYear: fiscalYear.value,
      fiscalQuarter: quarter.value,
      periodType,
      statementDate: statementDate.value,
      currency: normalizeText(row.currency)?.toUpperCase() ?? null,
      revenue: values.revenue,
      grossProfit: values.grossProfit,
      operatingIncome: values.operatingIncome,
      netIncome: values.netIncome,
      totalAssets: values.totalAssets,
      totalLiabilities: values.totalLiabilities,
      totalEquity: values.totalEquity,
      currentAssets: values.currentAssets,
      currentLiabilities: values.currentLiabilities,
      cashAndEquivalents: values.cashAndEquivalents,
      operatingCashFlow: values.operatingCashFlow,
      capitalExpenditure: values.capitalExpenditure,
      sharesOutstanding: values.sharesOutstanding,
      eps: values.eps,
      sourceLabel: normalizeText(row.sourceLabel) ?? sourceLabel,
      dataMode: normalizeText(row.dataMode) ?? dataMode,
      productionApproved: false,
      missingFields,
      warnings: rowWarnings,
      rowIndex,
      sourceRowNumber,
    };

    const duplicateKey = duplicateKeyFor(normalizedRow);
    if (seenKeys.has(duplicateKey)) {
      const reason = `Duplicate financial statement dry-run row skipped for key ${duplicateKey}.`;
      skippedRows.push({
        rowIndex,
        sourceRowNumber,
        reason,
        duplicateKey,
        rawRow: sanitizeRawRow(row),
        productionApproved: false,
      });
      warnings.push(reason);
      return;
    }

    seenKeys.add(duplicateKey);
    acceptedRows.push(normalizedRow);
    warnings.push(...rowWarnings.map((warning) => `row ${sourceRowNumber}: ${warning}`));
  });

  return {
    status: buildStatus(rows.length, acceptedRows.length, rejectedRows.length, skippedRows.length),
    dryRun: true,
    writePlanned: false,
    noDbWrite: true,
    productionApproved: false,
    dataMode,
    normalizedCount: acceptedRows.length,
    acceptedCount: acceptedRows.length,
    rejectedCount: rejectedRows.length,
    skippedCount: skippedRows.length,
    warnings,
    errors,
    acceptedRows,
    rejectedRows,
    skippedRows,
    sourceSummary: {
      sourceLabel,
      dataMode,
      productionApproved: false,
      rowCount: rows.length,
      acceptedTickers: unique(acceptedRows.map((row) => row.ticker)).sort(),
    },
  };
};
