import {
  assessDataQuality,
  buildBasicValuationSummary,
  calculateCashFlowRisk,
  calculateCfoToNetProfit,
  calculateDataQualityRisk,
  calculateDebtRisk,
  calculateEarningsQualityRisk,
  calculateFinancialHealth,
  calculateGrossMargin,
  calculateLiquidityRisk,
  calculateNetMargin,
  calculateOverallRiskScore,
  calculatePbRatio,
  calculatePeRatio,
  calculateRevenueGrowth,
  calculateRoe,
  calculateValuationConfidence,
  calculateValuationReadiness,
  calculateValuationRisk,
  type DataQualityResult,
  type FinancialMetricResult,
  type RiskScoreResult,
  type ValuationConfidence,
} from "../../../lib/financial-logic";
import type {
  CheckThinkingData,
  ChecklistLogicGroup,
  ChecklistLogicStatus,
  ChecklistLogicStep,
  StockFinalReadiness,
  StockModuleReadiness,
  StockReadinessStatus,
} from "../types";
import { mapChecklistToLogicInput, type ChecklistStatementSnapshot } from "./map-checklist-to-logic-input";

const missingValueLabel = "Chưa đủ dữ liệu";
const notApplicableLabel = "Không phù hợp để diễn giải";

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const sanitizeForChecklist = (text: string): string =>
  text
    .replace(/khuyến nghị giao dịch/gi, "kết luận hành động")
    .replace(/khuyến nghị đầu tư/gi, "kết luận đầu tư")
    .replace(/khuyến nghị/gi, "gợi ý kiểm tra")
    .replace(/nên mua|nên bán/gi, "cần kiểm tra thêm")
    .replace(/nắm giữ/gi, "tiếp tục theo dõi giả định")
    .replace(/buy|sell|hold|recommendation/gi, "cần kiểm tra thêm")
    .replace(/cổ phiếu an toàn/gi, "dữ liệu cần kiểm tra thêm")
    .replace(/điểm mua tốt/gi, "mốc cần kiểm tra thêm")
    .replace(/đáng mua/gi, "cần kiểm tra thêm")
    .replace(/chắc chắn rẻ|chắc chắn đắt|chắc chắn xấu/gi, "cần kiểm tra thêm")
    .replace(/gian lận/gi, "bất thường cần kiểm tra");

const sanitizeList = (items: string[]): string[] => unique(items.map(sanitizeForChecklist));

const metricDisplay = (metric: FinancialMetricResult): string => {
  if (metric.value !== null) return metric.displayValue;
  if (metric.level === "not_applicable") return notApplicableLabel;
  return missingValueLabel;
};

const statusFromMetric = (metric: FinancialMetricResult): ChecklistLogicStatus => {
  if (metric.level === "not_applicable") return "not_applicable";
  if (metric.value === null) return "insufficient_data";
  if (metric.warning || metric.level === "watch" || metric.level === "risk" || metric.level === "danger") return "needs_review";
  if (metric.level === "unknown") return "unknown";
  return "completed";
};

const statusFromRisk = (risk: RiskScoreResult): ChecklistLogicStatus => {
  if (risk.level === "unknown") return "insufficient_data";
  if (risk.level === "medium" || risk.level === "high" || risk.level === "critical") return "needs_review";
  return "completed";
};

const statusFromDataQuality = (dataQuality: DataQualityResult): ChecklistLogicStatus => {
  if (dataQuality.status === "missing" || dataQuality.status === "poor") return "insufficient_data";
  if (dataQuality.status === "stale" || dataQuality.status === "usable_with_caution") return "needs_review";
  return "completed";
};

const confidenceLabel = (confidence: ValuationConfidence): string => {
  if (confidence === "high") return "Cao";
  if (confidence === "medium") return "Trung bình";
  if (confidence === "low") return "Thấp";
  if (confidence === "very_low") return "Rất thấp";
  return "Chưa rõ";
};

const riskLabel = (risk: RiskScoreResult): string => {
  if (risk.score === null) return missingValueLabel;
  if (risk.level === "low") return `${risk.score}/100`;
  if (risk.level === "medium") return `${risk.score}/100 - cần kiểm tra thêm`;
  return `${risk.score}/100 - ưu tiên đọc kỹ`;
};

const step = (params: {
  id: string;
  label: string;
  status: ChecklistLogicStatus;
  value: string;
  summary: string;
  warnings?: string[];
  missingFields?: string[];
  targetModule: ChecklistLogicStep["targetModule"];
}): ChecklistLogicStep => ({
  id: params.id,
  label: params.label,
  status: params.status,
  value: params.value,
  summary: sanitizeForChecklist(params.summary),
  warnings: sanitizeList(params.warnings ?? []),
  missingFields: unique(params.missingFields ?? []),
  targetModule: params.targetModule,
});

