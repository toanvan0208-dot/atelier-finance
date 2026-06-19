import {
  fetchVnstockResearchMarketPrices,
  type VnstockResearchMarketPriceFetcher,
  type VnstockResearchMarketPriceRecord,
} from "./vnstock-research-connector";
import {
  persistVnstockResearchMarketPrices,
  type PersistVnstockResearchMarketPricesResult,
} from "./vnstock-market-price-persistence";
import {
  inferVnstockManualExportFormat,
  parseVnstockManualExport,
  type VnstockManualExportFormat,
} from "./vnstock-manual-export-loader";
import { VNSTOCK_RESEARCH_SOURCE_POLICY } from "./vnstock-research-connector";

export type VnstockMarketPriceImportCommandEnv = {
  [key: string]: string | undefined;
  VNSTOCK_RESEARCH_CONNECTOR_ENABLED?: string;
  VNSTOCK_RESEARCH_ALLOW_NETWORK?: string;
  VNSTOCK_RESEARCH_MODE?: string;
  VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK?: string;
};

export type VnstockMarketPriceImportCommandArgs = {
  ticker?: string;
  from?: string;
  to?: string;
  file?: string;
  format?: VnstockManualExportFormat;
  dryRun: boolean;
};

export type VnstockMarketPriceImportCommandStatus =
  | "usage_validation_failed"
  | "connector_disabled"
  | "network_not_allowed"
  | "local_import_ack_required"
  | "mode_not_allowed"
  | "file_validation_failed"
  | "fetcher_not_configured"
  | "unsafe_source_metadata"
  | "dry_run_completed"
  | "import_completed";

export type VnstockMarketPriceImportCommandReport = {
  phase: "31E";
  status: VnstockMarketPriceImportCommandStatus;
  mode: string;
  ticker: string | null;
  from: string | null;
  to: string | null;
  dryRun: boolean;
  sourceProvider: "vnstock";
  usageScope: "academic_non_commercial";
  productionApproved: false;
  normalizedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  rejectedCount: number;
  warnings: string[];
  errors: string[];
};

export type VnstockMarketPriceImportCommandDependencies = {
  fetchMarketPrices?: VnstockResearchMarketPriceFetcher;
  persistMarketPrices?: (input: {
    records: VnstockResearchMarketPriceRecord[];
    sourceMetadata: typeof VNSTOCK_RESEARCH_SOURCE_POLICY;
  }) => Promise<PersistVnstockResearchMarketPricesResult>;
  readFileText?: (filePath: string) => Promise<string>;
  now?: Date;
  sourceMetadataOverride?: Partial<typeof VNSTOCK_RESEARCH_SOURCE_POLICY>;
};

const USAGE_WARNING =
  "Usage: import-vnstock-market-prices --ticker FPT --from YYYY-MM-DD --to YYYY-MM-DD [--file ./path.csv --format csv] [--dry-run|--write]";

const LOCAL_BOUNDARY_WARNING =
  "Local academic/research use only; Vnstock remains not production-approved.";

const TRUE_TEXT = "true";

const emptyReport = ({
  status,
  args,
  env,
  warnings = [],
  errors = [],
}: {
  status: VnstockMarketPriceImportCommandStatus;
  args: VnstockMarketPriceImportCommandArgs;
  env: VnstockMarketPriceImportCommandEnv;
  warnings?: string[];
  errors?: string[];
}): VnstockMarketPriceImportCommandReport => ({
  phase: "31E",
  status,
  mode: env.VNSTOCK_RESEARCH_MODE ?? "not_configured",
  ticker: args.ticker ?? null,
  from: args.from ?? null,
  to: args.to ?? null,
  dryRun: args.dryRun,
  sourceProvider: "vnstock",
  usageScope: "academic_non_commercial",
  productionApproved: false,
  normalizedCount: 0,
  insertedCount: 0,
  updatedCount: 0,
  skippedCount: 0,
  rejectedCount: 0,
  warnings: [LOCAL_BOUNDARY_WARNING, ...warnings],
  errors,
});

