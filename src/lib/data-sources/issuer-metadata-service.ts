export type IssuerMetadataVerificationStatus =
  | "controlled_local_research"
  | "local_research_seed"
  | "static_sample"
  | "unavailable"
  | "unknown";

export type IssuerSharesStatus = "unavailable" | "available";

export type IssuerMetadataRecord = {
  ticker: string;
  displayName: string | null;
  companyName: string | null;
  issuerName: string | null;
  exchange: string | null;
  industry: string | null;
  sector: string | null;
  sourceLabel: "controlled_local_company_metadata" | "local_issuer_metadata_seed" | "unavailable";
  dataMode: "research_only" | "unavailable";
  verificationStatus: IssuerMetadataVerificationStatus;
  productionApproved: false;
  asOf: string | null;
  sharesOutstanding: number | null;
  sharesUnit: "shares" | null;
  sharesStatus: IssuerSharesStatus;
  limitations: string[];
  warnings: string[];
};

const CONTROLLED_COMPANY_METADATA_SOURCE_LABEL = "controlled_local_company_metadata";
const CONTROLLED_COMPANY_METADATA_AS_OF = "2026-06-22";

const controlledLocalLimitations = [
  "Controlled local/research company metadata backbone; no source/legal approval has been recorded.",
  "Shares outstanding is intentionally unavailable because no traceable source is stored in the repo.",
  "Company metadata does not make Valuation fully DB-backed and must not unlock share-based metrics by itself.",
];

const controlledLocalWarnings = [
  "Company metadata remains productionApproved:false.",
  "Missing sharesOutstanding stays null/unavailable and must not be zero-filled.",
];

const localIssuerMetadataSeed: Record<string, Omit<IssuerMetadataRecord, "ticker">> = {
  FPT: {
    displayName: "FPT",
    companyName: "FPT Corporation",
    issuerName: "FPT Corporation",
    exchange: "HOSE",
    industry: "Information technology",
    sector: null,
    sourceLabel: CONTROLLED_COMPANY_METADATA_SOURCE_LABEL,
    dataMode: "research_only",
    verificationStatus: "controlled_local_research",
    productionApproved: false,
    asOf: CONTROLLED_COMPANY_METADATA_AS_OF,
    sharesOutstanding: null,
    sharesUnit: null,
    sharesStatus: "unavailable",
    limitations: controlledLocalLimitations,
    warnings: controlledLocalWarnings,
  },
  MWG: {
    displayName: "MWG",
    companyName: "Mobile World Investment Corporation",
    issuerName: "Mobile World Investment Corporation",
    exchange: "HOSE",
    industry: "Retail",
    sector: null,
    sourceLabel: CONTROLLED_COMPANY_METADATA_SOURCE_LABEL,
    dataMode: "research_only",
    verificationStatus: "controlled_local_research",
    productionApproved: false,
    asOf: CONTROLLED_COMPANY_METADATA_AS_OF,
    sharesOutstanding: null,
    sharesUnit: null,
    sharesStatus: "unavailable",
    limitations: controlledLocalLimitations,
    warnings: controlledLocalWarnings,
  },
  VNM: {
    displayName: "VNM",
    companyName: "Vietnam Dairy Products Joint Stock Company",
    issuerName: "Vietnam Dairy Products Joint Stock Company",
    exchange: "HOSE",
    industry: "Consumer staples",
    sector: null,
    sourceLabel: CONTROLLED_COMPANY_METADATA_SOURCE_LABEL,
    dataMode: "research_only",
    verificationStatus: "controlled_local_research",
    productionApproved: false,
    asOf: CONTROLLED_COMPANY_METADATA_AS_OF,
    sharesOutstanding: null,
    sharesUnit: null,
    sharesStatus: "unavailable",
    limitations: controlledLocalLimitations,
    warnings: controlledLocalWarnings,
  },
};

const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase();

export const unavailableIssuerMetadata = (ticker: string): IssuerMetadataRecord => {
  const normalizedTicker = normalizeTicker(ticker) || "UNKNOWN";

  return {
    ticker: normalizedTicker,
    displayName: null,
    companyName: null,
    issuerName: null,
    exchange: null,
    industry: null,
    sector: null,
    sourceLabel: "unavailable",
    dataMode: "unavailable",
    verificationStatus: "unavailable",
    productionApproved: false,
    asOf: null,
    sharesOutstanding: null,
    sharesUnit: null,
    sharesStatus: "unavailable",
    limitations: [
      "No local issuer metadata seed exists for this ticker.",
      "Sample company, industry, and sector metadata must not be reused for this ticker.",
    ],
    warnings: ["Issuer metadata is unavailable and remains productionApproved:false."],
  };
};

export const getIssuerMetadata = (ticker: string): IssuerMetadataRecord => {
  const normalizedTicker = normalizeTicker(ticker);
  const seed = localIssuerMetadataSeed[normalizedTicker];

  if (!seed) return unavailableIssuerMetadata(normalizedTicker);

  return {
    ticker: normalizedTicker,
    ...seed,
  };
};
