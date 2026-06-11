import type { BusinessPageData } from "../types";

export const businessPageData: BusinessPageData = {
  isLoading: false,
  loading: {
    title: "Đang chuẩn bị hồ sơ doanh nghiệp",
    description:
      "Hệ thống đang gom dữ liệu mẫu để người mới hiểu doanh nghiệp trước khi đọc BCTC.",
  },
  emptyState: {
    title: "Chưa có doanh nghiệp để phân tích",
    description:
      "Hãy chọn một cổ phiếu ứng viên từ module Lọc cổ phiếu trước khi đi tiếp.",
    icon: "0",
  },
  header: {
    moduleName: "Hiểu doanh nghiệp",
    ticker: "MWG",
    companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
    industry: "Bán lẻ",
    status: "Đang phân tích",
    businessType: "Bán lẻ / tiêu dùng",
    beginnerFit: "Dễ hiểu với người mới",
    candidateStatus: "Ứng viên sau vòng sơ lọc",
    description:
      "MWG là cổ phiếu ứng viên từ module Lọc cổ phiếu. Trước khi đọc BCTC, hãy hiểu doanh nghiệp này kiếm tiền bằng cách nào và cần kiểm tra điều gì bằng dữ liệu.",
    actions: [
      {
        label: "Quay lại lọc cổ phiếu",
        description: "So sánh lại với mã ứng viên khác.",
        variant: "secondary",
      },
      {
        label: "Chuyển sang phân tích BCTC",
        description: "Chỉ mở khi đã hoàn thành câu hỏi bắt buộc.",
        variant: "primary",
      },
    ],
  },
  quickSummary: {
    title: "Bản đồ nhanh về doanh nghiệp",
    description: "5 câu trả lời ngắn giúp bạn nắm doanh nghiệp ở mức cơ bản.",
    icon: "M",
    items: [
      {
        question: "Doanh nghiệp này làm gì?",
        answer:
          "Vận hành chuỗi bán lẻ sản phẩm công nghệ, điện máy và một số mảng tiêu dùng.",
      },
      {
        question: "Doanh nghiệp kiếm tiền từ đâu?",
        answer:
          "Từ bán hàng trực tiếp tại cửa hàng, online và các dịch vụ đi kèm.",
      },
      {
        question: "Khách hàng chính là ai?",
        answer:
          "Người tiêu dùng cá nhân có nhu cầu mua điện thoại, điện máy và hàng tiêu dùng.",
      },
      {
        question: "Lợi thế sơ bộ là gì?",
        answer:
          "Thương hiệu quen thuộc, mạng lưới cửa hàng lớn và năng lực vận hành bán lẻ.",
      },
      {
        question: "Rủi ro lớn nhất là gì?",
        answer:
          "Sức mua yếu, cạnh tranh giá, tồn kho và chi phí vận hành cửa hàng.",
      },
    ],
    oneSentenceSummary:
      "MWG là doanh nghiệp bán lẻ phụ thuộc vào sức mua nội địa, biên lợi nhuận, quản trị tồn kho và hiệu quả vận hành chuỗi.",
  },
  dashboard: {
    identity: {
      ticker: "MWG",
      companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
      industry: "Bán lẻ",
      model: "Bán lẻ chuỗi",
      customers: "Người tiêu dùng nội địa",
      beginnerFit: "Dễ hiểu, nhưng cần kiểm tra tồn kho và biên lợi nhuận",
    },
    moneyMachine: [
      {
        id: "supplier",
        label: "Nhà cung cấp",
        description: "Nguồn hàng công nghệ, điện máy và tiêu dùng.",
        relatedMetrics: ["Giá vốn", "Điều khoản thanh toán"],
        bctcChecks: ["Giá vốn hàng bán", "Phải trả người bán"],
        riskNote: "Phụ thuộc thương hiệu lớn có thể làm biên lợi nhuận mỏng.",
      },
      {
        id: "inventory",
        label: "Hàng tồn kho",
        description: "Hàng mua vào trước khi bán ra.",
        relatedMetrics: ["Tồn kho", "Vòng quay tồn kho"],
        bctcChecks: ["Hàng tồn kho", "Dự phòng giảm giá tồn kho"],
        riskNote: "Tồn kho cao có thể làm dòng tiền yếu.",
      },
      {
        id: "stores",
        label: "Cửa hàng / Online",
        description: "Nơi tạo doanh thu và trải nghiệm khách hàng.",
        relatedMetrics: ["Số cửa hàng", "Doanh thu/cửa hàng", "Tỷ trọng online"],
        bctcChecks: ["Doanh thu theo mảng", "Chi phí bán hàng"],
      },
      {
        id: "customer",
        label: "Khách hàng",
        description: "Người tiêu dùng mua hàng và dịch vụ đi kèm.",
        relatedMetrics: ["Sức mua", "Tần suất mua", "Giá trị đơn hàng"],
        bctcChecks: ["Doanh thu", "Biên lợi nhuận gộp"],
      },
      {
        id: "margin",
        label: "Biên lợi nhuận",
        description: "Phần giữ lại sau giá vốn và chi phí vận hành.",
        relatedMetrics: ["Biên gộp", "Chi phí bán hàng/doanh thu"],
        bctcChecks: ["Biên lợi nhuận gộp", "SG&A/doanh thu"],
        riskNote: "Cạnh tranh giá có thể làm biên mỏng.",
      },
      {
        id: "cashflow",
        label: "Dòng tiền",
        description: "Tiền thật còn lại sau vận hành và vốn lưu động.",
        relatedMetrics: ["CFO", "Vốn lưu động"],
        bctcChecks: ["Lưu chuyển tiền tệ", "CFO", "CAPEX"],
      },
    ],
    operatingMetrics: [
      {
        id: "stores",
        label: "Số cửa hàng",
        value: "5,600+",
        period: "Mock FY2024",
        status: "good",
        explanation: "Quy mô lớn tạo độ phủ thị trường.",
        isMock: true,
        detail: {
          definition: "Số điểm bán đang vận hành.",
          whyItMatters: "Cửa hàng là nơi tạo doanh thu nhưng cũng kéo chi phí cố định.",
          bctcCheck: ["Doanh thu", "Chi phí bán hàng", "Tài sản thuê"],
          commonMistake: "Nghĩ mở nhiều cửa hàng luôn tốt mà không kiểm tra hiệu quả.",
        },
      },
      {
        id: "revenue",
        label: "Doanh thu",
        value: "118,000 tỷ",
        period: "Mock FY2024",
        status: "watch",
        explanation: "Cần tách tăng trưởng theo mảng.",
        isMock: true,
        detail: {
          definition: "Tổng doanh thu bán hàng và dịch vụ.",
          whyItMatters: "Doanh thu cho biết quy mô nhưng chưa nói chất lượng lợi nhuận.",
          bctcCheck: ["Doanh thu thuần", "Doanh thu theo mảng"],
          commonMistake: "Chỉ nhìn doanh thu tăng mà bỏ qua biên lợi nhuận.",
        },
      },
      {
        id: "growth",
        label: "Tăng trưởng doanh thu",
        value: "+8.5% YoY",
        period: "Mock FY2024",
        status: "good",
        explanation: "Tín hiệu phục hồi sơ bộ.",
        isMock: true,
        detail: {
          definition: "Mức tăng doanh thu so với cùng kỳ.",
          whyItMatters: "Cho thấy sức mua và hiệu quả mở rộng.",
          bctcCheck: ["Doanh thu", "Thuyết minh doanh thu"],
          commonMistake: "Nhầm tăng do mở rộng với tăng hiệu quả.",
        },
      },
      {
        id: "gross-margin",
        label: "Biên lợi nhuận gộp",
        value: "19.8%",
        period: "Mock FY2024",
        status: "watch",
        explanation: "Biên mỏng nhạy với chi phí.",
        isMock: true,
        detail: {
          definition: "Phần doanh thu còn lại sau giá vốn.",
          whyItMatters: "Biên gộp quyết định doanh nghiệp giữ lại bao nhiêu tiền trước chi phí bán hàng.",
          bctcCheck: ["Doanh thu", "Giá vốn", "Biên gộp"],
          commonMistake: "Chỉ nhìn doanh thu mà bỏ qua giá vốn.",
        },
      },
      {
        id: "inventory",
        label: "Tồn kho",
        value: "42,000 tỷ",
        period: "Mock Q4/2024",
        status: "risk",
        explanation: "Tồn kho cao cần kiểm tra dòng tiền.",
        isMock: true,
        detail: {
          definition: "Giá trị hàng chưa bán tại cuối kỳ.",
          whyItMatters: "Tồn kho cao có thể khóa tiền và tạo rủi ro giảm giá.",
          bctcCheck: ["Hàng tồn kho", "Dự phòng tồn kho", "CFO"],
          commonMistake: "Xem tồn kho lớn là tài sản tốt mà không xét vòng quay.",
        },
      },
      {
        id: "cfo",
        label: "CFO",
        value: "Dương",
        period: "Mock FY2024",
        status: "good",
        explanation: "Dòng tiền hoạt động cần khớp lợi nhuận.",
        isMock: true,
        detail: {
          definition: "Dòng tiền từ hoạt động kinh doanh.",
          whyItMatters: "Kiểm tra lợi nhuận có chuyển thành tiền thật không.",
          bctcCheck: ["Lưu chuyển tiền tệ", "CFO", "Vốn lưu động"],
          commonMistake: "Chỉ nhìn lợi nhuận mà không xem dòng tiền.",
        },
      },
      {
        id: "sga",
        label: "Chi phí bán hàng/DT",
        value: "15.2%",
        period: "Mock FY2024",
        status: "watch",
        explanation: "Chi phí vận hành ảnh hưởng mạnh lợi nhuận.",
        isMock: true,
        detail: {
          definition: "Tỷ lệ chi phí bán hàng trên doanh thu.",
          whyItMatters: "Chuỗi bán lẻ có chi phí cửa hàng và nhân sự lớn.",
          bctcCheck: ["Chi phí bán hàng", "Doanh thu"],
          commonMistake: "Bỏ qua chi phí vận hành khi đánh giá mở rộng.",
        },
      },
      {
        id: "online",
        label: "Tỷ trọng online",
        value: "Cần cập nhật",
        period: "Mock placeholder",
        status: "unknown",
        explanation: "Chưa đủ dữ liệu realtime.",
        isMock: true,
        detail: {
          definition: "Tỷ lệ doanh thu từ kênh online.",
          whyItMatters: "Online có thể thay đổi cấu trúc chi phí và biên lợi nhuận.",
          bctcCheck: ["Thuyết minh doanh thu", "Báo cáo thường niên"],
          commonMistake: "Giả định online luôn có biên tốt hơn.",
        },
      },
    ],
    advantages: [
      { title: "Chuỗi cửa hàng phủ rộng", description: "Độ phủ giúp nhận diện thương hiệu và tiếp cận khách hàng.", module: "BCTC" },
      { title: "Thương hiệu bán lẻ mạnh", description: "Thương hiệu quen thuộc giúp giảm chi phí thuyết phục khách hàng.", module: "Hiểu DN" },
      { title: "Quy mô đàm phán", description: "Quy mô có thể cải thiện điều khoản với nhà cung cấp.", module: "BCTC" },
    ],
    risks: [
      { title: "Tồn kho tăng nhanh", description: "Tồn kho cao có thể gây áp lực dòng tiền.", module: "BCTC" },
      { title: "Biên lợi nhuận chưa phục hồi", description: "Cạnh tranh giá có thể làm biên gộp mỏng.", module: "BCTC" },
      { title: "CFO cần xác nhận", description: "Lợi nhuận cần chuyển thành tiền thật.", module: "BCTC" },
    ],
    readiness: [
      { id: "what", label: "Biết doanh nghiệp bán gì", status: "done", helperText: "Bán lẻ công nghệ, điện máy và tiêu dùng." },
      { id: "revenue", label: "Biết doanh thu đến từ đâu", status: "done", helperText: "Cửa hàng, online và dịch vụ đi kèm." },
      { id: "risk", label: "Biết rủi ro chính", status: "needs_check", helperText: "Tồn kho, biên lợi nhuận và CFO cần kiểm tra." },
      { id: "mini-check", label: "Hoàn thành mini check", status: "missing", helperText: "Cần trả lời đúng 3 câu bắt buộc." },
    ],
  },
  conclusion: {
    title: "Kết luận hiểu doanh nghiệp",
    description: "Tóm tắt những gì đã hiểu trước khi đi vào BCTC.",
    items: [
      {
        title: "Bản chất doanh nghiệp",
        content:
          "MWG là doanh nghiệp bán lẻ công nghệ và tiêu dùng, phụ thuộc vào sức mua nội địa, hiệu quả cửa hàng, biên lợi nhuận và quản trị tồn kho.",
      },
      {
        title: "Điều đang có vẻ là lợi thế",
        content:
          "Thương hiệu quen thuộc, mạng lưới lớn, năng lực vận hành và dữ liệu khách hàng.",
      },
      {
        title: "Điều cần kiểm chứng",
        content:
          "Mạng lưới lớn có còn tạo lợi nhuận tốt không, tồn kho có tăng bất thường không, biên lợi nhuận có bị cạnh tranh giá làm mỏng không, và chuỗi mới có tạo tiền thật không.",
      },
      {
        title: "Kết luận tạm thời",
        content:
          "Dễ hiểu ở mức mô hình kinh doanh, nhưng chưa thể kết luận chất lượng doanh nghiệp nếu chưa kiểm tra BCTC, dòng tiền, biên lợi nhuận và nợ vay.",
      },
    ],
  },
  groups: [
    {
      id: "identity",
      label: "Nhận diện nhanh",
      question: "Tôi đang phân tích doanh nghiệp nào?",
      intro:
        "Trước khi đọc số tài chính, hãy biết mình đang nhìn vào loại doanh nghiệp nào. Một công ty bán lẻ, ngân hàng, bất động sản hay công ty chu kỳ cần cách đọc hoàn toàn khác nhau.",
      blocks: [
        {
          title: "Thông tin nhận diện",
          content: "Quan sát sơ bộ về doanh nghiệp đang phân tích.",
          fields: [
            { label: "Tên doanh nghiệp", value: "Công ty Cổ phần Đầu tư Thế Giới Di Động" },
            { label: "Mã cổ phiếu", value: "MWG" },
            { label: "Ngành chính", value: "Bán lẻ / tiêu dùng" },
            { label: "Sản phẩm/dịch vụ chính", value: "Điện thoại, laptop, điện máy, phụ kiện và hàng tiêu dùng" },
            { label: "Thị trường hoạt động", value: "Việt Nam, tập trung vào khách hàng cá nhân và hộ gia đình" },
            { label: "Mức độ dễ hiểu", value: "Dễ hiểu ở mô hình, cần kiểm chứng bằng dữ liệu" },
          ],
        },
        {
          title: "Logic phân tích",
          content:
            "Theo dõi sức mua, biên lợi nhuận, tồn kho, hiệu quả vận hành cửa hàng và khả năng tạo tiền từ từng chuỗi.",
          tone: "accent",
        },
      ],
      output:
        "Loại doanh nghiệp: Bán lẻ / tiêu dùng. Mức dễ hiểu: Dễ hiểu ở mô hình, cần kiểm chứng bằng dữ liệu.",
    },
    {
      id: "money-machine",
      label: "Máy tạo tiền",
      question:
        "Công ty bán gì, bán cho ai, thu tiền từ đâu và chi phí lớn nhất là gì?",
      intro:
        "Cụm này gom sản phẩm, khách hàng, nguồn doanh thu, chi phí chính và khả năng mở rộng vào một câu chuyện tạo tiền thống nhất.",
      blocks: [
        {
          title: "Công ty bán gì?",
          content: "Điện thoại, laptop, điện máy, phụ kiện và hàng tiêu dùng.",
        },
        {
          title: "Bán cho ai?",
          content: "Người tiêu dùng cá nhân và hộ gia đình tại Việt Nam.",
        },
        {
          title: "Tiền đến từ đâu?",
          content: "Doanh thu từ chuỗi cửa hàng, kênh online và dịch vụ đi kèm.",
        },
        {
          title: "Chi phí lớn nhất là gì?",
          content:
            "Giá vốn hàng bán, nhân công, thuê mặt bằng, marketing, logistics và chi phí tài chính.",
        },
        {
          title: "Mở rộng bằng cách nào?",
          content:
            "Mở thêm điểm bán, tăng hiệu quả cửa hàng, mở chuỗi mới, tăng tỷ trọng bán online hoặc tối ưu hàng tồn kho.",
        },
      ],
      output:
        "Máy tạo tiền chính của MWG nằm ở doanh thu cửa hàng, biên lợi nhuận, tồn kho và hiệu quả vận hành chuỗi.",
    },
    {
      id: "industry-position",
      label: "Vị thế trong ngành",
      question:
        "Doanh nghiệp có lợi thế gì, hay chỉ đang ăn theo gió thuận của ngành?",
      intro:
        "Cụm này nối chuỗi giá trị, quyền lực thương lượng, lợi thế cạnh tranh và luận điểm ngành.",
      blocks: [
        {
          title: "Doanh nghiệp đứng ở đâu trong chuỗi giá trị?",
          content: "Nhà cung cấp -> Doanh nghiệp -> Nhà phân phối / cửa hàng -> Khách hàng cuối",
          tone: "accent",
        },
        {
          title: "Ai có quyền lực hơn?",
          content:
            "Khách hàng có quyền lựa chọn cao; nhà cung cấp có ảnh hưởng vì sản phẩm công nghệ phụ thuộc thương hiệu lớn; doanh nghiệp có lợi thế nhờ mạng lưới, vận hành và nhận diện thương hiệu; đối thủ cạnh tranh cao về giá và khuyến mãi.",
        },
        {
          title: "Lợi thế cạnh tranh sơ bộ",
          content: "Quan sát sơ bộ, cần kiểm chứng bằng dữ liệu vận hành.",
          bullets: [
            "Thương hiệu",
            "Quy mô",
            "Mạng lưới phân phối",
            "Dữ liệu khách hàng",
            "Năng lực vận hành",
            "Hệ sinh thái bán lẻ",
          ],
        },
        {
          title: "Liên kết với luận điểm ngành",
          content:
            "Nếu sức mua phục hồi, doanh nghiệp bán lẻ có thương hiệu và vận hành tốt có thể hưởng lợi. Nhưng cần kiểm tra biên lợi nhuận và tồn kho để tránh nhầm tăng trưởng doanh thu với tăng trưởng chất lượng.",
        },
      ],
      output:
        "MWG có lợi thế sơ bộ về quy mô, thương hiệu và vận hành, nhưng lợi thế này cần kiểm chứng bằng biên lợi nhuận, vòng quay tồn kho và hiệu quả chuỗi.",
    },
    {
      id: "governance-capital",
      label: "Quản trị và dùng vốn",
      question: "Ai điều hành doanh nghiệp và họ dùng tiền như thế nào?",
      intro:
        "Cụm này gom cổ đông, lãnh đạo, giao dịch liên quan, phân bổ vốn và hệ sinh thái nếu có công ty con hoặc chuỗi mới.",
      blocks: [
        {
          title: "Ai sở hữu và ai điều hành?",
          content: "Các điểm này cần lấy từ báo cáo quản trị, báo cáo thường niên và công bố chính thức.",
          fields: [
            { label: "Cổ đông lớn", value: "Cần kiểm tra thêm" },
            { label: "Tỷ lệ sở hữu", value: "Cần kiểm chứng bằng dữ liệu công bố" },
            { label: "Chủ tịch", value: "Cần kiểm tra trong tài liệu chính thức" },
            { label: "CEO", value: "Cần kiểm tra trong tài liệu chính thức" },
            { label: "Giao dịch bên liên quan", value: "Cần đọc kỹ trong báo cáo quản trị" },
            { label: "Thay đổi lãnh đạo bất thường", value: "Chưa đủ dữ kiện" },
          ],
        },
        {
          title: "Ban lãnh đạo dùng tiền như thế nào?",
          content: "Cần theo dõi mở rộng cửa hàng, M&A, trả cổ tức, trả nợ, mua cổ phiếu quỹ và đầu tư ngoài ngành.",
        },
        {
          title: "Đánh giá phân bổ vốn",
          content:
            "Trung lập, cần theo dõi thêm hiệu quả mở rộng và dòng tiền.",
          tone: "warning",
        },
      ],
      output:
        "Cần kiểm tra ban lãnh đạo dùng tiền để mở rộng có tạo dòng tiền thật hay chỉ làm tăng quy mô nhưng kéo giảm biên lợi nhuận.",
    },
    {
      id: "risks",
      label: "Rủi ro cần kiểm tra",
      question: "Điều gì có thể làm câu chuyện doanh nghiệp bị sai?",
      intro:
        "Cụm này tách rõ rủi ro quan sát sơ bộ và dữ liệu cần mang sang BCTC hoặc báo cáo thường niên.",
      blocks: [
        {
          title: "Sức mua yếu",
          content:
            "Mức độ: Rủi ro trung bình. Người tiêu dùng trì hoãn mua hàng không thiết yếu.",
          fields: [{ label: "Dữ liệu cần kiểm tra", value: "Doanh thu cùng cửa hàng, tồn kho, biên lợi nhuận" }],
          tone: "warning",
        },
        {
          title: "Cạnh tranh giá",
          content:
            "Mức độ: Rủi ro trung bình. Bán lẻ dễ chịu áp lực giá và khuyến mãi.",
          fields: [{ label: "Dữ liệu cần kiểm tra", value: "Biên gộp, chi phí bán hàng, lợi nhuận sau thuế" }],
          tone: "warning",
        },
        {
          title: "Nợ vay cao",
          content:
            "Mức độ: Cần kiểm tra thêm. Cần kiểm tra nợ vay, chi phí lãi vay và dòng tiền trong module BCTC.",
          fields: [{ label: "Dữ liệu cần kiểm tra", value: "Nợ vay, lãi vay, CFO, khả năng trả nợ" }],
          tone: "neutral",
        },
        {
          title: "Mở rộng quá nhanh",
          content:
            "Mức độ: Cần kiểm tra thêm. Mạng lưới mới có thể tăng quy mô nhưng kéo giảm hiệu quả nếu chưa tạo tiền.",
          fields: [{ label: "Dữ liệu cần kiểm tra", value: "CAPEX, chi phí bán hàng, doanh thu/cửa hàng, dòng tiền" }],
          tone: "neutral",
        },
      ],
      output:
        "Các rủi ro lớn cần mang sang BCTC là: tồn kho, biên lợi nhuận, dòng tiền hoạt động, nợ vay, chi phí bán hàng và hiệu quả mở rộng.",
    },
  ],
  bctcBridge: {
    title: "Sang BCTC cần kiểm tra gì?",
    description:
      "Sau khi hiểu doanh nghiệp, bước tiếp theo không phải kết luận tốt/xấu mà là kiểm chứng câu chuyện bằng số liệu.",
    ctaLabel: "Chuyển sang phân tích BCTC",
    disabledCtaLabel: "Hoàn thành câu hỏi bắt buộc để sang BCTC",
    items: [
      {
        question: "Doanh thu theo mảng có khớp với câu chuyện bán lẻ không?",
        module: "BCTC",
        dataToCheck: ["Doanh thu theo mảng", "Tăng trưởng doanh thu", "Doanh thu cửa hàng"],
      },
      {
        question: "Biên lợi nhuận có bị cạnh tranh giá làm giảm không?",
        module: "BCTC",
        dataToCheck: ["Biên gộp", "Biên EBIT", "Chi phí bán hàng"],
      },
      {
        question: "Tồn kho có tăng bất thường không?",
        module: "BCTC",
        dataToCheck: ["Hàng tồn kho", "Vòng quay tồn kho", "Dự phòng giảm giá tồn kho"],
      },
      {
        question: "Dòng tiền hoạt động có đi cùng lợi nhuận không?",
        module: "BCTC",
        dataToCheck: ["CFO", "Lợi nhuận sau thuế", "Vốn lưu động"],
      },
      {
        question: "Nợ vay và chi phí lãi vay có tạo áp lực không?",
        module: "BCTC",
        dataToCheck: ["Nợ vay", "Chi phí lãi vay", "Khả năng trả nợ"],
      },
      {
        question: "Chi phí bán hàng và quản lý có tăng nhanh hơn doanh thu không?",
        module: "BCTC",
        dataToCheck: ["Chi phí bán hàng", "Chi phí quản lý", "Tỷ lệ chi phí/doanh thu"],
      },
      {
        question: "Mở rộng chuỗi mới có tạo tiền thật hay chỉ làm tăng quy mô?",
        module: "BCTC",
        dataToCheck: ["CAPEX", "CFO", "Doanh thu/cửa hàng", "Lợi nhuận theo mảng"],
      },
    ],
  },
  miniCheck: {
    title: "Bạn đã hiểu doanh nghiệp ở mức cơ bản chưa?",
    description:
      "Chỉ nên đi tiếp khi bạn có thể giải thích doanh nghiệp bằng lời của mình.",
    successMessage: "Bạn đã đủ điều kiện chuyển sang phân tích BCTC.",
    failureMessage:
      "Bạn chưa nên chuyển sang BCTC. Hãy xem lại phần máy tạo tiền, rủi ro và cầu nối sang BCTC.",
    questions: [
      {
        question: "Doanh nghiệp này kiếm tiền chủ yếu từ đâu?",
        options: [
          "Từ bán hàng và dịch vụ bán lẻ",
          "Từ đầu tư tài chính là chính",
          "Chưa xác định được",
          "Từ chênh lệch định giá tài sản là chính",
        ],
        correctIndex: 0,
      },
      {
        question: "Rủi ro lớn cần kiểm tra tiếp là gì?",
        options: [
          "Biên lợi nhuận, tồn kho, dòng tiền và sức mua",
          "Chỉ cần xem giá cổ phiếu tăng hay giảm",
          "Chỉ cần xem tên công ty quen thuộc",
          "Chỉ cần xem doanh thu có tăng không",
        ],
        correctIndex: 0,
      },
      {
        question: "Sang BCTC cần kiểm tra gì đầu tiên?",
        options: [
          "Doanh thu, biên lợi nhuận, tồn kho, CFO và nợ vay",
          "Chỉ xem lợi nhuận sau thuế",
          "Chỉ xem P/E",
          "Chỉ xem số lượng cửa hàng",
        ],
        correctIndex: 0,
      },
    ],
  },
  nextActions: {
    title: "Hành động tiếp theo",
    description:
      "Các hành động chỉ phục vụ việc học và kiểm chứng dữ liệu ở bước sau.",
    icon: "N",
    actions: [
      {
        label: "Chuyển sang phân tích BCTC",
        description: "Kiểm tra doanh thu, biên lợi nhuận, tồn kho, dòng tiền và nợ vay.",
        variant: "primary",
      },
      {
        label: "Thêm vào Watchlist",
        description: "Theo dõi mã này nhưng chưa ra quyết định mua.",
        variant: "secondary",
      },
      {
        label: "Ghi chú điều cần kiểm tra thêm",
        description: "Lưu lại các câu hỏi cần xác minh ở bước sau.",
        variant: "ghost",
      },
      {
        label: "Quay lại Lọc cổ phiếu",
        description: "So sánh với mã ứng viên khác.",
        variant: "secondary",
      },
    ],
  },
  disclaimer: {
    title: "Cảnh báo bắt buộc",
    icon: "!",
    content:
      "Phần Hiểu doanh nghiệp chỉ giúp bạn hiểu doanh nghiệp trước khi đọc báo cáo tài chính, định giá và kiểm tra rủi ro. Một doanh nghiệp dễ hiểu hoặc có lợi thế cạnh tranh vẫn cần được kiểm chứng bằng dữ liệu.",
  },
};
