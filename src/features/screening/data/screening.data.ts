import type {
  BeginnerFitLevel,
  ScreeningFunnelLayer,
  ScreeningPageData,
  ScreeningStock,
  ScreeningStockGroupKey,
  ScreeningTone,
} from "../types";

const retailContext = {
  tailwind:
    "Sức mua nội địa có dấu hiệu phục hồi, lãi suất giảm hỗ trợ tiêu dùng.",
  risks:
    "Cạnh tranh giá, chi phí vận hành, tồn kho và biên lợi nhuận suy giảm.",
  confirmations:
    "Doanh thu cùng cửa hàng, biên gộp, dòng tiền hoạt động, tồn kho và nợ vay.",
  priority:
    "Doanh nghiệp dễ hiểu, thanh khoản tốt, có câu chuyện phục hồi nhưng chưa có cờ đỏ tài chính sơ bộ.",
};

const funnelLayers: ScreeningFunnelLayer[] = [
  {
    id: "industry",
    title: "Bối cảnh ngành",
    icon: "1",
    question: "Ngành này đang có gió thuận hay gió ngược?",
    explanation:
      "Một doanh nghiệp ổn vẫn có thể gặp khó nếu ngành đang đi ngược chu kỳ.",
    status: "Đạt sơ bộ",
    criteria: ["Sức mua", "Lãi suất", "Dữ liệu ngành", "Rủi ro chu kỳ"],
    example:
      "Bán lẻ có thể hưởng lợi nếu sức mua phục hồi, nhưng cần soi biên lợi nhuận và tồn kho.",
    beginnerMistake:
      "Chỉ thấy tên doanh nghiệp quen thuộc rồi bỏ qua bối cảnh ngành.",
  },
  {
    id: "business-model",
    title: "Độ dễ hiểu doanh nghiệp",
    icon: "2",
    question: "Người mới có hiểu công ty kiếm tiền bằng cách nào không?",
    explanation:
      "Nếu chưa hiểu nguồn doanh thu chính, người dùng chưa nên mở phân tích sâu.",
    status: "Đạt",
    criteria: ["Nguồn doanh thu", "Sản phẩm chính", "Khách hàng", "Mạng lưới bán hàng"],
    example:
      "Chuỗi bán lẻ có cửa hàng, doanh thu, biên lợi nhuận và tồn kho tương đối dễ hình dung.",
    beginnerMistake:
      "Nhìn biến động giá trước khi hiểu doanh nghiệp bán gì và kiếm tiền từ đâu.",
  },
  {
    id: "financial-warning",
    title: "Cảnh báo tài chính sơ bộ",
    icon: "3",
    question: "Có cờ đỏ lớn về lợi nhuận, nợ, tồn kho hoặc dòng tiền không?",
    explanation:
      "Bước này chưa phân tích đầy đủ báo cáo tài chính, chỉ tìm các dấu hiệu cần kiểm tra.",
    status: "Cần kiểm tra",
    criteria: ["CFO", "Tồn kho", "Nợ vay", "Biên lợi nhuận", "Ý kiến kiểm toán"],
    example:
      "Doanh nghiệp bán lẻ cần kiểm tra lợi nhuận có đi cùng tiền thật và tồn kho có tăng bất thường không.",
    beginnerMistake:
      "Chỉ nhìn lợi nhuận sau thuế mà không kiểm tra dòng tiền hoạt động.",
  },
  {
    id: "valuation",
    title: "Định giá sơ bộ",
    icon: "4",
    question: "Giá hiện tại có đang phản ánh quá nhiều kỳ vọng không?",
    explanation:
      "Bước này chỉ kiểm tra nhanh xem định giá có quá bất thường so với tăng trưởng và ngành hay không.",
    status: "Cần kiểm tra",
    criteria: ["P/E", "P/B", "Tăng trưởng lợi nhuận", "So với ngành", "Catalyst"],
    example:
      "Nếu thị trường đã trả giá cao cho phục hồi sức mua, cần kiểm tra biên an toàn kỹ hơn.",
    beginnerMistake:
      "Nghĩ doanh nghiệp dễ hiểu đồng nghĩa với giá nào cũng hợp lý.",
  },
  {
    id: "liquidity",
    title: "Thanh khoản sơ bộ cho người mới",
    icon: "5",
    question: "Mã này có đủ thanh khoản để người mới theo dõi và xử lý khi sai không?",
    explanation:
      "Thanh khoản là tiêu chí phòng vệ, không phải tín hiệu dự đoán giá.",
    status: "Đạt sơ bộ",
    criteria: ["GTGD trung bình", "Khối lượng", "Biến động giá", "Phiên mất thanh khoản"],
    example:
      "Ưu tiên mã có giao dịch đủ tốt, thông tin dễ kiểm tra và câu chuyện không quá phức tạp.",
    beginnerMistake:
      "Chạy theo mã biến động mạnh nhưng giao dịch mỏng và khó xử lý khi sai.",
  },
];

