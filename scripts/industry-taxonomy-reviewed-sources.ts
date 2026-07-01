export const SUPPORTED_INDUSTRY_TAXONOMY_TICKERS = [
  "HPG",
  "FPT",
  "MWG",
  "VNM",
  "MSN",
  "VCB",
] as const;

export type SupportedIndustryTaxonomyTicker = (typeof SUPPORTED_INDUSTRY_TAXONOMY_TICKERS)[number];

type ResearchOnlyPackagePolicy = {
  dataMode: "research_only";
  productionApproved: false;
  needsReview: true;
};

export type IndustrySourcePackage = ResearchOnlyPackagePolicy & {
  industryCode: string;
  industryName: string;
  displayNameVi: string;
  sectorCode: string;
  sectorName: string;
  classificationSystem: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType:
    | "exchange_classification"
    | "regulator_classification"
    | "provider_taxonomy"
    | "industry_association"
    | "official_statistics"
    | "reviewed_manual_note";
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  warningCodes: string[];
};

export type CompanyIndustrySourcePackage = ResearchOnlyPackagePolicy & {
  ticker: SupportedIndustryTaxonomyTicker;
  industryCode: string;
  roleType: "primary" | "secondary" | "ambiguous";
  segmentDescription: string;
  mappingConfidence: "low" | "medium" | "high" | "missing";
  sourceLabel: string;
  sourceUrl: string;
  sourceType:
    | "exchange_classification"
    | "regulator_classification"
    | "provider_taxonomy"
    | "industry_association"
    | "reviewed_manual_note";
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  warningCodes: string[];
};

export type IndustryPeerGroupSourcePackage = ResearchOnlyPackagePolicy & {
  industryCode: string;
  peerTicker: string;
  peerRole: "direct_peer" | "adjacent_peer" | "watch_only" | "ambiguous";
  inclusionReason: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType:
    | "exchange_classification"
    | "regulator_classification"
    | "provider_taxonomy"
    | "industry_association"
    | "reviewed_manual_note";
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  warningCodes: string[];
};

/*
 * Phase 150J intentionally starts with empty arrays.
 *
 * Reviewed taxonomy packages must be added only after source URL, date, and evidence notes
 * are available. Static UI guidance and company annual reports are not primary taxonomy
 * sources for this phase, and placeholder rows must remain absent.
 */
export const industrySourcePackages: IndustrySourcePackage[] = [];

export const companyIndustrySourcePackages: CompanyIndustrySourcePackage[] = [];

export const peerGroupSourcePackages: IndustryPeerGroupSourcePackage[] = [];
