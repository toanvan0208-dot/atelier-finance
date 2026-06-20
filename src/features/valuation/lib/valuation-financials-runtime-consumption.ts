import type { FinancialsRuntimeData, FinancialsRuntimeReadPath, FinancialsRuntimeStatus } from "@/features/financials/lib/financials-runtime-types";
import {
  buildValuationFinancialsRuntimeReadiness,
  type ValuationCalculationReadiness,
  type ValuationRuntimeInputs,
} from "./valuation-financials-runtime-readiness";

export type ValuationSourceMode =
  | "persisted_bridge"
  | "financials_runtime_partial"
  | "mixed_source"
  | "sample_fallback"
  | "not_wired";

export type ValuationFinancialsRuntimeConsumption = {
  valuationSourceMode: ValuationSourceMode;
  financialsRuntimeAvailable: boolean;
  valuationConsumesFinancialsRuntime: boolean;
  consumedFields: string[];
  unavailableFields: string[];
  canClaimValuationDbBacked: false;
  productionApproved: false;
  sourceLabel: string | null;
  dataMode: string | null;
  readPath: FinancialsRuntimeReadPath | "not_provided";
  runtimeStatus: FinancialsRuntimeStatus | "not_provided";
  fallbackUsed: boolean | null;
  warnings: string[];
  calculationReadiness: ValuationCalculationReadiness;
  safetyNotes: string[];
};

export type BuildValuationFinancialsRuntimeConsumptionInput = {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  persistedBridgeInputs?: ValuationRuntimeInputs;
  hasPersistedBridge?: boolean;
};

const safeFinancialFields = [
  "revenue",
  "netIncome",
  "operatingCashFlow",
  "totalAssets",
  "equity",
  "sharesOutstanding",
  "eps",
] as const;

const fieldValue = (
  field: (typeof safeFinancialFields)[number],
  runtimeData?: FinancialsRuntimeData | null,
): number | null => {
  const snapshot = runtimeData?.statementSnapshot;
  if (!snapshot) return null;

  if (field === "netIncome") return snapshot.netProfit ?? null;
  if (field === "equity") return snapshot.totalEquity ?? null;
  return snapshot[field] ?? null;
};

const sourceMode = ({
  financialsRuntimeData,
  hasPersistedBridge,
}: {
  financialsRuntimeData?: FinancialsRuntimeData | null;
  hasPersistedBridge: boolean;
}): ValuationSourceMode => {
  if (!financialsRuntimeData) return hasPersistedBridge ? "persisted_bridge" : "not_wired";
  if (financialsRuntimeData.runtimeStatus === "sample_fallback" || financialsRuntimeData.source.fallbackUsed) {
    return "sample_fallback";
  }
  return hasPersistedBridge ? "mixed_source" : "financials_runtime_partial";
};

export const buildValuationFinancialsRuntimeConsumption = ({
  financialsRuntimeData = null,
  hasPersistedBridge = true,
  persistedBridgeInputs = {},
}: BuildValuationFinancialsRuntimeConsumptionInput = {}): ValuationFinancialsRuntimeConsumption => {
  const consumedFields = safeFinancialFields.filter((field) => fieldValue(field, financialsRuntimeData) !== null);
  const unavailableFields = safeFinancialFields.filter((field) => fieldValue(field, financialsRuntimeData) === null);
  const readiness = buildValuationFinancialsRuntimeReadiness({
    financialsRuntimeData,
    hasPersistedLocalInputBridge: hasPersistedBridge,
    inputs: {
      eps: fieldValue("eps", financialsRuntimeData) ?? persistedBridgeInputs.eps ?? null,
      equity: fieldValue("equity", financialsRuntimeData) ?? persistedBridgeInputs.equity ?? null,
      marketPrice: persistedBridgeInputs.marketPrice ?? null,
      sharesOutstanding:
        fieldValue("sharesOutstanding", financialsRuntimeData) ?? persistedBridgeInputs.sharesOutstanding ?? null,
    },
    valuationConsumesFinancialsRuntime: Boolean(financialsRuntimeData),
  });
  const warnings = [
    ...readiness.blockedReasons,
    "Valuation calculations still use the persisted input bridge.",
    "Financials runtime is consumed only as controlled metadata and safe snapshot fields.",
    "Valuation source state remains mixed or partial while the calculation path is not fully wired.",
    ...(financialsRuntimeData?.source.fallbackUsed
      ? ["Financials fallback is active; source state must remain labeled as fallback."]
      : []),
    "Missing values remain null/unavailable and are not replaced with 0.",
  ];

  return {
    valuationSourceMode: sourceMode({ financialsRuntimeData, hasPersistedBridge }),
    financialsRuntimeAvailable: Boolean(financialsRuntimeData),
    valuationConsumesFinancialsRuntime: Boolean(financialsRuntimeData),
    consumedFields,
    unavailableFields,
    canClaimValuationDbBacked: false,
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
      "Valuation remains mixed-source or partial-runtime.",
      "Missing/null values are not zero-filled.",
      "Readiness is a data-safety state.",
    ],
  };
};
