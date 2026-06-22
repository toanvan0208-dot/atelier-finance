import { isFinancialsUnitAccepted, type FinancialsNumericField } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";

export const TRACEABLE_INPUT_FIELDS = ["totalDebt", "eps", "sharesOutstanding"] as const;

export type TraceableInputField = (typeof TRACEABLE_INPUT_FIELDS)[number];
export type TraceableInputCandidate = {
  ticker: string;
  field: TraceableInputField;
  value: number | null;
  unit: ValuationUnit | null;
  sourceLabel: string | null;
  asOf: string | null;
  period: string | null;
  dataMode: string | null;
  productionApproved: false;
};
export type TraceableDebtPilotCheck = {
  path: "financials_runtime" | "official_disclosure_adapter" | "manual_import_boundary" | "candidate_validation";
  status: "passed" | "checked_no_value" | "boundary_only" | "rejected";
  reason: string;
};
export type TraceableInputSourceDecision = TraceableInputCandidate & {
  status: "available" | "unavailable" | "blocked" | "insufficient_source";
  reasonCode: string;
  reason: string;
  activationStatus: "activated" | "not_activated" | "deferred";
  pilotChecks?: TraceableDebtPilotCheck[];
};
export type TraceableInputSourceDecisions = Record<TraceableInputField, TraceableInputSourceDecision>;

type BuildTraceableInputSourceDecisionsInput = {
  ticker: string;
  financials: FinancialsRuntimeData;
  candidates?: Partial<Record<TraceableInputField, TraceableInputCandidate | null>>;
};

const unitField: Record<TraceableInputField, FinancialsNumericField> = {
  eps: "eps",
  sharesOutstanding: "sharesOutstanding",
  totalDebt: "totalDebt",
};

const valueFromRuntime = (financials: FinancialsRuntimeData, field: TraceableInputField): number | null =>
  financials.statementSnapshot?.[field] ?? null;

const runtimeCandidate = (
  ticker: string,
  financials: FinancialsRuntimeData,
  field: TraceableInputField,
): TraceableInputCandidate | null => {
  const value = valueFromRuntime(financials, field);
  if (value === null) return null;
  const metadata = financials.unitMetadata[unitField[field]];

  return {
    asOf: financials.source.asOf,
    dataMode: financials.source.dataMode,
    field,
    period: financials.statementSnapshot?.period ?? null,
    productionApproved: false,
    sourceLabel: financials.source.sourceLabel,
    ticker,
    unit: metadata.status === "explicit" ? metadata.unit : null,
    value,
  };
};

const missingDecision = (ticker: string, field: TraceableInputField): TraceableInputSourceDecision => ({
  activationStatus: "deferred",
  asOf: null,
  dataMode: null,
  field,
  period: null,
  productionApproved: false,
  reason: field === "totalDebt"
    ? "No traceable total-debt value is available; total liabilities are not treated as debt."
    : `No traceable ${field} value with explicit unit and aligned period is available.`,
  reasonCode: field === "totalDebt" ? "traceable_total_debt_unavailable" : `traceable_${field}_unavailable`,
  sourceLabel: null,
  status: "unavailable",
  ticker,
  unit: null,
  value: null,
});

const unavailableDebtPilotChecks = (ticker: string): TraceableDebtPilotCheck[] => [
  {
    path: "financials_runtime",
    reason: `${ticker} Phase 109 runtime has no totalDebt value; totalLiabilities remains separate.`,
    status: "checked_no_value",
  },
  {
    path: "official_disclosure_adapter",
    reason: "The adapter boundary supports totalDebt, but no reviewed runtime source record is present.",
    status: "boundary_only",
  },
  {
    path: "manual_import_boundary",
    reason: "The import boundary supports totalDebt, but no reviewed traceable input artifact is present.",
    status: "boundary_only",
  },
];

const assessCandidate = ({
  candidate,
  expectedTicker,
  financialsPeriod,
  field,
}: {
  candidate: TraceableInputCandidate;
  expectedTicker: string;
  financialsPeriod: string | null;
  field: TraceableInputField;
}): TraceableInputSourceDecision => {
  const invalidValue =
    !Number.isFinite(candidate.value) ||
    candidate.value === null ||
    (field === "sharesOutstanding" && candidate.value <= 0) ||
    (field === "totalDebt" && candidate.value < 0);
  const sourceLabel = candidate.sourceLabel?.trim() ?? "";
  const dataMode = candidate.dataMode?.trim() ?? "";
  const unitValid = candidate.unit !== null && isFinancialsUnitAccepted(unitField[field], candidate.unit);
  const metadataComplete =
    sourceLabel.length > 0 &&
    (dataMode === "research_only" || dataMode === "local_research") &&
    candidate.asOf !== null &&
    candidate.period !== null;
  const identityAligned =
    candidate.ticker.trim().toUpperCase() === expectedTicker &&
    candidate.field === field &&
    financialsPeriod !== null &&
    candidate.period === financialsPeriod;
  const sampleSource =
    sourceLabel.toLowerCase().includes("sample") ||
    sourceLabel.toLowerCase().includes("mock") ||
    dataMode.toLowerCase() === "sample";

  if (invalidValue) {
    return {
      ...candidate,
      activationStatus: "not_activated",
      productionApproved: false,
      reason: `${field} value is missing or invalid; activation is blocked.`,
      reasonCode: "value_missing_or_invalid",
      status: "blocked",
      unit: null,
      value: null,
    };
  }

  if (!metadataComplete || !unitValid || !identityAligned || sampleSource) {
    return {
      ...candidate,
      activationStatus: "deferred",
      productionApproved: false,
      reason: "Source label, research data mode, explicit unit, as-of, ticker, and aligned period are required before activation.",
      reasonCode: !unitValid
        ? "unit_missing_or_invalid"
        : !identityAligned
          ? "ticker_field_or_period_mismatch"
          : sampleSource
            ? "sample_or_mock_source_rejected"
            : "source_metadata_incomplete",
      status: "insufficient_source",
    };
  }

  return {
    ...candidate,
    activationStatus: "activated",
    productionApproved: false,
    reason: "Traceable research input has explicit unit, source, as-of, ticker, and aligned period.",
    reasonCode: "traceable_research_input_activated",
    status: "available",
  };
};

export const buildTraceableInputSourceDecisions = ({
  ticker,
  financials,
  candidates = {},
}: BuildTraceableInputSourceDecisionsInput): TraceableInputSourceDecisions => {
  const normalizedTicker = ticker.trim().toUpperCase();
  const financialsPeriod = financials.statementSnapshot?.period ?? null;

  return Object.fromEntries(
    TRACEABLE_INPUT_FIELDS.map((field) => {
      const candidate = candidates[field] ?? runtimeCandidate(normalizedTicker, financials, field);
      const decision = candidate
        ? assessCandidate({ candidate, expectedTicker: normalizedTicker, field, financialsPeriod })
        : missingDecision(normalizedTicker, field);
      const pilotChecks =
        field !== "totalDebt"
          ? undefined
          : candidate
            ? [
                ...unavailableDebtPilotChecks(normalizedTicker),
                {
                  path: "candidate_validation" as const,
                  reason: decision.reason,
                  status: decision.status === "available" ? ("passed" as const) : ("rejected" as const),
                },
              ]
            : unavailableDebtPilotChecks(normalizedTicker);

      return [
        field,
        pilotChecks ? { ...decision, pilotChecks } : decision,
      ];
    }),
  ) as TraceableInputSourceDecisions;
};
