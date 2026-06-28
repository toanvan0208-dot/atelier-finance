export type MacroAlternateSourceCandidate = {
  indicatorCode: "USD_VND" | "INTERBANK_RATE_OVERNIGHT";
  inCurrentFrontend: true;
  sourceName: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceOwner?: string;
  automationLevel:
    | "machine_readable_api"
    | "downloadable_csv_or_excel"
    | "html_table_candidate"
    | "documentation_only"
    | "blocked";
  verificationStatus:
    | "not_checked"
    | "reachable"
    | "unreachable"
    | "manual_review_needed"
    | "blocked";
  parserEligibleForFuturePhase: boolean;
  limitations: string[];
  notes: string[];
};

export const MACRO_ALTERNATE_SOURCE_CANDIDATES: MacroAlternateSourceCandidate[] = [
  {
    indicatorCode: "USD_VND",
    inCurrentFrontend: true,
    sourceName: "Vietcombank Exchange Rate API",
    sourceLabel: "vcb_exchange_rate",
    sourceUrl: "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx",
    sourceOwner: "Vietcombank",
    automationLevel: "machine_readable_api", // It returns XML which is machine readable
    verificationStatus: "not_checked",
    parserEligibleForFuturePhase: true,
    limitations: ["VCB rate might slightly differ from SBV central rate, but is widely used in market."],
    notes: ["XML format is usually stable."]
  },
  {
    indicatorCode: "INTERBANK_RATE_OVERNIGHT",
    inCurrentFrontend: true,
    sourceName: "None",
    sourceLabel: "no_alternate_source",
    sourceUrl: "",
    automationLevel: "blocked",
    verificationStatus: "blocked",
    parserEligibleForFuturePhase: false,
    limitations: ["Interbank rates are predominantly published by SBV. Hard to find reliable, free alternate API."],
    notes: ["Needs manual workflow or paid API provider."]
  }
];
