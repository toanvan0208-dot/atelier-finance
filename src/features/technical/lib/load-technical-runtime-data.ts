import {
  loadTechnicalDeskData,
  type LoadTechnicalDeskDataInput,
  type LoadTechnicalDeskDataResult,
} from "./load-technical-desk-data";
import { buildRelativeMarketSectorMetrics } from "./build-relative-market-sector-metrics";

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
const ENABLED_FLAG = "enabled";

const defaultToDate = () => new Date().toISOString().slice(0, 10);
const defaultFromDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

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
    from: input.from ?? defaultFromDate(),
    to: input.to ?? defaultToDate(),
    sourceLabel: input.sourceLabel,
    preferDb: input.preferDb ?? (hasExplicitTicker || isDbSourceEnabled(env)),
    allowFallback: input.allowFallback ?? false,
  };
};

export const loadTechnicalRuntimeData = async (
  input: LoadTechnicalRuntimeDataInput = {},
  dependencies: LoadTechnicalRuntimeDataDependencies = {},
): Promise<LoadTechnicalDeskDataResult> => {
  const loadDeskData = dependencies.loadDeskData ?? loadTechnicalDeskData;
  const runtimeInput = buildInput(input, dependencies.env);

  try {
    const data = await loadDeskData(runtimeInput);
    
    // Load provenance integration
    const { loadTechnicalProvenanceRuntime } = await import("./technical-provenance-runtime");
    const provenance = await loadTechnicalProvenanceRuntime(runtimeInput.ticker);
    
    let updatedData = data.data;
    if (updatedData) {
      const relativeMetrics = await buildRelativeMarketSectorMetrics(runtimeInput.ticker);
      if (relativeMetrics) {
        updatedData = {
          ...updatedData,
          relativeMetrics
        };
      }
    }
    
    return {
      ...data,
      data: updatedData,
      provenance: provenance ?? undefined,
    } as unknown as LoadTechnicalDeskDataResult;
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
