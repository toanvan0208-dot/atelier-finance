import type { FinancialsRuntimeData, FinancialsRuntimeReadPath, FinancialsRuntimeStatus } from "./financials-runtime-types";

export type FinancialsDerivedModuleKey = "overview" | "valuation" | "risk";

export type FinancialsDerivedModuleDataSourceMode =
  | "sample_static"
  | "sample_fallback"
  | "financials_runtime_ready"
  | "db_backed"
  | "not_wired";

export type FinancialsDerivedMissingDataPolicy = {
  missingValue: "null";
  displayFallback: "not_available" | "unavailable" | "insufficient_data" | "not_applicable";
  substituteZeroForMissing: false;
  divideByZeroAllowed: false;
};

export type FinancialsDerivedGuardrails = {
  peInterpretationAllowed: boolean;
  equityBasedInterpretationAllowed: boolean;
  reasons: string[];
};

export type FinancialsDerivedModuleReadiness = {
  moduleKey: FinancialsDerivedModuleKey;
  financialsRuntimeStatus: FinancialsRuntimeStatus | "not_provided";
  financialsReadPath: FinancialsRuntimeReadPath | "not_provided";
  financialsRuntimeAvailable: boolean;
  consumesFinancialsRuntimeSnapshot: boolean;
  moduleDataSourceMode: FinancialsDerivedModuleDataSourceMode;
  canClaimDbBacked: boolean;
  productionApproved: boolean;
  warnings: string[];
  missingDataPolicy: FinancialsDerivedMissingDataPolicy;
  boundaryNote: string;
  guardrails: FinancialsDerivedGuardrails;
};

export type BuildFinancialsDerivedModuleReadinessInput = {
  moduleKey: FinancialsDerivedModuleKey;
  financialsRuntimeData?: FinancialsRuntimeData | null;
  consumesFinancialsRuntimeSnapshot?: boolean;
  moduleDataSourceMode?: FinancialsDerivedModuleDataSourceMode;
  eps?: number | null;
  equity?: number | null;
  bvps?: number | null;
};

export const FINANCIALS_DERIVED_BOUNDARY_NOTE =
  "Financials DB-backed status does not make Overview, Valuation, or Risk DB-backed.";

const missingDataPolicy: FinancialsDerivedMissingDataPolicy = {
  missingValue: "null",
  displayFallback: "unavailable",
  substituteZeroForMissing: false,
  divideByZeroAllowed: false,
};

const defaultModuleMode = (moduleKey: FinancialsDerivedModuleKey): FinancialsDerivedModuleDataSourceMode => {
  if (moduleKey === "risk") return "sample_static";
  return "not_wired";
};

const isNonProductionFinancialsSource = (runtimeData?: FinancialsRuntimeData | null): boolean => {
  if (!runtimeData) return true;
  return (
    runtimeData.source.productionApproved === false ||
    runtimeData.source.readPath === "local_db" ||
    runtimeData.source.readPath === "sample_static" ||
    runtimeData.source.dataMode === "sample" ||
    runtimeData.source.dataMode === "research_only"
  );
};

const buildGuardrails = ({
  bvps,
  eps,
  equity,
  moduleKey,
}: {
  moduleKey: FinancialsDerivedModuleKey;
  eps?: number | null;
  equity?: number | null;
  bvps?: number | null;
}): FinancialsDerivedGuardrails => {
  const reasons: string[] = [];
  const peInterpretationAllowed = typeof eps === "number" && eps > 0;
  const equityBasedInterpretationAllowed =
    (typeof equity === "number" && equity > 0) || (typeof bvps === "number" && bvps > 0);

  if (!peInterpretationAllowed) {
    reasons.push("EPS is missing, zero, or negative; P/E must not be interpreted as normal or cheap.");
  }

  if (!equityBasedInterpretationAllowed) {
    reasons.push("Equity or BVPS is missing, zero, or negative; ROE/P/B/BVPS must not be interpreted normally.");
  }

  if (moduleKey === "risk") {
    reasons.push("Risk must keep missing financial evidence explicit instead of converting it to a low-risk signal.");
  }

  return {
    peInterpretationAllowed,
    equityBasedInterpretationAllowed,
    reasons,
  };
};

export const buildFinancialsDerivedModuleReadiness = ({
  bvps,
  consumesFinancialsRuntimeSnapshot = false,
  eps,
  equity,
  financialsRuntimeData = null,
  moduleDataSourceMode,
  moduleKey,
}: BuildFinancialsDerivedModuleReadinessInput): FinancialsDerivedModuleReadiness => {
  const financialsRuntimeStatus = financialsRuntimeData?.runtimeStatus ?? "not_provided";
  const financialsReadPath = financialsRuntimeData?.source.readPath ?? "not_provided";
  const financialsRuntimeAvailable = financialsRuntimeStatus === "db_backed";
  const resolvedMode = moduleDataSourceMode ?? defaultModuleMode(moduleKey);
  const warnings: string[] = [];

  if (financialsRuntimeAvailable && !consumesFinancialsRuntimeSnapshot) {
    warnings.push("Financials runtime available, but this module is not yet DB-backed.");
  }

  if (resolvedMode === "sample_static" || resolvedMode === "sample_fallback") {
    warnings.push("Module output is still based on sample/static or fallback data.");
  }

  if (isNonProductionFinancialsSource(financialsRuntimeData)) {
    warnings.push("Local, research-only, sample, or missing Financials source is not production-approved.");
  }

  warnings.push("Missing values must remain null/unavailable and must not be replaced with 0.");

  const guardrails = buildGuardrails({ bvps, eps, equity, moduleKey });
  warnings.push(...guardrails.reasons);

  return {
    moduleKey,
    financialsRuntimeStatus,
    financialsReadPath,
    financialsRuntimeAvailable,
    consumesFinancialsRuntimeSnapshot,
    moduleDataSourceMode: consumesFinancialsRuntimeSnapshot ? resolvedMode : resolvedMode === "db_backed" ? "not_wired" : resolvedMode,
    canClaimDbBacked: consumesFinancialsRuntimeSnapshot && resolvedMode === "db_backed" && !isNonProductionFinancialsSource(financialsRuntimeData),
    productionApproved: false,
    warnings: Array.from(new Set(warnings)),
    missingDataPolicy,
    boundaryNote: FINANCIALS_DERIVED_BOUNDARY_NOTE,
    guardrails,
  };
};

export const buildCurrentFinancialsDerivedModuleReadiness = (
  financialsRuntimeData?: FinancialsRuntimeData | null,
): Record<FinancialsDerivedModuleKey, FinancialsDerivedModuleReadiness> => ({
  overview: buildFinancialsDerivedModuleReadiness({
    moduleKey: "overview",
    financialsRuntimeData,
    consumesFinancialsRuntimeSnapshot: false,
    moduleDataSourceMode: "not_wired",
  }),
  valuation: buildFinancialsDerivedModuleReadiness({
    moduleKey: "valuation",
    financialsRuntimeData,
    consumesFinancialsRuntimeSnapshot: false,
    moduleDataSourceMode: "not_wired",
  }),
  risk: buildFinancialsDerivedModuleReadiness({
    moduleKey: "risk",
    financialsRuntimeData,
    consumesFinancialsRuntimeSnapshot: false,
    moduleDataSourceMode: "sample_static",
  }),
});
