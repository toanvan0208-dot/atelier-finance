import type {
  AnalysisModuleCompletion,
  ChecklistMode,
  ChecklistQuestionGroup,
  ChecklistTickerState,
  StockChecklistQuestion,
} from "../types";

export const checklistModes: ChecklistMode[] = [
  {
    id: "standard",
    label: "Kiểm tra tiêu chuẩn",
    minQuestions: 25,
    maxQuestions: 35,
    estimatedTime: "8-12 phút",
    description: "Kiểm tra mức hiểu cơ bản nhưng đủ chặt chẽ về cổ phiếu.",
    structure: "24 câu lõi bắt buộc + 5 câu bổ sung theo cổ phiếu/ngành/dữ liệu còn thiếu.",
    bestFor: "Khi cần xác nhận nhanh cổ phiếu đã đủ để theo dõi tiếp hoặc chuẩn bị kiểm tra sâu hơn.",
  },
  {
    id: "full_before_simulation",
    label: "Kiểm tra đầy đủ trước mô phỏng",
    minQuestions: 40,
    maxQuestions: 60,
    estimatedTime: "15-25 phút",
    description: "Kiểm tra toàn diện trước khi đưa cổ phiếu vào Simulation.",
    structure: "38 câu lõi mở rộng + 10 câu bổ sung theo ngành, rủi ro, PVT, định giá và thesis.",
    bestFor: "Khi muốn tạo vị thế giả lập trong tài khoản mô phỏng.",
  },
];

export const checklistQuestionGroups: ChecklistQuestionGroup[] = [
  {
    id: "foundation",
    title: "Dữ liệu nền",
    goal: "Biết đang kiểm tra cổ phiếu nào, vì sao theo dõi và dữ liệu nào quan trọng.",
    relatedModules: ["screening", "business", "watchlist"],
    standardQuestionIds: ["ticker-known", "tracking-reason", "idea-source", "important-data"],
    fullQuestionIds: ["ticker-known", "tracking-reason", "idea-source", "important-data", "required-modules-done", "data-owner"],
  },
  {
    id: "macro-industry",
    title: "Vĩ mô và ngành",
    goal: "Nối cổ phiếu với kênh tác động vĩ mô/ngành rõ ràng.",
    relatedModules: ["macro", "industry"],
    standardQuestionIds: ["macro-sensitive", "industry-phase", "macro-channel-main", "industry-confirmed"],
    fullQuestionIds: ["macro-sensitive", "industry-phase", "macro-channel-main", "industry-confirmed", "short-long-impact", "industry-reversal", "price-reflects-context"],
  },
  {
    id: "business",
    title: "Hiểu doanh nghiệp",
    goal: "Kiểm tra người dùng có thật sự hiểu mô hình kinh doanh không.",
    relatedModules: ["business"],
    standardQuestionIds: ["business-money-source", "main-customer", "main-cost", "competitive-edge"],
    fullQuestionIds: ["business-money-source", "main-customer", "main-cost", "competitive-edge", "dependency-risk", "explain-two-minutes"],
  },
  {
    id: "financials",
    title: "Báo cáo tài chính",
    goal: "Kiểm tra sức khỏe tài chính và chất lượng lợi nhuận.",
    relatedModules: ["financials", "risk"],
    standardQuestionIds: ["revenue-durable", "profit-quality", "cashflow-profit-confirm", "receivable-inventory"],
    fullQuestionIds: ["revenue-durable", "profit-quality", "cashflow-profit-confirm", "receivable-inventory", "debt-pressure", "interest-expense", "profit-cash-mismatch"],
  },
  {
    id: "valuation",
    title: "Định giá",
    goal: "Hiểu cổ phiếu rẻ/đắt dựa trên giả định nào.",
    relatedModules: ["valuation"],
    standardQuestionIds: ["valuation-method", "valuation-assumption", "margin-of-safety", "value-trap"],
    fullQuestionIds: ["valuation-method", "valuation-assumption", "margin-of-safety", "value-trap", "pe-cycle-risk", "pb-asset-risk", "dcf-growth-risk"],
  },
  {
    id: "pvt",
    title: "Price Volume Time",
    goal: "Kiểm tra giá, khối lượng và thời điểm có đang dẫn dắt cảm xúc không.",
    relatedModules: ["technical"],
    standardQuestionIds: ["price-driver", "volume-confirm", "fomo-reason", "event-impact"],
    fullQuestionIds: ["price-driver", "volume-confirm", "fomo-reason", "event-impact", "relative-strength-index", "relative-strength-industry"],
  },
  {
    id: "risk",
    title: "Rủi ro & minh bạch",
    goal: "Kiểm tra yếu tố có thể làm thesis sai.",
    relatedModules: ["risk"],
    standardQuestionIds: ["main-risk", "thesis-break-risk", "disconfirming-data", "governance-risk"],
    fullQuestionIds: ["main-risk", "thesis-break-risk", "disconfirming-data", "governance-risk", "debt-liquidity-risk", "policy-risk", "negative-evidence-written"],
  },
  {
    id: "thesis",
    title: "Thesis và quyết định",
    goal: "Kiểm tra luận điểm có rõ và có điều kiện theo dõi không.",
    relatedModules: ["business", "valuation", "risk", "technical"],
    standardQuestionIds: ["thesis-one-sentence", "confirming-data", "review-milestone", "weakened-thesis-rule", "simulation-reason"],
    fullQuestionIds: ["thesis-one-sentence", "confirming-data", "review-milestone", "weakened-thesis-rule", "simulation-reason", "position-condition", "watchlist-action"],
  },
];

