export const SUPPORTED_INDUSTRY_PROVENANCE_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN", "VCB"] as const;

export type SupportedIndustryProvenanceTicker =
  (typeof SUPPORTED_INDUSTRY_PROVENANCE_TICKERS)[number];

export type ReviewedIndustryProvenanceSourcePackage = {
  ticker: SupportedIndustryProvenanceTicker;
  industryName: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType:
    | "annual_report"
    | "company_report"
    | "exchange_report"
    | "official_statistics"
    | "reviewed_manual_note";
  dataMode: "research_only";
  publicationDate: string | null;
  retrievedAt: string | null;
  extractedQuote: string | null;
  reviewNote: string | null;
  warningCodes: string[];
  productionApproved: false;
  needsReview: true;
};

/*
 * Phase 150F intentionally keeps this list empty.
 *
 * Repo-reviewed evidence currently has sourceLabel/manual research context only.
 * It does not provide real sourceUrl, publicationDate/retrievedAt, or extractedQuote/reviewNote
 * for any supported ticker. Adding placeholder packages would turn missing provenance into
 * fake reviewed data, so the confirm-write script must fail closed until source packages are
 * manually reviewed and added here.
 */
export const REVIEWED_INDUSTRY_PROVENANCE_SOURCE_PACKAGES: ReviewedIndustryProvenanceSourcePackage[] = [];
