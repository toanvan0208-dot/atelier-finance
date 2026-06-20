import {
  buildControlledValuationCalculation,
  type ControlledValuationCalculationResult,
} from "./controlled-valuation-calculation";
import type { ValuationSourceMode } from "./valuation-financials-runtime-consumption";

export type ControlledValuationIntegrationInputSource = "financials_runtime" | "persisted_bridge" | "unavailable";

export type ControlledValuationSelectedInput = {
  value: number | null;
  source: ControlledValuationIntegrationInputSource;
};

export type ControlledValuationFinancialsRuntimeSnapshot = {
  revenue?: number | null;
  netIncome?: number | null;
  netProfit?: number | null;
  equity?: number | null;
  totalEquity?: number | null;
  eps?: number | null;
  sharesOutstanding?: number | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  readPath?: string | null;
  runtimeStatus?: string | null;
  fallbackUsed?: boolean | null;
  productionApproved?: boolean | null;
};

export type ControlledValuationPersistedInputs = {
  revenue?: number | null;
  netIncome?: number | null;
  equity?: number | null;
  eps?: number | null;
  sharesOutstanding?: number | null;
  marketPrice?: number | null;
  marketCap?: number | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  productionApproved?: boolean | null;
};

export type ControlledValuationIntegrationMode =
  | "fallback"
  | "financials_runtime_available"
  | "mixed_source"
  | "persisted_bridge";

export type ControlledValuationIntegrationInput = {
  financialsRuntimeSnapshot?: ControlledValuationFinancialsRuntimeSnapshot | null;
  persistedValuationInputs?: ControlledValuationPersistedInputs | null;
  mode?: ControlledValuationIntegrationMode;
};

export type ControlledValuationIntegrationBoundary = {
  calculation: ControlledValuationCalculationResult;
  selectedInputs: {
    revenue: ControlledValuationSelectedInput;
    netIncome: ControlledValuationSelectedInput;
    equity: ControlledValuationSelectedInput;
    eps: ControlledValuationSelectedInput;
    sharesOutstanding: ControlledValuationSelectedInput;
    marketPrice: ControlledValuationSelectedInput;
    marketCap: ControlledValuationSelectedInput;
  };
  sourceBoundary: {
    valuationSourceMode: ValuationSourceMode;
    canClaimValuationDbBacked: false;
    productionApproved: false;
    warnings: string[];
  };
  integrationNotes: string[];
};

const isPresentNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const selectFinancialInput = ({
  field,
  persistedValue,
  runtimeValue,
  warnings,
}: {
  field: string;
  runtimeValue: number | null | undefined;
  persistedValue: number | null | undefined;
  warnings: string[];
}): ControlledValuationSelectedInput => {
  if (isPresentNumber(runtimeValue)) {
    return { value: runtimeValue, source: "financials_runtime" };
  }

  if (isPresentNumber(persistedValue)) {
    if (runtimeValue === null) {
      warnings.push(`runtime_${field}_missing_used_persisted_bridge`);
    }
    return { value: persistedValue, source: "persisted_bridge" };
  }

  return { value: null, source: "unavailable" };
};

const selectPersistedMarketInput = (value: number | null | undefined): ControlledValuationSelectedInput =>
  isPresentNumber(value) ? { value, source: "persisted_bridge" } : { value: null, source: "unavailable" };

const hasSource = (
  selectedInputs: ControlledValuationIntegrationBoundary["selectedInputs"],
  source: ControlledValuationIntegrationInputSource,
): boolean => Object.values(selectedInputs).some((input) => input.source === source);

const hasAnyPersistedInput = (persisted?: ControlledValuationPersistedInputs | null): boolean =>
  Boolean(
    persisted &&
      [
        persisted.revenue,
        persisted.netIncome,
        persisted.equity,
        persisted.eps,
        persisted.sharesOutstanding,
        persisted.marketPrice,
        persisted.marketCap,
      ].some(isPresentNumber),
  );

const resolveSourceMode = ({
  fallbackUsed,
  hasPersisted,
  hasRuntime,
  mode,
}: {
  fallbackUsed: boolean;
  hasPersisted: boolean;
  hasRuntime: boolean;
  mode?: ControlledValuationIntegrationMode;
}): ValuationSourceMode => {
  if (fallbackUsed || mode === "fallback") return "sample_fallback";
  if (mode === "mixed_source" || (hasRuntime && hasPersisted)) return "mixed_source";
  if (hasRuntime) return "financials_runtime_partial";
  if (hasPersisted || mode === "persisted_bridge") return "persisted_bridge";
  return "not_wired";
};

