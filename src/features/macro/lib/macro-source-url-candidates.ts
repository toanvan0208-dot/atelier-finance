export type MacroSourceUrlAutomationLevel =
  | "machine_readable_api"
  | "downloadable_csv_or_excel"
  | "html_table_candidate"
  | "documentation_only"
  | "blocked";

export type MacroSourceUrlVerificationStatus =
  | "url_verified"
  | "url_reachable_but_parser_needed"
  | "manual_review_needed"
  | "blocked"
  | "not_verified"
  | "missing_source_url";

export type MacroSourceUrlCandidate = {
  indicatorCode: "USD_VND" | "INTERBANK_RATE_OVERNIGHT" | "POLICY_RATE" | "MARKET_TRADING_VALUE" | "FOREIGN_NET_FLOW" | "FED_FUNDS_RATE" | "DXY" | "BRENT_OIL_PRICE";
  inCurrentFrontend: true;
  sourceName: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceOwner?: string;
  automationLevel: MacroSourceUrlAutomationLevel;
  verificationStatus: MacroSourceUrlVerificationStatus;
  parserEligibleForNextPhase: boolean;
  requiresManualReview: boolean;
  expectedFrequency?: string;
  expectedUnit?: string;
  limitations: string[];
  verificationNotes: string[];
};

export const MACRO_SOURCE_URL_CANDIDATES: MacroSourceUrlCandidate[] = [
  {
    indicatorCode: "USD_VND",
    inCurrentFrontend: true,
    sourceName: "Vietcombank Exchange Rate API",
    sourceLabel: "VCB Exchange Rate API",
    sourceUrl: "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx",
    sourceOwner: "VCB",
    automationLevel: "machine_readable_api",
    verificationStatus: "url_reachable_but_parser_needed",
    parserEligibleForNextPhase: true,
    requiresManualReview: false,
    expectedFrequency: "daily",
    expectedUnit: "VND",
    limitations: ["VCB rate used as fallback since SBV HTML is unstable."],
    verificationNotes: ["Reachable XML endpoint. Alternate source identified in 148H."]
  },
  {
    indicatorCode: "INTERBANK_RATE_OVERNIGHT",
    inCurrentFrontend: true,
    sourceName: "State Bank of Vietnam",
    sourceLabel: "SBV Interbank Market Rate",
    sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lstlnt/lstlnt",
    sourceOwner: "SBV",
    automationLevel: "blocked",
    verificationStatus: "blocked",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "percent",
    limitations: ["SBV HTML is highly unstable and JS-rendered. Blocked parser."],
    verificationNotes: ["Blocked in 148H after structure inspection. Needs manual workflow."]
  },
  {
    indicatorCode: "POLICY_RATE",
    inCurrentFrontend: true,
    sourceName: "State Bank of Vietnam",
    sourceLabel: "SBV Policy Rate",
    sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lsdh",
    sourceOwner: "SBV",
    automationLevel: "blocked",
    verificationStatus: "blocked",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "event_based",
    expectedUnit: "percent",
    limitations: ["SBV Liferay portal is highly unstable and JS-rendered. Automated scraping blocked."],
    verificationNotes: ["Verified in 148K. HTTP 200 but HTML shape is dynamic_or_unstable. Requires manual workflow."]
  },
  {
    indicatorCode: "MARKET_TRADING_VALUE",
    inCurrentFrontend: true,
    sourceName: "Undocumented Provider",
    sourceLabel: "Vnstock / Undocumented Provider API",
    sourceUrl: "",
    sourceOwner: "Unknown",
    automationLevel: "machine_readable_api",
    verificationStatus: "missing_source_url",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "Billion VND",
    limitations: ["No clear source URL or documented API endpoint identified yet.", "Provider type is undocumented_provider.", "Requires parser implementation if API is found."],
    verificationNotes: ["Blocked from parser dry-run due to missing source URL."]
  },
  {
    indicatorCode: "FOREIGN_NET_FLOW",
    inCurrentFrontend: true,
    sourceName: "Undocumented Provider",
    sourceLabel: "Vnstock / Undocumented Provider API",
    sourceUrl: "",
    sourceOwner: "Unknown",
    automationLevel: "machine_readable_api",
    verificationStatus: "missing_source_url",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "Billion VND",
    limitations: ["No clear source URL or documented API endpoint identified yet.", "Provider type is undocumented_provider.", "Requires parser implementation if API is found."],
    verificationNotes: ["Blocked from parser dry-run due to missing source URL."]
  },
  {
    indicatorCode: "FED_FUNDS_RATE",
    inCurrentFrontend: true,
    sourceName: "Federal Reserve Economic Data (FRED)",
    sourceLabel: "FRED API / CSV",
    sourceUrl: "https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS",
    sourceOwner: "St. Louis Fed",
    automationLevel: "blocked",
    verificationStatus: "blocked",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "event_based",
    expectedUnit: "percent",
    limitations: ["FRED API requires an authentication key (auth_required). Blocked from automated parser dry-run."],
    verificationNotes: ["Source assessed in 148O. API key missing in environment."]
  },
  {
    indicatorCode: "DXY",
    inCurrentFrontend: true,
    sourceName: "Federal Reserve Economic Data (FRED)",
    sourceLabel: "FRED API (DTWEXBGS Proxy)",
    sourceUrl: "https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS",
    sourceOwner: "St. Louis Fed",
    automationLevel: "blocked",
    verificationStatus: "blocked",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "Points",
    limitations: ["FRED API requires an authentication key (auth_required). DTWEXBGS is a semantic proxy for ICE DXY.", "Blocked from automated parser dry-run."],
    verificationNotes: ["Source assessed in 148O. Semantic proxy risk: DTWEXBGS is broad dollar index, not official ICE DXY."]
  },
  {
    indicatorCode: "BRENT_OIL_PRICE",
    inCurrentFrontend: true,
    sourceName: "Federal Reserve Economic Data (FRED)",
    sourceLabel: "FRED API (DCOILBRENTEU)",
    sourceUrl: "https://api.stlouisfed.org/fred/series/observations?series_id=DCOILBRENTEU",
    sourceOwner: "St. Louis Fed",
    automationLevel: "blocked",
    verificationStatus: "blocked",
    parserEligibleForNextPhase: false,
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "USD/Barrel",
    limitations: ["FRED API requires an authentication key (auth_required). Blocked from automated parser dry-run."],
    verificationNotes: ["Source assessed in 148O. API key missing in environment."]
  }
];
