export type IssuerMetadataVerificationStatus =
  | "local_research_seed"
  | "static_sample"
  | "unavailable"
  | "unknown";

export type IssuerMetadataRecord = {
  ticker: string;
  displayName: string | null;
  companyName: string | null;
  issuerName: string | null;
  exchange: string | null;
  industry: string | null;
  sector: string | null;
  sourceLabel: "local_issuer_metadata_seed" | "unavailable";
  dataMode: "research_only" | "unavailable";
  verificationStatus: IssuerMetadataVerificationStatus;
  productionApproved: false;
  asOf: string | null;
  limitations: string[];
  warnings: string[];
};

const LOCAL_SEED_SOURCE_LABEL = "local_issuer_metadata_seed";
const LOCAL_SEED_AS_OF = "2026-06-20";

const localIssuerMetadataSeed: Record<string, Omit<IssuerMetadataRecord, "ticker">> = {
  FPT: {
    displayName: "FPT",
    companyName: "FPT",
    issuerName: "FPT",
    exchange: null,
    industry: null,
    sector: null,
    sourceLabel: LOCAL_SEED_SOURCE_LABEL,
    dataMode: "research_only",
    verificationStatus: "local_research_seed",
    productionApproved: false,
    asOf: LOCAL_SEED_AS_OF,
    limitations: [
      "Local research-only issuer metadata seed; not an official or production-approved company profile.",
      "Industry and sector are intentionally unavailable until there is source evidence in the repo.",
    ],
    warnings: ["Issuer metadata is local seed data and remains productionApproved:false."],
  },
  MWG: {
    displayName: "MWG",
    companyName: "MWG",
    issuerName: "MWG",
    exchange: null,
    industry: null,
    sector: null,
    sourceLabel: LOCAL_SEED_SOURCE_LABEL,
    dataMode: "research_only",
    verificationStatus: "local_research_seed",
    productionApproved: false,
    asOf: LOCAL_SEED_AS_OF,
    limitations: [
      "Local research-only issuer metadata seed; not an official or production-approved company profile.",
      "Industry and sector are intentionally unavailable until there is source evidence in the repo.",
    ],
    warnings: ["Issuer metadata is local seed data and remains productionApproved:false."],
  },
  VCB: {
    displayName: "VCB",
    companyName: "VCB",
    issuerName: "VCB",
    exchange: null,
    industry: null,
    sector: null,
    sourceLabel: LOCAL_SEED_SOURCE_LABEL,
    dataMode: "research_only",
    verificationStatus: "local_research_seed",
    productionApproved: false,
    asOf: LOCAL_SEED_AS_OF,
    limitations: [
      "Local research-only issuer metadata seed; not an official or production-approved company profile.",
      "Industry and sector are intentionally unavailable until there is source evidence in the repo.",
    ],
    warnings: ["Issuer metadata is local seed data and remains productionApproved:false."],
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