const layerMeta = {
  industry: {
    dataPoints: ["Sức mua", "Lãi suất", "CPI", "Dữ liệu ngành", "Rủi ro chu kỳ"],
    simpleReading:
      "Hệ thống kiểm tra ngành trước để tránh chọn mã không khớp bối cảnh.",
    currentResult:
      "Bối cảnh ngành đủ đáng quan tâm, nhưng từng doanh nghiệp vẫn cần kiểm tra riêng.",
    impact:
      "Mã khớp ngành đi tiếp; mã lệch ngành chuyển sang theo dõi hoặc chưa phù hợp với người mới.",
    nextStep: "Mở module Phân tích ngành",
    scoring:
      "Chấm theo mức khớp với thesis ngành, dữ liệu vĩ mô và rủi ro chu kỳ.",
  },
  "business-model": {
    dataPoints: ["Nguồn doanh thu", "Sản phẩm chính", "Khách hàng", "Cơ cấu lợi nhuận"],
    simpleReading:
      "Doanh nghiệp càng dễ hiểu thì người mới càng ít đọc sai câu chuyện kinh doanh.",
    currentResult:
      "Một số mã có mô hình đủ rõ để mở hồ sơ phân tích sâu hơn.",
    impact:
      "Mô hình dễ hiểu được ưu tiên. Mô hình quá phức tạp bị chuyển xuống nhóm thận trọng.",
    nextStep: "Mở hồ sơ doanh nghiệp",
    scoring:
      "Chấm theo khả năng giải thích doanh thu, lợi nhuận và yếu tố bất thường bằng ngôn ngữ đơn giản.",
  },
  "financial-warning": {
    dataPoints: ["CFO", "Tồn kho", "Nợ vay", "Biên lợi nhuận", "Phải thu"],
    simpleReading:
      "Không kết luận tài chính tốt; chỉ tìm cờ đỏ lớn trước khi cho mã đi tiếp.",
    currentResult:
      "Một số chỉ tiêu cần mở module báo cáo tài chính để xác nhận.",
    impact:
      "Không có cờ đỏ lớn thì đi tiếp; có điểm nghi ngờ thì gắn nhãn Cần kiểm tra.",
    nextStep: "Mở module Báo cáo tài chính",
    scoring:
      "Chấm theo dấu hiệu lỗ kéo dài, dòng tiền yếu, nợ tăng, tồn kho hoặc phải thu tăng bất thường.",
  },
  valuation: {
    dataPoints: ["P/E", "P/B", "EV/EBITDA", "Tăng trưởng lợi nhuận", "So với ngành"],
    simpleReading:
      "Định giá sơ bộ chỉ giúp phát hiện mức quá bất thường, chưa thay thế module định giá.",
    currentResult:
      "Giá có thể đã phản ánh một phần kỳ vọng phục hồi, cần kiểm tra tiếp.",
    impact:
      "Định giá không quá bất thường thì giữ lại; nếu kỳ vọng quá cao thì chuyển sang theo dõi thêm.",
    nextStep: "Mở module Định giá",
    scoring:
      "Chấm theo tương quan định giá, tốc độ tăng trưởng và chênh lệch so với nhóm cùng ngành.",
  },
  liquidity: {
    dataPoints: ["GTGD trung bình", "Khối lượng", "Free-float sơ bộ", "Biến động giá"],
    simpleReading:
      "Thanh khoản giúp người mới tránh các mã khó theo dõi hoặc khó xử lý khi giả định sai.",
    currentResult:
      "Các mã còn lại có thanh khoản đủ để đưa vào danh sách theo dõi sơ bộ.",
    impact:
      "Thanh khoản tốt được giữ lại; thanh khoản mỏng chuyển sang chưa phù hợp với người mới.",
    nextStep: "Mở module Thanh khoản / dòng tiền",
    scoring:
      "Chấm theo giá trị giao dịch, độ ổn định khối lượng và rủi ro mất thanh khoản.",
  },
};

