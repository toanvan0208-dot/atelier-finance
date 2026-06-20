import { buildFinancialStatementLocalFileDryRun } from "../src/lib/data-sources/financial-statement-local-file-dry-run";
import type { FinancialStatementLocalFileDryRunReport } from "../src/lib/data-sources/financial-statement-local-file-dry-run";
import {
  runFinancialStatementLocalWriteTrial,
  type FinancialStatementLocalWriteTrialReport,
} from "../src/lib/data-sources/financial-statement-local-write-service";

export type FinancialStatementWriteTrialCliOptions = {
  filePath: string;
  sourceLabel: string;
  dataMode: string;
  baseDir?: string;
  maxBytes?: number;
  delimiter?: string;
  json: boolean;
  confirmLocalResearchOnly: boolean;
  confirmNoProductionSource: boolean;
  confirmReviewedDryRun: boolean;
  confirmNoProductionDatabase: boolean;
};

export type FinancialStatementWriteTrialCliParseResult =
  | { ok: true; options: FinancialStatementWriteTrialCliOptions }
  | { ok: false; exitCode: number; errors: string[]; showUsage: boolean };

export type FinancialStatementWriteTrialCliDeps = {
  runDryRun?: typeof buildFinancialStatementLocalFileDryRun;
  runWriteTrial?: typeof runFinancialStatementLocalWriteTrial;
  databaseUrl?: string;
};

export type FinancialStatementWriteTrialCliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  dryRunReport: FinancialStatementLocalFileDryRunReport | null;
  writeReport: FinancialStatementLocalWriteTrialReport | null;
};

const USAGE = [
  "Usage: npm run financials:write-trial -- --file <path> --source-label <label> --data-mode research_only [confirmations]",
  "",
  "Required confirmations:",
  "  --confirm-local-research-only",
  "  --confirm-no-production-source",
  "  --confirm-reviewed-dry-run",
  "  --confirm-no-production-database",
  "",
  "Options:",
  "  --file <path>                         Required local .csv/.txt file path.",
  "  --source-label <label>                Required local research source label.",
  "  --data-mode research_only             Required research data mode.",
  "  --base-dir <path>                     Optional base directory; paths outside it are rejected.",
  "  --max-bytes <number>                  Optional max file size before read.",
  "  --delimiter <char>                    Optional single-character CSV delimiter.",
  "  --json                                Print sanitized JSON report.",
  "  --help                                Show this usage.",
  "",
  "Controlled local write trial only: the command runs dry-run first, writes accepted rows only after confirmations, and rejects non-local DB URLs.",
].join("\n");

const VALUE_OPTIONS = new Set(["--file", "--source-label", "--data-mode", "--base-dir", "--max-bytes", "--delimiter"]);
const CONFIRMATION_OPTIONS = new Set([
  "--confirm-local-research-only",
  "--confirm-no-production-source",
  "--confirm-reviewed-dry-run",
  "--confirm-no-production-database",
]);
const FLAG_OPTIONS = new Set(["--json", "--help", ...CONFIRMATION_OPTIONS]);

export const getFinancialStatementWriteTrialUsage = (): string => USAGE;

export const parseFinancialStatementWriteTrialArgs = (
  argv: string[],
): FinancialStatementWriteTrialCliParseResult => {
  const options: FinancialStatementWriteTrialCliOptions = {
    filePath: "",
    sourceLabel: "",
    dataMode: "",
    json: false,
    confirmLocalResearchOnly: false,
    confirmNoProductionSource: false,
    confirmReviewedDryRun: false,
    confirmNoProductionDatabase: false,
  };
  const errors: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help") return { ok: false, exitCode: 0, errors: [], showUsage: true };
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--confirm-local-research-only") {
      options.confirmLocalResearchOnly = true;
      continue;
    }
    if (arg === "--confirm-no-production-source") {
      options.confirmNoProductionSource = true;
      continue;
    }
    if (arg === "--confirm-reviewed-dry-run") {
      options.confirmReviewedDryRun = true;
      continue;
    }
    if (arg === "--confirm-no-production-database") {
      options.confirmNoProductionDatabase = true;
      continue;
    }

    if (VALUE_OPTIONS.has(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        errors.push(`${arg} requires a value.`);
        continue;
      }
      index += 1;
      if (arg === "--file") options.filePath = value;
      if (arg === "--source-label") options.sourceLabel = value;
      if (arg === "--data-mode") options.dataMode = value;
      if (arg === "--base-dir") options.baseDir = value;
      if (arg === "--delimiter") options.delimiter = value;
      if (arg === "--max-bytes") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) errors.push("--max-bytes must be a positive number.");
        else options.maxBytes = parsed;
      }
      continue;
    }

    if (arg.startsWith("--") && !FLAG_OPTIONS.has(arg)) {
      errors.push(`Unsupported option: ${arg}`);
      continue;
    }
    errors.push(`Unexpected argument: ${arg}`);
  }

  if (!options.filePath) errors.push("--file is required.");
  if (!options.sourceLabel) errors.push("--source-label is required.");
  if (options.dataMode !== "research_only") errors.push("--data-mode research_only is required.");
  if (!options.confirmLocalResearchOnly) errors.push("--confirm-local-research-only is required.");
  if (!options.confirmNoProductionSource) errors.push("--confirm-no-production-source is required.");
  if (!options.confirmReviewedDryRun) errors.push("--confirm-reviewed-dry-run is required.");
  if (!options.confirmNoProductionDatabase) errors.push("--confirm-no-production-database is required.");

  if (errors.length > 0) return { ok: false, exitCode: 1, errors, showUsage: true };
  return { ok: true, options };
};

