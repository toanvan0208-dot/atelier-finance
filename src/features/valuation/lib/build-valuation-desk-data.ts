import {
  assessDataQuality,
  buildBasicValuationSummary,
  calculateBvps,
  calculateEps,
  calculateEnterpriseValue,
  calculateEvToEbitda,
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculatePsRatio,
  type FinancialMetricResult,
  type ValuationConfidence as CoreValuationConfidence,
} from "../../../lib/financial-logic";
import type { ValuationRefactoredData } from "../types";
import { mapValuationToLogicInput, type ValuationStatementSnapshot } from "./map-valuation-to-logic-input";

const missingValueLabel = "Chưa đủ dữ liệu";
const notApplicableLabel = "N/A";

const metricDisplay = (metric: FinancialMetricResult): string => {
  if (metric.value !== null) return metric.displayValue;
  if (metric.level === "not_applicable") return notApplicableLabel;
  return missingValueLabel;
};

const valuationMetricDisplay = (
  metric: FinancialMetricResult,
  requiredValue?: number | null,
): string => {
  if (requiredValue === null || requiredValue === undefined) return missingValueLabel;
  return metricDisplay(metric);
};

const compactMissingFields = (fields: string[]): string => (fields.length > 0 ? fields.join(", ") : "không có");

const evEbitdaMissingExplanation = (evToEbitda: FinancialMetricResult, enterpriseValue: FinancialMetricResult): string => {
  if (evToEbitda.value !== null) {
    return "EV/EBITDA đã có đủ EV và EBITDA, nhưng vẫn cần đọc cùng CAPEX, nợ vay và chu kỳ ngành.";
  }

  const missing = new Set([...evToEbitda.missingFields, ...enterpriseValue.missingFields]);
  const reasons = [
    missing.has("ebitda") ? "thiếu EBITDA rõ nguồn" : null,
    missing.has("enterpriseValue") && missing.has("cashAndEquivalents")
      ? "chưa có EV trực tiếp và thiếu tiền mặt để tự suy ra EV"
      : null,
    missing.has("enterpriseValue") && !missing.has("cashAndEquivalents") ? "chưa có Enterprise Value" : null,
    missing.has("marketCap") ? "thiếu vốn hóa" : null,
    missing.has("totalDebt") ? "thiếu nợ vay" : null,
  ].filter(Boolean);

  return reasons.length > 0
    ? `Chưa tính được vì ${reasons.join("; ")}. EV/EBITDA cần EV và EBITDA; có P/E, P/B, P/S không đồng nghĩa đủ dữ liệu cho EV/EBITDA.`
    : "Chưa tính được EV/EBITDA vì dữ liệu đầu vào chưa đạt điều kiện diễn giải.";
};

const confidenceLabel = (confidence: CoreValuationConfidence): "Cao" | "Trung bình" | "Thấp" => {
  if (confidence === "high") return "Cao";
  if (confidence === "medium") return "Trung bình";
  return "Thấp";
};

const lowerConfidenceForWeakSource = (
  confidence: CoreValuationConfidence,
  sourceStatus: ReturnType<typeof assessDataQuality>["sourceStatus"],
): CoreValuationConfidence => {
  if (sourceStatus === "missing") return "low";
  if (confidence === "unknown" || confidence === "very_low") return confidence;
  if (sourceStatus === "unverified" && confidence === "high") return "medium";
  return confidence;
};

const firstWarning = (metric: FinancialMetricResult, fallback: string): string => metric.warning ?? fallback;

const isPositiveNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const formatPrice = (value: number): string => `${Math.round(value).toLocaleString("vi-VN")} đ/cp`;

const formatPriceBand = (low: number, high: number): string => `${formatPrice(low)} - ${formatPrice(high)}`;

const buildSensitivityBand = (basePrice: number) => ({
  low: basePrice * 0.9,
  base: basePrice,
  high: basePrice * 1.1,
});

