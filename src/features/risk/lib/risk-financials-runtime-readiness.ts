import { buildFinancialsDerivedModuleReadiness } from "@/features/financials/lib/financials-derived-module-readiness";
import type {
  FinancialsRuntimeData,
  FinancialsRuntimeReadPath,
  FinancialsRuntimeStatus,
} from "@/features/financials/lib/financials-runtime-types";

export type RiskRuntimeStatus =
  | "sample_static"
  | "sample_fallback"
  | "financials_runtime_available"
  | "financials_runtime_ready"
  | "mixed_source"
  | "not_wired";

export type RiskReadinessStatus = "ready" | "insufficient_data" | "not_applicable";

export type RiskCalculationReadiness = {
  cashFlowQuality: RiskReadinessStatus;
  earningsQuality: RiskReadinessStatus;
  leverageRisk: RiskReadinessStatus;
  liquidityRisk: RiskReadinessStatus;
  assetScaledRisk: RiskReadinessStatus;
  dataQualityRisk: "ready" | "insufficient_data";
};

export type RiskRuntimeInputs = {
  operatingCashFlow?: number | null;
  netIncome?: number | null;
  revenue?: number | null;
  totalDebt?: number | null;
  equity?: number | null;
  totalAssets?: number | null;
  currentAssets?: number | null;
  currentLiabilities?: number | null;
};

export type RiskFinancialsRuntimeReadiness = {
  riskRuntimeStatus: RiskRuntimeStatus;
  financialsRuntimeStatus: FinancialsRuntimeStatus | "not_provided";
  financialsReadPath: FinancialsRuntimeReadPath | "not_provided";
  sourceLabel: string | null;
  dataMode: string | null;
  fallbackUsed: boolean | null;
  productionApproved: false;
  canClaimRiskDbBacked: false;
  riskConsumesFinancialsRuntime: boolean;
  calculationReadiness: RiskCalculationReadiness;
  missingValuePolicy: {
    missingValue: "null";
    displayFallback: "unavailable";
    substituteZeroForMissing: false;
    divideByZeroAllowed: false;
  };
  inputSnapshot: Required<RiskRuntimeInputs>;
  blockedReasons: string[];
  warnings: string[];
  boundaryNote: string;
};

export type BuildRiskFinancialsRuntimeReadinessInput = {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  riskConsumesFinancialsRuntime?: boolean;
  hasStaticRiskPath?: boolean;
  inputs?: RiskRuntimeInputs;
};

const missingValuePolicy = {
  missingValue: "null",
  displayFallback: "unavailable",
  substituteZeroForMissing: false,
  divideByZeroAllowed: false,
} as const;

const normalizeInputs = (
  inputs: RiskRuntimeInputs = {},
  financialsRuntimeData?: FinancialsRuntimeData | null,
): Required<RiskRuntimeInputs> => ({
  operatingCashFlow: inputs.operatingCashFlow ?? financialsRuntimeData?.statementSnapshot?.operatingCashFlow ?? null,
  netIncome: inputs.netIncome ?? financialsRuntimeData?.statementSnapshot?.netProfit ?? null,
  revenue: inputs.revenue ?? financialsRuntimeData?.statementSnapshot?.revenue ?? null,
  totalDebt: inputs.totalDebt ?? null,
  equity: inputs.equity ?? financialsRuntimeData?.statementSnapshot?.totalEquity ?? null,
  totalAssets: inputs.totalAssets ?? financialsRuntimeData?.statementSnapshot?.totalAssets ?? null,
  currentAssets: inputs.currentAssets ?? financialsRuntimeData?.statementSnapshot?.currentAssets ?? null,
  currentLiabilities: inputs.currentLiabilities ?? financialsRuntimeData?.statementSnapshot?.currentLiabilities ?? null,
});

const readinessFromInputs = (input: Required<RiskRuntimeInputs>): RiskCalculationReadiness => {
  const equityMissing = input.equity === null;
  const equityNonPositive = typeof input.equity === "number" && input.equity <= 0;
  const assetsMissing = input.totalAssets === null;
  const assetsNonPositive = typeof input.totalAssets === "number" && input.totalAssets <= 0;
  const currentLiabilitiesMissing = input.currentLiabilities === null;
  const currentLiabilitiesNonPositive =
    typeof input.currentLiabilities === "number" && input.currentLiabilities <= 0;

  return {
    cashFlowQuality: input.operatingCashFlow === null ? "insufficient_data" : "ready",
    earningsQuality: input.netIncome === null ? "insufficient_data" : "ready",
    leverageRisk:
      input.totalDebt === null || equityMissing
        ? "insufficient_data"
        : equityNonPositive
          ? "not_applicable"
          : "ready",
    liquidityRisk:
      input.currentAssets === null || currentLiabilitiesMissing
        ? "insufficient_data"
        : currentLiabilitiesNonPositive
          ? "not_applicable"
          : "ready",
    assetScaledRisk: assetsMissing ? "insufficient_data" : assetsNonPositive ? "not_applicable" : "ready",
    dataQualityRisk:
      input.revenue === null ||
      input.netIncome === null ||
      input.operatingCashFlow === null ||
      input.totalAssets === null
        ? "insufficient_data"
        : "ready",
  };
};

