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
    sourceName: "State Bank of Vietnam",
    sourceLabel: "SBV Central Exchange Rate",
    sourceUrl: "https://www.sbv.gov.vn/TyGia/faces/TyGia.jspx",
    sourceOwner: "SBV",
    automationLevel: "html_table_candidate",
    verificationStatus: "not_verified",
    parserEligibleForNextPhase: false, // will be updated to true if reachable
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "VND",
    limitations: ["HTML table scraping is fragile and subject to UI changes without notice."],
    verificationNotes: ["Need to verify if this URL is reachable and returns an HTML body with expected content-type."]
  },
  {
    indicatorCode: "INTERBANK_RATE_OVERNIGHT",
    inCurrentFrontend: true,
    sourceName: "State Bank of Vietnam",
    sourceLabel: "SBV Interbank Market Rate",
    sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lstlnt/lstlnt",
    sourceOwner: "SBV",
    automationLevel: "html_table_candidate",
    verificationStatus: "not_verified",
    parserEligibleForNextPhase: false, // will be updated to true if reachable
    requiresManualReview: true,
    expectedFrequency: "daily",
    expectedUnit: "percent",
    limitations: ["HTML table scraping is fragile and subject to UI changes without notice."],
    verificationNotes: ["Need to verify if this URL is reachable and returns an HTML body with expected content-type."]
  }
];
