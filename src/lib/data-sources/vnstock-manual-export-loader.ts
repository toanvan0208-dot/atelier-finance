import type { RawVnstockMarketPrice } from "./vnstock-research-connector";

export type VnstockManualExportFormat = "csv" | "json";

export type VnstockManualExportParseResult = {
  records: RawVnstockMarketPrice[];
  warnings: string[];
  errors: string[];
};

const REQUIRED_COLUMNS = ["ticker", "date"] as const;
const NUMERIC_COLUMNS = ["open", "high", "low", "close", "volume", "tradingValue"] as const;
const ACCEPTED_COLUMNS = new Set<string>([
  ...REQUIRED_COLUMNS,
  ...NUMERIC_COLUMNS,
]);

const emptyToNull = (value: string | undefined): string | null => {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const splitCsvLine = (line: string): string[] => {
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
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const toRawRecord = (
  row: Record<string, string | undefined>,
): RawVnstockMarketPrice => ({
  ticker: row.ticker?.trim() ?? "",
  date: row.date?.trim() ?? "",
  open: emptyToNull(row.open),
  high: emptyToNull(row.high),
  low: emptyToNull(row.low),
  close: emptyToNull(row.close),
  volume: emptyToNull(row.volume),
  tradingValue: emptyToNull(row.tradingValue),
});

export const parseVnstockManualExportCsv = (
  csvText: string,
): VnstockManualExportParseResult => {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { records: [], warnings: [], errors: ["CSV file is empty."] };
  }

  const headers = splitCsvLine(lines[0]);
  const normalizedHeaders = headers.map((header) => header.trim());
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !normalizedHeaders.includes(column),
  );

  if (missingColumns.length > 0) {
    return {
      records: [],
      warnings: [],
      errors: [`CSV file is missing required column(s): ${missingColumns.join(", ")}.`],
    };
  }

  const warnings: string[] = [];
  const unknownColumns = normalizedHeaders.filter(
    (header) => !ACCEPTED_COLUMNS.has(header),
  );
  if (unknownColumns.length > 0) {
    warnings.push(`CSV ignored unknown column(s): ${unknownColumns.join(", ")}.`);
  }

  const records = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, cells[index]]),
    );
    return toRawRecord(row);
  });

  return { records, warnings, errors: [] };
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseVnstockManualExportJson = (
  jsonText: string,
): VnstockManualExportParseResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { records: [], warnings: [], errors: ["JSON file could not be parsed."] };
  }

  if (!Array.isArray(parsed)) {
    return { records: [], warnings: [], errors: ["JSON file must contain an array of records."] };
  }

  const warnings: string[] = [];
  const records: RawVnstockMarketPrice[] = [];

  parsed.forEach((item, index) => {
    if (!isObjectRecord(item)) {
      warnings.push(`JSON record ${index + 1} was ignored because it is not an object.`);
      return;
    }

    const unknownColumns = Object.keys(item).filter((key) => !ACCEPTED_COLUMNS.has(key));
    if (unknownColumns.length > 0) {
      warnings.push(`JSON record ${index + 1} ignored unknown field(s): ${unknownColumns.join(", ")}.`);
    }

    records.push({
      ticker: typeof item.ticker === "string" ? item.ticker.trim() : "",
      date: typeof item.date === "string" ? item.date.trim() : "",
      open: typeof item.open === "number" ? item.open : emptyToNull(String(item.open ?? "")),
      high: typeof item.high === "number" ? item.high : emptyToNull(String(item.high ?? "")),
      low: typeof item.low === "number" ? item.low : emptyToNull(String(item.low ?? "")),
      close: typeof item.close === "number" ? item.close : emptyToNull(String(item.close ?? "")),
      volume: typeof item.volume === "number" ? item.volume : emptyToNull(String(item.volume ?? "")),
      tradingValue:
        typeof item.tradingValue === "number"
          ? item.tradingValue
          : emptyToNull(String(item.tradingValue ?? "")),
    });
  });

  return { records, warnings, errors: [] };
};

export const parseVnstockManualExport = ({
  content,
  format,
}: {
  content: string;
  format: VnstockManualExportFormat;
}): VnstockManualExportParseResult =>
  format === "csv"
    ? parseVnstockManualExportCsv(content)
    : parseVnstockManualExportJson(content);

export const inferVnstockManualExportFormat = (
  filePath: string | undefined,
): VnstockManualExportFormat | null => {
  const normalized = filePath?.toLowerCase() ?? "";
  if (normalized.endsWith(".csv")) return "csv";
  if (normalized.endsWith(".json")) return "json";
  return null;
};
