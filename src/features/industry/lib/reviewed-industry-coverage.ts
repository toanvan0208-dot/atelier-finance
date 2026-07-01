export const REVIEWED_INDUSTRY_CODES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const;

export const REVIEWED_MAPPED_TICKERS = ["HPG", "MWG", "VNM"] as const;

export const REVIEWED_UNSUPPORTED_TICKERS = ["FPT", "VCB", "MSN"] as const;

export const REVIEWED_PEER_GROUPS = {
  STEEL_MATERIALS: [
    { ticker: "HSG", peerRole: "direct_peer" },
    { ticker: "NKG", peerRole: "direct_peer" },
    { ticker: "TVN", peerRole: "adjacent_peer" },
  ],
  RETAIL: [],
  CONSUMER_STAPLES_DAIRY: [],
} as const;

export const REVIEWED_INDUSTRY_COVERAGE_LABEL =
  "Reviewed industry coverage is currently limited to STEEL_MATERIALS, RETAIL, and CONSUMER_STAPLES_DAIRY.";

export const UNSUPPORTED_TICKER_POLICY =
  "FPT, VCB, MSN, and all other unsupported tickers must remain missing-safe until a reviewed source package is added; do not infer taxonomy or peers from common knowledge, company descriptions, static UI guidance, or AI reasoning.";

export const isReviewedIndustryCode = (industryCode: string | null | undefined): boolean =>
  typeof industryCode === "string" &&
  REVIEWED_INDUSTRY_CODES.includes(industryCode as (typeof REVIEWED_INDUSTRY_CODES)[number]);

export const isReviewedMappedTicker = (ticker: string | null | undefined): boolean =>
  typeof ticker === "string" &&
  REVIEWED_MAPPED_TICKERS.includes(ticker.trim().toUpperCase() as (typeof REVIEWED_MAPPED_TICKERS)[number]);
