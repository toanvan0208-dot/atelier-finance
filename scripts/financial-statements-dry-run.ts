import { buildFinancialStatementLocalFileDryRun } from "../src/lib/data-sources/financial-statement-local-file-dry-run";
import type { FinancialStatementLocalFileDryRunReport } from "../src/lib/data-sources/financial-statement-local-file-dry-run";

export type FinancialStatementDryRunCliOptions = {
  filePath: string | null;
  baseDir?: string;
  maxBytes?: number;
  sourceLabel?: string;
  dataMode?: string;
  delimiter?: string;
  json: boolean;
  help: boolean;
};

export type FinancialStatementDryRunCliParseResult =
  | { ok: true; options: FinancialStatementDryRunCliOptions }
  | { ok: false; errors: string[]; help: boolean };

export type FinancialStatementDryRunCliDeps = {
  runDryRun?: typeof buildFinancialStatementLocalFileDryRun;
  writeStdout?: (text: string) => void;
  writeStderr?: (text: string) => void;
};

export type FinancialStatementDryRunCliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  report: FinancialStatementLocalFileDryRunReport | null;
};

const USAGE = [
  "Usage: npm run financials:dry-run -- --file <path> [options]",
  "",
  "Options:",
  "  --file <path>             Required local .csv/.txt file path.",
  "  --base-dir <path>         Optional base directory; paths outside it are rejected.",
  "  --max-bytes <number>      Optional max file size before read.",
  "  --source-label <label>    Optional source label for local research metadata.",
  "  --data-mode <mode>        Optional data mode; defaults stay research-only.",
  "  --delimiter <char>        Optional single-character CSV delimiter.",
  "  --json                    Print sanitized JSON report.",
  "  --help                    Show this usage.",
  "",
  "Dry-run only: DB writes, public upload APIs, and write flags are not supported.",
].join("\n");

const OPTIONS_WITH_VALUES = new Set([
  "--file",
  "--base-dir",
  "--max-bytes",
  "--source-label",
  "--data-mode",
  "--delimiter",
]);

const BLOCKED_OPTIONS = new Set(["--write", "--commit", "--db", "--seed"]);

export const getFinancialStatementDryRunUsage = (): string => USAGE;

export const parseFinancialStatementDryRunArgs = (
  argv: string[],
): FinancialStatementDryRunCliParseResult => {
  const errors: string[] = [];
  const options: FinancialStatementDryRunCliOptions = {
    filePath: null,
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (BLOCKED_OPTIONS.has(arg)) {
      errors.push(`write_not_supported: Phase 42 is dry-run only; ${arg} is not supported.`);
      continue;
    }

    if (!OPTIONS_WITH_VALUES.has(arg)) {
      errors.push(`unknown_option: ${arg}`);
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      errors.push(`missing_value: ${arg}`);
      continue;
    }

    index += 1;
    if (arg === "--file") options.filePath = value;
    if (arg === "--base-dir") options.baseDir = value;
    if (arg === "--source-label") options.sourceLabel = value;
    if (arg === "--data-mode") options.dataMode = value;
    if (arg === "--delimiter") options.delimiter = value;
    if (arg === "--max-bytes") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push("invalid_max_bytes: --max-bytes must be a non-negative number.");
      } else {
        options.maxBytes = Math.floor(parsed);
      }
    }
  }

  if (!options.help && !options.filePath) {
    errors.push("file_required: --file <path> is required.");
  }

  if (errors.length > 0) return { ok: false, errors, help: options.help };
  return { ok: true, options };
};

const countWarnings = (report: FinancialStatementLocalFileDryRunReport): number =>
  report.warnings.length + (report.csvDryRun?.importDryRun.warnings.length ?? 0);

const countErrors = (report: FinancialStatementLocalFileDryRunReport): number =>
  report.errors.length + (report.csvDryRun?.importDryRun.errors.length ?? 0);

export const formatFinancialStatementDryRunSummary = (
  report: FinancialStatementLocalFileDryRunReport,
): string => {
  const importDryRun = report.csvDryRun?.importDryRun;
  const acceptedCount = importDryRun?.acceptedCount ?? 0;
  const rejectedCount = importDryRun?.rejectedCount ?? 0;
  const skippedCount = importDryRun?.skippedCount ?? 0;
  const sourceLabel = importDryRun?.sourceSummary.sourceLabel ?? "user_provided_local_file";
  const dataMode = importDryRun?.sourceSummary.dataMode ?? "research_only";

  return [
    "Financial statements local dry-run summary",
    `status: ${report.status}`,
    `dryRun: ${report.dryRun}`,
    `writePlanned: ${report.writePlanned}`,
    `noDbWrite: ${report.noDbWrite}`,
    `productionApproved: ${report.productionApproved}`,
    `fileName: ${report.file.fileName ?? "unavailable"}`,
    `sizeBytes: ${report.file.sizeBytes ?? "unavailable"}`,
    `acceptedCount: ${acceptedCount}`,
    `rejectedCount: ${rejectedCount}`,
    `skippedCount: ${skippedCount}`,
    `warningsCount: ${countWarnings(report)}`,
    `errorsCount: ${countErrors(report)}`,
    `sourceLabel: ${sourceLabel}`,
    `dataMode: ${dataMode}`,
  ].join("\n");
};

const isFatalStatus = (status: FinancialStatementLocalFileDryRunReport["status"]): boolean =>
  status === "file_validation_failed" || status === "file_read_failed" || status === "parse_failed";

export const runFinancialStatementDryRunCli = async (
  argv: string[],
  deps: FinancialStatementDryRunCliDeps = {},
): Promise<FinancialStatementDryRunCliResult> => {
  const writeStdout = deps.writeStdout ?? (() => undefined);
  const writeStderr = deps.writeStderr ?? (() => undefined);
  const parseResult = parseFinancialStatementDryRunArgs(argv);

  if (!parseResult.ok) {
    const output = [USAGE, "", ...parseResult.errors].join("\n");
    if (parseResult.help && parseResult.errors.length === 0) {
      writeStdout(`${USAGE}\n`);
      return { exitCode: 0, stdout: `${USAGE}\n`, stderr: "", report: null };
    }
    writeStderr(`${output}\n`);
    return { exitCode: 1, stdout: "", stderr: `${output}\n`, report: null };
  }

  if (parseResult.options.help) {
    writeStdout(`${USAGE}\n`);
    return { exitCode: 0, stdout: `${USAGE}\n`, stderr: "", report: null };
  }

  const runDryRun = deps.runDryRun ?? buildFinancialStatementLocalFileDryRun;
  const report = await runDryRun({
    filePath: parseResult.options.filePath ?? "",
    baseDir: parseResult.options.baseDir,
    maxBytes: parseResult.options.maxBytes,
    sourceLabel: parseResult.options.sourceLabel,
    dataMode: parseResult.options.dataMode,
    delimiter: parseResult.options.delimiter,
  });

  const stdout = parseResult.options.json
    ? `${JSON.stringify(report, null, 2)}\n`
    : `${formatFinancialStatementDryRunSummary(report)}\n`;

  writeStdout(stdout);
  return {
    exitCode: isFatalStatus(report.status) ? 1 : 0,
    stdout,
    stderr: "",
    report,
  };
};

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("/scripts/financial-statements-dry-run.ts");

if (isDirectRun) {
  void runFinancialStatementDryRunCli(process.argv.slice(2), {
    writeStdout: (text) => process.stdout.write(text),
    writeStderr: (text) => process.stderr.write(text),
  }).then((result) => {
    process.exitCode = result.exitCode;
  });
}