const metricStep = (
  id: string,
  label: string,
  metric: FinancialMetricResult,
  targetModule: ChecklistLogicStep["targetModule"]
): ChecklistLogicStep =>
  step({
    id,
    label,
    status: statusFromMetric(metric),
    value: metricDisplay(metric),
    summary: metric.beginnerInterpretation,
    warnings: metric.warning ? [metric.warning] : [],
    missingFields: metric.missingFields,
    targetModule,
  });

const riskStep = (
  id: string,
  label: string,
  risk: RiskScoreResult,
  targetModule: ChecklistLogicStep["targetModule"]
): ChecklistLogicStep =>
  step({
    id,
    label,
    status: statusFromRisk(risk),
    value: riskLabel(risk),
    summary: risk.level === "unknown" ? "Chưa đủ dữ liệu để đánh giá đầy đủ nhóm rủi ro này." : risk.beginnerInterpretation,
    warnings: [...risk.warnings, ...risk.reasons],
    missingFields: risk.missingFields,
    targetModule,
  });

const groupSummary = (steps: ChecklistLogicStep[]): string => {
  const missingCount = steps.filter((item) => item.status === "insufficient_data" || item.status === "unknown").length;
  const reviewCount = steps.filter((item) => item.status === "needs_review").length;
  const notApplicableCount = steps.filter((item) => item.status === "not_applicable").length;

  if (missingCount > 0) return "Chưa đủ dữ liệu ở một số bước, không đánh dấu hoàn thành toàn bộ nhóm.";
  if (reviewCount > 0) return "Có bước cần kiểm tra thêm trước khi kết luận.";
  if (notApplicableCount > 0) return "Một số chỉ số không phù hợp để diễn giải theo cách thông thường.";
  return "Đã có dữ liệu để đọc sơ bộ, vẫn cần đối chiếu với module nguồn.";
};

