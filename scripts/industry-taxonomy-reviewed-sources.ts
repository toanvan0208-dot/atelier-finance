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

export const peerGroupSourcePackages: IndustryPeerGroupSourcePackage[] = [
  {
    industryCode: "STEEL_MATERIALS",
    peerTicker: "HSG",
    peerRole: "direct_peer",
    inclusionReason:
      "HSG is included as a reviewed steel/materials peer candidate for HPG based on Vietstock provider taxonomy and reviewed profile evidence.",
    sourceLabel: "Vietstock - Ho so doanh nghiep HSG",
    sourceUrl: "https://finance.vietstock.vn/HSG/ho-so-doanh-nghiep.htm",
    sourceType: "provider_taxonomy",
    publicationDate: null,
    retrievedAt: "2026-07-01",
    reviewNote:
      "Vietstock profile for HSG is readable and shows VS-Sector under Nguyen vat lieu / Khai khoang va luyen kim. The profile also describes HSG's core exposure to coated steel/flat steel and steel-related construction materials. This is a reviewed taxonomy/peer grouping candidate, not a valuation or risk benchmark.",
    extractedQuote: null,
    warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW", "PROVIDER_TAXONOMY", "PEER_GROUP_NEEDS_REVIEW"],
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "STEEL_MATERIALS",
    peerTicker: "NKG",
    peerRole: "direct_peer",
    inclusionReason:
      "NKG is included as a reviewed steel/materials peer candidate for HPG based on Vietstock provider taxonomy and reviewed profile evidence.",
    sourceLabel: "Vietstock - Ho so doanh nghiep NKG",
    sourceUrl: "https://finance.vietstock.vn/NKG/ho-so-doanh-nghiep.htm",
    sourceType: "provider_taxonomy",
    publicationDate: null,
    retrievedAt: "2026-07-01",
    reviewNote:
      "Vietstock profile for NKG is readable and shows VS-Sector under Nguyen vat lieu / Khai khoang va luyen kim. The product/service section describes steel sheet, coated steel, steel pipes, steel boxes, steel shapes, and products from steel coil. This is a reviewed taxonomy/peer grouping candidate, not a valuation or risk benchmark.",
    extractedQuote: null,
    warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW", "PROVIDER_TAXONOMY", "PEER_GROUP_NEEDS_REVIEW"],
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "STEEL_MATERIALS",
    peerTicker: "TVN",
    peerRole: "adjacent_peer",
    inclusionReason:
      "TVN is included as an adjacent steel/materials peer candidate for HPG because the reviewed Vietstock profile evidence is steel-sector relevant but not treated as a direct comparable benchmark.",
    sourceLabel: "Vietstock - Ho so doanh nghiep TVN",
    sourceUrl: "https://finance.vietstock.vn/TVN/ho-so-doanh-nghiep.htm",
    sourceType: "provider_taxonomy",
    publicationDate: null,
    retrievedAt: "2026-07-01",
    reviewNote:
      "Vietstock profile for TVN is readable and shows VS-Sector under Nguyen vat lieu / Khai khoang va luyen kim. The profile describes TVN as operating mainly in the steel industry, developing long steel and flat steel products, and producing steel and steel-after-rolling products. This is an adjacent taxonomy/peer grouping candidate, not a valuation or risk benchmark.",
    extractedQuote: null,
    warningCodes: ["RESEARCH_ONLY", "NEEDS_REVIEW", "PROVIDER_TAXONOMY", "PEER_GROUP_NEEDS_REVIEW"],
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
  },
];
