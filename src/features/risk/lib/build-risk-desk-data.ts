import type {
  MissingDataRiskSummary,
  RiskDisclosureReadiness,
  RiskDisclosureReview,
  RiskRedesignData,
} from "../types";
import type { RiskStatementSnapshot } from "./map-risk-to-logic-input";

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const hasPositiveNumber = (value: number | null | undefined): boolean =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const hasValue = (value: number | string | Date | null | undefined): boolean =>
  value !== null && value !== undefined && value !== "";

const missingFinancialFields = (snapshot: RiskStatementSnapshot): string[] => {
  const fields = [
    ["EPS", snapshot.eps],
    ["totalDebt", snapshot.totalDebt],
    ["equity", snapshot.totalEquity],
    ["sharesOutstanding", snapshot.sharesOutstanding],
    ["revenue", snapshot.revenue],
    ["market price", snapshot.closePrice],
    ["operatingCashFlow", snapshot.operatingCashFlow],
    ["netIncome", snapshot.netProfit],
  ] as const;

  return fields.filter(([, value]) => !hasValue(value)).map(([field]) => field);
};

const unavailableValuationMetrics = (snapshot: RiskStatementSnapshot): string[] => {
  const marketCapUnavailable =
    !hasPositiveNumber(snapshot.closePrice) || !hasPositiveNumber(snapshot.sharesOutstanding);
  const output = [
    ...(!hasPositiveNumber(snapshot.eps) || !hasPositiveNumber(snapshot.closePrice) ? ["P/E"] : []),
    ...(!hasPositiveNumber(snapshot.totalEquity) || !hasPositiveNumber(snapshot.sharesOutstanding)
      ? ["BVPS"]
      : []),
    ...(!hasPositiveNumber(snapshot.totalEquity) ||
    !hasPositiveNumber(snapshot.sharesOutstanding) ||
    !hasPositiveNumber(snapshot.closePrice)
      ? ["P/B"]
      : []),
    ...(marketCapUnavailable ? ["marketCap"] : []),
    ...(!hasPositiveNumber(snapshot.revenue) || marketCapUnavailable ? ["P/S"] : []),
  ];

  return unique(output);
};

const sourceWarnings = (snapshot: RiskStatementSnapshot): string[] =>
  unique([
    "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định.",
    ...(!snapshot.sourceName ? ["Thiếu tên nguồn dữ liệu."] : []),
    ...(!snapshot.collectedAt ? ["Thiếu thời điểm rà soát dữ liệu."] : []),
    ...(!snapshot.period ? ["Thiếu kỳ dữ liệu."] : []),
  ]);

const incompleteContextAreas = [
  "Macro: bối cảnh vĩ mô còn cần dữ liệu đã rà soát.",
  "Industry: bối cảnh ngành còn cần thời điểm dữ liệu rõ.",
  "Business profile: hồ sơ doanh nghiệp còn cần kiểm tra nguồn và trạng thái.",
];

const conclusionWarnings = [
  "Chưa đủ cơ sở để hình thành kết luận nếu dữ liệu còn thiếu hoặc nguồn chưa được rà soát.",
  "Không dùng phần này để kết luận doanh nghiệp/cổ phiếu.",
  "Các chỉ số chưa thể tính cần được giữ ở trạng thái Chưa đủ dữ liệu hoặc N/A.",
];

const whatToCheckNext = [
  "Đối chiếu nguồn và thời điểm của dữ liệu tài chính.",
  "Kiểm tra EPS, totalDebt, equity, sharesOutstanding và market price.",
  "Quay lại Valuation để xem chỉ số nào còn N/A hoặc Chưa đủ dữ liệu.",
  "Kiểm tra bối cảnh ngành và vĩ mô trước khi viết nhận định.",
];

const groupedMissingSummary = (
  summary: MissingDataRiskSummary,
  disclosureReadiness: RiskDisclosureReadiness,
): string => {
  const groups = [
    ...(summary.missingFinancialFields.length ? ["dữ liệu tài chính đầu vào"] : []),
    ...(summary.unavailableValuationMetrics.length ? ["chỉ số định giá chưa thể tính"] : []),
    ...(disclosureReadiness.missingFields.length ? ["nguồn minh bạch/công bố thông tin"] : []),
  ];

  return groups.length
    ? `Cần bổ sung: ${groups.join(", ")}.`
    : "Chưa ghi nhận trường tài chính hoặc minh bạch thiếu trong snapshot hiện tại.";
};

