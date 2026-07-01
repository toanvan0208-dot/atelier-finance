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
export const industrySourcePackages: IndustrySourcePackage[] = [
  {
    industryCode: "STEEL_MATERIALS",
    industryName: "Steel and Materials",
    displayNameVi: "Thép và vật liệu",
    sectorCode: "MATERIALS",
    sectorName: "Nguyên vật liệu",
    classificationSystem: "Vietstock provider taxonomy, normalized internal mapping",
    sourceLabel: "Vietstock - Hồ sơ doanh nghiệp HPG",
    sourceUrl: "https://finance.vietstock.vn/HPG/ho-so-doanh-nghiep.htm",
    sourceType: "provider_taxonomy",
    publicationDate: null,
    retrievedAt: "2026-07-01",
    reviewNote: "Vietstock shows HPG in Nguyên vật liệu / Khai khoáng và luyện kim.",
    extractedQuote: null,
    warningCodes: ["RESEARCH_ONLY"],
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
  },
];

export const companyIndustrySourcePackages: CompanyIndustrySourcePackage[] = [
  {
    ticker: "HPG",
    industryCode: "STEEL_MATERIALS",
    roleType: "primary",
    segmentDescription:
      "HPG được map primary vào nhóm thép/vật liệu dựa trên phân loại Vietstock và mô tả sản phẩm/dịch vụ chính liên quan đến thép.",
    mappingConfidence: "medium",
    sourceLabel: "Vietstock - Hồ sơ doanh nghiệp HPG",
    sourceUrl: "https://finance.vietstock.vn/HPG/ho-so-doanh-nghiep.htm",
    sourceType: "provider_taxonomy",
    publicationDate: null,
    retrievedAt: "2026-07-01",
    reviewNote:
      "The same HPG profile describes key products/services including construction steel, hot rolled coil, coated steel, and steel pipes. Atelier Finance normalizes this mapping into internal industryCode STEEL_MATERIALS with research-only caveats.",
    extractedQuote: null,
    warningCodes: ["RESEARCH_ONLY"],
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
  },
];

export const peerGroupSourcePackages: IndustryPeerGroupSourcePackage[] = [];
