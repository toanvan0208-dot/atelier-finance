import {
  buildFinancialStatementImportDryRun,
  type FinancialStatementImportDryRunReport,
  type FinancialStatementImportRow,
} from "./financial-statement-import-contract";

export type FinancialStatementCsvDryRunOptions = {
  sourceLabel?: string;
  dataMode?: string;
  defaultCurrency?: string;
  delimiter?: string;
  maxRows?: number;
  fileName?: string;
  strictHeaders?: boolean;
};

export type FinancialStatementCsvParseStatus = "parsed" | "parsed_with_warnings" | "failed";

export type FinancialStatementCsvDryRunReport = {
  status: FinancialStatementImportDryRunReport["status"] | "parse_failed";
  parseStatus: FinancialStatementCsvParseStatus;
  dryRun: true;
  writePlanned: false;
  noDbWrite: true;
  productionApproved: false;
  parseWarnings: string[];
  parseErrors: string[];
  detectedHeaders: string[];
  unknownHeaders: string[];
  rowCount: number;
  fileName: string | null;
  delimiter: string;
  parse: {
    status: FinancialStatementCsvParseStatus;
    rowCount: number;
    detectedHeaders: string[];
    unknownHeaders: string[];
    warnings: string[];
    errors: string[];
    fileName: string | null;
    delimiter: string;
  };
  importDryRun: FinancialStatementImportDryRunReport;
};

const HEADER_ALIASES: Record<string, keyof FinancialStatementImportRow> = {
  ticker: "ticker",
  symbol: "ticker",
  fiscalyear: "fiscalYear",
  year: "fiscalYear",
  fiscalquarter: "fiscalQuarter",
  quarter: "fiscalQuarter",
  periodtype: "periodType",
  period: "periodType",
  statementdate: "statementDate",
  reportdate: "statementDate",
  currency: "currency",
  revenue: "revenue",
  grossprofit: "grossProfit",
  operatingincome: "operatingIncome",
  netincome: "netIncome",
  totalassets: "totalAssets",
  assets: "totalAssets",
  totalliabilities: "totalLiabilities",
  liabilities: "totalLiabilities",
  totalequity: "totalEquity",
  equity: "totalEquity",
  currentassets: "currentAssets",
  currentliabilities: "currentLiabilities",
  cashandequivalents: "cashAndEquivalents",
  cash: "cashAndEquivalents",
  operatingcashflow: "operatingCashFlow",
  cfo: "operatingCashFlow",
  capitalexpenditure: "capitalExpenditure",
  capex: "capitalExpenditure",
  sharesoutstanding: "sharesOutstanding",
  eps: "eps",
  sourcelabel: "sourceLabel",
  datamode: "dataMode",
  productionapproved: "productionApproved",
};

const REQUIRED_HEADERS: Array<keyof FinancialStatementImportRow> = ["ticker", "fiscalYear"];

const normalizeHeaderKey = (header: string): string => header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeDelimiter = (delimiter: string | undefined): string => {
  if (!delimiter) return ",";
  return delimiter.length === 1 ? delimiter : ",";
};

const splitCsvRecords = (csvText: string, delimiter: string): { records: string[][]; errors: string[] } => {
  const records: string[][] = [];
  const errors: string[] = [];
  let record: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      record.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      record.push(cell.trim());
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (inQuotes) errors.push("CSV contains an unterminated quoted cell.");
  record.push(cell.trim());
  if (record.some((value) => value.length > 0)) records.push(record);

  return { records, errors };
};

const buildEmptyDryRun = (
  sourceLabel: string | undefined,
  dataMode: string | undefined,
): FinancialStatementImportDryRunReport =>
  buildFinancialStatementImportDryRun([], {
    sourceLabel,
    dataMode,
  });

const parseRowValue = (field: keyof FinancialStatementImportRow, value: string): unknown => {
  if (field !== "productionApproved") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "approved"].includes(normalized)) return true;
  if (["false", "0", "no", "unapproved"].includes(normalized)) return false;
  return value;
};

