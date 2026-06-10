import type { ValuationPageData } from "../types";

export const valuationPageData: ValuationPageData = {
  isLoading: false,
  loading: {
    title: "Đang chuẩn bị dữ liệu định giá",
    content:
      "Hệ thống đang gom dữ liệu mẫu để minh họa cách đọc vùng giá tham khảo.",
  },
  emptyState: {
    title: "Chưa có doanh nghiệp để định giá",
    description:
      "Hãy chuyển từ module Phân tích BCTC sau khi đã đọc dữ liệu sơ bộ.",
    icon: "0",
  },
  detailLabels: {
    detailButtonLabel: "Xem chi tiết",
    collapseButtonLabel: "Thu gọn chi tiết",
    detailChipLabel: "Nâng cao",
  },
  header: {
    moduleName: "Định giá doanh nghiệp",
    ticker: "MWG",
    companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
    industry: "Bán lẻ",
    marketPrice: "42.000",
    status: "Đang phân tích",
    previousContext:
      "Người dùng đã đọc BCTC sơ bộ và chuyển sang định giá để hiểu vùng giá tham khảo, không phải tìm một con số chắc chắn.",
    actions: [
      { label: "Quay lại Phân tích BCTC", variant: "secondary" },
      { label: "Chuyển sang Quản trị rủi ro", variant: "primary" },
    ],
  },
  quickSummary: {
    title: "Bản đồ định giá nhanh",
    description:
      "Tóm tắt vùng giá tham khảo và mức độ tin cậy. Phần này không phải chỉ dẫn giao dịch.",
    icon: "V",
    metrics: [
      {
        title: "Giá thị trường",
        value: "42.000",
        description: "Dữ liệu mẫu hiện tại cho MWG.",
        icon: "M",
        status: "Mẫu",
      },
      {
        title: "Vùng tham khảo",
        value: "37.000-46.000",
        description: "Tổng hợp sau khi đọc các phương pháp định giá.",
        icon: "R",
        status: "Khoảng",
      },
      {
        title: "Độ tin cậy",
        value: "Trung bình",
        description: "Cần kiểm tra lại lợi nhuận chuẩn hóa và biên lợi nhuận.",
        icon: "C",
        status: "Cần đọc thêm",
      },
    ],
    items: [
      { label: "Kịch bản xấu", value: "37.000", tone: "warning" },
      { label: "Kịch bản cơ sở", value: "42.000", tone: "accent" },
      { label: "Kịch bản tốt", value: "52.000", tone: "success" },
      { label: "Trạng thái", value: "Nằm trong vùng tham khảo", tone: "neutral" },
    ],
  },
  groups: [
    {
      id: "inputs",
      label: "Điều kiện và dữ liệu đầu vào",
      question: "Tôi đã có dữ liệu đủ sạch để định giá chưa?",
      summary:
        "Định giá không bắt đầu từ công thức, mà bắt đầu từ dữ liệu đầu vào có sạch hay không.",
      inputRows: [
        { data: "Đã hiểu doanh nghiệp", status: "Có", note: "Đã đi qua module Hiểu doanh nghiệp" },
        { data: "Đã hiểu ngành", status: "Có", note: "Bối cảnh bán lẻ đã được đọc sơ bộ" },
        { data: "Đã hiểu BCTC", status: "Cần kiểm tra", note: "Cần nối lại với module BCTC" },
        { data: "Lợi nhuận chuẩn hóa", status: "Cần kiểm tra", note: "Loại khoản bất thường" },
        { data: "Doanh thu", status: "Có", note: "Dùng cho tăng trưởng" },
        { data: "EBITDA", status: "Có / thiếu", note: "Dùng cho EV/EBITDA" },
        { data: "CFO", status: "Cần kiểm tra", note: "Kiểm tra chất lượng lợi nhuận" },
        { data: "Nợ vay ròng", status: "Cần kiểm tra", note: "Dùng cho EV" },
        { data: "Số cổ phiếu", status: "Có", note: "Dùng tính EPS" },
        { data: "Tăng trưởng kỳ vọng", status: "Cần giả định", note: "Ảnh hưởng mạnh đến vùng giá" },
      ],
      output:
        "Chưa nên đọc kết quả định giá như kết luận chắc chắn nếu lợi nhuận chuẩn hóa, CFO và nợ vay ròng chưa được kiểm chứng.",
    },
    {
      id: "logic",
      label: "Chọn logic định giá",
      question: "Doanh nghiệp này nên định giá bằng phương pháp nào?",
      summary:
        "Cụm này gộp xác định loại hình doanh nghiệp và chọn phương pháp định giá phù hợp.",
      methodRows: [
        { businessType: "Ngân hàng", mainMethod: "P/B + ROE", reason: "Tài sản tài chính là trọng tâm" },
        { businessType: "Bất động sản", mainMethod: "RNAV + P/B", reason: "Giá trị nằm ở dự án/quỹ đất" },
        { businessType: "Bán lẻ", mainMethod: "P/E + EV/EBITDA + DCF đơn giản", reason: "Phụ thuộc doanh thu, biên lợi nhuận, dòng tiền" },
        { businessType: "Công nghệ", mainMethod: "P/E + DCF", reason: "Phụ thuộc tăng trưởng dài hạn" },
        { businessType: "Holding", mainMethod: "SOTP", reason: "Cần tách từng tài sản" },
        { businessType: "Chu kỳ", mainMethod: "P/E chuẩn hóa", reason: "Tránh dùng lợi nhuận đỉnh/đáy chu kỳ" },
      ],
      output:
        "Với MWG, phương pháp chính là P/E, EV/EBITDA và DCF đơn giản; P/B và P/S chỉ dùng tham khảo; RNAV, DDM nâng cao và SOTP không nên là trọng tâm.",
    },
    {
      id: "market-expectation",
      label: "Giá hiện tại và kỳ vọng",
      question: "Giá hiện tại đang phản ánh kỳ vọng gì?",
      summary:
        "Gộp định giá hiện tại, so sánh với lịch sử/ngành và kỳ vọng thị trường đang phản ánh.",
      metricRows: [
        { metric: "P/E", current: "15,8x", comparison: "5 năm: 17,5x", reading: "Thấp hơn lịch sử" },
        { metric: "P/B", current: "2,3x", comparison: "Lịch sử: 2,6x", reading: "Gần trung bình" },
        { metric: "EV/EBITDA", current: "8,6x", comparison: "Ngành: 9,0x", reading: "Cần kiểm tra thêm" },
      ],
      output:
        "Giá hiện tại đang phản ánh kỳ vọng phục hồi vừa phải, chưa quá rẻ cũng chưa quá đắt nếu chỉ nhìn P/E.",
    },
    {
      id: "workbench",
      label: "Tạo vùng giá tham khảo",
      question: "Các phương pháp khác nhau cho ra vùng giá nào?",
      summary:
        "Valuation Workbench gom thực hiện định giá, kịch bản định giá và tổng hợp vùng giá tham khảo. Biên an toàn chưa nằm ở đây.",
      workbenchMethods: [
        {
          method: "P/E",
          inputs: ["Lợi nhuận chuẩn hóa: 3.100-3.500 tỷ", "Số cổ phiếu: dữ liệu mẫu", "P/E hợp lý: 14x-16x"],
          formula: "EPS chuẩn hóa x P/E hợp lý",
          assumptions: "Lợi nhuận phục hồi vừa phải, không dùng khoản bất thường",
          range: "38.000-45.000",
          reliability: "Trung bình",
          failureMode: "Sai khi lợi nhuận bị bóp méo bởi khoản bất thường hoặc đang ở đỉnh/đáy chu kỳ.",
        },
        {
          method: "EV/EBITDA",
          inputs: ["EBITDA chuẩn hóa", "Nợ vay ròng", "EV/EBITDA ngành"],
          formula: "EV hợp lý - nợ vay ròng",
          assumptions: "Cần đọc nợ, thuê tài sản và vốn lưu động",
          range: "37.000-44.000",
          reliability: "Trung bình",
          failureMode: "Dễ sai nếu nợ thuê và vốn lưu động biến động mạnh.",
        },
        {
          method: "DCF đơn giản",
          inputs: ["CFO", "Tăng trưởng", "WACC", "Biên lợi nhuận"],
          formula: "Chiết khấu dòng tiền tương lai",
          assumptions: "Nhạy với tăng trưởng dài hạn và tỷ lệ chiết khấu",
          range: "40.000-48.000",
          reliability: "Trung bình",
          failureMode: "Sai mạnh nếu giả định tăng trưởng dài hạn quá lạc quan.",
        },
      ],
      scenarioRows: [
        { scenario: "Xấu", assumption: "Biên lợi nhuận phục hồi chậm, cạnh tranh cao", range: "37.000", tone: "warning" },
        { scenario: "Cơ sở", assumption: "Lợi nhuận phục hồi vừa phải", range: "42.000", tone: "accent" },
        { scenario: "Tốt", assumption: "Biên lợi nhuận cải thiện rõ", range: "52.000", tone: "success" },
      ],
      output:
        "Vùng giá tham khảo tổng hợp: 37.000-46.000. Đây không phải giá mục tiêu và không phải chỉ dẫn giao dịch.",
    },
    {
      id: "reliability-traps",
      label: "Độ tin cậy và bẫy định giá",
      question: "Vùng giá này đáng tin đến đâu và có thể sai vì điều gì?",
      summary:
        "Cụm này đặt sau khi đã có vùng giá. Biên an toàn được đọc tại đây bằng cách so vùng giá với giá thị trường.",
      reliabilityRows: [
        { method: "P/E", reliability: "Trung bình", reason: "Phù hợp nếu lợi nhuận chuẩn hóa rõ" },
        { method: "EV/EBITDA", reliability: "Trung bình", reason: "Cần đọc nợ, thuê tài sản, vốn lưu động" },
        { method: "DCF", reliability: "Trung bình", reason: "Nhạy với tăng trưởng dài hạn và WACC" },
        { method: "P/B", reliability: "Thấp", reason: "Không phải phương pháp chính cho bán lẻ" },
        { method: "RNAV", reliability: "Thấp", reason: "Không phù hợp với MWG" },
      ],
      catalysts: [
        "Lợi nhuận phục hồi tốt hơn kỳ vọng",
        "Biên lợi nhuận cải thiện",
        "Sức mua bán lẻ phục hồi",
        "Chuỗi mới bớt lỗ hoặc tạo lợi nhuận",
        "Dòng tiền hoạt động cải thiện",
      ],
      risks: [
        "Biên lợi nhuận tiếp tục giảm",
        "Tồn kho tăng",
        "Sức mua yếu",
        "Cạnh tranh giá cao",
        "Dòng tiền yếu",
        "Nợ vay hoặc chi phí tài chính tăng",
      ],
      traps: [
        { trap: "Value trap", meaning: "Rẻ nhưng không có catalyst" },
        { trap: "Cyclicality trap", meaning: "P/E thấp vì lợi nhuận đang ở đỉnh chu kỳ" },
        { trap: "Leverage trap", meaning: "Định giá rẻ nhưng nợ cao làm equity rủi ro" },
        { trap: "Governance trap", meaning: "Doanh nghiệp rẻ vì thị trường không tin quản trị" },
        { trap: "Liquidity trap", meaning: "Rẻ nhưng thanh khoản yếu, khó rerate" },
        { trap: "Earnings quality trap", meaning: "Lợi nhuận đẹp nhưng dòng tiền yếu" },
      ],
      output:
        "Giá thị trường 42.000 đang nằm trong vùng tham khảo 37.000-46.000, vì vậy biên an toàn chưa rõ và cần kiểm tra thêm chất lượng lợi nhuận.",
    },
  ],
  disclaimer: {
    title: "Cảnh báo quan trọng",
    content:
      "Phần Định giá không phải tư vấn đầu tư hay chỉ dẫn giao dịch. Mục tiêu của bước này là giúp bạn hiểu thị trường đang trả giá bao nhiêu cho doanh nghiệp, mức giá hiện tại đang phản ánh kỳ vọng gì và các phương pháp định giá cho ra vùng giá tham khảo nào.",
  },
  nextActions: {
    title: "Bạn đã hiểu vùng định giá và các giả định chính chưa?",
    description:
      "Các nút dưới đây chỉ là điều hướng giao diện, chưa có chức năng thật ở bước này.",
    actions: [
      { label: "Chuyển sang Quản trị rủi ro", variant: "primary" },
      { label: "Thêm vào Watchlist", variant: "secondary" },
      { label: "Ghi chú giả định định giá", variant: "ghost" },
      { label: "Quay lại BCTC", variant: "secondary" },
    ],
  },
};