const riskRuntimeStatus = ({
  financialsRuntimeData,
  hasStaticRiskPath,
  riskConsumesFinancialsRuntime,
}: {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  hasStaticRiskPath: boolean;
  riskConsumesFinancialsRuntime: boolean;
}): RiskRuntimeStatus => {
  if (!financialsRuntimeData) return hasStaticRiskPath ? "sample_static" : "not_wired";
  if (financialsRuntimeData.runtimeStatus === "sample_fallback") return "sample_fallback";
  if (financialsRuntimeData.source.readPath === "sample_static") return "sample_static";
  if (riskConsumesFinancialsRuntime) return "financials_runtime_ready";
  return hasStaticRiskPath ? "mixed_source" : "financials_runtime_available";
};

const blockedReasonsFromInputs = (input: Required<RiskRuntimeInputs>): string[] => {
  const reasons: string[] = [];

  if (input.operatingCashFlow === null) reasons.push("operatingCashFlow missing; cash-flow quality is insufficient_data.");
  if (input.netIncome === null) reasons.push("netIncome missing; earnings quality is insufficient_data.");
  if (input.revenue === null) reasons.push("revenue missing; data quality risk is insufficient_data.");
  if (input.totalDebt === null) reasons.push("debt missing; leverage risk is insufficient_data.");
  if (input.equity === null) reasons.push("equity missing; leverage risk is insufficient_data.");
  else if (input.equity <= 0) reasons.push("equity non-positive; equity-based risk is not_applicable.");
  if (input.totalAssets === null) reasons.push("totalAssets missing; asset-scaled risk is insufficient_data.");
  else if (input.totalAssets <= 0) reasons.push("totalAssets non-positive; asset-scaled risk is not_applicable.");
  if (input.currentAssets === null) reasons.push("currentAssets missing; liquidity risk is insufficient_data.");
  if (input.currentLiabilities === null) reasons.push("currentLiabilities missing; liquidity risk is insufficient_data.");
  else if (input.currentLiabilities <= 0) reasons.push("currentLiabilities non-positive; liquidity risk is not_applicable.");

  return reasons;
};

export const buildRiskFinancialsRuntimeReadiness = ({
  financialsRuntimeData = null,
  hasStaticRiskPath = true,
  inputs,
  riskConsumesFinancialsRuntime = false,
}: BuildRiskFinancialsRuntimeReadinessInput = {}): RiskFinancialsRuntimeReadiness => {
  const normalizedInputs = normalizeInputs(inputs, financialsRuntimeData);
  const derived = buildFinancialsDerivedModuleReadiness({
    moduleKey: "risk",
    financialsRuntimeData,
    consumesFinancialsRuntimeSnapshot: riskConsumesFinancialsRuntime,
    moduleDataSourceMode: riskConsumesFinancialsRuntime ? "financials_runtime_ready" : "sample_static",
    equity: normalizedInputs.equity,
  });
  const blockedReasons = blockedReasonsFromInputs(normalizedInputs);
  const warnings = [
    ...blockedReasons,
    ...(financialsRuntimeData && !riskConsumesFinancialsRuntime
      ? ["Financials runtime available, but Risk calculation is not yet wired."]
      : []),
    ...(financialsRuntimeData?.source.fallbackUsed
      ? ["Financials fallback is active; Risk readiness must treat it as fallback-derived."]
      : []),
    "Local, research-only, sample, or missing Financials source remains unapproved for production use.",
    "Missing values must remain null/unavailable and must not be replaced with 0.",
    "Risk readiness is only a data-readiness state, not a guarantee.",
  ];

  return {
    riskRuntimeStatus: riskRuntimeStatus({ financialsRuntimeData, hasStaticRiskPath, riskConsumesFinancialsRuntime }),
    financialsRuntimeStatus: financialsRuntimeData?.runtimeStatus ?? "not_provided",
    financialsReadPath: financialsRuntimeData?.source.readPath ?? "not_provided",
    sourceLabel: financialsRuntimeData?.source.sourceLabel ?? null,
    dataMode: financialsRuntimeData?.source.dataMode ?? null,
    fallbackUsed: financialsRuntimeData?.source.fallbackUsed ?? null,
    productionApproved: false,
    canClaimRiskDbBacked: false,
    riskConsumesFinancialsRuntime,
    calculationReadiness: readinessFromInputs(normalizedInputs),
    missingValuePolicy,
    inputSnapshot: normalizedInputs,
    blockedReasons,
    warnings: Array.from(new Set(warnings)),
    boundaryNote: `${derived.boundaryNote} Risk readiness is only a data-readiness state.`,
  };
};
