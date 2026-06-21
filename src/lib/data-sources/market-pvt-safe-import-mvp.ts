import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  buildMarketPvtUnitMetadata,
  isMarketPvtUnitAccepted,
  type MarketPvtFieldUnitMetadata,
  type MarketPvtNumericField,
} from "@/features/technical/lib/market-pvt-unit-metadata-contract";
import { assessFinancialStatementLocalWriteDatabaseUrl } from "./financial-statement-local-write-guard";
import {
  buildLocalImportAuditResult,
  type LocalImportAuditResult,
} from "./local-import-audit-trail";

export type MarketPvtSafeImportMvpInput = {
  csvText: string;
  dryRun?: boolean;
  confirmWrite?: boolean;
  databaseUrl?: string;
  db?: MarketPvtSafeImportDb;
  audit?: {
    importJobId?: string;
    startedAt?: Date | string;
    completedAt?: Date | string;
    now?: () => Date;
  };
};

export type MarketPvtSafeImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  writtenRows: number;
  skippedRows: number;
  warnings: string[];
  errors: string[];
  dryRun: boolean;
};

export type MarketPvtAcceptedImportRow = {
  rowIndex: number;
  ticker: string;
  tradingDate: Date;
  period: string;
  closePrice: number;
  volume: number | null;
  tradingValue: number | null;
  currency: string;
  sourceLabel: string;
  dataMode: "research_only";
  asOf: Date;
  collectedAt: Date;
  productionApproved: false;
  marketUnitMetadata: Partial<Record<MarketPvtNumericField, MarketPvtFieldUnitMetadata>>;
  warnings: string[];
};

export type MarketPvtInvalidImportRow = {
  rowIndex: number;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
};

export type MarketPvtSafeImportResult = {
  status: "preview_ready" | "import_completed" | "import_completed_with_skips" | "import_rejected";
  dryRun: boolean;
  productionApproved: false;
  sourceType: "user_input";
  dataMode: "research_only";
  summary: MarketPvtSafeImportSummary;
  acceptedRows: MarketPvtAcceptedImportRow[];
  invalidRows: MarketPvtInvalidImportRow[];
  audit: LocalImportAuditResult;
  sourceApprovalCreated: false;
};

type MarketPvtSafeImportTx = {
  dataSource: {
    upsert: (args: unknown) => Promise<{ id: string; name: string }>;
  };
  company: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<{ id: string }>;
  };
  marketPrice: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<{ id: string }>;
  };
  marketPriceUnitMetadata: {
    upsert: (args: unknown) => Promise<unknown>;
  };
};

export type MarketPvtSafeImportDb = {
  $transaction: <T>(fn: (tx: MarketPvtSafeImportTx) => Promise<T>) => Promise<T>;
};

const MARKET_PVT_GROUPS = JSON.stringify(["market_prices", "technical_pvt"]);
const REQUIRED_HEADERS = ["ticker", "source"] as const;
const PRICE_HEADERS = ["closePrice", "marketPrice", "close", "price"] as const;
const DATE_HEADERS = ["tradingDate", "date", "asOf"] as const;

const normalizeHeader = (value: string): string => value.trim();

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsvRows = (csvText: string): Array<Record<string, string>> => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
  });
};

const text = (row: Record<string, string>, keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return null;
};

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const parseNullableNumber = (value: string | null): { value: number | null; invalid: boolean } => {
  if (value === null || value.trim() === "") return { value: null, invalid: false };
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? { value: parsed, invalid: false } : { value: null, invalid: true };
};

const unit = (row: Record<string, string>, keys: readonly string[]): ValuationUnit | null => {
  const value = text(row, keys);
  return value ? (value as ValuationUnit) : null;
};

const validateUnit = (
  field: MarketPvtNumericField,
  value: number | null,
  resolvedUnit: ValuationUnit | null,
  errors: string[],
) => {
  if (value === null) return;
  if (!resolvedUnit || resolvedUnit === "unknown") {
    errors.push(`${field}_unit_missing`);
    return;
  }
  if (!isMarketPvtUnitAccepted(field, resolvedUnit)) {
    errors.push(`${field}_unit_invalid`);
  }
};

