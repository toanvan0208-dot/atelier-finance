import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  REQUIRED_FINANCIAL_STATEMENT_CSV_TRIAL_COLUMNS,
  type FinancialStatementCsvTrialBasis,
  type FinancialStatementCsvTrialColumn,
  type FinancialStatementCsvTrialPeriodType,
  type FinancialStatementCsvTrialStatementType,
} from "./financial-statement-csv-import-trial-plan";

export type FinancialStatementCsvParserSupportedField =
  | "revenue"
  | "grossProfit"
  | "netIncome"
  | "totalAssets"
  | "totalLiabilities"
  | "totalEquity"
  | "cashAndEquivalents"
  | "currentAssets"
  | "currentLiabilities"
  | "operatingCashFlow"
  | "capitalExpenditure"
  | "sharesOutstanding"
  | "eps";

export type FinancialStatementCsvParserDataMode = "research_only" | "local_research" | "manual";

export type FinancialStatementCsvParsedRow = {
  ticker: string;
  period: string;
  periodType: FinancialStatementCsvTrialPeriodType;
  statementType: FinancialStatementCsvTrialStatementType;
  basis: FinancialStatementCsvTrialBasis;
  field: FinancialStatementCsvParserSupportedField;
  value: number;
  unit: ValuationUnit;
  currency: string;
  sourceLabel: string;
  sourceOwner: string;
  sourceUrl: string;
  sourceDocumentRef: string;
  asOf: string;
  dataMode: FinancialStatementCsvParserDataMode;
  productionApproved: false;
  evidenceNote: string;
  duplicateKey: string;
  writeIntent: "draft_only_no_db_write";
};

export type FinancialStatementCsvBlockedRow = {
  rowIndex: number;
  sourceRowNumber: number;
  rawRow: Partial<Record<FinancialStatementCsvTrialColumn, string>>;
  blockedReasons: string[];
  productionApproved: false;
};

export type FinancialStatementCsvDraft = {
  ticker: string;
  period: string;
  periodType: FinancialStatementCsvTrialPeriodType;
  basis: FinancialStatementCsvTrialBasis;
  sourceLabel: string;
  dataMode: FinancialStatementCsvParserDataMode;
  productionApproved: false;
  writeIntent: "draft_only_no_db_write";
  values: Partial<Record<FinancialStatementCsvParserSupportedField, number>>;
  unitMetadata: Partial<
    Record<
      FinancialStatementCsvParserSupportedField,
      {
        field: FinancialStatementCsvParserSupportedField;
        unit: ValuationUnit;
        status: "explicit";
        productionApproved: false;
        sourceLabel: string;
        dataMode: FinancialStatementCsvParserDataMode;
      }
    >
  >;
};

export type FinancialStatementCsvParserBoundaryResult = {
  ok: boolean;
  parsedRows: FinancialStatementCsvParsedRow[];
  blockedRows: FinancialStatementCsvBlockedRow[];
  drafts: FinancialStatementCsvDraft[];
  warnings: string[];
  writeIntent: "draft_only_no_db_write";
  productionApproved: false;
  noDbWrite: true;
};

const MONETARY_FIELDS = new Set<FinancialStatementCsvParserSupportedField>([
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
]);

const SUPPORTED_FIELDS = new Set<FinancialStatementCsvParserSupportedField>([
  ...MONETARY_FIELDS,
  "sharesOutstanding",
  "eps",
]);

const MONETARY_UNITS: ValuationUnit[] = ["vnd", "thousand_vnd", "million_vnd", "billion_vnd"];
const SHARE_UNITS: ValuationUnit[] = ["shares", "thousand_shares", "million_shares"];

const DATA_MODES = new Set<FinancialStatementCsvParserDataMode>(["research_only", "local_research", "manual"]);

const trim = (value: string | undefined): string => value?.trim() ?? "";

const splitLines = (csvText: string): string[] =>
  csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

const splitCsvLine = (line: string): string[] => line.split(",").map((cell) => cell.trim());

const normalizeHeader = (header: string): string => header.trim();

const isSupportedField = (value: string): value is FinancialStatementCsvParserSupportedField =>
  SUPPORTED_FIELDS.has(value as FinancialStatementCsvParserSupportedField);

const isPeriodType = (value: string): value is FinancialStatementCsvTrialPeriodType =>
  value === "annual" || value === "quarterly";

const isStatementType = (value: string): value is FinancialStatementCsvTrialStatementType =>
  value === "income_statement" || value === "balance_sheet" || value === "cash_flow";

const isBasis = (value: string): value is FinancialStatementCsvTrialBasis =>
  value === "consolidated" || value === "standalone";

const isDataMode = (value: string): value is FinancialStatementCsvParserDataMode => DATA_MODES.has(value as FinancialStatementCsvParserDataMode);

const parseProductionApproved = (value: string): boolean | null => {
  const normalized = value.trim().toLowerCase();
  if (["false", "0", "no"].includes(normalized)) return false;
  if (["true", "1", "yes", "approved"].includes(normalized)) return true;
  return null;
};