const baseOptions = ["Đã hiểu / Đã có dữ liệu", "Hiểu sơ bộ / Chưa chắc", "Chưa có dữ liệu", "Không biết, cần học thêm"];

export const checklistQuestionTemplates: StockChecklistQuestion[] = [
  q("ticker-known", "foundation", "Tôi có biết doanh nghiệp này thuộc ngành nào không?", "single_choice", "screening"),
  q("tracking-reason", "foundation", "Tôi có biết lý do ban đầu khiến mình theo dõi cổ phiếu này không?", "single_choice", "watchlist"),
  q("idea-source", "foundation", "Nguồn ý tưởng đến từ đâu?", "multiple_choice", "watchlist", false, ["Tự lọc", "Watchlist cũ", "Tin tức", "Báo cáo phân tích", "Chưa rõ"]),
  q("important-data", "foundation", "Dữ liệu nào là quan trọng nhất với cổ phiếu này?", "multiple_choice", "screening", false, ["Doanh thu", "Biên lợi nhuận", "Dòng tiền", "Định giá", "Rủi ro", "PVT"]),
  q("required-modules-done", "foundation", "Tôi đã hoàn thành đủ 8 module phân tích bắt buộc chưa?", "single_choice", "screening"),
  q("data-owner", "foundation", "Tôi biết module nào đang giữ bằng chứng chính cho thesis chưa?", "single_choice", "watchlist"),
  q("macro-sensitive", "macro-industry", "Cổ phiếu này có nhạy với lãi suất, tỷ giá, tín dụng, giá hàng hóa hoặc chính sách không?", "multiple_choice", "macro", false, ["Lãi suất", "Tỷ giá", "Tín dụng", "Giá hàng hóa", "Chính sách", "Chưa rõ"]),
  q("industry-phase", "macro-industry", "Ngành của cổ phiếu này đang ở pha nào?", "single_choice", "industry"),
  q("macro-channel-main", "macro-industry", "Kênh tác động vĩ mô/ngành quan trọng nhất là gì?", "short_text", "macro"),
  q("industry-confirmed", "macro-industry", "Dữ liệu ngành đã xác nhận chưa, hay mới chỉ là kỳ vọng?", "single_choice", "industry"),
  q("short-long-impact", "macro-industry", "Tác động vĩ mô/ngành là ngắn hạn hay dài hạn?", "single_choice", "macro"),
  q("industry-reversal", "macro-industry", "Nếu bối cảnh ngành/vĩ mô đảo chiều, thesis có còn đúng không?", "single_choice", "industry"),
  q("price-reflects-context", "macro-industry", "Giá cổ phiếu đã phản ánh kỳ vọng ngành/vĩ mô đó chưa?", "single_choice", "technical"),
  q("business-money-source", "business", "Doanh nghiệp kiếm tiền chủ yếu từ đâu?", "short_text", "business"),
  q("main-customer", "business", "Khách hàng chính là ai?", "single_choice", "business"),
  q("main-cost", "business", "Chi phí lớn nhất là gì?", "single_choice", "business"),
  q("competitive-edge", "business", "Lợi thế cạnh tranh chính là gì?", "single_choice", "business"),
  q("dependency-risk", "business", "Doanh nghiệp có phụ thuộc vào chu kỳ, chính sách, khách hàng lớn hoặc dự án lớn không?", "multiple_choice", "business"),
  q("explain-two-minutes", "business", "Tôi có thể giải thích doanh nghiệp này trong 2 phút không?", "single_choice", "business"),
  q("revenue-durable", "financials", "Doanh thu tăng có bền không?", "single_choice", "financials"),
  q("profit-quality", "financials", "Lợi nhuận đến từ hoạt động chính hay khoản bất thường?", "single_choice", "financials"),
  q("cashflow-profit-confirm", "financials", "Dòng tiền có xác nhận lợi nhuận không?", "short_text", "financials"),
  q("receivable-inventory", "financials", "Khoản phải thu hoặc hàng tồn kho có tăng bất thường không?", "multiple_choice", "financials"),
  q("debt-pressure", "financials", "Nợ vay có cao không?", "single_choice", "financials"),
  q("interest-expense", "financials", "Chi phí lãi vay có gây áp lực không?", "single_choice", "financials"),
  q("profit-cash-mismatch", "financials", "Có dấu hiệu lợi nhuận đẹp nhưng dòng tiền yếu không?", "single_choice", "financials"),
  q("valuation-method", "valuation", "Tôi đang dùng phương pháp định giá nào?", "multiple_choice", "valuation", false, ["P/E", "P/B", "DCF", "So sánh ngành", "Chưa rõ"]),
  q("valuation-assumption", "valuation", "Cổ phiếu rẻ/đắt dựa trên giả định nào?", "short_text", "valuation"),
  q("margin-of-safety", "valuation", "Biên an toàn có đủ không?", "single_choice", "valuation"),
  q("value-trap", "valuation", "Cổ phiếu có thể là value trap không?", "single_choice", "valuation"),
  q("pe-cycle-risk", "valuation", "P/E thấp có phải do lợi nhuận đang ở đỉnh chu kỳ không?", "single_choice", "valuation"),
  q("pb-asset-risk", "valuation", "P/B thấp có phải do chất lượng tài sản kém không?", "single_choice", "valuation"),
  q("dcf-growth-risk", "valuation", "DCF có quá phụ thuộc vào giả định tăng trưởng dài hạn không?", "single_choice", "valuation"),
  q("price-driver", "pvt", "Giá đang tăng/giảm vì thị trường chung, ngành hay doanh nghiệp?", "single_choice", "technical"),
  q("volume-confirm", "pvt", "Volume tăng có đi kèm dữ liệu cơ bản không?", "single_choice", "technical"),
  q("fomo-reason", "pvt", "Tôi có đang FOMO không, vì sao?", "short_text", "technical"),
  q("event-impact", "pvt", "Có sự kiện nào gần đây làm giá biến động không?", "single_choice", "technical"),
  q("relative-strength-index", "pvt", "So với VN-Index, cổ phiếu đang mạnh hay yếu?", "single_choice", "technical"),
  q("relative-strength-industry", "pvt", "So với ngành, cổ phiếu có thật sự vượt trội không?", "single_choice", "technical"),
  q("main-risk", "risk", "Rủi ro lớn nhất của doanh nghiệp là gì?", "single_choice", "risk"),
  q("thesis-break-risk", "risk", "Điều gì có thể làm thesis của tôi sai?", "short_text", "risk"),
  q("disconfirming-data", "risk", "Dữ liệu phủ định thesis là gì?", "short_text", "risk"),
  q("governance-risk", "risk", "Có rủi ro quản trị, pha loãng, ESOP hoặc giao dịch bên liên quan không?", "multiple_choice", "risk"),
  q("debt-liquidity-risk", "risk", "Có rủi ro nợ vay, thanh khoản, dòng tiền hoặc hàng tồn kho không?", "multiple_choice", "risk"),
  q("policy-risk", "risk", "Có rủi ro ngành hoặc chính sách không?", "single_choice", "risk"),
  q("negative-evidence-written", "risk", "Tôi đã viết ra dữ liệu phủ định thesis chưa?", "single_choice", "risk"),
  q("thesis-one-sentence", "thesis", "Thesis chính của cổ phiếu trong một câu là gì?", "short_text", "business"),
  q("confirming-data", "thesis", "Dữ liệu nào xác nhận thesis?", "multiple_choice", "financials"),
  q("review-milestone", "thesis", "Mốc nào cần xem lại thesis?", "single_choice", "watchlist"),
  q("weakened-thesis-rule", "thesis", "Nếu dữ liệu mới đi ngược thesis, tôi sẽ làm gì?", "single_choice", "risk"),
  q("simulation-reason", "thesis", "Tôi muốn mô phỏng vì hiểu cổ phiếu hay vì sợ lỡ cơ hội?", "single_choice", "technical"),
  q("position-condition", "thesis", "Điều kiện nào phải rõ trước khi đưa cổ phiếu vào mô phỏng?", "multiple_choice", "risk"),
  q("watchlist-action", "thesis", "Nếu chưa đủ dữ liệu, mã này nên được lưu ở trạng thái nào trong Watchlist?", "single_choice", "watchlist"),
];