const buildPeFormulaPriceRange = (
  eps: number | null | undefined,
  peRatio: FinancialMetricResult,
) => {
  if (!isPositiveNumber(eps) || !isPositiveNumber(peRatio.value)) return undefined;
  const peBand = buildSensitivityBand(peRatio.value);
  const priceBand = {
    low: eps * peBand.low,
    base: eps * peBand.base,
    high: eps * peBand.high,
  };

  return {
    formula: "EPS x P/E tham chiếu",
    ...priceBand,
    label: formatPriceBand(priceBand.low, priceBand.high),
    assumption: `P/E tham chiếu minh họa ${peBand.low.toFixed(1)}x - ${peBand.high.toFixed(1)}x quanh P/E hiện tại ${peRatio.value.toFixed(1)}x.`,
  };
};

const buildPbFormulaPriceRange = (
  bvps: FinancialMetricResult,
  pbRatio: FinancialMetricResult,
) => {
  if (!isPositiveNumber(bvps.value) || !isPositiveNumber(pbRatio.value)) return undefined;
  const pbBand = buildSensitivityBand(pbRatio.value);
  const priceBand = {
    low: bvps.value * pbBand.low,
    base: bvps.value * pbBand.base,
    high: bvps.value * pbBand.high,
  };

  return {
    formula: "BVPS x P/B tham chiếu",
    ...priceBand,
    label: formatPriceBand(priceBand.low, priceBand.high),
    assumption: `P/B tham chiếu minh họa ${pbBand.low.toFixed(1)}x - ${pbBand.high.toFixed(1)}x quanh P/B hiện tại ${pbRatio.value.toFixed(1)}x.`,
  };
};

const buildPsFormulaPriceRange = (
  inputRevenue: number | null | undefined,
  inputShares: number | null | undefined,
  psRatio: FinancialMetricResult,
) => {
  if (!isPositiveNumber(inputRevenue) || !isPositiveNumber(inputShares) || !isPositiveNumber(psRatio.value)) return undefined;
  const revenuePerShare = inputRevenue / inputShares;
  if (!isPositiveNumber(revenuePerShare)) return undefined;
  const psBand = buildSensitivityBand(psRatio.value);
  const priceBand = {
    low: revenuePerShare * psBand.low,
    base: revenuePerShare * psBand.base,
    high: revenuePerShare * psBand.high,
  };

  return {
    formula: "Doanh thu/cp x P/S tham chiếu",
    ...priceBand,
    label: formatPriceBand(priceBand.low, priceBand.high),
    assumption: `P/S tham chiếu minh họa ${psBand.low.toFixed(1)}x - ${psBand.high.toFixed(1)}x quanh P/S hiện tại ${psRatio.value.toFixed(1)}x.`,
  };
};

