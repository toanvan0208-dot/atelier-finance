import { buildFinancialsDerivedModuleReadiness } from "@/features/financials/lib/financials-derived-module-readiness";
import type {
  FinancialsRuntimeData,
  FinancialsRuntimeReadPath,
  FinancialsRuntimeStatus,
} from "@/features/financials/lib/financials-runtime-types";

export type ValuationRuntimeStatus =
  | "sample_static"
  | "sample_fallback"
  | "persisted_local_input"
  | "financials_runtime_available"
  | "financials_runtime_ready"
  | "mixed_source"
  | "not_wired";

export type ValuationCalculationReadinessStatus = "ready" | "not_applicable" | "insufficient_data";

export type ValuationCalculationReadiness = {
  pe: ValuationCalculationReadinessStatus;
  pb: ValuationCalculationReadinessStatus;
  bvps: ValuationCalculationReadinessStatus;
  roe: ValuationCalculationReadinessStatus;
  marketCap: ValuationCalculationReadinessStatus;
};

export type ValuationRuntimeInputs = {
  eps?: number | null;
  equity?: number | null;
  bvps?: number | null;
  marketPrice?: number | null;
  sharesOutstanding?: number | null;
};

export type ValuationFinancialsRuntimeReadiness = {
  valuationRuntimeStatus: ValuationRuntimeStatus;
  financialsRuntimeStatus: FinancialsRuntimeStatus | "not_provided";
  financialsReadPath: FinancialsRuntimeReadPath | "not_provided";
  sourceLabel: string | null;
  dataMode: string | null;
  fallbackUsed: boolean | null;
  productionApproved: false;
  canClaimValuationDbBacked: false;
  valuationConsumesFinancialsRuntime: boolean;
  calculationReadiness: ValuationCalculationReadiness;
  missingValuePolicy: {
    missingValue: "null";
    displayFallback: "unavailable";
    substituteZeroForMissing: false;
    divideByZeroAllowed: false;
  };
  inputSnapshot: Required<ValuationRuntimeInputs>;
  blockedReasons: string[];
  warnings: string[];
  boundaryNote: string;
};

export type BuildValuationFinancialsRuntimeReadinessInput = {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  valuationConsumesFinancialsRuntime?: boolean;
  hasPersistedLocalInputBridge?: boolean;
  inputs?: ValuationRuntimeInputs;
};

const missingValuePolicy = {
  missingValue: "null",
  displayFallback: "unavailable",
  substituteZeroForMissing: false,
  divideByZeroAllowed: false,
} as const;

const normalizeInputs = (
  inputs: ValuationRuntimeInputs = {},
  financialsRuntimeData?: FinancialsRuntimeData | null,
): Required<ValuationRuntimeInputs> => ({
  eps: inputs.eps ?? financialsRuntimeData?.statementSnapshot?.eps ?? null,
  equity: inputs.equity ?? financialsRuntimeData?.statementSnapshot?.totalEquity ?? null,
  bvps: inputs.bvps ?? null,
  marketPrice: inputs.marketPrice ?? null,
  sharesOutstanding: inputs.sharesOutstanding ?? financialsRuntimeData?.statementSnapshot?.sharesOutstanding ?? null,
});

const statusFromInputs = (input: Required<ValuationRuntimeInputs>): ValuationCalculationReadiness => {
  const epsMissing = input.eps === null;
  const epsNonPositive = typeof input.eps === "number" && input.eps <= 0;
  const equityMissing = input.equity === null && input.bvps === null;
  const equityNonPositive =
    (typeof input.equity === "number" && input.equity <= 0) ||
    (typeof input.bvps === "number" && input.bvps <= 0);
  const marketMissing = input.marketPrice === null;
  const sharesMissing = input.sharesOutstanding === null;
  const sharesNonPositive = typeof input.sharesOutstanding === "number" && input.sharesOutstanding <= 0;

  return {
    pe: epsMissing ? "insufficient_data" : epsNonPositive ? "not_applicable" : "ready",
    pb: equityMissing ? "insufficient_data" : equityNonPositive ? "not_applicable" : "ready",
    bvps: equityMissing || sharesMissing ? "insufficient_data" : equityNonPositive || sharesNonPositive ? "not_applicable" : "ready",
    roe: equityMissing ? "insufficient_data" : equityNonPositive ? "not_applicable" : "ready",
    marketCap: marketMissing || sharesMissing || sharesNonPositive ? "insufficient_data" : "ready",
  };
};

