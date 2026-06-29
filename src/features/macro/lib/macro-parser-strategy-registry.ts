export type MacroParserFeasibility =
  | "api_ready"
  | "csv_excel_ready"
  | "html_parser_feasible"
  | "manual_review_only"
  | "blocked"
  | "not_recommended"
  | "not_assessed";

export type MacroParserPriority =
  | "high"
  | "medium"
  | "low"
  | "blocked";

export type MacroParserStrategyItem = {
  indicatorCode: string;
  inCurrentFrontend: boolean;
  sourceLabel?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceType:
    | "api"
    | "csv_excel"
    | "html_table"
    | "pdf"
    | "documentation"
    | "unknown";
  parserFeasibility: MacroParserFeasibility;
  parserPriority: MacroParserPriority;
  parserRisk:
    | "low"
    | "medium"
    | "high"
    | "blocked";
  expectedFrequency?: string;
  expectedUnit?: string;
  requiresManualReview: boolean;
  candidateFor148E: boolean;
  blockedReason?: string;
  limitations: string[];
  validationNotes: string[];
};

export const MACRO_PARSER_STRATEGY_REGISTRY: MacroParserStrategyItem[] = [
  {
    indicatorCode: "USD_VND",
    inCurrentFrontend: true,
    sourceName: "Vietcombank Exchange Rate API",
    sourceUrl: "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx",
    sourceType: "api",
    parserFeasibility: "api_ready",
    parserPriority: "high",
    parserRisk: "low",
    requiresManualReview: false,
    candidateFor148E: true,
    limitations: ["SBV HTML is unstable. Falling back to VCB XML API which provides machine-readable XML."],
    validationNotes: ["XML is stable and widely used."]
  },
  {
    indicatorCode: "INTERBANK_RATE_OVERNIGHT",
    inCurrentFrontend: true,
    sourceName: "State Bank of Vietnam",
    sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lstlnt/lstlnt",
    sourceType: "html_table",
    parserFeasibility: "manual_review_only",
    parserPriority: "high",
    parserRisk: "medium",
    requiresManualReview: true,
    candidateFor148E: true,
    limitations: ["SBV HTML is JS-rendered and highly unstable. No stable endpoint found. Kept as manual review for now."],
    validationNotes: ["Target overnight rate row in the interbank table."]
  },
  {
    indicatorCode: "CREDIT_GROWTH",
    inCurrentFrontend: true,
    sourceName: "SBV Press Releases",
    sourceType: "pdf",
    parserFeasibility: "blocked",
    parserPriority: "blocked",
    parserRisk: "blocked",
    requiresManualReview: true,
    candidateFor148E: false,
    blockedReason: "missing_source_url_and_semantic_mapping_review_required",
    limitations: ["Data is often buried in unstructured text or PDF reports.", "Do not substitute M2 growth or lending rates for credit growth."],
    validationNotes: ["Needs an official SBV/source URL and exact definition before parser dry-run."]
  },
  {
    indicatorCode: "MARKET_TRADING_VALUE",
    inCurrentFrontend: true,
    sourceName: "Market Data Provider",
    sourceType: "api",
    parserFeasibility: "api_ready",
    parserPriority: "high",
    parserRisk: "low",
    requiresManualReview: false,
    candidateFor148E: true,
    limitations: ["Depends on market data provider subscription/stability."],
    validationNotes: ["Easy to aggregate from daily market summaries if provider supports it."]
  },
  {
    indicatorCode: "FOREIGN_NET_FLOW",
    inCurrentFrontend: true,
    sourceName: "Market Data Provider",
    sourceType: "api",
    parserFeasibility: "api_ready",
    parserPriority: "high",
    parserRisk: "low",
    requiresManualReview: false,
    candidateFor148E: true,
    limitations: ["Depends on market data provider subscription/stability."],
    validationNotes: ["Can be fetched directly from market endpoint."]
  },
  {
    indicatorCode: "PUBLIC_INVESTMENT",
    inCurrentFrontend: true,
    sourceName: "GSO Monthly Report",
    sourceType: "unknown",
    parserFeasibility: "blocked",
    parserPriority: "blocked",
    parserRisk: "blocked",
    requiresManualReview: true,
    candidateFor148E: false,
    blockedReason: "missing_source_url_and_semantic_mapping_review_required",
    limitations: ["No concrete GSO/MOF/Treasury URL is documented in the repo.", "Must confirm whether the metric is realized public investment capital from the state budget or another public investment definition."],
    validationNotes: ["Blocked from parser dry-run until the source URL and semantic mapping are reviewed."]
  },
  {
    indicatorCode: "EXPORT_GROWTH",
    inCurrentFrontend: true,
    sourceName: "GSO Trade Statistics",
    sourceType: "unknown",
    parserFeasibility: "blocked",
    parserPriority: "blocked",
    parserRisk: "blocked",
    requiresManualReview: true,
    candidateFor148E: false,
    blockedReason: "missing_source_url",
    limitations: ["GSO is a plausible official candidate, but no concrete source URL is documented in the repo."],
    validationNotes: ["Blocked from parser dry-run until an official URL or downloadable table is selected."]
  },
  {
    indicatorCode: "BRENT_OIL_PRICE",
    inCurrentFrontend: true,
    sourceName: "FRED / Global API",
    sourceType: "api",
    parserFeasibility: "api_ready",
    parserPriority: "medium",
    parserRisk: "low",
    requiresManualReview: false,
    candidateFor148E: false,
    limitations: ["Requires API key."],
    validationNotes: ["Will prioritize local VN indicators first."]
  },
  {
    indicatorCode: "DXY",
    inCurrentFrontend: true,
    sourceName: "Global API",
    sourceType: "api",
    parserFeasibility: "api_ready",
    parserPriority: "medium",
    parserRisk: "low",
    requiresManualReview: false,
    candidateFor148E: false,
    limitations: ["Requires API key."],
    validationNotes: ["Will prioritize local VN indicators first."]
  },
  {
    indicatorCode: "FED_FUNDS_RATE",
    inCurrentFrontend: true,
    sourceName: "FRED",
    sourceType: "api",
    parserFeasibility: "api_ready",
    parserPriority: "medium",
    parserRisk: "low",
    requiresManualReview: false,
    candidateFor148E: false,
    limitations: ["Requires API key."],
    validationNotes: ["Will prioritize local VN indicators first."]
  },
  {
    indicatorCode: "PMI_MANUFACTURING",
    inCurrentFrontend: true,
    sourceName: "S&P Global",
    sourceType: "unknown",
    parserFeasibility: "blocked",
    parserPriority: "blocked",
    parserRisk: "blocked",
    requiresManualReview: true,
    candidateFor148E: false,
    blockedReason: "Proprietary paywall",
    limitations: ["No free API available."],
    validationNotes: ["Cannot automate without violating terms."]
  },
  {
    indicatorCode: "GLOBAL_FLOW",
    inCurrentFrontend: true,
    sourceName: "Unknown",
    sourceType: "unknown",
    parserFeasibility: "not_assessed",
    parserPriority: "blocked",
    parserRisk: "blocked",
    requiresManualReview: true,
    candidateFor148E: false,
    blockedReason: "Source not identified",
    limitations: ["Needs definition of exactly what index constitutes 'Global Flow'."],
    validationNotes: ["Need product clarification."]
  }
];
