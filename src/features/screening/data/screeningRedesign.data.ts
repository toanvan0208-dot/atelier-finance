import type { ScreeningCandidateGroupKey, ScreeningGuideTone } from "../types";

export type ScreeningMetricKey = "P/E" | "P/B" | "ROE" | "D/E" | "CFO" | "Thanh khoản";
export type RedesignedGateStatus = "Đã qua" | "Cần kiểm tra thêm" | "Không đạt bộ lọc" | "Chưa đủ dữ liệu";

export type RedesignedScreeningCandidate = {
  ticker: string;
  companyName: string;
  industry: string;
  group: ScreeningCandidateGroupKey;
  groupLabel: string;
  fitLabel: string;
  reason: string;
  checkFlags: string[];
  nextStep: string;
  passedGates: string[];
  watchGates: string[];
  notFitGates: string[];
  metrics: Record<ScreeningMetricKey, string>;
};

export type RedesignedScreeningGate = {
  id: string;
  shortLabel: string;
  title: string;
  question: string;
  beforeCount: number;
  afterCount: number;
  status: RedesignedGateStatus;
  shortReason: string;
  passedTickers: string[];
  watchTickers: string[];
  rejectedTickers: string[];
  whyItMatters: string;
  dataUsed: string[];
  beginnerMistake: string;
  example: string;
  nextModuleNote: string;
};

export type RedesignedResultGroup = {
  key: ScreeningCandidateGroupKey;
  title: string;
  description: string;
  tone: ScreeningGuideTone;
  defaultOpen: boolean;
};

