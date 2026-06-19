import {
  assessDataQuality,
  buildBasicValuationSummary,
  calculateBvps,
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
const notApplicableLabel = "Không phù hợp để diễn giải";

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

const confidenceLabel = (confidence: CoreValuationConfidence): "Cao" | "Trung bình" | "Thấp" => {
  if (confidence === "high") return "Cao";
  if (confidence === "medium") return "Trung bình";
  return "Thấp";
};

const lowerConfidenceForWeakSource = (
  confidence: CoreValuationConfidence,
  sourceStatus: ReturnType<typeof assessDataQuality>["sourceStatus"]
): CoreValuationConfidence => {
  if (sourceStatus === "missing") return "low";
  if (confidence === "unknown" || confidence === "very_low") return confidence;
  if (sourceStatus === "unverified" && confidence === "high") return "medium";
  return confidence;
};

const firstWarning = (metric: FinancialMetricResult, fallback: string): string => metric.warning ?? fallback;

export const buildValuationDeskData = (
  baseData: ValuationRefactoredData,
  snapshot: ValuationStatementSnapshot
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
  const bvps = calculateBvps(logicInput);
  const peDisplay = valuationMetricDisplay(peRatio, logicInput.eps);

  const readinessWarnings = [
    ...summary.readiness.warnings,
    ...dataQuality.warnings,
    ...summary.warnings,
  ];
  const warningText =
    readinessWarnings[0] ??
    "Định giá chỉ là dữ kiện phân tích, cần đọc cùng dòng tiền, nợ vay, chất lượng lợi nhuận và bối cảnh ngành.";
  const hasFairValueRange = false;
  const currentPrice = logicInput.closePrice ?? null;

  return {
    ...baseData,
    summary: {
      ticker: snapshot.ticker ?? baseData.summary.ticker,
      companyName: baseData.summary.companyName,
      currentPrice,
      fairValueRange: {
        low: hasFairValueRange ? baseData.summary.fairValueRange.low : 0,
        high: hasFairValueRange ? baseData.summary.fairValueRange.high : 0,
        status: "Cần kiểm tra thêm",
        marginOfSafety: "Không rõ",
        confidence: confidenceLabel(adjustedConfidence),
        conclusion:
          summary.readiness.status === "ready"
            ? `${summary.beginnerInterpretation} ${warningText}`
            : `Chưa đủ dữ liệu để tính vùng giá trị nội tại có trách nhiệm. ${summary.readiness.beginnerInterpretation} ${warningText}`,
      },
    },
    assumptions: {
      intro:
        "Các chỉ số định giá dưới đây được tính từ financial logic core. Phần giá trị nội tại như DCF, WACC, FCFF hoặc FCFE chỉ được xem là chưa sẵn sàng nếu thiếu dữ liệu nền.",
      sensitiveNote:
        "Điểm nhạy nhất hiện tại là chất lượng EPS, BVPS, EBITDA, dòng tiền và nguồn dữ liệu. Không tự đặt WACC, tăng trưởng dài hạn hoặc fair value khi dữ liệu chưa đủ.",
      items: [
        {
          title: "Dữ liệu thị trường",
          description: `Cần giá đóng cửa và số cổ phiếu lưu hành để tính vốn hóa, P/E, P/B và P/S. Thiếu: ${compactMissingFields(summary.readiness.missingFields)}.`,
          sensitivity: "Rất cao",
        },
        {
          title: "Chất lượng lợi nhuận",
          description:
            "EPS chỉ được diễn giải P/E khi dương. Nếu EPS âm hoặc bằng 0, P/E được xem là không phù hợp để diễn giải theo cách thông thường.",
          sensitivity: "Rất cao",
        },
        {
          title: "Vốn chủ sở hữu",
          description:
            "P/B chỉ được đọc khi BVPS hoặc vốn chủ sở hữu dương. Nếu vốn chủ âm, kết quả cần được khóa ở trạng thái không phù hợp.",
          sensitivity: "Cao",
        },
        {
          title: "Nguồn dữ liệu",
          description: dataQuality.warnings[0] ?? "Nguồn và thời điểm cập nhật đã có, nhưng vẫn cần đối chiếu trước khi kết luận.",
          sensitivity: dataQuality.status === "good" ? "Trung bình" : "Cao",
        },
      ],
    },
    uncertainties: [
      {
        title: "Readiness định giá",
        status: summary.readiness.status === "ready" ? "Đã ổn" : "Cần theo dõi",
        description: `${summary.readiness.beginnerInterpretation} Phương pháp dùng được: ${
          summary.readiness.usableMethods.join(", ") || "chưa có"
        }.`,
        targetModule: "financials",
      },
      {
        title: "Nguồn và thời điểm dữ liệu",
        status: dataQuality.status === "good" ? "Đã ổn" : "Cần theo dõi",
        description: dataQuality.warnings[0] ?? dataQuality.beginnerInterpretation,
        targetModule: "financials",
      },
      {
        title: "DCF/WACC chưa được mở khóa",
        status: "Cần theo dõi",
        description:
          "Chưa tính DCF/WACC khi thiếu chuỗi dòng tiền, giả định chi phí vốn, tăng trưởng dài hạn và kiểm chứng độ nhạy.",
      },
    ],
    methods: [
      {
        name: "P/E",
        role: "Chính",
        explanation: `${peDisplay}. ${firstWarning(peRatio, "P/E chỉ là chỉ số so sánh, không tự tạo kết luận hành động.")}`,
        confidence: peRatio.value === null ? "Thấp" : confidenceLabel(adjustedConfidence),
      },
      {
        name: "P/B",
        role: "Chỉ tham khảo",
        explanation: `${metricDisplay(pbRatio)}. ${firstWarning(pbRatio, "P/B cần đọc cùng ROE, chất lượng tài sản và đặc thù ngành.")}`,
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
        role: "Đối chiếu",
        explanation: `${metricDisplay(evToEbitda)}. ${firstWarning(evToEbitda, "EV/EBITDA cần đọc cùng capex, nợ và chu kỳ ngành.")}`,
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
          confidence: peRatio.value === null ? "Thấp" : confidenceLabel(adjustedConfidence),
          risk: `Thiếu hoặc yếu: ${compactMissingFields(peRatio.missingFields)}.`,
        },
        {
          method: "P/B",
          keyAssumption: firstWarning(pbRatio, "Chỉ đọc khi BVPS và vốn chủ sở hữu dương."),
          range: metricDisplay(pbRatio),
          confidence: pbRatio.value === null ? "Thấp" : "Trung bình",
          risk: `BVPS: ${metricDisplay(bvps)}. Thiếu hoặc yếu: ${compactMissingFields(pbRatio.missingFields)}.`,
        },
        {
          method: "P/S",
          keyAssumption: firstWarning(psRatio, "Cần đọc cùng biên lợi nhuận và dòng tiền."),
          range: metricDisplay(psRatio),
          confidence: psRatio.value === null ? "Thấp" : "Trung bình",
          risk: `Vốn hóa: ${metricDisplay(marketCap)}. Thiếu hoặc yếu: ${compactMissingFields(psRatio.missingFields)}.`,
        },
        {
          method: "EV/EBITDA",
          keyAssumption: firstWarning(evToEbitda, "Chỉ đọc khi EV và EBITDA dương, dữ liệu nợ và tiền mặt rõ ràng."),
          range: metricDisplay(evToEbitda),
          confidence: evToEbitda.value === null ? "Thấp" : "Trung bình",
          risk: `EV: ${metricDisplay(enterpriseValue)}. Thiếu hoặc yếu: ${compactMissingFields(evToEbitda.missingFields)}.`,
        },
        {
          method: "DCF/WACC",
          keyAssumption: "Chưa đủ dữ liệu để đặt WACC, tăng trưởng dài hạn, FCFF hoặc FCFE.",
          range: "Chưa sẵn sàng",
          confidence: "Thấp",
          risk: "Không tạo fair value giả khi dữ liệu nền chưa đủ.",
        },
      ],
      combinedRange: "Chưa đủ dữ liệu để tính vùng giá trị nội tại",
      explanation:
        "Bảng này hiển thị các chỉ số tương đối từ financial logic core. Vùng giá trị nội tại và margin of safety chỉ được mở khi có fair value hợp lệ và độ tin cậy đủ rõ.",
    },
    scenarios: {
      currentPrice,
      baseRange: "Chưa đủ dữ liệu",
      conclusion:
        "Chưa tính kịch bản giá trị nội tại. Cần bổ sung dữ liệu dòng tiền, nợ vay, nguồn cập nhật và giả định được kiểm chứng trước khi dùng phần này.",
      items: [
        {
          name: "Kịch bản xấu",
          range: "Chưa sẵn sàng",
          explanation: "Chưa đặt kịch bản giảm vì thiếu fair value nền đáng tin cậy.",
          tone: "downside",
        },
        {
          name: "Kịch bản cơ sở",
          range: "Chưa sẵn sàng",
          explanation: "Chỉ có thể đọc các chỉ số tương đối; chưa đủ dữ liệu để tính vùng cơ sở.",
          tone: "base",
        },
        {
          name: "Kịch bản tốt",
          range: "Chưa sẵn sàng",
          explanation: "Không tự tăng giả định để tạo vùng cao khi chưa có mô hình dòng tiền đủ điều kiện.",
          tone: "upside",
        },
      ],
    },
    traps: [
      {
        title: "P/E thấp không tự nói lên định giá hấp dẫn",
        description:
          "Nếu lợi nhuận đang bất thường hoặc EPS không bền, P/E có thể gây hiểu nhầm. Cần đọc cùng chất lượng lợi nhuận và dòng tiền.",
      },
      {
        title: "P/B cần vốn chủ dương",
        description:
          "Khi BVPS hoặc vốn chủ không dương, P/B không phù hợp để diễn giải theo cách thông thường.",
      },
      {
        title: "DCF dễ bị lệch bởi giả định",
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
          ? `Giá hiện tại là ${currentPrice.toLocaleString("vi-VN")} đồng/cp. Chưa có fair value hợp lệ để so sánh trực tiếp.`
          : "Thiếu giá hiện tại nên chưa thể đặt vị trí giá.",
      marginOfSafety:
        "Chưa tính margin of safety vì chưa có fair value hợp lệ và độ tin cậy đủ rõ. Không dùng chỉ số này như kết luận hành động.",
      keyRisk:
        "Rủi ro lớn nhất là dữ liệu thiếu hoặc yếu khiến các chỉ số tương đối bị đọc quá mức. Cần kiểm tra EPS, BVPS, EBITDA, dòng tiền và nguồn dữ liệu.",
      nextStep:
        "Có thể chuyển sang Rủi ro hoặc quay lại BCTC để bổ sung dữ liệu còn thiếu trước khi viết kết luận định giá.",
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