const buildParseStatus = (errors: string[], warnings: string[]): FinancialStatementCsvParseStatus => {
  if (errors.length > 0) return "failed";
  if (warnings.length > 0) return "parsed_with_warnings";
  return "parsed";
};

export const buildFinancialStatementCsvDryRun = (
  csvText: string,
  options: FinancialStatementCsvDryRunOptions = {},
): FinancialStatementCsvDryRunReport => {
  const delimiter = normalizeDelimiter(options.delimiter);
  const parseWarnings: string[] = [];
  const parseErrors: string[] = [];
  const { records, errors } = splitCsvRecords(csvText, delimiter);
  parseErrors.push(...errors);

  if (records.length === 0) {
    parseErrors.push("CSV text is empty or contains no non-blank rows.");
  }

  const detectedHeaders = records[0]?.map((header) => header.trim()) ?? [];
  if (detectedHeaders.length > 0 && detectedHeaders.some((header) => header.length === 0)) {
    parseErrors.push("CSV header row contains an empty column.");
  }

  const mappedHeaders = detectedHeaders.map((header) => HEADER_ALIASES[normalizeHeaderKey(header)] ?? null);
  const unknownHeaders = detectedHeaders.filter((header, index) => mappedHeaders[index] === null);

  if (unknownHeaders.length > 0) {
    parseWarnings.push(`Unknown CSV headers ignored: ${unknownHeaders.join(", ")}.`);
    if (options.strictHeaders) parseErrors.push("CSV contains unknown headers while strictHeaders is enabled.");
  }

  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!mappedHeaders.includes(requiredHeader)) {
      parseWarnings.push(`Missing required CSV header: ${requiredHeader}.`);
    }
  }

  const dataRecords = records.slice(1);
  const maxRows = options.maxRows && Number.isFinite(options.maxRows) ? Math.max(0, Math.floor(options.maxRows)) : null;
  const limitedRecords = maxRows === null ? dataRecords : dataRecords.slice(0, maxRows);
  if (maxRows !== null && dataRecords.length > maxRows) {
    parseWarnings.push(`CSV row count exceeded maxRows; parsed first ${maxRows} data rows.`);
  }

  const rows = limitedRecords.map((values, rowIndex) => {
    if (values.length !== detectedHeaders.length) {
      parseWarnings.push(
        `CSV row ${rowIndex + 2} has ${values.length} cells but header has ${detectedHeaders.length}.`,
      );
    }

    const row = mappedHeaders.reduce<FinancialStatementImportRow>((record, field, headerIndex) => {
      if (!field) return record;
      record[field] = parseRowValue(field, values[headerIndex] ?? "");
      return record;
    }, {});

    if (options.defaultCurrency && (row.currency === undefined || row.currency === "")) {
      row.currency = options.defaultCurrency;
    }

    return row;
  });

  const parseStatus = buildParseStatus(parseErrors, parseWarnings);
  const importDryRun =
    parseStatus === "failed"
      ? buildEmptyDryRun(options.sourceLabel, options.dataMode)
      : buildFinancialStatementImportDryRun(rows, {
          sourceLabel: options.sourceLabel,
          dataMode: options.dataMode,
        });

  return {
    status: parseStatus === "failed" ? "parse_failed" : importDryRun.status,
    parseStatus,
    dryRun: true,
    writePlanned: false,
    noDbWrite: true,
    productionApproved: false,
    parseWarnings,
    parseErrors,
    detectedHeaders,
    unknownHeaders,
    rowCount: rows.length,
    fileName: options.fileName ?? null,
    delimiter,
    parse: {
      status: parseStatus,
      rowCount: rows.length,
      detectedHeaders,
      unknownHeaders,
      warnings: parseWarnings,
      errors: parseErrors,
      fileName: options.fileName ?? null,
      delimiter,
    },
    importDryRun,
  };
};
