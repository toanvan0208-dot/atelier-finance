import type {
  MacroAction,
  MacroDataMeta,
  MacroInsightCardData,
  MacroJourneyData,
  MacroTransmissionChain,
} from "../types";

const mockMeta: MacroDataMeta = {
  source: "Mock data - thay bằng nguồn cập nhật khi nối dữ liệu thật",
  period: "Kỳ gần nhất",
  updatedAt: "Chưa nối realtime",
  status: "mock",
};

const placeholderMeta: MacroDataMeta = {
  source: "Placeholder - cần nguồn chính thức",
  period: "Theo tháng hoặc quý",
  updatedAt: "Chờ cập nhật",
  status: "placeholder",
};

const goIndustry: MacroAction = {
  label: "Xem Module Ngành",
  targetModule: "industry",
  variant: "primary",
};

const verifyFinancials: MacroAction = {
  label: "Kiểm tra BCTC",
  targetModule: "financials",
  variant: "secondary",
};

const addToThesis: MacroAction = {
  label: "Ghi vào nhận định",
  targetModule: "macro",
  variant: "ghost",
};

const transmissionChains: MacroTransmissionChain[] = [
  {
    id: "fed-usd-rates",
    title: "Fed, USD và lãi suất toàn cầu",
    macroVariable: "Lãi suất Mỹ và sức mạnh USD",
    simpleMeaning:
      "Khi tiền USD đắt hơn, Việt Nam thường chịu áp lực tỷ giá và dòng vốn thận trọng hơn.",
    impactChannel: [
      "Fed giữ lãi suất cao",
      "USD có xu hướng mạnh",
      "USD/VND chịu áp lực",
      "Lãi suất trong nước khó giảm quá nhanh",
      "Dòng vốn ngoại thận trọng",
      "Định giá nhóm tăng trưởng và nhóm dùng nợ cao bị nén",
    ],
    relatedSectors: [
      "Bất động sản",
      "Chứng khoán",
      "Ngân hàng",
      "Hàng không",
      "Doanh nghiệp vay USD",
      "Doanh nghiệp nhập khẩu nguyên liệu",
    ],
    verificationData: [
      "USD/VND",
      "DXY",
      "Lãi suất liên ngân hàng",
      "Dòng vốn ngoại",
      "Chi phí lãi vay trong BCTC",
      "Nợ ngoại tệ của doanh nghiệp",
    ],
    linkedModules: ["Ngành", "BCTC", "Định giá", "Rủi ro"],
    tone: "pressure",
    meta: mockMeta,
  },
  {
    id: "credit-growth",
    title: "Tăng trưởng tín dụng",
    macroVariable: "Tín dụng đi vào nền kinh tế",
    simpleMeaning:
      "Tín dụng tăng có thể giúp doanh nghiệp và người tiêu dùng dễ vay hơn, nhưng cần biết tiền đi vào sản xuất thật hay chỉ đảo nợ.",
    impactChannel: [
      "Tín dụng tăng",
      "Tiền đi vào nền kinh tế",
      "Doanh nghiệp và người tiêu dùng dễ vay hơn",
      "Bất động sản, tiêu dùng, ngân hàng và chứng khoán có thể được hỗ trợ",
      "Cần kiểm tra chất lượng tín dụng và nợ xấu",
    ],
    relatedSectors: [
      "Ngân hàng",
      "Bất động sản",
      "Chứng khoán",
      "Ô tô",
      "Vật liệu xây dựng",
      "Tiêu dùng tài chính",
    ],
    verificationData: [
      "Tăng trưởng tín dụng",
      "Lãi suất cho vay",
      "Nợ xấu",
      "Giao dịch bất động sản",
      "Thanh khoản thị trường chứng khoán",
    ],
    linkedModules: ["Ngành", "BCTC", "Rủi ro"],
    tone: "support",
    meta: placeholderMeta,
  },
  {
    id: "public-investment",
    title: "Đầu tư công",
    macroVariable: "Giải ngân hạ tầng",
    simpleMeaning:
      "Đầu tư công chỉ thực sự hỗ trợ ngành khi tiền được giải ngân thật và doanh nghiệp có hợp đồng, công suất, biên lợi nhuận đủ tốt.",
    impactChannel: [
      "Đầu tư công tăng",
      "Tiền chảy vào hạ tầng",
      "Nhu cầu vật liệu, xây dựng, logistics và khu công nghiệp tăng",
      "Doanh thu ngành có thể cải thiện nếu giải ngân thật",
      "Cần kiểm tra hợp đồng, công suất và biên lợi nhuận",
    ],
    relatedSectors: [
      "Xây dựng hạ tầng",
      "Đá xây dựng",
      "Nhựa đường",
      "Thép",
      "Xi măng",
      "Logistics",
      "Khu công nghiệp",
    ],
    verificationData: [
      "Giải ngân đầu tư công",
      "Dự án trọng điểm",
      "Sản lượng tiêu thụ vật liệu",
      "Doanh thu doanh nghiệp",
      "Biên lợi nhuận gộp",
    ],
    linkedModules: ["Ngành", "BCTC", "Định giá"],
    tone: "support",
    meta: mockMeta,
  },
  {
    id: "exports-trade",
    title: "Xuất khẩu và thương mại toàn cầu",
    macroVariable: "Đơn hàng xuất khẩu",
    simpleMeaning:
      "Xuất khẩu phục hồi có thể giúp các ngành sản xuất và logistics, nhưng cần phân biệt tăng do sản lượng, do giá hay do nền thấp.",
    impactChannel: [
      "Cầu thế giới phục hồi",
      "Đơn hàng sản xuất tăng",
      "Xuất khẩu và vận tải cải thiện",
      "Khu công nghiệp, cảng biển, logistics và nhóm xuất khẩu có thể hưởng lợi",
      "Cần kiểm tra doanh thu và biên lợi nhuận từng doanh nghiệp",
    ],
    relatedSectors: [
      "Dệt may",
      "Thủy sản",
      "Gỗ",
      "Điện tử",
      "Cảng biển",
      "Logistics",
      "Khu công nghiệp",
    ],
    verificationData: [
      "Đơn hàng mới",
      "PMI",
      "Xuất khẩu theo thị trường",
      "Sản lượng container",
      "Doanh thu doanh nghiệp xuất khẩu",
      "Biên lợi nhuận",
    ],
    linkedModules: ["Ngành", "BCTC", "Rủi ro"],
    tone: "mixed",
    meta: placeholderMeta,
  },
  {
    id: "inflation-consumption",
    title: "Lạm phát và sức mua",
    macroVariable: "CPI, thu nhập và bán lẻ",
    simpleMeaning:
      "Lạm phát hạ nhiệt giúp người tiêu dùng bớt áp lực chi phí, nhưng sức mua chỉ rõ hơn khi bán lẻ và doanh thu doanh nghiệp xác nhận.",
    impactChannel: [
      "Lạm phát hạ nhiệt",
      "Người tiêu dùng bớt áp lực chi phí",
      "Sức mua có thể phục hồi",
      "Bán lẻ, hàng tiêu dùng, du lịch và hàng không có thể được hỗ trợ",
      "Cần kiểm tra doanh thu thực và biên lợi nhuận",
    ],
    relatedSectors: [
      "Bán lẻ",
      "Hàng tiêu dùng",
      "Thực phẩm đồ uống",
      "Trang sức",
      "Du lịch",
      "Hàng không",
    ],
    verificationData: [
      "CPI",
      "Lạm phát lõi",
      "Tổng mức bán lẻ",
      "Thu nhập người dân",
      "Doanh thu trên cửa hàng",
      "Biên lợi nhuận gộp",
    ],
    linkedModules: ["Ngành", "BCTC", "Định giá"],
    tone: "watch",
    meta: mockMeta,
  },
  {
    id: "commodities",
    title: "Giá hàng hóa đầu vào",
    macroVariable: "Dầu, khí, thép, than, nông sản",
    simpleMeaning:
      "Một loại hàng hóa tăng giá có thể là doanh thu của ngành này nhưng lại là chi phí đầu vào của ngành khác.",
    impactChannel: [
      "Giá hàng hóa biến động",
      "Doanh nghiệp bán hàng hóa có thể hưởng lợi ở đầu ra",
      "Doanh nghiệp tiêu thụ hàng hóa chịu áp lực chi phí",
      "Biên lợi nhuận thay đổi theo khả năng chuyển giá",
      "Cần kiểm tra giá vốn, hàng tồn kho và giá bán",
    ],
    relatedSectors: [
      "Dầu khí",
      "Phân bón",
      "Thép",
      "Hàng không",
      "Vận tải",
      "Điện khí",
      "Hóa chất",
    ],
    verificationData: [
      "Giá hàng hóa",
      "Giá bán đầu ra",
      "Giá vốn",
      "Biên lợi nhuận gộp",
      "Hàng tồn kho",
    ],
    linkedModules: ["Ngành", "BCTC", "Rủi ro"],
    tone: "mixed",
    meta: placeholderMeta,
  },
];