const normalizeRow = (
  raw: Record<string, string>,
  rowIndex: number,
): { row: MarketPvtAcceptedImportRow | null; invalid: MarketPvtInvalidImportRow | null } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ticker = text(raw, ["ticker"])?.toUpperCase() ?? "";
  const tradingDate = parseDate(text(raw, DATE_HEADERS));
  const close = parseNullableNumber(text(raw, PRICE_HEADERS));
  const volume = parseNullableNumber(text(raw, ["volume"]));
  const tradingValue = parseNullableNumber(text(raw, ["tradingValue", "value"]));
  const priceUnit = unit(raw, ["priceUnit", "marketPriceUnit", "closePriceUnit"]);
  const volumeUnit = unit(raw, ["volumeUnit"]);
  const tradingValueUnit = unit(raw, ["tradingValueUnit", "valueUnit"]);
  const sourceLabel = text(raw, ["source", "sourceLabel"]) ?? "";
  const currency = text(raw, ["currency", "priceCurrency"]) ?? "";

  if (!ticker) errors.push("ticker_missing");
  if (!tradingDate) errors.push("trading_date_invalid");
  if (close.invalid) errors.push("market_price_invalid_number");
  if (close.value === null) errors.push("market_price_missing");
  if (close.value !== null && close.value <= 0) errors.push("market_price_must_be_positive");
  if (volume.invalid) errors.push("volume_invalid_number");
  if (volume.value !== null && volume.value < 0) errors.push("volume_must_be_non_negative");
  if (tradingValue.invalid) errors.push("trading_value_invalid_number");
  if (tradingValue.value !== null && tradingValue.value < 0) errors.push("trading_value_must_be_non_negative");
  if (!currency) errors.push("price_currency_missing");
  if (!sourceLabel) errors.push("source_missing");

  validateUnit("marketPrice", close.value, priceUnit, errors);
  validateUnit("volume", volume.value, volumeUnit, errors);
  validateUnit("tradingValue", tradingValue.value, tradingValueUnit, errors);

  if (errors.length > 0 || !tradingDate || close.value === null) {
    return {
      invalid: { errors, raw, rowIndex, warnings },
      row: null,
    };
  }

  const asOf = parseDate(text(raw, ["asOf"])) ?? tradingDate;
  const collectedAt = parseDate(text(raw, ["collectedAt", "retrievedAt"])) ?? new Date();
  const marketUnitMetadata = buildMarketPvtUnitMetadata({
    asOf: dateOnly(asOf),
    dataMode: "research_only",
    source: "local_research",
    sourceLabel,
    units: {
      marketPrice: priceUnit,
      tradingValue: tradingValueUnit,
      volume: volumeUnit,
    },
    values: {
      marketPrice: close.value,
      tradingValue: tradingValue.value,
      volume: volume.value,
    },
  });

  return {
    invalid: null,
    row: {
      asOf,
      closePrice: close.value,
      collectedAt,
      currency,
      dataMode: "research_only",
      marketUnitMetadata,
      period: dateOnly(tradingDate),
      productionApproved: false,
      rowIndex,
      sourceLabel,
      ticker,
      tradingDate,
      tradingValue: tradingValue.value,
      volume: volume.value,
      warnings,
    },
  };
};

const hasRequiredHeaderShape = (csvText: string): string[] => {
  const firstLine = csvText.split(/\r?\n/).find((line) => line.trim());
  if (!firstLine) return ["csv_empty"];
  const headers = new Set(parseCsvLine(firstLine).map(normalizeHeader));
  const errors = REQUIRED_HEADERS.flatMap((header) => (headers.has(header) ? [] : [`${header}_header_missing`]));
  if (!PRICE_HEADERS.some((header) => headers.has(header))) errors.push("market_price_header_missing");
  if (!DATE_HEADERS.some((header) => headers.has(header))) errors.push("trading_date_header_missing");
  return errors;
};

