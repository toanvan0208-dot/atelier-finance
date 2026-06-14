import { DEFAULT_THRESHOLDS } from "../thresholds";
import type { DataQualityResult, FinancialStatementInput, SourceStatus } from "../types";
import { getMissingFields, isMissing } from "../utils";

export type DataQualityProfile = "financial" | "market";

export type AssessDataQualityOptions = {
  profile?: DataQualityProfile;
};

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

export const MARKET_DATA_FIELDS = [
  "closePrice",
  "previousClosePrice",
  "volume",
  "avgTradingValue20d",
  "sourceName",
  "collectedAt",
] as const;

export const getCoreMissingFields = (input: FinancialStatementInput): string[] =>
  CORE_DATA_FIELDS.filter((field) => isMissing(input[field]));

export const getMarketMissingFields = (input: FinancialStatementInput): string[] => {
  const missingFields = ["closePrice", "previousClosePrice", "volume", "sourceName", "collectedAt"].filter((field) =>
    isMissing(input[field as keyof FinancialStatementInput])
  );
  const hasAverageTradingValue =
    !isMissing(input.avgTradingValue20d) || (!isMissing(input.closePrice) && !isMissing(input.avgVolume20d));

  return hasAverageTradingValue ? missingFields : [...missingFields, "avgTradingValue20d"];
};

export const isDataStale = (input: Pick<FinancialStatementInput, "collectedAt">, staleDays = DEFAULT_THRESHOLDS.dataQuality.staleDays): boolean => {
  if (!input.collectedAt) return true;
  const collectedAt = input.collectedAt instanceof Date ? input.collectedAt : new Date(input.collectedAt);
  if (Number.isNaN(collectedAt.getTime())) return true;
  const ageMs = Date.now() - collectedAt.getTime();
  return ageMs > staleDays * 24 * 60 * 60 * 1000;
};

export const assessDataQuality = (
  input: FinancialStatementInput,
  options: AssessDataQualityOptions = {}
): DataQualityResult => {
  const profile = options.profile ?? "financial";
  const requiredFieldCount = profile === "market" ? MARKET_DATA_FIELDS.length : CORE_DATA_FIELDS.length;
  const missingFields = profile === "market" ? getMarketMissingFields(input) : getCoreMissingFields(input);
  const stale = isDataStale(input);
  const sourceStatus: SourceStatus = input.sourceName ? "verified" : "missing";
  const completeness = (requiredFieldCount - missingFields.length) / requiredFieldCount;
  const score = Math.max(0, Math.round(completeness * 100) - (stale ? 15 : 0) - (sourceStatus === "missing" ? 15 : 0));
  const status = missingFields.length === requiredFieldCount
    ? "missing"
    : score < 50
      ? "poor"
      : profile === "market" && missingFields.length > 0
        ? "usable_with_caution"
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
    warnings: buildDataQualityWarning({ missingFields, stale, sourceStatus, profile }),
    beginnerInterpretation:
      status === "good"
        ? "Dữ liệu tương đối đủ để tính toán sơ bộ."
        : "Dữ liệu cần được đọc với cảnh báo; chỉ số tính ra có thể thiếu độ tin cậy.",
  };
};

export const buildDataQualityWarning = (input: {
  missingFields: string[];
  stale: boolean;
  sourceStatus: SourceStatus;
  profile?: DataQualityProfile;
}): string[] => {
  const marketWarnings =
    input.profile === "market"
      ? [
          ...(input.missingFields.includes("closePrice") ? ["Thiếu giá hiện tại, chưa đủ dữ liệu để đọc PVT."] : []),
          ...(input.missingFields.includes("previousClosePrice")
            ? ["Thiếu giá phiên trước, chưa đủ dữ liệu so sánh biến động giá."]
            : []),
          ...(input.missingFields.includes("volume")
            ? ["Thiếu khối lượng giao dịch, chưa đủ dữ liệu để tính giá trị giao dịch."]
            : []),
          ...(input.missingFields.includes("avgTradingValue20d")
            ? ["Chưa đủ dữ liệu bình quân 20 phiên để đọc thanh khoản ổn định."]
            : []),
        ]
      : [];

  return [
    ...marketWarnings,
    ...(input.missingFields.length > 0 ? [`Thiếu dữ liệu: ${input.missingFields.join(", ")}.`] : []),
    ...(input.stale ? ["Dữ liệu có thể đã cũ so với ngưỡng mặc định 180 ngày."] : []),
    ...(input.sourceStatus === "missing" ? ["Thiếu tên nguồn dữ liệu, cần xác minh trước khi dùng trong phân tích."] : []),
  ];
};

export const getRequiredMissingFields = (input: FinancialStatementInput, fields: string[]): string[] => getMissingFields(input, fields);