export const buildValuationDeskData = (
  baseData: ValuationRefactoredData,
  snapshot: ValuationStatementSnapshot,
): ValuationRefactoredData => {
  const logicInput = mapValuationToLogicInput(snapshot);
  const summary = buildBasicValuationSummary(logicInput);
  const dataQuality = assessDataQuality(logicInput);
  const adjustedConfidence = lowerConfidenceForWeakSource(summary.readiness.confidence, dataQuality.sourceStatus);
  const peRatio = calculatePeRatio(logicInput);
  const pbRatio = calculatePbRatio(logicInput);
  const psRatio = calculatePsRatio(logicInput);
  const marketCap = calculateMarketCap(logicInput);
  const enterpriseValue = calculateEnterpriseValue(logicInput);
  const evToEbitda = calculateEvToEbitda(logicInput);
  const eps = calculateEps(logicInput);
  const bvps = calculateBvps(logicInput);
  const peDisplay = valuationMetricDisplay(peRatio, logicInput.eps);
  const peFormulaPriceRange = buildPeFormulaPriceRange(eps.value, peRatio);
  const pbFormulaPriceRange = buildPbFormulaPriceRange(bvps, pbRatio);
  const psFormulaPriceRange = buildPsFormulaPriceRange(logicInput.revenue ?? null, logicInput.sharesOutstanding ?? null, psRatio);
  const formulaPriceRanges = [peFormulaPriceRange, pbFormulaPriceRange, psFormulaPriceRange].filter(
    (range): range is NonNullable<typeof range> => Boolean(range),
  );
  const combinedFormulaLow =
    formulaPriceRanges.length > 0 ? Math.min(...formulaPriceRanges.map((range) => range.low)) : 0;
  const combinedFormulaHigh =
    formulaPriceRanges.length > 0 ? Math.max(...formulaPriceRanges.map((range) => range.high)) : 0;

  const readinessWarnings = [
    ...summary.readiness.warnings,
    ...dataQuality.warnings,
    ...summary.warnings,
  ];
  const warningText =
    readinessWarnings[0] ??
    "Định giá chỉ là dữ kiện phân tích, cần đọc cùng dòng tiền, nợ vay, chất lượng lợi nhuận và bối cảnh ngành.";
  const currentPrice = logicInput.closePrice ?? null;

  return {
    ...baseData,
    summary: {
      ticker: snapshot.ticker ?? baseData.summary.ticker,
      companyName: baseData.summary.companyName,
      currentPrice,
      fairValueRange: {
        low: combinedFormulaLow,
        high: combinedFormulaHigh,
        status: "Cần kiểm tra thêm",
        marginOfSafety: "Không rõ",
        confidence: confidenceLabel(adjustedConfidence),
        conclusion:
          summary.readiness.status === "ready"
            ? `${summary.beginnerInterpretation} ${warningText} Các chỉ số không tự tạo kết luận hành động.`
            : `Chưa đủ dữ liệu để tính các chỉ số nâng cao một cách có trách nhiệm. ${summary.readiness.beginnerInterpretation} ${warningText}`,
      },
    },
    assumptions: {
      intro:
        "Các chỉ số định giá dưới đây được tính từ financial logic core khi dữ liệu đầu vào hợp lệ. Phần mô hình nâng cao chỉ ở trạng thái chưa sẵn sàng nếu thiếu dữ liệu nền.",
      sensitiveNote:
        "Điểm nhạy nhất hiện tại là chất lượng EPS, BVPS, EBITDA, dòng tiền và nguồn dữ liệu. Không tự đặt WACC, tăng trưởng dài hạn hoặc kết quả mô hình khi dữ liệu chưa đủ.",
      items: [
        {
          title: "Dữ liệu thị trường",
          description: `Cần giá đóng cửa và số cổ phiếu lưu hành để tính vốn hóa, P/E, P/B và P/S. Thiếu: ${compactMissingFields(summary.readiness.missingFields)}.`,
          sensitivity: "Rất cao",
        },
        {
          title: "Chất lượng lợi nhuận",
          description:
            "P/E chỉ được tính khi EPS dương. Nếu EPS âm hoặc bằng 0, P/E ở trạng thái N/A và không diễn giải theo cách thông thường.",
          sensitivity: "Rất cao",
        },
        {
          title: "Vốn chủ sở hữu",
          description:
            "P/B và BVPS chỉ được đọc khi vốn chủ sở hữu và số cổ phiếu hợp lệ. Nếu vốn chủ không dương, kết quả cần khóa ở trạng thái N/A.",
          sensitivity: "Cao",
        },
        {
          title: "Nguồn dữ liệu",
          description: dataQuality.warnings[0] ?? "Nguồn và thời điểm cập nhật cần được đối chiếu trước khi diễn giải.",
          sensitivity: dataQuality.status === "good" ? "Trung bình" : "Cao",
        },
      ],
    },
    uncertainties: [
      {
        title: "Readiness định giá",
        status: "Cần theo dõi",
        description: `${summary.readiness.beginnerInterpretation} Phương pháp dùng được: ${
          summary.readiness.usableMethods.join(", ") || "chưa có"
        }.`,
        targetModule: "financials",
      },
      {
        title: "Nguồn và thời điểm dữ liệu",
        status: "Cần theo dõi",
        description: dataQuality.warnings[0] ?? dataQuality.beginnerInterpretation,
        targetModule: "financials",
      },
      {
        title: "Mô hình nâng cao chưa mở khóa",
        status: "Cần theo dõi",
        description:
          "Chưa tính mô hình dòng tiền khi thiếu chuỗi dòng tiền, giả định chi phí vốn, tăng trưởng dài hạn và kiểm chứng độ nhạy.",
      },
    ],
    methods: [
      {
        name: "P/E",
        role: "Đối chiếu",
        explanation: `${peDisplay}. ${firstWarning(peRatio, "P/E là giá cổ phiếu chia cho EPS; chỉ số này không tự tạo kết luận hành động.")}`,
        confidence: peRatio.value === null ? "Thấp" : confidenceLabel(adjustedConfidence),
      },
      {
        name: "P/B",
        role: "Đối chiếu",
        explanation: `${metricDisplay(pbRatio)}. ${firstWarning(pbRatio, "P/B cần đọc cùng ngành, chất lượng tài sản và dữ liệu tài chính.")}`,
        confidence: pbRatio.value === null ? "Thấp" : "Trung bình",
      },
      {
        name: "P/S",
        role: "Đối chiếu",
        explanation: `${metricDisplay(psRatio)}. ${firstWarning(psRatio, "P/S bỏ qua biên lợi nhuận và dòng tiền, chỉ dùng như dữ kiện so sánh.")}`,
        confidence: psRatio.value === null ? "Thấp" : "Trung bình",
      },
      {
        name: "EV/EBITDA",
        role: "Chỉ tham khảo",
        explanation: `${metricDisplay(evToEbitda)}. ${evEbitdaMissingExplanation(evToEbitda, enterpriseValue)}`,
        confidence: evToEbitda.value === null ? "Thấp" : "Trung bình",
      },
      {
        name: "DCF/WACC",
        role: "Kiểm tra độ nhạy",
        explanation:
          "Đã định nghĩa trong logic nghiệp vụ nhưng chưa sẵn sàng để tính vì thiếu dữ liệu đủ sâu về dòng tiền, WACC, tăng trưởng dài hạn và kịch bản.",
        confidence: "Thấp",
      },
    ],
    ranges: {
      rows: [
        {
          method: "P/E",
          keyAssumption: firstWarning(peRatio, "Chỉ đọc khi EPS dương và lợi nhuận không bị bóp méo bởi yếu tố bất thường."),
          range: peDisplay,
          formulaPriceRange: peFormulaPriceRange,
          confidence: peRatio.value === null ? "Thấp" : confidenceLabel(adjustedConfidence),
          risk: `Thiếu hoặc yếu: ${compactMissingFields(peRatio.missingFields)}.`,
        },
        {
          method: "P/B",
          keyAssumption: firstWarning(pbRatio, "Chỉ đọc khi BVPS và vốn chủ sở hữu dương."),
          range: metricDisplay(pbRatio),
          formulaPriceRange: pbFormulaPriceRange,
          confidence: pbRatio.value === null ? "Thấp" : "Trung bình",
          risk: `BVPS: ${metricDisplay(bvps)}. Thiếu hoặc yếu: ${compactMissingFields(pbRatio.missingFields)}.`,
        },
        {
          method: "P/S",
          keyAssumption: firstWarning(psRatio, "Cần đọc cùng biên lợi nhuận và dòng tiền."),
          range: metricDisplay(psRatio),
          formulaPriceRange: psFormulaPriceRange,
          confidence: psRatio.value === null ? "Thấp" : "Trung bình",
          risk: `Vốn hóa: ${metricDisplay(marketCap)}. Thiếu hoặc yếu: ${compactMissingFields(psRatio.missingFields)}.`,
        },
        {
          method: "EV/EBITDA",
          keyAssumption:
            evToEbitda.value === null
              ? evEbitdaMissingExplanation(evToEbitda, enterpriseValue)
              : firstWarning(evToEbitda, "Chỉ đọc khi EV và EBITDA dương, dữ liệu nợ và tiền mặt rõ ràng."),
          range: metricDisplay(evToEbitda),
          confidence: evToEbitda.value === null ? "Thấp" : "Trung bình",
          risk: `EV: ${metricDisplay(enterpriseValue)}. Thiếu hoặc yếu: ${compactMissingFields([
            ...new Set([...evToEbitda.missingFields, ...enterpriseValue.missingFields]),
          ])}.`,
        },
        {
          method: "DCF/WACC",
          keyAssumption: "Chưa đủ dữ liệu để đặt WACC, tăng trưởng dài hạn, FCFF hoặc FCFE.",
          range: "Chưa đủ dữ liệu",
          confidence: "Thấp",
          risk: "Không tạo kết quả mô hình khi dữ liệu nền chưa đủ.",
        },
      ],
      combinedRange:
        formulaPriceRanges.length > 0
          ? `Vùng công thức đang hiển thị: ${formatPriceBand(combinedFormulaLow, combinedFormulaHigh)}`
          : "Chưa đủ dữ liệu để tổng hợp chỉ số nâng cao",
      explanation:
        "Bảng này hiển thị cả chỉ số tương đối và vùng giá tham chiếu được suy ra từ công thức. Các vùng này dùng giả định minh họa quanh bội số hiện tại để học cách đọc độ nhạy, không phải giá mục tiêu hay khuyến nghị hành động.",
    },
    scenarios: {
      currentPrice,
      baseRange: "Chưa đủ dữ liệu",
      conclusion:
        "Chưa tính mô hình nâng cao. Cần bổ sung dữ liệu dòng tiền, nợ vay, nguồn cập nhật và giả định được kiểm chứng trước khi dùng phần này.",
      items: [
        {
          name: "Kịch bản xấu",
          range: "Chưa đủ dữ liệu",
          explanation: "Thiếu EPS, số cổ phiếu, vốn chủ hoặc giá thị trường sẽ khóa các chỉ số liên quan.",
          tone: "lower",
        },
        {
          name: "Kịch bản cơ sở",
          range: "Chưa đủ dữ liệu",
          explanation: "Chỉ đọc các chỉ số tương đối đã đủ dữ liệu; chưa tự tạo mô hình nâng cao.",
          tone: "base",
        },
        {
          name: "Kịch bản tốt",
          range: "Tùy chỉ số",
          explanation: "Chỉ số chỉ hiện giá trị khi mọi đầu vào bắt buộc hợp lệ và đúng đơn vị.",
          tone: "upper",
        },
      ],
    },
    traps: [
      {
        title: "P/E thấp cần kiểm tra chất lượng lợi nhuận",
        description:
          "Nếu lợi nhuận đang bất thường hoặc EPS không bền, P/E có thể gây hiểu nhầm. Cần đọc cùng chất lượng lợi nhuận và dòng tiền.",
      },
      {
        title: "P/B cần vốn chủ dương",
        description:
          "Khi BVPS hoặc vốn chủ không dương, P/B không phù hợp để diễn giải theo cách thông thường.",
      },
      {
        title: "Mô hình dòng tiền dễ lệch bởi giả định",
        description:
          "Chỉ cần thay đổi WACC hoặc tăng trưởng dài hạn, kết quả có thể biến động mạnh. Vì vậy phần này đang được khóa khi dữ liệu chưa đủ.",
      },
      {
        title: "Confidence không phải kết luận hành động",
        description:
          "Độ tin cậy chỉ nói mức đầy đủ của dữ liệu và phương pháp, không thay thế kiểm tra rủi ro, thanh khoản và bối cảnh ngành.",
      },
    ],
    finalConclusion: {
      status: "Cần kiểm tra thêm trước khi kết luận",
      pricePosition:
        currentPrice !== null && currentPrice > 0
          ? `Giá hiện tại là ${currentPrice.toLocaleString("vi-VN")} đồng/cp. Chưa có đủ dữ liệu mô hình nâng cao để đối chiếu trực tiếp.`
          : "Thiếu giá hiện tại nên chưa thể đối chiếu chỉ số thị trường.",
      marginOfSafety:
        "Chưa tính chỉ số nâng cao vì dữ liệu nền và độ tin cậy chưa đủ rõ. Không dùng phần này như kết luận hành động.",
      keyRisk:
        "Rủi ro lớn nhất là dữ liệu thiếu hoặc yếu khiến các chỉ số tương đối bị đọc quá mức. Cần kiểm tra EPS, BVPS, EBITDA, dòng tiền và nguồn dữ liệu.",
      nextStep:
        "Có thể chuyển sang Rủi ro hoặc quay lại BCTC để bổ sung dữ liệu còn thiếu trước khi viết nhận định định giá có điều kiện.",
    },
    nextActions: [
      {
        label: "Kiểm tra rủi ro định giá",
        moduleKey: "risk",
        variant: "primary",
      },
      {
        label: "Xem thanh khoản và thời điểm",
        moduleKey: "technical",
        variant: "secondary",
      },
      {
        label: "Quay lại BCTC bổ sung dữ liệu",
        moduleKey: "financials",
        variant: "ghost",
      },
    ],
    isLoading: baseData.isLoading,
    loading: baseData.loading,
    emptyState: baseData.emptyState,
  };
};
