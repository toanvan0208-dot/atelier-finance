import type { MacroCompassMetric } from "../types";

export const MACRO_COMPASS_MISSING_LABEL = "Chưa đủ dữ liệu";

export function formatMacroCompassMetricValue(metric: MacroCompassMetric): string {
  if (metric.value === null) return MACRO_COMPASS_MISSING_LABEL;
  if (typeof metric.value === "number" && metric.unit) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(metric.value)} ${metric.unit}`;
  }
  return String(metric.value);
}

export function macroCompassMetricStatusLabel(metric: MacroCompassMetric): string {
  if (metric.status === "missing") return MACRO_COMPASS_MISSING_LABEL;
  if (metric.status === "sample") return "Dữ liệu minh họa";
  if (metric.status === "unverified") return "Đang xác nhận";
  if (metric.status === "partial") return "Cần nguồn rà soát";
  if (metric.status === "stale") return "Dữ liệu cần cập nhật";
  return metric.statusLabel;
}

export function hasRequiredMacroMetricMetadata(metric: MacroCompassMetric): boolean {
  return Boolean(metric.sourceName && metric.sourceLabel && metric.period && metric.asOf);
}

export function macroCompassMetricCanBeAvailable(metric: MacroCompassMetric): boolean {
  return (
    metric.value !== null &&
    hasRequiredMacroMetricMetadata(metric) &&
    metric.dataMode === "reviewed" &&
    metric.productionApproved
  );
}
