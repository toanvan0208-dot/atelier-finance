import type {
  ScreenerDataReadiness,
  ScreeningCandidateGroupKey,
  ScreeningGuideTone,
  ScreeningReadinessCheck,
  ScreeningReadinessCheckKey,
} from "../types";

export type ScreeningMetricKey = "P/E" | "P/B" | "Nợ vay" | "Rủi ro" | "Nguồn";
export type RedesignedGateStatus = "Có thể tính" | "Cần bổ sung dữ liệu" | "Chưa thể tính";

export type RedesignedScreeningCandidate = ScreenerDataReadiness & {
  group: ScreeningCandidateGroupKey;
  groupLabel: string;
  fitLabel: string;
  reason: string;
  checkFlags: string[];
  nextStep: string;
  metrics: Record<ScreeningMetricKey, string>;
};

export type RedesignedScreeningGate = {
  id: ScreeningReadinessCheckKey;
  shortLabel: string;
  title: string;
  question: string;
  beforeCount: number;
  afterCount: number;
  status: RedesignedGateStatus;
  shortReason: string;
  passedTickers: string[];
  watchTickers: string[];
  rejectedTickers: string[];
  whyItMatters: string;
  dataUsed: string[];
  beginnerMistake: string;
  example: string;
  nextModuleNote: string;
};

export type RedesignedResultGroup = {
  key: ScreeningCandidateGroupKey;
  title: string;
  description: string;
  tone: ScreeningGuideTone;
  defaultOpen: boolean;
};

const SOURCE_WARNING =
  "Dữ liệu hiện tại là dữ liệu nghiên cứu hoặc đã rà soát thủ công, chưa phải dữ liệu chính thức để ra quyết định.";
const NO_ZERO_FILL_WARNING =
  "Chưa đủ dữ liệu để kết luận. Hệ thống không tự điền 0 hoặc suy đoán dữ liệu thiếu.";

function check(
  key: ScreeningReadinessCheckKey,
  label: string,
  status: ScreeningReadinessCheck["status"],
  explanation: string
): ScreeningReadinessCheck {
  return { key, label, status, explanation };
}

const readinessChecksReady: ScreeningReadinessCheck[] = [
  check("company_info", "Có thông tin doanh nghiệp", "available", "Có tên doanh nghiệp, sàn và ngành trong phạm vi hệ thống."),
  check("related_industry", "Có ngành liên quan", "available", "Đã nối với ngành MVP tương ứng."),
  check("financials", "Có dữ liệu tài chính", "available", "Có dữ liệu tài chính nghiên cứu trong app để đọc tiếp."),
  check("eps", "Có EPS", "available", "Có EPS candidate đã rà soát thủ công; nguồn chưa phê duyệt sản xuất."),
  check("total_debt", "Có nợ vay", "available", "Có totalDebt candidate đã rà soát thủ công; không dùng totalLiabilities thay thế."),
  check("shares_outstanding", "Có số cổ phiếu", "available", "Có sharesOutstanding candidate đã rà soát thủ công."),
  check("pe", "Có thể tính P/E", "available", "EPS và dữ liệu cổ phiếu đủ điều kiện để mở kiểm tra P/E."),
  check("pb", "Có thể tính P/B", "available", "Equity và số cổ phiếu đủ điều kiện để mở kiểm tra P/B."),
  check("risk_readiness", "Có dữ liệu rủi ro", "partial", "Risk có thể đọc dữ liệu đầu vào nhưng vẫn không phải kết luận an toàn/rủi ro đầu tư."),
  check("source_status_as_of", "Có source/status/asOf cơ bản", "partial", "Có metadata nghiên cứu, nhưng chưa production-approved."),
];

