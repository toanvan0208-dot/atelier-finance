import type { MacroIndicator } from "../lib/macro-indicator-contract";

const missingMetadataWarnings = [
  "Chưa có bản ghi nguồn đã rà soát.",
  "Thiếu giá trị, đơn vị, kỳ dữ liệu hoặc mốc cập nhật; trạng thái được giữ là chưa đủ dữ liệu.",
];

export const macroIndicators: readonly MacroIndicator[] = [
  {
    indicatorKey: "gdp_growth",
    name: "Tăng trưởng GDP",
    value: 7.09118746633975,
    unit: "% YoY",
    period: "2024",
    asOf: "2026-04-08",
    sourceName: "World Bank",
    sourceLabel: "World Development Indicators — GDP growth (annual %)",
    sourceRef: "https://api.worldbank.org/v2/country/VNM/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=5",
    dataMode: "manual_reviewed",
    productionApproved: false,
    status: "available",
    explanationForBeginner:
      "GDP cho biết nền kinh tế đang mở rộng hay chậm lại. Đây là chỉ báo tổng quát, không đủ để kết luận riêng cho một cổ phiếu.",
    whyItMatters:
      "Tốc độ tăng trưởng chung có thể ảnh hưởng khác nhau đến nhu cầu, doanh thu và kế hoạch đầu tư của từng ngành.",
    whatToCheckNext: "Đối chiếu tăng trưởng của ngành và doanh thu doanh nghiệp với cùng kỳ dữ liệu GDP.",
    warnings: [
      "Dữ liệu lịch sử năm 2024, được rà soát thủ công từ API; không đại diện cho GDP hiện tại.",
      "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định.",
    ],
  },
  {
    indicatorKey: "cpi",
    name: "CPI / Lạm phát",
    value: 3.62109273885843,
    unit: "% YoY",
    period: "2024",
    asOf: "2026-04-08",
    sourceName: "World Bank",
    sourceLabel: "World Development Indicators — Inflation, consumer prices (annual %)",
    sourceRef: "https://api.worldbank.org/v2/country/VNM/indicator/FP.CPI.TOTL.ZG?format=json&per_page=5",
    dataMode: "manual_reviewed",
    productionApproved: false,
    status: "available",
    explanationForBeginner:
      "CPI phản ánh thay đổi mặt bằng giá tiêu dùng. Lạm phát có thể ảnh hưởng đến sức mua, chi phí đầu vào và chính sách lãi suất.",
    whyItMatters:
      "Doanh nghiệp có khả năng chuyển chi phí sang giá bán khác nhau, nên tác động lên biên lợi nhuận cần được kiểm tra theo ngành.",
    whatToCheckNext: "Kiểm tra sức mua, giá nguyên liệu và biên lợi nhuận của ngành hoặc doanh nghiệp.",
    warnings: [
      "Dữ liệu lịch sử năm 2024, được rà soát thủ công từ API; không đại diện cho CPI hiện tại.",
      "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định.",
    ],
  },
  {
    indicatorKey: "policy_rate",
    name: "Lãi suất",
    value: null,
    unit: null,
    period: null,
    asOf: null,
    sourceName: null,
    sourceLabel: null,
    sourceRef: null,
    dataMode: "missing",
    productionApproved: false,
    status: "missing",
    explanationForBeginner:
      "Lãi suất ảnh hưởng đến chi phí vốn, chi phí vay và định giá tài sản tài chính. Doanh nghiệp có nợ vay cao thường cần được kiểm tra kỹ hơn khi lãi suất thay đổi.",
    whyItMatters:
      "Biến động chi phí vay có thể ảnh hưởng đến lợi nhuận, dòng tiền và kế hoạch mở rộng của doanh nghiệp.",
    whatToCheckNext: "Kiểm tra nợ vay, chi phí lãi vay, dòng tiền và nhu cầu vốn của doanh nghiệp.",
    warnings: missingMetadataWarnings,
  },
  {
    indicatorKey: "usd_vnd",
    name: "Tỷ giá USD/VND",
    value: 24164.8858333333,
    unit: "VND/USD, bình quân kỳ",
    period: "2024",
    asOf: "2026-04-08",
    sourceName: "World Bank",
    sourceLabel: "World Development Indicators — Official exchange rate (LCU per US$, period average)",
    sourceRef: "https://api.worldbank.org/v2/country/VNM/indicator/PA.NUS.FCRF?format=json&per_page=5",
    dataMode: "manual_reviewed",
    productionApproved: false,
    status: "available",
    explanationForBeginner:
      "Tỷ giá ảnh hưởng đến doanh nghiệp có doanh thu, chi phí, vay nợ hoặc nguyên liệu nhập khẩu bằng ngoại tệ.",
    whyItMatters:
      "Tác động phụ thuộc vào cơ cấu doanh thu, chi phí và nghĩa vụ ngoại tệ, không chỉ phụ thuộc vào hướng biến động tỷ giá.",
    whatToCheckNext: "Kiểm tra tỷ trọng xuất nhập khẩu, dư nợ ngoại tệ và chính sách phòng ngừa rủi ro tỷ giá.",
    warnings: [
      "Đây là tỷ giá chính thức bình quân năm 2024, không phải tỷ giá giao ngay hoặc thời gian thực.",
      "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định.",
    ],
  },
] as const;
