import type {
  MacroDashboardItem,
  MacroGuidanceCopy,
  MacroSectionCopy,
  MacroMapNode,
  MacroMetricCard,
  MacroSignal,
  MacroTableRow,
  MacroTabsCopy,
  MacroTopic,
} from "../types";

export const macroGuidance: MacroGuidanceCopy = {
  insight: {
    eyebrow: "Kết luận dễ hiểu",
    title: "Bối cảnh vĩ mô đang phục hồi nhẹ, nhưng chưa đủ đồng đều.",
    description:
      "Lạm phát đã bớt căng, lãi suất dễ thở hơn và sản xuất có dấu hiệu cải thiện. Tuy vậy tỷ giá, tín dụng và sức mua vẫn cần theo dõi trước khi kết luận thị trường thuận lợi hoàn toàn.",
  },
  explanation: {
    title: "Vì sao bước Vĩ mô quan trọng?",
    summary:
      "Vĩ mô giúp bạn biết thị trường đang có gió thuận hay gió ngược trước khi chọn ngành và cổ phiếu.",
    details: [
      "Nếu lãi suất giảm, chi phí vốn của doanh nghiệp và áp lực định giá thường dễ chịu hơn.",
      "Nếu tỷ giá căng, nhóm nhập khẩu, vay ngoại tệ hoặc phụ thuộc vốn ngoại có thể chịu áp lực.",
      "Nếu tín dụng và sức mua cải thiện, một số ngành tiêu dùng, bán lẻ, ngân hàng hoặc sản xuất có thể được hưởng lợi.",
    ],
  },
  nextStep: {
    title: "Tiếp theo nên xem ngành nào hưởng lợi từ bối cảnh này.",
    description:
      "Sau khi hiểu vĩ mô, hãy chuyển sang module Ngành để xem nhóm nào được hỗ trợ và nhóm nào cần thận trọng.",
    actionLabel: "Xem module Ngành",
  },
  summary: {
    title: "Tóm tắt nhanh module Vĩ mô",
    items: [
      {
        label: "Bạn vừa biết gì?",
        value: "Nền kinh tế đang phục hồi nhẹ, lạm phát hạ nhiệt và lãi suất bớt căng.",
      },
      {
        label: "Điểm tích cực",
        value: "Mặt bằng chi phí vốn dễ chịu hơn có thể hỗ trợ định giá và hoạt động kinh doanh.",
      },
      {
        label: "Rủi ro cần theo dõi",
        value: "Tỷ giá, tín dụng thực chảy vào nền kinh tế và sức mua chưa nên bỏ qua.",
      },
      {
        label: "Bước tiếp theo",
        value: "Chuyển sang phân tích ngành để tìm nhóm hưởng lợi hoặc chịu áp lực.",
      },
    ],
  },
};

export const macroOverview = {
  eyebrow: "Chương 2",
  icon: "◈",
  title: "Vĩ mô",
  description:
    "Đọc bối cảnh lớn trước khi đi vào ngành và doanh nghiệp. Module này giúp người mới nhận diện thuận gió, ngược gió và dữ liệu cần kiểm chứng.",
};

export const macroSections: Record<"map" | "layers", MacroSectionCopy> = {
  map: {
    icon: "M",
    title: "Bản đồ Nhận định",
  },
  layers: {
    icon: "3",
    title: "Ba lớp đọc vĩ mô",
  },
};

export const macroTabsCopy: MacroTabsCopy = {
  ariaLabel: "Các lớp vĩ mô",
  global: {
    tabLabel: "Vĩ mô toàn cầu",
    icon: "W",
    title: "Chi phí vốn, USD và chu kỳ hàng hóa",
    chip: "Toàn cầu",
  },
  vietnam: {
    tabLabel: "Vĩ mô Việt Nam",
    icon: "VN",
    title: "Tăng trưởng, tiền tệ, tỷ giá và tín dụng",
    chip: "Việt Nam",
  },
  warning: {
    tabLabel: "Dashboard cảnh báo sớm",
    icon: "E",
    title: "Early warning dashboard",
    chip: "Theo dõi định kỳ",
  },
};

export const macroMapNodes: MacroMapNode[] = [
  {
    id: "current",
    title: "Hiện tại",
    description: "Phục hồi chậm",
    position: "center",
  },
  {
    id: "liquidity",
    title: "Dòng tiền",
    description: "Đang dần nóng",
    position: "left",
  },
  {
    id: "inflation",
    title: "Lạm phát",
    description: "Hạ nhiệt ổn định",
    position: "top",
  },
  {
    id: "credit",
    title: "Tín dụng",
    description: "Cần quan sát",
    position: "right",
  },
];

