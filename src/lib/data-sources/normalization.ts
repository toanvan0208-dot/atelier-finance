import type { ReadinessStatus } from "../data-contract";
import type { AdapterError, AdapterWarning } from "./types";

export type Unit =
  | "vnd"
  | "million_vnd"
  | "billion_vnd"
  | "shares"
  | "percentage"
  | "ratio";

export type NormalizationResult<T> = {
  value: T | null;
  warnings: AdapterWarning[];
  errors: AdapterError[];
  readiness: ReadinessStatus;
};

const missingTokens = new Set(["", "n/a", "na", "-", "--", "null", "undefined", "none"]);

export const parseNullableNumber = (
  value: unknown,
  field = "number",
): NormalizationResult<number> => {
  if (value === null || value === undefined) {
    return {
      value: null,
      warnings: [{ code: "MISSING_VALUE", message: "Missing value remains null.", field }],
      errors: [],
      readiness: "insufficient_data",
    };
  }

  if (typeof value === "string" && missingTokens.has(value.trim().toLowerCase())) {
    return {
      value: null,
      warnings: [{ code: "MISSING_VALUE", message: "Missing token remains null.", field }],
      errors: [],
      readiness: "insufficient_data",
    };
  }

  const parsed = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(parsed)) {
    return {
      value: null,
      warnings: [],
      errors: [{ code: "INVALID_NUMBER", message: "Value is not a valid finite number.", field }],
      readiness: "not_ready",
    };
  }

  return {
    value: parsed,
    warnings: [],
    errors: [],
    readiness: "ready",
  };
};

export const normalizeUnitValue = (
  value: unknown,
  unit: Unit,
  field = "number",
): NormalizationResult<number> => {
  const parsed = parseNullableNumber(value, field);
  if (parsed.value === null) return parsed;

  if (unit === "million_vnd") {
    return { ...parsed, value: parsed.value * 1_000_000 };
  }

  if (unit === "billion_vnd") {
    return { ...parsed, value: parsed.value * 1_000_000_000 };
  }

  if (unit === "percentage") {
    return { ...parsed, value: parsed.value / 100 };
  }

  return parsed;
};

export const normalizeCurrencyAmount = ({
  value,
  currency,
  exchangeRateToVnd,
  exchangeRateSource,
  field = "amount",
}: {
  value: unknown;
  currency: string | null | undefined;
  exchangeRateToVnd?: number | null;
  exchangeRateSource?: string | null;
  field?: string;
}): NormalizationResult<number> => {
  const parsed = parseNullableNumber(value, field);
  if (parsed.value === null) return parsed;

  if (!currency || currency.toUpperCase() === "VND") {
    return parsed;
  }

  if (
    typeof exchangeRateToVnd !== "number" ||
    !Number.isFinite(exchangeRateToVnd) ||
    !exchangeRateSource
  ) {
    return {
      value: null,
      warnings: [
        {
          code: "CURRENCY_NEEDS_REVIEW",
          message: "Non-VND currency is not converted without an exchange rate and source.",
          field,
        },
      ],
      errors: [],
      readiness: "needs_review",
    };
  }

  return {
    value: parsed.value * exchangeRateToVnd,
    warnings: [
      {
        code: "CURRENCY_CONVERTED",
        message: `Converted to VND using ${exchangeRateSource}.`,
        field,
      },
    ],
    errors: [],
    readiness: "ready",
  };
};

export const parseAsOfDate = (
  value: unknown,
  field = "asOf",
): NormalizationResult<string> => {
  if (typeof value !== "string" || value.trim() === "") {
    return {
      value: null,
      warnings: [],
      errors: [{ code: "AS_OF_MISSING", message: "Missing asOf is not replaced with current date.", field }],
      readiness: "insufficient_data",
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      value: null,
      warnings: [],
      errors: [{ code: "INVALID_AS_OF", message: "Invalid asOf date.", field }],
      readiness: "not_ready",
    };
  }

  return {
    value: parsed.toISOString().slice(0, 10),
    warnings: [],
    errors: [],
    readiness: "ready",
  };
};
