import type { ScreeningPageData, ScreeningStock } from "../types";

const retailContext = {
  tailwind:
    "Sức mua nội địa có dấu hiệu phục hồi, lãi suất giảm hỗ trợ tiêu dùng và doanh nghiệp có thương hiệu rõ dễ được theo dõi hơn.",
  risks:
    "Cạnh tranh giá, chi phí vận hành, tồn kho và biên lợi nhuận suy giảm vẫn là các điểm cần kiểm tra trước khi đi sâu.",
  confirmations:
    "Doanh thu cùng cửa hàng, biên gộp, dòng tiền hoạt động, tồn kho, nợ vay và hiệu quả chuỗi mới.",
};

const funnelLayers = [
  {
    id: "industry",
    title: "Bối cảnh ngành",
    icon: "1",
    question: "Ngành này đang có gió thuận hay gió ngược?",
    explanation:
      "Một doanh nghiệp tốt vẫn có thể gặp khó nếu ngành đang đi ngược chu kỳ.",
    status: "Đạt" as const,
    criteria: ["Gió thuận ngành", "Rủi ro chu kỳ", "Luận điểm cần kiểm tra"],
    example:
      "Bán lẻ có thể hưởng lợi nếu sức mua phục hồi, nhưng cần soi biên lợi nhuận và tồn kho.",
    beginnerMistake:
      "Chỉ thấy tên doanh nghiệp quen thuộc rồi bỏ qua bối cảnh ngành đang hỗ trợ hay cản trở.",
  },
  {
    id: "business-model",
    title: "Mô hình kinh doanh",
    icon: "2",
    question: "Công ty kiếm tiền bằng cách nào, người mới có hiểu được không?",
    explanation:
      "Nếu chưa hiểu công ty kiếm tiền thế nào thì chưa nên phân tích sâu.",
    status: "Đạt" as const,
    criteria: ["Sản phẩm dễ hiểu", "Khách hàng rõ", "Nguồn doanh thu chính"],
    example:
      "Chuỗi bán lẻ có cửa hàng, doanh thu, biên lợi nhuận và tồn kho tương đối dễ hình dung.",
    beginnerMistake:
      "Nhìn biểu đồ giá trước khi hiểu doanh nghiệp thực sự bán gì và kiếm tiền từ đâu.",
  },
  {
    id: "financial-health",
    title: "Sức khỏe tài chính",
    icon: "3",
    question: "Công ty có dấu hiệu nguy hiểm về nợ, dòng tiền, tồn kho hoặc lợi nhuận không?",
    explanation:
      "Lợi nhuận đẹp nhưng không chuyển thành tiền mặt có thể là rủi ro.",
    status: "Cần kiểm tra" as const,
    criteria: ["Dòng tiền hoạt động", "Tồn kho", "Nợ vay"],
    example:
      "Doanh nghiệp bán lẻ cần kiểm tra lợi nhuận có đi cùng tiền thật và tồn kho có tăng bất thường không.",
    beginnerMistake:
      "Chỉ nhìn lợi nhuận sau thuế mà không kiểm tra dòng tiền hoạt động.",
  },
  {
    id: "valuation",
    title: "Định giá và kỳ vọng",
    icon: "4",
    question: "Giá hiện tại đã phản ánh quá nhiều kỳ vọng chưa?",
    explanation:
      "Cổ phiếu tốt nhưng giá quá cao vẫn có thể là khoản đầu tư kém.",
    status: "Cần kiểm tra" as const,
    criteria: ["P/E tương đối", "Tăng trưởng lợi nhuận", "Kỳ vọng thị trường"],
    example:
      "Nếu thị trường đã trả giá cao cho phục hồi sức mua, cần kiểm tra biên an toàn kỹ hơn.",
    beginnerMistake:
      "Nghĩ doanh nghiệp tốt đồng nghĩa với giá nào cũng hợp lý.",
  },
  {
    id: "liquidity-fit",
    title: "Thanh khoản và độ phù hợp",
    icon: "5",
    question: "Người mới có dễ theo dõi và thoát vị thế khi sai không?",
    explanation:
      "Cổ phiếu thanh khoản thấp có thể khiến người mới bị kẹt khi thị trường xấu.",
    status: "Đạt" as const,
    criteria: ["Thanh khoản", "Biến động", "Độ dễ hiểu"],
    example:
      "Ưu tiên mã có giao dịch đủ tốt, thông tin dễ kiểm tra và câu chuyện không quá phức tạp.",
    beginnerMistake:
      "Chạy theo mã tăng mạnh nhưng khối lượng giao dịch mỏng và khó thoát khi sai.",
  },
];

