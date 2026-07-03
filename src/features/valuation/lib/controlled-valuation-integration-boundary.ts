import {
  buildControlledValuationCalculation,
  type ControlledValuationCalculationResult,
} from "./controlled-valuation-calculation";
import {
  normalizeValuationInput,
  type ValuationInputNormalizationKind,
  type ValuationInputNormalizationStatus,
  type ValuationInputProvenance,
  type ValuationUnit,
} from "./valuation-input-unit-provenance";
import type {
  MarketPvtFieldUnitMetadata,
  MarketPvtNumericField,
} from "@/features/technical/lib/market-pvt-unit-metadata-contract";
import type { ValuationSourceMode } from "./valuation-financials-runtime-consumption";

export type ControlledValuationIntegrationInputSource =
  | "financials_runtime"
  | "persisted_bridge"
  | "market_pvt"
  | "unavailable";

export type ControlledValuationInputUnitMap = {
  revenue?: ValuationUnit | null;
  netIncome?: ValuationUnit | null;
  equity?: ValuationUnit | null;
  eps?: ValuationUnit | null;
  sharesOutstanding?: ValuationUnit | null;
  marketPrice?: ValuationUnit | null;
  marketCap?: ValuationUnit | null;
};

export type ControlledValuationSelectedInput = {
  value: number | null;
  rawValue: number | null;
  source: ControlledValuationIntegrationInputSource;
  unit: ValuationUnit;
  normalizedUnit: ValuationUnit | "not_normalized";
  normalizationStatus: ValuationInputNormalizationStatus;
  provenance: ValuationInputProvenance;
  warnings: string[];
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
  asOf?: string | null;
  fiscalYear?: number | null;
  period?: string | null;
  periodType?: string | null;
  units?: ControlledValuationInputUnitMap | null;
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
  units?: ControlledValuationInputUnitMap | null;
  marketUnitMetadata?: Partial<Record<MarketPvtNumericField, MarketPvtFieldUnitMetadata>> | null;
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
    financialsSourceMode: string;
    marketSourceMode: string;
    canClaimValuationDbBacked: false;
    productionApproved: false;
    warnings: string[];
  };
  integrationNotes: string[];
};

const isPresentNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasUsablePeriodMetadata = (runtime?: ControlledValuationFinancialsRuntimeSnapshot | null): boolean =>
  Boolean(runtime?.asOf || typeof runtime?.fiscalYear === "number" || runtime?.period);

const isVerifiedFinancialsRuntimeSnapshot = (
  runtime?: ControlledValuationFinancialsRuntimeSnapshot | null,
): boolean =>
  Boolean(
    runtime &&
      runtime.runtimeStatus === "db_backed" &&
      runtime.readPath === "local_db" &&
      runtime.fallbackUsed !== true &&
      runtime.productionApproved !== true &&
      runtime.sourceLabel &&
      runtime.periodType &&
      hasUsablePeriodMetadata(runtime),
  );

const inputUnit = (
  units: ControlledValuationInputUnitMap | null | undefined,
  field: keyof ControlledValuationInputUnitMap,
): ValuationUnit => units?.[field] ?? "unknown";

const sourceForProvenance = (source: ControlledValuationIntegrationInputSource): ValuationInputProvenance["source"] => {
  if (source === "financials_runtime") return "financials_runtime";
  if (source === "market_pvt") return "market_pvt";
  if (source === "persisted_bridge") return "persisted_bridge";
  return "unknown";
};

const selectedInput = ({
  dataMode,
  expected,
  field,
  productionApproved,
  source,
  sourceLabel,
  unit,
  value,
  warnings: additionalWarnings = [],
}: {
  field: string;
  value: number | null | undefined;
  unit: ValuationUnit;
  expected: ValuationInputNormalizationKind;
  source: ControlledValuationIntegrationInputSource;
  sourceLabel?: string | null;
  dataMode?: string | null;
  productionApproved?: boolean | null;
  warnings?: string[];
}): ControlledValuationSelectedInput => {
  const normalized = normalizeValuationInput({
    expected,
    provenance: {
      dataMode,
      productionApproved: productionApproved === true,
      source: sourceForProvenance(source),
      sourceLabel,
    },
    unit,
    value,
  });

  return {
    rawValue: normalized.value,
    value: normalized.normalizedValue,
    source,
    unit: normalized.unit,
    normalizedUnit: normalized.normalizedUnit,
    normalizationStatus: normalized.status,
    provenance: normalized.provenance,
    warnings: [...normalized.warnings.map((warning) => `${field}_${warning}`), ...additionalWarnings],
  };
};