const valuationRuntimeStatus = ({
  financialsRuntimeData,
  hasPersistedLocalInputBridge,
  valuationConsumesFinancialsRuntime,
}: {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  hasPersistedLocalInputBridge: boolean;
  valuationConsumesFinancialsRuntime: boolean;
}): ValuationRuntimeStatus => {
  if (!financialsRuntimeData) return hasPersistedLocalInputBridge ? "persisted_local_input" : "not_wired";
  if (financialsRuntimeData.runtimeStatus === "sample_fallback") return "sample_fallback";
  if (financialsRuntimeData.source.readPath === "sample_static") return "sample_static";
  if (valuationConsumesFinancialsRuntime) return "financials_runtime_ready";
  return hasPersistedLocalInputBridge ? "mixed_source" : "financials_runtime_available";
};

const blockedReasonsFromInputs = (input: Required<ValuationRuntimeInputs>): string[] => {
  const reasons: string[] = [];

  if (input.eps === null) reasons.push("EPS missing; P/E readiness is insufficient_data.");
  else if (input.eps <= 0) reasons.push("EPS non-positive; P/E readiness is not_applicable.");

  if (input.equity === null && input.bvps === null) {
    reasons.push("Equity and BVPS missing; P/B, BVPS, and ROE readiness are insufficient_data.");
  } else if ((input.equity !== null && input.equity <= 0) || (input.bvps !== null && input.bvps <= 0)) {
    reasons.push("Equity or BVPS non-positive; P/B, BVPS, and ROE readiness are not_applicable.");
  }

  if (input.marketPrice === null) reasons.push("Market price missing; market-based readiness is insufficient_data.");

  if (input.sharesOutstanding === null) {
    reasons.push("Shares outstanding missing; market cap and share-based readiness are insufficient_data.");
  } else if (input.sharesOutstanding <= 0) {
    reasons.push("Shares outstanding non-positive; market cap and share-based readiness are insufficient_data.");
  }

  return reasons;
};

export const buildValuationFinancialsRuntimeReadiness = ({
  financialsRuntimeData = null,
  hasPersistedLocalInputBridge = true,
  inputs,
  valuationConsumesFinancialsRuntime = false,
}: BuildValuationFinancialsRuntimeReadinessInput = {}): ValuationFinancialsRuntimeReadiness => {
  const normalizedInputs = normalizeInputs(inputs, financialsRuntimeData);
  const derived = buildFinancialsDerivedModuleReadiness({
    moduleKey: "valuation",
    financialsRuntimeData,
    consumesFinancialsRuntimeSnapshot: valuationConsumesFinancialsRuntime,
    moduleDataSourceMode: valuationConsumesFinancialsRuntime ? "financials_runtime_ready" : "not_wired",
    eps: normalizedInputs.eps,
    equity: normalizedInputs.equity,
    bvps: normalizedInputs.bvps,
  });
  const blockedReasons = blockedReasonsFromInputs(normalizedInputs);
  const warnings = [
    ...blockedReasons,
    ...(financialsRuntimeData && !valuationConsumesFinancialsRuntime
      ? ["Financials runtime available, but Valuation calculation is not yet wired."]
      : []),
    ...(financialsRuntimeData?.source.fallbackUsed
      ? ["Financials fallback is active; Valuation readiness must treat it as fallback-derived."]
      : []),
    "Local, research-only, sample, or missing Financials source remains unapproved for production use.",
    "Missing values must remain null/unavailable and must not be replaced with 0.",
    "Valuation readiness is only a data-safety state, not an action instruction.",
  ];

  return {
    valuationRuntimeStatus: valuationRuntimeStatus({
      financialsRuntimeData,
      hasPersistedLocalInputBridge,
      valuationConsumesFinancialsRuntime,
    }),
    financialsRuntimeStatus: financialsRuntimeData?.runtimeStatus ?? "not_provided",
    financialsReadPath: financialsRuntimeData?.source.readPath ?? "not_provided",
    sourceLabel: financialsRuntimeData?.source.sourceLabel ?? null,
    dataMode: financialsRuntimeData?.source.dataMode ?? null,
    fallbackUsed: financialsRuntimeData?.source.fallbackUsed ?? null,
    productionApproved: false,
    canClaimValuationDbBacked: false,
    valuationConsumesFinancialsRuntime,
    calculationReadiness: statusFromInputs(normalizedInputs),
    missingValuePolicy,
    inputSnapshot: normalizedInputs,
    blockedReasons,
    warnings: Array.from(new Set(warnings)),
    boundaryNote: `${derived.boundaryNote} Valuation readiness is only a data-safety state.`,
  };
};
