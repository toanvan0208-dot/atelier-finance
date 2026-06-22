import type {
  FinancialsRuntimeData,
  FinancialsRuntimeReadPath,
  FinancialsRuntimeStatus,
} from "@/features/financials/lib/financials-runtime-types";
import {
  buildRiskFinancialsRuntimeReadiness,
  type RiskCalculationReadiness,
} from "./risk-financials-runtime-readiness";

export type RiskSourceMode =
  | "static_sample"
  | "financials_runtime_partial"
  | "mixed_source"
  | "sample_fallback"
  | "not_wired";

export type RiskFinancialsRuntimeConsumption = {
  riskSourceMode: RiskSourceMode;
  financialsRuntimeAvailable: boolean;
  riskConsumesFinancialsRuntime: boolean;
  consumedFields: string[];
  unavailableFields: string[];
  canClaimRiskDbBacked: false;
  productionApproved: false;
  sourceLabel: string | null;
  dataMode: string | null;
  readPath: FinancialsRuntimeReadPath | "not_provided";
  runtimeStatus: FinancialsRuntimeStatus | "not_provided";
  fallbackUsed: boolean | null;
  warnings: string[];
  calculationReadiness: RiskCalculationReadiness;
  safetyNotes: string[];
};

export type BuildRiskFinancialsRuntimeConsumptionInput = {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  hasStaticRiskPath?: boolean;
  traceableTotalDebt?: number | null;
};

const riskFinancialFields = [
  "revenue",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "totalLiabilities",
  "equity",
  "totalDebt",
  "currentAssets",
  "currentLiabilities",
] as const;

const fieldValue = (
  field: (typeof riskFinancialFields)[number],
  runtimeData?: FinancialsRuntimeData | null,
  traceableTotalDebt?: number | null,
): number | null => {
  const snapshot = runtimeData?.statementSnapshot;
  if (!snapshot) return null;

  if (field === "netIncome") return snapshot.netProfit ?? null;
  if (field === "equity") return snapshot.totalEquity ?? null;
  if (field === "totalDebt") {
    return traceableTotalDebt !== undefined ? traceableTotalDebt : snapshot.totalDebt ?? null;
  }
  return snapshot[field] ?? null;
};

const sourceMode = ({
  financialsRuntimeData,
  hasStaticRiskPath,
}: {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  hasStaticRiskPath: boolean;
}): RiskSourceMode => {
  if (!financialsRuntimeData) return hasStaticRiskPath ? "static_sample" : "not_wired";
  if (financialsRuntimeData.runtimeStatus === "sample_fallback" || financialsRuntimeData.source.fallbackUsed) {
    return "sample_fallback";
  }
  return hasStaticRiskPath ? "mixed_source" : "financials_runtime_partial";
};

export const buildRiskFinancialsRuntimeConsumption = ({
  financialsRuntimeData = null,
  hasStaticRiskPath = true,
  traceableTotalDebt,
}: BuildRiskFinancialsRuntimeConsumptionInput = {}): RiskFinancialsRuntimeConsumption => {
  const consumedFields = riskFinancialFields.filter(
    (field) => fieldValue(field, financialsRuntimeData, traceableTotalDebt) !== null,
  );
  const unavailableFields = riskFinancialFields.filter(
    (field) => fieldValue(field, financialsRuntimeData, traceableTotalDebt) === null,
  );
  const readiness = buildRiskFinancialsRuntimeReadiness({
    financialsRuntimeData,
    hasStaticRiskPath,
    inputs: {
      operatingCashFlow: fieldValue("operatingCashFlow", financialsRuntimeData),
      netIncome: fieldValue("netIncome", financialsRuntimeData),
      revenue: fieldValue("revenue", financialsRuntimeData),
      totalDebt: fieldValue("totalDebt", financialsRuntimeData, traceableTotalDebt),
      equity: fieldValue("equity", financialsRuntimeData),
      totalAssets: fieldValue("totalAssets", financialsRuntimeData),
      currentAssets: fieldValue("currentAssets", financialsRuntimeData),
      currentLiabilities: fieldValue("currentLiabilities", financialsRuntimeData),
    },
    riskConsumesFinancialsRuntime: Boolean(financialsRuntimeData),
  });
  const warnings = [
    ...readiness.blockedReasons,
    ...(hasStaticRiskPath ? ["Risk display cards still need data-source review."] : []),
    "Financials runtime is consumed only as controlled metadata and available snapshot fields.",
    "Risk source state remains partial until data-source review is complete.",
    ...(financialsRuntimeData?.source.fallbackUsed
      ? ["Financials reference path is active; Risk source state must remain clearly labeled."]
      : []),
    "Local or research Financials source keeps productionApproved:false.",
    "Missing values remain null/unavailable and are not replaced with 0.",
  ];

  return {
    riskSourceMode: sourceMode({ financialsRuntimeData, hasStaticRiskPath }),
    financialsRuntimeAvailable: Boolean(financialsRuntimeData),
    riskConsumesFinancialsRuntime: Boolean(financialsRuntimeData),
    consumedFields,
    unavailableFields,
    canClaimRiskDbBacked: false,
    productionApproved: false,
    sourceLabel: financialsRuntimeData?.source.sourceLabel ?? null,
    dataMode: financialsRuntimeData?.source.dataMode ?? null,
    readPath: financialsRuntimeData?.source.readPath ?? "not_provided",
    runtimeStatus: financialsRuntimeData?.runtimeStatus ?? "not_provided",
    fallbackUsed: financialsRuntimeData?.source.fallbackUsed ?? null,
    warnings: Array.from(new Set(warnings)),
    calculationReadiness: readiness.calculationReadiness,
    safetyNotes: [
      "Local Financials runtime is research-only when enabled.",
      "Risk remains partial-runtime until data-source review is complete.",
      "Missing/null values are not zero-filled.",
      "Readiness is not a guarantee or an action instruction.",
    ],
  };
};
