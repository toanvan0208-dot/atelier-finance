export type MacroSourceAutomationLevel =
  | "machine_readable_api"
  | "downloadable_csv_or_excel"
  | "html_table_manual_review"
  | "documentation_only"
  | "unavailable_or_unsuitable"
  | "not_assessed";

export type MacroSourceVerificationStatus =
  | "verified_candidate"
  | "needs_manual_review"
  | "blocked"
  | "not_assessed";

export type MacroSourceVerificationItem = {
  indicatorCode: string;
  inCurrentFrontend: boolean;
  sourceCandidate?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  automationLevel: MacroSourceAutomationLevel;
  verificationStatus: MacroSourceVerificationStatus;
  providerFetchEligible: boolean;
  expectedFrequency?: string;
  expectedUnit?: string;
  limitations: string[];
  notes: string[];
};

export const MACRO_SOURCE_VERIFICATION_REGISTRY: MacroSourceVerificationItem[] = [
  {
    indicatorCode: "GDP_GROWTH",
    inCurrentFrontend: true,
    sourceCandidate: "World Bank API",
    sourceLabel: "world_bank_candidate",
    automationLevel: "machine_readable_api",
    verificationStatus: "verified_candidate",
    providerFetchEligible: true,
    expectedFrequency: "annual",
    expectedUnit: "% YoY",
    limitations: [],
    notes: ["Verified in 147A/C"],
  },
  {
    indicatorCode: "CPI_YOY",
    inCurrentFrontend: true,
    sourceCandidate: "World Bank API",
    sourceLabel: "world_bank_candidate",
    automationLevel: "machine_readable_api",
    verificationStatus: "verified_candidate",
    providerFetchEligible: true,
    expectedFrequency: "annual",
    expectedUnit: "% YoY",
    limitations: ["World Bank usually lags, might need GSO monthly later."],
    notes: ["Verified in 147A/C"],
  },
  {
    indicatorCode: "PMI_MANUFACTURING",
    inCurrentFrontend: true,
    automationLevel: "documentation_only",
    verificationStatus: "blocked",
    providerFetchEligible: false,
    limitations: ["S&P Global PMI is proprietary, no free API available."],
    notes: ["Likely requires manual entry or paid data vendor."],
  },
  {
    indicatorCode: "EXPORT_GROWTH",
    inCurrentFrontend: true,
    sourceCandidate: "GSO",
    automationLevel: "not_assessed",
    verificationStatus: "not_assessed",
    providerFetchEligible: false,
    limitations: ["No concrete official URL is documented in the repo."],
    notes: ["Phase 149B keeps this blocked with sourceUrlStatus=missing_source_url until an official GSO/structured source is selected."],
  },
  {
    indicatorCode: "PUBLIC_INVESTMENT",
    inCurrentFrontend: true,
    sourceCandidate: "GSO",
    automationLevel: "not_assessed",
    verificationStatus: "not_assessed",
    providerFetchEligible: false,
    limitations: ["No concrete official URL is documented in the repo.", "Semantic scope must be confirmed before parsing."],
    notes: ["Phase 149B keeps this blocked until the source confirms realized public investment capital from the state budget or another approved definition."],
  },
  {
    indicatorCode: "BRENT_OIL_PRICE",
    inCurrentFrontend: true,
    sourceCandidate: "FRED / Market Provider",
    automationLevel: "machine_readable_api",
    verificationStatus: "needs_manual_review",
    providerFetchEligible: false,
    limitations: ["Needs API key for FRED or a stable market endpoint."],
    notes: ["Parser not implemented yet."],
  },
  {
    indicatorCode: "INTERBANK_RATE_OVERNIGHT",
    inCurrentFrontend: true,
    sourceCandidate: "State Bank of Vietnam",
    sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lstlnt/lstlnt",
    automationLevel: "html_table_manual_review",
    verificationStatus: "blocked",
    providerFetchEligible: false,
    limitations: ["SBV HTML structure unstable. Blocked until hardened."],
    notes: ["Source URL reachable, but pure HTML parsing fails."]
  },
  {
    indicatorCode: "CREDIT_GROWTH",
    inCurrentFrontend: true,
    sourceCandidate: "SBV",
    automationLevel: "not_assessed",
    verificationStatus: "not_assessed",
    providerFetchEligible: false,
    limitations: ["No concrete SBV URL is documented in the repo.", "Requires exact semantic definition before parsing."],
    notes: ["Do not substitute M2 growth or lending rates. Phase 149B marks parser readiness as blocked."],
  },
  {
    indicatorCode: "USD_VND",
    inCurrentFrontend: true,
    sourceCandidate: "Vietcombank Exchange Rate API",
    sourceUrl: "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx",
    automationLevel: "machine_readable_api",
    verificationStatus: "verified_candidate",
    providerFetchEligible: true,
    limitations: ["VCB rate used as an alternate since SBV HTML is unstable."],
    notes: ["Source URL is reachable XML API."]
  },
  {
    indicatorCode: "DXY",
    inCurrentFrontend: true,
    sourceCandidate: "Market Provider",
    automationLevel: "machine_readable_api",
    verificationStatus: "needs_manual_review",
    providerFetchEligible: false,
    limitations: ["Needs stable market API (e.g. Yahoo Finance, FMP)."],
    notes: ["Parser not implemented yet."],
  },
  {
    indicatorCode: "FED_FUNDS_RATE",
    inCurrentFrontend: true,
    sourceCandidate: "FRED",
    automationLevel: "machine_readable_api",
    verificationStatus: "needs_manual_review",
    providerFetchEligible: false,
    limitations: ["FRED API requires an API key."],
    notes: ["Parser not implemented yet."],
  },
  {
    indicatorCode: "GLOBAL_FLOW",
    inCurrentFrontend: true,
    automationLevel: "not_assessed",
    verificationStatus: "not_assessed",
    providerFetchEligible: false,
    limitations: ["Difficult to find a unified, free global flow source."],
    notes: ["Needs more research."],
  },
  {
    indicatorCode: "MARKET_TRADING_VALUE",
    inCurrentFrontend: true,
    sourceCandidate: "Market Provider (Vnstock)",
    automationLevel: "machine_readable_api",
    verificationStatus: "needs_manual_review",
    providerFetchEligible: false,
    limitations: ["Depends on market data provider infrastructure."],
    notes: ["Can reuse existing MarketPrice pipeline later."],
  },
  {
    indicatorCode: "FOREIGN_NET_FLOW",
    inCurrentFrontend: true,
    sourceCandidate: "Market Provider (Vnstock)",
    automationLevel: "machine_readable_api",
    verificationStatus: "needs_manual_review",
    providerFetchEligible: false,
    limitations: ["Depends on market data provider infrastructure."],
    notes: ["Can reuse existing MarketPrice pipeline later."],
  }
];