const countWarnings = (report: FinancialStatementLocalFileDryRunReport): number =>
  report.warnings.length + (report.csvDryRun?.parseWarnings.length ?? 0) + (report.csvDryRun?.importDryRun.warnings.length ?? 0);

const countErrors = (report: FinancialStatementLocalFileDryRunReport): number =>
  report.errors.length + (report.csvDryRun?.parseErrors.length ?? 0) + (report.csvDryRun?.importDryRun.errors.length ?? 0);

const isFatalDryRunStatus = (status: FinancialStatementLocalFileDryRunReport["status"]): boolean =>
  status === "file_validation_failed" || status === "file_read_failed" || status === "parse_failed";

export const formatFinancialStatementWriteTrialSummary = ({
  dryRun,
  write,
}: {
  dryRun: FinancialStatementLocalFileDryRunReport;
  write: FinancialStatementLocalWriteTrialReport;
}): string =>
  [
    "Financial statements controlled local write trial summary",
    `dryRunStatus: ${dryRun.status}`,
    `dryRunAcceptedCount: ${dryRun.csvDryRun?.importDryRun.acceptedCount ?? 0}`,
    `dryRunRejectedCount: ${dryRun.csvDryRun?.importDryRun.rejectedCount ?? 0}`,
    `dryRunSkippedCount: ${dryRun.csvDryRun?.importDryRun.skippedCount ?? 0}`,
    `dryRunWarningsCount: ${countWarnings(dryRun)}`,
    `dryRunErrorsCount: ${countErrors(dryRun)}`,
    `writeStatus: ${write.status}`,
    `writeExecuted: ${write.writeExecuted}`,
    `insertedCount: ${write.insertedCount}`,
    `updatedCount: ${write.updatedCount}`,
    `skippedExistingCount: ${write.skippedExistingCount}`,
    `writeRejectedCount: ${write.rejectedCount}`,
    `productionApproved: ${write.productionApproved}`,
    `databaseGuardAccepted: ${write.databaseGuard.accepted}`,
    `databaseMode: ${write.databaseGuard.databaseMode}`,
    `sourceLabel: ${write.sourceLabel}`,
    `dataMode: ${write.dataMode}`,
    "rejectedRowsWritten: false",
    "skippedRowsWritten: false",
  ].join("\n");

export const runFinancialStatementWriteTrialCli = async (
  argv: string[],
  deps: FinancialStatementWriteTrialCliDeps = {},
): Promise<FinancialStatementWriteTrialCliResult> => {
  const parseResult = parseFinancialStatementWriteTrialArgs(argv);
  if (!parseResult.ok) {
    return {
      exitCode: parseResult.exitCode,
      stdout: parseResult.showUsage ? `${USAGE}\n` : "",
      stderr: parseResult.errors.length > 0 ? `${parseResult.errors.join("\n")}\n` : "",
      dryRunReport: null,
      writeReport: null,
    };
  }

  const { options } = parseResult;
  const runDryRun = deps.runDryRun ?? buildFinancialStatementLocalFileDryRun;
  const dryRun = await runDryRun({
    filePath: options.filePath,
    baseDir: options.baseDir,
    maxBytes: options.maxBytes,
    delimiter: options.delimiter,
    sourceLabel: options.sourceLabel,
    dataMode: options.dataMode,
  });

  const acceptedRows = dryRun.csvDryRun?.importDryRun.acceptedRows ?? [];
  const dryRunErrors: string[] = [];
  if (isFatalDryRunStatus(dryRun.status)) dryRunErrors.push(`Dry-run fatal status: ${dryRun.status}.`);
  if (acceptedRows.length === 0) dryRunErrors.push("Dry-run acceptedRows is empty; write trial aborted.");

  if (dryRunErrors.length > 0) {
    return {
      exitCode: 1,
      stdout: options.json ? `${JSON.stringify({ dryRun, write: null, errors: dryRunErrors }, null, 2)}\n` : "",
      stderr: `${dryRunErrors.join("\n")}\n`,
      dryRunReport: dryRun,
      writeReport: null,
    };
  }

  const runWriteTrial = deps.runWriteTrial ?? runFinancialStatementLocalWriteTrial;
  const write = await runWriteTrial({
    acceptedRows,
    sourceLabel: options.sourceLabel,
    dataMode: options.dataMode,
    confirmations: {
      confirmLocalResearchOnly: options.confirmLocalResearchOnly,
      confirmNoProductionSource: options.confirmNoProductionSource,
      confirmReviewedDryRun: options.confirmReviewedDryRun,
      confirmNoProductionDatabase: options.confirmNoProductionDatabase,
    },
    databaseUrl: deps.databaseUrl ?? process.env.DATABASE_URL,
  });

  const exitCode = write.status === "write_rejected" || write.status === "write_failed" ? 1 : 0;
  const stdout = options.json
    ? `${JSON.stringify({ dryRun, write }, null, 2)}\n`
    : `${formatFinancialStatementWriteTrialSummary({ dryRun, write })}\n`;

  return {
    exitCode,
    stdout,
    stderr: write.errors.length > 0 ? `${write.errors.join("\n")}\n` : "",
    dryRunReport: dryRun,
    writeReport: write,
  };
};

if (process.argv[1]?.replace(/\\/g, "/").endsWith("/scripts/financial-statements-write-trial.ts")) {
  void runFinancialStatementWriteTrialCli(process.argv.slice(2)).then((result) => {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exitCode = result.exitCode;
  });
}
