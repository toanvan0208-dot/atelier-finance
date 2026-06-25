import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { isLocalImportsEnabled } from "@/lib/config/local-imports-access";
import { assessFinancialStatementLocalWriteDatabaseUrl } from "./financial-statement-local-write-guard";

export const PHASE116_SOURCE_LABEL = "phase116_reviewed_financial_missing_fields" as const;
export const PHASE116_DATA_MODE = "research_only" as const;
export const PHASE116_REVIEW_STATUS = "reviewed_candidate" as const;
export const PHASE116_TICKERS = ["FPT", "MWG", "VNM"] as const;
export const PHASE116_FIELDS = ["cashAndEquivalents", "capitalExpenditure"] as const;

export type Phase116Ticker = (typeof PHASE116_TICKERS)[number];
export type Phase116Field = (typeof PHASE116_FIELDS)[number];

export type Phase116ReviewedRecord = {
  ticker: Phase116Ticker;
  field: Phase116Field;
  value: number;
  unit: "billion_vnd";
  period: string;
  asOf: string;
  sourceLabel: typeof PHASE116_SOURCE_LABEL;
  sourceType: string;
  sourceUrl: string;
  sourceDocumentTitle: string;
  sourceLineItem: string;
  rawValue: string;
  rawUnit: string;
  conversionFormula: string;
  dataMode: typeof PHASE116_DATA_MODE;
  productionApproved: false;
  reviewStatus: typeof PHASE116_REVIEW_STATUS;
  notes: string;
  rowNumber: number;
};

export type Phase116InvalidRecord = {
  rowNumber: number;
  rawRow: Record<string, string>;
  reasons: string[];
};

export type Phase116ParseResult = {
  inputRows: number;
  validRows: Phase116ReviewedRecord[];
  invalidRows: Phase116InvalidRecord[];
  warnings: string[];
};

export type Phase116Breakdown = Record<string, {
  inputRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  writtenRows: number;
}>;

export type Phase116ImportResult = {
  phase: "Phase 116";
  dryRun: boolean;
  confirmWrite: boolean;
  productionApproved: false;
  sourceLabel: typeof PHASE116_SOURCE_LABEL;
  dataMode: typeof PHASE116_DATA_MODE;
  inputRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  writtenRows: number;
  breakdownByTicker: Phase116Breakdown;
  breakdownByField: Phase116Breakdown;
  invalidRecords: Phase116InvalidRecord[];
  warnings: string[];
  errors: string[];
  databaseGuard: ReturnType<typeof assessFinancialStatementLocalWriteDatabaseUrl>;
  runtimeProof?: Phase116RuntimeProof[];
};

export type Phase116RuntimeProof = {
  ticker: Phase116Ticker;
  cashAndEquivalents: number | null;
  capitalExpenditure: number | null;
  runtimeStatus: string;
  sourceLabel: string;
  dataMode: string;
  productionApproved: false;
};

type Phase116Tx = {
  dataSource: {
    upsert: (args: unknown) => Promise<{ id: string; name: string }>;
  };
  financialStatement: {
    findFirst: (args: unknown) => Promise<{ id: string; companyId: string } | null>;
  };
  manualImportSession: {
    create: (args: unknown) => Promise<{ id: string }>;
  };
  manualImportRecord: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  };
};

export type Phase116Db = {
  $transaction: <T>(fn: (tx: Phase116Tx) => Promise<T>) => Promise<T>;
};

const REQUIRED_COLUMNS = [
  "ticker",
  "field",
  "value",
  "unit",
  "period",
  "asOf",
  "sourceLabel",
  "sourceType",
  "sourceUrl",
  "sourceDocumentTitle",
  "sourceLineItem",
  "rawValue",
  "rawUnit",
  "conversionFormula",
  "dataMode",
  "productionApproved",
  "reviewStatus",
  "notes",
] as const;

const normalizeTicker = (value: string): string => value.trim().toUpperCase();

const isTicker = (value: string): value is Phase116Ticker =>
  (PHASE116_TICKERS as readonly string[]).includes(value);

