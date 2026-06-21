import {
  loadTechnicalDeskData,
  type LoadTechnicalDeskDataInput,
  type LoadTechnicalDeskDataResult,
} from "./load-technical-desk-data";

export type LoadTechnicalRuntimeDataInput = {
  ticker?: string;
  from?: string;
  to?: string;
  sourceLabel?: string;
  preferDb?: boolean;
};

type TechnicalRuntimeEnv = Record<string, string | undefined>;

export type LoadTechnicalRuntimeDataDependencies = {
  env?: TechnicalRuntimeEnv;
  loadDeskData?: typeof loadTechnicalDeskData;
};

const DEFAULT_TICKER = "FPT";
const DEFAULT_FROM = "2025-01-01";
const DEFAULT_TO = "2025-01-31";
const ENABLED_FLAG = "enabled";

const isDbSourceEnabled = (
  env: LoadTechnicalRuntimeDataDependencies["env"] = process.env,
): boolean => env.ATELIER_TECHNICAL_PVT_DB_SOURCE === ENABLED_FLAG;

const buildInput = (
  input: LoadTechnicalRuntimeDataInput = {},
  env: LoadTechnicalRuntimeDataDependencies["env"],
): LoadTechnicalDeskDataInput => ({
  ticker: input.ticker ?? DEFAULT_TICKER,
  from: input.from ?? DEFAULT_FROM,
  to: input.to ?? DEFAULT_TO,
  sourceLabel: input.sourceLabel,
  preferDb: input.preferDb ?? isDbSourceEnabled(env),
  allowFallback: true,
});

export const loadTechnicalRuntimeData = async (
  input: LoadTechnicalRuntimeDataInput = {},
  dependencies: LoadTechnicalRuntimeDataDependencies = {},
): Promise<LoadTechnicalDeskDataResult> => {
  const loadDeskData = dependencies.loadDeskData ?? loadTechnicalDeskData;
  const runtimeInput = buildInput(input, dependencies.env);

  try {
    return await loadDeskData(runtimeInput);
  } catch (error) {
    const fallback = await loadTechnicalDeskData({
      ...runtimeInput,
      preferDb: false,
      allowFallback: true,
    });

    return {
      ...fallback,
      warnings: [
        "Technical/PVT runtime loader failed; static fallback was used.",
        error instanceof Error ? error.message : "Unknown runtime loader error.",
        ...fallback.warnings,
      ],
    };
  }
};
