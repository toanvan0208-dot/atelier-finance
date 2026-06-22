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
  allowFallback?: boolean;
};

type TechnicalRuntimeEnv = Record<string, string | undefined>;

export type LoadTechnicalRuntimeDataDependencies = {
  env?: TechnicalRuntimeEnv;
  loadDeskData?: typeof loadTechnicalDeskData;
};

const DEFAULT_TICKER = "FPT";
const DEFAULT_FROM = "2025-06-02";
const DEFAULT_TO = "2025-06-30";
const DEFAULT_SOURCE_LABEL = "vnstock_research_candidate";
const ENABLED_FLAG = "enabled";

const isDbSourceEnabled = (
  env: LoadTechnicalRuntimeDataDependencies["env"] = process.env,
): boolean => env.ATELIER_TECHNICAL_PVT_DB_SOURCE === ENABLED_FLAG;

const buildInput = (
  input: LoadTechnicalRuntimeDataInput = {},
  env: LoadTechnicalRuntimeDataDependencies["env"],
): LoadTechnicalDeskDataInput => {
  const requestedTicker = input.ticker;
  const hasExplicitTicker = requestedTicker !== undefined;

  return {
    ticker: hasExplicitTicker ? requestedTicker.trim().toUpperCase() : DEFAULT_TICKER,
    from: input.from ?? DEFAULT_FROM,
    to: input.to ?? DEFAULT_TO,
    sourceLabel: input.sourceLabel ?? DEFAULT_SOURCE_LABEL,
    preferDb: input.preferDb ?? (hasExplicitTicker || isDbSourceEnabled(env)),
    allowFallback: input.allowFallback ?? !hasExplicitTicker,
  };
};

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
      allowFallback: runtimeInput.allowFallback,
    });

    return {
      ...fallback,
      warnings: [
        runtimeInput.allowFallback
          ? "Technical/PVT runtime loader failed; static fallback was used."
          : "Technical/PVT runtime loader failed; cross-ticker fallback remained disabled.",
        error instanceof Error ? error.message : "Unknown runtime loader error.",
        ...fallback.warnings,
      ],
    };
  }
};
