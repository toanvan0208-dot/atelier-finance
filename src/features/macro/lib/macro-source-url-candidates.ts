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
  | "not_verified";

export type MacroSourceUrlCandidate = {
  indicatorCode: "USD_VND" | "INTERBANK_RATE_OVERNIGHT";
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
  }
];
