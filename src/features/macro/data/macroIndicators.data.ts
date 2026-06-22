import type { MacroIndicator } from "../lib/macro-indicator-contract";

const missingMetadataWarnings = [
  "Chưa có bản ghi nguồn đã rà soát.",
  "Thiếu giá trị, đơn vị, kỳ dữ liệu hoặc mốc cập nhật; trạng thái được giữ là chưa đủ dữ liệu.",
];

export const macroIndicators: readonly MacroIndicator[] = [
  {
    indicatorKey: "gdp_growth",
    name: "Tăng trưởng GDP",
    value: null,
    unit: null,
    period: null,
    asOf: null,
    sourceName: null,
    sourceLabel: null,
    dataMode: "missing",
    productionApproved: false,
    status: "missing",
    explanationForBeginner:
      "GDP cho biết nền kinh tế đang mở rộng hay chậm lại. Đây là chỉ báo tổng quát, không đủ để kết luận riêng cho một cổ phiếu.",
    whyItMatters:
      "Tốc độ tăng trưởng chung có thể ảnh hưởng khác nhau đến nhu cầu, doanh thu và kế hoạch đầu tư của từng ngành.",
    whatToCheckNext: "Đối chiếu tăng trưởng của ngành và doanh thu doanh nghiệp với cùng kỳ dữ liệu GDP.",
    warnings: missingMetadataWarnings,
  },
  {
    indicatorKey: "cpi",
    name: "CPI / Lạm phát",
    value: null,
    unit: null,
    period: null,
    asOf: null,
    sourceName: null,
    sourceLabel: null,
    dataMode: "missing",
    productionApproved: false,
    status: "missing",
    explanationForBeginner:
      "CPI phản ánh thay đổi mặt bằng giá tiêu dùng. Lạm phát có thể ảnh hưởng đến sức mua, chi phí đầu vào và chính sách lãi suất.",
    whyItMatters:
      "Doanh nghiệp có khả năng chuyển chi phí sang giá bán khác nhau, nên tác động lên biên lợi nhuận cần được kiểm tra theo ngành.",
    whatToCheckNext: "Kiểm tra sức mua, giá nguyên liệu và biên lợi nhuận của ngành hoặc doanh nghiệp.",
    warnings: missingMetadataWarnings,
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
    value: null,
    unit: null,
    period: null,
    asOf: null,
    sourceName: null,
    sourceLabel: null,
    dataMode: "missing",
    productionApproved: false,
    status: "missing",
    explanationForBeginner:
      "Tỷ giá ảnh hưởng đến doanh nghiệp có doanh thu, chi phí, vay nợ hoặc nguyên liệu nhập khẩu bằng ngoại tệ.",
    whyItMatters:
      "Tác động phụ thuộc vào cơ cấu doanh thu, chi phí và nghĩa vụ ngoại tệ, không chỉ phụ thuộc vào hướng biến động tỷ giá.",
    whatToCheckNext: "Kiểm tra tỷ trọng xuất nhập khẩu, dư nợ ngoại tệ và chính sách phòng ngừa rủi ro tỷ giá.",
    warnings: missingMetadataWarnings,
  },
] as const;