const groupedMissingDetail = (
  summary: MissingDataRiskSummary,
  disclosureReadiness: RiskDisclosureReadiness,
): string[] =>
  unique([
    ...summary.missingFinancialFields,
    ...summary.unavailableValuationMetrics.map((metric) => `${metric} chưa thể tính`),
    ...summary.incompleteContextAreas,
    ...disclosureReadiness.missingFields.map((field) => `Minh bạch: ${field}`),
  ]);

const fallbackDisclosureReview = (ticker: string | null | undefined): RiskDisclosureReview => ({
  ticker: ticker ?? "UNKNOWN",
  auditor: null,
  auditOpinion: null,
  reportPublishedDate: null,
  filingStatus: "unknown",
  relatedPartyNotes: null,
  sourceUrl: null,
  sourceType: "unknown",
  needsReview: true,
  productionApproved: false,
});

const buildDisclosureReadiness = (review: RiskDisclosureReview): RiskDisclosureReadiness => {
  const fields = [
    ["Kiểm toán viên", review.auditor],
    ["Ý kiến kiểm toán", review.auditOpinion],
    ["Ngày công bố báo cáo", review.reportPublishedDate],
    ["Ghi chú giao dịch liên quan", review.relatedPartyNotes],
    ["Đường dẫn nguồn công bố", review.sourceUrl],
  ] as const;
  const availableFields = fields.filter(([, value]) => hasValue(value)).map(([label]) => label);
  const missingFields = fields.filter(([, value]) => !hasValue(value)).map(([label]) => label);
  const hasDisclosureSource = hasValue(review.sourceUrl) && review.sourceType !== "unknown";
  const status: RiskDisclosureReadiness["status"] =
    !hasDisclosureSource
      ? "Thiếu nguồn"
      : review.filingStatus === "available" && missingFields.length === 0
        ? "Đã có nguồn"
        : review.filingStatus === "missing"
          ? "Không đủ cơ sở"
          : "Cần rà soát";
  const tone: RiskDisclosureReadiness["tone"] =
    status === "Đã có nguồn" ? "check" : status === "Thiếu nguồn" || status === "Không đủ cơ sở" ? "missing" : "check";

  return {
    status,
    tone,
    availableFields,
    missingFields,
    reviewNotes: unique([
      review.productionApproved === false ? "Nguồn minh bạch chỉ dùng để rà soát, chưa phải cơ sở kết luận." : "",
      review.needsReview ? "Cần người dùng rà soát nguồn công bố trước khi viết nhận định." : "",
      !hasDisclosureSource ? "Chưa có URL nguồn công bố để đối chiếu." : "",
      review.filingStatus !== "available" ? "Trạng thái công bố chưa đủ rõ để dùng làm kết luận." : "",
    ]),
  };
};

export const buildMissingDataRiskSummary = (
  snapshot: RiskStatementSnapshot,
): MissingDataRiskSummary => {
  const missingFields = missingFinancialFields(snapshot);
  const unavailableMetrics = unavailableValuationMetrics(snapshot);
  const warnings = sourceWarnings(snapshot);
  const overallDataReadiness: MissingDataRiskSummary["overallDataReadiness"] =
    missingFields.length === 0 && unavailableMetrics.length === 0 && warnings.length <= 1
      ? "ready"
      : missingFields.length > 0 || unavailableMetrics.length > 0
        ? "partial"
        : "missing";

  return {
    ticker: snapshot.ticker ?? "UNKNOWN",
    companyName: snapshot.companyName ?? snapshot.ticker ?? "Chưa đủ dữ liệu",
    dataMode: "research_only",
    productionApproved: false,
    overallDataReadiness,
    sourceWarnings: warnings,
    missingFinancialFields: missingFields,
    unavailableValuationMetrics: unavailableMetrics,
    incompleteContextAreas,
    conclusionWarnings,
    whatToCheckNext,
    riskSummaryLabel:
      overallDataReadiness === "ready"
        ? "Có thể phân tích tiếp nhưng còn hạn chế"
        : missingFields.length > 0
          ? "Chưa đủ dữ liệu"
          : "Cần kiểm tra dữ liệu",
  };
};