function stockFunnel(
  overrides: Partial<Record<ScreeningFunnelLayer["id"], string>> = {}
) {
  return funnelLayers.map((layer) => {
    const meta = layerMeta[layer.id as keyof typeof layerMeta];

    return {
      layer: layer.title,
      status: layer.status,
      dataPoints: meta.dataPoints,
      simpleExplanation: overrides[layer.id] ?? meta.simpleReading,
      nextDataToCheck: layer.criteria,
      relatedModule: meta.nextStep,
    };
  });
}

function createStock({
  beginnerFitLevel,
  checks,
  classification,
  companyName,
  conclusion,
  groupKey,
  mainReason,
  needToCheck,
  risks,
  sector,
  strengths,
  ticker,
}: {
  ticker: string;
  companyName: string;
  sector: string;
  groupKey: ScreeningStockGroupKey;
  classification: string;
  mainReason: string;
  needToCheck: string;
  strengths: string[];
  checks: string[];
  risks: string[];
  beginnerFitLevel: BeginnerFitLevel;
  conclusion: string;
}): ScreeningStock {
  return {
    ticker,
    companyName,
    sector,
    groupKey,
    classification,
    reason: mainReason,
    mainReason,
    needToCheck,
    strengths,
    checks,
    risks,
    beginnerFit:
      beginnerFitLevel === "Dễ hiểu"
        ? "Dễ hiểu với người mới nếu vẫn kiểm tra dữ liệu ở các module sau."
        : beginnerFitLevel === "Trung bình"
          ? "Có thể theo dõi, nhưng cần đọc kỹ bối cảnh và rủi ro trước."
          : "Nên học thêm về ngành và rủi ro trước khi phân tích sâu.",
    beginnerFitLevel,
    conclusion,
    metrics: mockMetrics(ticker),
    funnel: stockFunnel(),
  };
}

function mockMetrics(ticker: string): ScreeningStock["metrics"] {
  const base = {
    MWG: ["14.2x", "2.1x", "16.4%", "+8.5% YoY", "Dương", "0.6x", "2.4 triệu cp/ngày"],
    PNJ: ["18.6x", "3.3x", "18.9%", "+11.2% YoY", "Dương", "0.4x", "0.9 triệu cp/ngày"],
    FRT: ["22.4x", "4.0x", "14.1%", "+12.8% YoY", "Theo dõi", "1.2x", "1.8 triệu cp/ngày"],
    FPT: ["21.8x", "5.4x", "24.7%", "+19.5% YoY", "Dương", "0.2x", "3.1 triệu cp/ngày"],
    HPG: ["13.5x", "1.5x", "12.6%", "+6.9% YoY", "Dương", "0.5x", "18.2 triệu cp/ngày"],
    VCB: ["15.9x", "2.7x", "19.8%", "+7.4% YoY", "Dương", "N/A", "1.1 triệu cp/ngày"],
    TCB: ["8.7x", "1.2x", "15.2%", "+5.1% YoY", "Dương", "N/A", "4.6 triệu cp/ngày"],
    SSI: ["16.1x", "1.9x", "13.4%", "+10.6% YoY", "Biến động", "0.8x", "12.7 triệu cp/ngày"],
  }[ticker] ?? ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A"];

  return [
    { id: "pe", label: "P/E", value: base[0], status: "neutral", explanation: "Định giá sơ bộ theo lợi nhuận.", isMock: true },
    { id: "pb", label: "P/B", value: base[1], status: "neutral", explanation: "Định giá theo giá trị sổ sách.", isMock: true },
    { id: "roe", label: "ROE", value: base[2], status: "pass", explanation: "Hiệu quả vốn chủ sở hữu.", isMock: true },
    { id: "growth", label: "Doanh thu", value: base[3], status: "pass", explanation: "Tăng trưởng doanh thu gần nhất.", isMock: true },
    { id: "cfo", label: "CFO", value: base[4], status: base[4] === "Dương" ? "pass" : "watch", explanation: "Dòng tiền kinh doanh sơ bộ.", isMock: true },
    { id: "debt", label: "D/E", value: base[5], status: base[5] === "N/A" ? "neutral" : "watch", explanation: "Đòn bẩy tài chính sơ bộ.", isMock: true },
    { id: "liquidity", label: "Thanh khoản", value: base[6], status: "pass", explanation: "Khối lượng giao dịch bình quân.", isMock: true },
  ];
}

