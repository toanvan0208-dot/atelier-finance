import type {
  ExplanationDepth,
  InterfaceMode,
  KnowledgeLevel,
  PersonalAnalysisProfile,
  ProfileGoal,
  ProfileOption,
  RiskAppetite,
} from "./types";

export const PERSONAL_ANALYSIS_PROFILE_STORAGE_KEY = "personalAnalysisProfile";

export const defaultPersonalAnalysisProfile: PersonalAnalysisProfile = {
  knowledgeLevel: "beginner",
  goal: "learn",
  riskAppetite: "conservative",
  interfaceMode: "guided",
  explanationDepth: "detailed",
  updatedAt: "",
};

export const knowledgeLevelOptions: Array<ProfileOption<KnowledgeLevel>> = [
  {
    value: "beginner",
    label: "Mới bắt đầu",
    description: "Ưu tiên dẫn đường, thuật ngữ dễ hiểu, popup cách đọc và checklist từng bước.",
  },
  {
    value: "basic",
    label: "Biết cơ bản",
    description: "Giữ giải thích vừa đủ, nhắc khái niệm quan trọng và giảm phần quá nhập môn.",
  },
  {
    value: "intermediate",
    label: "Trung bình",
    description: "Ưu tiên dashboard, số liệu chính và đường tắt để xem chi tiết nhanh.",
  },
  {
    value: "advanced",
    label: "Muốn xem chi tiết hơn",
    description: "Cho phép mở thêm bảng, metric nâng cao và giả định phân tích sâu.",
  },
];

export const goalOptions: Array<ProfileOption<ProfileGoal>> = [
  {
    value: "learn",
    label: "Học cách phân tích cổ phiếu",
    description: "Đi theo lộ trình đầy đủ, nhiều giải thích và câu hỏi tự kiểm tra.",
  },
  {
    value: "track_one_stock",
    label: "Theo dõi một mã cổ phiếu",
    description: "Ưu tiên dashboard tổng quan, thay đổi đáng chú ý và watchlist.",
  },
  {
    value: "compare_stocks",
    label: "So sánh nhiều mã",
    description: "Ưu tiên tiêu chí so sánh, dữ liệu còn thiếu và điểm khác biệt chính.",
  },
  {
    value: "build_watchlist",
    label: "Xây dựng watchlist",
    description: "Ưu tiên lọc ý tưởng, lý do theo dõi và bước kiểm chứng tiếp theo.",
  },
  {
    value: "prepare_decision",
    label: "Chuẩn bị quyết định đầu tư",
    description: "Ưu tiên checklist, rủi ro, biên an toàn và ghi nhận thesis cá nhân.",
  },
];

export const riskAppetiteOptions: Array<ProfileOption<RiskAppetite>> = [
  {
    value: "conservative",
    label: "Thận trọng",
    description: "Nhấn mạnh rủi ro, minh bạch, dòng tiền, nợ vay, biên an toàn và FOMO check.",
  },
  {
    value: "balanced",
    label: "Cân bằng",
    description: "Giữ cân bằng giữa cơ hội, rủi ro, định giá và bằng chứng cần kiểm tra.",
  },
  {
    value: "aggressive",
    label: "Chấp nhận rủi ro cao",
    description: "Cho xem nhiều kịch bản hơn, nhưng vẫn nhắc rõ rủi ro đi kèm.",
  },
];

export const interfaceModeOptions: Array<ProfileOption<InterfaceMode>> = [
  {
    value: "guided",
    label: "Dẫn đường từng bước",
    description: "Mặc định mở guided, nhiều câu hỏi cần hiểu gì và CTA theo thứ tự rõ.",
  },
  {
    value: "dashboard",
    label: "Dashboard nhanh",
    description: "Ưu tiên command center, số liệu chính trước, giải thích để trong drawer.",
  },
  {
    value: "deep_dive",
    label: "Chi tiết chuyên sâu",
    description: "Cho phép mở nhiều dữ liệu hơn và hiển thị metric nâng cao nếu có.",
  },
];

export const explanationDepthOptions: Array<ProfileOption<ExplanationDepth>> = [
  {
    value: "detailed",
    label: "Giải thích kỹ",
    description: "Nhiều helper text, popup hướng dẫn và ví dụ dễ hiểu.",
  },
  {
    value: "balanced",
    label: "Vừa đủ",
    description: "Giữ giải thích ngắn gọn nhưng vẫn đủ ngữ cảnh để tự kiểm tra.",
  },
  {
    value: "brief",
    label: "Tóm tắt ngắn",
    description: "Giảm mô tả dài, ưu tiên số liệu và kết luận có điều kiện.",
  },
];

export const coreAnalysisRoute = [
  "Vĩ mô",
  "Ngành",
  "Doanh nghiệp",
  "Báo cáo tài chính",
  "Định giá",
  "Rủi ro & minh bạch",
  "Price Volume Time",
  "Checklist cuối",
];

export function getOptionLabel<T extends string>(
  options: Array<ProfileOption<T>>,
  value: T
) {
  return options.find((option) => option.value === value)?.label ?? value;
}
