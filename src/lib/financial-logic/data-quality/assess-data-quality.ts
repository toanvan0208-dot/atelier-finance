import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { DataQualityResult, FinancialStatementInput, SourceStatus } from "../types";
import { getMissingFields, isMissing } from "../utils";

export const CORE_DATA_FIELDS = [
  "revenue",
  "netProfit",
  "totalAssets",
  "totalLiabilities",
  "totalEquity",
  "operatingCashFlow",
  "closePrice",
  "volume",
  "sourceName",
  "collectedAt",
] as const;

export const getCoreMissingFields = (input: FinancialStatementInput): string[] =>
  CORE_DATA_FIELDS.filter((field) => isMissing(input[field]));

export const isDataStale = (input: Pick<FinancialStatementInput, "collectedAt">, staleDays = DEFAULT_THRESHOLDS.dataQuality.staleDays): boolean => {
  if (!input.collectedAt) return true;
  const collectedAt = input.collectedAt instanceof Date ? input.collectedAt : new Date(input.collectedAt);
  if (Number.isNaN(collectedAt.getTime())) return true;
  const ageMs = Date.now() - collectedAt.getTime();
  return ageMs > staleDays * 24 * 60 * 60 * 1000;
};

export const assessDataQuality = (input: FinancialStatementInput): DataQualityResult => {
  const missingFields = getCoreMissingFields(input);
  const stale = isDataStale(input);
  const sourceStatus: SourceStatus = input.sourceName ? "verified" : "missing";
  const completeness = (CORE_DATA_FIELDS.length - missingFields.length) / CORE_DATA_FIELDS.length;
  const score = Math.max(0, Math.round(completeness * 100) - (stale ? 15 : 0) - (sourceStatus === "missing" ? 15 : 0));
  const status = missingFields.length === CORE_DATA_FIELDS.length
    ? "missing"
    : score < 50
      ? "poor"
      : stale
        ? "stale"
        : score >= 80
        ? "good"
        : score >= 50
          ? "usable_with_caution"
          : "poor";

  return {
    status,
    sourceStatus,
    score,
    missingFields,
    stale,
    warnings: buildDataQualityWarning({ missingFields, stale, sourceStatus }),
    beginnerInterpretation:
      status === "good"
        ? "Dữ liệu tương đối đủ để tính toán sơ bộ."
        : "Dữ liệu cần được đọc với cảnh báo; chỉ số tính ra có thể thiếu độ tin cậy.",
  };
};

export const buildDataQualityWarning = (input: { missingFields: string[]; stale: boolean; sourceStatus: SourceStatus }): string[] => [
  ...(input.missingFields.length > 0 ? [`Thiếu dữ liệu: ${input.missingFields.join(", ")}.`] : []),
  ...(input.stale ? ["Dữ liệu có thể đã cũ so với ngưỡng mặc định 180 ngày."] : []),
  ...(input.sourceStatus === "missing" ? ["Thiếu tên nguồn dữ liệu, cần xác minh trước khi dùng trong phân tích."] : []),
];

export const getRequiredMissingFields = (input: FinancialStatementInput, fields: string[]): string[] => getMissingFields(input, fields);