const buildGroups = (snapshot: ChecklistStatementSnapshot): {
  groups: ChecklistLogicGroup[];
  warnings: string[];
  missingFields: string[];
  overallRisk: RiskScoreResult;
  dataQuality: DataQualityResult;
} => {
  const logicInput = mapChecklistToLogicInput(snapshot);
  const dataQuality = assessDataQuality(logicInput);
  const financialHealth = calculateFinancialHealth(logicInput);
  const revenueGrowth = calculateRevenueGrowth(logicInput);
  const grossMargin = calculateGrossMargin(logicInput);
  const netMargin = calculateNetMargin(logicInput);
  const roe = calculateRoe(logicInput);
  const cfoToNetProfit = calculateCfoToNetProfit(logicInput);
  const peRatio = calculatePeRatio(logicInput);
  const pbRatio = calculatePbRatio(logicInput);
  const valuationReadiness = calculateValuationReadiness(logicInput);
  const valuationConfidence = calculateValuationConfidence(logicInput);
  const valuationSummary = buildBasicValuationSummary(logicInput);
  const debtRisk = calculateDebtRisk(logicInput);
  const earningsQualityRisk = calculateEarningsQualityRisk(logicInput);
  const cashFlowRisk = calculateCashFlowRisk(logicInput);
  const valuationRisk = calculateValuationRisk(logicInput);
  const liquidityRisk = calculateLiquidityRisk(logicInput);
  const dataQualityRisk = calculateDataQualityRisk(logicInput);
  const overallRisk = calculateOverallRiskScore(logicInput);
  const missingFields = unique([
    ...dataQuality.missingFields,
    ...financialHealth.missingFields,
    ...valuationReadiness.missingFields,
    ...overallRisk.missingFields,
  ]);
  const warnings = sanitizeList([
    ...dataQuality.warnings,
    ...valuationReadiness.warnings,
    ...valuationSummary.warnings,
    ...overallRisk.warnings,
    ...[revenueGrowth, grossMargin, netMargin, roe, cfoToNetProfit, peRatio, pbRatio].flatMap((metric) =>
      metric.warning ? [metric.warning] : []
    ),
  ]);
  const dataSteps = [
    step({
      id: "core-financial-data",
      label: "Có dữ liệu tài chính lõi không?",
      status: statusFromDataQuality(dataQuality),
      value: dataQuality.status === "good" ? "Đã có dữ liệu" : missingValueLabel,
      summary: dataQuality.beginnerInterpretation,
      warnings: dataQuality.warnings,
      missingFields: dataQuality.missingFields,
      targetModule: "financials",
    }),
    step({
      id: "source-quality",
      label: "Có nguồn dữ liệu không?",
      status: dataQuality.sourceStatus === "missing" ? "insufficient_data" : dataQuality.sourceStatus === "unverified" ? "needs_review" : "completed",
      value: dataQuality.sourceStatus === "missing" ? missingValueLabel : dataQuality.sourceStatus === "verified" ? "Đã có nguồn" : "Cần kiểm tra nguồn",
      summary: dataQuality.warnings[0] ?? "Nguồn dữ liệu cần được đối chiếu trước khi dùng trong checklist.",
      warnings: dataQuality.warnings,
      missingFields: dataQuality.missingFields.filter((field) => field === "sourceName" || field === "collectedAt"),
      targetModule: "financials",
    }),
    step({
      id: "data-freshness",
      label: "Dữ liệu có quá cũ không?",
      status: dataQuality.stale ? "needs_review" : dataQuality.status === "missing" ? "insufficient_data" : "completed",
      value: dataQuality.stale ? "Cần cập nhật" : dataQuality.status === "missing" ? missingValueLabel : "Đủ để đọc sơ bộ",
      summary: dataQuality.stale ? "Dữ liệu đã cũ, cần cập nhật trước khi dùng checklist." : "Thời điểm dữ liệu đủ để đọc sơ bộ.",
      warnings: dataQuality.stale ? ["Kiểm tra thời điểm cập nhật dữ liệu."] : [],
      missingFields: dataQuality.missingFields.filter((field) => field === "collectedAt"),
      targetModule: "financials",
    }),
  ];
  const financialSteps = [
    metricStep("revenue-growth", "Doanh thu/lợi nhuận có xu hướng thế nào?", revenueGrowth, "financials"),
    metricStep("gross-margin", "Biên lợi nhuận gộp có đủ để đọc không?", grossMargin, "financials"),
    metricStep("net-margin", "Biên lợi nhuận ròng có đủ để đọc không?", netMargin, "financials"),
    metricStep("roe", "ROE có phù hợp để diễn giải không?", roe, "financials"),
    metricStep("cfo-profit", "CFO có hỗ trợ lợi nhuận không?", cfoToNetProfit, "financials"),
  ];
  const valuationSteps = [
    step({
      id: "valuation-readiness",
      label: "Có đủ dữ liệu để định giá không?",
      status: valuationReadiness.status === "ready" ? "completed" : valuationReadiness.status === "partial" ? "needs_review" : "insufficient_data",
      value: valuationReadiness.status === "ready" ? "Có thể đọc sơ bộ" : valuationReadiness.status === "partial" ? "Chỉ đọc được một phần" : missingValueLabel,
      summary: valuationReadiness.beginnerInterpretation,
      warnings: valuationReadiness.warnings,
      missingFields: valuationReadiness.missingFields,
      targetModule: "valuation",
    }),
    metricStep("pe-ratio", "P/E có dùng được không?", peRatio, "valuation"),
    metricStep("pb-ratio", "P/B có dùng được không?", pbRatio, "valuation"),
    step({
      id: "valuation-confidence",
      label: "Valuation confidence đang ở mức nào?",
      status: valuationConfidence === "high" || valuationConfidence === "medium" ? "completed" : valuationConfidence === "unknown" ? "insufficient_data" : "needs_review",
      value: confidenceLabel(valuationConfidence),
      summary: "Độ tin cậy chỉ nói mức đầy đủ của dữ liệu và phương pháp, không phải kết luận hành động.",
      warnings: valuationConfidence === "low" || valuationConfidence === "very_low" ? ["Độ tin cậy thấp, cần kiểm tra thêm giả định và dữ liệu đầu vào."] : [],
      missingFields: valuationReadiness.missingFields,
      targetModule: "valuation",
    }),
    step({
      id: "fair-value-readiness",
      label: "Fair value / margin of safety có đủ điều kiện không?",
      status: "insufficient_data",
      value: missingValueLabel,
      summary: "Checklist không tự tạo fair value hoặc margin of safety khi chưa có mô hình và dữ liệu hợp lệ.",
      warnings: valuationSummary.warnings,
      missingFields: valuationReadiness.missingFields,
      targetModule: "valuation",
    }),
  ];
  const riskSteps = [
    riskStep("debt-risk", "Rủi ro nợ vay có đáng chú ý không?", debtRisk, "risk"),
    riskStep("earnings-quality-risk", "Rủi ro chất lượng lợi nhuận thế nào?", earningsQualityRisk, "financials"),
    riskStep("cash-flow-risk", "Rủi ro dòng tiền thế nào?", cashFlowRisk, "financials"),
    riskStep("valuation-risk", "Rủi ro định giá thế nào?", valuationRisk, "valuation"),
    riskStep("liquidity-risk", "Rủi ro thanh khoản thế nào?", liquidityRisk, "technical"),
    riskStep("data-quality-risk", "Rủi ro dữ liệu thế nào?", dataQualityRisk, "financials"),
    riskStep("overall-risk", "Rủi ro tổng hợp có đủ để kết luận chưa?", overallRisk, "risk"),
  ];
  const nextCheckSteps = [
    step({
      id: "missing-fields",
      label: "Dữ liệu nào cần bổ sung?",
      status: missingFields.length > 0 ? "insufficient_data" : "completed",
      value: missingFields.length > 0 ? `${missingFields.length} trường thiếu` : "Đã có dữ liệu lõi",
      summary: missingFields.length > 0 ? `Bổ sung: ${missingFields.slice(0, 6).join(", ")}.` : "Chưa ghi nhận trường thiếu trọng yếu từ financial logic.",
      missingFields,
      targetModule: "financials",
    }),
    step({
      id: "top-warning",
      label: "Cảnh báo nào cần đọc kỹ?",
      status: warnings.length > 0 ? "needs_review" : "completed",
      value: warnings.length > 0 ? "Cần kiểm tra thêm" : "Chưa có cảnh báo nổi bật",
      summary: warnings[0] ?? "Kết quả chỉ là tham chiếu; cần đọc cùng dòng tiền, nợ vay, định giá và bối cảnh ngành.",
      warnings,
      targetModule: overallRisk.level === "unknown" ? "financials" : "risk",
    }),
    step({
      id: "next-module",
      label: "Module nào nên mở tiếp để xem chi tiết?",
      status: missingFields.length > 0 || overallRisk.level !== "low" ? "needs_review" : "completed",
      value: missingFields.length > 0 ? "Báo cáo tài chính" : overallRisk.level !== "low" ? "Rủi ro" : "Checklist có thể đọc tiếp",
      summary: missingFields.length > 0 ? "Quay lại BCTC để bổ sung dữ liệu còn thiếu trước khi kết luận." : "Đọc lại cảnh báo cùng module nguồn trước khi chuyển bước.",
      targetModule: missingFields.length > 0 ? "financials" : "risk",
    }),
  ];

  const groups: ChecklistLogicGroup[] = [
    { id: "data", title: "Dữ liệu có đủ không?", summary: groupSummary(dataSteps), steps: dataSteps },
    { id: "financial-health", title: "Sức khỏe tài chính", summary: groupSummary(financialSteps), steps: financialSteps },
    { id: "valuation", title: "Định giá", summary: groupSummary(valuationSteps), steps: valuationSteps },
    { id: "risk", title: "Rủi ro", summary: groupSummary(riskSteps), steps: riskSteps },
    { id: "next-checks", title: "Việc cần kiểm tra tiếp", summary: groupSummary(nextCheckSteps), steps: nextCheckSteps },
  ];

  return { groups, warnings, missingFields, overallRisk, dataQuality };
};

