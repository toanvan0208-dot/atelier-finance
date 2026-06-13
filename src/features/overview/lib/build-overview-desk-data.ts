import {
  assessDataQuality,
  buildBasicValuationSummary,
  calculateCfoToNetProfit,
  calculateDataQualityRisk,
  calculateFinancialHealth,
  calculateGrossMargin,
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
import type {
  OverviewBottleneck,
  OverviewCaseDashboardData,
  OverviewCaseStatus,
  OverviewNextBestAction,
  OverviewPriority,
  OverviewProgressStatus,
  OverviewSummaryCard,
} from "../types";
import { mapOverviewToLogicInput, type OverviewStatementSnapshot } from "./map-overview-to-logic-input";

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const metricValue = (metric: FinancialMetricResult): string => {
  if (metric.value !== null) return metric.displayValue;
  if (metric.level === "not_applicable") return "Không phù hợp để diễn giải";
  return "Chưa đủ dữ liệu";
};

const healthStatusLabel = (status: ReturnType<typeof calculateFinancialHealth>["status"]): string => {
  if (status === "healthy") return "Ổn sơ bộ";
  if (status === "acceptable") return "Tạm đủ để đọc tiếp";
  if (status === "watch") return "Cần kiểm tra thêm";
  if (status === "risk") return "Có điểm cần chú ý";
  return "Chưa đủ dữ liệu";
};

const riskStatusLabel = (level: RiskLevel): string => {
  if (level === "critical" || level === "high") return "Rủi ro cao";
  if (level === "medium") return "Cần kiểm tra thêm";
  if (level === "low") return "Chưa thấy cảnh báo lớn từ dữ liệu hiện có";
  return "Chưa đủ dữ liệu";
};

const valuationStatusLabel = (status: ValuationReadinessStatus): string => {
  if (status === "ready") return "Có thể đọc sơ bộ";
  if (status === "partial") return "Chỉ đọc được một phần";
  if (status === "not_ready") return "Chưa đủ dữ liệu";
  return "Chưa đủ dữ liệu";
};

const confidenceLabel = (confidence: ValuationConfidence): string => {
  if (confidence === "high") return "Cao";
  if (confidence === "medium") return "Trung bình";
  if (confidence === "low") return "Thấp";
  if (confidence === "very_low") return "Rất thấp";
  return "Chưa rõ";
};

const priorityFromMissing = (missingCount: number): OverviewPriority => {
  if (missingCount >= 4) return "high";
  if (missingCount >= 1) return "medium";
  return "low";
};

const overviewPriorityLabel = (priority: OverviewPriority): "Cao" | "Vừa" | "Thấp" => {
  if (priority === "high") return "Cao";
  if (priority === "medium") return "Vừa";
  return "Thấp";
};

const fieldModule = (field: string): { module: string; moduleKey: string; reason: string } => {
  if (field === "closePrice" || field === "volume" || field === "avgTradingValue20d" || field === "previousClosePrice") {
    return { module: "PVT", moduleKey: "technical", reason: "Cần dữ liệu giá và thanh khoản để đọc rủi ro thực thi." };
  }
  if (field === "eps" || field === "bvps" || field === "sharesOutstanding") {
    return { module: "Định giá", moduleKey: "valuation", reason: "Cần dữ liệu định giá để đọc P/E, P/B hoặc readiness." };
  }
  if (field === "sourceName" || field === "collectedAt") {
    return { module: "Báo cáo tài chính", moduleKey: "financials", reason: "Cần nguồn và thời điểm cập nhật để đánh giá độ tin cậy." };
  }
  return { module: "Báo cáo tài chính", moduleKey: "financials", reason: "Cần bổ sung dữ liệu tài chính trước khi kết luận." };
};

const toBottleneck = (field: string): OverviewBottleneck => {
  const target = fieldModule(field);
  return {
    title: field,
    whyItMatters: target.reason,
    consequence: "Nếu thiếu dữ liệu này, Overview chỉ được đọc như bản tóm tắt tạm thời.",
    priority: overviewPriorityLabel(priorityFromMissing(1)),
    targetModule: target.module,
    moduleKey: target.moduleKey,
  };
};

const progressStatusFromSummary = (id: string, hasMissing: boolean): OverviewProgressStatus => {
  if (id === "financials") return hasMissing ? "Thiếu dữ liệu" : "Hoàn thành sơ bộ";
  if (id === "valuation") return hasMissing ? "Thiếu dữ liệu" : "Hoàn thành sơ bộ";
  if (id === "risk") return hasMissing ? "Cần quay lại" : "Hoàn thành sơ bộ";
  return "Đang làm";
};

export const buildOverviewDeskData = (
  baseData: OverviewCaseDashboardData,
  snapshot: OverviewStatementSnapshot
): OverviewCaseDashboardData => {
  const logicInput = mapOverviewToLogicInput(snapshot);
  const financialHealth = calculateFinancialHealth(logicInput);
  const dataQuality = assessDataQuality(logicInput);
  const dataQualityRisk = calculateDataQualityRisk(logicInput);
  const valuationReadiness = calculateValuationReadiness(logicInput);
  const valuationConfidence = calculateValuationConfidence(logicInput);
  const valuationSummary = buildBasicValuationSummary(logicInput);
  const overallRisk = calculateOverallRiskScore(logicInput);
  const revenueGrowth = calculateRevenueGrowth(logicInput);
  const grossMargin = calculateGrossMargin(logicInput);
  const netMargin = calculateNetMargin(logicInput);
  const roe = calculateRoe(logicInput);
  const cfoToNetProfit = calculateCfoToNetProfit(logicInput);
  const peRatio = calculatePeRatio(logicInput);
  const pbRatio = calculatePbRatio(logicInput);

  const topWarnings = unique([
    ...dataQuality.warnings,
    ...overallRisk.warnings,
    ...valuationSummary.warnings,
    ...[revenueGrowth, grossMargin, netMargin, roe, cfoToNetProfit, peRatio, pbRatio].flatMap((metric) => metric.warning ? [metric.warning] : []),
  ]).slice(0, 6);
  const missingFields = unique([
    ...financialHealth.missingFields,
    ...valuationReadiness.missingFields,
    ...overallRisk.missingFields,
    ...dataQuality.missingFields,
  ]);
  const nextChecks = unique([
    ...(cfoToNetProfit.value === null ? ["Bổ sung CFO để đọc chất lượng lợi nhuận."] : []),
    ...(valuationReadiness.status !== "ready" ? ["Bổ sung dữ liệu định giá trước khi đọc vùng giá trị nội tại."] : []),
    ...(overallRisk.level === "unknown" || overallRisk.level === "high" || overallRisk.level === "critical" ? ["Đọc lại Risk để xác định cảnh báo chính."] : []),
    ...(dataQuality.status !== "good" ? ["Kiểm tra nguồn và thời điểm cập nhật dữ liệu."] : []),
  ]);
  const summaryCards: OverviewSummaryCard[] = [
    {
      id: "financial-health",
      title: "Sức khỏe tài chính",
      status: healthStatusLabel(financialHealth.status),
      value: financialHealth.score === null ? "Chưa đủ dữ liệu" : `${financialHealth.score}/100`,
      summary: `${financialHealth.beginnerInterpretation} Doanh thu: ${metricValue(revenueGrowth)}; biên ròng: ${metricValue(netMargin)}; ROE: ${metricValue(roe)}; CFO/LNST: ${metricValue(cfoToNetProfit)}.`,
      warnings: unique([...financialHealth.watchPoints, ...financialHealth.riskPoints]).slice(0, 3),
      missingFields: financialHealth.missingFields,
      nextChecks: ["Mở BCTC để đọc chi tiết dòng tiền, nợ vay và biên lợi nhuận."],
      moduleKey: "financials",
    },
    {
      id: "valuation",
      title: "Định giá",
      status: valuationStatusLabel(valuationReadiness.status),
      value: `Tin cậy: ${confidenceLabel(valuationConfidence)}`,
      summary: `${valuationReadiness.beginnerInterpretation} P/E: ${metricValue(peRatio)}; P/B: ${metricValue(pbRatio)}. Không tạo fair value hoặc margin of safety khi chưa có dữ liệu hợp lệ.`,
      warnings: unique([...valuationReadiness.warnings, ...valuationSummary.warnings]).slice(0, 3),
      missingFields: valuationReadiness.missingFields,
      nextChecks: ["Mở Định giá để kiểm tra EPS, BVPS, P/E, P/B và dữ liệu còn thiếu."],
      moduleKey: "valuation",
    },
    {
      id: "risk",
      title: "Rủi ro tổng hợp",
      status: riskStatusLabel(overallRisk.level),
      value: overallRisk.score === null ? "Chưa đủ dữ liệu" : `${overallRisk.score}/100`,
      summary: overallRisk.level === "unknown" ? "Chưa đủ dữ liệu để đánh giá đầy đủ rủi ro tổng hợp." : overallRisk.beginnerInterpretation,
      warnings: unique([...overallRisk.reasons, ...overallRisk.warnings]).slice(0, 3),
      missingFields: overallRisk.missingFields,
      nextChecks: ["Mở Risk để đọc cảnh báo chính, missing fields và bước kiểm tra tiếp."],
      moduleKey: "risk",
    },
    {
      id: "data-quality",
      title: "Chất lượng dữ liệu",
      status: dataQuality.status === "good" ? "Đủ để đọc sơ bộ" : "Cần kiểm tra thêm",
      value: `${dataQuality.score}/100`,
      summary: `${dataQuality.beginnerInterpretation} Data quality risk: ${riskStatusLabel(dataQualityRisk.level)}.`,
      warnings: dataQuality.warnings,
      missingFields: dataQuality.missingFields,
      nextChecks: ["Bổ sung nguồn, thời điểm cập nhật và các trường dữ liệu cốt lõi."],
      moduleKey: "financials",
    },
  ];
  const bottlenecks = missingFields.length > 0 ? missingFields.slice(0, 6).map(toBottleneck) : baseData.missingData;
  const primaryModule = cfoToNetProfit.value === null ? "financials" : valuationReadiness.status !== "ready" ? "valuation" : overallRisk.level !== "low" ? "risk" : "financials";
  const nextAction: OverviewNextBestAction = {
    title: primaryModule === "financials" ? "Bổ sung dữ liệu BCTC còn thiếu" : primaryModule === "valuation" ? "Kiểm tra readiness định giá" : "Đọc lại cảnh báo rủi ro chính",
    module: primaryModule === "financials" ? "Báo cáo tài chính" : primaryModule === "valuation" ? "Định giá" : "Rủi ro",
    priority: missingFields.length > 0 ? "Cao" : "Vừa",
    reason: nextChecks[0] ?? "Overview chỉ là bản tóm tắt; cần mở module nguồn để đọc chi tiết.",
    cta: {
      label: primaryModule === "financials" ? "Mở Báo cáo tài chính" : primaryModule === "valuation" ? "Mở Định giá" : "Mở Rủi ro",
      moduleKey: primaryModule,
    },
    secondaryActions: [
      { title: "Mở BCTC", moduleKey: "financials" },
      { title: "Mở Định giá", moduleKey: "valuation" },
      { title: "Mở Rủi ro", moduleKey: "risk" },
    ],
  };
  const hasMissing = missingFields.length > 0;
  const caseStatus: OverviewCaseStatus =
    hasMissing || overallRisk.level === "unknown"
      ? "Đang kiểm chứng dữ liệu"
      : overallRisk.level === "high" || overallRisk.level === "critical"
        ? "Cần quay lại phân tích"
        : "Có thesis sơ bộ nhưng chưa đủ tin cậy";

  return {
    ...baseData,
    activeCase: {
      ...baseData.activeCase,
      ticker: snapshot.ticker ?? baseData.activeCase.ticker,
      industry: snapshot.industry ?? baseData.activeCase.industry,
      caseStatus,
      currentStage: nextAction.module,
      temporaryThesis:
        "Overview đang tóm tắt sức khỏe tài chính, định giá, rủi ro và chất lượng dữ liệu từ financial logic core.",
      mainWarning: topWarnings[0] ?? "Kết quả chỉ là tham chiếu; cần đọc cùng dòng tiền, nợ vay, định giá và bối cảnh ngành.",
      notReadyFor: [
        ...(hasMissing ? ["Kết luận đầy đủ khi còn thiếu dữ liệu"] : []),
        ...(valuationReadiness.status !== "ready" ? ["Tạo vùng giá trị nội tại"] : []),
        ...(overallRisk.level !== "low" ? ["Chuyển bước khi chưa đọc cảnh báo rủi ro"] : []),
      ],
    },
    nextBestAction: nextAction,
    summaryCards,
    missingData: bottlenecks,
    progressMap: baseData.progressMap.map((item) => {
      if (item.id === "financials") {
        return { ...item, status: progressStatusFromSummary(item.id, financialHealth.status === "unknown"), summary: summaryCards[0].status };
      }
      if (item.id === "valuation") {
        return { ...item, status: progressStatusFromSummary(item.id, valuationReadiness.status !== "ready"), summary: summaryCards[1].status };
      }
      if (item.id === "risk") {
        return { ...item, status: progressStatusFromSummary(item.id, overallRisk.level !== "low"), summary: summaryCards[2].status };
      }
      return item;
    }),
    actionStatus: {
      canDo: ["Mở module nguồn để kiểm tra từng cảnh báo.", ...nextChecks.slice(0, 2)],
      shouldNotDoYet: [
        "Không dùng Overview thay cho BCTC, Định giá hoặc Risk.",
        "Không tạo kết luận chắc chắn khi còn missing fields.",
        "Không diễn giải P/E, P/B khi core báo không phù hợp.",
      ],
      unlockConditions: nextChecks.length > 0 ? nextChecks : ["Dữ liệu đủ để tiếp tục đọc module chi tiết."],
      conclusion:
        "Overview chỉ là bản tóm tắt tham chiếu từ financial logic core, không thay thế quyết định của người dùng.",
    },
    disclaimer:
      "Tổng quan chỉ điều phối case đang phân tích, dữ liệu còn thiếu và bước tiếp theo. Nội dung chỉ là dữ liệu tham khảo.",
  };
};
