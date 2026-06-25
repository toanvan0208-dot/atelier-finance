import { isLocalImportsEnabled } from "@/lib/config/local-imports-access";
import { isFinancialsUnitAccepted, type FinancialsNumericField } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { TraceableInputCandidate, TraceableInputField } from "@/features/watchlist/lib/traceable-input-source-decisions";
import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import { assessFinancialStatementLocalWriteDatabaseUrl } from "./financial-statement-local-write-guard";

export const PHASE114_REVIEWED_SOURCE_LABEL = "manual_reviewed_financial_statement_2024" as const;
export const PHASE114_REVIEWED_DATA_MODE = "research_only" as const;
export const PHASE114_REVIEW_STATUS = "reviewed_candidate" as const;
export const PHASE114_REVIEWED_TICKERS = ["FPT", "MWG", "VNM", "HPG", "VCB", "MSN"] as const;
export const PHASE114_REVIEWED_FIELDS = ["totalDebt", "eps", "sharesOutstanding"] as const;

export type Phase114ReviewedTicker = (typeof PHASE114_REVIEWED_TICKERS)[number];
export type Phase114ReviewedField = (typeof PHASE114_REVIEWED_FIELDS)[number];

export type Phase114ReviewedSourceRecord = {
  ticker: Phase114ReviewedTicker;
  field: Phase114ReviewedField;
  value: number;
  unit: ValuationUnit;
  period: string;
  asOf: string;
  sourceLabel: string;
  sourceType: string;
  sourceUrl: string;
  sourceDocumentTitle: string;
  sourceLineItem: string;
  rawValue: string;
  rawUnit: string;
  conversionFormula: string;
  dataMode: typeof PHASE114_REVIEWED_DATA_MODE;
  productionApproved: false;
  reviewStatus: typeof PHASE114_REVIEW_STATUS;
  notes: string;
  rowNumber: number;
};

export type Phase114InvalidRecord = {
  rowNumber: number;
  rawRow: Record<string, string>;
  reasons: string[];
};

export type Phase114ReviewedSourceRecordParseResult = {
  inputRows: number;
  validRows: Phase114ReviewedSourceRecord[];
  invalidRows: Phase114InvalidRecord[];
  warnings: string[];
};

export type Phase114ImportAuditBreakdown = Record<string, { inputRows: number; validRows: number; invalidRows: number; skippedRows: number; writtenRows: number }>;

export type Phase114ReviewedSourceRecordImportResult = {
  phase: "Phase 114";
  dryRun: boolean;
  confirmWrite: boolean;
  productionApproved: false;
  sourceLabel: string | null;
  dataMode: typeof PHASE114_REVIEWED_DATA_MODE | null;
  inputRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  writtenRows: number;
  breakdownByTicker: Phase114ImportAuditBreakdown;
  breakdownByField: Phase114ImportAuditBreakdown;
  invalidRecords: Phase114InvalidRecord[];
  warnings: string[];
  errors: string[];
  databaseGuard: ReturnType<typeof assessFinancialStatementLocalWriteDatabaseUrl>;
  runtimeProof?: Phase114RuntimeProof[];
};

export type Phase114RuntimeProof = {
  ticker: Phase114ReviewedTicker;
  totalDebt: TraceableInputCandidate | null;
  eps: TraceableInputCandidate | null;
  sharesOutstanding: TraceableInputCandidate | null;
};

type StoredFinancialStatement = {
  id: string;
  totalDebt: unknown;
  eps: unknown;
  sharesOutstanding: unknown;
};

type ReviewedSourceRecordImportTx = {
  dataSource: {
    upsert: (args: unknown) => Promise<{ id: string; name: string }>;
  };
  company: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<{ id: string }>;
  };
  financialStatement: {
    findFirst: (args: unknown) => Promise<StoredFinancialStatement | null>;
    create: (args: unknown) => Promise<{ id: string }>;
    update: (args: unknown) => Promise<{ id: string }>;
  };
  financialStatementUnitMetadata: {
    upsert: (args: unknown) => Promise<unknown>;
  };
  manualImportSession: {
    create: (args: unknown) => Promise<{ id: string }>;
  };
  manualImportRecord: {
    create: (args: unknown) => Promise<unknown>;
  };
};