const parseStrictNumber = (value: string): { value: number | null; reason?: string } => {
  const text = value.trim();
  if (!text) return { value: null, reason: "missing_value" };
  if (!/^-?(?:\d+|\d+\.\d+)$/.test(text)) return { value: null, reason: "invalid_numeric_value" };
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return { value: null, reason: "invalid_numeric_value" };
  return { value: parsed };
};

const allowedUnitsFor = (field: FinancialStatementCsvParserSupportedField): ValuationUnit[] => {
  if (MONETARY_FIELDS.has(field)) return MONETARY_UNITS;
  if (field === "sharesOutstanding") return SHARE_UNITS;
  return ["vnd_per_share"];
};

const validateUnit = (
  field: string,
  unit: string,
): { unit: ValuationUnit | null; reasons: string[] } => {
  if (!unit || unit === "unknown") return { unit: null, reasons: ["missing_unit"] };
  if (!isSupportedField(field)) return { unit: null, reasons: [] };
  const allowed = allowedUnitsFor(field);
  if (!allowed.includes(unit as ValuationUnit)) return { unit: null, reasons: ["invalid_unit"] };
  return { unit: unit as ValuationUnit, reasons: [] };
};

const duplicateKeyFor = (row: Pick<
  FinancialStatementCsvParsedRow,
  "basis" | "field" | "period" | "periodType" | "sourceLabel" | "statementType" | "ticker"
>): string =>
  [
    row.ticker,
    row.period,
    row.periodType,
    row.statementType,
    row.field,
    row.basis,
    row.sourceLabel,
  ].join("|");

const buildDrafts = (rows: FinancialStatementCsvParsedRow[]): FinancialStatementCsvDraft[] => {
  const drafts = new Map<string, FinancialStatementCsvDraft>();

  for (const row of rows) {
    const key = [row.ticker, row.period, row.periodType, row.basis, row.sourceLabel, row.dataMode].join("|");
    const draft =
      drafts.get(key) ??
      {
        basis: row.basis,
        dataMode: row.dataMode,
        period: row.period,
        periodType: row.periodType,
        productionApproved: false as const,
        sourceLabel: row.sourceLabel,
        ticker: row.ticker,
        unitMetadata: {},
        values: {},
        writeIntent: "draft_only_no_db_write" as const,
      };

    draft.values[row.field] = row.value;
    draft.unitMetadata[row.field] = {
      dataMode: row.dataMode,
      field: row.field,
      productionApproved: false,
      sourceLabel: row.sourceLabel,
      status: "explicit",
      unit: row.unit,
    };
    drafts.set(key, draft);
  }

  return Array.from(drafts.values());
};