const selectFinancialInput = ({
  expected,
  field,
  persisted,
  persistedValue,
  runtime,
  runtimeValue,
  warnings,
}: {
  field: string;
  expected: ValuationInputNormalizationKind;
  runtimeValue: number | null | undefined;
  persistedValue: number | null | undefined;
  runtime?: ControlledValuationFinancialsRuntimeSnapshot | null;
  persisted?: ControlledValuationPersistedInputs | null;
  warnings: string[];
}): ControlledValuationSelectedInput => {
  const runtimeVerified = isVerifiedFinancialsRuntimeSnapshot(runtime);

  if (isPresentNumber(runtimeValue) && runtimeVerified) {
    const input = selectedInput({
      dataMode: runtime?.dataMode,
      expected,
      field,
      productionApproved: runtime?.productionApproved,
      source: "financials_runtime",
      sourceLabel: runtime?.sourceLabel,
      unit: inputUnit(runtime?.units, field as keyof ControlledValuationInputUnitMap),
      value: runtimeValue,
    });
    warnings.push(...input.warnings);
    if (input.normalizationStatus === "ready" || !isPresentNumber(persistedValue)) {
      return input;
    }
    warnings.push(`runtime_${field}_not_normalized_used_persisted_bridge`);
  }

  if (isPresentNumber(runtimeValue) && !runtimeVerified) {
    warnings.push(`runtime_${field}_not_verified_for_valuation_input`);
  }

  if (isPresentNumber(persistedValue)) {
    if (runtimeValue === null) {
      warnings.push(`runtime_${field}_missing_used_persisted_bridge`);
    }
    const input = selectedInput({
      dataMode: persisted?.dataMode,
      expected,
      field,
      productionApproved: persisted?.productionApproved,
      source: "persisted_bridge",
      sourceLabel: persisted?.sourceLabel,
      unit: inputUnit(persisted?.units, field as keyof ControlledValuationInputUnitMap),
      value: persistedValue,
    });
    warnings.push(...input.warnings);
    return input;
  }

  return selectedInput({
    expected,
    field,
    source: "unavailable",
    unit: "unknown",
    value: null,
  });
};

const selectPersistedMarketInput = ({
  expected,
  field,
  persisted,
  value,
  warnings,
}: {
  field: "marketPrice" | "marketCap";
  expected: ValuationInputNormalizationKind;
  value: number | null | undefined;
  persisted?: ControlledValuationPersistedInputs | null;
  warnings: string[];
}): ControlledValuationSelectedInput => {
  if (!isPresentNumber(value)) {
    return selectedInput({
      expected,
      field,
      source: "unavailable",
      unit: "unknown",
      value: null,
    });
  }

  const metadata = persisted?.marketUnitMetadata?.[field];
  const hasMarketMetadata = Boolean(metadata);
  const metadataStatus = metadata?.status;
  const metadataSource =
    metadata?.source === "persisted_market_bridge" ? "persisted_bridge" : "market_pvt";
  const selectedValue =
    metadataStatus === "invalid_value"
      ? Number.NaN
      : hasMarketMetadata && metadataStatus !== "ready"
        ? metadata?.value ?? null
        : value;
  const input = selectedInput({
    dataMode: metadata?.dataMode ?? persisted?.dataMode,
    expected,
    field,
    productionApproved: persisted?.productionApproved,
    source: hasMarketMetadata ? metadataSource : "persisted_bridge",
    sourceLabel: metadata?.sourceLabel ?? persisted?.sourceLabel,
    unit: metadata?.unit ?? inputUnit(persisted?.units, field),
    value: selectedValue,
    warnings: metadata?.warnings ?? [],
  });
  warnings.push(...input.warnings);
  return input;
};

const normalizedValue = (input: ControlledValuationSelectedInput): number | null =>
  input.normalizationStatus === "ready" ? input.value : null;

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