const sourceWarnings = ({
  fallbackUsed,
  runtime,
  selectedInputs,
  warnings,
}: {
  fallbackUsed: boolean;
  runtime?: ControlledValuationFinancialsRuntimeSnapshot | null;
  selectedInputs: ControlledValuationIntegrationBoundary["selectedInputs"];
  warnings: string[];
}): string[] => {
  const hasRuntime = hasSource(selectedInputs, "financials_runtime");
  const hasPersisted = hasSource(selectedInputs, "persisted_bridge");
  const runtimeIsLocalResearch =
    runtime?.dataMode === "research_only" || runtime?.dataMode === "local" || runtime?.readPath === "local_db";
  const output = [
    ...warnings,
    ...(hasRuntime && hasPersisted ? ["valuation_remains_mixed_source"] : []),
    ...(runtimeIsLocalResearch ? ["local_research_data_not_production_approved"] : []),
    ...(fallbackUsed ? ["fallback_data_not_production_approved"] : []),
    "can_claim_valuation_db_backed_false",
    "production_approved_false",
  ];

  return Array.from(new Set(output));
};

export const buildControlledValuationIntegrationBoundary = ({
  financialsRuntimeSnapshot = null,
  mode,
  persistedValuationInputs = null,
}: ControlledValuationIntegrationInput = {}): ControlledValuationIntegrationBoundary => {
  const warnings: string[] = [];
  const runtime = financialsRuntimeSnapshot;
  const persisted = persistedValuationInputs;
  const selectedInputs = {
    revenue: selectFinancialInput({
      field: "revenue",
      runtimeValue: runtime?.revenue,
      persistedValue: persisted?.revenue,
      warnings,
    }),
    netIncome: selectFinancialInput({
      field: "net_income",
      runtimeValue: runtime?.netIncome ?? runtime?.netProfit,
      persistedValue: persisted?.netIncome,
      warnings,
    }),
    equity: selectFinancialInput({
      field: "equity",
      runtimeValue: runtime?.equity ?? runtime?.totalEquity,
      persistedValue: persisted?.equity,
      warnings,
    }),
    eps: selectFinancialInput({
      field: "eps",
      runtimeValue: runtime?.eps,
      persistedValue: persisted?.eps,
      warnings,
    }),
    sharesOutstanding: selectFinancialInput({
      field: "shares_outstanding",
      runtimeValue: runtime?.sharesOutstanding,
      persistedValue: persisted?.sharesOutstanding,
      warnings,
    }),
    marketPrice: selectPersistedMarketInput(persisted?.marketPrice),
    marketCap: selectPersistedMarketInput(persisted?.marketCap),
  };
  const fallbackUsed = Boolean(runtime?.fallbackUsed) || mode === "fallback";
  const hasRuntimeInput = hasSource(selectedInputs, "financials_runtime");
  const hasPersistedInput = hasSource(selectedInputs, "persisted_bridge") || hasAnyPersistedInput(persisted);
  const valuationSourceMode = resolveSourceMode({
    fallbackUsed,
    hasPersisted: hasPersistedInput,
    hasRuntime: hasRuntimeInput,
    mode,
  });
  const mixedSource = valuationSourceMode === "mixed_source";
  const calculation = buildControlledValuationCalculation({
    financials: {
      revenue: selectedInputs.revenue.value,
      netIncome: selectedInputs.netIncome.value,
      equity: selectedInputs.equity.value,
      eps: selectedInputs.eps.value,
      sharesOutstanding: selectedInputs.sharesOutstanding.value,
    },
    market: {
      marketPrice: selectedInputs.marketPrice.value,
      marketCap: selectedInputs.marketCap.value,
    },
    source: {
      financialsSourceMode: hasRuntimeInput ? "financials_runtime_partial" : selectedInputs.revenue.source,
      marketSourceMode: selectedInputs.marketPrice.source === "persisted_bridge" || selectedInputs.marketCap.source === "persisted_bridge"
        ? "persisted_bridge"
        : "not_wired",
      dataMode: runtime?.dataMode ?? persisted?.dataMode ?? null,
      productionApproved: false,
      mixedSource,
      fallbackUsed,
    },
  });
  const boundaryWarnings = sourceWarnings({
    fallbackUsed,
    runtime,
    selectedInputs,
    warnings: [...warnings, ...calculation.sourceBoundary.warnings],
  });

  return {
    calculation,
    selectedInputs,
    sourceBoundary: {
      valuationSourceMode,
      canClaimValuationDbBacked: false,
      productionApproved: false,
      warnings: boundaryWarnings,
    },
    integrationNotes: [
      "calculation_helper_integrated_ui_output_unchanged",
      "market_inputs_remain_persisted_or_pvt_owned",
      "financial_inputs_may_use_runtime_when_available",
      "no_ev_dcf_or_fair_value_integration",
    ],
  };
};