function stockFunnel(overrides: Partial<Record<string, string>> = {}) {
  return funnelLayers.map((layer) => ({
    layer: layer.title,
    status: layer.status,
    simpleExplanation:
      overrides[layer.id] ??
      (layer.id === "financial-health"
        ? "Cần kiểm tra thêm để đảm bảo lợi nhuận đi cùng dòng tiền và rủi ro nợ không tăng."
        : layer.explanation),
    nextDataToCheck:
      layer.id === "financial-health"
        ? ["Dòng tiền hoạt động", "Tồn kho", "Biên gộp", "Nợ vay"]
        : layer.criteria,
    relatedModule:
      layer.id === "industry"
        ? "Phân tích ngành"
        : layer.id === "financial-health"
          ? "Báo cáo tài chính"
          : layer.id === "valuation"
            ? "Định giá"
            : "Hiểu doanh nghiệp",
  }));
}

const stocks: Record<string, ScreeningStock> = {
  MWG: {
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    classification: "Đáng mở hồ sơ phân tích",
    reason:
      "Mô hình dễ hiểu, hưởng lợi nếu sức mua phục hồi và thanh khoản tốt.",
    mainReason:
      "Mô hình dễ hiểu, hưởng lợi nếu sức mua phục hồi và thanh khoản tốt.",
    needToCheck:
      "Biên lợi nhuận, tồn kho và hiệu quả chuỗi mới.",
    strengths: ["Quy mô dẫn đầu", "Thanh khoản tốt", "Mô hình dễ hiểu"],
    checks: ["Biên lợi nhuận", "Tồn kho", "Hiệu quả chuỗi mới"],
    risks: ["Chi phí vận hành", "Cạnh tranh giá"],
    beginnerFit: "Dễ hiểu với người mới nếu bắt đầu từ ngành bán lẻ.",
    beginnerFitLevel: "Dễ hiểu",
    conclusion: "Đủ điều kiện mở hồ sơ phân tích sâu hơn.",
    funnel: stockFunnel({
      industry: "Bán lẻ có thể hưởng lợi nếu sức mua nội địa phục hồi.",
      "business-model":
        "Doanh nghiệp bán sản phẩm tiêu dùng qua chuỗi cửa hàng, tương đối dễ hiểu.",
      "liquidity-fit":
        "Thanh khoản tốt và thông tin doanh nghiệp tương đối dễ theo dõi.",
    }),
  },
  PNJ: {
    ticker: "PNJ",
    companyName: "CTCP Vàng bạc Đá quý Phú Nhuận",
    classification: "Đáng mở hồ sơ phân tích",
    reason:
      "Thương hiệu rõ, biên lợi nhuận tốt và câu chuyện tiêu dùng dễ theo dõi.",
    mainReason:
      "Thương hiệu rõ, biên lợi nhuận tốt và câu chuyện tiêu dùng dễ theo dõi.",
    needToCheck:
      "Sức mua hàng không thiết yếu, tồn kho và biến động giá nguyên liệu.",
    strengths: ["Thương hiệu rõ", "Biên lợi nhuận tốt", "Quản trị dễ theo dõi"],
    checks: ["Sức mua trang sức", "Tồn kho", "Giá nguyên liệu"],
    risks: ["Chu kỳ tiêu dùng", "Biến động giá vàng"],
    beginnerFit: "Tương đối dễ hiểu, nhưng vẫn cần kiểm tra chu kỳ tiêu dùng.",
    beginnerFitLevel: "Dễ hiểu",
    conclusion: "Có thể mở hồ sơ phân tích nếu người dùng hiểu rủi ro tiêu dùng cao cấp.",
    funnel: stockFunnel({
      "financial-health":
        "Cần kiểm tra tồn kho và dòng tiền vì ngành trang sức có đặc thù nguyên liệu.",
      valuation:
        "Cần so sánh định giá với tốc độ tăng trưởng lợi nhuận thực tế.",
    }),
  },
  FRT: {
    ticker: "FRT",
    companyName: "CTCP Bán lẻ Kỹ thuật số FPT",
    classification: "Theo dõi thêm",
    reason:
      "Có câu chuyện mở rộng nhưng cần kiểm tra dòng tiền và hiệu quả chuỗi.",
    mainReason:
      "Có câu chuyện mở rộng nhưng cần kiểm tra dòng tiền và hiệu quả chuỗi.",
    needToCheck:
      "Dòng tiền, biên lợi nhuận và hiệu quả mở rộng điểm bán.",
    strengths: ["Có động lực mở rộng", "Câu chuyện ngành rõ"],
    checks: ["Dòng tiền", "Hiệu quả điểm bán", "Định giá"],
    risks: ["Áp lực chi phí", "Tăng trưởng không như kỳ vọng"],
    beginnerFit: "Có thể theo dõi, nhưng chưa nên kết luận nhanh.",
    beginnerFitLevel: "Trung bình",
    conclusion: "Nên theo dõi thêm trước khi mở hồ sơ phân tích sâu.",
    funnel: stockFunnel({
      "financial-health":
        "Cần kiểm tra dòng tiền và biên lợi nhuận vì mở rộng chuỗi có thể tạo áp lực chi phí.",
      valuation:
        "Cần xem kỳ vọng tăng trưởng đã phản ánh vào giá đến mức nào.",
    }),
  },
  FPT: {
    ticker: "FPT",
    companyName: "CTCP FPT",
    classification: "Theo dõi thêm",
    reason:
      "Doanh nghiệp chất lượng, nhưng cần kiểm tra mức khớp với bối cảnh lọc bán lẻ.",
    mainReason:
      "Doanh nghiệp chất lượng, nhưng cần kiểm tra mức khớp với bối cảnh lọc bán lẻ.",
    needToCheck:
      "Luận điểm ngành đang dùng, định giá hiện tại và nguồn tăng trưởng chính.",
    strengths: ["Tài chính ổn", "Vị thế rõ", "Mô hình tăng trưởng tốt"],
    checks: ["Mức liên quan đến ngành lọc", "Định giá hiện tại"],
    risks: ["Sai bối cảnh lọc", "Kỳ vọng thị trường cao"],
    beginnerFit: "Phù hợp để theo dõi sau khi hiểu rõ ngành chính.",
    beginnerFitLevel: "Trung bình",
    conclusion: "Nên đưa sang bối cảnh công nghệ nếu muốn phân tích đúng hơn.",
    funnel: stockFunnel({
      industry:
        "Doanh nghiệp tốt nhưng không trực tiếp nằm trong luận điểm bán lẻ đang chọn.",
      "business-model":
        "Mô hình công nghệ có nhiều mảng, người mới cần tách từng nguồn doanh thu.",
    }),
  },
  HPG: {
    ticker: "HPG",
    companyName: "CTCP Tập đoàn Hòa Phát",
    classification: "Chưa phù hợp với người mới",
    reason:
      "Không khớp bối cảnh bán lẻ và chịu ảnh hưởng chu kỳ hàng hóa mạnh.",
    mainReason:
      "Không khớp bối cảnh bán lẻ và chịu ảnh hưởng chu kỳ hàng hóa mạnh.",
    needToCheck:
      "Chu kỳ thép, giá nguyên liệu, nhu cầu xây dựng và tồn kho.",
    strengths: ["Quy mô lớn", "Thanh khoản tốt"],
    checks: ["Chu kỳ thép", "Biên lợi nhuận", "Nhu cầu xây dựng"],
    risks: ["Chu kỳ hàng hóa", "Không phù hợp bối cảnh bán lẻ"],
    beginnerFit: "Nên phân tích sau khi học module ngành thép.",
    beginnerFitLevel: "Khó",
    conclusion: "Chưa phù hợp với người mới trong bối cảnh lọc hiện tại.",
    funnel: stockFunnel({
      industry:
        "Ngành thép có chu kỳ riêng, không khớp luận điểm phục hồi bán lẻ.",
      "liquidity-fit":
        "Thanh khoản tốt nhưng biến động chu kỳ có thể khó với người mới.",
    }),
  },
};

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
      "Thử đổi ngành, mục tiêu hoặc khẩu vị rủi ro để mở rộng danh sách ứng viên.",
    icon: "0",
  },
  hero: {
    eyebrow: "Lọc cổ phiếu",
    title: "Lọc cổ phiếu ứng viên",
    description:
      "Module này giúp bạn tìm những cổ phiếu đáng phân tích sâu hơn dựa trên bối cảnh ngành, mô hình kinh doanh, sức khỏe tài chính, định giá sơ bộ, thanh khoản và mức độ phù hợp với người mới.",
    warningNote:
      "Kết quả lọc chỉ là vòng gửi xe, không phải khuyến nghị mua bán.",
    icon: "S",
  },
  input: {
    title: "Câu lọc của tôi",
    description:
      "Chọn đủ 3 yếu tố để hệ thống dựng một câu lọc dễ hiểu, thay vì bắt bạn nhớ lựa chọn ở nhiều tab.",
    sentenceTemplate: {
      prefix: "Tôi muốn tìm cổ phiếu thuộc",
      industryFallback: "một ngành cụ thể",
      riskFallback: "khẩu vị rủi ro phù hợp",
      objectiveFallback: "mục tiêu đầu tư rõ ràng",
    },
    industryLabel: "Ngành muốn lọc",
    riskLabel: "Khẩu vị rủi ro",
    objectiveLabel: "Mục tiêu",
    industries: [
      { value: "retail", label: "Bán lẻ" },
      { value: "banking", label: "Ngân hàng" },
      { value: "securities", label: "Chứng khoán" },
      { value: "real-estate", label: "Bất động sản" },
      { value: "steel", label: "Thép" },
      { value: "industrial-park", label: "Khu công nghiệp" },
      { value: "oil-gas", label: "Dầu khí" },
      { value: "power", label: "Điện" },
      { value: "ports", label: "Cảng biển" },
      { value: "technology", label: "Công nghệ" },
    ],
    riskLevels: [
      {
        value: "low",
        label: "Thấp",
        description: "Ưu tiên dễ hiểu, thanh khoản tốt, rủi ro thấp hơn.",
      },
      {
        value: "medium",
        label: "Trung bình",
        description: "Chấp nhận biến động để tìm cơ hội tốt hơn.",
      },
      {
        value: "high",
        label: "Cao",
        description: "Chỉ phù hợp khi đã hiểu chu kỳ, định giá và rủi ro.",
      },
    ],
    objectives: [
      {
        value: "learn",
        label: "Học cách phân tích",
        description: "Ưu tiên mã dễ hiểu để luyện quy trình phân tích.",
      },
      {
        value: "watch",
        label: "Theo dõi thêm",
        description: "Tạo danh sách quan sát nhưng chưa ra quyết định.",
      },
      {
        value: "medium-term",
        label: "Đầu tư trung hạn",
        description: "Tìm ứng viên có câu chuyện 6-18 tháng để kiểm tra.",
      },
      {
        value: "cycle",
        label: "Giao dịch theo chu kỳ",
        description: "Chỉ dùng khi hiểu rõ biến động ngành và điểm sai.",
      },
    ],
    defaultIndustry: "retail",
    defaultRisk: "low",
    defaultObjective: "learn",
  },
  context: {
    title: "Luận điểm bối cảnh",
    subtitle:
      "Hệ thống không lọc ngẫu nhiên. Mỗi bộ lọc bắt đầu từ một giả định về ngành và rủi ro cần kiểm tra.",
    icon: "C",
    summariesByIndustry: {
      retail: retailContext,
      banking: {
        tailwind: "Tăng trưởng tín dụng, NIM và chất lượng tài sản là điểm cần theo dõi.",
        risks: "Nợ xấu, dự phòng, CASA suy giảm và áp lực chi phí vốn.",
        confirmations: "Tăng trưởng tín dụng, NIM, nợ xấu, CASA và dự phòng.",
      },
      steel: {
        tailwind: "Đầu tư công và chu kỳ phục hồi hàng hóa có thể hỗ trợ nhu cầu thép.",
        risks: "Giá nguyên liệu, tồn kho, biên lợi nhuận và biến động chu kỳ.",
        confirmations: "Giá thép, giá quặng, tồn kho, sản lượng bán và biên gộp.",
      },
      technology: {
        tailwind: "Backlog, đơn hàng chuyển đổi số và biên lợi nhuận là các điểm hỗ trợ.",
        risks: "Chi phí nhân sự, phụ thuộc khách hàng lớn và kỳ vọng định giá cao.",
        confirmations: "Backlog, biên lợi nhuận, nhân sự, khách hàng và tăng trưởng đơn hàng.",
      },
      "real-estate": {
        tailwind: "Pháp lý và khả năng hấp thụ dự án quyết định chất lượng phục hồi.",
        risks: "Nợ vay, trái phiếu, dòng tiền dự án và tiến độ pháp lý.",
        confirmations: "Pháp lý, hấp thụ, nợ vay, trái phiếu và dòng tiền dự án.",
      },
    },
  },
  beginner: {
    items: [
      { label: "Đáng mở hồ sơ phân tích", value: "2 mã", tone: "success" },
      { label: "Theo dõi thêm", value: "2 mã", tone: "warning" },
      { label: "Chưa phù hợp với người mới", value: "1 mã", tone: "danger" },
      { label: "Câu hỏi sàng lọc chính", value: "5 tầng", tone: "accent" },
    ],
  },
  funnel: {
    title: "Hệ thống lọc qua 5 cửa nào?",
    description:
      "Trước khi xem mã cổ phiếu, hãy hiểu hệ thống đang loại nhiễu theo 5 tầng: bối cảnh ngành, mô hình kinh doanh, sức khỏe tài chính, định giá kỳ vọng và thanh khoản.",
    layers: funnelLayers,
  },
  resultGroupLabels: {
    stockCountUnit: "mã",
  },
  stockCardLabels: {
    reason: "Lý do chính",
    needToCheck: "Cần kiểm tra",
    beginnerFit: "Mức dễ hiểu",
    explainAction: "Xem vì sao được xếp nhóm",
    compareAction: "So sánh mã này",
    nextAction: "Mở hồ sơ phân tích",
  },
  resultGroups: [
    {
      key: "priority",
      title: "Đáng mở hồ sơ phân tích",
      description:
        "Các mã này chưa chắc đáng mua, nhưng đủ điều kiện để phân tích sâu hơn.",
      icon: "1",
      tone: "success",
      criteria: ["Mô hình dễ hiểu", "Thanh khoản tốt", "Luận điểm ngành rõ"],
      stocks: [stocks.MWG, stocks.PNJ],
    },
    {
      key: "review",
      title: "Theo dõi thêm",
      description:
        "Có điểm hấp dẫn, nhưng còn thiếu xác nhận hoặc có rủi ro cần soi kỹ.",
      icon: "2",
      tone: "warning",
      criteria: ["Cần kiểm tra dòng tiền", "Định giá cần soi thêm", "Bối cảnh chưa khớp hoàn toàn"],
      stocks: [stocks.FRT, stocks.FPT],
    },
    {
      key: "excluded",
      title: "Chưa phù hợp với người mới",
      description:
        "Không nhất thiết là doanh nghiệp xấu, nhưng hiện quá khó hiểu, rủi ro cao hoặc câu chuyện chưa rõ.",
      icon: "3",
      tone: "danger",
      criteria: ["Sai bối cảnh lọc", "Chu kỳ mạnh", "Khó với người mới"],
      stocks: [stocks.HPG],
    },
  ],
  deepDive: {
    title: "Hệ thống đã lọc như thế nào?",
    description:
      "Mở từng tầng khi bạn muốn hiểu bản chất tiêu chí. Phần này không cần đọc hết trước khi xem kết quả.",
    icon: "D",
    steps: funnelLayers.map((layer) => ({
      id: layer.id,
      title: layer.title,
      explanation: layer.explanation,
      criteria: layer.criteria,
      example: layer.example,
      beginnerMistake: layer.beginnerMistake,
    })),
  },
  comparison: {
    title: "Bảng so sánh nhanh",
    description:
      "Mặc định chỉ hiện các tiêu chí dễ hiểu. Bật chế độ nâng cao nếu muốn soi sâu hơn.",
    icon: "T",
    caption: "Bảng so sánh cổ phiếu ứng viên sau sàng lọc",
    simpleRows: [
      {
        ticker: "MWG",
        keptReason: stocks.MWG.mainReason,
        keyStrength: "Quy mô dẫn đầu, mô hình dễ hiểu.",
        needToCheck: stocks.MWG.needToCheck,
        beginnerFit: stocks.MWG.beginnerFitLevel,
        conclusion: "Mở hồ sơ phân tích",
      },
      {
        ticker: "PNJ",
        keptReason: stocks.PNJ.mainReason,
        keyStrength: "Thương hiệu rõ, biên lợi nhuận tốt.",
        needToCheck: stocks.PNJ.needToCheck,
        beginnerFit: stocks.PNJ.beginnerFitLevel,
        conclusion: "Mở hồ sơ nếu hiểu rủi ro tiêu dùng",
      },
      {
        ticker: "FRT",
        keptReason: stocks.FRT.mainReason,
        keyStrength: "Có động lực mở rộng.",
        needToCheck: stocks.FRT.needToCheck,
        beginnerFit: stocks.FRT.beginnerFitLevel,
        conclusion: "Theo dõi thêm",
      },
    ],
    advancedColumns: {
      criterion: "Tiêu chí",
      stockA: "MWG",
      stockB: "FRT",
      stockC: "PNJ",
    },
    advancedRows: [
      { criterion: "Tài chính sơ bộ", stockA: "Ổn", stockB: "Cần kiểm tra", stockC: "Ổn" },
      { criterion: "Vị thế trong ngành", stockA: "Rõ", stockB: "Đang mở rộng", stockC: "Rõ" },
      { criterion: "Hưởng lợi từ thesis ngành", stockA: "Rõ", stockB: "Có thể", stockC: "Có thể" },
      { criterion: "Quản trị và minh bạch", stockA: "Cần đọc thêm", stockB: "Cần đọc thêm", stockC: "Tương đối rõ" },
      { criterion: "Định giá sơ bộ", stockA: "Cần kiểm tra", stockB: "Cần kiểm tra", stockC: "Hợp lý hơn" },
      { criterion: "Thanh khoản", stockA: "Tốt", stockB: "Tốt", stockC: "Tốt" },
      { criterion: "Độ dễ hiểu", stockA: "Dễ hiểu", stockB: "Trung bình", stockC: "Dễ hiểu" },
    ],
  },
  disclaimer: {
    title: "Lưu ý bắt buộc",
    icon: "!",
    content:
      "Kết quả lọc chỉ phục vụ mục đích học tập và chọn ứng viên để phân tích tiếp. Đây không phải khuyến nghị mua bán. Người dùng cần tự kiểm tra lại doanh nghiệp, định giá, rủi ro và mức phù hợp với danh mục cá nhân trước khi ra quyết định.",
  },
  understanding: {
    title: "Trước khi lưu mã này, bạn có hiểu vì sao nó được chọn không?",
    description:
      "Mini quiz này giúp tránh hiểu nhầm kết quả lọc thành kết luận hành động.",
    icon: "?",
    questions: [
      {
        question: "Mã này được chọn vì bối cảnh nào?",
        options: ["Vì khớp một số giả định ngành và tiêu chí sơ bộ", "Vì giá chắc chắn sẽ tăng", "Vì hệ thống đã định giá đầy đủ"],
        correctIndex: 0,
        feedback: "Đúng. Bộ lọc chỉ chọn ứng viên dựa trên bối cảnh và tiêu chí sơ bộ.",
      },
      {
        question: "Rủi ro lớn nhất cần kiểm tra tiếp là gì?",
        options: ["Không cần kiểm tra thêm", "Dòng tiền, định giá và các giả định ngành", "Chỉ cần xem tên công ty quen thuộc"],
        correctIndex: 1,
        feedback: "Đúng. Cần kiểm tra dữ liệu tiếp theo trước khi ra quyết định.",
      },
      {
        question: "Đây là cổ phiếu đáng phân tích tiếp hay là kết luận hành động ngay?",
        options: ["Kết luận hành động ngay", "Lời nhắc ra quyết định ngay", "Ứng viên để phân tích sâu hơn"],
        correctIndex: 2,
        feedback:
          "Đây chỉ là cổ phiếu ứng viên để phân tích sâu hơn.",
      },
    ],
  },
  nextActions: {
    title: "Bước tiếp theo",
    description:
      "Chọn một cổ phiếu ứng viên rồi đi sang bước phân tích phù hợp. Watchlist chỉ để theo dõi, chưa phải quyết định mua.",
    icon: "N",
    selectedStockLabel: "Cổ phiếu đang chọn",
    stocks: [
      { value: "MWG", label: "MWG" },
      { value: "PNJ", label: "PNJ" },
      { value: "FRT", label: "FRT" },
    ],
    actions: [
      {
        label: "Mở hồ sơ doanh nghiệp",
        description: "Hiểu công ty kiếm tiền bằng cách nào.",
        variant: "primary",
      },
      {
        label: "So sánh với mã cùng ngành",
        description: "Đặt mã này cạnh các ứng viên tương tự.",
        variant: "secondary",
      },
      {
        label: "Thêm vào watchlist",
        description: "Theo dõi mã này nhưng chưa ra quyết định mua.",
        variant: "secondary",
      },
      {
        label: "Xem báo cáo tài chính",
        description: "Kiểm tra lợi nhuận có chuyển thành tiền không.",
        variant: "ghost",
      },
      {
        label: "Xem quản trị rủi ro",
        description: "Xác định điều kiện sai của thesis.",
        variant: "ghost",
      },
    ],
  },
};
