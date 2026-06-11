import type {
  AIExplanationLevelId,
  JourneyModeId,
  RouteGoalId,
  RouteOption,
  StuckPoint,
} from "../types";

export const routeGoalOptions: Array<RouteOption & { id: RouteGoalId }> = [
  {
    id: "learn_from_scratch",
    title: "Tôi muốn học đầu tư từ đầu",
    description: "Dành cho người mới, muốn hiểu nền tảng trước khi phân tích cổ phiếu.",
    suitableWhen: ["Bạn chưa quen thuật ngữ tài chính.", "Bạn muốn đi chậm và chắc.", "Bạn muốn quiz cơ bản."],
    suggestedPath: ["Học tập", "Vĩ mô cơ bản", "Ngành cơ bản", "Hiểu doanh nghiệp", "BCTC cơ bản", "Watchlist"],
  },
  {
    id: "analyze_stock",
    title: "Tôi muốn phân tích một cổ phiếu cụ thể",
    description: "Dành cho người đã có mã cổ phiếu trong đầu và muốn đi theo quy trình phân tích.",
    suitableWhen: ["Bạn đã có mã muốn tìm hiểu.", "Bạn cần kiểm tra doanh nghiệp, BCTC, định giá và rủi ro.", "Bạn muốn tạo thesis rõ ràng."],
    suggestedPath: ["Hiểu doanh nghiệp", "BCTC", "Định giá", "Rủi ro", "PVT", "Checklist", "Mô phỏng", "Watchlist"],
  },
  {
    id: "find_ideas",
    title: "Tôi muốn tìm ngành hoặc cổ phiếu đáng theo dõi",
    description: "Dành cho người chưa biết chọn cổ phiếu nào, muốn đi từ vĩ mô đến ngành rồi lọc ý tưởng.",
    suitableWhen: ["Bạn chưa có mã cụ thể.", "Bạn muốn xem ngành nào cần phân tích tiếp.", "Bạn muốn tạo Watchlist có lý do."],
    suggestedPath: ["Vĩ mô", "Bản đồ ngành", "Phân tích ngành", "Lọc cổ phiếu", "Watchlist"],
  },
  {
    id: "simulate_first",
    title: "Tôi muốn mô phỏng trước khi dùng tiền thật",
    description: "Dành cho người muốn luyện thesis, vị thế giả lập, theo dõi dữ liệu mới và hậu kiểm.",
    suitableWhen: ["Bạn muốn luyện quyết định trước.", "Bạn muốn học từ sai lầm mà không mất tiền.", "Bạn cần mốc xem lại và hậu kiểm."],
    suggestedPath: ["Checklist", "Thesis Builder", "Mô phỏng", "Hậu kiểm", "Watchlist"],
  },
  {
    id: "review_decision",
    title: "Tôi muốn kiểm tra lại một quyết định",
    description: "Dành cho người đã có ý định hành động/theo dõi một mã và muốn kiểm tra lại dữ liệu, rủi ro, cảm xúc.",
    suitableWhen: ["Bạn muốn tránh quyết định vội.", "Bạn cần kiểm tra định giá và rủi ro.", "Bạn nghi ngờ mình đang FOMO."],
    suggestedPath: ["Checklist", "Rủi ro", "Định giá", "PVT", "Mô phỏng"],
  },
  {
    id: "research_project",
    title: "Tôi muốn làm đồ án/nghiên cứu/học tập",
    description: "Dành cho người dùng hệ thống để học, làm prototype, nghiên cứu hoặc trình bày quy trình.",
    suitableWhen: ["Bạn muốn xem toàn bộ hệ thống.", "Bạn cần luồng rõ để trình bày.", "Bạn muốn có ví dụ mô phỏng và hậu kiểm."],
    suggestedPath: ["Tổng quan", "Học tập", "Vĩ mô", "Ngành", "Mô phỏng", "Hậu kiểm"],
  },
];

export const journeyModeOptions: Array<RouteOption & { id: JourneyModeId }> = [
  {
    id: "step_by_step",
    title: "Hướng dẫn từng bước",
    description: "Hệ thống dẫn bạn đi tuần tự, giải thích từng module, phù hợp với người mới.",
    suitableWhen: ["Bạn chưa có quy trình phân tích rõ.", "Bạn muốn học chậm và chắc.", "Bạn không muốn bỏ sót bước quan trọng."],
    suggestedPath: ["Tổng quan", "Cấu hình", "Học tập", "Phân tích", "Checklist"],
  },
  {
    id: "fast_to_gap",
    title: "Đi nhanh đến phần còn thiếu",
    description: "Hệ thống giúp bạn bỏ qua phần đã biết và tập trung vào phần còn thiếu.",
    suitableWhen: ["Bạn đã biết một phần quy trình.", "Bạn đang phân tích một mã cụ thể.", "Bạn muốn tiết kiệm thời gian."],
    suggestedPath: ["Điểm vướng", "Module liên quan", "Checklist", "Mô phỏng"],
  },
  {
    id: "learn_first",
    title: "Học trước rồi phân tích",
    description: "Hệ thống ưu tiên bài học ngắn và quiz trước khi mở module phân tích sâu.",
    suitableWhen: ["Bạn mới bắt đầu.", "Bạn chưa hiểu thuật ngữ tài chính.", "Bạn muốn học chắc nền tảng."],
    suggestedPath: ["Học tập", "Quiz", "Vĩ mô", "Ngành", "BCTC"],
  },
  {
    id: "analyze_first",
    title: "Phân tích trước, học khi vướng",
    description: "Bạn đi vào module phân tích ngay. Khi gặp phần khó, AI sẽ gợi ý bài học đúng lúc.",
    suitableWhen: ["Bạn muốn thực hành trước.", "Bạn không thích học lý thuyết dài.", "Bạn muốn AI hỗ trợ trong quá trình làm."],
    suggestedPath: ["Module chính", "Micro hint", "Học nhanh", "Checklist"],
  },
  {
    id: "simulate_review",
    title: "Mô phỏng và hậu kiểm",
    description: "Hệ thống ưu tiên thesis, vị thế giả lập, hậu kiểm và bài học sau mô phỏng.",
    suitableWhen: ["Bạn muốn luyện quyết định.", "Bạn muốn học từ sai lầm.", "Bạn cần hậu kiểm quy trình."],
    suggestedPath: ["Checklist", "Mô phỏng", "Hậu kiểm", "Watchlist"],
  },
];

