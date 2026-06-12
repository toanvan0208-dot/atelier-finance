export const shellConfig = {
  brandName: "Macro Thesis",
  title: "Hệ thống hỗ trợ Đầu tư",
  defaultModuleKey: "overview",
  journey: {
    kicker: "Lộ trình đầu tư",
    description: "Đi từng bước để hiểu dữ liệu, kiểm tra rủi ro và mô phỏng có kỷ luật.",
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
    overview: {
      stepNumber: 0,
      totalSteps: 15,
      plainDescription: "Theo dõi toàn bộ lộ trình phân tích, dữ liệu còn thiếu, học tập, watchlist, mô phỏng và checklist.",
      status: "Mặc định",
      nextSuggestion: "Mở Hồ sơ phân tích để hệ thống điều chỉnh cách giải thích theo nhu cầu hôm nay.",
    },
    "route-config": {
      stepNumber: 1,
      totalSteps: 9,
      plainDescription: "Chọn mục tiêu hôm nay, cách đi qua hệ thống, mức AI giải thích và điểm đang vướng.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Sau bước này, hãy đọc bối cảnh vĩ mô để biết thị trường đang thuận hay ngược gió.",
    },
    learning: {
      stepNumber: 1,
      totalSteps: 13,
      plainDescription: "Học đúng kiến thức đang thiếu trong quá trình phân tích, có quiz ngắn và gợi ý quay lại module liên quan.",
      status: "Xuyên suốt",
      nextSuggestion: "Chọn bài được AI gợi ý hôm nay, sau đó quay lại module phân tích để áp dụng ngay.",
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
      plainDescription: "Tạo danh sách cổ phiếu ứng viên, không biến kết quả lọc thành kết luận hành động.",
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
      nextSuggestion: "Sau định giá, cần kiểm tra rủi ro, minh bạch và biên an toàn.",
    },
    risk: {
      stepNumber: 8,
      totalSteps: 9,
      plainDescription: "Kiểm tra điều gì có thể sai trước khi đọc hành vi giá và ghi nhận kết luận cá nhân.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Nếu rủi ro chính đã rõ, chuyển sang PVT để quan sát giá, volume, sự kiện và FOMO.",
    },
    technical: {
      stepNumber: 9,
      totalSteps: 9,
      plainDescription: "Đọc hành vi giá, khối lượng và thời điểm để tránh hành động cảm tính.",
      status: "Chưa bắt đầu",
      nextSuggestion: "Kết hợp với rủi ro trước khi đưa vào watchlist, checklist hoặc mô phỏng.",
    },
    simulation: {
      stepNumber: 10,
      totalSteps: 10,
      plainDescription: "Ghi nhận thesis, tạo vị thế theo dõi giả lập và hậu kiểm bài học trước khi quay lại checklist.",
      status: "Đang xây dựng",
      nextSuggestion: "Theo dõi giả lập theo mốc xem lại, sau đó ghi nhật ký để học từ nguyên nhân đúng sai.",
    },
    watchlist: {
      stepNumber: 11,
      totalSteps: 11,
      plainDescription: "Lưu ý tưởng cần kiểm tra, theo dõi tiến độ phân tích, dữ liệu còn thiếu và bước tiếp theo.",
      status: "Đang xây dựng",
      nextSuggestion: "Khi thesis đủ rõ, chuyển sang Mô phỏng; khi còn thiếu dữ liệu, quay lại module liên quan.",
    },
  },
};
