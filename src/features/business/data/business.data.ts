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