export const screeningRedesignData = {
  header: {
    title: "Lọc cổ phiếu",
    description: "Thu hẹp danh sách cổ phiếu thành nhóm ứng viên đáng phân tích tiếp.",
  },
  guide: {
    title: "Đọc kết quả lọc như thế nào?",
    points: [
      "Lọc cổ phiếu không có nghĩa là tìm mã chắc chắn tăng giá.",
      "Cổ phiếu qua bộ lọc chỉ có nghĩa là đáng phân tích tiếp.",
      "Cổ phiếu bị loại không có nghĩa là doanh nghiệp xấu.",
      "Không đưa ra kết luận hành động chỉ vì một mã xuất hiện trong nhóm đáng phân tích tiếp.",
      "Sau khi lọc cần đi tiếp qua: Hiểu doanh nghiệp, Báo cáo tài chính, Định giá, PVT và Rủi ro.",
    ],
  },
  quickCheck: {
    title: "Bạn đã có mã cổ phiếu muốn kiểm tra?",
    placeholder: "Nhập mã, ví dụ: MWG, FPT, HPG...",
    buttonLabel: "Kiểm tra nhanh",
    emptyError: "Vui lòng nhập một mã cổ phiếu.",
    missingError: "Chưa có dữ liệu mẫu cho mã này. Hãy thử MWG, PNJ, FRT, FPT, HPG hoặc SSI.",
  },
  defaultInputSource: {
    sourceModule: "direct",
    label: "Ngành đã chọn",
    industryName: "Bán lẻ",
    selectedIndustryGroup: "Rổ cổ phiếu bán lẻ dễ quan sát",
    inputTickers: ["MWG", "PNJ", "FRT", "FPT", "HPG", "SSI"],
    industryContext: ["Sức mua nội địa", "Tồn kho", "Biên lợi nhuận", "Thanh khoản giao dịch"],
    industryRole: "Rổ mã đầu vào để kiểm tra qua bộ lọc, chưa phải kết luận phân tích.",
    riskFactorsToCheck: ["Tồn kho", "Biên lợi nhuận", "Dòng tiền", "Định giá", "Thanh khoản"],
    suggestedScreeningCriteria: [
      "Thanh khoản đủ theo dõi",
      "Mô hình kinh doanh đủ dễ hiểu",
      "Không có cảnh báo tài chính lớn",
      "Định giá không quá lệch so với ngành",
    ],
  },
  activeQuery: {
    sentence:
      "Tôi đang lọc cổ phiếu ngành Bán lẻ, rủi ro thấp, phù hợp để học cách phân tích.",
    criteria: [
      { label: "Ngành", value: "Bán lẻ", description: "Ưu tiên doanh nghiệp bán lẻ dễ quan sát." },
      { label: "Khẩu vị rủi ro", value: "Thấp", description: "Tránh mã quá biến động hoặc thiếu dữ liệu." },
      { label: "Mục tiêu lọc", value: "Học cách phân tích", description: "Tìm ứng viên để đọc sâu hơn." },
      { label: "Phù hợp người mới", value: "Dễ hiểu", description: "Mô hình kinh doanh giải thích được." },
      { label: "Thanh khoản tối thiểu", value: "Giao dịch đều", description: "Có thể theo dõi và xử lý khi sai." },
      { label: "Tài chính sơ bộ", value: "Không có cờ đỏ lớn", description: "Cần kiểm tra tiếp, chưa kết luận." },
      { label: "Định giá sơ bộ", value: "Không quá bất thường", description: "Cần đối chiếu ở module định giá." },
      { label: "Yếu tố ngành cần kiểm tra", value: "Tồn kho, biên lợi nhuận", description: "Không bỏ qua bối cảnh ngành." },
    ],
  },
  quickStats: [
    { label: "Mã đầu vào", count: 18 },
    { label: "Qua ngành", count: 12 },
    { label: "Dễ hiểu", count: 8 },
    { label: "Qua tài chính", count: 5 },
    { label: "Qua định giá", count: 4 },
    { label: "Đủ thanh khoản", count: 4 },
  ],
  gates: [
    {
      id: "industry",
      shortLabel: "Ngành",
      title: "Bối cảnh ngành",
      question: "Ngành của cổ phiếu này đang được hỗ trợ hay đang chịu áp lực?",
      beforeCount: 18,
      afterCount: 12,
      status: "Đã qua",
      shortReason: "Giữ lại các mã thuộc ngành có dữ liệu hỗ trợ hoặc không đi ngược câu lọc hiện tại.",
      passedTickers: ["MWG", "PNJ", "FRT"],
      watchTickers: ["FPT"],
      rejectedTickers: ["HPG", "SSI"],
      whyItMatters: "Một doanh nghiệp ổn vẫn có thể gặp khó nếu cả ngành đang ở pha bất lợi.",
      dataUsed: ["Sức mua", "Lãi suất", "Tăng trưởng ngành", "Chính sách", "Nhu cầu tiêu thụ"],
      beginnerMistake: "Chỉ nhìn mã cổ phiếu mà bỏ qua bối cảnh ngành.",
      example: "Bán lẻ được giữ lại vì sức mua có dấu hiệu hồi phục, nhưng vẫn cần kiểm tra biên lợi nhuận.",
      nextModuleNote: "Nếu lệch ngành, quay lại module Ngành để đọc bối cảnh trước khi lọc tiếp.",
    },
    {
      id: "business",
      shortLabel: "Dễ hiểu",
      title: "Độ dễ hiểu của doanh nghiệp",
      question: "Người mới có hiểu công ty kiếm tiền bằng cách nào không?",
      beforeCount: 12,
      afterCount: 8,
      status: "Đã qua",
      shortReason: "Ưu tiên doanh nghiệp có nguồn doanh thu, khách hàng và chi phí chính dễ giải thích.",
      passedTickers: ["MWG", "PNJ", "FRT", "FPT"],
      watchTickers: ["HPG"],
      rejectedTickers: ["SSI"],
      whyItMatters: "Nếu chưa hiểu doanh nghiệp tạo tiền từ đâu, rất khó biết khi nào giả định bị sai.",
      dataUsed: ["Nguồn doanh thu", "Khách hàng", "Chi phí chính", "Mô hình kinh doanh"],
      beginnerMistake: "Chọn theo tên quen thuộc nhưng không hiểu doanh nghiệp tạo tiền như thế nào.",
      example: "MWG và PNJ dễ hình dung hơn các mô hình tài chính hoặc hàng hóa phức tạp.",
      nextModuleNote: "Mã còn mơ hồ nên được đọc ở module Hiểu doanh nghiệp trước.",
    },
    {
      id: "financial",
      shortLabel: "Tài chính",
      title: "Cảnh báo tài chính sơ bộ",
      question: "Doanh nghiệp có dấu hiệu rủi ro tài chính rõ ràng không?",
      beforeCount: 8,
      afterCount: 5,
      status: "Cần kiểm tra thêm",
      shortReason: "Loại hoặc gắn nhãn các mã có dòng tiền yếu, nợ cao hoặc lợi nhuận kém bền vững.",
      passedTickers: ["PNJ", "FPT"],
      watchTickers: ["MWG", "FRT", "HPG"],
      rejectedTickers: ["SSI"],
      whyItMatters: "Lợi nhuận kế toán có thể đẹp nhưng dòng tiền yếu hoặc nợ cao vẫn làm rủi ro tăng.",
      dataUsed: ["CFO", "Lợi nhuận sau thuế", "Nợ vay", "Tồn kho", "Biên lợi nhuận"],
      beginnerMistake: "Chỉ nhìn lợi nhuận tăng mà không kiểm tra tiền có thật sự về doanh nghiệp không.",
      example: "FRT còn cần kiểm tra hiệu quả mở rộng và dòng tiền trước khi mở hồ sơ sâu.",
      nextModuleNote: "Mở module Báo cáo tài chính để kiểm tra CFO, tồn kho, nợ vay và biên lợi nhuận.",
    },
    {
      id: "valuation",
      shortLabel: "Định giá",
      title: "Định giá sơ bộ",
      question: "Giá hiện tại có đang phản ánh kỳ vọng quá cao không?",
      beforeCount: 5,
      afterCount: 4,
      status: "Cần kiểm tra thêm",
      shortReason: "Giữ lại mã có định giá chưa quá lệch, chuyển mã thiếu dữ liệu sang theo dõi.",
      passedTickers: ["MWG", "PNJ"],
      watchTickers: ["FRT", "FPT", "HPG"],
      rejectedTickers: ["SSI"],
      whyItMatters: "Doanh nghiệp dễ hiểu nhưng mức giá vẫn cần được kiểm tra riêng ở module định giá.",
      dataUsed: ["P/E", "P/B", "So sánh cùng ngành", "Tăng trưởng lợi nhuận"],
      beginnerMistake: "Thấy doanh nghiệp dễ hiểu là nghĩ giá nào cũng phù hợp.",
      example: "PNJ được giữ lại nhưng vẫn cần kiểm tra sức mua và định giá tiêu dùng cao cấp.",
      nextModuleNote: "Mở module Định giá để đối chiếu P/E, P/B và kỳ vọng tăng trưởng.",
    },
    {
      id: "liquidity",
      shortLabel: "Thanh khoản",
      title: "Thanh khoản và khả năng theo dõi",
      question: "Mã này có đủ thanh khoản để người mới theo dõi và xử lý khi sai không?",
      beforeCount: 4,
      afterCount: 4,
      status: "Đã qua",
      shortReason: "Ưu tiên mã giao dịch đều, thông tin dễ theo dõi và không quá khó xử lý khi giả định sai.",
      passedTickers: ["MWG", "PNJ", "FRT", "FPT"],
      watchTickers: ["HPG"],
      rejectedTickers: ["SSI"],
      whyItMatters: "Thanh khoản thấp có thể khiến việc theo dõi và xử lý tình huống khó hơn.",
      dataUsed: ["Giá trị giao dịch", "Khối lượng", "Biên độ dao động", "Số phiên thanh khoản thấp"],
      beginnerMistake: "Chỉ nhìn giá tăng mà quên kiểm tra cổ phiếu có được giao dịch đều hay không.",
      example: "MWG và PNJ có thanh khoản đủ tốt để đưa vào danh sách phân tích tiếp.",
      nextModuleNote: "Mã thanh khoản mỏng nên chỉ theo dõi sau khi hiểu rõ rủi ro.",
    },
  ] satisfies RedesignedScreeningGate[],
  resultGroups: [
    {
      key: "priority",
      title: "Đáng phân tích tiếp",
      description: "Qua nhiều cửa lọc cơ bản và phù hợp để mở hồ sơ phân tích sâu hơn.",
      tone: "pass",
      defaultOpen: true,
    },
    {
      key: "watch",
      title: "Cần theo dõi thêm",
      description: "Có điểm đáng chú ý nhưng còn dữ liệu cần xác nhận hoặc còn cảnh báo cần kiểm tra.",
      tone: "watch",
      defaultOpen: true,
    },
    {
      key: "not-fit",
      title: "Chưa phù hợp với bộ lọc hiện tại",
      description: "Không có nghĩa là doanh nghiệp xấu, chỉ là chưa khớp với câu lọc hiện tại.",
      tone: "neutral",
      defaultOpen: false,
    },
  ] satisfies RedesignedResultGroup[],
  candidates: [
    {
      ticker: "MWG",
      companyName: "CTCP Đầu tư Thế Giới Di Động",
      industry: "Bán lẻ",
      group: "priority",
      groupLabel: "Đáng phân tích tiếp",
      fitLabel: "Phù hợp để phân tích tiếp",
      reason: "Doanh nghiệp dễ hiểu, thanh khoản cao, ngành bán lẻ có thể theo dõi qua dữ liệu tiêu dùng.",
      checkFlags: ["Biên lợi nhuận cần kiểm tra", "Tồn kho cần theo dõi"],
      nextStep: "Mở phân tích doanh nghiệp, sau đó kiểm tra báo cáo tài chính và định giá sơ bộ.",
      passedGates: ["Bối cảnh ngành", "Độ dễ hiểu doanh nghiệp", "Thanh khoản"],
      watchGates: ["Dòng tiền", "Biên lợi nhuận", "Tồn kho", "Định giá"],
      notFitGates: [],
      metrics: {
        "P/E": "14.2x",
        "P/B": "2.1x",
        ROE: "16.4%",
        "D/E": "0.6x",
        CFO: "Dương",
        "Thanh khoản": "2.4 triệu cp/ngày",
      },
    },
    {
      ticker: "PNJ",
      companyName: "CTCP Vàng bạc Đá quý Phú Nhuận",
      industry: "Bán lẻ",
      group: "priority",
      groupLabel: "Đáng phân tích tiếp",
      fitLabel: "Phù hợp để phân tích tiếp",
      reason: "Thương hiệu rõ, mô hình bán lẻ dễ hiểu và chưa có cờ đỏ tài chính quá lớn.",
      checkFlags: ["Sức mua hàng không thiết yếu", "Biến động giá vàng"],
      nextStep: "Mở hồ sơ doanh nghiệp rồi kiểm tra tồn kho, biên lợi nhuận và định giá.",
      passedGates: ["Bối cảnh ngành", "Độ dễ hiểu doanh nghiệp", "Tài chính sơ bộ", "Thanh khoản"],
      watchGates: ["Định giá", "Sức mua cao cấp"],
      notFitGates: [],
      metrics: {
        "P/E": "18.6x",
        "P/B": "3.3x",
        ROE: "18.9%",
        "D/E": "0.4x",
        CFO: "Dương",
        "Thanh khoản": "0.9 triệu cp/ngày",
      },
    },
    {
      ticker: "FRT",
      companyName: "CTCP Bán lẻ Kỹ thuật số FPT",
      industry: "Bán lẻ",
      group: "watch",
      groupLabel: "Cần theo dõi thêm",
      fitLabel: "Cần kiểm tra thêm",
      reason: "Có câu chuyện mở rộng nhưng dòng tiền và hiệu quả điểm bán cần xác nhận.",
      checkFlags: ["Dòng tiền cần kiểm tra", "Chi phí mở rộng"],
      nextStep: "Theo dõi thêm và mở BCTC khi có dữ liệu xác nhận.",
      passedGates: ["Bối cảnh ngành", "Độ dễ hiểu doanh nghiệp", "Thanh khoản"],
      watchGates: ["Dòng tiền", "Hiệu quả mở rộng", "Định giá"],
      notFitGates: [],
      metrics: {
        "P/E": "22.4x",
        "P/B": "4.0x",
        ROE: "14.1%",
        "D/E": "1.2x",
        CFO: "Theo dõi",
        "Thanh khoản": "1.8 triệu cp/ngày",
      },
    },
    {
      ticker: "FPT",
      companyName: "CTCP FPT",
      industry: "Công nghệ",
      group: "watch",
      groupLabel: "Cần theo dõi thêm",
      fitLabel: "Cần kiểm tra thêm",
      reason: "Doanh nghiệp chất lượng nhưng lệch ngành so với câu lọc bán lẻ hiện tại.",
      checkFlags: ["Kỳ vọng định giá", "Cần hiểu backlog và biên nhân sự"],
      nextStep: "Đổi câu lọc sang Công nghệ hoặc đọc module Ngành trước khi phân tích sâu.",
      passedGates: ["Độ dễ hiểu doanh nghiệp", "Tài chính sơ bộ", "Thanh khoản"],
      watchGates: ["Bối cảnh ngành", "Định giá"],
      notFitGates: [],
      metrics: {
        "P/E": "21.8x",
        "P/B": "5.4x",
        ROE: "24.7%",
        "D/E": "0.2x",
        CFO: "Dương",
        "Thanh khoản": "3.1 triệu cp/ngày",
      },
    },
    {
      ticker: "HPG",
      companyName: "CTCP Tập đoàn Hòa Phát",
      industry: "Thép",
      group: "not-fit",
      groupLabel: "Chưa phù hợp với bộ lọc hiện tại",
      fitLabel: "Chưa phù hợp với bộ lọc hiện tại",
      reason: "Ngành thép có chu kỳ hàng hóa mạnh, chưa khớp với bộ lọc bán lẻ rủi ro thấp.",
      checkFlags: ["Chu kỳ thép", "Giá nguyên liệu", "Biên lợi nhuận biến động"],
      nextStep: "Chỉ phân tích sau khi đọc bối cảnh ngành thép và dữ liệu chu kỳ.",
      passedGates: ["Thanh khoản"],
      watchGates: ["Độ dễ hiểu doanh nghiệp", "Tài chính sơ bộ", "Định giá"],
      notFitGates: ["Bối cảnh ngành"],
      metrics: {
        "P/E": "13.5x",
        "P/B": "1.5x",
        ROE: "12.6%",
        "D/E": "0.5x",
        CFO: "Dương",
        "Thanh khoản": "18.2 triệu cp/ngày",
      },
    },
    {
      ticker: "SSI",
      companyName: "CTCP Chứng khoán SSI",
      industry: "Chứng khoán",
      group: "not-fit",
      groupLabel: "Chưa phù hợp với bộ lọc hiện tại",
      fitLabel: "Chưa phù hợp với bộ lọc hiện tại",
      reason: "Lợi nhuận nhạy với thanh khoản thị trường và tự doanh, dễ biến động với người mới.",
      checkFlags: ["Chu kỳ thị trường", "Tự doanh", "Margin"],
      nextStep: "Theo dõi sau khi hiểu ngành chứng khoán và rủi ro thanh khoản thị trường.",
      passedGates: ["Thanh khoản"],
      watchGates: ["Độ dễ hiểu doanh nghiệp", "Tài chính sơ bộ", "Định giá"],
      notFitGates: ["Bối cảnh ngành"],
      metrics: {
        "P/E": "16.1x",
        "P/B": "1.9x",
        ROE: "13.4%",
        "D/E": "0.8x",
        CFO: "Biến động",
        "Thanh khoản": "12.7 triệu cp/ngày",
      },
    },
  ] satisfies RedesignedScreeningCandidate[],
  termTips: {
    "P/E": "Giá cổ phiếu đang cao hay thấp so với lợi nhuận. Chỉ là chỉ báo sơ bộ, chưa đủ để kết luận.",
    "P/B": "Giá cổ phiếu so với giá trị sổ sách. Hữu ích hơn với ngân hàng hoặc doanh nghiệp nhiều tài sản.",
    ROE: "Doanh nghiệp tạo ra bao nhiêu lợi nhuận trên vốn chủ sở hữu.",
    "D/E": "Mức độ sử dụng nợ so với vốn chủ sở hữu.",
    CFO: "Dòng tiền từ hoạt động kinh doanh. Nói đơn giản là tiền thật từ hoạt động chính.",
    "Thanh khoản": "Mức độ dễ giao dịch cổ phiếu trên thị trường.",
  } satisfies Record<ScreeningMetricKey, string>,
  analysisPath: [
    "Hiểu doanh nghiệp",
    "Xem báo cáo tài chính",
    "Xem định giá",
    "Xem Price Volume Time",
    "Kiểm tra rủi ro",
    "Thêm vào Watchlist",
  ],
  nextPanel:
    "Bộ lọc đã giúp thu hẹp danh sách. Bước tiếp theo là phân tích từng mã, chưa đủ dữ liệu để kết luận hành động tại đây.",
};

export const candidatesByTicker = Object.fromEntries(
  screeningRedesignData.candidates.map((candidate) => [candidate.ticker, candidate])
) as Record<string, RedesignedScreeningCandidate>;