export const globalMacroTopics: MacroTopic[] = [
  {
    id: "fed-usd-yield",
    title: "Fed / USD / lợi suất",
    description:
      "Lãi suất và USD mạnh/yếu ảnh hưởng dòng vốn vào thị trường mới nổi, tỷ giá và định giá cổ phiếu.",
    active: true,
  },
  {
    id: "china-trade",
    title: "Trung Quốc và thương mại",
    description:
      "Bất động sản, sản xuất, đồng CNY và xuất khẩu rẻ của Trung Quốc truyền sang Việt Nam qua đơn hàng và cạnh tranh.",
  },
  {
    id: "commodities",
    title: "Hàng hóa đầu vào",
    description:
      "Dầu, khí, thép, phân bón, nông sản và logistics tác động trực tiếp đến biên lợi nhuận ngành.",
  },
  {
    id: "risk-regime",
    title: "Risk-on / risk-off",
    description:
      "Thị trường đang mua tăng trưởng hay trú ẩn? Đây là lớp bối cảnh trước khi đọc một cổ phiếu tăng mạnh.",
  },
];

export const vietnamMacroMetricCards: MacroMetricCard[] = [
  {
    id: "growth",
    title: "Tăng trưởng kinh tế",
    icon: "↗",
    value: "5.05%",
    period: "Q4/23",
    status: "Phục hồi",
    metrics: [
      { label: "IIP / sản xuất", value: "+5.8%" },
      { label: "PMI", value: "50.4" },
      { label: "Tổng mức bán lẻ", value: "+9.4%" },
      { label: "Xuất nhập khẩu", value: "+6.7%" },
    ],
  },
];

export const vietnamMacroRows: MacroTableRow[] = [
  {
    factor: "Tăng trưởng",
    currentState: "Phục hồi nhưng chưa đồng đều",
    watchPoint: "Sản xuất, bán lẻ, xuất nhập khẩu và tín dụng thực chảy vào nền kinh tế.",
  },
  {
    factor: "Tiền tệ",
    currentState: "Mặt bằng lãi suất đã hạ so với giai đoạn căng thẳng",
    watchPoint: "Lãi suất huy động, tín dụng mới, thanh khoản hệ thống.",
  },
  {
    factor: "Tỷ giá",
    currentState: "Ổn định là điều kiện quan trọng cho định giá",
    watchPoint: "USD/VND, DXY, dòng vốn ngoại, chênh lệch lãi suất.",
  },
  {
    factor: "Lạm phát",
    currentState: "Hạ nhiệt nhưng vẫn cần theo dõi nhóm nhạy cảm",
    watchPoint: "Năng lượng, lương thực, chi phí vận tải, chính sách giá.",
  },
];

export const warningDashboardItems: MacroDashboardItem[] = [
  {
    id: "monthly",
    icon: "M",
    title: "Dashboard tháng",
    description:
      "GDP proxy, PMI, IIP, bán lẻ, CPI, xuất nhập khẩu, tín dụng, tỷ giá và lãi suất liên ngân hàng.",
    cadence: "Monthly",
  },
  {
    id: "quarterly",
    icon: "Q",
    title: "Dashboard quý",
    description:
      "So BCTC doanh nghiệp với dữ liệu vĩ mô: doanh thu có đi cùng ngành không, biên lợi nhuận có bị chi phí vốn/hàng hóa bóp méo không?",
    cadence: "Quarterly",
    active: true,
  },
  {
    id: "crisis",
    icon: "C",
    title: "Dashboard khủng hoảng",
    description:
      "USD/VND căng, thanh khoản hệ thống thiếu, forced selling, dòng vốn ngoại rút mạnh hoặc tin chính sách bất thường.",
    cadence: "Crisis",
  },
];

export const macroSignals: MacroSignal[] = [
  {
    id: "green",
    label: "Tín hiệu xanh",
    description:
      "Tăng trưởng phục hồi, lạm phát kiểm soát, tỷ giá ổn, tín dụng đi vào hoạt động sản xuất kinh doanh.",
  },
  {
    id: "yellow",
    label: "Tín hiệu vàng",
    description:
      "Dữ liệu trái chiều: giá cổ phiếu tăng nhưng đơn hàng, sức mua hoặc dòng tiền doanh nghiệp chưa xác nhận.",
  },
  {
    id: "red",
    label: "Tín hiệu đỏ",
    description:
      "Tỷ giá căng, lãi suất tăng nhanh, dòng tiền rút khỏi nhóm rủi ro, doanh nghiệp có nợ/dòng tiền yếu.",
  },
  {
    id: "learning-action",
    label: "Hành động học tập",
    description:
      "Không kết luận mua/bán. Gắn cảnh báo vào Ngành, BCTC, Định giá, Watchlist và Nhật ký.",
  },
];