function insight(
  id: string,
  title: string,
  question: string,
  status: string,
  tone: MacroInsightCardData["tone"],
  simpleMeaning: string,
  transmission: string,
  relatedSectors: string[],
  verificationData: string[],
  linkedModules: string[],
  meta: MacroDataMeta = mockMeta
): MacroInsightCardData {
  return {
    id,
    title,
    question,
    status,
    tone,
    simpleMeaning,
    transmission,
    relatedSectors,
    verificationData,
    linkedModules,
    actions: [goIndustry, verifyFinancials, addToThesis],
    meta,
  };
}

export const macroJourneyData: MacroJourneyData = {
  overview: {
    eyebrow: "Bước 2/9 - Phân tích vĩ mô",
    icon: "VM",
    title: "Vĩ mô",
    description:
      "Đọc bối cảnh kinh tế hiện tại đang hỗ trợ hay gây áp lực cho thị trường chứng khoán, rồi chuyển sang ngành để kiểm chứng.",
    centralQuestion:
      "Sau bước này, bạn cần biết bối cảnh hiện tại đang hỗ trợ hay gây áp lực, ngành nào bị ảnh hưởng, và dữ liệu nào cần kiểm chứng tiếp.",
  },
  snapshot: {
    eyebrow: "Macro Snapshot",
    title: "Bức tranh vĩ mô hiện tại",
    description:
      "Một kết luận dễ hiểu trước khi đi vào từng chỉ báo. Đây không phải kết luận đầu tư, chỉ là bối cảnh cần kiểm chứng.",
    currentState: "Phục hồi nhẹ nhưng chưa đồng đều",
    stateTone: "mixed",
    supportPoints: [
      {
        label: "Lạm phát",
        value: "Áp lực giá có dấu hiệu hạ nhiệt, giúp chính sách dễ thở hơn.",
        tone: "support",
      },
      {
        label: "Lãi suất",
        value: "Mặt bằng lãi suất bớt căng, có thể hỗ trợ định giá nếu dòng tiền xác nhận.",
        tone: "support",
      },
      {
        label: "Đầu tư công",
        value: "Giải ngân hạ tầng là kênh hỗ trợ có thể lan sang vật liệu và xây dựng.",
        tone: "support",
      },
    ],
    pressurePoints: [
      {
        label: "Tỷ giá",
        value: "USD mạnh có thể gây áp lực lên chi phí nhập khẩu và nợ ngoại tệ.",
        tone: "pressure",
      },
      {
        label: "Tín dụng",
        value: "Tín dụng có thể tăng chưa đều, cần xem tiền có chảy vào sản xuất thật không.",
        tone: "watch",
      },
      {
        label: "Sức mua",
        value: "Bán lẻ và thu nhập cần xác nhận trước khi kết luận tiêu dùng phục hồi rộng.",
        tone: "watch",
      },
    ],
    unconfirmedData: [
      {
        label: "PMI",
        value: "PMI cải thiện nhưng đơn hàng mới chưa đủ bền.",
        tone: "mixed",
      },
      {
        label: "Bán lẻ",
        value: "Tăng danh nghĩa chưa chắc đồng nghĩa sức mua thực đã mạnh.",
        tone: "watch",
      },
      {
        label: "Lợi nhuận",
        value: "Giá cổ phiếu có thể phản ứng trước khi BCTC xác nhận lợi nhuận.",
        tone: "watch",
      },
    ],
    nextQuestions: [
      "Ngành nào hưởng lợi từ lãi suất dễ thở hơn?",
      "Ngành nào chịu áp lực từ tỷ giá?",
      "Ngành nào hưởng lợi từ đầu tư công?",
      "Dữ liệu nào cần kiểm chứng bằng BCTC?",
    ],
    affectedSectors: [
      "Ngân hàng",
      "Bất động sản",
      "Chứng khoán",
      "Bán lẻ",
      "Logistics",
      "Vật liệu xây dựng",
    ],
    actions: [
      { label: "Xem bản đồ ngành bị ảnh hưởng", targetModule: "industry", variant: "primary" },
      { label: "Xem dashboard cảnh báo sớm", targetModule: "macro", variant: "secondary" },
      { label: "Viết nhận định vĩ mô cá nhân", targetModule: "macro", variant: "ghost" },
    ],
    meta: mockMeta,
  },
  transmissionChains,
  globalInsights: [
    insight(
      "global-liquidity",
      "Thanh khoản toàn cầu",
      "Tiền toàn cầu đang rẻ hay đắt?",
      "Gây áp lực",
      "pressure",
      "Khi USD và lợi suất Mỹ còn cao, dòng vốn vào thị trường mới nổi thường thận trọng.",
      "Fed -> USD/DXY -> tỷ giá -> dòng vốn ngoại -> định giá tài sản rủi ro",
      ["Chứng khoán", "Ngân hàng", "Bất động sản", "Doanh nghiệp nợ vay cao"],
      ["Fed", "Lợi suất trái phiếu Mỹ", "DXY", "Dòng vốn ngoại"],
      ["Ngành", "Định giá", "Rủi ro"]
    ),
    insight(
      "global-growth",
      "Tăng trưởng toàn cầu",
      "Cầu thế giới đang mạnh hay yếu?",
      "Cần theo dõi",
      "watch",
      "Xuất khẩu Việt Nam chỉ được hỗ trợ rõ khi đơn hàng mới và nhu cầu ở Mỹ, EU, Trung Quốc cùng cải thiện.",
      "Tăng trưởng Mỹ/EU/Trung Quốc -> đơn hàng -> xuất khẩu -> doanh thu doanh nghiệp",
      ["Dệt may", "Thủy sản", "Gỗ", "Điện tử", "Cảng biển", "Logistics"],
      ["PMI toàn cầu", "Đơn hàng mới", "Xuất khẩu theo thị trường"],
      ["Ngành", "BCTC"],
      placeholderMeta
    ),
    insight(
      "china-supply-chain",
      "Trung Quốc và chuỗi cung ứng",
      "Trung Quốc đang kéo hay đè khu vực?",
      "Dữ liệu trái chiều",
      "mixed",
      "Trung Quốc yếu có thể làm cầu hàng hóa chậm, nhưng cạnh tranh giá rẻ cũng gây áp lực cho doanh nghiệp Việt Nam.",
      "Trung Quốc -> giá hàng hóa/đơn hàng/cạnh tranh -> biên lợi nhuận ngành",
      ["Thép", "Hóa chất", "Dệt may", "Gỗ", "Khu công nghiệp"],
      ["PMI Trung Quốc", "Bất động sản Trung Quốc", "Giá thép", "Đơn hàng khu vực"],
      ["Ngành", "Rủi ro"]
    ),
    insight(
      "global-commodities",
      "Hàng hóa",
      "Giá đầu vào đang hỗ trợ hay gây áp lực?",
      "Dữ liệu trái chiều",
      "mixed",
      "Cùng một biến giá có thể tạo lợi ích cho bên bán và áp lực cho bên mua.",
      "Giá dầu/khí/than/thép -> giá vốn hoặc giá bán -> biên lợi nhuận -> rủi ro định giá",
      ["Dầu khí", "Phân bón", "Thép", "Hàng không", "Vận tải", "Điện"],
      ["Giá hàng hóa", "Giá bán đầu ra", "Hàng tồn kho", "Biên lợi nhuận gộp"],
      ["Ngành", "BCTC", "Rủi ro"],
      placeholderMeta
    ),
    insight(
      "risk-on-off",
      "Risk-on/Risk-off và địa chính trị",
      "Nhà đầu tư đang muốn nhận rủi ro hay né rủi ro?",
      "Cần theo dõi",
      "watch",
      "Khi rủi ro toàn cầu tăng, dòng tiền thường ưu tiên an toàn hơn là định giá cao.",
      "Địa chính trị/credit spread -> tâm lý rủi ro -> dòng vốn -> thanh khoản thị trường",
      ["Chứng khoán", "Ngân hàng", "Bất động sản", "Nhóm beta cao"],
      ["Credit spread", "Dòng vốn ngoại", "Biến động tỷ giá", "Tin chính sách"],
      ["Rủi ro", "Định giá"]
    ),
  ],
  vietnamInsights: [
    insight(
      "vn-growth",
      "Tăng trưởng",
      "Kinh tế Việt Nam đang phục hồi, suy yếu hay trái chiều?",
      "Cần theo dõi",
      "watch",
      "Tăng trưởng tốt chỉ có ý nghĩa với cổ phiếu khi doanh thu ngành và lợi nhuận doanh nghiệp đi theo.",
      "GDP/IIP/PMI -> sản xuất và bán hàng -> doanh thu ngành -> lợi nhuận doanh nghiệp",
      ["Bán lẻ", "Ngân hàng", "Logistics", "Khu công nghiệp"],
      ["GDP", "IIP", "PMI", "Bán lẻ", "Xuất nhập khẩu", "Tín dụng thực"],
      ["Ngành", "BCTC"]
    ),
    insight(
      "vn-inflation",
      "Lạm phát",
      "Giá cả đang hạ nhiệt hay còn gây áp lực?",
      "Hỗ trợ một phần",
      "support",
      "Lạm phát dịu hơn giúp lãi suất và sức mua dễ thở hơn, nhưng cần xem thu nhập và bán lẻ.",
      "CPI -> sức mua -> doanh thu bán lẻ -> biên lợi nhuận",
      ["Bán lẻ", "Hàng tiêu dùng", "Thực phẩm đồ uống", "Du lịch"],
      ["CPI", "Lạm phát lõi", "Bán lẻ", "Thu nhập", "Biên lợi nhuận"],
      ["Ngành", "BCTC"]
    ),
    insight(
      "vn-rates",
      "Tiền tệ và lãi suất",
      "Lãi suất đang hỗ trợ định giá hay vẫn gây áp lực?",
      "Trung tính",
      "neutral",
      "Lãi suất thấp hơn có thể hỗ trợ định giá, nhưng chỉ bền khi tỷ giá và thanh khoản không căng.",
      "Lãi suất -> chi phí vốn -> chi phí lãi vay -> định giá cổ phiếu",
      ["Ngân hàng", "Bất động sản", "Chứng khoán", "Doanh nghiệp nợ vay cao"],
      ["Lãi suất huy động", "Lãi suất cho vay", "Liên ngân hàng", "Chi phí lãi vay"],
      ["BCTC", "Định giá", "Rủi ro"],
      placeholderMeta
    ),
    insight(
      "vn-credit",
      "Tín dụng",
      "Tín dụng có chảy vào nền kinh tế thật không?",
      "Cần theo dõi",
      "watch",
      "Tín dụng tăng chưa đủ, cần xem chất lượng tín dụng và nhóm ngành nhận vốn.",
      "Tín dụng -> nhu cầu vay -> doanh thu ngành -> nợ xấu và lợi nhuận ngân hàng",
      ["Ngân hàng", "Bất động sản", "Ô tô", "Vật liệu xây dựng"],
      ["Tăng trưởng tín dụng", "Nợ xấu", "Lãi suất cho vay", "Giao dịch bất động sản"],
      ["Ngành", "BCTC", "Rủi ro"]
    ),
    insight(
      "vn-fx",
      "Tỷ giá và ngoại hối",
      "VND ổn định hay chịu áp lực?",
      "Gây áp lực",
      "pressure",
      "Tỷ giá căng có thể làm chi phí nhập khẩu và nợ ngoại tệ tăng.",
      "USD/VND -> chi phí nhập khẩu/nợ ngoại tệ -> biên lợi nhuận/lãi vay -> định giá",
      ["Hàng không", "Thép", "Bán lẻ nhập khẩu", "Doanh nghiệp vay USD"],
      ["USD/VND", "Dự trữ ngoại hối", "Nợ ngoại tệ", "Tỷ trọng nhập khẩu nguyên liệu"],
      ["BCTC", "Rủi ro", "Định giá"]
    ),
    insight(
      "vn-fiscal",
      "Tài khóa và đầu tư công",
      "Đầu tư công có lan sang doanh nghiệp không?",
      "Hỗ trợ",
      "support",
      "Đầu tư công là gió thuận nếu giải ngân thật và doanh nghiệp có khả năng chuyển thành doanh thu.",
      "Giải ngân -> dự án -> sản lượng vật liệu/xây dựng -> doanh thu và biên lợi nhuận",
      ["Xây dựng hạ tầng", "Đá", "Thép", "Xi măng", "Logistics", "Khu công nghiệp"],
      ["Giải ngân", "Dự án trọng điểm", "Sản lượng vật liệu", "Hợp đồng doanh nghiệp"],
      ["Ngành", "BCTC", "Định giá"]
    ),
    insight(
      "vn-property-bonds-banks",
      "Bất động sản, trái phiếu và ngân hàng",
      "Rủi ro hệ thống có hạ nhiệt chưa?",
      "Dữ liệu trái chiều",
      "mixed",
      "Một vài tín hiệu thanh khoản tốt hơn chưa đủ để kết luận rủi ro đã qua.",
      "Thanh khoản tài sản -> trái phiếu/nợ vay -> ngân hàng -> niềm tin thị trường",
      ["Bất động sản", "Ngân hàng", "Chứng khoán", "Xây dựng"],
      ["Giao dịch bất động sản", "Đáo hạn trái phiếu", "Nợ xấu", "Tài sản bảo đảm"],
      ["Rủi ro", "BCTC"]
    ),
    insight(
      "vn-fdi-trade",
      "FDI và thương mại",
      "Dòng vốn sản xuất dài hạn có tiếp tục vào Việt Nam không?",
      "Hỗ trợ một phần",
      "support",
      "FDI và thương mại hỗ trợ khu công nghiệp, logistics và xuất khẩu nếu đơn hàng được xác nhận.",
      "FDI -> nhu cầu thuê đất/xây nhà máy -> logistics/xuất khẩu -> doanh thu ngành",
      ["Khu công nghiệp", "Logistics", "Cảng biển", "Điện tử", "Dệt may"],
      ["FDI đăng ký/giải ngân", "Xuất nhập khẩu", "Đơn hàng mới", "Tỷ lệ lấp đầy KCN"],
      ["Ngành", "BCTC"],
      placeholderMeta
    ),
  ],
  sectorImpactGroups: [
    {
      id: "benefit",
      title: "Ngành có thể hưởng lợi",
      tone: "support",
      description:
        "Có gió thuận vĩ mô, nhưng vẫn cần kiểm chứng bằng dữ liệu ngành và BCTC.",
      items: [
        {
          sector: "Đầu tư công và vật liệu xây dựng",
          reason: "Được hỗ trợ bởi giải ngân hạ tầng và nhu cầu vật liệu.",
          macroVariables: ["Đầu tư công", "Tài khóa", "Giải ngân"],
          verificationData: ["Sản lượng tiêu thụ", "Hợp đồng", "Biên lợi nhuận gộp"],
          risks: ["Giải ngân chậm", "Giá đầu vào tăng", "Biên lợi nhuận mỏng"],
          horizon: "Cả hai",
          action: goIndustry,
        },
        {
          sector: "Khu công nghiệp và logistics",
          reason: "Có thể hưởng lợi từ FDI, thương mại và xuất khẩu phục hồi.",
          macroVariables: ["FDI", "Xuất khẩu", "Thương mại toàn cầu"],
          verificationData: ["Tỷ lệ lấp đầy", "Giá thuê", "Sản lượng container"],
          risks: ["Đơn hàng yếu", "Chi phí vốn cao", "Cạnh tranh khu vực"],
          horizon: "Dài hạn",
          action: goIndustry,
        },
      ],
    },
    {
      id: "pressure",
      title: "Ngành cần thận trọng",
      tone: "pressure",
      description:
        "Có biến vĩ mô gây áp lực lên chi phí, lãi vay, tỷ giá hoặc thanh khoản.",
      items: [
        {
          sector: "Hàng không và nhập khẩu nguyên liệu",
          reason: "Nhạy với tỷ giá, giá dầu và chi phí đầu vào.",
          macroVariables: ["USD/VND", "Giá dầu", "Lạm phát"],
          verificationData: ["Giá vốn", "Nợ ngoại tệ", "Khả năng tăng giá bán"],
          risks: ["Không chuyển được chi phí", "Biên lợi nhuận giảm"],
          horizon: "Ngắn hạn",
          action: goIndustry,
        },
        {
          sector: "Doanh nghiệp nợ vay cao",
          reason: "Lãi suất và dòng tiền yếu có thể làm chi phí tài chính nặng hơn.",
          macroVariables: ["Lãi suất", "Tín dụng", "Thanh khoản"],
          verificationData: ["Chi phí lãi vay", "Dòng tiền", "Nợ đáo hạn"],
          risks: ["Áp lực tái cấp vốn", "Rủi ro pha loãng", "Định giá bị nén"],
          horizon: "Cả hai",
          action: goIndustry,
        },
      ],
    },
    {
      id: "neutral-defensive",
      title: "Trung lập và phòng thủ",
      tone: "neutral",
      description:
        "Ít nhạy với chu kỳ hơn, phù hợp để so sánh khi dữ liệu vĩ mô còn trái chiều.",
      items: [
        {
          sector: "Điện, nước và hàng thiết yếu",
          reason: "Nhu cầu ổn định hơn, nhưng vẫn cần xem giá đầu vào và chính sách.",
          macroVariables: ["Lạm phát", "Chính sách giá", "Chi phí đầu vào"],
          verificationData: ["Sản lượng", "Biên lợi nhuận", "Cơ chế giá"],
          risks: ["Điều chỉnh giá chậm", "Chi phí nhiên liệu", "Quy định"],
          horizon: "Dài hạn",
          action: goIndustry,
        },
      ],
    },
    {
      id: "cycle-policy-transition",
      title: "Chu kỳ, nhạy chính sách và chuyển pha",
      tone: "mixed",
      description:
        "Có thể đổi trạng thái nhanh khi tín dụng, chính sách, thanh khoản hoặc đơn hàng xác nhận.",
      items: [
        {
          sector: "Bất động sản, chứng khoán và ngân hàng",
          reason: "Nhạy với lãi suất, tín dụng, thanh khoản và niềm tin thị trường.",
          macroVariables: ["Lãi suất", "Tín dụng", "Tỷ giá", "Dòng vốn"],
          verificationData: ["Thanh khoản thị trường", "Nợ xấu", "Giao dịch BĐS"],
          risks: ["Kỳ vọng đi trước dữ liệu", "Rủi ro trái phiếu", "Tỷ giá căng"],
          horizon: "Ngắn hạn",
          action: goIndustry,
        },
      ],
    },
  ],
  warningSignals: [
    {
      id: "monthly-pmi-credit-retail",
      cadence: "Tháng",
      signal: "PMI cải thiện nhưng tín dụng và bán lẻ chưa xác nhận",
      status: "Tín hiệu vàng",
      tone: "watch",
      evidence:
        "PMI có dấu hiệu tốt hơn, trong khi tín dụng và bán lẻ cần thêm kỳ dữ liệu.",
      meaning:
        "Phục hồi có thể chưa lan rộng. Không nên kết luận thị trường thuận lợi chỉ từ một chỉ báo.",
      relatedSectors: ["Bán lẻ", "Ngân hàng bán lẻ", "Bất động sản"],
      nextAction:
        "Sang Module Ngành để kiểm tra nhóm nào hưởng lợi thật và nhóm nào mới chỉ được kỳ vọng.",
      meta: mockMeta,
    },
    {
      id: "monthly-fx-interbank",
      cadence: "Tháng",
      signal: "Tỷ giá và lãi suất liên ngân hàng cùng căng",
      status: "Tín hiệu đỏ",
      tone: "pressure",
      evidence:
        "USD/VND và lãi suất ngắn hạn cùng cần theo dõi bằng nguồn dữ liệu cập nhật.",
      meaning:
        "Thanh khoản có thể thận trọng hơn, ảnh hưởng nhóm nợ vay cao và nhập khẩu.",
      relatedSectors: ["Hàng không", "Bất động sản", "Chứng khoán", "Vay USD"],
      nextAction:
        "Kiểm tra BCTC để xem nợ ngoại tệ, chi phí lãi vay và dòng tiền hoạt động.",
      meta: placeholderMeta,
    },
    {
      id: "quarterly-margin-cashflow",
      cadence: "Quý",
      signal: "Doanh thu tăng nhưng biên lợi nhuận và dòng tiền chưa xác nhận",
      status: "Tín hiệu vàng",
      tone: "mixed",
      evidence:
        "Cần so sánh doanh thu, biên lợi nhuận gộp, dòng tiền và chi phí tài chính trong BCTC.",
      meaning:
        "Gió thuận vĩ mô chưa chắc đã chuyển thành lợi nhuận doanh nghiệp.",
      relatedSectors: ["Xuất khẩu", "Bán lẻ", "Vật liệu", "Ngân hàng"],
      nextAction:
        "Sang Module BCTC để kiểm tra chất lượng lợi nhuận và khả năng chuyển giá.",
      meta: mockMeta,
    },
    {
      id: "crisis-liquidity",
      cadence: "Khủng hoảng",
      signal: "Dòng vốn ngoại rút mạnh hoặc margin căng",
      status: "Chưa đủ dữ liệu",
      tone: "watch",
      evidence:
        "Cần nguồn xác nhận về dòng vốn, thanh khoản hệ thống, trái phiếu và margin.",
      meaning:
        "Khi tín hiệu căng thẳng chưa đủ dữ liệu, hành động hợp lý là kiểm chứng rủi ro.",
      relatedSectors: ["Chứng khoán", "Ngân hàng", "Bất động sản", "Trái phiếu"],
      nextAction:
        "Sang Module Rủi ro để liệt kê điều gì có thể sai trước khi kết luận.",
      meta: placeholderMeta,
    },
  ],
  thesisBuilder: {
    title: "Viết nhận định vĩ mô của bạn",
    description:
      "Output cuối module là bản nhận định cá nhân bằng lời của bạn, không phải một tín hiệu mua bán.",
    tutorRule:
      "AI Tutor sẽ chọn số câu cần hỏi dựa trên dữ liệu còn thiếu trong nhận định của bạn. Bản mock hiện dùng 8 câu cốt lõi.",
    questions: [
      {
        id: "context",
        label: "Câu 1",
        prompt: "Bối cảnh vĩ mô hiện tại nên được mô tả gần nhất là gì?",
        options: [
          {
            id: "recovery-mixed",
            label: "Phục hồi nhẹ nhưng chưa đồng đều",
            value: "Bối cảnh vĩ mô hiện tại: phục hồi nhẹ nhưng chưa đồng đều.",
            tutorNote:
              "Đây là cách đọc thận trọng: có điểm hỗ trợ nhưng vẫn cần kiểm chứng bằng ngành và BCTC.",
          },
          {
            id: "fully-positive",
            label: "Rất thuận lợi, có thể kết luận thị trường tốt",
            value: "Bối cảnh vĩ mô được hiểu quá tích cực.",
            tutorNote:
              "Cần tránh kết luận chắc chắn chỉ vì một vài tín hiệu hỗ trợ.",
          },
          {
            id: "unclear",
            label: "Chưa rõ, dữ liệu còn trái chiều",
            value: "Bối cảnh vĩ mô: chưa rõ, dữ liệu còn trái chiều.",
            tutorNote:
              "Cách đọc này phù hợp nếu bạn chưa thấy tín hiệu xác nhận từ nhiều nguồn.",
          },
        ],
      },
      {
        id: "support",
        label: "Câu 2",
        prompt: "Nhóm yếu tố nào đang hỗ trợ thị trường một phần?",
        options: [
          {
            id: "inflation-rates-public",
            label: "Lạm phát hạ nhiệt, lãi suất dễ thở hơn, đầu tư công",
            value:
              "Yếu tố hỗ trợ: lạm phát hạ nhiệt, lãi suất dễ thở hơn và đầu tư công.",
            tutorNote:
              "Đây là ba kênh hỗ trợ thường gặp, nhưng vẫn phải kiểm tra xem đã đi vào doanh thu và lợi nhuận chưa.",
          },
          {
            id: "fx-pressure",
            label: "Tỷ giá căng, USD mạnh, dòng vốn thận trọng",
            value: "Nhầm yếu tố gây áp lực thành yếu tố hỗ trợ.",
            tutorNote:
              "Nhóm này thường là áp lực, không nên đưa vào phần gió thuận.",
          },
          {
            id: "stock-price-only",
            label: "Giá cổ phiếu đã tăng nên vĩ mô đang tốt",
            value: "Dùng giá cổ phiếu làm bằng chứng vĩ mô chính.",
            tutorNote:
              "Giá có thể đi trước dữ liệu. Cần kiểm chứng bằng chỉ báo vĩ mô, ngành và BCTC.",
          },
        ],
      },
      {
        id: "pressure",
        label: "Câu 3",
        prompt: "Yếu tố nào cần xem là áp lực hoặc rủi ro cần theo dõi?",
        options: [
          {
            id: "fx-credit-consumption",
            label: "Tỷ giá, tín dụng chưa lan tỏa, sức mua chưa rõ",
            value:
              "Yếu tố gây áp lực: tỷ giá, tín dụng chưa lan tỏa và sức mua chưa rõ.",
            tutorNote:
              "Đây là nhóm cần theo dõi trước khi kết luận phục hồi đã rộng.",
          },
          {
            id: "public-investment",
            label: "Đầu tư công giải ngân tốt",
            value: "Đầu tư công được xếp vào áp lực.",
            tutorNote:
              "Đầu tư công thường là gió thuận, trừ khi giải ngân chậm hoặc biên lợi nhuận ngành không xác nhận.",
          },
          {
            id: "low-inflation-only",
            label: "Lạm phát hạ nhiệt",
            value: "Lạm phát hạ nhiệt được xếp vào áp lực.",
            tutorNote:
              "Lạm phát hạ nhiệt thường hỗ trợ chính sách và sức mua, nhưng vẫn cần dữ liệu xác nhận.",
          },
        ],
      },
      {
        id: "globalChannel",
        label: "Câu 4",
        prompt: "Vĩ mô toàn cầu ảnh hưởng đến Việt Nam chủ yếu qua kênh nào?",
        options: [
          {
            id: "usd-rates-capital",
            label: "USD, lãi suất toàn cầu, hàng hóa, thương mại và dòng vốn",
            value:
              "Kênh toàn cầu chính: USD, lãi suất, hàng hóa, thương mại và dòng vốn.",
            tutorNote:
              "Đây là chuỗi cần nối sang tỷ giá, chi phí vốn, xuất khẩu và định giá.",
          },
          {
            id: "domestic-only",
            label: "Chỉ qua GDP Việt Nam",
            value: "Thu hẹp vĩ mô toàn cầu thành GDP Việt Nam.",
            tutorNote:
              "GDP Việt Nam là biến trong nước. Vĩ mô toàn cầu thường đi qua USD, lãi suất, hàng hóa, thương mại và dòng vốn.",
          },
          {
            id: "stock-rumor",
            label: "Qua tin đồn từng cổ phiếu",
            value: "Dùng tin cổ phiếu thay cho kênh truyền dẫn vĩ mô.",
            tutorNote:
              "Tin cổ phiếu không phải kênh truyền dẫn vĩ mô. Cần quay lại dữ liệu nền.",
          },
        ],
      },
      {
        id: "sectorBenefit",
        label: "Câu 5",
        prompt: "Nếu đầu tư công là gió thuận, nhóm nào nên được kiểm chứng ở Module Ngành?",
        options: [
          {
            id: "infra-materials-logistics",
            label: "Hạ tầng, đá, thép, xi măng, logistics, khu công nghiệp",
            value:
              "Ngành cần kiểm chứng từ đầu tư công: hạ tầng, vật liệu, logistics và khu công nghiệp.",
            tutorNote:
              "Đúng hướng. Bước tiếp theo là kiểm tra giải ngân, hợp đồng, sản lượng và biên lợi nhuận.",
          },
          {
            id: "all-sectors",
            label: "Tất cả các ngành đều hưởng lợi như nhau",
            value: "Mở rộng tác động đầu tư công quá mức.",
            tutorNote:
              "Không phải ngành nào cũng hưởng lợi như nhau. Cần xác định kênh tác động cụ thể.",
          },
          {
            id: "no-check-needed",
            label: "Không cần kiểm chứng, cứ xem là hưởng lợi",
            value: "Bỏ qua bước kiểm chứng ngành.",
            tutorNote:
              "Đây là lỗi cần tránh. Vĩ mô thuận lợi chưa đủ để kết luận ngành tốt.",
          },
        ],
      },
      {
        id: "sectorPressure",
        label: "Câu 6",
        prompt: "Nếu tỷ giá căng, nhóm nào cần thận trọng hơn?",
        options: [
          {
            id: "import-usd-debt",
            label: "Doanh nghiệp nhập khẩu nguyên liệu hoặc vay ngoại tệ",
            value:
              "Ngành cần thận trọng từ tỷ giá: nhập khẩu nguyên liệu và doanh nghiệp vay ngoại tệ.",
            tutorNote:
              "Cần kiểm tra nợ ngoại tệ, tỷ trọng nhập khẩu, giá vốn và khả năng chuyển giá.",
          },
          {
            id: "all-exporters-bad",
            label: "Tất cả doanh nghiệp xuất khẩu đều xấu",
            value: "Kết luận quá rộng về nhóm xuất khẩu.",
            tutorNote:
              "Xuất khẩu có thể hưởng lợi hoặc chịu áp lực tùy chi phí đầu vào, đơn hàng và tỷ trọng ngoại tệ.",
          },
          {
            id: "ignore-fx",
            label: "Không ngành nào bị ảnh hưởng bởi tỷ giá",
            value: "Bỏ qua kênh tỷ giá.",
            tutorNote:
              "Tỷ giá là kênh quan trọng với nhập khẩu, nợ ngoại tệ, chi phí vốn và dòng vốn.",
          },
        ],
      },
      {
        id: "unconfirmed",
        label: "Câu 7",
        prompt: "Dữ liệu nào cần kiểm chứng trước khi tin rằng phục hồi đã bền?",
        options: [
          {
            id: "orders-retail-margin-cashflow",
            label: "Đơn hàng, bán lẻ, biên lợi nhuận và dòng tiền",
            value:
              "Dữ liệu chưa xác nhận: đơn hàng, bán lẻ, biên lợi nhuận và dòng tiền.",
            tutorNote:
              "Đây là các lớp xác nhận giúp tránh hiểu sai một chỉ báo vĩ mô đơn lẻ.",
          },
          {
            id: "one-good-signal",
            label: "Chỉ cần một chỉ báo tốt là đủ",
            value: "Dựa vào một chỉ báo đơn lẻ.",
            tutorNote:
              "Một chỉ báo tốt chưa đủ. Cần xác nhận qua ngành, BCTC, định giá và rủi ro.",
          },
          {
            id: "price-only",
            label: "Chỉ cần giá cổ phiếu tăng",
            value: "Dùng giá làm xác nhận duy nhất.",
            tutorNote:
              "Giá có thể phản ánh kỳ vọng trước dữ liệu. Cần kiểm tra kết quả kinh doanh.",
          },
        ],
      },
      {
        id: "readyForIndustry",
        label: "Câu 8",
        prompt: "Khi nào bạn đủ cơ sở chuyển sang Module Phân tích ngành?",
        options: [
          {
            id: "know-sector-and-data",
            label: "Khi biết ngành cần xem, biến vĩ mô liên quan và dữ liệu cần kiểm chứng",
            value:
              "Bước tiếp theo: sang Module Ngành với ngành cần xem, biến vĩ mô liên quan và dữ liệu cần kiểm chứng.",
            tutorNote:
              "Đây là output đúng của Module Vĩ mô. Chưa phải quyết định mua bán.",
          },
          {
            id: "after-buy-signal",
            label: "Khi thấy tín hiệu mua",
            value: "Hiểu sai Module Vĩ mô thành tín hiệu giao dịch.",
            tutorNote:
              "Module Vĩ mô không tạo tín hiệu mua bán. Nó chỉ tạo bối cảnh và câu hỏi kiểm chứng.",
          },
          {
            id: "never",
            label: "Không cần sang ngành, chỉ đọc vĩ mô là đủ",
            value: "Dừng lại ở vĩ mô.",
            tutorNote:
              "Vĩ mô chỉ là nền. Cần sang ngành và doanh nghiệp để kiểm chứng tác động thật.",
          },
        ],
      },
    ],
    saveActionLabel: "Lưu bản nhận định",
    previewTitle: "Bản nhận định vĩ mô cá nhân",
  },
  disclaimer: {
    title: "Nhắc nhở trước khi đi tiếp",
    content:
      "Một tín hiệu vĩ mô tích cực chưa đủ để kết luận thị trường thuận lợi. Cần kiểm tra xem dữ liệu ngành, BCTC doanh nghiệp, định giá và dòng tiền có xác nhận không. Module này không đưa khuyến nghị mua bán, không dự báo chắc chắn và không xếp hạng ngành đáng đầu tư nhất.",
  },
};