export const aiExplanationOptions: Array<RouteOption & { id: AIExplanationLevelId }> = [
  {
    id: "plain_language",
    title: "Rất dễ hiểu, ít thuật ngữ",
    description: "AI giải thích bằng ngôn ngữ đơn giản, ví dụ đời thường, tránh thuật ngữ phức tạp.",
    suitableWhen: ["Người mới bắt đầu.", "Người chưa quen tài chính."],
    suggestedPath: ["Giải thích đơn giản", "Ví dụ đời thường", "Nhắc thuật ngữ ít nhất"],
  },
  {
    id: "basic_with_examples",
    title: "Cơ bản, có ví dụ",
    description: "AI giải thích vừa đủ, có ví dụ cổ phiếu/ngành/BCTC, vẫn hạn chế thuật ngữ khó.",
    suitableWhen: ["Bạn biết vài khái niệm như doanh thu, lợi nhuận, P/E.", "Bạn cần ví dụ để hiểu nhanh."],
    suggestedPath: ["Khái niệm", "Ví dụ", "Câu hỏi kiểm tra"],
  },
  {
    id: "more_detail",
    title: "Chi tiết hơn",
    description: "AI giải thích sâu hơn về kênh truyền dẫn, dữ liệu cần kiểm chứng, rủi ro và liên kết module.",
    suitableWhen: ["Bạn đã từng phân tích.", "Bạn muốn hệ thống hóa quy trình."],
    suggestedPath: ["Dữ liệu", "Rủi ro", "Liên kết module"],
  },
  {
    id: "key_points_only",
    title: "Tôi đã biết, chỉ cần nhắc ý chính",
    description: "AI chỉ nhắc điểm cần kiểm tra, cảnh báo bẫy và hành động tiếp theo.",
    suitableWhen: ["Bạn không muốn đọc quá nhiều.", "Bạn chỉ cần checklist nhanh."],
    suggestedPath: ["Điểm chính", "Cảnh báo", "Hành động"],
  },
];

export const stuckPoints: StuckPoint[] = [
  { id: "macro", label: "Tôi không hiểu vĩ mô ảnh hưởng cổ phiếu như thế nào.", lesson: "Lãi suất ảnh hưởng cổ phiếu thế nào?" },
  { id: "industry", label: "Tôi không biết ngành nào hưởng lợi từ bối cảnh hiện tại.", lesson: "Vĩ mô đi vào ngành như thế nào?" },
  { id: "financials", label: "Tôi không biết đọc báo cáo tài chính.", lesson: "BCTC cho người mới bắt đầu" },
  { id: "cashflow", label: "Tôi hay nhìn lợi nhuận mà bỏ qua dòng tiền.", lesson: "Vì sao lợi nhuận cao nhưng dòng tiền yếu?" },
  { id: "valuation", label: "Tôi không biết định giá cổ phiếu.", lesson: "P/E là gì?" },
  { id: "pe_trap", label: "Tôi hay nghĩ P/E thấp là rẻ.", lesson: "P/E thấp có phải cổ phiếu rẻ không?", warning: "Hệ thống sẽ nhắc bạn kiểm tra value trap trước khi kết luận rẻ." },
  { id: "pvt", label: "Tôi không biết giá/volume nên dùng để làm gì.", lesson: "Giá tăng mạnh có phải doanh nghiệp tốt hơn không?" },
  { id: "fomo", label: "Tôi dễ FOMO khi cổ phiếu tăng mạnh.", lesson: "FOMO trong đầu tư là gì?", warning: "Hệ thống sẽ nhắc bạn viết thesis trước khi nhìn lãi/lỗ." },
  { id: "rumor", label: "Tôi hay mua theo tin đồn hoặc nhóm chat.", lesson: "Tin đồn và dữ liệu khác nhau thế nào?", warning: "Hệ thống sẽ nhắc bạn phân biệt dữ liệu và cảm xúc." },
  { id: "risk", label: "Tôi không biết rủi ro nào quan trọng.", lesson: "Checklist rủi ro trước khi đi tiếp" },
  { id: "thesis", label: "Tôi chưa có thói quen viết thesis.", lesson: "Thesis đầu tư là gì?" },
  { id: "simulation", label: "Tôi chưa biết khi nào nên mô phỏng.", lesson: "Mô phỏng trước khi dùng tiền thật" },
  { id: "checklist", label: "Tôi chưa biết checklist trước quyết định gồm gì.", lesson: "Checklist không phải tín hiệu giao dịch" },
];

export const industryChoices = [
  "Ngân hàng",
  "Chứng khoán",
  "Bất động sản",
  "Bán lẻ",
  "Thép",
  "Dầu khí",
  "Điện",
  "Cảng biển",
  "Dệt may",
  "Thủy sản",
  "Hàng không",
];
