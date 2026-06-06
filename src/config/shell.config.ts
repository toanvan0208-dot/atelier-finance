export const shellConfig = {
  brandName: "Macro Thesis",
  title: "Hệ thống hỗ trợ Đầu tư",
  defaultModuleKey: "macro",
  journey: {
    kicker: "Lộ trình học",
    description: "Đi từng bước để hiểu dữ liệu trước khi mô phỏng quyết định.",
  },
  mainContent: {
    kicker: "Nền móng giao diện",
    title: "Module hiện tại",
    status: "Shell",
    description:
      "Khu vực nội dung chính đã sẵn sàng để gắn từng module sản phẩm. Ở bước này chưa render Vĩ mô, Ngành, BCTC hay AI Chat.",
  },
  assistant: {
    title: "Trợ giảng",
    messages: [
      {
        variant: "accent",
        content:
          "Panel này mới là khung hiển thị. Logic AI Chat sẽ được nối ở bước sau.",
      },
      {
        variant: "neutral",
        content:
          "Mục tiêu hiện tại: giữ layout sạch, tách dữ liệu điều hướng khỏi component và chuẩn bị chỗ cho module học tập.",
      },
    ],
  },
  topbarActions: [
    {
      key: "search",
      label: "Tìm kiếm",
      icon: "⌕",
    },
    {
      key: "notifications",
      label: "Thông báo",
      icon: "◌",
    },
    {
      key: "account",
      label: "Tài khoản",
      icon: "□",
    },
  ],
  moduleJourney: {
    self: {
      stepNumber: 1,
      totalSteps: 9,
      plainDescription: "Xác định mục tiêu, khẩu vị rủi ro và cách bạn muốn học trước khi xem dữ liệu.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Sau bước này, hãy đọc bối cảnh vĩ mô để biết thị trường đang thuận hay ngược gió.",
    },
    macro: {
      stepNumber: 2,
      totalSteps: 9,
      plainDescription: "Hiểu nền kinh tế hiện tại đang ủng hộ hay gây bất lợi cho thị trường chứng khoán.",
      status: "Đang xem",
      nextSuggestion: "Tiếp theo nên xem ngành nào hưởng lợi hoặc chịu áp lực từ bối cảnh này.",
    },
    industry: {
      stepNumber: 3,
      totalSteps: 9,
      plainDescription: "Nhìn ngành theo ngôn ngữ dễ hiểu trước khi đi vào các yếu tố chuyên sâu.",
      status: "Tiếp theo",
      nextSuggestion: "Sau khi hiểu ngành, hãy lọc cổ phiếu phù hợp để phân tích sâu hơn.",
    },
    screening: {
      stepNumber: 4,
      totalSteps: 9,
      plainDescription: "Tạo danh sách cổ phiếu ứng viên, không biến kết quả lọc thành khuyến nghị mua bán.",
      status: "Đang xây dựng",
      nextSuggestion: "Chọn một cổ phiếu dễ hiểu rồi chuyển sang phân tích doanh nghiệp.",
    },
    business: {
      stepNumber: 5,
      totalSteps: 9,
      plainDescription: "Hiểu doanh nghiệp kiếm tiền bằng cách nào và rủi ro chính nằm ở đâu.",
      status: "Đang xây dựng",
      nextSuggestion: "Nếu mô hình kinh doanh đủ rõ, hãy kiểm chứng bằng báo cáo tài chính.",
    },
    financials: {
      stepNumber: 6,
      totalSteps: 9,
      plainDescription: "Kiểm tra sức khỏe tài chính, dòng tiền, nợ vay và chất lượng lợi nhuận.",
      status: "Đang xây dựng",
      nextSuggestion: "Dữ liệu đáng tin hơn sẽ được chuyển sang bước định giá.",
    },
    valuation: {
      stepNumber: 7,
      totalSteps: 9,
      plainDescription: "Ước lượng giá trị hợp lý bằng giả định rõ ràng và thận trọng.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Sau định giá, cần kiểm tra rủi ro và biên an toàn.",
    },
    technical: {
      stepNumber: 8,
      totalSteps: 9,
      plainDescription: "Đọc hành vi giá, khối lượng và thời điểm để tránh mua bán cảm tính.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Kết hợp với rủi ro trước khi đưa vào watchlist hoặc mô phỏng.",
    },
    risk: {
      stepNumber: 9,
      totalSteps: 9,
      plainDescription: "Kiểm tra điều gì có thể sai trước khi ghi nhận kết luận cá nhân.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Nếu còn điểm chưa rõ, quay lại checklist trước khi mô phỏng.",
    },
  },
};