const isField = (value: string): value is Phase116Field =>
  (PHASE116_FIELDS as readonly string[]).includes(value);

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseRows = (csvText: string): Array<Record<string, string>> => {
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
};

const parseProductionApproved = (value: string): boolean | null => {
  const normalized = value.trim().toLowerCase();
  if (["false", "0", "no"].includes(normalized)) return false;
  if (["true", "1", "yes", "approved"].includes(normalized)) return true;
  return null;
};

const safeDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const sourceLooksSampleOrMock = (row: Record<string, string>): boolean =>
  ["sample", "mock", "test"].some((term) =>
    [row.sourceLabel, row.sourceType, row.sourceUrl, row.sourceDocumentTitle, row.notes].join(" ").toLowerCase().includes(term),
  );

const fieldLineIsValid = (field: Phase116Field, sourceLineItem: string): boolean => {
  const lower = sourceLineItem.toLowerCase();
  if (field === "cashAndEquivalents") {
    return lower.includes("cash and cash equivalents");
  }
  return (
    lower.includes("purchase") &&
    (lower.includes("fixed assets") || lower.includes("property, plant and equipment"))
  );
};

const fieldLineRejectReason = (field: Phase116Field): string =>
  field === "cashAndEquivalents" ? "cash_source_line_item_required" : "capex_source_line_item_required";

const validateRawRow = (row: Record<string, string>, rowNumber: number): Phase116ReviewedRecord | Phase116InvalidRecord => {
  const reasons: string[] = [];
  const ticker = normalizeTicker(row.ticker ?? "");
  const field = (row.field ?? "").trim();
  const value = Number((row.value ?? "").trim());
  const unit = (row.unit ?? "").trim();
  const sourceLineItem = row.sourceLineItem ?? "";
  const productionApproved = parseProductionApproved(row.productionApproved ?? "");

  reasons.push(...REQUIRED_COLUMNS.filter((column) => !(column in row)).map((column) => `missing_column:${column}`));
  if (!isTicker(ticker)) reasons.push("ticker_not_allowlisted");
  if (!isField(field)) reasons.push("unsupported_field");
  if (!Number.isFinite(value)) reasons.push("invalid_numeric_value");
  if (isField(field) && field === "cashAndEquivalents" && value <= 0) reasons.push("cash_value_must_be_positive");
  if (isField(field) && field === "capitalExpenditure" && value >= 0) reasons.push("capex_must_preserve_reported_cash_outflow_negative_sign");
  if (unit !== "billion_vnd") reasons.push("invalid_unit");
  if (!(row.period ?? "").trim()) reasons.push("missing_period");
  if (!(row.asOf ?? "").trim() || Number.isNaN(safeDate(row.asOf ?? "").getTime())) reasons.push("missing_or_invalid_as_of");
  if ((row.sourceLabel ?? "").trim() !== PHASE116_SOURCE_LABEL) reasons.push("source_label_must_be_phase116");
  if (!(row.sourceUrl ?? "").trim()) reasons.push("missing_source_url");
  if (!(row.sourceDocumentTitle ?? "").trim()) reasons.push("missing_source_document_title");
  if (!sourceLineItem.trim()) reasons.push("missing_source_line_item");
  if ((row.dataMode ?? "").trim() !== PHASE116_DATA_MODE) reasons.push("data_mode_must_be_research_only");
  if (productionApproved !== false) reasons.push("production_approval_not_allowed");
  if ((row.reviewStatus ?? "").trim() !== PHASE116_REVIEW_STATUS) reasons.push("review_status_must_be_reviewed_candidate");
  if (isField(field) && sourceLineItem && !fieldLineIsValid(field, sourceLineItem)) {
    reasons.push(fieldLineRejectReason(field));
  }
  if (sourceLooksSampleOrMock(row)) reasons.push("sample_mock_or_test_source_rejected");

  if (reasons.length > 0 || !isTicker(ticker) || !isField(field)) {
    return { rawRow: row, reasons: Array.from(new Set(reasons)), rowNumber };
  }

  return {
    asOf: row.asOf.trim(),
    conversionFormula: row.conversionFormula.trim(),
    dataMode: PHASE116_DATA_MODE,
    field,
    notes: row.notes.trim(),
    period: row.period.trim(),
    productionApproved: false,
    rawUnit: row.rawUnit.trim(),
    rawValue: row.rawValue.trim(),
    reviewStatus: PHASE116_REVIEW_STATUS,
    rowNumber,
    sourceDocumentTitle: row.sourceDocumentTitle.trim(),
    sourceLabel: PHASE116_SOURCE_LABEL,
    sourceLineItem: sourceLineItem.trim(),
    sourceType: row.sourceType.trim(),
    sourceUrl: row.sourceUrl.trim(),
    ticker,
    unit: "billion_vnd",
    value,
  };
};

