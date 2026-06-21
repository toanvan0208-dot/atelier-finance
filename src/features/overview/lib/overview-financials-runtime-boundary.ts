import {
  buildFinancialsDerivedModuleReadiness,
  type FinancialsDerivedModuleReadiness,
} from "@/features/financials/lib/financials-derived-module-readiness";
import type { FinancialsRuntimeData, FinancialsRuntimeReadPath, FinancialsRuntimeStatus } from "@/features/financials/lib/financials-runtime-types";

export type OverviewFinancialsRuntimeStatus =
  | "sample_static"
  | "sample_fallback"
  | "financials_runtime_partial"
  | "mixed_source"
  | "not_wired";

export type OverviewFinancialsRuntimeSnapshotFields = {
  ticker: string | null;
  period: string | null;
  revenue: number | null;
  netIncome: number | null;
  operatingCashFlow: number | null;
  totalAssets: number | null;
  equity: number | null;
};

export type OverviewFinancialsRuntimeBoundary = {
  overviewRuntimeStatus: OverviewFinancialsRuntimeStatus;
  financialsRuntimeStatus: FinancialsRuntimeStatus | "not_provided";
  financialsReadPath: FinancialsRuntimeReadPath | "not_provided";
  sourceLabel: string | null;
  dataMode: string | null;
  fallbackUsed: boolean | null;
  productionApproved: false;
  canClaimOverviewDbBacked: false;
  consumesFinancialsRuntime: boolean;
  derivedReadiness: FinancialsDerivedModuleReadiness;
  snapshotFields: OverviewFinancialsRuntimeSnapshotFields;
  missingFields: string[];
  warnings: string[];
  boundaryNote: string;
};

const emptySnapshotFields: OverviewFinancialsRuntimeSnapshotFields = {
  ticker: null,
  period: null,
  revenue: null,
  netIncome: null,
  operatingCashFlow: null,
  totalAssets: null,
  equity: null,
};

const overviewStatusFromFinancials = (
  runtimeData?: FinancialsRuntimeData | null,
): OverviewFinancialsRuntimeStatus => {
  if (!runtimeData) return "not_wired";
  if (runtimeData.runtimeStatus === "sample_fallback") return "sample_fallback";
  if (runtimeData.source.readPath === "sample_static") return "sample_static";
  if (runtimeData.runtimeStatus === "db_backed" && runtimeData.source.readPath === "local_db") return "mixed_source";
  return "financials_runtime_partial";
};

const snapshotFieldsFromFinancials = (
  runtimeData?: FinancialsRuntimeData | null,
): OverviewFinancialsRuntimeSnapshotFields => {
  const snapshot = runtimeData?.statementSnapshot;
  if (!snapshot) return emptySnapshotFields;

  return {
    ticker: snapshot.ticker ?? null,
    period: snapshot.period ?? null,
    revenue: snapshot.revenue ?? null,
    netIncome: snapshot.netProfit ?? null,
    operatingCashFlow: snapshot.operatingCashFlow ?? null,
    totalAssets: snapshot.totalAssets ?? null,
    equity: snapshot.totalEquity ?? null,
  };
};

const uiSafeWarning = (warning: string): string =>
  warning
    .replace(/not production-approved/gi, "not approved for production source use")
    .replace(/production-approved/gi, "approved for production source use");

export const buildOverviewFinancialsRuntimeBoundary = (
  runtimeData?: FinancialsRuntimeData | null,
): OverviewFinancialsRuntimeBoundary => {
  const overviewRuntimeStatus = overviewStatusFromFinancials(runtimeData);
  const snapshotFields = snapshotFieldsFromFinancials(runtimeData);
  const rawDerivedReadiness = buildFinancialsDerivedModuleReadiness({
    moduleKey: "overview",
    financialsRuntimeData: runtimeData,
    consumesFinancialsRuntimeSnapshot: Boolean(runtimeData),
    moduleDataSourceMode: runtimeData ? "financials_runtime_ready" : "not_wired",
    eps: runtimeData?.statementSnapshot?.eps ?? null,
    equity: runtimeData?.statementSnapshot?.totalEquity ?? null,
  });
  const derivedReadiness = {
    ...rawDerivedReadiness,
    warnings: rawDerivedReadiness.warnings.map(uiSafeWarning),
  };
  const warnings = [
    ...derivedReadiness.warnings,
    "Overview consumes Financials runtime as a partial boundary only; the full Overview module is not DB-backed.",
    "Overview also uses persisted local inputs and existing static/support sections, so the source state is mixed.",
    ...(runtimeData?.source.fallbackUsed ? ["Financials fallback is active; Overview must label this as fallback-derived."] : []),
    ...(runtimeData?.dataQuality.missingFields.length
      ? ["Financials missing fields stay unavailable/null and are not zero-filled."]
      : []),
  ].map(uiSafeWarning);

  return {
    overviewRuntimeStatus,
    financialsRuntimeStatus: runtimeData?.runtimeStatus ?? "not_provided",
    financialsReadPath: runtimeData?.source.readPath ?? "not_provided",
    sourceLabel: runtimeData?.source.sourceLabel ?? null,
    dataMode: runtimeData?.source.dataMode ?? null,
    fallbackUsed: runtimeData?.source.fallbackUsed ?? null,
    productionApproved: false,
    canClaimOverviewDbBacked: false,
    consumesFinancialsRuntime: Boolean(runtimeData),
    derivedReadiness,
    snapshotFields,
    missingFields: runtimeData?.dataQuality.missingFields ?? [],
    warnings: Array.from(new Set(warnings)),
    boundaryNote: "Financials runtime can inform Overview, but it does not make Overview fully DB-backed.",
  };
};
