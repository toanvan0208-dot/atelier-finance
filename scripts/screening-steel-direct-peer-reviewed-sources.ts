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
      cfo: {
        value: 3659840645961,
        dataQuality: {
          sourceLabel: "HSG - Báo cáo tài chính hợp nhất Quý IV niên độ 2024-2025",
          sourceUrl: null,
          sourceType: "user_uploaded_consolidated_financial_statement",
          period: "2025",
          periodType: "fiscal_year",
          unit: "vnd",
          retrievedAt: "2026-07-02",
          publicationDate: null,
          extractedQuote: "20 Lưu chuyển tiền thuần từ hoạt động kinh doanh ... 3.659.840.645.961",
          reviewNote: "CFO lấy từ báo cáo lưu chuyển tiền tệ hợp nhất, dòng \"Lưu chuyển tiền thuần từ hoạt động kinh doanh\" (Mã số 20). Số liệu là lũy kế cho cả niên độ từ 01/10/2024 đến 30/09/2025, không phải riêng quý IV. Không sử dụng số liệu từ báo cáo riêng công ty mẹ để đảm bảo tính đồng bộ và nhất quán với NKG.",
          warningCodes: ["USER_UPLOADED_SOURCE", "NEEDS_REVIEW", "CONSOLIDATED_CASH_FLOW", "FISCAL_YEAR_2025", "FISCAL_YEAR_END_2025_09_30"],
          dataMode: "research_only",
          needsReview: true,
          productionApproved: false,
        },
      },
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
      cfo: {
        value: 1326940472262,
        dataQuality: {
          sourceLabel: "20260413 - NKG - Bao cao thuong nien 2025-w.pdf",
          sourceUrl: null,
          sourceType: "user_uploaded_annual_report",
          period: "2025",
          periodType: "annual",
          unit: "vnd",
          retrievedAt: "2026-07-02",
          publicationDate: null,
          extractedQuote: "Lưu chuyển tiền thuần từ hoạt động kinh doanh ... 1.326.940.472.262",
          reviewNote: "CFO lấy từ báo cáo lưu chuyển tiền tệ hợp nhất. Số liệu cũng được đối chiếu với phần phân tích tài chính tại trang 97, nơi ghi dòng tiền từ hoạt động kinh doanh quay về mức dương 1.326 tỷ đồng.",
          warningCodes: ["USER_UPLOADED_SOURCE", "NEEDS_REVIEW", "CONSOLIDATED_CASH_FLOW", "FISCAL_YEAR_2025"],
          dataMode: "research_only",
          needsReview: true,
          productionApproved: false,
        },
      },
      liquidity: { value: 160000000, dataQuality: { ...createAuthenticDataQuality("2024Q3", "liquidity"), unit: "VND_AVERAGE_TRADING_VALUE_30D" } },
    },
  },
];
