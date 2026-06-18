import type { AdapterError, AdapterWarning, RawSourceRecord } from "./types";

export type ManualUploadCsvParseResult = {
  rows: RawSourceRecord[];
  warnings: AdapterWarning[];
  errors: AdapterError[];
};

const splitLines = (csvText: string): string[] =>
  csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

export const parseManualUploadCsv = (csvText: string): ManualUploadCsvParseResult => {
  const warnings: AdapterWarning[] = [];
  const errors: AdapterError[] = [];

  if (csvText.includes("\"")) {
    return {
      rows: [],
      warnings: [
        {
          code: "CSV_QUOTED_FIELDS_UNSUPPORTED",
          message: "Quoted CSV fields are not supported by the Phase 28A basic parser.",
        },
      ],
      errors: [
        {
          code: "CSV_PARSE_UNSUPPORTED",
          message: "Use object-array input or a simple comma-separated CSV without quoted fields.",
        },
      ],
    };
  }

  const lines = splitLines(csvText);
  if (lines.length === 0) {
    return {
      rows: [],
      warnings,
      errors: [{ code: "CSV_EMPTY", message: "CSV text is empty." }],
    };
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  if (headers.some((header) => header.length === 0)) {
    errors.push({ code: "CSV_HEADER_INVALID", message: "CSV header row contains an empty column." });
  }

  const rows = lines.slice(1).map((line, lineIndex) => {
    const values = line.split(",");
    if (values.length !== headers.length) {
      warnings.push({
        code: "CSV_COLUMN_COUNT_MISMATCH",
        message: `Row ${lineIndex + 2} has ${values.length} columns but header has ${headers.length}.`,
      });
    }

    return headers.reduce<RawSourceRecord>((record, header, index) => {
      record[header] = values[index]?.trim() ?? undefined;
      return record;
    }, {});
  });

  return { rows, warnings, errors };
};