const splitRows = (csvText: string) => {
  const headerErrors = hasRequiredHeaderShape(csvText);
  const rawRows = headerErrors.length > 0 ? [] : parseCsvRows(csvText);
  const acceptedRows: MarketPvtAcceptedImportRow[] = [];
  const invalidRows: MarketPvtInvalidImportRow[] = headerErrors.map((error) => ({
    errors: [error],
    raw: {},
    rowIndex: 0,
    warnings: [],
  }));

  rawRows.forEach((raw, index) => {
    const normalized = normalizeRow(raw, index + 1);
    if (normalized.row) acceptedRows.push(normalized.row);
    if (normalized.invalid) invalidRows.push(normalized.invalid);
  });

  return { acceptedRows, invalidRows, rawRows };
};

const duplicateKeys = (rows: MarketPvtAcceptedImportRow[]): Set<string> => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const key = `${row.ticker}|${row.period}|${row.sourceLabel}|${row.dataMode}`;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return duplicates;
};

const resolveDb = async (db: MarketPvtSafeImportDb | undefined): Promise<MarketPvtSafeImportDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as MarketPvtSafeImportDb;
};

const persistReadyUnitMetadata = async (
  tx: MarketPvtSafeImportTx,
  marketPriceId: string,
  row: MarketPvtAcceptedImportRow,
) => {
  for (const field of ["marketPrice", "volume", "tradingValue"] as MarketPvtNumericField[]) {
    const metadata = row.marketUnitMetadata[field];
    if (!metadata || metadata.status !== "ready") continue;

    await tx.marketPriceUnitMetadata.upsert({
      where: {
        marketPriceId_field: {
          field,
          marketPriceId,
        },
      },
      update: {
        asOf: row.asOf,
        dataMode: row.dataMode,
        field,
        productionApproved: false,
        source: "local_research",
        sourceLabel: row.sourceLabel,
        status: metadata.status,
        unit: metadata.unit,
        warningCodes: JSON.stringify(metadata.warnings),
      },
      create: {
        asOf: row.asOf,
        dataMode: row.dataMode,
        field,
        marketPriceId,
        productionApproved: false,
        source: "local_research",
        sourceLabel: row.sourceLabel,
        status: metadata.status,
        unit: metadata.unit,
        warningCodes: JSON.stringify(metadata.warnings),
      },
    });
  }
};