function buildCandidate({
  companyName,
  exchange,
  industry,
  relatedIndustryKey,
  sector,
  ticker,
  whatToCheckNext,
}: {
  ticker: "FPT" | "MWG" | "VNM";
  companyName: string;
  exchange: string;
  sector: string;
  industry: string;
  relatedIndustryKey: string;
  whatToCheckNext: string[];
}): RedesignedScreeningCandidate {
  const availableFields = [
    "Thông tin doanh nghiệp",
    "Ngành liên quan",
    "Dữ liệu tài chính nghiên cứu",
    "EPS candidate",
    "Nợ vay candidate",
    "Số cổ phiếu candidate",
    "Equity/BVPS logic để kiểm tra P/B",
    "Market/PVT research rows",
  ];
  const missingFields = [
    "Nguồn đã phê duyệt sản xuất",
    "Rà soát pháp lý nguồn",
    "asOf cụ thể cho dữ liệu nguồn",
    "dữ liệu realtime/chính thức",
  ];

  return {
    ticker,
    companyName,
    exchange,
    sector,
    industry,
    relatedIndustryKey,
    dataStatus: "ready",
    dataMode: "research_only",
    productionApproved: false,
    availableFields,
    missingFields,
    readinessChecks: readinessChecksReady,
    canContinueAnalysis: true,
    canCalculatePE: true,
    canCalculatePB: true,
    canAssessDebt: true,
    canAssessRisk: true,
    canCalculateShareMetrics: true,
    warnings: [SOURCE_WARNING, NO_ZERO_FILL_WARNING],
    explanationForBeginner:
      "Mã này có đủ dữ liệu tối thiểu để tiếp tục đọc doanh nghiệp, BCTC, định giá và rủi ro; trạng thái này không nói cổ phiếu tốt/xấu.",
    whatToCheckNext,
    readinessLabel: "Đủ dữ liệu để phân tích tiếp",
    readinessScoreLabel: "Mức đủ dữ liệu",
    readinessScore: availableFields.length,
    sourceStatus: "Dữ liệu nghiên cứu / candidate đã rà soát thủ công, nguồn chưa phê duyệt sản xuất",
    sourceAsOf: null,
    group: "priority",
    groupLabel: "Đủ dữ liệu để phân tích tiếp",
    fitLabel: "Dữ liệu có thể phân tích tiếp",
    reason:
      "Có đủ nhóm dữ liệu tối thiểu để chuyển sang bước doanh nghiệp/BCTC, nhưng chưa có source approval để kết luận.",
    checkFlags: [...missingFields, ...whatToCheckNext.slice(0, 2)],
    nextStep: "Phân tích tiếp ở module doanh nghiệp hoặc xem dữ liệu tài chính.",
    metrics: {
      "P/E": "Có thể tính",
      "P/B": "Có thể tính",
      "Nợ vay": "Có thể kiểm tra",
      "Rủi ro": "Có thể rà soát",
      "Nguồn": "Dữ liệu nghiên cứu",
    },
  };
}

const candidates: RedesignedScreeningCandidate[] = [
  buildCandidate({
    ticker: "FPT",
    companyName: "CTCP FPT",
    exchange: "HOSE",
    sector: "Công nghệ thông tin",
    industry: "Công nghệ thông tin / Dịch vụ công nghệ",
    relatedIndustryKey: "information_technology",
    whatToCheckNext: ["Doanh thu theo mảng", "Biên lợi nhuận", "Tỷ trọng doanh thu nước ngoài", "Dòng tiền"],
  }),
  buildCandidate({
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    exchange: "HOSE",
    sector: "Bán lẻ",
    industry: "Bán lẻ",
    relatedIndustryKey: "retail",
    whatToCheckNext: ["Doanh thu cùng cửa hàng", "Biên lợi nhuận gộp", "Hàng tồn kho", "Dòng tiền hoạt động"],
  }),
  buildCandidate({
    ticker: "VNM",
    companyName: "CTCP Sữa Việt Nam",
    exchange: "HOSE",
    sector: "Hàng tiêu dùng thiết yếu",
    industry: "Sữa / hàng tiêu dùng thiết yếu",
    relatedIndustryKey: "dairy_consumer_staples",
    whatToCheckNext: ["Doanh thu", "Biên lợi nhuận gộp", "Chi phí bán hàng", "Dòng tiền"],
  }),
];

