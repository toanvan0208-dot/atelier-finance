export type LocalImportAuditType = "financial_statement" | "market_pvt";

export type LocalImportAuditStatus =
  | "dry_run_completed"
  | "completed"
  | "completed_with_warnings"
  | "blocked"
  | "failed_validation"
  | "failed_write";

export type LocalImportAuditSafetyFlags = {
  noOverwrite: true;
  invalidRowsNotWritten: true;
  missingUnitFailsClosed: true;
  noZeroFillForMissing: true;
  localDataProductionApprovedFalse: true;
};

export type LocalImportAuditSummaryInput = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  writtenRows: number;
  skippedRows: number;
  duplicateRows?: number;
  warnings: string[];
  errors: string[];
};

export type BuildLocalImportAuditResultInput = {
  importJobId?: string;
  importType: LocalImportAuditType;
  sourceKind: "user_input" | "local_research" | "manual" | "unknown";
  sourceLabel: string;
  tickers?: string[];
  dryRun: boolean;
  confirmWrite: boolean;
  startedAt?: Date | string;
  completedAt?: Date | string;
  now?: () => Date;
  summary: LocalImportAuditSummaryInput;
  writeAttempted?: boolean;
  writeFailed?: boolean;
  validationFailed?: boolean;
  blocked?: boolean;
};

export type LocalImportAuditResult = {
  importJobId: string;
  importType: LocalImportAuditType;
  sourceKind: "user_input" | "local_research" | "manual" | "unknown";
  sourceLabel: string;
  tickers: string[];
  dryRun: boolean;
  confirmWrite: boolean;
  productionApproved: false;
  startedAt: string;
  completedAt: string;
  status: LocalImportAuditStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  writtenRows: number;
  skippedRows: number;
  duplicateSkippedRows: number;
  warnings: string[];
  errors: string[];
  safetyFlags: LocalImportAuditSafetyFlags;
};

const DEFAULT_JOB_ID = "local-import-job";

const iso = (value: Date | string): string => {
  if (typeof value === "string") return new Date(value).toISOString();
  return value.toISOString();
};

const uniqueTickers = (tickers: string[] | undefined): string[] =>
  Array.from(new Set((tickers ?? []).map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))).sort();

const resolveStatus = ({
  blocked,
  dryRun,
  summary,
  validationFailed,
  writeFailed,
}: Pick<BuildLocalImportAuditResultInput, "blocked" | "dryRun" | "summary" | "validationFailed" | "writeFailed">): LocalImportAuditStatus => {
  if (dryRun) return "dry_run_completed";
  if (writeFailed) return "failed_write";
  if (validationFailed || (summary.validRows === 0 && summary.invalidRows > 0)) return "failed_validation";
  if (blocked || (summary.writtenRows === 0 && summary.skippedRows > 0)) return "blocked";
  if (summary.writtenRows > 0 && (summary.warnings.length > 0 || summary.errors.length > 0 || summary.skippedRows > 0 || summary.invalidRows > 0)) {
    return "completed_with_warnings";
  }
  if (summary.writtenRows > 0) return "completed";
  return "blocked";
};

export const buildLocalImportAuditResult = (
  input: BuildLocalImportAuditResultInput,
): LocalImportAuditResult => {
  const now = input.now?.() ?? new Date();
  const startedAt = iso(input.startedAt ?? now);
  const completedAt = iso(input.completedAt ?? now);

  return {
    completedAt,
    confirmWrite: input.confirmWrite,
    dryRun: input.dryRun,
    duplicateSkippedRows: input.summary.duplicateRows ?? input.summary.skippedRows,
    errors: input.summary.errors,
    importJobId: input.importJobId ?? DEFAULT_JOB_ID,
    importType: input.importType,
    invalidRows: input.summary.invalidRows,
    productionApproved: false,
    safetyFlags: {
      invalidRowsNotWritten: true,
      localDataProductionApprovedFalse: true,
      missingUnitFailsClosed: true,
      noOverwrite: true,
      noZeroFillForMissing: true,
    },
    skippedRows: input.summary.skippedRows,
    sourceKind: input.sourceKind,
    sourceLabel: input.sourceLabel.trim() || "unknown",
    startedAt,
    status: resolveStatus(input),
    tickers: uniqueTickers(input.tickers),
    totalRows: input.summary.totalRows,
    validRows: input.summary.validRows,
    warnings: input.summary.warnings,
    writtenRows: input.summary.writtenRows,
  };
};