export const buildRiskDeskData = (
  baseData: RiskRedesignData,
  snapshot: RiskStatementSnapshot,
  disclosureReview: RiskDisclosureReview = baseData.disclosureReview ?? fallbackDisclosureReview(snapshot.ticker),
): RiskRedesignData => {
  const summary = buildMissingDataRiskSummary(snapshot);
  const normalizedDisclosureReview: RiskDisclosureReview = {
    ...fallbackDisclosureReview(snapshot.ticker),
    ...disclosureReview,
    ticker: snapshot.ticker ?? disclosureReview.ticker,
    needsReview: true,
    productionApproved: false,
  };
  const disclosureReadiness = buildDisclosureReadiness(normalizedDisclosureReview);
  const missingEvidence = groupedMissingDetail(summary, disclosureReadiness);

  return {
    ...baseData,
    ticker: summary.ticker,
    companyName: summary.companyName,
    industry: snapshot.industry ?? "Bối cảnh ngành cần kiểm tra",
    disclosureReview: normalizedDisclosureReview,
    disclosureReadiness,
    missingDataSummary: summary,
    overall: {
      status: summary.riskSummaryLabel,
      tone: summary.overallDataReadiness === "ready" ? "check" : "missing",
      conclusion:
        "Phần này tổng hợp dữ liệu còn thiếu, nguồn cần kiểm tra và các điểm dễ kết luận vội. Đây không phải đánh giá cổ phiếu tốt/xấu và không phải khuyến nghị đầu tư.",
    },
    topRisks: [
      {
        id: "missing-financial-fields",
        title: "Dữ liệu tài chính còn thiếu",
        whyItMatters:
          "Thiếu trường dữ liệu khiến các chỉ số liên quan chưa thể tính hoặc chỉ nên đọc như trạng thái cần kiểm tra.",
        priority: "Bổ sung dữ liệu",
        affectedModules: ["Báo cáo tài chính", "Định giá"],
        targetModule: "financials",
        earlyWarnings: summary.missingFinancialFields.length
          ? summary.missingFinancialFields.map((field) => `${field}: Chưa đủ dữ liệu.`)
          : ["Không ghi nhận trường tài chính thiếu trong snapshot hiện tại."],
      },
      {
        id: "unavailable-valuation-metrics",
        title: "Chỉ số định giá chưa thể tính",
        whyItMatters:
          "Chỉ số chưa thể tính vì thiếu dữ liệu đầu vào; hệ thống không diễn giải thay bằng 0 hoặc suy đoán.",
        priority: "Cần kiểm tra",
        affectedModules: ["Định giá"],
        targetModule: "valuation",
        earlyWarnings: summary.unavailableValuationMetrics.length
          ? summary.unavailableValuationMetrics.map(
              (metric) => `${metric}: chỉ số này chưa thể tính vì thiếu dữ liệu đầu vào.`,
            )
          : ["Các chỉ số định giá chính có thể đọc tiếp nhưng vẫn cần kiểm tra nguồn."],
      },
      {
        id: "disclosure-transparency-review",
        title: "Minh bạch công bố thông tin cần rà soát",
        whyItMatters:
          "Trang Risk cần biết nguồn công bố, ý kiến kiểm toán và ghi chú liên quan đã có đủ để kiểm tra hay chưa.",
        priority: disclosureReadiness.status === "Đã có nguồn" ? "Theo dõi" : "Bổ sung dữ liệu",
        affectedModules: ["Công bố thông tin", "Checklist"],
        targetModule: "checklist",
        earlyWarnings: disclosureReadiness.missingFields.length
          ? disclosureReadiness.missingFields.map((field) => `${field}: Chưa đủ dữ liệu.`)
          : disclosureReadiness.reviewNotes,
      },
      {
        id: "source-context-review",
        title: "Nguồn và bối cảnh cần rà soát",
        whyItMatters:
          "Nguồn nghiên cứu hoặc bối cảnh chưa đủ làm tăng rủi ro kết luận vội.",
        priority: "Theo dõi",
        affectedModules: ["Macro", "Industry", "Business"],
        targetModule: "business",
        earlyWarnings: [...summary.sourceWarnings, ...summary.incompleteContextAreas],
      },
    ],
    missingEvidence,
    thesisBreakers: [
      {
        id: "breaker-missing-data",
        label: "Dữ liệu thiếu",
        targetModule: "financials",
        statement:
          "Nếu dữ liệu tài chính còn thiếu, mọi nhận định dựa trên chỉ số liên quan phải dừng ở mức cần kiểm tra.",
      },
      {
        id: "breaker-unavailable-metric",
        label: "Chỉ số chưa thể tính",
        targetModule: "valuation",
        statement:
          "Nếu P/E, P/B, BVPS, marketCap hoặc P/S còn N/A, hệ thống không suy luận thay bằng số 0 hoặc kết luận hành động.",
      },
      {
        id: "breaker-source-context",
        label: "Nguồn/bối cảnh",
        targetModule: "business",
        statement:
          "Nếu nguồn, kỳ dữ liệu hoặc bối cảnh ngành/vĩ mô chưa rõ, nhận định cần ghi rõ giới hạn dữ liệu.",
      },
    ],
    riskSources: [
      {
        id: "financial-missing-data",
        title: "Dữ liệu còn thiếu",
        status: summary.missingFinancialFields.length ? "Chưa đủ dữ liệu" : "Có thể kiểm tra tiếp",
        tone: summary.missingFinancialFields.length ? "missing" : "check",
        defaultOpen: true,
        mainRisk:
          "Các trường thiếu được giữ là Chưa đủ dữ liệu; hệ thống không tự điền 0.",
        evidence: summary.missingFinancialFields.length
          ? summary.missingFinancialFields
          : ["Không ghi nhận trường tài chính thiếu trong snapshot hiện tại."],
        missingData: summary.missingFinancialFields,
        sourceModules: ["Báo cáo tài chính"],
        action: { label: "Kiểm tra dữ liệu tài chính", moduleKey: "financials" },
        nextChecks: ["EPS", "totalDebt", "equity", "sharesOutstanding", "revenue", "market price"],
      },
      {
        id: "source-status",
        title: "Nguồn và trạng thái dữ liệu",
        status: "Dữ liệu nghiên cứu",
        tone: "check",
        defaultOpen: true,
        mainRisk:
          "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định.",
        evidence: summary.sourceWarnings,
        missingData: summary.sourceWarnings.filter((warning) => warning.includes("Thiếu")),
        sourceModules: ["Financials", "Valuation", "Business"],
        action: { label: "Kiểm tra nguồn dữ liệu", moduleKey: "financials" },
        warnings: summary.sourceWarnings,
      },
      {
        id: "disclosure-transparency",
        title: "Minh bạch công bố thông tin",
        status: disclosureReadiness.status,
        tone: disclosureReadiness.tone,
        defaultOpen: true,
        mainRisk:
          "Cần có nguồn công bố, kiểm toán và ghi chú liên quan đủ rõ trước khi dùng phần minh bạch để hỗ trợ nhận định.",
        evidence: disclosureReadiness.availableFields.length
          ? disclosureReadiness.availableFields
          : ["Chưa ghi nhận trường minh bạch đã có nguồn."],
        missingData: disclosureReadiness.missingFields,
        evidenceDetails: normalizedDisclosureReview.fieldEvidence,
        sourceModules: ["Công bố thông tin", "Checklist"],
        action: { label: "Ghi vào checklist minh bạch", moduleKey: "checklist" },
        warnings: disclosureReadiness.reviewNotes,
      },
      {
        id: "unavailable-metrics",
        title: "Chỉ số chưa thể tính",
        status: summary.unavailableValuationMetrics.length
          ? "Chưa đủ dữ liệu"
          : "Có thể kiểm tra tiếp",
        tone: summary.unavailableValuationMetrics.length ? "missing" : "check",
        mainRisk: "Chỉ số này chưa thể tính vì thiếu dữ liệu đầu vào.",
        evidence: summary.unavailableValuationMetrics,
        missingData: summary.unavailableValuationMetrics.map(
          (metric) => `${metric}: thiếu dữ liệu đầu vào.`,
        ),
        relatedMetrics: summary.unavailableValuationMetrics,
        sourceModules: ["Định giá"],
        action: { label: "Kiểm tra chỉ số định giá", moduleKey: "valuation" },
      },
      {
        id: "context-completeness",
        title: "Bối cảnh còn cần kiểm tra",
        status: "Cần kiểm tra thêm",
        tone: "check",
        mainRisk:
          "Bối cảnh còn thiếu dữ liệu đã rà soát, cần kiểm tra thêm trước khi hình thành nhận định.",
        evidence: summary.incompleteContextAreas,
        missingData: summary.incompleteContextAreas,
        sourceModules: ["Macro", "Industry", "Business"],
        action: { label: "Kiểm tra bối cảnh doanh nghiệp", moduleKey: "business" },
      },
      {
        id: "conclusion-risk",
        title: "Câu hỏi trước khi kết luận",
        status: "Cần kiểm tra thêm",
        tone: "check",
        mainRisk:
          "Chưa đủ cơ sở để hình thành kết luận nếu dữ liệu còn thiếu hoặc nguồn chưa được rà soát.",
        evidence: summary.conclusionWarnings,
        missingData: [],
        nextChecks: summary.whatToCheckNext,
        sourceModules: ["Risk"],
        action: { label: "Xem checklist kết luận", moduleKey: "checklist" },
      },
    ],
    transparency: [
      {
        id: "source-review",
        title: "Nguồn dữ liệu",
        status: "Dữ liệu nghiên cứu",
        tone: "check",
        whyItMatters:
          "Nguồn chưa production-approved nên chỉ dùng để đọc hiểu và kiểm tra tiếp.",
        dataToCheck: ["Nguồn dữ liệu", "Thời điểm dữ liệu", "Kỳ dữ liệu", "Trạng thái dữ liệu"],
      },
      {
        id: "disclosure-review",
        title: "Minh bạch công bố",
        status: disclosureReadiness.status,
        tone: disclosureReadiness.tone,
        whyItMatters:
          "Thiếu nguồn công bố/kiểm toán khiến Risk chỉ được dùng như hàng đợi xác minh, không phải kết luận quản trị.",
        dataToCheck: disclosureReadiness.missingFields,
      },
      {
        id: "context-review",
        title: "Bối cảnh",
        status: "Cần kiểm tra thêm",
        tone: "check",
        whyItMatters:
          "Bối cảnh ngành/vĩ mô chưa đủ sẽ khiến nhận định dễ thiếu điều kiện.",
        dataToCheck: summary.incompleteContextAreas,
      },
    ],
    stopConditions: [
      "Dừng kết luận nếu EPS, totalDebt, equity, sharesOutstanding hoặc market price còn thiếu.",
      "Dừng kết luận nếu P/E, P/B, BVPS, marketCap hoặc P/S còn N/A.",
      "Dừng kết luận nếu nguồn hoặc thời điểm dữ liệu chưa rõ.",
      "Dừng kết luận nếu nguồn công bố, ý kiến kiểm toán hoặc ghi chú liên quan chưa được rà soát.",
      "Dừng kết luận nếu bối cảnh ngành/vĩ mô chưa được rà soát.",
    ],
    riskTimeline: {
      shortTerm: ["Kiểm tra ticker và nguồn dữ liệu", "Xác nhận missing fields", "Không thay missing bằng 0"],
      mediumTerm: [
        "Đối chiếu Financials và Valuation",
        "Kiểm tra ngành và bối cảnh vĩ mô",
        "Ghi rõ giới hạn dữ liệu",
      ],
      longTerm: ["Chỉ hình thành nhận định khi nguồn và dữ liệu đầu vào đủ rõ"],
    },
    reverseRiskNote:
      "Rủi ro kết luận vội xuất hiện khi dữ liệu thiếu nhưng người đọc vẫn cố diễn giải. Phần này chỉ giúp giữ lại các câu hỏi cần kiểm tra.",
    finalConclusion: {
      biggestRisk:
        "Điểm cần chú ý nhất là dữ liệu thiếu hoặc nguồn chưa đủ rõ có thể dẫn tới kết luận vội.",
      missingData: groupedMissingSummary(summary, disclosureReadiness),
      thesisBreaker:
        "Nếu chỉ số chưa thể tính hoặc nguồn chưa rõ, nhận định phải dừng ở mức dữ liệu cần kiểm tra.",
      readiness: summary.riskSummaryLabel,
      nextStep:
        "Quay lại Financials, Valuation, Business/Industry/Macro để kiểm tra dữ liệu còn thiếu trước khi viết nhận định.",
    },
    nextActions: [
      { label: "Kiểm tra dữ liệu tài chính", moduleKey: "financials", primary: true },
      { label: "Kiểm tra chỉ số định giá", moduleKey: "valuation" },
      { label: "Xem checklist kết luận", moduleKey: "checklist" },
    ],
  };
};