export const screeningRedesignData = {
  header: {
    title: "Bước 3 — Lọc theo mức độ đủ dữ liệu",
    description:
      "Bảng này chỉ cho biết mã nào đang có đủ dữ liệu để tiếp tục phân tích. Đây không phải bảng xếp hạng cổ phiếu tốt/xấu và không phải khuyến nghị đầu tư.",
  },
  guide: {
    title: "Đọc kết quả lọc dữ liệu như thế nào?",
    points: [
      "Screener chỉ lọc theo mức độ đủ dữ liệu, không chấm điểm ra quyết định.",
      "Thứ tự này chỉ phản ánh mức độ đủ dữ liệu, không phải xếp hạng đầu tư.",
      "Mã có đủ dữ liệu vẫn cần đọc tiếp doanh nghiệp, BCTC, định giá và rủi ro.",
      "Mã thiếu dữ liệu không được tự điền 0 hoặc suy đoán dữ liệu còn thiếu.",
    ],
  },
  quickCheck: {
    title: "Kiểm tra nhanh mã trong phạm vi MVP",
    placeholder: "Nhập mã: FPT, MWG hoặc VNM",
    buttonLabel: "Kiểm tra dữ liệu",
    emptyError: "Vui lòng nhập một mã cổ phiếu.",
    missingError: "Screener MVP chỉ có dữ liệu cho FPT, MWG và VNM.",
  },
  defaultInputSource: {
    sourceModule: "industry",
    label: "Ngành đã chuẩn hóa",
    industryName: "FPT / MWG / VNM",
    selectedIndustryGroup: "Ba ngành MVP liên quan đến FPT, MWG và VNM",
    inputTickers: ["FPT", "MWG", "VNM"],
    industryContext: ["Công nghệ thông tin", "Bán lẻ", "Sữa / hàng tiêu dùng thiết yếu"],
    industryRole: "Rổ mã đầu vào chỉ dùng để kiểm tra mức đủ dữ liệu, không phải danh sách ưu tiên đầu tư.",
    riskFactorsToCheck: ["Nguồn dữ liệu", "EPS", "Nợ vay", "Số cổ phiếu", "P/E", "P/B", "Rủi ro"],
    suggestedScreeningCriteria: [
      "Có thông tin doanh nghiệp",
      "Có ngành liên quan",
      "Có dữ liệu tài chính",
      "Có EPS, nợ vay và số cổ phiếu",
      "Có thể mở kiểm tra P/E/P/B",
    ],
  },
  activeQuery: {
    sentence: "Tôi đang lọc FPT, MWG và VNM theo mức độ đủ dữ liệu để tiếp tục phân tích.",
    criteria: [
      { label: "Phạm vi", value: "FPT, MWG, VNM", description: "Chỉ ba mã trọng tâm của MVP." },
      { label: "Cách sắp xếp", value: "Mức đủ dữ liệu", description: "Không phải thứ hạng đầu tư." },
      { label: "Dữ liệu", value: "Dữ liệu nghiên cứu", description: "Nguồn chưa phê duyệt sản xuất." },
      { label: "Điểm dừng", value: "Chưa kết luận", description: "Chỉ chuyển sang module sau khi đủ điều kiện đọc tiếp." },
    ],
  },
  quickStats: [
    { label: "Mã đầu vào", count: 3 },
    { label: "Đủ dữ liệu để phân tích tiếp", count: 3 },
    { label: "Cần bổ sung dữ liệu", count: 0 },
    { label: "Nguồn đã phê duyệt", count: 0 },
  ],
  gates: [
    {
      id: "company_info",
      shortLabel: "Doanh nghiệp",
      title: "Thông tin doanh nghiệp",
      question: "Mã có tên doanh nghiệp, sàn và ngành cơ bản chưa?",
      beforeCount: 3,
      afterCount: 3,
      status: "Có thể tính",
      shortReason: "FPT, MWG và VNM đều có thông tin doanh nghiệp tối thiểu trong hệ thống.",
      passedTickers: ["FPT", "MWG", "VNM"],
      watchTickers: [],
      rejectedTickers: [],
      whyItMatters: "Không có thông tin doanh nghiệp thì không nên chuyển sang phân tích sâu.",
      dataUsed: ["ticker", "companyName", "exchange", "sector"],
      beginnerMistake: "Nhìn mã trước khi biết doanh nghiệp làm gì.",
      example: "FPT thuộc công nghệ, MWG thuộc bán lẻ, VNM thuộc sữa/hàng thiết yếu.",
      nextModuleNote: "Nếu thiếu, quay lại dữ liệu doanh nghiệp trước khi đọc BCTC.",
    },
    {
      id: "related_industry",
      shortLabel: "Ngành",
      title: "Ngành liên quan",
      question: "Mã có nối được với ngành MVP hiện có không?",
      beforeCount: 3,
      afterCount: 3,
      status: "Có thể tính",
      shortReason: "Ba mã đều nối được với một industryKey trong Industry MVP.",
      passedTickers: ["FPT", "MWG", "VNM"],
      watchTickers: [],
      rejectedTickers: [],
      whyItMatters: "Ngành giúp biết câu hỏi nào cần kiểm tra tiếp, không phải kết luận ngành tốt/xấu.",
      dataUsed: ["relatedIndustryKey", "industry"],
      beginnerMistake: "Dùng ngành như kết luận thay vì bối cảnh.",
      example: "MWG nối với retail nên cần xem sức mua, tồn kho và biên gộp.",
      nextModuleNote: "Nếu chưa rõ ngành, mở module Industry.",
    },
    {
      id: "financials",
      shortLabel: "Tài chính",
      title: "Dữ liệu tài chính tối thiểu",
      question: "Mã có dữ liệu tài chính để đọc tiếp không?",
      beforeCount: 3,
      afterCount: 3,
      status: "Có thể tính",
      shortReason: "Ba mã có dữ liệu tài chính nghiên cứu để mở phân tích tiếp.",
      passedTickers: ["FPT", "MWG", "VNM"],
      watchTickers: [],
      rejectedTickers: [],
      whyItMatters: "Thiếu BCTC thì không thể kiểm tra doanh thu, lợi nhuận, nợ và dòng tiền.",
      dataUsed: ["financials readiness", "availableFields"],
      beginnerMistake: "Chỉ đọc câu chuyện ngành mà không đọc BCTC.",
      example: "Screener không hiển thị số BCTC mới; chỉ cho biết có thể mở bước đọc tiếp.",
      nextModuleNote: "Mở module Financials để kiểm tra chi tiết.",
    },
    {
      id: "pe",
      shortLabel: "P/E",
      title: "Khả năng tính P/E",
      question: "EPS có đủ điều kiện để mở kiểm tra P/E không?",
      beforeCount: 3,
      afterCount: 3,
      status: "Có thể tính",
      shortReason: "EPS candidate có sẵn; nếu EPS thiếu hoặc <= 0 thì P/E sẽ bị khóa.",
      passedTickers: ["FPT", "MWG", "VNM"],
      watchTickers: [],
      rejectedTickers: [],
      whyItMatters: "P/E chỉ có ý nghĩa khi EPS hợp lệ và còn phải đọc nguồn dữ liệu.",
      dataUsed: ["EPS", "market data readiness"],
      beginnerMistake: "Thấy có thể tính P/E rồi diễn giải như tín hiệu hành động.",
      example: "Có thể tính nghĩa là đủ input kỹ thuật, không phải kết luận định giá.",
      nextModuleNote: "Mở Valuation để đọc trạng thái guardrail.",
    },
    {
      id: "risk_readiness",
      shortLabel: "Rủi ro",
      title: "Risk readiness",
      question: "Có đủ dữ liệu để bắt đầu rà soát rủi ro không?",
      beforeCount: 3,
      afterCount: 3,
      status: "Cần bổ sung dữ liệu",
      shortReason: "Có thể rà soát rủi ro, nhưng risk vẫn là trạng thái kiểm tra tiếp và không kết luận an toàn.",
      passedTickers: ["FPT", "MWG", "VNM"],
      watchTickers: ["FPT", "MWG", "VNM"],
      rejectedTickers: [],
      whyItMatters: "Risk cần xem nợ, dòng tiền, nguồn dữ liệu và missing fields.",
      dataUsed: ["totalDebt", "cash-flow readiness", "source status"],
      beginnerMistake: "Xem risk như tem an toàn.",
      example: "Có nợ vay candidate giúp mở kiểm tra leverage, nhưng không biến thành kết luận.",
      nextModuleNote: "Mở Risk để đọc checklist và missing fields.",
    },
  ] satisfies RedesignedScreeningGate[],
  resultGroups: [
    {
      key: "priority",
      title: "Đủ dữ liệu để phân tích tiếp",
      description: "Có đủ dữ liệu tối thiểu để mở bước doanh nghiệp, BCTC, định giá và rủi ro.",
      tone: "pass",
      defaultOpen: true,
    },
    {
      key: "watch",
      title: "Cần bổ sung dữ liệu",
      description: "Nhóm này sẽ dùng khi một mã thiếu dữ liệu quan trọng.",
      tone: "watch",
      defaultOpen: true,
    },
    {
      key: "not-fit",
      title: "Chưa đủ dữ liệu",
      description: "Nhóm này sẽ dùng khi thiếu dữ liệu nền tảng.",
      tone: "neutral",
      defaultOpen: false,
    },
  ] satisfies RedesignedResultGroup[],
  candidates,
  termTips: {
    "P/E": "Chỉ có thể mở kiểm tra khi EPS hợp lệ; không phải kết luận định giá.",
    "P/B": "Chỉ có thể mở kiểm tra khi equity và số cổ phiếu hợp lệ.",
    "Nợ vay": "Dùng totalDebt candidate; không relabel totalLiabilities thành nợ vay.",
    "Rủi ro": "Trạng thái để rà soát tiếp, không phải tem an toàn.",
    "Nguồn": "Dữ liệu nghiên cứu hoặc manual reviewed vẫn chưa phê duyệt sản xuất.",
  } satisfies Record<ScreeningMetricKey, string>,
  analysisPath: ["Xem doanh nghiệp", "Xem dữ liệu tài chính", "Kiểm tra định giá", "Kiểm tra PVT", "Kiểm tra rủi ro", "Thêm vào Watchlist"],
  nextPanel:
    "Screener chỉ xác định mức đủ dữ liệu để đi tiếp. Kết quả này không phải bảng xếp hạng đầu tư và không thay thế phân tích từng module.",
};

export const candidatesByTicker = Object.fromEntries(
  screeningRedesignData.candidates.map((candidate) => [candidate.ticker, candidate])
) as Record<string, RedesignedScreeningCandidate>;