const readinessFromStepStatus = (status: ChecklistLogicStatus): StockReadinessStatus => {
  if (status === "completed") return "done";
  if (status === "needs_review" || status === "not_applicable") return "needs_review";
  if (status === "insufficient_data" || status === "unknown") return "missing_data";
  return "not_started";
};

const moduleReadinessFromGroups = (
  existing: StockModuleReadiness[],
  groups: ChecklistLogicGroup[]
): StockModuleReadiness[] => {
  const moduleConfigs: Array<{ moduleKey: StockModuleReadiness["moduleKey"]; moduleName: string; groupIds: string[] }> = [
    { moduleKey: "financials", moduleName: "Báo cáo tài chính", groupIds: ["data", "financial-health"] },
    { moduleKey: "valuation", moduleName: "Định giá", groupIds: ["valuation"] },
    { moduleKey: "risk", moduleName: "Rủi ro", groupIds: ["risk", "next-checks"] },
  ];
  const computed = moduleConfigs.map((config) => {
    const steps = groups.filter((group) => config.groupIds.includes(group.id)).flatMap((group) => group.steps);
    const missingEvidence = unique(steps.flatMap((item) => item.missingFields));
    const firstReview = steps.find((item) => item.status !== "completed");
    const status = readinessFromStepStatus(firstReview?.status ?? "completed");
    const completedCount = steps.filter((item) => item.status === "completed").length;
    const confidence = Math.round((completedCount / Math.max(steps.length, 1)) * 100);

    return {
      moduleKey: config.moduleKey,
      moduleName: config.moduleName,
      status,
      confidence,
      summary: firstReview?.summary ?? "Đã có dữ liệu để đọc sơ bộ, vẫn cần đối chiếu với module nguồn.",
      missingEvidence,
    };
  });

  return [...existing.filter((item) => !moduleConfigs.some((config) => config.moduleKey === item.moduleKey)), ...computed];
};

