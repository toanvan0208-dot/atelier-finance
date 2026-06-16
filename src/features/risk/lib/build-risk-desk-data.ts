import {
  assessDataQuality,
  calculateCashFlowRisk,
  calculateDataQualityRisk,
  calculateDebtRisk,
  calculateEarningsQualityRisk,
  calculateFinancialHealth,
  calculateLiquidityRisk,
  calculateOverallRiskScore,
  calculateValuationRisk,
  type RiskLevel,
  type RiskScoreResult,
} from "../../../lib/financial-logic";
import type {
  CriticalRisk,
  RiskRedesignData,
  RiskRedesignStatus,
  RiskRedesignTone,
  RiskSource,
} from "../types";
import { mapRiskToLogicInput, type RiskStatementSnapshot } from "./map-risk-to-logic-input";

type RiskSourceConfig = {
  id: string;
  title: string;
  sourceModules: string[];
  action: RiskSource["action"];
  relatedMetrics: string[];
  nextChecks: string[];
};

const sourceConfigs: Record<string, RiskSourceConfig> = {
  debtRisk: {
    id: "debt-risk",
    title: "Nợ vay & đòn bẩy",
    sourceModules: ["Báo cáo tài chính"],
    action: { label: "Quay lại BCTC kiểm tra nợ vay", moduleKey: "financials" },
    relatedMetrics: ["Nợ vay / vốn chủ", "Nợ phải trả / tài sản", "Khả năng trả lãi", "Tiền mặt / nợ vay"],
    nextChecks: ["Kiểm tra lịch đáo hạn nợ.", "Đọc khả năng trả lãi cùng CFO.", "So nợ vay với đặc thù ngành."],
  },
  earningsQualityRisk: {
    id: "earnings-quality-risk",
    title: "Chất lượng lợi nhuận",
    sourceModules: ["Báo cáo tài chính"],
    action: { label: "Quay lại BCTC kiểm tra CFO", moduleKey: "financials" },
    relatedMetrics: ["LNST", "CFO / LNST", "Tăng trưởng doanh thu", "Biên lợi nhuận ròng"],
    nextChecks: ["Kiểm tra CFO nhiều kỳ.", "Đọc khoản phải thu và tồn kho.", "Tách lợi nhuận bất thường nếu có."],
  },
  cashFlowRisk: {
    id: "cash-flow-risk",
    title: "Dòng tiền",
    sourceModules: ["Báo cáo tài chính"],
    action: { label: "Quay lại BCTC đọc lưu chuyển tiền tệ", moduleKey: "financials" },
    relatedMetrics: ["FCF", "Biên FCF", "Biên CFO"],
    nextChecks: ["Kiểm tra quy ước dấu capex.", "So CFO với doanh thu.", "Đọc FCF theo chu kỳ đầu tư."],
  },
  valuationRisk: {
    id: "valuation-risk",
    title: "Định giá & dữ liệu định giá",
    sourceModules: ["Định giá"],
    action: { label: "Quay lại Định giá", moduleKey: "valuation" },
    relatedMetrics: ["P/E", "P/B", "P/S", "Valuation readiness"],
    nextChecks: ["Kiểm tra EPS có dương và bền không.", "Kiểm tra BVPS/vốn chủ.", "Đọc định giá cùng dòng tiền."],
  },
  liquidityRisk: {
    id: "liquidity-risk",
    title: "Thanh khoản giao dịch",
    sourceModules: ["PVT"],
    action: { label: "Quay lại PVT", moduleKey: "technical" },
    relatedMetrics: ["Giá trị giao dịch", "Thanh khoản 20 phiên", "Biến động giá"],
    nextChecks: ["Kiểm tra thanh khoản 20 phiên.", "So quy mô giả lập với thanh khoản.", "Không kết luận chất lượng doanh nghiệp từ thanh khoản."],
  },
  dataQualityRisk: {
    id: "data-quality-risk",
    title: "Chất lượng dữ liệu",
    sourceModules: ["Báo cáo tài chính", "Định giá", "PVT"],
    action: { label: "Quay lại BCTC bổ sung dữ liệu", moduleKey: "financials" },
    relatedMetrics: ["Nguồn dữ liệu", "Thời điểm cập nhật", "Trường dữ liệu cốt lõi"],
    nextChecks: ["Bổ sung nguồn dữ liệu.", "Kiểm tra thời điểm cập nhật.", "Không kết luận chắc chắn khi dữ liệu thiếu."],
  },
};

