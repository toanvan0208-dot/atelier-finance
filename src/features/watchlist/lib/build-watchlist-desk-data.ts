import {
  assessDataQuality,
  buildBasicValuationSummary,
  calculateCfoToNetProfit,
  calculateDataQualityRisk,
  calculateFinancialHealth,
  calculateNetMargin,
  calculateOverallRiskScore,
  calculatePbRatio,
  calculatePeRatio,
  calculateRevenueGrowth,
  calculateRoe,
  calculateValuationConfidence,
  calculateValuationReadiness,
  type FinancialMetricResult,
  type RiskLevel,
  type ValuationConfidence,
  type ValuationReadinessStatus,
} from "../../../lib/financial-logic";
import type { WatchlistLogicSummary, WatchlistPageData } from "../types";
import { mapWatchlistToLogicInput, type WatchlistStatementSnapshot } from "./map-watchlist-to-logic-input";

const missingValueLabel = "Chưa đủ dữ liệu";
const notApplicableLabel = "Không phù hợp để diễn giải";

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const sanitizeForWatchlist = (text: string): string =>
  text
    .replace(/khuyến nghị giao dịch/gi, "kết luận hành động")
    .replace(/khuyến nghị đầu tư/gi, "kết luận đầu tư")
    .replace(/khuyến nghị/gi, "gợi ý kiểm tra")
    .replace(/nên mua/gi, "cần kiểm tra thêm")
    .replace(/nên bán/gi, "cần kiểm tra thêm")
    .replace(/nắm giữ/gi, "tiếp tục theo dõi giả định")
    .replace(/buy|sell|hold|recommendation/gi, "cần kiểm tra thêm")
    .replace(/cổ phiếu an toàn/gi, "dữ liệu cần kiểm tra thêm")
    .replace(/điểm mua tốt/gi, "mốc cần kiểm tra thêm")
    .replace(/đáng mua/gi, "cần kiểm tra thêm")
    .replace(/chắc chắn rẻ|chắc chắn đắt|chắc chắn xấu/gi, "cần kiểm tra thêm")
    .replace(/gian lận/gi, "bất thường cần kiểm tra");

const sanitizeList = (items: string[]): string[] => unique(items.map(sanitizeForWatchlist));

const metricDisplay = (metric: FinancialMetricResult): string => {
  if (metric.value !== null) return metric.displayValue;
  if (metric.level === "not_applicable") return notApplicableLabel;
  return missingValueLabel;
};

const healthStatusLabel = (status: ReturnType<typeof calculateFinancialHealth>["status"]): string => {
  if (status === "healthy") return "Ổn sơ bộ";
  if (status === "acceptable") return "Tạm đủ để đọc tiếp";
  if (status === "watch") return "Cần kiểm tra thêm";
  if (status === "risk") return "Có điểm cần chú ý";
  return missingValueLabel;
};

const riskStatusLabel = (level: RiskLevel): string => {
  if (level === "critical" || level === "high") return "Rủi ro cao";
  if (level === "medium") return "Cần kiểm tra thêm";
  if (level === "low") return "Chưa thấy cảnh báo lớn từ dữ liệu hiện có";
  return missingValueLabel;
};

const valuationStatusLabel = (status: ValuationReadinessStatus): string => {
  if (status === "ready") return "Có thể đọc sơ bộ";
  if (status === "partial") return "Chỉ đọc được một phần";
  if (status === "not_ready") return missingValueLabel;
  return missingValueLabel;
};

const confidenceLabel = (confidence: ValuationConfidence): string => {
  if (confidence === "high") return "Cao";
  if (confidence === "medium") return "Trung bình";
  if (confidence === "low") return "Thấp";
  if (confidence === "very_low") return "Rất thấp";
  return "Chưa rõ";
};

const buildNextChecks = (params: {
  cfoToNetProfit: FinancialMetricResult;
  valuationReadiness: ReturnType<typeof calculateValuationReadiness>;
  overallRisk: ReturnType<typeof calculateOverallRiskScore>;
  dataQuality: ReturnType<typeof assessDataQuality>;
  missingFields: string[];
}): string[] => {
  const { cfoToNetProfit, valuationReadiness, overallRisk, dataQuality, missingFields } = params;

  return sanitizeList([
    ...(cfoToNetProfit.value === null ? ["Bổ sung CFO để đọc chất lượng lợi nhuận."] : []),
    ...(valuationReadiness.status !== "ready" ? ["Bổ sung dữ liệu định giá trước khi đọc P/E, P/B hoặc vùng giá trị nội tại."] : []),
    ...(overallRisk.level === "unknown" || overallRisk.level === "high" || overallRisk.level === "critical"
      ? ["Mở module Rủi ro để đọc cảnh báo chính và missing fields."]
      : []),
    ...(dataQuality.status !== "good" ? ["Kiểm tra nguồn và thời điểm cập nhật dữ liệu."] : []),
    ...(missingFields.length > 0 ? [`Bổ sung dữ liệu còn thiếu: ${missingFields.slice(0, 4).join(", ")}.`] : []),
  ]).slice(0, 5);
};