const writeRows = async (
  rows: MarketPvtAcceptedImportRow[],
  input: MarketPvtSafeImportMvpInput,
): Promise<{ writtenRows: number; skippedRows: number; warnings: string[]; errors: string[] }> => {
  const databaseGuard = assessFinancialStatementLocalWriteDatabaseUrl(input.databaseUrl ?? process.env.DATABASE_URL);
  if (!databaseGuard.accepted) {
    return { errors: databaseGuard.errors, skippedRows: rows.length, warnings: databaseGuard.warnings, writtenRows: 0 };
  }

  const db = await resolveDb(input.db);
  return db.$transaction(async (tx) => {
    let writtenRows = 0;
    let skippedRows = 0;
    const warnings = [...databaseGuard.warnings];

    for (const row of rows) {
      const source = await tx.dataSource.upsert({
        where: {
          name_sourceType: {
            name: row.sourceLabel,
            sourceType: "user_input",
          },
        },
        update: {
          accessMethod: "manual_upload",
          supportedDataGroups: MARKET_PVT_GROUPS,
          usageStatus: "research_only",
          licenseStatus: "needs_review",
          tosStatus: "needs_review",
          cachingAllowed: "unknown",
          redistributionAllowed: "unknown",
          runtimeDisplayAllowed: "unknown",
          derivedDataAllowed: "unknown",
          notes: "Local Market/PVT rows from controlled research-only CSV text import.",
        },
        create: {
          accessMethod: "manual_upload",
          cachingAllowed: "unknown",
          derivedDataAllowed: "unknown",
          licenseStatus: "needs_review",
          name: row.sourceLabel,
          notes: "Local Market/PVT rows from controlled research-only CSV text import.",
          redistributionAllowed: "unknown",
          runtimeDisplayAllowed: "unknown",
          sourceType: "user_input",
          supportedDataGroups: MARKET_PVT_GROUPS,
          tosStatus: "needs_review",
          usageStatus: "research_only",
        },
      });

      const company =
        (await tx.company.findFirst({
          where: { ticker: row.ticker },
          orderBy: [{ dataMode: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        })) ??
        (await tx.company.create({
          data: {
            companyName: `${row.ticker} research company`,
            country: "VN",
            currency: row.currency,
            dataMode: row.dataMode,
            exchange: null,
            profileAsOf: row.asOf,
            profileSourceId: source.id,
            ticker: row.ticker,
          },
          select: { id: true },
        }));

      const existing = await tx.marketPrice.findFirst({
        where: {
          dataMode: row.dataMode,
          sourceId: source.id,
          ticker: row.ticker,
          tradingDate: row.tradingDate,
        },
        select: { id: true },
      });

      if (existing) {
        skippedRows += 1;
        warnings.push(`Duplicate local Market/PVT row for ${row.ticker} ${row.period} was skipped.`);
        continue;
      }

      const marketPrice = await tx.marketPrice.create({
        data: {
          asOf: row.asOf,
          closePrice: row.closePrice,
          collectedAt: row.collectedAt,
          companyId: company.id,
          currency: row.currency,
          dataMode: row.dataMode,
          errorCodes: "[]",
          highPrice: null,
          lowPrice: null,
          missingFields: JSON.stringify([
            "openPrice",
            row.volume === null ? "volume" : null,
            row.tradingValue === null ? "tradingValue" : null,
          ].filter(Boolean)),
          openPrice: null,
          period: row.period,
          periodType: "day",
          qualityStatus: row.volume === null || row.tradingValue === null ? "partial" : "usable_with_caution",
          readiness: "needs_review",
          sourceId: source.id,
          sourceLabel: source.name,
          sourceType: "user_input",
          ticker: row.ticker,
          tradingDate: row.tradingDate,
          tradingValue: row.tradingValue,
          volume: row.volume,
          warningCodes: JSON.stringify(["LOCAL_MARKET_PVT_RESEARCH_IMPORT"]),
        },
        select: { id: true },
      });

      await persistReadyUnitMetadata(tx, marketPrice.id, row);
      writtenRows += 1;
    }

    return { errors: [], skippedRows, warnings, writtenRows };
  });
};

const summary = ({
  acceptedRows,
  dryRun,
  invalidRows,
  skippedRows = 0,
  warnings = [],
  errors = [],
  writtenRows = 0,
}: {
  acceptedRows: MarketPvtAcceptedImportRow[];
  invalidRows: MarketPvtInvalidImportRow[];
  dryRun: boolean;
  writtenRows?: number;
  skippedRows?: number;
  warnings?: string[];
  errors?: string[];
}): MarketPvtSafeImportSummary => ({
  dryRun,
  errors: [...invalidRows.flatMap((row) => row.errors.map((error) => `row ${row.rowIndex}: ${error}`)), ...errors],
  invalidRows: invalidRows.length,
  skippedRows,
  totalRows: acceptedRows.length + invalidRows.filter((row) => row.rowIndex > 0).length,
  validRows: acceptedRows.length,
  warnings,
  writtenRows,
});

const marketPvtAudit = ({
  acceptedRows,
  blocked = false,
  confirmWrite,
  duplicateSkipped,
  input,
  invalidRows,
  summary,
  writeFailed = false,
}: {
  acceptedRows: MarketPvtAcceptedImportRow[];
  blocked?: boolean;
  confirmWrite: boolean;
  duplicateSkipped: number;
  input: MarketPvtSafeImportMvpInput;
  invalidRows: MarketPvtInvalidImportRow[];
  summary: MarketPvtSafeImportSummary;
  writeFailed?: boolean;
}) =>
  buildLocalImportAuditResult({
    blocked,
    completedAt: input.audit?.completedAt,
    confirmWrite,
    dryRun: summary.dryRun,
    importJobId: input.audit?.importJobId,
    importType: "market_pvt",
    now: input.audit?.now,
    sourceKind: "user_input",
    sourceLabel: acceptedRows[0]?.sourceLabel ?? "unknown",
    startedAt: input.audit?.startedAt,
    summary: {
      ...summary,
      duplicateRows: duplicateSkipped,
    },
    tickers: acceptedRows.map((row) => row.ticker),
    validationFailed: acceptedRows.length === 0 && invalidRows.length > 0,
    writeFailed,
  });

export const runMarketPvtSafeImportMvp = async (
  input: MarketPvtSafeImportMvpInput,
): Promise<MarketPvtSafeImportResult> => {
  const dryRun = input.dryRun ?? !input.confirmWrite;
  const split = splitRows(input.csvText);
  const duplicateSet = duplicateKeys(split.acceptedRows);
  const acceptedRows = split.acceptedRows.filter(
    (row) => !duplicateSet.has(`${row.ticker}|${row.period}|${row.sourceLabel}|${row.dataMode}`),
  );
  const duplicateSkipped = split.acceptedRows.length - acceptedRows.length;
  const warnings = [
    "Local/imported Market/PVT rows remain productionApproved:false.",
    ...(duplicateSkipped > 0 ? [`${duplicateSkipped} duplicate or ambiguous CSV row(s) were skipped.`] : []),
  ];

  if (dryRun || !input.confirmWrite) {
    const builtSummary = summary({ acceptedRows, dryRun: true, invalidRows: split.invalidRows, skippedRows: duplicateSkipped, warnings });
    return {
      acceptedRows,
      audit: marketPvtAudit({
        acceptedRows,
        confirmWrite: input.confirmWrite === true,
        duplicateSkipped,
        input,
        invalidRows: split.invalidRows,
        summary: builtSummary,
      }),
      dataMode: "research_only",
      dryRun: true,
      invalidRows: split.invalidRows,
      productionApproved: false,
      sourceApprovalCreated: false,
      sourceType: "user_input",
      status: "preview_ready",
      summary: builtSummary,
    };
  }

  if (acceptedRows.length === 0 || split.invalidRows.some((row) => row.rowIndex === 0)) {
    const builtSummary = summary({ acceptedRows, dryRun: false, invalidRows: split.invalidRows, skippedRows: duplicateSkipped, warnings });
    return {
      acceptedRows,
      audit: marketPvtAudit({
        acceptedRows,
        blocked: acceptedRows.length === 0 && duplicateSkipped > 0 && split.invalidRows.length === 0,
        confirmWrite: true,
        duplicateSkipped,
        input,
        invalidRows: split.invalidRows,
        summary: builtSummary,
      }),
      dataMode: "research_only",
      dryRun: false,
      invalidRows: split.invalidRows,
      productionApproved: false,
      sourceApprovalCreated: false,
      sourceType: "user_input",
      status: "import_rejected",
      summary: builtSummary,
    };
  }

  const write = await writeRows(acceptedRows, input);
  const writtenRows = write.writtenRows;
  const skippedRows = duplicateSkipped + write.skippedRows;
  const status =
    write.errors.length > 0 || writtenRows === 0
      ? "import_rejected"
      : skippedRows > 0
        ? "import_completed_with_skips"
        : "import_completed";
  const builtSummary = summary({
    acceptedRows,
    dryRun: false,
    errors: write.errors,
    invalidRows: split.invalidRows,
    skippedRows,
    warnings: [...warnings, ...write.warnings],
    writtenRows,
  });

  return {
    acceptedRows,
    audit: marketPvtAudit({
      acceptedRows,
      blocked: status === "import_rejected" && writtenRows === 0 && skippedRows > 0,
      confirmWrite: true,
      duplicateSkipped,
      input,
      invalidRows: split.invalidRows,
      summary: builtSummary,
      writeFailed: write.errors.length > 0,
    }),
    dataMode: "research_only",
    dryRun: false,
    invalidRows: split.invalidRows,
    productionApproved: false,
    sourceApprovalCreated: false,
    sourceType: "user_input",
    status,
    summary: builtSummary,
  };
};