export type ReviewedSourceRecordImportDb = {
  $transaction: <T>(fn: (tx: ReviewedSourceRecordImportTx) => Promise<T>) => Promise<T>;
  financialStatement?: {
    findMany: (args: unknown) => Promise<Array<{
      ticker: string;
      period: string;
      fiscalYear: number | null;
      asOf: Date | string;
      sourceLabel: string;
      dataMode: string;
      totalDebt: unknown;
      eps: unknown;
      sharesOutstanding: unknown;
      unitMetadata?: Array<{ field: string; unit: string; status: string; sourceLabel: string | null; dataMode: string | null; productionApproved: boolean }>;
    }>>;
  };
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

const FIELD_TO_UNIT: Record<Phase114ReviewedField, ValuationUnit> = {
  eps: "vnd_per_share",
  sharesOutstanding: "shares",
  totalDebt: "billion_vnd",
};

const FIELD_TO_NUMERIC_FIELD: Record<Phase114ReviewedField, FinancialsNumericField> = {
  eps: "eps",
  sharesOutstanding: "sharesOutstanding",
  totalDebt: "totalDebt",
};

const safeDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const normalizeTicker = (value: string): string => value.trim().toUpperCase();

const isReviewedTicker = (value: string): value is Phase114ReviewedTicker =>
  (PHASE114_REVIEWED_TICKERS as readonly string[]).includes(value);

const isReviewedField = (value: string): value is Phase114ReviewedField =>
  (PHASE114_REVIEWED_FIELDS as readonly string[]).includes(value);

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
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

const parseCsvRows = (csvText: string): Array<Record<string, string>> => {
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

const sourceLineUsesLiabilitiesAsDebt = (value: string): boolean => {
  const lower = value.toLowerCase();
  return lower.includes("total liabilities") || lower.includes("liabilities only") || lower.includes("nợ phải trả");
};

const sourceLooksSampleOrMock = (row: Record<string, string>): boolean =>
  ["sample", "mock", "test"].some((term) =>
    [row.sourceLabel, row.sourceType, row.sourceUrl, row.sourceDocumentTitle, row.notes].join(" ").toLowerCase().includes(term),
  );

const validateRawRow = (row: Record<string, string>, rowNumber: number): Phase114ReviewedSourceRecord | Phase114InvalidRecord => {
  const reasons: string[] = [];
  const ticker = normalizeTicker(row.ticker ?? "");
  const field = (row.field ?? "").trim();
  const value = Number((row.value ?? "").trim());
  const unit = (row.unit ?? "").trim() as ValuationUnit;
  const productionApproved = parseProductionApproved(row.productionApproved ?? "");

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !(column in row));
  reasons.push(...missingColumns.map((column) => `missing_column:${column}`));
  if (!isReviewedTicker(ticker)) reasons.push("ticker_not_allowlisted");
  if (!isReviewedField(field)) reasons.push("unsupported_field");
  if (!Number.isFinite(value) || value <= 0) reasons.push("value_must_be_positive");
  if (isReviewedField(field) && unit !== FIELD_TO_UNIT[field]) reasons.push("invalid_unit");
  if (isReviewedField(field) && !isFinancialsUnitAccepted(FIELD_TO_NUMERIC_FIELD[field], unit)) reasons.push("unit_contract_rejected");
  if (!(row.period ?? "").trim()) reasons.push("missing_period");
  if (!(row.asOf ?? "").trim() || Number.isNaN(safeDate(row.asOf ?? "").getTime())) reasons.push("missing_or_invalid_as_of");
  if (!(row.sourceLabel ?? "").trim()) reasons.push("missing_source_label");
  if (!(row.sourceUrl ?? "").trim()) reasons.push("missing_source_url");
  if (!(row.sourceDocumentTitle ?? "").trim()) reasons.push("missing_source_document_title");
  if (!(row.sourceLineItem ?? "").trim()) reasons.push("missing_source_line_item");
  if ((row.dataMode ?? "").trim() !== PHASE114_REVIEWED_DATA_MODE) reasons.push("data_mode_must_be_research_only");
  if (productionApproved !== false) reasons.push("production_approval_not_allowed");
  if ((row.reviewStatus ?? "").trim() !== PHASE114_REVIEW_STATUS) reasons.push("review_status_must_be_reviewed_candidate");
  if (isReviewedField(field) && field === "totalDebt" && sourceLineUsesLiabilitiesAsDebt(row.sourceLineItem ?? "")) {
    reasons.push("total_debt_source_line_item_cannot_be_total_liabilities");
  }
  if (sourceLooksSampleOrMock(row)) reasons.push("sample_mock_or_test_source_rejected");

  if (reasons.length > 0 || !isReviewedTicker(ticker) || !isReviewedField(field)) {
    return { rawRow: row, reasons: Array.from(new Set(reasons)), rowNumber };
  }

  return {
    asOf: row.asOf.trim(),
    conversionFormula: row.conversionFormula.trim(),
    dataMode: PHASE114_REVIEWED_DATA_MODE,
    field,
    notes: row.notes.trim(),
    period: row.period.trim(),
    productionApproved: false,
    rawUnit: row.rawUnit.trim(),
    rawValue: row.rawValue.trim(),
    reviewStatus: PHASE114_REVIEW_STATUS,
    rowNumber,
    sourceDocumentTitle: row.sourceDocumentTitle.trim(),
    sourceLabel: row.sourceLabel.trim(),
    sourceLineItem: row.sourceLineItem.trim(),
    sourceType: row.sourceType.trim(),
    sourceUrl: row.sourceUrl.trim(),
    ticker,
    unit,
    value,
  };
};

export const parseReviewedSourceRecordsCsv = (csvText: string): Phase114ReviewedSourceRecordParseResult => {
  const rows = parseCsvRows(csvText);
  const validRows: Phase114ReviewedSourceRecord[] = [];
  const invalidRows: Phase114InvalidRecord[] = [];
  const warnings: string[] = [];

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
    warnings,
  };
};

