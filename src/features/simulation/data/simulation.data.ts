import type { SimulationExperienceData } from "../types";

export const simulationExperienceData: SimulationExperienceData = {
  title: "Mô phỏng đầu tư",
  subtitle:
    "Phòng tập tư duy đầu tư: chọn chế độ học, viết thesis trước, rồi mới tạo vị thế theo dõi giả lập.",
  modePrompt: "Bạn hãy chọn chế độ mô phỏng",
  modes: [
    {
      id: "current",
      title: "Chế độ mô phỏng hiện tại",
      description:
        "Chọn một cổ phiếu đang quan tâm, viết thesis, xem PVT rút gọn rồi tạo vị thế theo dõi giả lập.",
      bestFor: [
        "Đã có một cổ phiếu muốn theo dõi",
        "Muốn học cách phân bổ vốn giả lập",
        "Muốn luyện nhật ký và hậu kiểm thesis",
      ],
      primaryOutput: "Vị thế theo dõi giả lập và dashboard mô phỏng",
    },
    {
      id: "scenario",
      title: "Chế độ kiểm tra kịch bản giả định",
      description:
        "Stress-test thesis bằng các tình huống doanh thu, biên lợi nhuận, dòng tiền, định giá, vĩ mô/ngành và hành vi.",
      bestFor: [
        "Muốn biết thesis yếu ở đâu",
        "Muốn hiểu kênh tác động của một rủi ro",
        "Muốn tránh bị bất ngờ khi dữ liệu xấu xuất hiện",
      ],
      primaryOutput: "Bản kiểm tra kịch bản giả định",
    },
    {
      id: "history",
      title: "Chế độ case study lịch sử",
      description:
        "Học từ quá khứ với dữ liệu tương lai bị khóa, tránh nhìn kết quả rồi kết luận ngược.",
      bestFor: [
        "Muốn luyện ra quyết định tại đúng thời điểm",
        "Muốn hiểu sai lầm quy trình",
        "Muốn hậu kiểm bài học lịch sử",
      ],
      primaryOutput: "Bài học case study và nhật ký hậu kiểm",
    },
  ],
  current: {
    stock: {
      ticker: "PNJ",
      companyName: "Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận",
      industry: "Trang sức / tiêu dùng",
      startDate: "07/06/2026",
      startPrice: 92400,
      currentPrice: 95000,
      followedDays: "18 ngày",
      thesisStatus: "Đang theo dõi",
    },
    flow: [
      "Chọn cổ phiếu muốn mô phỏng",
      "Kiểm tra dữ liệu nền đã có chưa",
      "Viết thesis mô phỏng",
      "Xem dashboard PVT rút gọn",
      "Nhập vốn giả lập",
      "Chọn tỷ trọng hoặc giá trị vị thế",
      "Hệ thống tự tính số lượng cổ phiếu",
      "Đặt mốc xem lại thesis",
      "Tạo vị thế theo dõi giả lập",
      "Theo dõi dashboard mô phỏng",
      "Ghi nhật ký và hậu kiểm",
    ],
    precheck: [
      {
        label: "Hiểu doanh nghiệp kiếm tiền bằng cách nào",
        sourceModule: "Hiểu doanh nghiệp",
        status: "Đã có",
        note: "Đã có mô tả mô hình kinh doanh và nguồn doanh thu chính.",
      },
      {
        label: "Biết ngành và biến phụ thuộc chính",
        sourceModule: "Ngành",
        status: "Đã có",
        note: "Ngành phụ thuộc sức mua, biên lợi nhuận và chi phí vận hành.",
      },
      {
        label: "Đã xem doanh thu, lợi nhuận, dòng tiền, nợ vay",
        sourceModule: "BCTC",
        status: "Đã có",
        note: "Có dữ liệu nền để viết thesis nhưng cần cập nhật quý mới.",
      },
      {
        label: "Đã có vùng định giá tham khảo",
        sourceModule: "Định giá",
        status: "Cần bổ sung",
        note: "Vùng tham khảo cần kiểm tra lại nếu giá tăng mạnh.",
      },
      {
        label: "Đã xem giá, volume, xu hướng và sự kiện",
        sourceModule: "PVT",
        status: "Chưa rõ",
        note: "PVT chỉ dùng để kiểm tra thesis, không dùng làm trung tâm ra quyết định.",
      },
      {
        label: "Đã ghi nhận rủi ro cần thận trọng",
        sourceModule: "Rủi ro",
        status: "Cần bổ sung",
        note: "Cần nêu rõ dữ liệu nào phủ định thesis.",
      },
    ],
    thesisPrompts: [
      "Tôi mô phỏng cổ phiếu này vì...",
      "Luận điểm chính là...",
      "Rủi ro lớn nhất là...",
      "Dữ liệu xác nhận thesis là...",
      "Dữ liệu phủ định thesis là...",
      "Mốc xem lại tiếp theo là...",
    ],
    pvt: {
      toggles: [
        "Giá cổ phiếu",
        "So với VN-Index",
        "So với ngành",
        "Sự kiện/tin tức",
        "Volume bất thường",
      ],
      cards: [
        { label: "Giá bắt đầu mô phỏng", value: "92.400đ" },
        { label: "Giá hiện tại", value: "95.000đ" },
        { label: "VN-Index", value: "+1,6%" },
        { label: "Ngành", value: "+3,4%" },
        { label: "Volume", value: "1,8 lần trung bình 20 phiên", tone: "warning" },
      ],
      questions: [
        "Giá đang đi như thế nào so với thesis ban đầu?",
        "Biến động này do thị trường chung, ngành hay doanh nghiệp?",
        "Volume có xác nhận hay chỉ là nhiễu?",
        "Có sự kiện mới nào làm thay đổi luận điểm không?",
        "Tôi có đang phản ứng vì cảm xúc không?",
      ],
    },
    defaultCapital: 100000000,
    defaultWeight: 10,
    reviewMilestones: [
      {
        title: "Mốc theo thời gian",
        examples: ["Sau 1 tháng", "Sau BCTC quý", "Sau đại hội cổ đông"],
      },
      {
        title: "Mốc theo giá",
        examples: ["Nếu giá biến động mạnh thì xem lại thesis", "Nếu giá đi ngược kỳ vọng"],
      },
      {
        title: "Mốc theo dữ liệu doanh nghiệp",
        examples: ["Biên lợi nhuận giảm", "Dòng tiền âm", "Tồn kho tăng"],
      },
      {
        title: "Mốc theo rủi ro",
        examples: ["Tin pháp lý", "Tỷ giá căng", "Lãi suất tăng", "Thanh khoản giảm"],
      },
    ],
    dashboard: {
      header: [
        { label: "Mã cổ phiếu", value: "PNJ", tone: "accent" },
        { label: "Tên doanh nghiệp", value: "PNJ" },
        { label: "Ngày bắt đầu mô phỏng", value: "07/06/2026" },
        { label: "Giá bắt đầu mô phỏng", value: "92.400đ" },
        { label: "Giá hiện tại", value: "95.000đ" },
        { label: "Thời gian đã theo dõi", value: "18 ngày" },
        { label: "Trạng thái thesis", value: "Đang theo dõi", tone: "neutral" },
      ],
      thesisPanel: [
        { label: "Tôi mô phỏng vì", value: "Theo dõi phục hồi sức mua và biên lợi nhuận." },
        { label: "Luận điểm chính", value: "Doanh thu và biên lợi nhuận cải thiện nếu tiêu dùng phục hồi." },
        { label: "Rủi ro lớn nhất", value: "Sức mua yếu kéo dài hoặc chi phí tăng.", tone: "warning" },
        { label: "Dữ liệu xác nhận", value: "Doanh thu, biên gộp, dòng tiền hoạt động." },
        { label: "Dữ liệu phủ định", value: "Biên lợi nhuận giảm, tồn kho tăng, CFO âm." },
        { label: "Mốc xem lại", value: "Sau BCTC quý tiếp theo." },
      ],
      positionNotes: [
        { label: "Ngôn ngữ giao diện", value: "Vị thế theo dõi giả lập, không dùng mua/bán làm trung tâm." },
        { label: "Lãi/lỗ", value: "Hiển thị nhỏ, màu mềm, không làm trung tâm." },
        { label: "Mục tiêu", value: "Kiểm tra thesis và hành vi, không mô phỏng đặt lệnh." },
      ],
    },
    journalPrompts: [
      { label: "Dữ liệu mới là gì?", prompt: "Ghi dữ liệu mới hoặc sự kiện mới xuất hiện." },
      { label: "Thesis còn đúng không?", prompt: "So với luận điểm ban đầu, dữ liệu xác nhận hay phủ định?" },
      { label: "Tôi có muốn thay đổi kế hoạch không?", prompt: "Nếu có, thay đổi vì dữ liệu hay vì cảm xúc?" },
      { label: "Tôi cần quay lại module nào?", prompt: "Ngành, BCTC, Định giá, PVT hay Rủi ro?" },
    ],
  },
  scenario: {
    steps: [
      "Chọn loại kịch bản",
      "Chọn mức độ tác động",
      "Xem kênh tác động",
      "Trả lời câu hỏi của hệ thống",
      "Xuất Bản kiểm tra kịch bản giả định",
    ],
    groups: [
      {
        id: "revenue",
        title: "Kịch bản doanh thu",
        examples: ["Doanh thu giảm 5%, 10%, 20%", "Sản lượng giảm", "Đơn hàng yếu", "Doanh thu tăng nhưng không bền"],
      },
      {
        id: "margin",
        title: "Kịch bản biên lợi nhuận",
        examples: ["Giá vốn tăng", "Biên gộp giảm", "Chi phí bán hàng tăng", "Chi phí lãi vay tăng"],
      },
      {
        id: "cashflow",
        title: "Kịch bản dòng tiền",
        examples: ["Lợi nhuận tăng nhưng CFO âm", "Phải thu tăng nhanh", "Tồn kho tăng", "Capex lớn"],
      },
      {
        id: "valuation",
        title: "Kịch bản định giá",
        examples: ["P/E thấp vì lợi nhuận đỉnh chu kỳ", "DCF quá nhạy với tăng trưởng dài hạn", "Biên an toàn bị thu hẹp khi giá tăng"],
      },
      {
        id: "macro",
        title: "Kịch bản vĩ mô/ngành",
        examples: ["Lãi suất tăng lại", "Tỷ giá căng", "Giá dầu tăng", "Xuất khẩu giảm", "Đầu tư công chậm giải ngân", "Sức mua yếu"],
      },
      {
        id: "behavior",
        title: "Kịch bản hành vi",
        examples: ["Giá giảm 15%, tôi có hoảng không?", "Giá tăng mạnh, tôi có FOMO không?", "Nhóm chat nói cổ phiếu sắp tăng, tôi có bỏ qua kế hoạch không?"],
      },
    ],
    impactLevels: [
      { label: "Nhẹ", value: "Ảnh hưởng nhỏ", description: "Thesis có thể vẫn đứng vững." },
      { label: "Vừa", value: "Cần xem lại", description: "Cần kiểm tra định giá, rủi ro và dữ liệu xác nhận." },
      { label: "Mạnh", value: "Có thể đổi thesis", description: "Có thể làm thesis thay đổi đáng kể." },
    ],
    transmissionExample: [
      "Tỷ giá tăng",
      "Chi phí nhập khẩu tăng",
      "Giá vốn có thể tăng",
      "Biên lợi nhuận gộp giảm",
      "Lợi nhuận giảm",
      "Định giá hiện tại có thể không còn rẻ",
      "Cần kiểm tra nợ ngoại tệ và tỷ trọng nhập khẩu",
    ],
    tutorQuestions: [
      "Thesis của bạn còn đúng không?",
      "Dữ liệu nào bị ảnh hưởng?",
      "Module nào cần quay lại kiểm tra?",
      "Rủi ro có tăng không?",
      "Bạn sẽ theo dõi chỉ báo nào tiếp theo?",
      "Nếu tình huống này xảy ra, bạn có còn muốn mô phỏng cổ phiếu này không?",
    ],
    outputFields: [
      "Mã cổ phiếu/ngành đang kiểm tra",
      "Thesis ban đầu",
      "Kịch bản đã chọn",
      "Kênh tác động",
      "Dữ liệu bị ảnh hưởng",
      "Module cần quay lại",
      "Thesis còn đứng vững không?",
      "Rủi ro mới phát sinh",
      "Dữ liệu cần theo dõi",
      "Kết luận học tập: tiếp tục mô phỏng, cần kiểm tra thêm, hay chưa nên quyết định vội",
    ],
  },
  history: {
    zones: [
      "Case Library",
      "Time-Locked Analysis Workspace",
      "Decision Panel",
      "Replay Timeline",
    ],
    cases: [
      {
        id: "steel-cycle",
        caseName: "Cổ phiếu thép sau giai đoạn giảm sâu",
        tickerOrGroup: "HPG hoặc nhóm thép",
        startPoint: "Q4/2022",
        type: "Chu kỳ ngành",
        mainLesson: "P/E thấp ở ngành chu kỳ có thể gây hiểu nhầm",
        difficulty: "Trung bình",
        lockedData: "Chỉ mở dữ liệu đến Q4/2022",
        skill: "Vĩ mô -> Ngành -> BCTC -> Định giá -> Rủi ro",
      },
      {
        id: "bank-npl",
        caseName: "Ngân hàng và chu kỳ nợ xấu",
        tickerOrGroup: "Nhóm ngân hàng",
        startPoint: "Q2/2023",
        type: "Ngân hàng và nợ xấu",
        mainLesson: "Lợi nhuận kế toán cần đi cùng chất lượng tài sản",
        difficulty: "Khó",
        lockedData: "Khóa dữ liệu sau thời điểm bắt đầu",
        skill: "BCTC -> Rủi ro -> Định giá",
      },
      {
        id: "fomo-hot-stock",
        caseName: "Cổ phiếu FOMO tăng nóng",
        tickerOrGroup: "Một nhóm cổ phiếu thanh khoản cao",
        startPoint: "Giai đoạn tăng nóng",
        type: "Hành vi và thanh khoản",
        mainLesson: "Giá tăng nhanh không thay thế được thesis",
        difficulty: "Dễ",
        lockedData: "Chỉ mở dữ liệu đã biết tại thời điểm đó",
        skill: "PVT -> Nhật ký -> Rủi ro",
      },
    ],
    lockedWorkspace: {
      asOfDate: "30/09/2022",
      warning:
        "Bạn chỉ được xem dữ liệu đã có trước ngày này. Dữ liệu tương lai đang bị khóa.",
      tabs: [
        { label: "Vĩ mô", value: "Bối cảnh tại thời điểm đó" },
        { label: "Ngành", value: "Dữ liệu ngành đã biết" },
        { label: "Doanh nghiệp", value: "Thông tin doanh nghiệp đã công bố" },
        { label: "BCTC", value: "Báo cáo đến thời điểm khóa" },
        { label: "Định giá", value: "Vùng tham khảo tại thời điểm đó" },
        { label: "PVT", value: "Giá, volume, sự kiện đã biết" },
        { label: "Rủi ro", value: "Rủi ro đã có dấu hiệu" },
        { label: "Tin tức", value: "Tin/công bố trước ngày khóa" },
      ],
    },
    decisionOptions: [
      "Theo dõi thêm, chưa hành động",
      "Tạo vị thế giả lập nhỏ",
      "Tạo vị thế giả lập vừa",
      "Không tiếp tục theo dõi",
      "Chờ dữ liệu xác nhận",
    ],
    requiredFields: [
      "Tôi quyết định như vậy vì...",
      "Luận điểm chính của tôi là...",
      "Rủi ro lớn nhất là...",
      "Dữ liệu xác nhận thesis là...",
      "Dữ liệu phủ định thesis là...",
      "Tỷ trọng giả lập là...",
      "Tôi sẽ xem lại khi...",
    ],
    replayTimeline: [
      {
        milestone: "Sau 1 tháng",
        newData: ["Giá cổ phiếu thay đổi", "VN-Index thay đổi", "Ngành thay đổi", "Tin tức mới xuất hiện"],
        reflectionQuestion:
          "Kết quả đến từ thị trường chung, ngành hay doanh nghiệp?",
      },
      {
        milestone: "Sau BCTC quý tiếp theo",
        newData: ["Doanh thu mới", "Biên lợi nhuận", "Tồn kho", "Dòng tiền", "Rủi ro mới"],
        reflectionQuestion:
          "Dữ liệu này xác nhận hay phủ định thesis ban đầu?",
      },
      {
        milestone: "Kết thúc case",
        newData: ["Kết quả giả lập", "So với VN-Index", "So với ngành", "Bài học quy trình"],
        reflectionQuestion:
          "Tôi đúng/sai vì quy trình hay vì may mắn?",
      },
    ],
    postReviewTypes: [
      { label: "Đúng quy trình", value: "Kết quả tốt", tone: "success" },
      { label: "Đúng quy trình", value: "Kết quả chưa tốt", tone: "neutral" },
      { label: "Sai quy trình", value: "May mắn có kết quả tốt", tone: "warning" },
      { label: "Sai quy trình", value: "Kết quả xấu", tone: "danger" },
      { label: "Chưa đủ dữ liệu", value: "Cần theo dõi thêm", tone: "warning" },
    ],
  },
  disclaimer: {
    title: "Cảnh báo quan trọng",
    content:
      "Mô phỏng là môi trường học quy trình, không phải công cụ đặt lệnh. Giao diện dùng ngôn ngữ vị thế theo dõi giả lập, mốc xem lại thesis, nhật ký và hậu kiểm để tránh biến bài học thành phản ứng mua/bán.",
  },
};
