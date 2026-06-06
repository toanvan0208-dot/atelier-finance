import type { ScreeningPageData } from "../types";

export const screeningPageData: ScreeningPageData = {
  isLoading: false,
  loading: {
    title: "Đang chuẩn bị bộ lọc mẫu",
    description:
      "Hệ thống đang gom bối cảnh ngành, khẩu vị rủi ro và danh sách cổ phiếu ứng viên.",
  },
  emptyState: {
    title: "Chưa có cổ phiếu phù hợp",
    description:
      "Thử đổi ngành, mục tiêu đầu tư hoặc khẩu vị rủi ro để mở rộng danh sách ứng viên.",
    icon: "∅",
  },
  hero: {
    eyebrow: "Lọc cổ phiếu",
    title: "Tìm ứng viên đáng phân tích sâu hơn",
    description:
      "Bộ lọc này giúp người mới phân loại cổ phiếu theo mức độ đáng theo dõi, không đưa ra khuyến nghị mua bán.",
    icon: "▽",
  },
  input: {
    title: "Chọn bối cảnh lọc",
    description:
      "Bắt đầu bằng ngành, khẩu vị rủi ro và mục tiêu đầu tư để hệ thống chọn tiêu chí dễ hiểu hơn.",
    industryLabel: "Ngành muốn lọc",
    riskLabel: "Khẩu vị rủi ro",
    objectiveLabel: "Mục tiêu đầu tư",
    thesisLabel: "Luận điểm ngành đang dùng để lọc",
    industries: [
      { value: "retail", label: "Bán lẻ" },
      { value: "banking", label: "Ngân hàng" },
      { value: "steel", label: "Thép" },
      { value: "technology", label: "Công nghệ" },
      { value: "real-estate", label: "Bất động sản" },
      { value: "logistics", label: "Logistics" },
    ],
    riskLevels: [
      { value: "low", label: "Thấp" },
      { value: "medium", label: "Trung bình" },
      { value: "high", label: "Cao" },
    ],
    objectives: [
      { value: "growth", label: "Tăng trưởng" },
      { value: "defensive", label: "Phòng thủ" },
      { value: "dividend", label: "Cổ tức" },
      { value: "recovery", label: "Phục hồi" },
    ],
    defaultIndustry: "retail",
    defaultRisk: "low",
    defaultObjective: "growth",
    thesis:
      "Sức mua phục hồi dần, doanh nghiệp có thương hiệu rõ và kiểm soát chi phí tốt sẽ được ưu tiên theo dõi.",
  },
  context: {
    title: "Tóm tắt bối cảnh trước khi lọc",
    icon: "AI",
    summary:
      "Bạn đang chọn ngành bán lẻ. Khẩu vị rủi ro của bạn là thấp. Ngành bán lẻ hiện đang được hỗ trợ bởi kỳ vọng phục hồi sức mua, nhưng vẫn có rủi ro từ chi phí vận hành và cạnh tranh. Vì vậy, hệ thống sẽ ưu tiên các doanh nghiệp bán lẻ có tài chính ổn định, thương hiệu rõ, thanh khoản tốt và mô hình dễ hiểu.",
  },
  beginner: {
    eyebrow: "Lớp 1",
    title: "Kết quả lọc nhanh cho người mới",
    description:
      "Màn hình này chỉ trả lời câu hỏi cổ phiếu có đáng chuyển sang bước phân tích doanh nghiệp hay không.",
    mainQuestion: "Cổ phiếu này có đáng phân tích tiếp không?",
    questionsTitle: "5 câu hỏi dễ hiểu",
    questions: [
      "Doanh nghiệp có khỏe không?",
      "Doanh nghiệp có vị thế gì trong ngành không?",
      "Doanh nghiệp có hưởng lợi từ ngành không?",
      "Cổ phiếu có rủi ro rõ ràng nào không?",
      "Cổ phiếu có phù hợp với người mới không?",
    ],
    metrics: [
      {
        title: "Nhóm ứng viên",
        value: "3",
        description: "Ưu tiên, cần kiểm tra thêm, hoặc tạm loại cho người mới.",
        icon: "G",
        status: "Phân loại",
      },
      {
        title: "Câu hỏi sàng lọc",
        value: "5",
        description: "Dùng ngôn ngữ phổ thông thay vì chỉ số tài chính phức tạp.",
        icon: "?",
        status: "Dễ hiểu",
      },
      {
        title: "Khuyến nghị mua bán",
        value: "0",
        period: "lệnh",
        description: "Danh sách chỉ là đầu vào cho bước phân tích sâu hơn.",
        icon: "!",
        status: "Cảnh báo",
      },
    ],
  },
  resultGroupLabels: {
    stockCountUnit: "mã",
  },
  stockCardLabels: {
    strengths: "Điểm mạnh sơ bộ",
    checks: "Cần kiểm tra thêm",
    risks: "Rủi ro chính",
  },
  resultGroups: [
    {
      key: "priority",
      title: "Ưu tiên phân tích sâu",
      description:
        "Nhóm có nhiều tín hiệu sơ bộ phù hợp để chuyển sang phân tích doanh nghiệp.",
      icon: "1",
      tone: "success",
      criteria: [
        "Có tài chính sơ bộ ổn",
        "Có vị thế rõ trong ngành",
        "Hưởng lợi từ luận điểm ngành",
        "Không có cảnh báo quản trị lớn",
        "Có chất xúc tác đáng theo dõi",
        "Định giá chưa quá vô lý",
        "Thanh khoản đủ tốt",
        "Mô hình kinh doanh tương đối dễ hiểu",
      ],
      stocks: [
        {
          ticker: "MWG",
          companyName: "Công ty bán lẻ A",
          classification: "Ưu tiên phân tích sâu",
          reason:
            "Có thương hiệu mạnh, mạng lưới lớn và hưởng lợi nếu sức mua phục hồi.",
          strengths: ["Quy mô dẫn đầu", "Thanh khoản tốt", "Mô hình dễ hiểu"],
          checks: ["Biên lợi nhuận", "Tốc độ phục hồi sức mua"],
          risks: ["Chi phí vận hành", "Cạnh tranh giá"],
          beginnerFit: "Phù hợp để học cách phân tích ngành bán lẻ.",
        },
        {
          ticker: "PNJ",
          companyName: "Công ty bán lẻ trang sức B",
          classification: "Ưu tiên phân tích sâu",
          reason:
            "Thương hiệu rõ, câu chuyện tiêu dùng dễ theo dõi và rủi ro vận hành tương đối minh bạch.",
          strengths: ["Thương hiệu rõ", "Biên lợi nhuận tốt", "Quản trị dễ theo dõi"],
          checks: ["Sức mua hàng không thiết yếu", "Tồn kho"],
          risks: ["Biến động giá nguyên liệu", "Chu kỳ tiêu dùng"],
          beginnerFit: "Tương đối phù hợp với người mới.",
        },
      ],
    },
    {
      key: "review",
      title: "Cần kiểm tra thêm",
      description:
        "Nhóm có điểm hấp dẫn nhưng vẫn còn câu hỏi cần làm rõ trước khi đi sâu.",
      icon: "2",
      tone: "warning",
      criteria: [
        "Có một số điểm hấp dẫn",
        "Dòng tiền hoặc định giá cần kiểm tra thêm",
        "Catalyst chưa chắc chắn",
        "Quản trị cần đọc kỹ hơn",
        "Mô hình kinh doanh chưa thật dễ hiểu",
      ],
      stocks: [
        {
          ticker: "FRT",
          companyName: "Công ty bán lẻ C",
          classification: "Cần kiểm tra thêm",
          reason:
            "Có câu chuyện tăng trưởng nhưng người mới cần hiểu rõ hơn về dòng tiền và biên lợi nhuận.",
          strengths: ["Có động lực mở rộng", "Câu chuyện ngành rõ"],
          checks: ["Dòng tiền", "Hiệu quả mở rộng điểm bán", "Định giá"],
          risks: ["Áp lực chi phí", "Tốc độ tăng trưởng không như kỳ vọng"],
          beginnerFit: "Có thể theo dõi, nhưng chưa nên kết luận nhanh.",
        },
        {
          ticker: "FPT",
          companyName: "Công ty công nghệ D",
          classification: "Cần kiểm tra thêm",
          reason:
            "Chất lượng doanh nghiệp tốt nhưng cần xem có thật sự khớp luận điểm ngành bán lẻ hay không.",
          strengths: ["Tài chính ổn", "Vị thế rõ", "Mô hình tăng trưởng tốt"],
          checks: ["Mức liên quan đến ngành đang lọc", "Định giá hiện tại"],
          risks: ["Không phải cổ phiếu thuần bán lẻ", "Kỳ vọng thị trường cao"],
          beginnerFit: "Phù hợp để theo dõi sau khi hiểu rõ ngành chính.",
        },
        {
          ticker: "VCB",
          companyName: "Ngân hàng E",
          classification: "Cần kiểm tra thêm",
          reason:
            "Doanh nghiệp chất lượng nhưng không trực tiếp thuộc luận điểm bán lẻ mẫu.",
          strengths: ["Vị thế mạnh", "Quản trị tốt"],
          checks: ["Luận điểm ngành ngân hàng", "Định giá tương đối"],
          risks: ["Sai bối cảnh lọc", "Chu kỳ tín dụng"],
          beginnerFit: "Nên phân tích trong module ngành ngân hàng.",
        },
      ],
    },
    {
      key: "excluded",
      title: "Tạm loại khỏi danh sách cho người mới",
      description:
        "Nhóm có rủi ro, độ khó hoặc mức không phù hợp khiến người mới nên phân tích sau.",
      icon: "3",
      tone: "danger",
      criteria: [
        "Tài chính yếu hoặc biến động mạnh",
        "Có cảnh báo quản trị rõ",
        "Thanh khoản thấp",
        "Định giá quá cao so với triển vọng",
        "Mô hình kinh doanh quá khó hiểu",
        "Không phù hợp khẩu vị rủi ro của người dùng",
      ],
      stocks: [
        {
          ticker: "HPG",
          companyName: "Công ty thép F",
          classification: "Tạm loại cho người mới",
          reason:
            "Không khớp ngành bán lẻ mẫu và chịu ảnh hưởng chu kỳ hàng hóa mạnh.",
          strengths: ["Quy mô lớn", "Thanh khoản tốt"],
          checks: ["Chu kỳ thép", "Biên lợi nhuận", "Nhu cầu xây dựng"],
          risks: ["Chu kỳ hàng hóa", "Không phù hợp bối cảnh bán lẻ"],
          beginnerFit: "Nên phân tích sau khi học module ngành thép.",
        },
        {
          ticker: "GMD",
          companyName: "Công ty logistics G",
          classification: "Tạm loại cho người mới",
          reason:
            "Mô hình logistics cần hiểu thêm về cảng, sản lượng và thương mại quốc tế.",
          strengths: ["Có tài sản hạ tầng", "Hưởng lợi nếu thương mại phục hồi"],
          checks: ["Sản lượng qua cảng", "Chu kỳ thương mại", "Định giá"],
          risks: ["Mô hình khó hơn bán lẻ", "Phụ thuộc thương mại"],
          beginnerFit: "Chưa phù hợp ở bối cảnh lọc bán lẻ.",
        },
        {
          ticker: "PVD",
          companyName: "Công ty dịch vụ dầu khí H",
          classification: "Tạm loại cho người mới",
          reason:
            "Rủi ro chu kỳ và biến động giá hàng hóa cao hơn khẩu vị rủi ro thấp.",
          strengths: ["Có catalyst nếu giá dầu thuận lợi"],
          checks: ["Giá dầu", "Giá thuê giàn", "Chu kỳ đầu tư dầu khí"],
          risks: ["Biến động mạnh", "Khó hiểu với người mới"],
          beginnerFit: "Không phù hợp với khẩu vị rủi ro thấp.",
        },
      ],
    },
  ],
  funnelStepLabels: {
    goal: "Mục tiêu",
    resultStatus: "Trạng thái kết quả",
  },
  deepDive: {
    title: "Phân tích chi tiết phễu lọc",
    description:
      "Lớp này chỉ mở khi người dùng muốn hiểu vì sao hệ thống phân loại cổ phiếu như vậy.",
    icon: "F",
    collapsedLabel: "Xem phân tích chi tiết",
    expandedLabel: "Thu gọn phân tích chi tiết",
    steps: [
      {
        step: "Bước 0",
        title: "Tóm tắt bối cảnh trước khi lọc",
        mainQuestion:
          "Bối cảnh vĩ mô, ngành và khẩu vị rủi ro hiện tại đang yêu cầu loại cổ phiếu nào?",
        goal: "Đảm bảo bộ lọc không tách rời khỏi ngành, vĩ mô và khẩu vị rủi ro.",
        resultStatus: "Ưu tiên doanh nghiệp dễ hiểu, tài chính ổn và thanh khoản tốt.",
        explanation:
          "Với khẩu vị rủi ro thấp, hệ thống giảm ưu tiên các cổ phiếu quá chu kỳ hoặc khó giải thích.",
      },
      {
        step: "Bước 1",
        title: "Kiểm tra sức khỏe tài chính sơ bộ",
        mainQuestion: "Doanh nghiệp có đủ khỏe để phân tích tiếp không?",
        goal: "Loại bớt doanh nghiệp có nền tài chính quá yếu ở vòng đầu.",
        resultStatus: "Đạt, cần kiểm tra thêm hoặc chưa phù hợp.",
        explanation:
          "Người mới nên bắt đầu với doanh nghiệp có doanh thu, lợi nhuận và dòng tiền dễ theo dõi.",
      },
      {
        step: "Bước 2",
        title: "Kiểm tra vị thế sơ bộ trong ngành",
        mainQuestion: "Doanh nghiệp này có vị thế gì trong ngành?",
        goal: "Xác định doanh nghiệp có lợi thế nhận diện, quy mô hoặc phân phối hay không.",
        resultStatus: "Có vị thế rõ, có vị thế vừa phải hoặc vị thế chưa rõ.",
        explanation:
          "Vị thế ngành giúp người mới hiểu vì sao một doanh nghiệp có thể hưởng lợi tốt hơn đối thủ.",
      },
      {
        step: "Bước 2.5",
        title: "Kiểm tra mức độ hưởng lợi từ luận điểm ngành",
        mainQuestion:
          "Nếu luận điểm ngành đúng, doanh nghiệp này có thật sự hưởng lợi không?",
        goal: "Tránh chọn cổ phiếu tốt nhưng không liên quan trực tiếp tới thesis đang dùng.",
        resultStatus: "Hưởng lợi rõ hoặc cần kiểm chứng thêm.",
        explanation:
          "Một cổ phiếu chỉ nên vào danh sách ưu tiên nếu câu chuyện ngành có khả năng đi vào kết quả kinh doanh.",
        outputs: [
          "Hưởng lợi rõ từ luận điểm ngành",
          "Có hưởng lợi nhưng cần kiểm chứng thêm",
          "Hưởng lợi chưa rõ",
          "Không phù hợp với luận điểm ngành",
        ],
      },
      {
        step: "Bước 3",
        title: "Kiểm tra cảnh báo quản trị và minh bạch sơ bộ",
        mainQuestion: "Có cảnh báo nào khiến người mới nên thận trọng không?",
        goal: "Nhận diện rủi ro quản trị trước khi dành thời gian phân tích sâu.",
        resultStatus: "Không thấy cảnh báo lớn hoặc cần đọc kỹ thêm.",
        explanation:
          "Người mới nên tránh các trường hợp thông tin khó kiểm chứng hoặc có cảnh báo minh bạch rõ.",
      },
      {
        step: "Bước 4",
        title: "Kiểm tra chất xúc tác sơ bộ",
        mainQuestion:
          "Có yếu tố nào có thể thúc đẩy thị trường chú ý đến cổ phiếu này không?",
        goal: "Tìm lý do hợp lý để cổ phiếu đáng được theo dõi trong 6-12 tháng.",
        resultStatus: "Có catalyst rõ, catalyst yếu hoặc chưa có catalyst.",
        explanation:
          "Catalyst không phải lý do mua, nhưng giúp xác định cổ phiếu có đáng đưa vào danh sách theo dõi không.",
      },
      {
        step: "Bước 5",
        title: "Kiểm tra định giá sơ bộ",
        mainQuestion:
          "Cổ phiếu này đang rẻ, hợp lý hay đắt so với chính nó và so với ngành?",
        goal: "Kiểm tra nhanh bằng chỉ số tương đối, không làm định giá chuyên sâu.",
        resultStatus: "Hợp lý, hơi cao hoặc cao so với triển vọng hiện tại.",
        explanation:
          "Ở bước này không dùng DCF, FCFF hay FCFE; chỉ xem P/E, P/B, EV/EBITDA nếu phù hợp.",
        outputs: [
          "Định giá tương đối hấp dẫn",
          "Định giá tương đối hợp lý",
          "Định giá hơi cao, cần kiểm tra thêm",
          "Định giá cao so với triển vọng hiện tại",
        ],
      },
      {
        step: "Bước 6",
        title: "Kiểm tra thanh khoản và khả năng giao dịch",
        mainQuestion: "Nếu người dùng mua cổ phiếu này, sau này có dễ bán ra không?",
        goal: "Giảm rủi ro kẹt thanh khoản cho người mới.",
        resultStatus: "Thanh khoản tốt hoặc cần thận trọng.",
        explanation:
          "Thanh khoản thấp có thể khiến người dùng khó thoát vị thế khi thị trường xấu.",
        outputs: [
          "Thanh khoản tốt",
          "Thanh khoản trung bình",
          "Thanh khoản thấp, cần thận trọng",
          "Không phù hợp với người mới do thanh khoản quá thấp",
        ],
      },
      {
        step: "Bước 7",
        title: "Kiểm tra độ dễ hiểu của doanh nghiệp",
        mainQuestion:
          "Người mới có thể hiểu doanh nghiệp này kiếm tiền như thế nào không?",
        goal: "Ưu tiên doanh nghiệp có mô hình kinh doanh dễ giải thích.",
        resultStatus: "Dễ hiểu hoặc nên phân tích sau.",
        explanation:
          "Người mới học nhanh hơn khi bắt đầu từ doanh nghiệp có sản phẩm, khách hàng và dòng tiền dễ hình dung.",
        outputs: [
          "Dễ hiểu với người mới",
          "Có thể hiểu nếu được giải thích",
          "Khó hiểu, nên phân tích sau",
          "Không phù hợp với người mới ở giai đoạn hiện tại",
        ],
      },
    ],
  },
  comparison: {
    title: "Bảng tổng hợp kết quả lọc",
    description:
      "Bảng này giúp so sánh nhanh một vài ứng viên trước khi chọn cổ phiếu để phân tích sâu.",
    icon: "T",
    caption: "Bảng tổng hợp kết quả lọc cổ phiếu mẫu",
    columns: {
      criterion: "Tiêu chí",
      stockA: "MWG",
      stockB: "FRT",
      stockC: "PNJ",
    },
    rows: [
      { criterion: "Tài chính sơ bộ", stockA: "Ổn", stockB: "Cần kiểm tra", stockC: "Ổn" },
      { criterion: "Vị thế trong ngành", stockA: "Rõ", stockB: "Đang mở rộng", stockC: "Rõ" },
      { criterion: "Hưởng lợi từ thesis ngành", stockA: "Rõ", stockB: "Có thể", stockC: "Có thể" },
      { criterion: "Quản trị và minh bạch", stockA: "Cần đọc thêm", stockB: "Cần đọc thêm", stockC: "Tương đối rõ" },
      { criterion: "Chất xúc tác", stockA: "Phục hồi sức mua", stockB: "Mở rộng chuỗi", stockC: "Tiêu dùng cao cấp" },
      { criterion: "Định giá sơ bộ", stockA: "Cần kiểm tra", stockB: "Cần kiểm tra", stockC: "Hợp lý hơn" },
      { criterion: "Thanh khoản", stockA: "Tốt", stockB: "Tốt", stockC: "Tốt" },
      { criterion: "Độ dễ hiểu", stockA: "Dễ hiểu", stockB: "Cần giải thích", stockC: "Dễ hiểu" },
      { criterion: "Phù hợp khẩu vị rủi ro", stockA: "Phù hợp", stockB: "Trung bình", stockC: "Phù hợp" },
      { criterion: "Kết luận", stockA: "Ưu tiên", stockB: "Kiểm tra thêm", stockC: "Ưu tiên" },
    ],
  },
  disclaimer: {
    title: "Cảnh báo bắt buộc",
    icon: "!",
    content:
      "Danh sách này không phải khuyến nghị mua bán. Đây chỉ là danh sách cổ phiếu ứng viên để chuyển sang bước phân tích doanh nghiệp chuyên sâu. Một cổ phiếu vượt qua bộ lọc không có nghĩa là nên mua ngay. Người dùng vẫn cần phân tích sâu hơn về mô hình kinh doanh, báo cáo tài chính, định giá, rủi ro và điểm mua phù hợp.",
  },
  understanding: {
    title: "Bạn đã hiểu đúng chưa?",
    description:
      "Phần này giúp người dùng tránh hiểu sai kết quả sàng lọc thành khuyến nghị mua bán.",
    icon: "?",
    questionsTitle: "5 câu hỏi tự kiểm tra",
    questions: [
      "Vì sao cổ phiếu vượt qua bộ lọc chưa có nghĩa là nên mua?",
      "Vì sao doanh nghiệp tốt nhưng định giá quá cao vẫn có thể rủi ro?",
      "Vì sao thanh khoản thấp lại nguy hiểm với người mới?",
      "Vì sao cổ phiếu phù hợp với ngành vẫn cần kiểm tra quản trị?",
      "Nếu một cổ phiếu có catalyst tốt nhưng mô hình kinh doanh quá khó hiểu, bạn nên làm gì?",
    ],
    feedbackTitle: "Phản hồi mẫu",
    feedbackLevels: [
      {
        label: "Hiểu đúng",
        description:
          "Bạn hiểu rằng bộ lọc chỉ tạo danh sách ứng viên, còn quyết định đầu tư cần phân tích sâu hơn.",
      },
      {
        label: "Hiểu đúng một phần",
        description:
          "Bạn hiểu đúng một phần, nhưng cần chỉnh lại. Hệ thống không nói cổ phiếu A là cổ phiếu nên mua. Hệ thống chỉ cho biết cổ phiếu A là ứng viên phù hợp để phân tích sâu hơn, vì nó đạt nhiều tiêu chí sơ bộ như tài chính ổn, vị thế rõ, có khả năng hưởng lợi từ ngành, thanh khoản tốt và dễ hiểu với người mới.",
      },
      {
        label: "Cần chỉnh lại",
        description:
          "Nếu bạn xem kết quả lọc như tín hiệu mua ngay, hãy quay lại phần cảnh báo và phân tích doanh nghiệp trước khi hành động.",
      },
    ],
  },
  nextActions: {
    title: "Bạn muốn chuyển cổ phiếu nào sang bước phân tích doanh nghiệp chuyên sâu?",
    description:
      "Chọn một cổ phiếu ứng viên rồi quyết định hành động tiếp theo trong hành trình học phân tích.",
    icon: "→",
    selectedStockLabel: "Cổ phiếu đang chọn",
    stocks: [
      { value: "MWG", label: "MWG" },
      { value: "PNJ", label: "PNJ" },
      { value: "FRT", label: "FRT" },
    ],
    actions: [
      { label: "Phân tích doanh nghiệp", variant: "primary" },
      { label: "Thêm vào Watchlist", variant: "secondary" },
      { label: "Ghi chú lý do theo dõi", variant: "ghost" },
    ],
  },
};
