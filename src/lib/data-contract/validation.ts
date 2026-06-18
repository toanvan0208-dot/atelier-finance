import type {
  CompanyType,
  DataContractMetricResult,
  DataSourceMetadata,
  DataSourceWarning,
  DerivedDataSourceMetadata,
  SectorSensitiveMetric,
} from "./types";

export const isMissingValue = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "number" && !Number.isFinite(value));

export const isUsableNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const normalizeOptionalNumber = (value: unknown): number | null =>
  isUsableNumber(value) ? value : null;

export const collectMissingFields = <T extends object>(
  record: T,
  fields: Array<keyof T & string>,
): string[] => fields.filter((field) => isMissingValue(record[field]));

const warning = (
  code: DataSourceWarning["code"],
  message: string,
  field?: string,
): DataSourceWarning => ({ code, message, field });

const withMetadataWarnings = (
  metadata: DataSourceMetadata | undefined,
  warnings: DataSourceWarning[],
): DataSourceWarning[] => [...(metadata?.warnings ?? []), ...warnings];

export const safeRatio = (
  numerator: unknown,
  denominator: unknown,
  metadata?: DataSourceMetadata,
  key = "ratio",
): DataContractMetricResult => {
  if (!isUsableNumber(numerator)) {
    return {
      key,
      value: null,
      status: "insufficient_data",
      interpretation: "insufficient_data",
      missingFields: ["numerator"],
      warnings: withMetadataWarnings(metadata, [
        warning("MISSING_DATA", "Numerator is missing; missing values must not be converted to zero.", "numerator"),
      ]),
      metadata,
      reason: "Numerator is missing or not finite.",
    };
  }

  if (!isUsableNumber(denominator) || denominator === 0) {
    return {
      key,
      value: null,
      status: "insufficient_data",
      interpretation: "insufficient_data",
      missingFields: ["denominator"],
      warnings: withMetadataWarnings(metadata, [
        warning(
          "INVALID_DENOMINATOR",
          "Denominator is missing, not finite, or zero; calculation is not available.",
          "denominator",
        ),
      ]),
      metadata,
      reason: "Denominator is missing, not finite, or zero.",
    };
  }

  return {
    key,
    value: numerator / denominator,
    status: "ready",
    interpretation: "normal",
    missingFields: [],
    warnings: metadata?.warnings ?? [],
    metadata,
  };
};

export const validatePeInterpretation = ({
  eps,
  metadata,
}: {
  eps: unknown;
  metadata?: DataSourceMetadata;
}): DataContractMetricResult<null> => {
  if (!isUsableNumber(eps)) {
    return {
      key: "peInterpretation",
      value: null,
      status: "insufficient_data",
      interpretation: "insufficient_data",
      missingFields: ["eps"],
      warnings: withMetadataWarnings(metadata, [
        warning("MISSING_DATA", "EPS is missing; P/E interpretation is unavailable.", "eps"),
      ]),
      metadata,
    };
  }

  if (eps <= 0) {
    return {
      key: "peInterpretation",
      value: null,
      status: "not_ready",
      interpretation: "not_applicable",
      missingFields: [],
      warnings: withMetadataWarnings(metadata, [
        warning("EPS_NOT_POSITIVE", "EPS is not positive; P/E must not be interpreted as cheap.", "eps"),
      ]),
      metadata,
      reason: "EPS is zero or negative.",
    };
  }

  return {
    key: "peInterpretation",
    value: null,
    status: "ready",
    interpretation: "normal",
    missingFields: [],
    warnings: metadata?.warnings ?? [],
    metadata,
  };
};

export const validateEquityInterpretation = ({
  equity,
  metadata,
}: {
  equity: unknown;
  metadata?: DataSourceMetadata;
}): DataContractMetricResult<null> => {
  if (!isUsableNumber(equity)) {
    return {
      key: "equityInterpretation",
      value: null,
      status: "insufficient_data",
      interpretation: "insufficient_data",
      missingFields: ["equity"],
      warnings: withMetadataWarnings(metadata, [
        warning("MISSING_DATA", "Equity is missing; equity-based interpretation is unavailable.", "equity"),
      ]),
      metadata,
    };
  }

  if (equity <= 0) {
    return {
      key: "equityInterpretation",
      value: null,
      status: "needs_review",
      interpretation: "not_applicable",
      missingFields: [],
      warnings: withMetadataWarnings(metadata, [
        warning(
          "EQUITY_NOT_POSITIVE",
          "Equity is not positive; ROE, P/B, and BVPS must not be interpreted normally.",
          "equity",
        ),
      ]),
      metadata,
      reason: "Equity is zero or negative.",
    };
  }

  return {
    key: "equityInterpretation",
    value: null,
    status: "ready",
    interpretation: "normal",
    missingFields: [],
    warnings: metadata?.warnings ?? [],
    metadata,
  };
};

export const isFinancialCompanyType = (companyType: CompanyType): boolean =>
  companyType === "bank" ||
  companyType === "securities" ||
  companyType === "insurance";

export const validateSectorSensitiveMetric = ({
  companyType,
  metric,
  metadata,
}: {
  companyType: CompanyType;
  metric: SectorSensitiveMetric;
  metadata?: DataSourceMetadata;
}): DataContractMetricResult<null> => {
  if (!isFinancialCompanyType(companyType)) {
    return {
      key: metric,
      value: null,
      status: "ready",
      interpretation: "normal",
      missingFields: [],
      warnings: metadata?.warnings ?? [],
      metadata,
    };
  }

  return {
    key: metric,
    value: null,
    status: "needs_review",
    interpretation: "not_applicable",
    missingFields: [],
    warnings: withMetadataWarnings(metadata, [
      warning(
        "FINANCIAL_SECTOR_CAVEAT",
        "Bank, securities, and insurance companies need sector-specific logic for this metric.",
        metric,
      ),
    ]),
    metadata,
    reason: "Generic non-financial metric is not applicable to financial companies.",
  };
};

export const deriveMetadataFromInputs = (
  inputs: DataSourceMetadata[],
  overrides: Partial<DataSourceMetadata> = {},
  calculationVersion?: string,
): DerivedDataSourceMetadata => {
  const firstInput = inputs[0];
  const mergedWarnings = inputs.flatMap((input) => input.warnings);
  const missingFields = Array.from(
    new Set(inputs.flatMap((input) => input.missingFields)),
  );
  const derivedWarnings = [
    ...mergedWarnings,
    warning("DERIVED_FROM_INPUTS", "Metric is derived from source records."),
  ];

  if (!firstInput?.source) {
    derivedWarnings.push(warning("SOURCE_MISSING", "Derived metric has no primary source."));
  }

  if (!firstInput?.asOf) {
    derivedWarnings.push(warning("AS_OF_MISSING", "Derived metric has no primary asOf timestamp."));
  }

  return {
    source: overrides.source ?? firstInput?.source ?? null,
    sourceType: overrides.sourceType ?? firstInput?.sourceType ?? "unknown",
    asOf: overrides.asOf ?? firstInput?.asOf ?? null,
    period: overrides.period ?? firstInput?.period ?? null,
    collectedAt: overrides.collectedAt ?? firstInput?.collectedAt ?? null,
    isDemoData: overrides.isDemoData ?? inputs.some((input) => input.isDemoData),
    isStale: overrides.isStale ?? inputs.some((input) => input.isStale),
    missingFields: overrides.missingFields ?? missingFields,
    warnings: overrides.warnings ?? derivedWarnings,
    derivedFrom: inputs,
    calculationVersion,
  };
};
