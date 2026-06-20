import { readFile, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

import {
  buildFinancialStatementCsvDryRun,
  type FinancialStatementCsvDryRunOptions,
  type FinancialStatementCsvDryRunReport,
} from "./financial-statement-file-parser";

export type FinancialStatementLocalFileDryRunInput = {
  filePath: string;
  sourceLabel?: string;
  dataMode?: string;
  defaultCurrency?: string;
  delimiter?: string;
  maxRows?: number;
  maxBytes?: number;
  allowedExtensions?: string[];
  fileName?: string;
  strictHeaders?: boolean;
  baseDir?: string;
};

export type FinancialStatementLocalFileReadStatus =
  | "not_started"
  | "validated"
  | "read"
  | "file_validation_failed"
  | "file_read_failed";

export type FinancialStatementLocalFileDryRunStatus =
  | FinancialStatementCsvDryRunReport["status"]
  | "file_validation_failed"
  | "file_read_failed";

export type FinancialStatementLocalFileDryRunReport = {
  status: FinancialStatementLocalFileDryRunStatus;
  dryRun: true;
  writePlanned: false;
  noDbWrite: true;
  productionApproved: false;
  file: {
    filePath: string | null;
    safeDisplayPath: string | null;
    fileName: string | null;
    extension: string | null;
    sizeBytes: number | null;
    readStatus: FinancialStatementLocalFileReadStatus;
  };
  csvDryRun: FinancialStatementCsvDryRunReport | null;
  warnings: string[];
  errors: string[];
};

const DEFAULT_MAX_BYTES = 1024 * 1024;
const DEFAULT_ALLOWED_EXTENSIONS = [".csv", ".txt"];
const DEFAULT_SOURCE_LABEL = "user_provided_local_file";
const DEFAULT_DATA_MODE = "research_only";

const normalizeExtension = (extension: string): string => {
  const trimmed = extension.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
};

const normalizeAllowedExtensions = (extensions: string[] | undefined): string[] => {
  const normalized = (extensions ?? DEFAULT_ALLOWED_EXTENSIONS).map(normalizeExtension).filter(Boolean);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : DEFAULT_ALLOWED_EXTENSIONS;
};

const isRemoteUrl = (filePath: string): boolean => /^https?:\/\//i.test(filePath.trim());

const isWithinBaseDir = (resolvedPath: string, resolvedBaseDir: string): boolean => {
  const base = resolvedBaseDir.endsWith("\\") || resolvedBaseDir.endsWith("/")
    ? resolvedBaseDir
    : `${resolvedBaseDir}\\`;
  return resolvedPath === resolvedBaseDir || resolvedPath.startsWith(base);
};

const failureReport = ({
  status,
  filePath,
  resolvedPath = null,
  extension = null,
  sizeBytes = null,
  readStatus,
  warnings = [],
  errors,
}: {
  status: "file_validation_failed" | "file_read_failed";
  filePath: string | null;
  resolvedPath?: string | null;
  extension?: string | null;
  sizeBytes?: number | null;
  readStatus: FinancialStatementLocalFileReadStatus;
  warnings?: string[];
  errors: string[];
}): FinancialStatementLocalFileDryRunReport => ({
  status,
  dryRun: true,
  writePlanned: false,
  noDbWrite: true,
  productionApproved: false,
  file: {
    filePath: resolvedPath,
    safeDisplayPath: resolvedPath,
    fileName: filePath ? basename(filePath) : null,
    extension,
    sizeBytes,
    readStatus,
  },
  csvDryRun: null,
  warnings,
  errors,
});

export const buildFinancialStatementLocalFileDryRun = async (
  input: FinancialStatementLocalFileDryRunInput,
): Promise<FinancialStatementLocalFileDryRunReport> => {
  const rawFilePath = input.filePath?.trim();
  const allowedExtensions = normalizeAllowedExtensions(input.allowedExtensions);
  const maxBytes =
    input.maxBytes !== undefined && Number.isFinite(input.maxBytes)
      ? Math.max(0, Math.floor(input.maxBytes))
      : DEFAULT_MAX_BYTES;

  if (!rawFilePath) {
    return failureReport({
      status: "file_validation_failed",
      filePath: null,
      readStatus: "file_validation_failed",
      errors: ["file_path_required"],
    });
  }

  if (isRemoteUrl(rawFilePath)) {
    return failureReport({
      status: "file_validation_failed",
      filePath: rawFilePath,
      readStatus: "file_validation_failed",
      errors: ["remote_url_rejected"],
    });
  }

  const resolvedPath = resolve(rawFilePath);
  const resolvedBaseDir = input.baseDir ? resolve(input.baseDir) : null;
  if (resolvedBaseDir && !isWithinBaseDir(resolvedPath, resolvedBaseDir)) {
    return failureReport({
      status: "file_validation_failed",
      filePath: rawFilePath,
      resolvedPath,
      readStatus: "file_validation_failed",
      errors: ["outside_base_dir"],
    });
  }

  const extension = normalizeExtension(extname(resolvedPath));
  if (!allowedExtensions.includes(extension)) {
    const unsupported = extension === ".xlsx" || extension === ".xls" || extension === ".pdf"
      ? "unsupported_file_type: Excel/PDF not supported in this phase."
      : `unsupported_file_type: ${extension || "missing_extension"}`;

    return failureReport({
      status: "file_validation_failed",
      filePath: rawFilePath,
      resolvedPath,
      extension,
      readStatus: "file_validation_failed",
      errors: [unsupported],
    });
  }

  let fileStat;
  try {
    fileStat = await stat(resolvedPath);
  } catch (error) {
    return failureReport({
      status: "file_read_failed",
      filePath: rawFilePath,
      resolvedPath,
      extension,
      readStatus: "file_read_failed",
      errors: [error instanceof Error ? `file_stat_failed: ${error.message}` : "file_stat_failed"],
    });
  }

  if (!fileStat.isFile()) {
    return failureReport({
      status: "file_validation_failed",
      filePath: rawFilePath,
      resolvedPath,
      extension,
      sizeBytes: fileStat.size,
      readStatus: "file_validation_failed",
      errors: ["not_a_file"],
    });
  }

  if (fileStat.size > maxBytes) {
    return failureReport({
      status: "file_validation_failed",
      filePath: rawFilePath,
      resolvedPath,
      extension,
      sizeBytes: fileStat.size,
      readStatus: "file_validation_failed",
      errors: [`file_too_large: ${fileStat.size} bytes exceeds maxBytes ${maxBytes}.`],
    });
  }

  let csvText: string;
  try {
    csvText = await readFile(resolvedPath, "utf8");
  } catch (error) {
    return failureReport({
      status: "file_read_failed",
      filePath: rawFilePath,
      resolvedPath,
      extension,
      sizeBytes: fileStat.size,
      readStatus: "file_read_failed",
      errors: [error instanceof Error ? `file_read_failed: ${error.message}` : "file_read_failed"],
    });
  }

  const csvOptions: FinancialStatementCsvDryRunOptions = {
    sourceLabel: input.sourceLabel ?? DEFAULT_SOURCE_LABEL,
    dataMode: input.dataMode ?? DEFAULT_DATA_MODE,
    defaultCurrency: input.defaultCurrency,
    delimiter: input.delimiter,
    maxRows: input.maxRows,
    fileName: input.fileName ?? basename(resolvedPath),
    strictHeaders: input.strictHeaders,
  };
  const csvDryRun = buildFinancialStatementCsvDryRun(csvText, csvOptions);

  return {
    status: csvDryRun.status,
    dryRun: true,
    writePlanned: false,
    noDbWrite: true,
    productionApproved: false,
    file: {
      filePath: resolvedPath,
      safeDisplayPath: resolvedPath,
      fileName: input.fileName ?? basename(resolvedPath),
      extension,
      sizeBytes: fileStat.size,
      readStatus: "read",
    },
    csvDryRun,
    warnings: csvDryRun.parseWarnings,
    errors: csvDryRun.parseErrors,
  };
};