export const parseFinancialStatementCsvParserBoundary = (
  csvText: string,
): FinancialStatementCsvParserBoundaryResult => {
  const warnings = [
    "phase_81_parser_boundary_only",
    "draft_only_no_db_write",
    "local_research_manual_data_production_approved_false",
  ];
  const lines = splitLines(csvText);
  const parsedRows: FinancialStatementCsvParsedRow[] = [];
  const blockedRows: FinancialStatementCsvBlockedRow[] = [];

  if (lines.length === 0) {
    return {
      blockedRows: [
        {
          blockedReasons: ["empty_csv_text"],
          productionApproved: false,
          rawRow: {},
          rowIndex: 0,
          sourceRowNumber: 1,
        },
      ],
      drafts: [],
      noDbWrite: true,
      ok: false,
      parsedRows,
      productionApproved: false,
      warnings,
      writeIntent: "draft_only_no_db_write",
    };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const missingColumns = REQUIRED_FINANCIAL_STATEMENT_CSV_TRIAL_COLUMNS.filter((column) => !headers.includes(column));
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);

  if (missingColumns.length > 0 || duplicateHeaders.length > 0) {
    blockedRows.push({
      blockedReasons: [
        ...missingColumns.map((column) => `missing_required_column:${column}`),
        ...duplicateHeaders.map((column) => `duplicate_header:${column}`),
      ],
      productionApproved: false,
      rawRow: {},
      rowIndex: 0,
      sourceRowNumber: 1,
    });
  }

  const seenKeys = new Set<string>();
  const duplicateKeys = new Set<string>();

  lines.slice(1).forEach((line, rowIndex) => {
    const sourceRowNumber = rowIndex + 2;
    const cells = splitCsvLine(line);
    const rawRow = Object.fromEntries(
      headers.map((header, index) => [header, cells[index] ?? ""]),
    ) as Partial<Record<FinancialStatementCsvTrialColumn, string>>;
    const blockedReasons: string[] = [];

    if (missingColumns.length > 0) blockedReasons.push("required_columns_missing");
    if (cells.length !== headers.length) blockedReasons.push("row_cell_count_mismatch");

    const ticker = trim(rawRow.ticker).toUpperCase();
    const period = trim(rawRow.period);
    const periodType = trim(rawRow.periodType);
    const statementType = trim(rawRow.statementType);
    const field = trim(rawRow.field);
    const unitText = trim(rawRow.unit);
    const currency = trim(rawRow.currency).toUpperCase();
    const sourceLabel = trim(rawRow.sourceLabel);
    const sourceOwner = trim(rawRow.sourceOwner);
    const sourceUrl = trim(rawRow.sourceUrl);
    const sourceDocumentRef = trim(rawRow.sourceDocumentRef);
    const asOf = trim(rawRow.asOf);
    const dataMode = trim(rawRow.dataMode);
    const evidenceNote = trim(rawRow.evidenceNote);
    const basis = trim(rawRow.basis);

    if (!ticker) blockedReasons.push("missing_ticker");
    if (!period) blockedReasons.push("missing_period");
    if (!isPeriodType(periodType)) blockedReasons.push("invalid_period_type");
    if (!isStatementType(statementType)) blockedReasons.push("invalid_statement_type");
    if (!isBasis(basis)) blockedReasons.push(basis ? "invalid_basis" : "missing_basis");
    if (!isSupportedField(field)) blockedReasons.push("unsupported_field");
    if (!currency) blockedReasons.push("missing_currency");
    if (!sourceLabel || !sourceOwner || !asOf || !dataMode || !evidenceNote) {
      blockedReasons.push("missing_source_evidence");
    }
    if (!sourceUrl && !sourceDocumentRef) blockedReasons.push("missing_source_url_or_document_ref");
    if (dataMode && !isDataMode(dataMode)) blockedReasons.push("invalid_data_mode");

    const productionApproved = parseProductionApproved(trim(rawRow.productionApproved));
    if (productionApproved !== false) blockedReasons.push("production_approval_not_allowed");

    const numeric = parseStrictNumber(trim(rawRow.value));
    if (numeric.reason) blockedReasons.push(numeric.reason);

    const unit = validateUnit(field, unitText);
    blockedReasons.push(...unit.reasons);

    const maybeKey = [
      ticker,
      period,
      periodType,
      statementType,
      field,
      basis,
      sourceLabel,
    ].join("|");
    if (seenKeys.has(maybeKey)) {
      duplicateKeys.add(maybeKey);
      blockedReasons.push("duplicate_row_key");
    }
    seenKeys.add(maybeKey);

    if (
      blockedReasons.length > 0 ||
      numeric.value === null ||
      !unit.unit ||
      !isSupportedField(field) ||
      !isPeriodType(periodType) ||
      !isStatementType(statementType) ||
      !isBasis(basis) ||
      !isDataMode(dataMode)
    ) {
      blockedRows.push({
        blockedReasons: Array.from(new Set(blockedReasons)),
        productionApproved: false,
        rawRow,
        rowIndex,
        sourceRowNumber,
      });
      return;
    }

    parsedRows.push({
      asOf,
      basis,
      currency,
      dataMode,
      duplicateKey: duplicateKeyFor({ basis, field, period, periodType, sourceLabel, statementType, ticker }),
      evidenceNote,
      field,
      period,
      periodType,
      productionApproved: false,
      sourceDocumentRef,
      sourceLabel,
      sourceOwner,
      sourceUrl,
      statementType,
      ticker,
      unit: unit.unit,
      value: numeric.value,
      writeIntent: "draft_only_no_db_write",
    });
  });

  if (duplicateKeys.size > 0) {
    for (const parsedRow of parsedRows) {
      if (duplicateKeys.has(parsedRow.duplicateKey)) {
        blockedRows.push({
          blockedReasons: ["duplicate_row_key"],
          productionApproved: false,
          rawRow: {
            asOf: parsedRow.asOf,
            basis: parsedRow.basis,
            currency: parsedRow.currency,
            dataMode: parsedRow.dataMode,
            evidenceNote: parsedRow.evidenceNote,
            field: parsedRow.field,
            period: parsedRow.period,
            periodType: parsedRow.periodType,
            productionApproved: "false",
            sourceDocumentRef: parsedRow.sourceDocumentRef,
            sourceLabel: parsedRow.sourceLabel,
            sourceOwner: parsedRow.sourceOwner,
            sourceUrl: parsedRow.sourceUrl,
            statementType: parsedRow.statementType,
            ticker: parsedRow.ticker,
            unit: parsedRow.unit,
            value: String(parsedRow.value),
          },
          rowIndex: -1,
          sourceRowNumber: -1,
        });
      }
    }
  }

  const duplicateKeySet = new Set(duplicateKeys);
  const safeRows = parsedRows.filter((row) => !duplicateKeySet.has(row.duplicateKey));

  return {
    blockedRows,
    drafts: buildDrafts(safeRows),
    noDbWrite: true,
    ok: blockedRows.length === 0,
    parsedRows: safeRows,
    productionApproved: false,
    warnings,
    writeIntent: "draft_only_no_db_write",
  };
};

export const phase81CsvParserBoundaryExposedFunctionNames = [
  "parseFinancialStatementCsvParserBoundary",
] as const;

export const phase81CsvParserBoundaryForbiddenExposureTerms = [
  "write",
  "database",
  "db",
  "filesystem",
  "file",
  "upload",
  "importEndpoint",
  "recommendation",
  "target",
  "fairValue",
  "riskScore",
] as const;