const stocksByTicker: Record<string, ScreeningStock> = {
  MWG: createStock({
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    sector: "Bán lẻ",
    groupKey: "priority",
    classification: "Đáng mở hồ sơ phân tích",
    mainReason:
      "Mô hình kinh doanh dễ hiểu, thuộc ngành nhạy với sức mua nội địa, thanh khoản tốt.",
    needToCheck:
      "Biên lợi nhuận, tồn kho, dòng tiền hoạt động và định giá hiện tại.",
    strengths: ["Quy mô dẫn đầu", "Thanh khoản tốt", "Mô hình dễ hiểu"],
    checks: ["Biên lợi nhuận", "Tồn kho", "Dòng tiền hoạt động"],
    risks: ["Chi phí vận hành", "Cạnh tranh giá"],
    beginnerFitLevel: "Dễ hiểu",
    conclusion: "Đủ điều kiện mở hồ sơ phân tích sâu hơn.",
  }),
  PNJ: createStock({
    ticker: "PNJ",
    companyName: "CTCP Vàng bạc Đá quý Phú Nhuận",
    sector: "Bán lẻ",
    groupKey: "priority",
    classification: "Đáng mở hồ sơ phân tích",
    mainReason:
      "Thương hiệu rõ, biên lợi nhuận tốt và câu chuyện tiêu dùng dễ theo dõi.",
    needToCheck:
      "Sức mua hàng không thiết yếu, tồn kho và biến động giá nguyên liệu.",
    strengths: ["Thương hiệu rõ", "Biên lợi nhuận tốt", "Quản trị dễ theo dõi"],
    checks: ["Sức mua trang sức", "Tồn kho", "Giá nguyên liệu"],
    risks: ["Chu kỳ tiêu dùng", "Biến động giá vàng"],
    beginnerFitLevel: "Dễ hiểu",
    conclusion: "Có thể mở hồ sơ nếu hiểu rủi ro tiêu dùng cao cấp.",
  }),
  FRT: createStock({
    ticker: "FRT",
    companyName: "CTCP Bán lẻ Kỹ thuật số FPT",
    sector: "Bán lẻ",
    groupKey: "review",
    classification: "Theo dõi thêm",
    mainReason:
      "Có câu chuyện mở rộng nhưng cần kiểm tra dòng tiền và hiệu quả chuỗi.",
    needToCheck:
      "Dòng tiền, biên lợi nhuận và hiệu quả mở rộng điểm bán.",
    strengths: ["Có động lực mở rộng", "Câu chuyện ngành rõ"],
    checks: ["Dòng tiền", "Hiệu quả điểm bán", "Định giá sơ bộ"],
    risks: ["Áp lực chi phí", "Mở rộng chưa hiệu quả"],
    beginnerFitLevel: "Trung bình",
    conclusion: "Theo dõi thêm trước khi mở hồ sơ phân tích sâu.",
  }),
  FPT: createStock({
    ticker: "FPT",
    companyName: "CTCP FPT",
    sector: "Công nghệ",
    groupKey: "review",
    classification: "Theo dõi thêm",
    mainReason:
      "Mô hình có nhiều mảng tăng trưởng, nhưng cần chuyển sang bối cảnh công nghệ để đọc đúng.",
    needToCheck:
      "Backlog, biên lợi nhuận, khách hàng lớn và định giá hiện tại.",
    strengths: ["Vị thế rõ", "Tài chính ổn", "Câu chuyện chuyển đổi số"],
    checks: ["Nguồn tăng trưởng", "Định giá", "Phụ thuộc khách hàng"],
    risks: ["Kỳ vọng thị trường cao", "Chi phí nhân sự"],
    beginnerFitLevel: "Trung bình",
    conclusion: "Phù hợp để theo dõi sau khi hiểu rõ ngành công nghệ.",
  }),
  HPG: createStock({
    ticker: "HPG",
    companyName: "CTCP Tập đoàn Hòa Phát",
    sector: "Thép",
    groupKey: "excluded",
    classification: "Chưa phù hợp với người mới",
    mainReason:
      "Chịu ảnh hưởng chu kỳ hàng hóa mạnh, cần hiểu ngành thép trước khi phân tích.",
    needToCheck:
      "Chu kỳ thép, giá nguyên liệu, nhu cầu xây dựng và tồn kho.",
    strengths: ["Quy mô lớn", "Thanh khoản tốt"],
    checks: ["Chu kỳ thép", "Biên lợi nhuận", "Nhu cầu xây dựng"],
    risks: ["Chu kỳ hàng hóa", "Biến động lợi nhuận cao"],
    beginnerFitLevel: "Khó",
    conclusion: "Chưa phù hợp với người mới trong bối cảnh lọc hiện tại.",
  }),
  VCB: createStock({
    ticker: "VCB",
    companyName: "Ngân hàng TMCP Ngoại thương Việt Nam",
    sector: "Ngân hàng",
    groupKey: "review",
    classification: "Theo dõi thêm",
    mainReason:
      "Ngân hàng đầu ngành nhưng người mới cần hiểu tín dụng, NIM và nợ xấu trước.",
    needToCheck: "Tăng trưởng tín dụng, NIM, nợ xấu, dự phòng và định giá.",
    strengths: ["Vị thế đầu ngành", "Chất lượng tài sản tương đối rõ"],
    checks: ["NIM", "Nợ xấu", "Dự phòng"],
    risks: ["Chu kỳ tín dụng", "Định giá ngành ngân hàng"],
    beginnerFitLevel: "Trung bình",
    conclusion: "Theo dõi thêm và học bối cảnh ngân hàng trước.",
  }),
  TCB: createStock({
    ticker: "TCB",
    companyName: "Ngân hàng TMCP Kỹ thương Việt Nam",
    sector: "Ngân hàng",
    groupKey: "review",
    classification: "Theo dõi thêm",
    mainReason:
      "Có câu chuyện tăng trưởng riêng nhưng cần soi chất lượng tài sản và chu kỳ tín dụng.",
    needToCheck: "CASA, NIM, nợ xấu, trái phiếu và khả năng tăng tín dụng.",
    strengths: ["Mô hình bán lẻ mạnh", "Hiệu quả hoạt động đáng theo dõi"],
    checks: ["CASA", "Nợ xấu", "Trái phiếu"],
    risks: ["Chu kỳ bất động sản", "Chi phí vốn"],
    beginnerFitLevel: "Trung bình",
    conclusion: "Theo dõi thêm sau khi hiểu các chỉ tiêu ngân hàng.",
  }),
  SSI: createStock({
    ticker: "SSI",
    companyName: "CTCP Chứng khoán SSI",
    sector: "Chứng khoán",
    groupKey: "excluded",
    classification: "Chưa phù hợp với người mới",
    mainReason:
      "Lợi nhuận nhạy với thanh khoản thị trường và chu kỳ môi giới, dễ biến động mạnh.",
    needToCheck: "Thanh khoản thị trường, margin, tự doanh và chu kỳ ngành.",
    strengths: ["Thương hiệu lớn", "Thanh khoản cổ phiếu tốt"],
    checks: ["Tự doanh", "Margin", "Thanh khoản thị trường"],
    risks: ["Chu kỳ thị trường", "Biến động lợi nhuận"],
    beginnerFitLevel: "Khó",
    conclusion: "Chỉ nên phân tích sau khi hiểu ngành chứng khoán.",
  }),
};

