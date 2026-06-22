export const MACRO_INDICATOR_KEYS = ["gdp_growth", "cpi", "policy_rate", "usd_vnd"] as const;

export type MacroIndicatorKey = (typeof MACRO_INDICATOR_KEYS)[number];

export type MacroIndicatorStatus = "available" | "missing" | "partial" | "sample" | "stale";

export type MacroIndicatorDataMode =
  | "missing"
  | "sample"
  | "research_only"
  | "manual"
  | "reviewed_candidate";

export type MacroIndicator = {
  indicatorKey: MacroIndicatorKey;
  name: string;
  value: number | null;
  unit: string | null;
  period: string | null;
  asOf: string | null;
  sourceName: string | null;
  sourceLabel: string | null;
  dataMode: MacroIndicatorDataMode;
  productionApproved: false;
  status: MacroIndicatorStatus;
  explanationForBeginner: string;
  whyItMatters: string;
  whatToCheckNext: string;
  warnings: string[];
};

export const MACRO_MISSING_VALUE_LABEL = "Chưa đủ dữ liệu";

export function formatMacroIndicatorValue(indicator: MacroIndicator): string {
  if (indicator.value === null || !indicator.unit) return MACRO_MISSING_VALUE_LABEL;

  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(indicator.value)} ${indicator.unit}`;
}

export function macroIndicatorNeedsDataWarning(indicator: MacroIndicator): boolean {
  return indicator.status === "missing" || indicator.status === "sample" || indicator.status === "stale";
}