const buildFinalReadiness = (
  base: StockFinalReadiness,
  groups: ChecklistLogicGroup[],
  overallRisk: RiskScoreResult,
  missingFields: string[]
): StockFinalReadiness => {
  const hasInsufficientData = groups.some((group) =>
    group.steps.some((item) => item.status === "insufficient_data" || item.status === "unknown")
  );
  const hasReview = groups.some((group) => group.steps.some((item) => item.status === "needs_review"));

  if (hasInsufficientData || overallRisk.level === "unknown") {
    return {
      ...base,
      status: "not_enough_data",
      label: missingValueLabel,
      tone: "danger",
      summary: "Checklist chưa đủ dữ liệu để đánh giá đầy đủ. Cần bổ sung dữ liệu còn thiếu và đọc lại các module nguồn.",
      reasons: [
        missingFields.length > 0 ? `Thiếu: ${missingFields.slice(0, 6).join(", ")}.` : "Một số nhóm rủi ro chưa đủ dữ liệu để đánh giá.",
        "Không đánh dấu checklist hoàn thành khi dữ liệu cốt lõi còn thiếu.",
      ],
      nextActions: [
        { label: "Quay lại BCTC", moduleKey: "financials", primary: true },
        { label: "Kiểm tra định giá", moduleKey: "valuation" },
        { label: "Đọc rủi ro", moduleKey: "risk" },
      ],
    };
  }

  if (hasReview || overallRisk.level !== "low") {
    return {
      ...base,
      status: "return_to_analysis",
      label: "Cần kiểm tra thêm",
      tone: "warning",
      summary: "Checklist có dữ liệu để đọc sơ bộ nhưng còn cảnh báo cần kiểm tra, không phải kết luận hành động.",
      reasons: ["Cần đọc cùng dòng tiền, nợ vay, định giá và bối cảnh ngành.", overallRisk.warnings[0] ?? overallRisk.reasons[0] ?? "Có bước cần kiểm tra thêm."],
      nextActions: [
        { label: "Đọc cảnh báo rủi ro", moduleKey: "risk", primary: true },
        { label: "Đối chiếu BCTC", moduleKey: "financials" },
      ],
    };
  }

  return {
    ...base,
    status: "ready",
    label: "Đã có dữ liệu để đọc tiếp",
    tone: "success",
    summary: "Checklist đã có dữ liệu để đọc sơ bộ, nhưng kết quả chỉ là tham chiếu và không phải kết luận hành động.",
    reasons: ["Các nhóm dữ liệu chính không thiếu trường trọng yếu từ financial logic.", "Vẫn cần theo dõi dữ liệu mới và thesis trong Watchlist hoặc Mô phỏng."],
  };
};

export const buildChecklistDeskData = (
  baseData: CheckThinkingData,
  snapshots: ChecklistStatementSnapshot[]
): CheckThinkingData => {
  const snapshotsByTicker = new Map(snapshots.map((snapshot) => [snapshot.ticker, snapshot]));

  return {
    ...baseData,
    stockReadinessByTicker: baseData.stockReadinessByTicker.map((stock) => {
      const snapshot = snapshotsByTicker.get(stock.ticker);
      if (!snapshot) return stock;
      const { groups, warnings, missingFields, overallRisk } = buildGroups(snapshot);

      return {
        ...stock,
        moduleReadiness: moduleReadinessFromGroups(stock.moduleReadiness, groups),
        missingEvidenceQuestions: [
          ...stock.missingEvidenceQuestions,
          ...missingFields.slice(0, 3).map((field) => ({
            id: `${stock.ticker.toLowerCase()}-logic-missing-${field}`,
            question: `Cần bổ sung trường dữ liệu: ${field}`,
            whyItMatters: "Thiếu dữ liệu này khiến checklist chỉ nên được đọc như bản kiểm tra tạm thời.",
            targetModule: "financials" as const,
          })),
        ],
        finalReadiness: buildFinalReadiness(stock.finalReadiness, groups, overallRisk, missingFields),
        logicChecklistGroups: groups,
        logicWarnings: warnings,
        logicMissingFields: missingFields,
      };
    }),
  };
};