export const parseVnstockMarketPriceImportArgs = (
  argv: string[],
): VnstockMarketPriceImportCommandArgs => {
  const args: VnstockMarketPriceImportCommandArgs = { dryRun: true };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--ticker" && next) {
      args.ticker = next.trim().toUpperCase();
      index += 1;
      continue;
    }

    if (current === "--from" && next) {
      args.from = next.trim();
      index += 1;
      continue;
    }

    if (current === "--to" && next) {
      args.to = next.trim();
      index += 1;
      continue;
    }

    if (current === "--file" && next) {
      args.file = next.trim();
      index += 1;
      continue;
    }

    if (current === "--format" && next) {
      const format = next.trim().toLowerCase();
      if (format === "csv" || format === "json") {
        args.format = format;
      }
      index += 1;
      continue;
    }

    if (current === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (current === "--write") {
      args.dryRun = false;
    }
  }

  return args;
};

const isValidDateText = (value: string | undefined): boolean => {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

const validateUsage = (args: VnstockMarketPriceImportCommandArgs): string[] => {
  const errors: string[] = [];

  if (!args.ticker) errors.push("Missing required --ticker argument.");
  if (!isValidDateText(args.from)) errors.push("Missing or invalid required --from date.");
  if (!isValidDateText(args.to)) errors.push("Missing or invalid required --to date.");

  return errors;
};

const readLocalFileText = async (filePath: string): Promise<string> => {
  const { readFile } = await import("node:fs/promises");
  return readFile(filePath, "utf8");
};

const inRequestedDateRange = (
  dateText: string | null | undefined,
  from: string | undefined,
  to: string | undefined,
): boolean => {
  if (!dateText || !from || !to) return true;
  const time = Date.parse(dateText);
  const fromTime = Date.parse(from);
  const toTime = Date.parse(to);
  if (!Number.isFinite(time) || !Number.isFinite(fromTime) || !Number.isFinite(toTime)) {
    return true;
  }
  return time >= fromTime && time <= toTime;
};

const manualFileFetcher = async ({
  args,
  readFileText,
}: {
  args: VnstockMarketPriceImportCommandArgs;
  readFileText: (filePath: string) => Promise<string>;
}): Promise<{ fetcher: VnstockResearchMarketPriceFetcher | null; warnings: string[]; errors: string[] }> => {
  if (!args.file) return { fetcher: null, warnings: [], errors: [] };

  const format = args.format ?? inferVnstockManualExportFormat(args.file);
  if (!format) {
    return {
      fetcher: null,
      warnings: [],
      errors: ["Manual export file format could not be inferred; provide --format csv or --format json."],
    };
  }

  let content: string;
  try {
    content = await readFileText(args.file);
  } catch {
    return {
      fetcher: null,
      warnings: [],
      errors: [`Manual export file could not be read: ${args.file}`],
    };
  }

  const parsed = parseVnstockManualExport({ content, format });
  if (parsed.errors.length > 0) {
    return { fetcher: null, warnings: parsed.warnings, errors: parsed.errors };
  }

  const ticker = args.ticker?.trim().toUpperCase();
  const warnings = [...parsed.warnings];
  const records = parsed.records.filter((record) => {
    const recordTicker = record.ticker?.trim().toUpperCase() ?? "";

    if (ticker && recordTicker.length > 0 && recordTicker !== ticker) {
      warnings.push(`Manual export record for ${recordTicker} was skipped because --ticker is ${ticker}.`);
      return false;
    }

    if (!inRequestedDateRange(record.date, args.from, args.to)) {
      warnings.push(`Manual export record for ${recordTicker || "unknown"} ${record.date ?? "unknown date"} was skipped because it is outside the requested date range.`);
      return false;
    }

    return true;
  });

  return {
    fetcher: async () => records,
    warnings,
    errors: [],
  };
};

const validateSafetyEnv = (
  env: VnstockMarketPriceImportCommandEnv,
): { status: VnstockMarketPriceImportCommandStatus | null; errors: string[] } => {
  if (env.VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK !== TRUE_TEXT) {
    return {
      status: "local_import_ack_required",
      errors: [
        "VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true is required before any local import command may fetch or persist.",
      ],
    };
  }

  if (env.VNSTOCK_RESEARCH_CONNECTOR_ENABLED !== TRUE_TEXT) {
    return {
      status: "connector_disabled",
      errors: ["VNSTOCK_RESEARCH_CONNECTOR_ENABLED=true is required."],
    };
  }

  if (env.VNSTOCK_RESEARCH_MODE !== "local_research") {
    return {
      status: "mode_not_allowed",
      errors: ["VNSTOCK_RESEARCH_MODE=local_research is required."],
    };
  }

  if (env.VNSTOCK_RESEARCH_ALLOW_NETWORK !== TRUE_TEXT) {
    return {
      status: "network_not_allowed",
      errors: ["VNSTOCK_RESEARCH_ALLOW_NETWORK=true is required for controlled local research fetch."],
    };
  }

  return { status: null, errors: [] };
};

const safeSourceMetadata = (
  override: Partial<typeof VNSTOCK_RESEARCH_SOURCE_POLICY> | undefined,
): typeof VNSTOCK_RESEARCH_SOURCE_POLICY | null => {
  const metadata = {
    ...VNSTOCK_RESEARCH_SOURCE_POLICY,
    ...override,
  };

  if (metadata.productionApproved !== false) {
    return null;
  }

  return metadata;
};

export const runVnstockMarketPriceImportCommand = async (
  input: {
    argv: string[];
    env: VnstockMarketPriceImportCommandEnv;
  },
  dependencies: VnstockMarketPriceImportCommandDependencies = {},
): Promise<VnstockMarketPriceImportCommandReport> => {
  const args = parseVnstockMarketPriceImportArgs(input.argv);
  const usageErrors = validateUsage(args);

  if (usageErrors.length > 0) {
    return emptyReport({
      status: "usage_validation_failed",
      args,
      env: input.env,
      warnings: [USAGE_WARNING],
      errors: usageErrors,
    });
  }

  const safety = validateSafetyEnv(input.env);
  if (safety.status) {
    return emptyReport({
      status: safety.status,
      args,
      env: input.env,
      errors: safety.errors,
    });
  }

  const sourceMetadata = safeSourceMetadata(dependencies.sourceMetadataOverride);
  if (!sourceMetadata) {
    return emptyReport({
      status: "unsafe_source_metadata",
      args,
      env: input.env,
      errors: ["Unsafe source metadata rejected because productionApproved must remain false."],
    });
  }

  const fileFetcher = await manualFileFetcher({
    args,
    readFileText: dependencies.readFileText ?? readLocalFileText,
  });
  if (fileFetcher.errors.length > 0) {
    return emptyReport({
      status: "file_validation_failed",
      args,
      env: input.env,
      warnings: fileFetcher.warnings,
      errors: fileFetcher.errors,
    });
  }

  const fetchMarketPrices = dependencies.fetchMarketPrices ?? fileFetcher.fetcher;

  if (!fetchMarketPrices) {
    return emptyReport({
      status: "fetcher_not_configured",
      args,
      env: input.env,
      errors: ["No injected local research fetcher is configured for this command."],
    });
  }

  const fetched = await fetchVnstockResearchMarketPrices(
    {
      ticker: args.ticker ?? "",
      startDate: args.from,
      endDate: args.to,
    },
    {
      enabled: true,
      allowNetwork: true,
      mode: "local_research",
      fetchMarketPrices,
      now: dependencies.now,
    },
  );

  if (!fetched.ok) {
    return emptyReport({
      status: fetched.status === "network_not_allowed" ? "network_not_allowed" : "fetcher_not_configured",
      args,
      env: input.env,
      warnings: [...fileFetcher.warnings, ...fetched.warnings],
      errors: [`Vnstock research connector returned ${fetched.status}.`],
    });
  }

  if (args.dryRun) {
    return {
      ...emptyReport({
        status: "dry_run_completed",
        args,
        env: input.env,
        warnings: [...fileFetcher.warnings, ...fetched.warnings],
      }),
      normalizedCount: fetched.data.length,
      rejectedCount: Math.max(0, fetched.warnings.length - 4),
    };
  }

  const persist =
    dependencies.persistMarketPrices ??
    ((persistInput) => persistVnstockResearchMarketPrices(persistInput));

  const persisted = await persist({
    records: fetched.data,
    sourceMetadata,
  });

  return {
    ...emptyReport({
      status: "import_completed",
      args,
      env: input.env,
      warnings: [...fileFetcher.warnings, ...fetched.warnings, ...persisted.warnings],
    }),
    normalizedCount: fetched.data.length,
    insertedCount: persisted.insertedCount,
    updatedCount: persisted.updatedCount,
    skippedCount: persisted.skippedCount,
    rejectedCount: persisted.rejectedCount,
  };
};