const emptyBreakdown = (keys: readonly string[]): Phase114ImportAuditBreakdown =>
  Object.fromEntries(keys.map((key) => [
    key,
    { inputRows: 0, invalidRows: 0, skippedRows: 0, validRows: 0, writtenRows: 0 },
  ]));

const buildBreakdown = (
  parseResult: Phase114ReviewedSourceRecordParseResult,
  writtenRowsByKey: Record<string, number> = {},
  skippedRowsByKey: Record<string, number> = {},
) => {
  const byTicker = emptyBreakdown(PHASE114_REVIEWED_TICKERS);
  const byField = emptyBreakdown(PHASE114_REVIEWED_FIELDS);
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

const groupedByTicker = (records: Phase114ReviewedSourceRecord[]) => {
  const grouped = new Map<Phase114ReviewedTicker, Partial<Record<Phase114ReviewedField, Phase114ReviewedSourceRecord>>>();
  for (const record of records) {
    const group = grouped.get(record.ticker) ?? {};
    group[record.field] = record;
    grouped.set(record.ticker, group);
  }
  return grouped;
};

const numberFromStored = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && value && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const fieldValue = (row: StoredFinancialStatement | null, field: Phase114ReviewedField): number | null =>
  row ? numberFromStored(row[field]) : null;

const sameNumber = (left: number | null, right: number): boolean => left !== null && Math.abs(left - right) < 0.000001;

const resolveDb = async (db: ReviewedSourceRecordImportDb | undefined): Promise<ReviewedSourceRecordImportDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as ReviewedSourceRecordImportDb;
};