const hasAnyMarketPvtInput = (
  selectedInputs: ControlledValuationIntegrationBoundary["selectedInputs"],
): boolean => hasSource(selectedInputs, "market_pvt");

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
  if (hasRuntime) return "financials_input_db_backed";
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
  const runtimeVerified = isVerifiedFinancialsRuntimeSnapshot(runtime);
  const output = [
    ...warnings,
    ...(hasRuntime && hasPersisted ? ["valuation_remains_mixed_source"] : []),
    ...(hasRuntime && runtimeVerified ? ["financials_input_db_backed_local_imported"] : []),
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
      expected: "currency",
      field: "revenue",
      persisted,
      runtimeValue: runtime?.revenue,
      runtime,
      persistedValue: persisted?.revenue,
      warnings,
    }),
    netIncome: selectFinancialInput({
      expected: "currency",
      field: "netIncome",
      persisted,
      runtimeValue: runtime?.netIncome ?? runtime?.netProfit,
      runtime,
      persistedValue: persisted?.netIncome,
      warnings,
    }),
    equity: selectFinancialInput({
      expected: "currency",
      field: "equity",
      persisted,
      runtimeValue: runtime?.equity ?? runtime?.totalEquity,
      runtime,
      persistedValue: persisted?.equity,
      warnings,
    }),
    eps: selectFinancialInput({
      expected: "per_share",
      field: "eps",
      persisted,
      runtimeValue: runtime?.eps,
      runtime,
      persistedValue: persisted?.eps,
      warnings,
    }),
    sharesOutstanding: selectFinancialInput({
      expected: "shares",
      field: "sharesOutstanding",
      persisted,
      runtimeValue: runtime?.sharesOutstanding,
      runtime,
      persistedValue: persisted?.sharesOutstanding,
      warnings,
    }),
    marketPrice: selectPersistedMarketInput({
      expected: "per_share",
      field: "marketPrice",
      persisted,
      value: persisted?.marketPrice,
      warnings,
    }),
    marketCap: selectPersistedMarketInput({
      expected: "currency",
      field: "marketCap",
      persisted,
      value: persisted?.marketCap,
      warnings,
    }),
  };
  const fallbackUsed = Boolean(runtime?.fallbackUsed) || mode === "fallback";
  const hasRuntimeInput = hasSource(selectedInputs, "financials_runtime");
  const hasPersistedInput = hasSource(selectedInputs, "persisted_bridge") || hasAnyPersistedInput(persisted);
  const hasMarketPvtInput = hasAnyMarketPvtInput(selectedInputs);
  const valuationSourceMode = resolveSourceMode({
    fallbackUsed,
    hasPersisted: hasPersistedInput || hasMarketPvtInput,
    hasRuntime: hasRuntimeInput,
    mode,
  });
  const mixedSource = valuationSourceMode === "mixed_source";
  const financialsSourceMode = hasRuntimeInput ? "financials_input_db_backed_local_imported" : selectedInputs.revenue.source;
  const marketSourceMode =
    selectedInputs.marketPrice.source === "market_pvt" || selectedInputs.marketCap.source === "market_pvt"
      ? "market_pvt"
      : selectedInputs.marketPrice.source === "persisted_bridge" || selectedInputs.marketCap.source === "persisted_bridge"
        ? "persisted_bridge"
        : "not_wired";
  const calculation = buildControlledValuationCalculation({
    financials: {
      revenue: normalizedValue(selectedInputs.revenue),
      netIncome: normalizedValue(selectedInputs.netIncome),
      equity: normalizedValue(selectedInputs.equity),
      eps: normalizedValue(selectedInputs.eps),
      sharesOutstanding: normalizedValue(selectedInputs.sharesOutstanding),
    },
    market: {
      marketPrice: normalizedValue(selectedInputs.marketPrice),
      marketCap: normalizedValue(selectedInputs.marketCap),
    },
    source: {
      financialsSourceMode,
      marketSourceMode,
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
      financialsSourceMode,
      marketSourceMode,
      canClaimValuationDbBacked: false,
      productionApproved: false,
      warnings: boundaryWarnings,
    },
    integrationNotes: [
      "calculation_helper_integrated_with_unit_provenance_guard",
      "market_inputs_remain_persisted_or_pvt_owned",
      "financial_inputs_may_use_runtime_when_available",
      "unknown_units_block_scale_sensitive_calculation",
      "no_ev_dcf_or_intrinsic_value_band_integration",
    ],
  };
};
