import {
  assessDataQuality,
  calculateCfoToNetProfit,
  calculateCurrentRatio,
  calculateDebtToEquity,
  calculateFinancialHealth,
  calculateFreeCashFlow,
  calculateGrossMargin,
  calculateNetMargin,
  calculateRevenueGrowth,
  calculateRoa,
  calculateRoe,
  calculateValuationReadiness,
  type FinancialMetricResult,
  type MetricLevel,
  type ValuationReadinessStatus,
} from "../../../lib/financial-logic";
import type {
  FinancialConclusionReadiness,
  FinancialDeskMetric,
  FinancialDeskMetricStatus,
  FinancialReadingDeskData,
  FinancialValuationNavigationStatus,
} from "../types";
import { mapFinancialsToLogicInput, type FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

type MetricPatch = {
  id: string;
  label?: string;
};

const levelToDeskStatus = (level: MetricLevel): FinancialDeskMetricStatus => {
  if (level === "good") return "good";
  if (level === "risk" || level === "danger") return "risk";
  if (level === "watch") return "watch";
  if (level === "unknown" || level === "not_applicable") return "unknown";
  return "neutral";
};

const metricValueLabel = (metric: FinancialMetricResult): string => {
  if (metric.value !== null) return metric.displayValue;
  if (metric.level === "not_applicable") return "Không phù hợp để diễn giải";
  return "Chưa đủ dữ liệu";
};

const toDeskMetric = (metric: FinancialMetricResult, patch: MetricPatch): FinancialDeskMetric => ({
  id: patch.id,
  label: patch.label ?? metric.label,
  value: metricValueLabel(metric),
  period: metric.period ?? "Kỳ hiện tại",
  status: levelToDeskStatus(metric.level),
  definition: metric.explanation,
  howToRead: metric.beginnerInterpretation,
  goodSignal:
    metric.dataQuality === "sufficient"
      ? "Dữ liệu đủ để đọc sơ bộ, nhưng vẫn cần so với ngành và các kỳ trước."
      : "Chỉ đọc như tín hiệu tham khảo vì dữ liệu chưa đầy đủ.",
  badSignal: metric.warning ?? metric.commonMisread,
  dataQuality: metric.dataQuality,
  warning: metric.warning,
  missingFields: metric.missingFields,
  logicKey: metric.key,
});

const upsertMetric = (metrics: FinancialDeskMetric[], nextMetric: FinancialDeskMetric): FinancialDeskMetric[] => {
  const index = metrics.findIndex((metric) => metric.id === nextMetric.id);
  if (index === -1) return [...metrics, nextMetric];
  return metrics.map((metric, currentIndex) => (currentIndex === index ? { ...metric, ...nextMetric } : metric));
};

const healthStatusLabel: Record<ReturnType<typeof calculateFinancialHealth>["status"], string> = {
  healthy: "Khỏe sơ bộ",
  acceptable: "Tạm ổn, cần đọc tiếp",
  watch: "Cần kiểm tra thêm",
  risk: "Có điểm cần chú ý",
  unknown: "Chưa đủ dữ liệu",
};

const valuationNavigationByStatus: Record<
  ValuationReadinessStatus,
  {
    canContinue: boolean;
    logicStatus: FinancialValuationNavigationStatus;
    status: FinancialConclusionReadiness;
    reason: string;
    nextStepSuggestion: string;
  }
> = {
  ready: {
    canContinue: true,
    logicStatus: "ready",
    status: "Có thể chuyển",
    reason: "Đủ dữ liệu để xem định giá sơ bộ.",
    nextStepSuggestion: "Đủ dữ liệu để xem định giá sơ bộ.",
  },
  partial: {
    canContinue: true,
    logicStatus: "needs_review",
    status: "Cần kiểm tra thêm",
    reason: "Có thể xem định giá sơ bộ, nhưng cần kiểm tra thêm trước khi tin vào định giá.",
    nextStepSuggestion: "Có thể xem định giá sơ bộ, cần kiểm tra thêm trước khi tin vào định giá.",
  },
  not_ready: {
    canContinue: false,
    logicStatus: "not_ready",
    status: "Chưa nên định giá",
    reason: "Chưa đủ dữ liệu để đọc định giá có trách nhiệm.",
    nextStepSuggestion: "Bổ sung dữ liệu còn thiếu trước khi chuyển sang định giá.",
  },
  unknown: {
    canContinue: false,
    logicStatus: "not_ready",
    status: "Chưa nên định giá",
    reason: "Chưa đủ dữ liệu để đọc định giá có trách nhiệm.",
    nextStepSuggestion: "Bổ sung dữ liệu còn thiếu trước khi chuyển sang định giá.",
  },
};

export const buildFinancialReadingDeskData = (
  baseData: FinancialReadingDeskData,
  snapshot: FinancialsStatementSnapshot
): FinancialReadingDeskData => {
  const logicInput = mapFinancialsToLogicInput(snapshot);
  const financialHealth = calculateFinancialHealth(logicInput);
  const dataQuality = assessDataQuality(logicInput);
  const valuationReadiness = calculateValuationReadiness(logicInput);
  const valuationNavigation = valuationNavigationByStatus[valuationReadiness.status];
  const valuationReadinessItems =
    valuationReadiness.warnings.length > 0
      ? valuationReadiness.warnings
      : valuationReadiness.missingFields.map((field) => `Thiếu dữ liệu: ${field}.`);

  const logicMetrics = [
    toDeskMetric(calculateRevenueGrowth(logicInput), { id: "revenue-growth", label: "Tăng trưởng doanh thu" }),
    toDeskMetric(calculateGrossMargin(logicInput), { id: "gross-margin" }),
    toDeskMetric(calculateNetMargin(logicInput), { id: "net-margin" }),
    toDeskMetric(calculateRoa(logicInput), { id: "roa" }),
    toDeskMetric(calculateRoe(logicInput), { id: "roe" }),
    toDeskMetric(calculateDebtToEquity(logicInput), { id: "debt-to-equity" }),
    toDeskMetric(calculateCurrentRatio(logicInput), { id: "current-ratio" }),
    toDeskMetric(calculateCfoToNetProfit(logicInput), { id: "cfo-to-net-profit", label: "CFO / LNST" }),
    toDeskMetric(calculateFreeCashFlow(logicInput), { id: "fcf" }),
    {
      id: "data-quality",
      label: "Chất lượng dữ liệu",
      value: dataQuality.status === "good" ? "Đủ để đọc sơ bộ" : "Cần bổ sung dữ liệu",
      period: logicInput.period ?? baseData.period,
      status: dataQuality.status === "good" ? "neutral" : "unknown",
      definition: "Kiểm tra nguồn, thời điểm cập nhật và các trường dữ liệu cốt lõi.",
      howToRead: dataQuality.beginnerInterpretation,
      goodSignal: "Có nguồn dữ liệu và thời điểm cập nhật rõ ràng.",
      badSignal: dataQuality.warnings.join(" ") || "Có con số không có nghĩa con số đó đáng tin.",
      dataQuality: dataQuality.status === "good" ? "sufficient" : "partial",
      warning: dataQuality.warnings[0] ?? null,
      missingFields: dataQuality.missingFields,
      logicKey: "dataQuality",
    } satisfies FinancialDeskMetric,
  ];

  const metrics = logicMetrics.reduce(upsertMetric, baseData.metrics);
  const dataQualityWarnings = dataQuality.warnings.map((warning, index) => ({
    id: `data-quality-${index + 1}`,
    title: "Dữ liệu cần kiểm tra",
    severity: "watch" as const,
    summary: warning,
    cause: "Financial logic đánh dấu dữ liệu thiếu, cũ hoặc chưa có nguồn rõ ràng.",
    targetStepId: "three-statements",
  }));

  return {
    ...baseData,
    preliminaryConclusion: {
      ...baseData.preliminaryConclusion,
      status: healthStatusLabel[financialHealth.status],
      score: financialHealth.score ?? baseData.preliminaryConclusion.score,
      summary:
        financialHealth.status === "unknown"
          ? financialHealth.beginnerInterpretation
          : `${financialHealth.beginnerInterpretation} Điểm cần đọc tiếp: ${
              [...financialHealth.watchPoints, ...financialHealth.riskPoints][0] ?? "dòng tiền, nợ và biên lợi nhuận."
            }`,
      scoreNote: "Điểm chỉ dùng để định hướng phần cần đọc tiếp, không phải chỉ dẫn giao dịch.",
    },
    warnings: [...dataQualityWarnings, ...baseData.warnings],
    metrics,
    valuationReadiness: {
      ...baseData.valuationReadiness,
      status: valuationNavigation.status,
      logicStatus: valuationNavigation.logicStatus,
      canContinue: valuationNavigation.canContinue,
      missing: valuationReadinessItems,
      reason: valuationReadiness.beginnerInterpretation || valuationNavigation.reason,
      nextStepSuggestion: valuationNavigation.nextStepSuggestion,
      usableMethods: valuationReadiness.usableMethods,
    },
  };
};