const levelWeight: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 2.5,
};

const levelToTone = (level: RiskLevel): RiskRedesignTone => {
  if (level === "critical" || level === "high") return "high";
  if (level === "medium") return "caution";
  if (level === "unknown") return "missing";
  return "low";
};

const levelToStatus = (level: RiskLevel): RiskRedesignStatus => {
  if (level === "critical" || level === "high") return "Rủi ro cao";
  if (level === "medium") return "Cần kiểm tra thêm";
  if (level === "unknown") return "Thiếu dữ liệu";
  return "Ổn sơ bộ";
};

const priorityLabel = (level: RiskLevel): CriticalRisk["priority"] => {
  if (level === "critical" || level === "high" || level === "unknown") return "Cao";
  if (level === "medium") return "Trung bình cao";
  return "Trung bình";
};

const scoreLabel = (score: number | null): string => (score === null ? "Chưa đủ dữ liệu" : `${score}/100`);

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const mainRiskText = (risk: RiskScoreResult): string =>
  risk.reasons[0] ?? risk.warnings[0] ?? risk.beginnerInterpretation;

const sourceFromRisk = (risk: RiskScoreResult): RiskSource => {
  const config = sourceConfigs[risk.key];
  const missingData = risk.missingFields.length > 0 ? risk.missingFields : ["Không có trường thiếu trọng yếu từ dữ liệu hiện tại."];
  const evidence = unique([
    `Điểm: ${scoreLabel(risk.score)}`,
    ...risk.reasons,
    risk.beginnerInterpretation,
  ]);

  return {
    id: config.id,
    title: config.title,
    status: levelToStatus(risk.level),
    tone: levelToTone(risk.level),
    mainRisk: mainRiskText(risk),
    evidence,
    warnings: risk.warnings,
    missingData,
    relatedMetrics: config.relatedMetrics,
    nextChecks: config.nextChecks,
    sourceModules: config.sourceModules,
    action: config.action,
    defaultOpen: risk.level !== "low",
  };
};

const criticalRiskFromRisk = (risk: RiskScoreResult): CriticalRisk => {
  const config = sourceConfigs[risk.key];
  return {
    id: config.id,
    title: config.title,
    whyItMatters: mainRiskText(risk),
    priority: priorityLabel(risk.level),
    affectedModules: config.sourceModules,
    targetModule: config.action.moduleKey,
    earlyWarnings: unique([
      ...risk.warnings,
      ...risk.reasons,
      ...risk.missingFields.map((field) => `Thiếu dữ liệu: ${field}.`),
      ...config.nextChecks,
    ]).slice(0, 5),
  };
};

