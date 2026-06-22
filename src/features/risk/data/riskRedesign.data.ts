import type { MissingDataRiskSummary, RiskRedesignData } from "../types";
import { buildRiskDeskData } from "../lib/build-risk-desk-data";
import type { RiskStatementSnapshot } from "../lib/map-risk-to-logic-input";

const emptySummary: MissingDataRiskSummary = {
  ticker: "UNKNOWN",
  companyName: "Chưa đủ dữ liệu",
  dataMode: "unavailable",
  productionApproved: false,
  overallDataReadiness: "missing",
  sourceWarnings: ["Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định."],
  missingFinancialFields: [],
  unavailableValuationMetrics: [],
  incompleteContextAreas: [],
  conclusionWarnings: ["Chưa đủ cơ sở để hình thành kết luận nếu dữ liệu còn thiếu hoặc nguồn chưa được rà soát."],
  whatToCheckNext: [],
  riskSummaryLabel: "Chưa đủ dữ liệu",
};

export const baseRiskRedesignData: RiskRedesignData = {
  ticker: "UNKNOWN",
  companyName: "Chưa đủ dữ liệu",
  industry: "Bối cảnh ngành cần kiểm tra",
  overall: {
    status: "Chưa đủ dữ liệu",
    score: null,
    tone: "missing",
    conclusion:
      "Phần này tổng hợp dữ liệu còn thiếu, nguồn cần kiểm tra và các điểm dễ kết luận vội. Đây không phải khuyến nghị đầu tư.",
  },
  missingDataSummary: emptySummary,
  topRisks: [],
  missingEvidence: [],
  thesisBreakers: [],
  riskSources: [],
  transparency: [],
  stopConditions: [],
  riskTimeline: {
    shortTerm: [],
    mediumTerm: [],
    longTerm: [],
  },
  reverseRiskNote: "",
  finalConclusion: {
    biggestRisk: "Chưa đủ dữ liệu.",
    missingData: "Chưa đủ dữ liệu.",
    thesisBreaker: "Chưa đủ dữ liệu.",
    readiness: "Chưa đủ dữ liệu.",
    nextStep: "Kiểm tra dữ liệu đầu vào.",
  },
  nextActions: [],
};

export const riskStatementSnapshotsByTicker: Record<string, RiskStatementSnapshot> = {
  FPT: {
    ticker: "FPT",
    companyName: "CTCP FPT",
    companyType: "non_financial",
    industry: "Công nghệ thông tin / Dịch vụ công nghệ",
    periodType: "annual",
    sourceName: null,
    collectedAt: null,
    revenue: null,
    netProfit: null,
    operatingCashFlow: null,
    totalDebt: null,
    totalEquity: null,
    sharesOutstanding: null,
    eps: null,
    closePrice: null,
  },
  MWG: {
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    companyType: "non_financial",
    industry: "Bán lẻ",
    periodType: "annual",
    sourceName: null,
    collectedAt: null,
    revenue: null,
    netProfit: null,
    operatingCashFlow: null,
    totalDebt: null,
    totalEquity: null,
    sharesOutstanding: null,
    eps: null,
    closePrice: null,
  },
  VNM: {
    ticker: "VNM",
    companyName: "CTCP Sữa Việt Nam",
    companyType: "non_financial",
    industry: "Sữa / hàng tiêu dùng thiết yếu",
    periodType: "annual",
    sourceName: null,
    collectedAt: null,
    revenue: null,
    netProfit: null,
    operatingCashFlow: null,
    totalDebt: null,
    totalEquity: null,
    sharesOutstanding: null,
    eps: null,
    closePrice: null,
  },
};

export const riskRedesignDataByTicker: Record<string, RiskRedesignData> = Object.fromEntries(
  Object.entries(riskStatementSnapshotsByTicker).map(([ticker, snapshot]) => [
    ticker,
    buildRiskDeskData(baseRiskRedesignData, snapshot),
  ]),
) as Record<string, RiskRedesignData>;

export const riskDataQuality = {
  source: "Nguồn đang hoàn thiện",
  asOf: null,
  isDemoData: false,
  isStale: false,
  isResearchOnly: true,
  missingFields: [
    "sourceName",
    "asOf",
    "period",
    "EPS",
    "totalDebt",
    "equity",
    "sharesOutstanding",
    "market price",
  ],
};

export const riskRedesignData: RiskRedesignData = riskRedesignDataByTicker.FPT;
