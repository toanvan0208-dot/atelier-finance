import { assessDataQuality } from "../data-quality/assess-data-quality";
import type { FinancialStatementInput, RiskScoreResult } from "../types";

export const calculateDataQualityRisk = (input: FinancialStatementInput): RiskScoreResult => {
  const quality = assessDataQuality(input);
  const score = quality.status === "missing" ? null : quality.status === "poor" ? 80 : quality.status === "stale" ? 55 : quality.status === "usable_with_caution" ? 35 : 10;
  return {
    key: "dataQualityRisk",
    label: "Rủi ro chất lượng dữ liệu",
    score,
    level: score === null ? "unknown" : score >= 70 ? "high" : score >= 35 ? "medium" : "low",
    dataQuality: quality.status === "good" ? "sufficient" : quality.status === "missing" ? "missing" : "partial",
    reasons: quality.warnings,
    warnings: quality.warnings,
    missingFields: quality.missingFields,
    beginnerInterpretation: "Nếu dữ liệu thiếu hoặc cũ, các chỉ số phía sau phải được đọc thận trọng hơn.",
  };
};