export const buildRiskDeskData = (
  baseData: RiskRedesignData,
  snapshot: RiskStatementSnapshot
): RiskRedesignData => {
  const logicInput = mapRiskToLogicInput(snapshot);
  const componentRisks = [
    calculateDebtRisk(logicInput),
    calculateEarningsQualityRisk(logicInput),
    calculateCashFlowRisk(logicInput),
    calculateValuationRisk(logicInput),
    calculateLiquidityRisk(logicInput),
    calculateDataQualityRisk(logicInput),
  ];
  const overallRisk = calculateOverallRiskScore(logicInput);
  const financialHealth = calculateFinancialHealth(logicInput);
  const dataQuality = assessDataQuality(logicInput);
  const rankedRisks = [...componentRisks].sort((a, b) => {
    const scoreDiff = (b.score ?? 50) - (a.score ?? 50);
    return scoreDiff !== 0 ? scoreDiff : levelWeight[b.level] - levelWeight[a.level];
  });
  const topRisks = rankedRisks.slice(0, 3).map(criticalRiskFromRisk);
  const missingEvidence = unique([
    ...overallRisk.missingFields,
    ...dataQuality.missingFields,
    ...componentRisks.flatMap((risk) => risk.missingFields),
  ]);
  const dataQualityWarning = dataQuality.warnings[0] ?? "Dữ liệu có nguồn và thời điểm cập nhật để đọc sơ bộ.";

  return {
    ...baseData,
    ticker: snapshot.ticker ?? baseData.ticker,
    industry: snapshot.industry ?? baseData.industry,
    overall: {
      status: levelToStatus(overallRisk.level),
      score: overallRisk.score,
      tone: levelToTone(overallRisk.level),
      conclusion:
        overallRisk.level === "unknown"
          ? `Chưa đủ dữ liệu để kết luận rủi ro tổng hợp. ${dataQualityWarning}`
          : `${overallRisk.beginnerInterpretation} ${mainRiskText(overallRisk)} Đây là cảnh báo phân tích, không phải kết luận hành động.`,
    },
    topRisks,
    missingEvidence: missingEvidence.length > 0 ? missingEvidence : ["Không có trường thiếu trọng yếu từ dữ liệu hiện tại."],
    thesisBreakers: topRisks.map((risk) => ({
      id: `breaker-${risk.id}`,
      label: risk.title,
      targetModule: risk.targetModule,
      statement: `${risk.whyItMatters} Không nên kết luận chỉ từ một chỉ số; cần đọc cùng dòng tiền, nợ vay, định giá và bối cảnh ngành.`,
    })),
    riskSources: componentRisks.map(sourceFromRisk),
    transparency: [
      {
        id: "data-source-quality",
        title: "Nguồn và thời điểm dữ liệu",
        status: dataQuality.status === "good" ? "Ổn sơ bộ" : "Cần kiểm tra thêm",
        tone: dataQuality.status === "good" ? "low" : "missing",
        whyItMatters: dataQualityWarning,
        dataToCheck: ["sourceName", "collectedAt", ...dataQuality.missingFields.slice(0, 4)],
      },
      ...baseData.transparency,
    ],
    stopConditions: unique([
      ...componentRisks
        .filter((risk) => risk.level === "high" || risk.level === "critical" || risk.level === "unknown")
        .map((risk) => `${risk.label}: ${mainRiskText(risk)}`),
      ...baseData.stopConditions,
    ]).slice(0, 7),
    reverseRiskNote:
      "Risk score chỉ cho biết các điểm cần kiểm tra theo dữ liệu hiện có. Điểm thấp không có nghĩa là hết rủi ro; điểm cao không thay thế phân tích nguyên nhân.",
    finalConclusion: {
      biggestRisk: topRisks[0]?.whyItMatters ?? "Chưa đủ dữ liệu để xác định rủi ro lớn nhất.",
      missingData: missingEvidence.length > 0 ? `Cần bổ sung: ${missingEvidence.slice(0, 6).join(", ")}.` : "Chưa ghi nhận trường thiếu trọng yếu.",
      thesisBreaker:
        topRisks[0] ? `${topRisks[0].title}: ${topRisks[0].whyItMatters}` : "Chưa đủ dữ liệu để tạo phản biện chính.",
      readiness:
        overallRisk.level === "low" && financialHealth.status !== "unknown"
          ? "Có thể chuyển bước với ghi chú rủi ro, nhưng vẫn cần theo dõi dữ liệu mới."
          : "Nên kiểm tra thêm trước khi chuyển sang Checklist hoặc mô phỏng.",
      nextStep:
        missingEvidence.length > 0
          ? "Quay lại module nguồn để bổ sung dữ liệu còn thiếu, sau đó đọc lại risk score."
          : "Đọc lại các cảnh báo chính cùng BCTC, Định giá và PVT trước khi chuyển bước.",
    },
    nextActions: [
      { label: "Quay lại BCTC", moduleKey: "financials" },
      { label: "Quay lại Định giá", moduleKey: "valuation" },
      { label: "Xem thanh khoản PVT", moduleKey: "technical" },
    ],
  };
};
