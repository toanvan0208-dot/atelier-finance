import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

export type FinancialsNumericField =
  | "revenue"
  | "netIncome"
  | "operatingCashFlow"
  | "totalAssets"
  | "equity"
  | "totalDebt"
  | "currentAssets"
  | "currentLiabilities"
  | "eps"
  | "sharesOutstanding";

export type FinancialsUnitMetadataStatus = "explicit" | "missing" | "unknown_unit" | "invalid_unit";

export type FinancialsUnitContract = {
  field: FinancialsNumericField;
  acceptedUnits: ValuationUnit[];
  defaultUnit: null;
  requiresExplicitUnit: true;
  notes: string;
};

export type FinancialsFieldUnitMetadata = {
  field: FinancialsNumericField;
  unit: ValuationUnit;
  status: FinancialsUnitMetadataStatus;
  acceptedUnits: ValuationUnit[];
  requiresExplicitUnit: true;
  sourceLabel?: string | null;
  dataMode?: string | null;
  productionApproved: false;
  warnings: string[];
};

export type FinancialsUnitMetadataMap = Record<FinancialsNumericField, FinancialsFieldUnitMetadata>;

export type BuildFinancialsUnitMetadataOptions = {
  snapshot?: FinancialsStatementSnapshot | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  explicitUnits?: Partial<Record<FinancialsNumericField, ValuationUnit | null>>;
};

const currencyUnits: ValuationUnit[] = ["vnd", "thousand_vnd", "million_vnd", "billion_vnd"];
const shareUnits: ValuationUnit[] = ["shares", "thousand_shares", "million_shares"];

export const financialsUnitContracts: Record<FinancialsNumericField, FinancialsUnitContract> = {
  currentAssets: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "currentAssets",
    notes: "Current assets are scale-sensitive currency values and require explicit unit metadata.",
    requiresExplicitUnit: true,
  },
  currentLiabilities: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "currentLiabilities",
    notes: "Current liabilities are scale-sensitive currency values and require explicit unit metadata.",
    requiresExplicitUnit: true,
  },
  eps: {
    acceptedUnits: ["vnd_per_share"],
    defaultUnit: null,
    field: "eps",
    notes: "EPS is a per-share value and must be explicit VND per share.",
    requiresExplicitUnit: true,
  },
  equity: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "equity",
    notes: "Equity maps to Financials snapshot totalEquity and requires explicit currency scale.",
    requiresExplicitUnit: true,
  },
  netIncome: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "netIncome",
    notes: "Net income maps to Financials snapshot netProfit and requires explicit currency scale.",
    requiresExplicitUnit: true,
  },
  operatingCashFlow: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "operatingCashFlow",
    notes: "Operating cash flow is scale-sensitive and requires explicit currency scale.",
    requiresExplicitUnit: true,
  },
  revenue: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "revenue",
    notes: "Revenue is scale-sensitive and requires explicit currency scale.",
    requiresExplicitUnit: true,
  },
  sharesOutstanding: {
    acceptedUnits: shareUnits,
    defaultUnit: null,
    field: "sharesOutstanding",
    notes: "Shares outstanding must be explicit shares, thousand shares, or million shares.",
    requiresExplicitUnit: true,
  },
  totalAssets: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "totalAssets",
    notes: "Total assets are scale-sensitive currency values and require explicit unit metadata.",
    requiresExplicitUnit: true,
  },
  totalDebt: {
    acceptedUnits: currencyUnits,
    defaultUnit: null,
    field: "totalDebt",
    notes: "Total debt is scale-sensitive and requires explicit currency scale.",
    requiresExplicitUnit: true,
  },
};

export const isFinancialsUnitAccepted = (field: FinancialsNumericField, unit: ValuationUnit): boolean =>
  financialsUnitContracts[field].acceptedUnits.includes(unit);

const snapshotValue = (snapshot: FinancialsStatementSnapshot | null | undefined, field: FinancialsNumericField) => {
  if (!snapshot) return null;
  if (field === "equity") return snapshot.totalEquity ?? null;
  if (field === "netIncome") return snapshot.netProfit ?? null;
  return snapshot[field] ?? null;
};

const metadataForField = ({
  dataMode,
  explicitUnit,
  field,
  sourceLabel,
  value,
}: {
  field: FinancialsNumericField;
  value: number | null | undefined;
  explicitUnit?: ValuationUnit | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
}): FinancialsFieldUnitMetadata => {
  const contract = financialsUnitContracts[field];
  const base = {
    acceptedUnits: contract.acceptedUnits,
    dataMode,
    field,
    productionApproved: false as const,
    requiresExplicitUnit: true as const,
    sourceLabel,
  };

  if (value === null || value === undefined) {
    return {
      ...base,
      status: "missing",
      unit: "unknown",
      warnings: [],
    };
  }

  if (!explicitUnit || explicitUnit === "unknown") {
    return {
      ...base,
      status: "unknown_unit",
      unit: "unknown",
      warnings: [`${field}_financials_unit_metadata_missing`],
    };
  }

  if (!isFinancialsUnitAccepted(field, explicitUnit)) {
    return {
      ...base,
      status: "invalid_unit",
      unit: explicitUnit,
      warnings: [`${field}_financials_unit_${explicitUnit}_invalid`],
    };
  }

  return {
    ...base,
    status: "explicit",
    unit: explicitUnit,
    warnings: [],
  };
};

export const buildFinancialsUnitMetadata = ({
  dataMode,
  explicitUnits = {},
  snapshot = null,
  sourceLabel,
}: BuildFinancialsUnitMetadataOptions = {}): FinancialsUnitMetadataMap => {
  const entries = Object.keys(financialsUnitContracts).map((field) => {
    const key = field as FinancialsNumericField;
    return [
      key,
      metadataForField({
        dataMode,
        explicitUnit: explicitUnits[key],
        field: key,
        sourceLabel,
        value: snapshotValue(snapshot, key),
      }),
    ];
  });

  return Object.fromEntries(entries) as FinancialsUnitMetadataMap;
};

export const financialsUnitsForValuation = (metadata: FinancialsUnitMetadataMap | null | undefined) => ({
  equity: metadata?.equity.unit ?? "unknown",
  eps: metadata?.eps.unit ?? "unknown",
  netIncome: metadata?.netIncome.unit ?? "unknown",
  revenue: metadata?.revenue.unit ?? "unknown",
  sharesOutstanding: metadata?.sharesOutstanding.unit ?? "unknown",
});