function q(
  id: string,
  groupId: string,
  questionText: string,
  questionType: StockChecklistQuestion["questionType"],
  relatedModule: StockChecklistQuestion["relatedModule"],
  coreQuestion = true,
  options = baseOptions
): StockChecklistQuestion {
  return {
    id,
    groupId,
    questionText,
    questionType,
    required: coreQuestion,
    coreQuestion,
    relatedModule,
    options: questionType === "short_text" ? undefined : options,
    aiPersonalized: false,
  };
}

const requiredModules: Array<Pick<AnalysisModuleCompletion, "moduleKey" | "moduleName" | "required" | "navigateTo" | "requiredOutputs">> = [
  { moduleKey: "macro", moduleName: "Vĩ mô", required: true, navigateTo: "macro", requiredOutputs: ["Bối cảnh vĩ mô", "Kênh tác động", "Rủi ro vĩ mô"] },
  { moduleKey: "industry", moduleName: "Phân tích ngành", required: true, navigateTo: "industry", requiredOutputs: ["Pha ngành", "Dữ liệu xác nhận", "Rủi ro ngành"] },
  { moduleKey: "screening", moduleName: "Lọc cổ phiếu", required: true, navigateTo: "screening", requiredOutputs: ["Lý do lọc", "Nhóm ứng viên", "Điểm cần kiểm tra"] },
  { moduleKey: "business", moduleName: "Hiểu doanh nghiệp", required: true, navigateTo: "business", requiredOutputs: ["Mô hình kiếm tiền", "Khách hàng/chi phí", "Lợi thế và phụ thuộc"] },
  { moduleKey: "financials", moduleName: "Báo cáo tài chính", required: true, navigateTo: "financials", requiredOutputs: ["Doanh thu/lợi nhuận", "Dòng tiền", "Nợ và vốn lưu động"] },
  { moduleKey: "valuation", moduleName: "Định giá", required: true, navigateTo: "valuation", requiredOutputs: ["Phương pháp", "Giả định chính", "Biên an toàn"] },
  { moduleKey: "technical", moduleName: "Price Volume Time", required: true, navigateTo: "technical", requiredOutputs: ["Giá", "Volume", "Time/Event/FOMO"] },
  { moduleKey: "risk", moduleName: "Rủi ro & minh bạch", required: true, navigateTo: "risk", requiredOutputs: ["Top risks", "Minh bạch", "Dữ liệu phủ định thesis"] },
];

