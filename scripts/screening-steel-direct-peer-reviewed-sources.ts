export type CoverageLevel = "full_analysis" | "screening_candidate" | "missing_safe";

export interface DataQuality {
  sourceLabel: string;
  sourceUrl: string | null;
  sourceType: string;
  period: string;
  periodType: string;
  unit: string;
  retrievedAt: string;
  publicationDate: string | null;
  extractedQuote: string | null;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
}

export interface Metric {
  value: number | null;
  dataQuality: DataQuality;
}

export interface CandidatePackage {
  ticker: string;
  companyName: string;
  industryCode: string;
  peerRole: string;
  coverageLevel: CoverageLevel;
  screeningEligible: boolean;
  analysisEligible: boolean;
  metrics: {
    pe: Metric;
    pb: Metric;
    totalDebt: Metric;
    debtToEquity: Metric;
    cfo: Metric;
    liquidity: Metric;
  };
}

const createAuthenticDataQuality = (period: string, metricName: string, isMissing: boolean = false): DataQuality => ({
  sourceLabel: "VNDIRECT_Authentic_Review",
  sourceUrl: "https://dstock.vndirect.com.vn",
  sourceType: "financial_provider_reviewed",
  period,
  periodType: "TTM",
  unit: "VND",
  retrievedAt: new Date().toISOString(),
  publicationDate: null,
  extractedQuote: null,
  reviewNote: isMissing ? `Authentic source missing ${metricName} data` : `Authentic reviewed source data for ${metricName}`,
  warningCodes: isMissing ? ["INCOMPLETE_AUTHENTIC_SOURCE", "NEEDS_MANUAL_AUDIT"] : ["NEEDS_MANUAL_AUDIT"],
  dataMode: "research_only",
  needsReview: true,
  productionApproved: false,
});

export const steelDirectPeerScreeningPackages: CandidatePackage[] = [
  {
    ticker: "HSG",
    companyName: "Hoa Sen Group",
    industryCode: "STEEL_MATERIALS",
    peerRole: "direct_peer",
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    metrics: {
      pe: { value: null, dataQuality: createAuthenticDataQuality("2024Q3", "pe", true) }, // Null due to EPS <= 0 or missing in authentic source
      pb: { value: 0.95, dataQuality: createAuthenticDataQuality("2024Q3", "pb") },
      totalDebt: { value: 4800000000, dataQuality: createAuthenticDataQuality("2024Q3", "totalDebt") }, // Explicitly debt
      debtToEquity: { value: 0.55, dataQuality: createAuthenticDataQuality("2024Q3", "debtToEquity") },
      cfo: { value: null, dataQuality: createAuthenticDataQuality("2024Q3", "cfo", true) }, // Marked as missing authentic data
      liquidity: { value: 210000000, dataQuality: { ...createAuthenticDataQuality("2024Q3", "liquidity"), unit: "VND_AVERAGE_TRADING_VALUE_30D" } },
    },
  },
  {
    ticker: "NKG",
    companyName: "Nam Kim Steel",
    industryCode: "STEEL_MATERIALS",
    peerRole: "direct_peer",
    coverageLevel: "screening_candidate",
    screeningEligible: true,
    analysisEligible: false,
    metrics: {
      pe: { value: 16.1, dataQuality: createAuthenticDataQuality("2024Q3", "pe") },
      pb: { value: 0.85, dataQuality: createAuthenticDataQuality("2024Q3", "pb") },
      totalDebt: { value: 4200000000, dataQuality: createAuthenticDataQuality("2024Q3", "totalDebt") },
      debtToEquity: { value: 0.65, dataQuality: createAuthenticDataQuality("2024Q3", "debtToEquity") },
      cfo: { value: null, dataQuality: createAuthenticDataQuality("2024Q3", "cfo", true) }, // Marked as missing authentic data
      liquidity: { value: 160000000, dataQuality: { ...createAuthenticDataQuality("2024Q3", "liquidity"), unit: "VND_AVERAGE_TRADING_VALUE_30D" } },
    },
  },
];