export const parseReviewedFinancialMissingFieldsCsv = (csvText: string): Phase116ParseResult => {
  const rows = parseRows(csvText);
  const validRows: Phase116ReviewedRecord[] = [];
  const invalidRows: Phase116InvalidRecord[] = [];

  rows.forEach((row, index) => {
    const result = validateRawRow(row, index + 2);
    if ("reasons" in result) invalidRows.push(result);
    else validRows.push(result);
  });

  const seen = new Set<string>();
  for (const record of validRows) {
    const key = `${record.ticker}|${record.field}|${record.period}|${record.sourceLabel}`;
    if (seen.has(key)) {
      invalidRows.push({
        rawRow: Object.fromEntries(Object.entries(record).map(([key, value]) => [key, String(value)])),
        reasons: ["duplicate_record_key"],
        rowNumber: record.rowNumber,
      });
    }
    seen.add(key);
  }
  const duplicateRows = new Set(invalidRows.filter((row) => row.reasons.includes("duplicate_record_key")).map((row) => row.rowNumber));

  return {
    inputRows: rows.length,
    invalidRows,
    validRows: validRows.filter((record) => !duplicateRows.has(record.rowNumber)),
    warnings: [],
  };
};

const emptyBreakdown = (keys: readonly string[]): Phase116Breakdown =>
  Object.fromEntries(keys.map((key) => [
    key,
    { inputRows: 0, invalidRows: 0, skippedRows: 0, validRows: 0, writtenRows: 0 },
  ]));

const buildBreakdown = (
  parseResult: Phase116ParseResult,
  writtenRowsByKey: Record<string, number> = {},
  skippedRowsByKey: Record<string, number> = {},
) => {
  const byTicker = emptyBreakdown(PHASE116_TICKERS);
  const byField = emptyBreakdown(PHASE116_FIELDS);
  for (const record of parseResult.validRows) {
    for (const bucket of [byTicker[record.ticker], byField[record.field]]) {
      bucket.inputRows += 1;
      bucket.validRows += 1;
    }
  }
  for (const invalid of parseResult.invalidRows) {
    const ticker = normalizeTicker(invalid.rawRow.ticker ?? "");
    const field = invalid.rawRow.field ?? "";
    if (ticker in byTicker) {
      byTicker[ticker].inputRows += 1;
      byTicker[ticker].invalidRows += 1;
    }
    if (field in byField) {
      byField[field].inputRows += 1;
      byField[field].invalidRows += 1;
    }
  }
  for (const [key, count] of Object.entries(writtenRowsByKey)) {
    if (key in byTicker) byTicker[key].writtenRows += count;
    if (key in byField) byField[key].writtenRows += count;
  }
  for (const [key, count] of Object.entries(skippedRowsByKey)) {
    if (key in byTicker) byTicker[key].skippedRows += count;
    if (key in byField) byField[key].skippedRows += count;
  }
  return { byField, byTicker };
};

const resolveDb = async (db: Phase116Db | undefined): Promise<Phase116Db> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as Phase116Db;
};

const sumKeyedCounts = (counts: Record<string, number>, keys: readonly string[]): number =>
  Object.entries(counts)
    .filter(([key]) => keys.includes(key))
    .reduce((sum, [, count]) => sum + count, 0);

