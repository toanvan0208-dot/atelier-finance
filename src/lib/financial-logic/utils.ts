import { getExplanation } from "./explanations";
import type {
  CompanyType,
  DataQuality,
  FinancialMetricResult,
  FinancialStatementInput,
  MetricLevel,
  MetricUnit,
  PeriodType,
} from "./types";

export const isMissing = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === "number" && !Number.isFinite(value));

export const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export const hasPositiveNumber = (value: unknown): value is number => isFiniteNumber(value) && value > 0;

export const safeDivide = (numerator: number | null | undefined, denominator: number | null | undefined): number | null => {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || denominator === 0) {
    return null;
  }
  return numerator / denominator;
};

export const formatPercent = (value: number | null): string => (isFiniteNumber(value) ? `${(value * 100).toFixed(1)}%` : "Không đủ dữ liệu");
export const formatMultiple = (value: number | null): string => (isFiniteNumber(value) ? `${value.toFixed(1)}x` : "Không đủ dữ liệu");
export const formatVnd = (value: number | null): string => (isFiniteNumber(value) ? `${Math.round(value).toLocaleString("vi-VN")} VND` : "Không đủ dữ liệu");
export const formatPlainNumber = (value: number | null): string => (isFiniteNumber(value) ? value.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "Không đủ dữ liệu");

export const getMissingFields = (input: FinancialStatementInput, fields: string[]): string[] =>
  fields.filter((field) => isMissing(input[field as keyof FinancialStatementInput]));

export const resolveTotalDebt = (input: Pick<FinancialStatementInput, "totalDebt" | "shortTermDebt" | "longTermDebt">): number | null => {
  if (isFiniteNumber(input.totalDebt)) {
    return input.totalDebt;
  }
  if (isFiniteNumber(input.shortTermDebt) && isFiniteNumber(input.longTermDebt)) {
    return input.shortTermDebt + input.longTermDebt;
  }
  return null;
};

export const isFinancialCompany = (companyType?: CompanyType): boolean =>
  companyType === "bank" || companyType === "securities" || companyType === "insurance";

export const average = (current: number | null | undefined, previous: number | null | undefined): number | null => {
  if (isFiniteNumber(current) && isFiniteNumber(previous)) {
    return (current + previous) / 2;
  }
  return isFiniteNumber(current) ? current : null;
};

export const qualityFromMissing = (missingFields: string[], inputFields: string[], fallback: DataQuality = "sufficient"): DataQuality => {
  if (inputFields.length === 0) return fallback;
  if (missingFields.length === inputFields.length) return "missing";
  if (missingFields.length > 0) return "partial";
  return fallback;
};

export const displayMetricValue = (value: number | null, unit: MetricUnit): string => {
  if (unit === "%") return formatPercent(value);
  if (unit === "x") return formatMultiple(value);
  if (unit === "vnd") return formatVnd(value);
  if (unit === "billion_vnd") return isFiniteNumber(value) ? `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ VND` : "Không đủ dữ liệu";
  return formatPlainNumber(value);
};

export const buildMetricResult = (params: {
  key: string;
  label: string;
  value: number | null;
  unit: MetricUnit;
  formula: string;
  inputFields: string[];
  missingFields?: string[];
  level?: MetricLevel;
  dataQuality?: DataQuality;
  warning?: string | null;
  explanation?: string;
  beginnerInterpretation?: string;
  commonMisread?: string;
  moduleUsage?: string[];
  period?: string;
  periodType?: PeriodType;
}): FinancialMetricResult => {
  const explanation = getExplanation(params.key);
  const missingFields = params.missingFields ?? [];
  const dataQuality = params.dataQuality ?? qualityFromMissing(missingFields, params.inputFields);

  return {
    key: params.key,
    label: params.label,
    value: params.value,
    displayValue: displayMetricValue(params.value, params.unit),
    unit: params.unit,
    period: params.period,
    periodType: params.periodType,
    level: params.level ?? (params.value === null ? "unknown" : "neutral"),
    dataQuality,
    formula: params.formula,
    inputFields: params.inputFields,
    missingFields,
    explanation: params.explanation ?? explanation.beginner,
    warning: params.warning ?? (dataQuality === "sufficient" ? null : explanation.warning),
    beginnerInterpretation: params.beginnerInterpretation ?? explanation.beginner,
    commonMisread: params.commonMisread ?? explanation.commonMisread,
    moduleUsage: params.moduleUsage ?? ["financials"],
  };
};

export const withPeriod = <T extends { period?: string; periodType?: PeriodType }>(
  result: T,
  input: Pick<FinancialStatementInput, "period" | "periodType">
): T => ({
  ...result,
  period: result.period ?? input.period,
  periodType: result.periodType ?? input.periodType ?? "unknown",
});