export const readReviewedSourceRecordCandidates = async (
  ticker: string,
  options: { db?: ReviewedSourceRecordImportDb; sourceLabel?: string } = {},
): Promise<Partial<Record<TraceableInputField, TraceableInputCandidate>>> => {
  const db = await resolveDb(options.db);
  if (!db.financialStatement) return {};
  const normalizedTicker = normalizeTicker(ticker);
  const rows = await db.financialStatement.findMany({
    where: {
      ticker: normalizedTicker,
      sourceLabel: options.sourceLabel ?? PHASE114_REVIEWED_SOURCE_LABEL,
      dataMode: PHASE114_REVIEWED_DATA_MODE,
    },
    orderBy: [{ fiscalYear: "desc" }, { asOf: "desc" }, { createdAt: "desc" }],
    take: 1,
    select: {
      ticker: true,
      period: true,
      fiscalYear: true,
      asOf: true,
      sourceLabel: true,
      dataMode: true,
      totalDebt: true,
      eps: true,
      sharesOutstanding: true,
      unitMetadata: {
        select: { field: true, unit: true, status: true, sourceLabel: true, dataMode: true, productionApproved: true },
      },
    },
  });
  const row = rows[0];
  if (!row) return {};
  const unitFor = (field: TraceableInputField): ValuationUnit | null => {
    const metadata = row.unitMetadata?.find((item) => item.field === field && item.status === "explicit");
    return metadata ? (metadata.unit as ValuationUnit) : null;
  };
  const asOf = row.asOf instanceof Date ? row.asOf.toISOString().slice(0, 10) : new Date(row.asOf).toISOString().slice(0, 10);

  return Object.fromEntries(
    PHASE114_REVIEWED_FIELDS.flatMap((field) => {
      const value = numberFromStored(row[field]);
      const unit = unitFor(field);
      return value !== null && unit
        ? [[
            field,
            {
              asOf,
              dataMode: row.dataMode,
              field,
              period: row.period,
              productionApproved: false as const,
              sourceLabel: row.sourceLabel,
              ticker: row.ticker,
              unit,
              value,
            },
          ]]
        : [];
    }),
  ) as Partial<Record<TraceableInputField, TraceableInputCandidate>>;
};