const buildSummary = (snapshot: WatchlistStatementSnapshot, companyName: string): WatchlistLogicSummary => {
  const logicInput = mapWatchlistToLogicInput(snapshot);
  const financialHealth = calculateFinancialHealth(logicInput);
  const revenueGrowth = calculateRevenueGrowth(logicInput);
  const netMargin = calculateNetMargin(logicInput);
  const roe = calculateRoe(logicInput);
  const cfoToNetProfit = calculateCfoToNetProfit(logicInput);
  const peRatio = calculatePeRatio(logicInput);
  const pbRatio = calculatePbRatio(logicInput);
  const valuationReadiness = calculateValuationReadiness(logicInput);
  const valuationConfidence = calculateValuationConfidence(logicInput);
  const valuationSummary = buildBasicValuationSummary(logicInput);
  const overallRisk = calculateOverallRiskScore(logicInput);
  const dataQualityRisk = calculateDataQualityRisk(logicInput);
  const dataQuality = assessDataQuality(logicInput);
  const missingFields = unique([
    ...financialHealth.missingFields,
    ...valuationReadiness.missingFields,
    ...overallRisk.missingFields,
    ...dataQuality.missingFields,
  ]);
  const topWarnings = sanitizeList([
    ...dataQuality.warnings,
    ...overallRisk.warnings,
    ...valuationReadiness.warnings,
    ...valuationSummary.warnings,
    ...[revenueGrowth, netMargin, roe, cfoToNetProfit, peRatio, pbRatio].flatMap((metric) =>
      metric.warning ? [metric.warning] : []
    ),
  ]).slice(0, 5);
  const nextChecks = buildNextChecks({ cfoToNetProfit, valuationReadiness, overallRisk, dataQuality, missingFields });

  return {
    ticker: snapshot.ticker ?? "",
    companyName,
    financialHealthStatus: healthStatusLabel(financialHealth.status),
    financialHealthScore: financialHealth.score,
    financialHealthDetail: sanitizeForWatchlist(
      `${financialHealth.beginnerInterpretation} Doanh thu: ${metricDisplay(revenueGrowth)}; biên ròng: ${metricDisplay(netMargin)}; ROE: ${metricDisplay(roe)}; CFO/LNST: ${metricDisplay(cfoToNetProfit)}.`
    ),
    valuationReadiness: valuationStatusLabel(valuationReadiness.status),
    valuationConfidence: confidenceLabel(valuationConfidence),
    valuationDetail: sanitizeForWatchlist(
      `${valuationReadiness.beginnerInterpretation} P/E: ${metricDisplay(peRatio)}; P/B: ${metricDisplay(pbRatio)}. Không tạo fair value hoặc margin of safety khi chưa có dữ liệu hợp lệ.`
    ),
    overallRiskLevel: riskStatusLabel(overallRisk.level),
    overallRiskScore: overallRisk.score,
    overallRiskDetail: sanitizeForWatchlist(
      overallRisk.level === "unknown"
        ? "Chưa đủ dữ liệu để đánh giá đầy đủ rủi ro tổng hợp."
        : `${overallRisk.beginnerInterpretation} ${overallRisk.reasons[0] ?? ""}`
    ),
    dataQualityStatus: dataQuality.status === "good" ? "Đủ để đọc sơ bộ" : `Cần kiểm tra thêm (${riskStatusLabel(dataQualityRisk.level)})`,
    topWarnings,
    missingFields,
    nextChecks: nextChecks.length > 0 ? nextChecks : ["Đọc cùng dòng tiền, nợ vay, định giá và bối cảnh ngành trước khi chuyển bước."],
    notFinancialAdvice: true,
  };
};

export const buildWatchlistDeskData = (
  baseData: WatchlistPageData,
  snapshots: WatchlistStatementSnapshot[]
): WatchlistPageData => {
  const snapshotsByTicker = new Map(snapshots.map((snapshot) => [snapshot.ticker, snapshot]));

  return {
    ...baseData,
    ideas: baseData.ideas.map((idea) => {
      const snapshot = snapshotsByTicker.get(idea.ticker);
      if (!snapshot) return idea;

      return {
        ...idea,
        logicSummary: buildSummary(snapshot, idea.companyName),
      };
    }),
  };
};
