import type { TechnicalPageData } from "../types";

export const technicalPageData: TechnicalPageData = {
  isLoading: false,
  loading: {
    title: "Đang chuẩn bị dữ liệu Price Volume Time",
    content: "Hệ thống đang gom dữ liệu mẫu để minh họa cách quan sát giá, khối lượng, thời gian, tin tức và tâm lý.",
  },
  emptyState: {
    title: "Chưa có cổ phiếu để quan sát",
    description: "Hãy chuyển từ module Định giá sau khi đã có vùng giá tham khảo và giả định chính.",
    icon: "∅",
  },
  detailLabels: {
    detailButtonLabel: "Xem chi tiết",
    collapseButtonLabel: "Thu gọn chi tiết",
    detailChipLabel: "Quan sát thêm",
  },
  header: {
    moduleName: "Phân Tích Kỹ Thuật Cơ Bản",
    subtitle: "Price • Volume • Time",
    ticker: "MWG",
    companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
    industry: "Bán lẻ",
    timeframe: "1 năm",
    status: "Đang quan sát",
    previousContext:
      "Người dùng đã hoàn thành bước định giá mẫu và đang kiểm tra hành vi thị trường trước khi chuyển sang kiểm tra rủi ro.",
    actions: [
      { label: "Quay lại Định Giá", variant: "secondary" },
      { label: "Chuyển sang Kiểm tra Rủi ro", variant: "primary" },
    ],
  },
  quickSummary: {
    title: "Bản đồ hành vi thị trường",
    description:
      "Sáu câu trả lời ngắn để hiểu điều thị trường đang phản ánh. Đây chỉ là phần quan sát, không phải chỉ dẫn giao dịch.",
    icon: "PVT",
    metrics: [
      {
        title: "Giá mẫu",
        value: "42.000",
        description: "Giá hiện tại dùng cho dữ liệu minh họa MWG.",
        icon: "P",
        status: "Mẫu",
      },
      {
        title: "Khung thời gian",
        value: "1 năm",
        description: "Khung mặc định để nhìn xu hướng trung hạn.",
        icon: "T",
        status: "Mặc định",
      },
      {
        title: "Trọng tâm",
        value: "Quan sát",
        description: "Giá và khối lượng chỉ là một phần của quá trình đọc dữ liệu.",
        icon: "O",
        status: "Không hành động vội",
      },
    ],
    answers: [
      { label: "Xu hướng chính", value: "Xu hướng trung hạn đang tích cực nhưng ngắn hạn có điều chỉnh.", tone: "accent" },
      { label: "Giá và volume", value: "Dòng tiền đang hoạt động rõ hơn trong vài nhịp gần đây.", tone: "accent" },
      { label: "So với thị trường", value: "Cổ phiếu đang mạnh hơn thị trường trong dữ liệu mẫu.", tone: "success" },
      { label: "Biến động", value: "Biến động trung bình, có vài phiên mạnh hơn bình thường.", tone: "warning" },
      { label: "Tâm lý", value: "Thị trường đang thận trọng nghiêng về lạc quan.", tone: "neutral" },
      { label: "FOMO cá nhân", value: "Có một vài dấu hiệu cần tự kiểm tra trước khi đi tiếp.", tone: "warning" },
    ],
  },
  readingPath: {
    title: "Lộ trình đọc Price Volume Time",
    description:
      "Đọc theo thứ tự để không biến biểu đồ thành công cụ ra quyết định độc lập.",
    icon: "5",
    steps: [
      { label: "Price", value: "Giá đang phản ứng ở vùng nào?" },
      { label: "Volume", value: "Dòng tiền có rõ hơn bình thường không?" },
      { label: "Time", value: "Khung thời gian đang nói điều gì?" },
      { label: "News", value: "Có sự kiện nào trùng với biến động không?" },
      { label: "Psychology", value: "Tâm lý thị trường và bản thân đang ra sao?" },
    ],
  },
  progress: {
    title: "Lộ trình đọc Price Volume Time",
    description: "5 thẻ quan sát chính. Mỗi thẻ mở popup chi tiết để người mới đọc theo từng lớp: Price, Volume, Time, Market Context và Event.",
    steps: [
      {
        order: 1,
        title: "Price",
        question: "Giá đang ở trạng thái nào?",
        summary: "Giá cho biết thị trường đang đồng ý hay không đồng ý với câu chuyện đầu tư.",
        status: "Đang làm",
        tone: "accent",
        sections: [
          {
            title: "Bạn cần nhìn",
            items: [
              "Giá đang trong xu hướng tăng, xu hướng giảm, hay đi ngang tích lũy.",
              "Giá đang gần hỗ trợ, kháng cự, đỉnh cũ, đáy cũ, hay đang ở vùng đuổi giá.",
              "Giá tăng có tạo đỉnh cao hơn, đáy cao hơn không.",
              "Giá giảm có phá cấu trúc không, hay chỉ là điều chỉnh bình thường.",
            ],
          },
        ],
        beginnerExplanation:
          "Giá cho biết thị trường đang đồng ý hay không đồng ý với câu chuyện đầu tư.",
      },
      {
        order: 2,
        title: "Volume",
        question: "Thanh khoản có xác nhận giá không?",
        summary: "Volume là lớp xác nhận rất quan trọng trong thị trường Việt Nam.",
        status: "Đang làm",
        tone: "success",
        sections: [
          {
            title: "Cần chú ý",
            items: [
              "Giá tăng nhưng volume thấp, có thể là tăng thiếu sức.",
              "Giá tăng kèm volume tăng dần, có thể là dòng tiền thật đang vào.",
              "Giá giảm mạnh kèm volume lớn, có thể là phân phối, giải chấp, hoặc dòng tiền lớn thoát.",
              "Volume đột biến nhưng giá không tăng tương ứng, phải nghi ngờ có lực bán hấp thụ.",
              "Thanh khoản lớn chưa chắc tốt, vì có thể là thanh khoản thật hoặc thanh khoản ảo.",
            ],
          },
          {
            title: "Liên kết dữ liệu",
            items: [
              "Phần này liên kết chặt với free float, độ sâu sổ lệnh, wash trade, dòng tiền retail, tự doanh, nước ngoài, margin và giải chấp.",
            ],
          },
        ],
      },
      {
        order: 3,
        title: "Time",
        question: "Khung thời gian đang nói gì?",
        summary: "Không nên chỉ nhìn chart ngày; cần đọc nhiều khung để tách xu hướng thật khỏi nhiễu ngắn hạn.",
        status: "Cần kiểm tra thêm",
        tone: "warning",
        sections: [
          {
            title: "Nên có ít nhất 3 khung",
            items: [
              "Tuần, để biết xu hướng lớn.",
              "Ngày, để biết nhịp vận động hiện tại.",
              "Trong phiên, để phát hiện bất thường, nhưng không nên dùng để ra quyết định đầu tư dài hạn.",
            ],
          },
        ],
        example: [
          "Chart tuần vẫn xấu, chart ngày hồi mạnh, thì có thể chỉ là hồi kỹ thuật.",
          "Chart tuần tích lũy đẹp, chart ngày break nền kèm volume tốt, tín hiệu đáng tin hơn.",
          "Chart ngày tăng nóng, chart trong phiên kéo trần liên tục, người mới rất dễ FOMO.",
        ],
        reminder: "Time giúp phân biệt xu hướng thật với nhiễu ngắn hạn.",
      },
      {
        order: 4,
        title: "Market Context",
        question: "Thị trường chung có ủng hộ không?",
        summary: "Một cổ phiếu đẹp nhưng thị trường chung xấu thì xác suất thành công giảm.",
        status: "Cần kiểm tra thêm",
        tone: "neutral",
        sections: [
          {
            title: "Cần xem",
            items: [
              "VN-Index đang tăng, giảm hay đi ngang.",
              "Ngành của cổ phiếu đó có mạnh hơn thị trường không.",
              "Cổ phiếu có mạnh hơn ngành không.",
              "Dòng tiền đang tập trung vào nhóm nào: ngân hàng, chứng khoán, bất động sản, đầu tư công, xuất khẩu, bán lẻ, công nghệ.",
            ],
          },
        ],
        example: [
          "Nếu VN-Index yếu, ngành chứng khoán yếu, nhưng một cổ phiếu chứng khoán tăng mạnh bất thường, cần hỏi đó là sức mạnh thật hay chỉ là dòng tiền ngắn hạn kéo riêng mã.",
        ],
      },
      {
        order: 5,
        title: "Event",
        question: "Giá đang chạy trước sự kiện gì?",
        summary: "Phân tích kỹ thuật nên có thêm lớp News/Event timeline để tránh hiểu sai tín hiệu nến.",
        status: "Cần kiểm tra thêm",
        tone: "accent",
        sections: [
          {
            title: "Giá có thể chạy trước",
            items: [
              "Kết quả kinh doanh.",
              "Đại hội cổ đông.",
              "Chia cổ tức.",
              "Phát hành thêm.",
              "ETF review.",
              "Nâng hạng thị trường.",
              "Tin đồn M&A.",
              "Nới room ngoại.",
              "Tin chính sách ngành.",
            ],
          },
          {
            title: "Vì sao cần News/Event timeline",
            items: [
              "Nếu chỉ nhìn nến mà không biết sự kiện, người dùng rất dễ hiểu sai.",
              "Giá tăng mạnh trước KQKD có thể là thị trường đang mua kỳ vọng.",
              "Nếu KQKD ra đúng như kỳ vọng mà giá giảm, đó có thể là sell the news.",
            ],
          },
        ],
      },
    ],
  },
  timeframe: {
    id: "timeframe",
    icon: "1",
    title: "Tôi đang nhìn cổ phiếu trong khoảng thời gian nào?",
    description: "Khung thời gian khác nhau sẽ tạo ra cách đọc khác nhau.",
    defaultValue: "1 năm",
    options: [
      { label: "1 tháng", value: "Biến động ngắn hạn, dễ nhiễu.", tone: "warning" },
      { label: "3 tháng", value: "Theo dõi nhịp gần nhất.", tone: "neutral" },
      { label: "6 tháng", value: "Quan sát xu hướng gần.", tone: "neutral" },
      { label: "1 năm", value: "Quan sát xu hướng trung hạn.", tone: "accent" },
      { label: "3 năm", value: "Nhìn chu kỳ dài hơn.", tone: "neutral" },
      { label: "5 năm", value: "Đọc bối cảnh dài hạn.", tone: "neutral" },
    ],
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Một tháng thường nhiều nhiễu, sáu tháng giúp nhìn xu hướng gần, một năm phù hợp để quan sát trung hạn, còn ba đến năm năm phù hợp để nhìn chu kỳ dài hơn.",
    },
  },
  trendMap: {
    id: "trend-map",
    icon: "2",
    title: "Cổ phiếu đang ở xu hướng nào?",
    description: "Tách ngắn hạn, trung hạn và dài hạn để tránh kết luận vội.",
    trends: [
      { label: "Xu hướng dài hạn", value: "Tăng", tone: "success" },
      { label: "Xu hướng trung hạn", value: "Tăng", tone: "success" },
      { label: "Xu hướng ngắn hạn", value: "Điều chỉnh", tone: "warning" },
    ],
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Xu hướng ngắn hạn và dài hạn có thể khác nhau. Một cổ phiếu vẫn có thể đang tăng dài hạn dù đang điều chỉnh trong vài tuần gần đây.",
    },
  },
  priceVolume: {
    id: "price-volume",
    icon: "3",
    title: "Giá và khối lượng đang kể câu chuyện gì?",
    description: "Biểu đồ mẫu chỉ dùng để quan sát hành vi, không phải để tạo chỉ dẫn hành động.",
    chartTitle: "Giá mẫu 12 tháng",
    volumeTitle: "Khối lượng mẫu",
    averageVolume20: "20 phiên: 2,8 triệu cổ phiếu",
    toggles: [
      { key: "ma20", label: "MA20", enabled: true },
      { key: "ma50", label: "MA50", enabled: true },
      { key: "ma200", label: "MA200", enabled: false },
      { key: "rsi", label: "RSI quan sát", enabled: false },
    ],
    points: [
      { label: "T1", price: 36, volume: 1.8, ma20: 35, ma50: 34, ma200: 40, rsi: 48 },
      { label: "T2", price: 37, volume: 2.1, ma20: 36, ma50: 35, ma200: 39, rsi: 52 },
      { label: "T3", price: 35, volume: 2.9, ma20: 36, ma50: 35, ma200: 39, rsi: 43 },
      { label: "T4", price: 38, volume: 3.2, ma20: 37, ma50: 36, ma200: 38, rsi: 55 },
      { label: "T5", price: 40, volume: 3.8, ma20: 38, ma50: 37, ma200: 38, rsi: 60 },
      { label: "T6", price: 41, volume: 2.7, ma20: 39, ma50: 38, ma200: 38, rsi: 58 },
      { label: "T7", price: 44, volume: 4.4, ma20: 41, ma50: 39, ma200: 38, rsi: 66 },
      { label: "T8", price: 43, volume: 3.1, ma20: 42, ma50: 40, ma200: 39, rsi: 61 },
      { label: "T9", price: 42, volume: 2.6, ma20: 42, ma50: 41, ma200: 39, rsi: 54 },
      { label: "T10", price: 45, volume: 4.1, ma20: 43, ma50: 41, ma200: 40, rsi: 64 },
      { label: "T11", price: 43, volume: 3.5, ma20: 43, ma50: 42, ma200: 40, rsi: 57 },
      { label: "T12", price: 42, volume: 2.9, ma20: 42, ma50: 42, ma200: 41, rsi: 51 },
    ],
    states: [
      { label: "Giá tăng + volume tăng", reading: "Dòng tiền đang hoạt động rõ hơn.", tone: "accent" },
      { label: "Giá tăng + volume giảm", reading: "Động lượng tăng ngắn hạn có thể yếu hơn.", tone: "warning" },
      { label: "Giá giảm + volume tăng", reading: "Cần kiểm tra thêm nguyên nhân biến động.", tone: "warning" },
      { label: "Giá giảm + volume giảm", reading: "Áp lực ngắn hạn có thể dịu lại.", tone: "neutral" },
      { label: "Giá đi ngang + volume tăng", reading: "Giá đang được chú ý hơn tại vùng này.", tone: "accent" },
      { label: "Giá đi ngang + volume giảm", reading: "Chưa đủ dữ liệu để kết luận nguyên nhân.", tone: "neutral" },
    ],
    reading: { label: "Đọc nhanh", value: "Giá đang phản ứng mạnh tại vùng hiện tại, cần đối chiếu thêm tin tức và định giá.", tone: "warning" },
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Mỗi sự kết hợp giữa giá và khối lượng phản ánh hành vi khác nhau của dòng tiền. Đây chỉ là cách quan sát điều đang diễn ra.",
    },
    details: [
      "MA20, MA50 và MA200 chỉ là đường tham chiếu xu hướng, không phải chỉ dẫn độc lập.",
      "RSI nếu bật chỉ nên được xem là công cụ quan sát động lượng ngắn hạn.",
      "Khi giá và volume cùng tăng, vẫn cần hỏi nguyên nhân đến từ dữ liệu kinh doanh, kỳ vọng hay tâm lý thị trường.",
    ],
  },
  relativeStrength: {
    id: "relative-strength",
    icon: "4",
    title: "Cổ phiếu này đang mạnh hơn hay yếu hơn thị trường?",
    description: "So biến động của cổ phiếu với ngành và VNINDEX trong cùng khung thời gian.",
    rows: [
      { name: "VNINDEX", change: "-5%", note: "Thị trường chung giảm trong dữ liệu mẫu." },
      { name: "Ngành bán lẻ", change: "-3%", note: "Ngành giảm nhẹ hơn thị trường." },
      { name: "MWG", change: "-1%", note: "Cổ phiếu giảm ít hơn trong cùng giai đoạn." },
    ],
    output: { label: "Đọc nhanh", value: "Mạnh hơn thị trường trong dữ liệu mẫu.", tone: "success" },
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Nếu thị trường giảm mạnh nhưng cổ phiếu giảm ít hơn, cổ phiếu có thể đang thể hiện sức mạnh tương đối tốt hơn thị trường. Điều này vẫn cần đối chiếu với doanh nghiệp, BCTC và định giá.",
    },
  },
  volatility: {
    id: "volatility",
    icon: "5",
    title: "Cổ phiếu này có biến động mạnh không?",
    description: "Biến động giúp nhận diện rủi ro tâm lý trước khi đọc sâu hơn.",
    metrics: [
      { label: "Biên độ dao động", value: "31.000-45.000 trong dữ liệu mẫu", tone: "warning" },
      { label: "Biến động trung bình", value: "2,1% mỗi phiên", tone: "neutral" },
      { label: "Phiên biến động mạnh", value: "7 phiên trong 60 phiên gần nhất", tone: "warning" },
    ],
    output: { label: "Mức độ biến động", value: "Trung bình", tone: "neutral" },
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Biến động cao không đồng nghĩa với xấu. Nhưng biến động cao thường đi kèm rủi ro tâm lý lớn hơn.",
    },
  },
  pricePosition: {
    id: "price-position",
    icon: "6",
    title: "Giá hiện tại đang ở vị trí nào trong lịch sử gần đây?",
    description: "Đọc vùng giá thị trường từng phản ứng mạnh, không biến chúng thành chỉ dẫn hành động.",
    metrics: [
      { label: "Giá hiện tại", value: "42.000", tone: "accent" },
      { label: "Vùng hỗ trợ", value: "38.000-40.000", tone: "neutral" },
      { label: "Vùng kháng cự", value: "44.000-46.000", tone: "warning" },
      { label: "Đỉnh gần nhất", value: "45.000", tone: "warning" },
      { label: "Đáy gần nhất", value: "35.000", tone: "neutral" },
    ],
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Đây là các vùng giá mà thị trường từng phản ứng mạnh. Chúng chỉ giúp bạn hiểu bối cảnh hiện tại.",
    },
  },
  newsEvents: {
    id: "news-events",
    icon: "7",
    title: "Có tin tức hoặc sự kiện nào trùng với biến động giá không?",
    description: "Tin tức giúp giải thích biến động, nhưng không tự động tạo ra giá trị doanh nghiệp.",
    rows: [
      { date: "2026-01", title: "Kết quả kinh doanh mẫu phục hồi", type: "Tin doanh nghiệp", relevance: "Cao" },
      { date: "2026-02", title: "Sức mua ngành bán lẻ cải thiện", type: "Tin ngành", relevance: "Trung bình" },
      { date: "2026-03", title: "Lãi suất duy trì ổn định", type: "Tin vĩ mô", relevance: "Trung bình" },
      { date: "2026-04", title: "Thị trường chung biến động mạnh", type: "Tin thị trường", relevance: "Cao" },
      { date: "2026-05", title: "Cạnh tranh giá trong ngành tăng", type: "Tin rủi ro", relevance: "Cao" },
    ],
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Tin tức giúp giải thích biến động giá nhưng không tự động tạo ra giá trị doanh nghiệp. Cần đọc cùng BCTC, định giá và rủi ro.",
    },
    details: [
      "Một sự kiện trùng thời điểm với biến động giá chưa chắc là nguyên nhân duy nhất.",
      "Tin doanh nghiệp thường cần đối chiếu với số liệu thực tế.",
      "Tin thị trường chung có thể làm nhiều cổ phiếu biến động cùng lúc.",
    ],
  },
  movementExplanation: {
    id: "movement-explanation",
    icon: "8",
    title: "Điều gì có thể đang làm giá biến động?",
    description: "Giải thích bằng giả thuyết thận trọng, không gán nguyên nhân tuyệt đối.",
    possibleDrivers: [
      { label: "KQKD tốt hơn kỳ vọng", value: "Có thể hỗ trợ biến động tích cực nếu dữ liệu được xác nhận.", tone: "accent" },
      { label: "Ngành phục hồi", value: "Có thể giúp dòng tiền quan tâm hơn đến nhóm bán lẻ.", tone: "accent" },
      { label: "Vùng giá tham khảo", value: "Nếu giá gần vùng tham khảo, phản ứng thị trường cần đọc cùng định giá.", tone: "neutral" },
      { label: "Tin tức mới", value: "Cần kiểm tra nguồn và mức liên quan.", tone: "warning" },
      { label: "Dòng tiền ngắn hạn", value: "Có thể làm biến động mạnh hơn bình thường.", tone: "warning" },
      { label: "KQKD kém hơn kỳ vọng", value: "Có thể làm thị trường thận trọng hơn.", tone: "warning" },
      { label: "Ngành suy yếu", value: "Cần so với dữ liệu ngành và đối thủ.", tone: "warning" },
      { label: "Tin tức tiêu cực", value: "Cần tách tin ngắn hạn khỏi giá trị dài hạn.", tone: "danger" },
    ],
    uncertaintyNote:
      "Chưa đủ dữ liệu để giải thích chắc chắn nguyên nhân biến động. Cần kiểm tra thêm BCTC, định giá, tin tức và rủi ro.",
    details: [
      "Một nhịp biến động có thể đến từ nhiều nguyên nhân cùng lúc.",
      "Nếu không có dữ liệu xác nhận, chỉ nên ghi nhận giả thuyết quan sát.",
      "Ngôn ngữ nên là có thể, cần kiểm tra thêm, hoặc chưa đủ dữ liệu.",
    ],
  },
  marketPsychology: {
    id: "market-psychology",
    icon: "9",
    title: "Thị trường đang ở trạng thái cảm xúc nào?",
    description: "Tâm lý đám đông là một phần của giá, nhưng không thay thế phân tích doanh nghiệp.",
    states: ["Sợ hãi", "Thận trọng", "Trung lập", "Lạc quan", "Hưng phấn"],
    currentState: "Thận trọng nghiêng về lạc quan",
    score: 62,
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "Giá không chỉ phản ánh doanh nghiệp. Giá còn phản ánh cảm xúc đám đông và kỳ vọng thay đổi theo thời gian.",
    },
  },
  fomoCheck: {
    id: "fomo-check",
    icon: "10",
    title: "Tôi có đang bị FOMO không?",
    description: "Checklist này giúp tự kiểm tra cảm xúc mà không làm người dùng xấu hổ.",
    items: [
      { label: "Tôi quan tâm cổ phiếu vì giá vừa tăng mạnh.", checked: true },
      { label: "Tôi sợ bỏ lỡ cơ hội.", checked: false },
      { label: "Tôi chưa kiểm tra định giá.", checked: false },
      { label: "Tôi chưa đọc lại BCTC.", checked: false },
      { label: "Tôi chỉ nhìn biểu đồ.", checked: true },
      { label: "Tôi muốn hành động ngay vì tin nóng.", checked: false },
    ],
    output: { label: "Phản hồi", value: "Có một vài dấu hiệu cần tự kiểm tra. Nên quay lại định giá, BCTC và rủi ro nếu còn chưa rõ.", tone: "warning" },
    tutor: {
      title: "Giải thích dễ hiểu",
      content:
        "FOMO là cảm xúc rất bình thường. Việc quan trọng là nhận ra nó và quay lại kiểm tra dữ liệu trước khi ghi nhận kết luận cá nhân.",
    },
  },
  crossModuleAlignment: {
    id: "cross-module-alignment",
    icon: "11",
    title: "Biểu đồ có phù hợp với những gì tôi đã phân tích không?",
    description: "Đối chiếu biểu đồ với doanh nghiệp, BCTC và định giá để tránh đọc một chiều.",
    chain: ["Hiểu doanh nghiệp", "BCTC", "Định giá", "Biểu đồ"],
    checks: [
      { label: "Giá và lợi nhuận", value: "Giá phản ứng tích cực, cần kiểm tra lợi nhuận có cải thiện tương ứng không.", tone: "warning" },
      { label: "Giá và định giá", value: "Giá gần vùng tham khảo mẫu, chưa đủ để kết luận riêng lẻ.", tone: "neutral" },
      { label: "Giá và tâm lý", value: "Một phần biến động có thể đến từ kỳ vọng ngắn hạn.", tone: "warning" },
      { label: "Cần quay lại rủi ro?", value: "Có, nên kiểm tra cạnh tranh và biên lợi nhuận.", tone: "accent" },
    ],
    output: { label: "Đọc nhanh", value: "Có một vài điểm cần kiểm tra thêm.", tone: "warning" },
  },
  personalObservation: {
    id: "personal-observation",
    icon: "12",
    title: "Bạn quan sát hành vi thị trường như thế nào?",
    description: "Viết lại bằng ngôn ngữ của bạn trước khi chuyển sang kiểm tra rủi ro.",
    prompts: [
      "Mã cổ phiếu:",
      "Khung thời gian quan sát:",
      "Xu hướng chính:",
      "Thanh khoản:",
      "Khối lượng:",
      "Sức mạnh tương đối:",
      "Độ biến động:",
      "Tin tức liên quan:",
      "Nguyên nhân biến động tôi cho là hợp lý nhất:",
      "Tôi có đang bị FOMO không:",
      "Biểu đồ có mâu thuẫn với định giá không:",
      "Điều tôi cần kiểm tra thêm:",
      "Tôi có đủ cơ sở để chuyển sang module Rủi ro chưa?",
    ],
    placeholder:
      "Ví dụ: Tôi đang quan sát MWG trong khung 1 năm. Xu hướng trung hạn tích cực nhưng vẫn cần kiểm tra thêm nguyên nhân biến động, tin tức ngành và mức độ phù hợp với vùng giá tham khảo.",
  },
  outputSummary: {
    id: "output-summary",
    icon: "O",
    title: "Bản Quan Sát Hành Vi Thị Trường Cá Nhân",
    description: "Tóm tắt dữ liệu hỗ trợ phân tích, không chứa chỉ dẫn giao dịch.",
    items: [
      { label: "Xu hướng", value: "Trung hạn tích cực, ngắn hạn điều chỉnh.", tone: "accent" },
      { label: "Thanh khoản", value: "Dòng tiền hoạt động rõ hơn ở một số phiên.", tone: "accent" },
      { label: "Độ biến động", value: "Trung bình, có vài phiên mạnh hơn bình thường.", tone: "warning" },
      { label: "Tâm lý thị trường", value: "Thận trọng nghiêng về lạc quan.", tone: "neutral" },
      { label: "Tin tức liên quan", value: "KQKD mẫu, ngành bán lẻ, biến động thị trường chung.", tone: "neutral" },
      { label: "FOMO cá nhân", value: "Có một vài dấu hiệu cần tự kiểm tra.", tone: "warning" },
      { label: "Điểm cần kiểm tra thêm", value: "Biên lợi nhuận, cạnh tranh, rủi ro ngành và định giá sau biến động.", tone: "warning" },
    ],
  },
  disclaimer: {
    title: "Cảnh báo bắt buộc",
    content:
      "Phần Phân tích kỹ thuật cơ bản không phải khuyến nghị giao dịch. Mục tiêu của bước này là giúp bạn quan sát giá, khối lượng, thời gian, tin tức và tâm lý thị trường. Biểu đồ không đủ để ra quyết định độc lập. Bạn vẫn cần đối chiếu với doanh nghiệp, báo cáo tài chính, định giá, rủi ro và checklist trước khi ghi nhận quyết định cá nhân.",
  },
  nextActions: {
    title: "Bạn đã hiểu hành vi thị trường hiện tại chưa?",
    description: "Các nút dưới đây là điều hướng giao diện mẫu, chưa có chức năng thật ở bước này.",
    actions: [
      { label: "Chuyển sang Kiểm tra rủi ro", variant: "primary" },
      { label: "Quay lại Định giá", variant: "secondary" },
      { label: "Thêm vào Watchlist", variant: "secondary" },
      { label: "Ghi chú điều cần kiểm tra thêm", variant: "ghost" },
    ],
  },
};