const groupTone: Record<ScreeningStockGroupKey, ScreeningTone> = {
  priority: "success",
  review: "warning",
  excluded: "danger",
};

function groupStocks(key: ScreeningStockGroupKey) {
  return Object.values(stocksByTicker).filter((stock) => stock.groupKey === key);
}

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
  modeOptions: [
    {
      value: "context",
      title: "Tôi chưa có mã, muốn hệ thống lọc ứng viên",
      description:
        "Chọn ngành, khẩu vị rủi ro và mục tiêu để hệ thống tạo danh sách cổ phiếu ứng viên.",
    },
    {
      value: "ticker",
      title: "Tôi đã có mã cổ phiếu muốn kiểm tra",
      description:
        "Nhập mã cổ phiếu để chạy nhanh qua 5 cửa sơ lọc trước khi phân tích sâu.",
    },
  ],
  tickerInput: {
    title: "Kiểm tra nhanh một mã cổ phiếu",
    description:
      "Đã có mã cổ phiếu trong đầu? Nhập mã để hệ thống kiểm tra nhanh qua 5 cửa sơ lọc. Kết quả chỉ cho biết mã này có đáng mở hồ sơ phân tích sâu hay không.",
    label: "Nhập mã cổ phiếu",
    placeholder: "Ví dụ: MWG, FPT, HPG, VCB",
    buttonLabel: "Kiểm tra mã này",
    helper:
      "Hệ thống sẽ tự nhận diện ngành của mã, sau đó chạy qua 5 cửa sơ lọc: bối cảnh ngành, độ dễ hiểu doanh nghiệp, cảnh báo tài chính sơ bộ, định giá sơ bộ và thanh khoản sơ bộ.",
    emptyError: "Vui lòng nhập mã cổ phiếu.",
    missingError:
      "Chưa có dữ liệu cho mã này. Hãy thử mã khác hoặc thêm dữ liệu backend.",
    lengthError: "Mã cổ phiếu cần từ 3 đến 10 ký tự.",
  },
  hero: {
    eyebrow: "Bạn đang ở bước 4/9",
    title: "Lọc cổ phiếu ứng viên",
    description:
      "Tạo danh sách cổ phiếu đáng phân tích tiếp, không phải kết luận mua bán.",
    warningNote:
      "Kết quả lọc chỉ là vòng gửi xe. Báo cáo tài chính, định giá và thanh khoản chuyên sâu sẽ được kiểm tra ở các module sau.",
    progressLabel: "Tiến độ module",
    progressValue: 44,
    statusLabel: "Đang xây dựng",
    icon: "S",
  },
  input: {
    title: "Câu lọc của tôi",
    description:
      "Chọn đủ 3 yếu tố để hệ thống hiểu bạn đang tìm loại cổ phiếu nào. Đừng giấu các lựa chọn này trong tab.",
    sentenceTemplate: {
      prefix: "Tôi muốn tìm cổ phiếu thuộc",
      industryFallback: "một ngành cụ thể",
      riskFallback: "khẩu vị rủi ro phù hợp",
      objectiveFallback: "mục tiêu rõ ràng",
    },
    example:
      "Ví dụ: Tôi muốn tìm cổ phiếu thuộc Bán lẻ, phù hợp với rủi ro Cao, để đầu tư trung hạn.",
    highRiskWarning:
      "Bạn đang chọn khẩu vị rủi ro cao. Với người mới, hệ thống vẫn sẽ ưu tiên doanh nghiệp dễ hiểu, có thanh khoản tốt và không có cờ đỏ sơ bộ. Kết quả không phải kết luận hành động.",
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
      { value: "learn", label: "Học cách phân tích" },
      { value: "watch", label: "Theo dõi thêm" },
      { value: "medium-term", label: "Đầu tư trung hạn" },
      { value: "cycle", label: "Giao dịch theo chu kỳ" },
    ],
    defaultIndustry: "retail",
    defaultRisk: "low",
    defaultObjective: "learn",
  },
  context: {
    title: "Luận điểm bối cảnh",
    subtitle:
      "Hệ thống không lọc ngẫu nhiên. Mỗi bộ lọc bắt đầu từ giả định về ngành, rủi ro và điều cần xác nhận.",
    icon: "C",
    summariesByIndustry: {
      retail: retailContext,
      banking: {
        tailwind: "Tăng trưởng tín dụng và lãi suất thấp hơn có thể hỗ trợ lợi nhuận.",
        risks: "Nợ xấu, dự phòng, CASA suy giảm và áp lực chi phí vốn.",
        confirmations: "Tăng trưởng tín dụng, NIM, nợ xấu, CASA và dự phòng.",
        priority:
          "Ngân hàng có chất lượng tài sản dễ theo dõi, thanh khoản tốt và rủi ro tín dụng không tăng bất thường.",
      },
      securities: {
        tailwind: "Thanh khoản thị trường phục hồi có thể hỗ trợ môi giới và margin.",
        risks: "Tự doanh, chu kỳ thị trường và biến động lợi nhuận mạnh.",
        confirmations: "GTGD thị trường, dư nợ margin, tự doanh và chi phí vốn.",
        priority:
          "Công ty chứng khoán có quản trị rủi ro rõ và lợi nhuận không phụ thuộc quá mức vào tự doanh.",
      },
      steel: {
        tailwind: "Đầu tư công và chu kỳ hàng hóa phục hồi có thể hỗ trợ nhu cầu thép.",
        risks: "Giá nguyên liệu, tồn kho, biên lợi nhuận và biến động chu kỳ.",
        confirmations: "Giá thép, giá quặng, tồn kho, sản lượng bán và biên gộp.",
        priority:
          "Doanh nghiệp có quy mô, thanh khoản tốt và sức chịu đựng chu kỳ rõ.",
      },
      technology: {
        tailwind: "Backlog, đơn hàng chuyển đổi số và biên lợi nhuận là các điểm hỗ trợ.",
        risks: "Chi phí nhân sự, phụ thuộc khách hàng lớn và kỳ vọng định giá cao.",
        confirmations: "Backlog, biên lợi nhuận, nhân sự, khách hàng và tăng trưởng đơn hàng.",
        priority:
          "Doanh nghiệp có nguồn doanh thu dễ tách bạch, tăng trưởng rõ và định giá cần kiểm tra tiếp.",
      },
      "real-estate": {
        tailwind: "Pháp lý và khả năng hấp thụ dự án quyết định chất lượng phục hồi.",
        risks: "Nợ vay, trái phiếu, dòng tiền dự án và tiến độ pháp lý.",
        confirmations: "Pháp lý, hấp thụ, nợ vay, trái phiếu và dòng tiền dự án.",
        priority:
          "Doanh nghiệp có pháp lý rõ, nợ không quá căng và dữ liệu đủ để kiểm tra.",
      },
    },
  },
  funnelSummary: {
    contextTitle: "Funnel summary",
    tickerTitle: "Funnel kiểm tra một mã",
    contextText:
      "128 mã ban đầu -> 42 cùng ngành -> 18 dễ hiểu -> 9 không có cờ đỏ lớn -> 6 định giá không quá bất thường -> 4 phù hợp người mới",
    tickerText:
      "1 mã được kiểm tra -> nhận diện ngành -> chạy qua 5 cửa sơ lọc -> xếp nhóm ứng viên",
  },
  stockCardLabels: {
    reason: "Lý do chính",
    needToCheck: "Cần kiểm tra tiếp",
    beginnerFit: "Mức dễ hiểu",
    status: "Trạng thái",
    note:
      "Ứng viên sau vòng sơ lọc, chưa phân tích sâu BCTC, định giá và dòng tiền.",
    explainAction: "Xem vì sao được xếp nhóm",
    compareAction: "So sánh mã này",
    nextAction: "Mở hồ sơ phân tích",
  },
  resultGroupLabels: {
    stockCountUnit: "mã",
  },
  resultGroups: [
    {
      key: "priority",
      title: "Đáng mở hồ sơ phân tích",
      description:
        "Các mã này chưa chắc đáng hành động, nhưng đủ điều kiện để phân tích sâu hơn.",
      icon: "1",
      tone: groupTone.priority,
      criteria: ["Mô hình dễ hiểu", "Thanh khoản tốt", "Luận điểm ngành rõ"],
      stocks: groupStocks("priority"),
    },
    {
      key: "review",
      title: "Theo dõi thêm",
      description:
        "Có điểm hấp dẫn, nhưng còn thiếu xác nhận hoặc có rủi ro cần soi kỹ.",
      icon: "2",
      tone: groupTone.review,
      criteria: ["Cần kiểm tra dòng tiền", "Định giá cần soi thêm", "Bối cảnh chưa khớp hoàn toàn"],
      stocks: groupStocks("review"),
    },
    {
      key: "excluded",
      title: "Chưa phù hợp với người mới",
      description:
        "Không nhất thiết là doanh nghiệp xấu, nhưng hiện quá khó hiểu, rủi ro cao, thanh khoản yếu hoặc dữ liệu chưa đủ rõ.",
      icon: "3",
      tone: groupTone.excluded,
      criteria: ["Chu kỳ mạnh", "Khó với người mới", "Cần học thêm ngành"],
      stocks: groupStocks("excluded"),
    },
  ],
  stocksByTicker,
  deepDive: {
    title: "Muốn hiểu hệ thống lọc như thế nào?",
    description:
      "Phần này giải thích 5 cửa sơ lọc. Bạn không cần đọc hết trước khi xem kết quả, nhưng nên mở khi muốn hiểu vì sao một mã được giữ lại hoặc cần kiểm tra thêm.",
    icon: "5",
    steps: funnelLayers.map((layer) => {
      const meta = layerMeta[layer.id as keyof typeof layerMeta];

      return {
        id: layer.id,
        title: layer.title,
        question: layer.question,
        dataPoints: meta.dataPoints,
        simpleReading: meta.simpleReading,
        currentResult: meta.currentResult,
        impact: meta.impact,
        nextStep: meta.nextStep,
        scoring: meta.scoring,
      };
    }),
  },
  comparison: {
    title: "So sánh nhanh các mã ứng viên",
    description:
      "Mặc định chỉ hiện các tiêu chí dễ hiểu. Bật chế độ nâng cao nếu muốn soi sâu hơn.",
    icon: "T",
    caption: "Bảng so sánh cổ phiếu ứng viên sau sơ lọc",
    simpleRows: ["MWG", "PNJ", "FRT"].map((ticker) => {
      const stock = stocksByTicker[ticker];

      return {
        ticker,
        keptReason: stock.mainReason,
        needToCheck: stock.needToCheck,
        beginnerFit: stock.beginnerFitLevel,
        nextStep: stock.conclusion,
      };
    }),
    advancedRows: [
      {
        ticker: "MWG",
        financial: "Cần kiểm tra tồn kho và CFO",
        valuation: "Cần kiểm tra",
        liquidity: "Đạt sơ bộ",
        catalyst: "Sức mua phục hồi",
        riskFit: "Thấp - Trung bình",
      },
      {
        ticker: "PNJ",
        financial: "Cần kiểm tra tồn kho",
        valuation: "Cần kiểm tra",
        liquidity: "Đạt sơ bộ",
        catalyst: "Tiêu dùng cao cấp",
        riskFit: "Trung bình",
      },
      {
        ticker: "FRT",
        financial: "Cần kiểm tra dòng tiền",
        valuation: "Cần kiểm tra",
        liquidity: "Đạt sơ bộ",
        catalyst: "Mở rộng chuỗi",
        riskFit: "Trung bình - Cao",
      },
    ],
  },
  understanding: {
    title:
      "Trước khi lưu mã này, bạn có hiểu vì sao nó được chọn không?",
    description:
      "Mini quiz này giúp tránh hiểu nhầm kết quả lọc thành kết luận hành động.",
    icon: "?",
    questions: [
      {
        question:
          "Đây là cổ phiếu đáng phân tích tiếp hay là kết luận hành động ngay?",
        options: [
          "Kết luận hành động ngay",
          "Ứng viên để phân tích sâu hơn",
          "Tín hiệu giao dịch trong phiên",
        ],
        correctIndex: 1,
        feedback:
          "Đúng. Đây chỉ là cổ phiếu ứng viên sau vòng sơ lọc.",
      },
    ],
  },
  nextActions: {
    title: "Bước tiếp theo",
    contextDescription:
      "Chọn một mã trong danh sách ứng viên rồi đi sang module phân tích phù hợp.",
    tickerDescription:
      "Mã đã nhập là mã đang được kiểm tra. Các hành động bên dưới giúp mở hồ sơ phân tích sâu hơn.",
    icon: "N",
    selectedStockLabel: "Cổ phiếu đang chọn",
    actions: [
      {
        label: "Mở hồ sơ doanh nghiệp",
        description: "Hiểu công ty kiếm tiền bằng cách nào.",
        variant: "primary",
      },
      {
        label: "Xem báo cáo tài chính",
        description: "Kiểm tra lợi nhuận có chuyển thành tiền thật không.",
        variant: "secondary",
      },
      {
        label: "So sánh với mã cùng ngành",
        description: "Đặt mã này cạnh các ứng viên tương tự.",
        variant: "secondary",
      },
      {
        label: "Thêm vào watchlist",
        description: "Theo dõi mã này nhưng chưa ra quyết định mua.",
        variant: "ghost",
      },
      {
        label: "Xem quản trị rủi ro",
        description: "Xác định điều kiện sai của thesis.",
        variant: "ghost",
      },
    ],
  },
  disclaimer: {
    title: "Lưu ý bắt buộc",
    icon: "!",
    content:
      "Kết quả lọc chỉ phục vụ mục đích học tập và chọn ứng viên để phân tích tiếp. Đây không phải tư vấn đầu tư hay chỉ dẫn giao dịch. Người dùng cần tự kiểm tra lại doanh nghiệp, báo cáo tài chính, định giá, thanh khoản, rủi ro và mức phù hợp với danh mục cá nhân trước khi ra quyết định.",
  },
};