export const runReviewedSourceRecordImport = async ({
  confirmWrite = false,
  csvText,
  databaseUrl = process.env.DATABASE_URL,
  db,
  verifyRuntimeRead = false,
}: {
  confirmWrite?: boolean;
  csvText: string;
  databaseUrl?: string;
  db?: ReviewedSourceRecordImportDb;
  verifyRuntimeRead?: boolean;
}): Promise<Phase114ReviewedSourceRecordImportResult> => {
  const parseResult = parseReviewedSourceRecordsCsv(csvText);
  const databaseGuard = assessFinancialStatementLocalWriteDatabaseUrl(databaseUrl);
  const errors: string[] = [];
  const warnings = [...parseResult.warnings, ...databaseGuard.warnings];

  if (confirmWrite && process.env.ATELIER_LOCAL_IMPORTS_ENABLED !== "true") {
    errors.push("ATELIER_LOCAL_IMPORTS_ENABLED=true is required for confirmed reviewed source record writes.");
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
  if (confirmWrite && parseResult.invalidRows.length > 0) errors.push("Invalid reviewed source records block confirmed write.");

  if (!confirmWrite || errors.length > 0) {
    const breakdown = buildBreakdown(parseResult);
    return {
      breakdownByField: breakdown.byField,
      breakdownByTicker: breakdown.byTicker,
      confirmWrite,
      dataMode: PHASE114_REVIEWED_DATA_MODE,
      databaseGuard,
      dryRun: true,
      errors,
      inputRows: parseResult.inputRows,
      invalidRecords: parseResult.invalidRows,
      invalidRows: parseResult.invalidRows.length,
      phase: "Phase 114",
      productionApproved: false,
      skippedRows: 0,
      sourceLabel: PHASE114_REVIEWED_SOURCE_LABEL,
      validRows: parseResult.validRows.length,
      warnings,
      writtenRows: 0,
    };
  }

  const client = await resolveDb(db);
  const writeResult = await client.$transaction(async (tx) => {
    const source = await tx.dataSource.upsert({
      where: { name_sourceType: { name: PHASE114_REVIEWED_SOURCE_LABEL, sourceType: "company_disclosure" } },
      update: {
        accessMethod: "official_download",
        cachingAllowed: "unknown",
        derivedDataAllowed: "unknown",
        licenseStatus: "needs_review",
        notes: "Reviewed official-report-based candidate records for debt, EPS, and shares. Research-only; not source-approved.",
        redistributionAllowed: "unknown",
        runtimeDisplayAllowed: "unknown",
        supportedDataGroups: JSON.stringify(["financial_statement", "reviewed_source_record"]),
        tosStatus: "needs_review",
        usageStatus: "research_only",
      },
      create: {
        accessMethod: "official_download",
        cachingAllowed: "unknown",
        derivedDataAllowed: "unknown",
        licenseStatus: "needs_review",
        name: PHASE114_REVIEWED_SOURCE_LABEL,
        notes: "Reviewed official-report-based candidate records for debt, EPS, and shares. Research-only; not source-approved.",
        redistributionAllowed: "unknown",
        runtimeDisplayAllowed: "unknown",
        sourceType: "company_disclosure",
        supportedDataGroups: JSON.stringify(["financial_statement", "reviewed_source_record"]),
        tosStatus: "needs_review",
        usageStatus: "research_only",
      },
    });
    const session = await tx.manualImportSession.create({
      data: {
        dataMode: PHASE114_REVIEWED_DATA_MODE,
        fileName: "phase114_reviewed_source_records_candidate.csv",
        mode: "phase114_reviewed_source_records",
        readiness: "needs_review",
        rowCount: parseResult.inputRows,
        sourceLabel: PHASE114_REVIEWED_SOURCE_LABEL,
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

    for (const [ticker, group] of groupedByTicker(parseResult.validRows)) {
      const totalDebt = group.totalDebt;
      const eps = group.eps;
      const sharesOutstanding = group.sharesOutstanding;
      if (!totalDebt || !eps || !sharesOutstanding) continue;

      const company =
        (await tx.company.findFirst({ where: { ticker }, orderBy: [{ dataMode: "asc" }, { createdAt: "asc" }], select: { id: true } })) ??
        (await tx.company.create({
          data: {
            companyName: `${ticker} research company`,
            country: "VN",
            currency: "VND",
            dataMode: PHASE114_REVIEWED_DATA_MODE,
            profileAsOf: safeDate(totalDebt.asOf),
            profileSourceId: source.id,
            ticker,
          },
          select: { id: true },
        }));
      const existing = await tx.financialStatement.findFirst({
        where: {
          dataMode: PHASE114_REVIEWED_DATA_MODE,
          fiscalYear: Number(totalDebt.period),
          periodType: "year",
          sourceId: source.id,
          ticker,
        },
        select: { eps: true, id: true, sharesOutstanding: true, totalDebt: true },
      });
      const fieldRecords = [totalDebt, eps, sharesOutstanding];
      const fieldsToWrite = fieldRecords.filter((record) => !sameNumber(fieldValue(existing, record.field), record.value));
      const fieldsToSkip = fieldRecords.filter((record) => sameNumber(fieldValue(existing, record.field), record.value));
      const statementData = {
        asOf: safeDate(totalDebt.asOf),
        collectedAt: new Date(),
        companyId: company.id,
        companyType: "unknown",
        currency: "VND",
        dataMode: PHASE114_REVIEWED_DATA_MODE,
        eps: eps.value,
        fiscalQuarter: null,
        fiscalYear: Number(totalDebt.period),
        missingFields: JSON.stringify(["revenue", "netIncome", "totalAssets", "equity", "operatingCashFlow"]),
        period: totalDebt.period,
        periodType: "year",
        qualityStatus: "partial",
        readiness: "needs_review",
        reportDate: safeDate(totalDebt.asOf),
        sharesOutstanding: sharesOutstanding.value,
        sourceId: source.id,
        sourceLabel: source.name,
        sourceType: "company_disclosure",
        ticker,
        totalDebt: totalDebt.value,
        warningCodes: JSON.stringify(["PHASE114_REVIEWED_CANDIDATE_RESEARCH_ONLY"]),
      };
      const statement = existing
        ? await tx.financialStatement.update({ data: statementData, where: { id: existing.id }, select: { id: true } })
        : await tx.financialStatement.create({ data: statementData, select: { id: true } });

      for (const record of fieldRecords) {
        await tx.financialStatementUnitMetadata.upsert({
          where: { financialStatementId_field: { field: record.field, financialStatementId: statement.id } },
          update: {
            dataMode: record.dataMode,
            productionApproved: false,
            sourceLabel: record.sourceLabel,
            status: "explicit",
            unit: record.unit,
            warningCodes: JSON.stringify(["PHASE114_REVIEWED_CANDIDATE_RESEARCH_ONLY"]),
          },
          create: {
            dataMode: record.dataMode,
            field: record.field,
            financialStatementId: statement.id,
            productionApproved: false,
            sourceLabel: record.sourceLabel,
            status: "explicit",
            unit: record.unit,
            warningCodes: JSON.stringify(["PHASE114_REVIEWED_CANDIDATE_RESEARCH_ONLY"]),
          },
        });
        await tx.manualImportRecord.create({
          data: {
            asOf: safeDate(record.asOf),
            companyId: company.id,
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
      }
      for (const record of fieldsToWrite) {
        writtenRowsByKey[record.ticker] = (writtenRowsByKey[record.ticker] ?? 0) + 1;
        writtenRowsByKey[record.field] = (writtenRowsByKey[record.field] ?? 0) + 1;
      }
      for (const record of fieldsToSkip) {
        skippedRowsByKey[record.ticker] = (skippedRowsByKey[record.ticker] ?? 0) + 1;
        skippedRowsByKey[record.field] = (skippedRowsByKey[record.field] ?? 0) + 1;
      }
    }

    return { skippedRowsByKey, writtenRowsByKey };
  });

  const breakdown = buildBreakdown(parseResult, writeResult.writtenRowsByKey, writeResult.skippedRowsByKey);
  const writtenRows = Object.entries(writeResult.writtenRowsByKey)
    .filter(([key]) => (PHASE114_REVIEWED_FIELDS as readonly string[]).includes(key))
    .reduce((sum, [, count]) => sum + count, 0);
  const skippedRows = Object.entries(writeResult.skippedRowsByKey)
    .filter(([key]) => (PHASE114_REVIEWED_FIELDS as readonly string[]).includes(key))
    .reduce((sum, [, count]) => sum + count, 0);
  const runtimeProof = verifyRuntimeRead
    ? await Promise.all(
        PHASE114_REVIEWED_TICKERS.map(async (ticker) => {
          const candidates = await readReviewedSourceRecordCandidates(ticker, { db });
          return {
            eps: candidates.eps ?? null,
            sharesOutstanding: candidates.sharesOutstanding ?? null,
            ticker,
            totalDebt: candidates.totalDebt ?? null,
          };
        }),
      )
    : undefined;

  return {
    breakdownByField: breakdown.byField,
    breakdownByTicker: breakdown.byTicker,
    confirmWrite,
    dataMode: PHASE114_REVIEWED_DATA_MODE,
    databaseGuard,
    dryRun: false,
    errors: [],
    inputRows: parseResult.inputRows,
    invalidRecords: parseResult.invalidRows,
    invalidRows: parseResult.invalidRows.length,
    phase: "Phase 114",
    productionApproved: false,
    runtimeProof,
    skippedRows,
    sourceLabel: PHASE114_REVIEWED_SOURCE_LABEL,
    validRows: parseResult.validRows.length,
    warnings,
    writtenRows,
  };
};
