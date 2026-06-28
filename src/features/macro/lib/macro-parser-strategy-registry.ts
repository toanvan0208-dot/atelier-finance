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
    sourceName: "SBV Central Exchange Rate",
    sourceType: "html_table",
    parserFeasibility: "html_parser_feasible",
    parserPriority: "high",
    parserRisk: "medium",
    requiresManualReview: false,
    candidateFor148E: true,
    limitations: ["HTML structure may change without notice."],
    validationNotes: ["Look for specific table ID/class on SBV site."]
  },
  {
    indicatorCode: "INTERBANK_RATE_OVERNIGHT",
    inCurrentFrontend: true,
    sourceName: "SBV Interbank Market",
    sourceType: "html_table",
    parserFeasibility: "html_parser_feasible",
    parserPriority: "high",
    parserRisk: "medium",
    requiresManualReview: false,
    candidateFor148E: true,
    limitations: ["HTML structure may change without notice."],
    validationNotes: ["Target overnight rate row in the interbank table."]
  },
  {
    indicatorCode: "CREDIT_GROWTH",
    inCurrentFrontend: true,
    sourceName: "SBV Press Releases",
    sourceType: "pdf",
    parserFeasibility: "manual_review_only",
    parserPriority: "low",
    parserRisk: "high",
    requiresManualReview: true,
    candidateFor148E: false,
    limitations: ["Data is often buried in unstructured text or PDF reports."],
    validationNotes: ["Manual extraction is safest until AI OCR pipeline is proven."]
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
    sourceType: "csv_excel",
    parserFeasibility: "csv_excel_ready",
    parserPriority: "medium",
    parserRisk: "medium",
    requiresManualReview: true,
    candidateFor148E: false,
    limitations: ["Excel structure changes annually.", "Sometimes published only as PDF."],
    validationNotes: ["May require a semi-automated pipeline where user uploads Excel."]
  },
  {
    indicatorCode: "EXPORT_GROWTH",
    inCurrentFrontend: true,
    sourceName: "GSO Trade Statistics",
    sourceType: "csv_excel",
    parserFeasibility: "csv_excel_ready",
    parserPriority: "medium",
    parserRisk: "medium",
    requiresManualReview: true,
    candidateFor148E: false,
    limitations: ["GSO trade data Excel format changes over time."],
    validationNotes: ["Needs robust tabular extraction or manual verification."]
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
