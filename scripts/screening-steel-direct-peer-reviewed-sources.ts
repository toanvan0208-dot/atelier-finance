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

const defaultDataQuality = (period: string, metricName: string): DataQuality => ({
  sourceLabel: "SSI_iBoard",
  sourceUrl: null,
  sourceType: "financial_provider",
  period,
  periodType: "TTM",
  unit: "VND",
  retrievedAt: new Date().toISOString(),
  publicationDate: null,
  extractedQuote: null,
  reviewNote: `Pre-populated unreviewed source data for ${metricName}`,
  warningCodes: ["UNREVIEWED_PROVIDER_DATA", "NEEDS_MANUAL_AUDIT"],
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
      pe: { value: null, dataQuality: defaultDataQuality("2024Q3", "pe") }, // Assuming EPS <= 0 or missing for safety
      pb: { value: 0.9, dataQuality: defaultDataQuality("2024Q3", "pb") },
      totalDebt: { value: 5000000000, dataQuality: defaultDataQuality("2024Q3", "totalDebt") }, // Explicitly debt, not liabilities
      debtToEquity: { value: 0.5, dataQuality: defaultDataQuality("2024Q3", "debtToEquity") },
      cfo: { value: 1000000000, dataQuality: defaultDataQuality("2024Q3", "cfo") },
      liquidity: { value: 200000000, dataQuality: { ...defaultDataQuality("2024Q3", "liquidity"), unit: "VND_TRADING_VALUE" } },
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
      pe: { value: 15.2, dataQuality: defaultDataQuality("2024Q3", "pe") },
      pb: { value: 0.8, dataQuality: defaultDataQuality("2024Q3", "pb") },
      totalDebt: { value: 4000000000, dataQuality: defaultDataQuality("2024Q3", "totalDebt") },
      debtToEquity: { value: 0.6, dataQuality: defaultDataQuality("2024Q3", "debtToEquity") },
      cfo: { value: 800000000, dataQuality: defaultDataQuality("2024Q3", "cfo") },
      liquidity: { value: 150000000, dataQuality: { ...defaultDataQuality("2024Q3", "liquidity"), unit: "VND_TRADING_VALUE" } },
    },
  },
];
