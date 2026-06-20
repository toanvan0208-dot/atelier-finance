export type ValuationUnit =
  | "vnd"
  | "thousand_vnd"
  | "million_vnd"
  | "billion_vnd"
  | "vnd_per_share"
  | "shares"
  | "thousand_shares"
  | "million_shares"
  | "ratio"
  | "unknown";

export type ValuationInputProvenanceSource =
  | "financials_runtime"
  | "persisted_bridge"
  | "market_pvt"
  | "sample_fallback"
  | "unknown";

export type ValuationInputNormalizationKind = "currency" | "per_share" | "shares" | "ratio";

export type ValuationInputNormalizationStatus =
  | "ready"
  | "missing"
  | "unknown_unit"
  | "invalid"
  | "not_normalized";

export type ValuationInputProvenance = {
  source: ValuationInputProvenanceSource;
  sourceLabel?: string | null;
  dataMode?: string | null;
  productionApproved: boolean;
  unit: ValuationUnit;
  asOf?: string | null;
};

export type NormalizeValuationInputOptions = {
  value?: number | null;
  unit?: ValuationUnit | null;
  expected: ValuationInputNormalizationKind;
  provenance: Omit<ValuationInputProvenance, "unit">;
};

export type NormalizedValuationInput = {
  value: number | null;
  unit: ValuationUnit;
  normalizedValue: number | null;
  normalizedUnit: ValuationUnit | "not_normalized";
  provenance: ValuationInputProvenance;
  status: ValuationInputNormalizationStatus;
  warnings: string[];
};

const currencyMultipliers: Partial<Record<ValuationUnit, number>> = {
  billion_vnd: 1_000_000_000,
  million_vnd: 1_000_000,
  thousand_vnd: 1_000,
  vnd: 1,
};

const shareMultipliers: Partial<Record<ValuationUnit, number>> = {
  million_shares: 1_000_000,
  shares: 1,
  thousand_shares: 1_000,
};

const normalizeUnit = (unit?: ValuationUnit | null): ValuationUnit => unit ?? "unknown";

const expectedUnit = (expected: ValuationInputNormalizationKind): ValuationUnit | "not_normalized" => {
  if (expected === "currency") return "vnd";
  if (expected === "per_share") return "vnd_per_share";
  if (expected === "shares") return "shares";
  if (expected === "ratio") return "ratio";
  return "not_normalized";
};

export const normalizeValuationInput = ({
  expected,
  provenance,
  unit,
  value,
}: NormalizeValuationInputOptions): NormalizedValuationInput => {
  const resolvedUnit = normalizeUnit(unit);
  const base = {
    value: typeof value === "number" && Number.isFinite(value) ? value : null,
    unit: resolvedUnit,
    provenance: {
      ...provenance,
      productionApproved: false,
      unit: resolvedUnit,
    },
  };

  if (value === null || value === undefined) {
    return {
      ...base,
      normalizedValue: null,
      normalizedUnit: "not_normalized",
      status: "missing",
      warnings: [],
    };
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return {
      ...base,
      normalizedValue: null,
      normalizedUnit: "not_normalized",
      status: "invalid",
      warnings: ["invalid_number_blocks_calculation"],
    };
  }

  if (resolvedUnit === "unknown") {
    return {
      ...base,
      normalizedValue: null,
      normalizedUnit: "not_normalized",
      status: "unknown_unit",
      warnings: ["unknown_unit_blocks_calculation"],
    };
  }

  if (expected === "currency" && currencyMultipliers[resolvedUnit]) {
    return {
      ...base,
      normalizedValue: value * currencyMultipliers[resolvedUnit],
      normalizedUnit: "vnd",
      status: "ready",
      warnings: [],
    };
  }

  if (expected === "shares" && shareMultipliers[resolvedUnit]) {
    return {
      ...base,
      normalizedValue: value * shareMultipliers[resolvedUnit],
      normalizedUnit: "shares",
      status: "ready",
      warnings: [],
    };
  }

  if (expected === "per_share" && resolvedUnit === "vnd_per_share") {
    return {
      ...base,
      normalizedValue: value,
      normalizedUnit: "vnd_per_share",
      status: "ready",
      warnings: [],
    };
  }

  if (expected === "ratio" && resolvedUnit === "ratio") {
    return {
      ...base,
      normalizedValue: value,
      normalizedUnit: "ratio",
      status: "ready",
      warnings: [],
    };
  }

  return {
    ...base,
    normalizedValue: null,
    normalizedUnit: expectedUnit(expected),
    status: "not_normalized",
    warnings: [`unit_${resolvedUnit}_not_compatible_with_${expected}`],
  };
};