export const runReviewedFinancialMissingFieldsImport = async ({
  confirmWrite = false,
  csvText,
  databaseUrl = process.env.DATABASE_URL,
  db,
  verifyRuntimeRead = false,
}: {
  confirmWrite?: boolean;
  csvText: string;
  databaseUrl?: string;
  db?: Phase116Db;
  verifyRuntimeRead?: boolean;
}): Promise<Phase116ImportResult> => {
  const parseResult = parseReviewedFinancialMissingFieldsCsv(csvText);
  const databaseGuard = assessFinancialStatementLocalWriteDatabaseUrl(databaseUrl);
  const errors: string[] = [];
  const warnings = [...parseResult.warnings, ...databaseGuard.warnings];

  if (confirmWrite && process.env.ATELIER_LOCAL_IMPORTS_ENABLED !== "true") {
    errors.push("ATELIER_LOCAL_IMPORTS_ENABLED=true is required for confirmed reviewed missing-field writes.");
  }
  if (confirmWrite && !isLocalImportsEnabled()) errors.push("Local imports guard is disabled.");
  if (confirmWrite) {
    const trimmed = databaseUrl?.trim() || "";
    const isDevDb = trimmed === "file:./dev.db";
    const isLocalPostgres = (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) && (trimmed.includes("localhost") || trimmed.includes("127.0.0.1"));
    if (!isDevDb && !isLocalPostgres) {
      errors.push("DATABASE_URL must be local file:./dev.db or localhost postgresql for intended local app DB writes.");
    }
  }
  if (confirmWrite && !databaseGuard.accepted) errors.push(...databaseGuard.errors);
  if (confirmWrite && parseResult.invalidRows.length > 0) errors.push("Invalid reviewed missing-field records block confirmed write.");

  if (!confirmWrite || errors.length > 0) {
    const breakdown = buildBreakdown(parseResult);
    return {
      breakdownByField: breakdown.byField,
      breakdownByTicker: breakdown.byTicker,
      confirmWrite,
      dataMode: PHASE116_DATA_MODE,
      databaseGuard,
      dryRun: true,
      errors,
      inputRows: parseResult.inputRows,
      invalidRecords: parseResult.invalidRows,
      invalidRows: parseResult.invalidRows.length,
      phase: "Phase 116",
      productionApproved: false,
      skippedRows: 0,
      sourceLabel: PHASE116_SOURCE_LABEL,
      validRows: parseResult.validRows.length,
      warnings,
      writtenRows: 0,
    };
  }

  const client = await resolveDb(db);
  const writeResult = await client.$transaction(async (tx) => {
    await tx.dataSource.upsert({
      where: { name_sourceType: { name: PHASE116_SOURCE_LABEL, sourceType: "company_disclosure" } },
      update: {
        accessMethod: "official_download",
        cachingAllowed: "unknown",
        derivedDataAllowed: "unknown",
        licenseStatus: "needs_review",
        notes: "Reviewed official-report-based cash and capex records. Research-only; not source-approved.",
        redistributionAllowed: "unknown",
        runtimeDisplayAllowed: "unknown",
        supportedDataGroups: JSON.stringify(["financial_statement", "reviewed_missing_field"]),
        tosStatus: "needs_review",
        usageStatus: "research_only",
      },
      create: {
        accessMethod: "official_download",
        cachingAllowed: "unknown",
        derivedDataAllowed: "unknown",
        licenseStatus: "needs_review",
        name: PHASE116_SOURCE_LABEL,
        notes: "Reviewed official-report-based cash and capex records. Research-only; not source-approved.",
        redistributionAllowed: "unknown",
        runtimeDisplayAllowed: "unknown",
        sourceType: "company_disclosure",
        supportedDataGroups: JSON.stringify(["financial_statement", "reviewed_missing_field"]),
        tosStatus: "needs_review",
        usageStatus: "research_only",
      },
    });
    const session = await tx.manualImportSession.create({
      data: {
        dataMode: PHASE116_DATA_MODE,
        fileName: "phase116_reviewed_financial_missing_fields.csv",
        mode: "phase116_reviewed_missing_fields",
        readiness: "needs_review",
        rowCount: parseResult.inputRows,
        sourceLabel: PHASE116_SOURCE_LABEL,
        sourceType: "company_disclosure",
        status: "persisted",
        validRowCount: parseResult.validRows.length,
        warningRowCount: 0,
        errorRowCount: parseResult.invalidRows.length,
      },
      select: { id: true },
    });
    const writtenRowsByKey: Record<string, number> = {};
    const skippedRowsByKey: Record<string, number> = {};

    for (const record of parseResult.validRows) {
      const statement = await tx.financialStatement.findFirst({
        where: {
          dataMode: PHASE116_DATA_MODE,
          fiscalYear: Number(record.period),
          periodType: "year",
          sourceLabel: "phase109_controlled_local_financials",
          ticker: record.ticker,
        },
        select: { companyId: true, id: true },
      });
      if (!statement) {
        skippedRowsByKey[record.ticker] = (skippedRowsByKey[record.ticker] ?? 0) + 1;
        skippedRowsByKey[record.field] = (skippedRowsByKey[record.field] ?? 0) + 1;
        continue;
      }

      const existing = await tx.manualImportRecord.findFirst({
        where: {
          dataMode: PHASE116_DATA_MODE,
          financialStatementId: statement.id,
          period: record.period,
          sourceLabel: PHASE116_SOURCE_LABEL,
          ticker: record.ticker,
          normalizedPayload: { contains: `"field":"${record.field}"` },
        },
        select: { id: true },
      });
      if (existing) {
        skippedRowsByKey[record.ticker] = (skippedRowsByKey[record.ticker] ?? 0) + 1;
        skippedRowsByKey[record.field] = (skippedRowsByKey[record.field] ?? 0) + 1;
        continue;
      }

      await tx.manualImportRecord.create({
        data: {
          asOf: safeDate(record.asOf),
          companyId: statement.companyId,
          dataMode: record.dataMode,
          financialStatementId: statement.id,
          normalizedPayload: JSON.stringify(record),
          period: record.period,
          periodType: "year",
          qualityStatus: "usable_with_caution",
          rawPayload: JSON.stringify(record),
          readiness: "needs_review",
          rowIndex: record.rowNumber - 2,
          sessionId: session.id,
          sourceLabel: record.sourceLabel,
          sourceType: "company_disclosure",
          ticker: record.ticker,
        },
      });
      writtenRowsByKey[record.ticker] = (writtenRowsByKey[record.ticker] ?? 0) + 1;
      writtenRowsByKey[record.field] = (writtenRowsByKey[record.field] ?? 0) + 1;
    }

    return { skippedRowsByKey, writtenRowsByKey };
  });

  const breakdown = buildBreakdown(parseResult, writeResult.writtenRowsByKey, writeResult.skippedRowsByKey);
  const runtimeProof = verifyRuntimeRead
    ? await Promise.all(PHASE116_TICKERS.map(async (ticker) => {
        const runtime = await loadFinancialsRuntimeData({ allowFallback: false, preferDb: true, ticker });
        return {
          capitalExpenditure: runtime.statementSnapshot?.capitalExpenditure ?? null,
          cashAndEquivalents: runtime.statementSnapshot?.cashAndEquivalents ?? null,
          dataMode: runtime.source.dataMode,
          productionApproved: false as const,
          runtimeStatus: runtime.runtimeStatus,
          sourceLabel: runtime.source.sourceLabel,
          ticker,
        };
      }))
    : undefined;

  return {
    breakdownByField: breakdown.byField,
    breakdownByTicker: breakdown.byTicker,
    confirmWrite,
    dataMode: PHASE116_DATA_MODE,
    databaseGuard,
    dryRun: false,
    errors: [],
    inputRows: parseResult.inputRows,
    invalidRecords: parseResult.invalidRows,
    invalidRows: parseResult.invalidRows.length,
    phase: "Phase 116",
    productionApproved: false,
    runtimeProof,
    skippedRows: sumKeyedCounts(writeResult.skippedRowsByKey, PHASE116_FIELDS),
    sourceLabel: PHASE116_SOURCE_LABEL,
    validRows: parseResult.validRows.length,
    warnings,
    writtenRows: sumKeyedCounts(writeResult.writtenRowsByKey, PHASE116_FIELDS),
  };
};
