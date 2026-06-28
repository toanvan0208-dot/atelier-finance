export type DomesticRateSemanticCandidate =
  | "INTERBANK_RATE_OVERNIGHT"
  | "POLICY_RATE"
  | "GOV_BOND_YIELD_10Y"
  | "DEPOSIT_RATE"
  | "LENDING_RATE";

export type DomesticRateSemanticMappingItem = {
  frontendMetricLabel: "Lãi suất trong nước";
  frontendMetricId: string;
  currentIndicatorCode: string;
  candidateIndicatorCode: DomesticRateSemanticCandidate;
  semanticFit:
    | "strong"
    | "medium"
    | "weak"
    | "not_recommended";
  dataAvailability:
    | "db_backed"
    | "source_candidate"
    | "manual_review_only"
    | "blocked"
    | "not_assessed";
  sourceStrategy?: string;
  sourceLimitations: string[];
  recommendation:
    | "keep_current_mapping"
    | "replace_current_mapping"
    | "manual_review_before_mapping_change"
    | "block_until_source_verified";
  rationale: string[];
};

export const MACRO_DOMESTIC_RATE_SEMANTIC_MAPPINGS: DomesticRateSemanticMappingItem[] = [
  {
    frontendMetricLabel: "Lãi suất trong nước",
    frontendMetricId: "domestic-rate",
    currentIndicatorCode: "INTERBANK_RATE_OVERNIGHT",
    candidateIndicatorCode: "POLICY_RATE",
    semanticFit: "strong",
    dataAvailability: "source_candidate",
    sourceStrategy: "SBV",
    sourceLimitations: ["Nguồn SBV thường HTML parsing, thiếu API."],
    recommendation: "manual_review_before_mapping_change",
    rationale: [
      "POLICY_RATE reflects the overall monetary policy stance better than the overnight interbank rate.",
      "A change in mapping requires product owner review before implementation."
    ]
  },
  {
    frontendMetricLabel: "Lãi suất trong nước",
    frontendMetricId: "domestic-rate",
    currentIndicatorCode: "INTERBANK_RATE_OVERNIGHT",
    candidateIndicatorCode: "INTERBANK_RATE_OVERNIGHT",
    semanticFit: "medium",
    dataAvailability: "blocked",
    sourceStrategy: "SBV HTML",
    sourceLimitations: ["Cần HTML scraping trên SBV. Hiện đang bị blocked do cấu trúc không ổn định."],
    recommendation: "manual_review_before_mapping_change",
    rationale: [
      "Currently mapped to domestic-rate but represents a very specific short-term rate.",
      "Blocked due to unstable SBV HTML."
    ]
  },
  {
    frontendMetricLabel: "Lãi suất trong nước",
    frontendMetricId: "domestic-rate",
    currentIndicatorCode: "INTERBANK_RATE_OVERNIGHT",
    candidateIndicatorCode: "GOV_BOND_YIELD_10Y",
    semanticFit: "medium",
    dataAvailability: "not_assessed",
    sourceLimitations: ["Nguồn dữ liệu HNX thường khó trích xuất tự động."],
    recommendation: "manual_review_before_mapping_change",
    rationale: [
      "Represents long term capital cost, not retail/corporate rates."
    ]
  },
  {
    frontendMetricLabel: "Lãi suất trong nước",
    frontendMetricId: "domestic-rate",
    currentIndicatorCode: "INTERBANK_RATE_OVERNIGHT",
    candidateIndicatorCode: "DEPOSIT_RATE",
    semanticFit: "medium",
    dataAvailability: "not_assessed",
    sourceLimitations: ["Khó có nguồn chuẩn tổng hợp."],
    recommendation: "manual_review_before_mapping_change",
    rationale: [
      "No standard source available for aggregate deposit rate."
    ]
  },
  {
    frontendMetricLabel: "Lãi suất trong nước",
    frontendMetricId: "domestic-rate",
    currentIndicatorCode: "INTERBANK_RATE_OVERNIGHT",
    candidateIndicatorCode: "LENDING_RATE",
    semanticFit: "medium",
    dataAvailability: "not_assessed",
    sourceLimitations: ["Khó có nguồn cập nhật chuẩn."],
    recommendation: "manual_review_before_mapping_change",
    rationale: [
      "No standard source available for aggregate lending rate."
    ]
  }
];

export const DOMESTIC_RATE_FRONTEND_INDICATOR_CODE = "POLICY_RATE";