function moduleState(
  moduleKey: AnalysisModuleCompletion["moduleKey"],
  status: AnalysisModuleCompletion["status"],
  completedOutputs: string[],
  missingOutputs: string[] = []
): AnalysisModuleCompletion {
  const base = requiredModules.find((module) => module.moduleKey === moduleKey);
  if (!base) throw new Error(`Unknown module ${moduleKey}`);

  return {
    ...base,
    status,
    completionPercent: Math.round((completedOutputs.length / base.requiredOutputs.length) * 100),
    completedOutputs,
    missingOutputs,
    evidence: completedOutputs.join(", "),
    summary: completedOutputs.length > 0 ? `Đã có ${completedOutputs.length}/${base.requiredOutputs.length} output.` : undefined,
    lastUpdated: status === "not_started" ? undefined : "2026-06-10",
    blockingReason: missingOutputs[0],
  };
}

export const checklistTickerStates: ChecklistTickerState[] = [
  {
    ticker: "MWG",
    companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
    industry: "Bán lẻ",
    currentStatus: "Chưa đủ điều kiện kiểm tra",
    thesis: "MWG cần chứng minh sức mua phục hồi, biên lợi nhuận ổn định và tồn kho không tạo áp lực.",
    confirmingData: ["Doanh thu chuỗi chính phục hồi nhẹ", "Thanh khoản tốt"],
    disconfirmingData: ["Biên an toàn định giá chưa rõ", "Cần kiểm tra tồn kho và dòng tiền"],
    mainRisk: "Sức mua yếu và biên lợi nhuận phục hồi chậm.",
    reviewMilestone: "Sau BCTC quý gần nhất.",
    moduleCompletions: [
      moduleState("macro", "minimum_completed", ["Bối cảnh vĩ mô", "Kênh tác động"]),
      moduleState("industry", "minimum_completed", ["Pha ngành", "Dữ liệu xác nhận"]),
      moduleState("screening", "completed", ["Lý do lọc", "Nhóm ứng viên", "Điểm cần kiểm tra"]),
      moduleState("business", "completed", ["Mô hình kiếm tiền", "Khách hàng/chi phí", "Lợi thế và phụ thuộc"]),
      moduleState("financials", "in_progress", ["Doanh thu/lợi nhuận"], ["Dòng tiền", "Nợ và vốn lưu động"]),
      moduleState("valuation", "in_progress", ["Phương pháp"], ["Giả định chính", "Biên an toàn"]),
      moduleState("technical", "minimum_completed", ["Giá", "Volume"]),
      moduleState("risk", "not_started", [], ["Top risks", "Minh bạch", "Dữ liệu phủ định thesis"]),
    ],
    answers: [],
  },
  {
    ticker: "PNJ",
    companyName: "CTCP Vàng bạc Đá quý Phú Nhuận",
    industry: "Bán lẻ / Trang sức",
    currentStatus: "Đủ điều kiện kiểm tra tiêu chuẩn",
    thesis: "PNJ hưởng lợi nếu sức mua phục hồi và biên lợi nhuận bán lẻ giữ được.",
    confirmingData: ["Doanh thu bán lẻ phục hồi", "Biên gộp chưa giảm mạnh"],
    disconfirmingData: ["Sức mua chưa phục hồi đồng đều", "Giá vàng có thể làm nhu cầu biến động"],
    mainRisk: "Biên lợi nhuận và sức mua hàng không thiết yếu.",
    reviewMilestone: "Khi có BCTC quý hoặc biến động giá vàng mạnh.",
    moduleCompletions: [
      moduleState("macro", "minimum_completed", ["Bối cảnh vĩ mô", "Kênh tác động"]),
      moduleState("industry", "minimum_completed", ["Pha ngành", "Dữ liệu xác nhận"]),
      moduleState("screening", "completed", ["Lý do lọc", "Nhóm ứng viên", "Điểm cần kiểm tra"]),
      moduleState("business", "completed", ["Mô hình kiếm tiền", "Khách hàng/chi phí", "Lợi thế và phụ thuộc"]),
      moduleState("financials", "minimum_completed", ["Doanh thu/lợi nhuận", "Dòng tiền"]),
      moduleState("valuation", "minimum_completed", ["Phương pháp", "Giả định chính"]),
      moduleState("technical", "minimum_completed", ["Giá", "Volume"]),
      moduleState("risk", "minimum_completed", ["Top risks", "Minh bạch"]),
    ],
    answers: seedAnswers("unsure"),
  },
  {
    ticker: "FPT",
    companyName: "Công ty Cổ phần FPT",
    industry: "Công nghệ",
    currentStatus: "Đủ điều kiện kiểm tra đầy đủ",
    thesis: "FPT duy trì tăng trưởng nếu dịch vụ CNTT toàn cầu và chuyển đổi số trong nước tiếp tục mở rộng.",
    confirmingData: ["Tăng trưởng doanh thu dịch vụ CNTT", "Biên lợi nhuận ổn định", "Dòng tiền hoạt động tích cực"],
    disconfirmingData: ["Rủi ro định giá phản ánh kỳ vọng cao", "Tốc độ tăng trưởng có thể chậm lại"],
    mainRisk: "Định giá cao và kỳ vọng tăng trưởng dài hạn.",
    reviewMilestone: "Khi tăng trưởng backlog hoặc biên lợi nhuận thay đổi.",
    moduleCompletions: requiredModules.map((module) =>
      moduleState(module.moduleKey, "completed", module.requiredOutputs)
    ),
    answers: seedAnswers("available"),
  },
];

function seedAnswers(status: "available" | "unsure") {
  return checklistQuestionTemplates.map((question) => ({
    questionId: question.id,
    status,
    selectedOptions: question.options?.slice(0, 1),
    textAnswer: question.questionType === "short_text" ? "Đã có ghi chú mẫu, cần thay bằng dữ liệu thật khi nối backend." : undefined,
    relatedModule: question.relatedModule,
  }));
}
