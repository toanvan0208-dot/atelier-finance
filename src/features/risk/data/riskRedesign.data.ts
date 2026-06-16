import type { RiskRedesignData } from "../types";
import { buildRiskDeskData } from "../lib/build-risk-desk-data";
import type { RiskStatementSnapshot } from "../lib/map-risk-to-logic-input";

export const baseRiskRedesignData: RiskRedesignData = {
  ticker: "MWG",
  companyName: "CTCP Đầu tư Thế Giới Di Động",
  industry: "Bán lẻ",
  overall: {
    status: "Cần theo dõi rủi ro",
    score: 64,
    tone: "caution",
    conclusion:
      "MWG chưa có dấu hiệu rủi ro cực đoan, nhưng cần kiểm tra thêm dòng tiền, biên an toàn định giá và minh bạch thuyết minh trước khi mô phỏng.",
  },
  topRisks: [
    {
      id: "profit-cash-quality",
      title: "Chất lượng lợi nhuận chưa chắc",
      whyItMatters:
        "Nếu lợi nhuận tăng nhưng CFO không đi cùng, định giá dựa trên lợi nhuận sẽ kém tin cậy.",
      priority: "Cao",
      affectedModules: ["Báo cáo tài chính", "Định giá"],
      targetModule: "financials",
      earlyWarnings: [
        "CFO tiếp tục thấp hơn lợi nhuận sau thuế.",
        "Phải thu tăng nhanh hơn doanh thu.",
        "Tồn kho tăng mạnh nhưng doanh thu không tăng tương ứng.",
        "Biên lợi nhuận gộp không cải thiện.",
      ],
    },
    {
      id: "valuation-expectation",
      title: "Biên an toàn định giá mỏng",
      whyItMatters:
        "Nếu giá đã phản ánh trước kỳ vọng phục hồi, upside còn lại có thể không hấp dẫn.",
      priority: "Cao",
      affectedModules: ["Định giá", "PVT"],
      targetModule: "valuation",
      earlyWarnings: [
        "Giá tăng mạnh trước khi lợi nhuận cải thiện.",
        "P/E forward không còn rẻ so với lịch sử hoặc ngành.",
        "Tin tốt ra nhưng giá không tăng thêm.",
        "Volume tăng nóng quanh vùng kháng cự.",
      ],
    },
    {
      id: "transparency-notes",
      title: "Minh bạch thuyết minh cần kiểm tra",
      whyItMatters:
        "Nếu thuyết minh khoản phải thu, tồn kho hoặc giao dịch bên liên quan không rõ, độ tin cậy của BCTC sẽ giảm.",
      priority: "Trung bình cao",
      affectedModules: ["Minh bạch & quản trị", "Báo cáo tài chính"],
      targetModule: "risk",
      earlyWarnings: [
        "Thuyết minh thiếu chi tiết.",
        "Giao dịch bên liên quan tăng.",
        "Có thay đổi kiểm toán viên.",
        "Lãnh đạo hoặc cổ đông lớn giao dịch bất thường.",
      ],
    },
  ],
  missingEvidence: [
    "CFO quý gần nhất",
    "Thuyết minh khoản phải thu/tồn kho",
    "Giao dịch bên liên quan",
    "Giải trình biến động lợi nhuận",
    "Thanh khoản 20 phiên gần nhất",
  ],
  thesisBreakers: [
    {
      id: "breaker-financial",
      label: "Tài chính",
      targetModule: "financials",
      statement:
        "Luận điểm đang tin rằng MWG sẽ phục hồi lợi nhuận, nhưng nếu CFO không đi cùng lợi nhuận, vùng định giá hiện tại có thể quá lạc quan.",
    },
    {
      id: "breaker-valuation",
      label: "Định giá",
      targetModule: "valuation",
      statement:
        "Luận điểm đang tin rằng giá chưa quá đắt, nhưng nếu lợi nhuận phục hồi chậm, P/E forward thực tế có thể cao hơn kỳ vọng.",
    },
    {
      id: "breaker-transparency",
      label: "Minh bạch",
      targetModule: "risk",
      statement:
        "Luận điểm đang tin rằng doanh nghiệp minh bạch đủ, nhưng nếu thuyết minh khoản phải thu/tồn kho không rõ, độ tin cậy của BCTC sẽ giảm.",
    },
    {
      id: "breaker-pvt",
      label: "PVT",
      targetModule: "technical",
      statement:
        "Luận điểm đang tin rằng nhịp giá hiện tại được dòng tiền xác nhận, nhưng nếu giá tăng chủ yếu vì FOMO ngắn hạn, rủi ro hành động vội sẽ tăng.",
    },
  ],
  riskSources: [
    {
      id: "business-industry",
      title: "Kinh doanh & ngành",
      status: "Cần theo dõi",
      tone: "caution",
      defaultOpen: true,
      mainRisk: "Doanh thu phục hồi nhưng biên lợi nhuận chưa chắc cải thiện.",
      evidence: [
        "Sức mua tiêu dùng chưa phục hồi hoàn toàn.",
        "Cạnh tranh giá còn cao.",
        "Chuỗi mới có thể kéo biên lợi nhuận.",
      ],
      missingData: [
        "Biên lợi nhuận theo mảng.",
        "Doanh thu/cửa hàng.",
        "Tốc độ đóng/mở điểm bán.",
      ],
      sourceModules: ["Hiểu doanh nghiệp", "Ngành"],
      action: {
        label: "Quay lại Hiểu doanh nghiệp",
        moduleKey: "business",
      },
    },
    {
      id: "financial-quality",
      title: "Tài chính & chất lượng lợi nhuận",
      status: "Cần kiểm tra thêm",
      tone: "high",
      defaultOpen: true,
      mainRisk: "Lợi nhuận chưa được dòng tiền xác nhận đầy đủ.",
      evidence: [
        "Lợi nhuận phục hồi.",
        "CFO cần kiểm tra thêm.",
        "Phải thu/tồn kho cần xem kỹ.",
      ],
      missingData: [
        "CFO quý gần nhất.",
        "Thuyết minh khoản phải thu.",
        "Tồn kho theo kỳ.",
      ],
      sourceModules: ["Báo cáo tài chính"],
      action: {
        label: "Quay lại Báo cáo tài chính",
        moduleKey: "financials",
      },
    },
    {
      id: "valuation-expectation",
      title: "Định giá & kỳ vọng",
      status: "Cần theo dõi",
      tone: "caution",
      mainRisk: "Vùng giá hiện tại phụ thuộc nhiều vào giả định phục hồi lợi nhuận.",
      evidence: [
        "Biên an toàn mỏng.",
        "Giá gần vùng hợp lý.",
        "Kịch bản tốt phụ thuộc vào EPS phục hồi.",
      ],
      missingData: [
        "EPS dự phóng đã chuẩn hóa.",
        "P/E hợp lý so với ngành/lịch sử.",
      ],
      sourceModules: ["Định giá"],
      action: {
        label: "Quay lại Định giá",
        moduleKey: "valuation",
      },
    },
    {
      id: "transparency-governance",
      title: "Minh bạch & quản trị",
      status: "Thiếu dữ liệu",
      tone: "missing",
      mainRisk:
        "Chưa đủ dữ liệu để kết luận thuyết minh và giao dịch bên liên quan an toàn.",
      evidence: [
        "Chưa phát hiện dấu hiệu cực đoan.",
        "Ý kiến kiểm toán đang ổn sơ bộ.",
        "Cần kiểm tra thêm hành vi công bố thông tin.",
      ],
      missingData: [
        "Giao dịch bên liên quan.",
        "Thuyết minh khoản phải thu/tồn kho.",
        "Giao dịch lãnh đạo/cổ đông lớn.",
      ],
      sourceModules: ["Rủi ro & minh bạch", "Báo cáo tài chính"],
      action: {
        label: "Kiểm tra dữ liệu minh bạch",
        moduleKey: "risk",
      },
    },
    {
      id: "market-behavior",
      title: "Thị trường, thanh khoản & hành vi",
      status: "Cần theo dõi",
      tone: "caution",
      mainRisk:
        "Giá có thể tăng vì kỳ vọng hoặc FOMO trước khi dữ liệu thật xác nhận.",
      evidence: [
        "Giá gần kháng cự.",
        "Volume tăng.",
        "Biên an toàn định giá chưa rõ.",
      ],
      missingData: [
        "Thanh khoản 20 phiên.",
        "So sánh sức mạnh với ngành.",
        "Dấu hiệu FOMO.",
      ],
      sourceModules: ["PVT", "Kiểm tra & luyện tư duy"],
      action: {
        label: "Quay lại PVT",
        moduleKey: "technical",
      },
    },
  ],
  transparency: [
    {
      id: "audit-opinion",
      title: "Ý kiến kiểm toán",
      status: "Ổn sơ bộ",
      tone: "low",
      whyItMatters:
        "Ý kiến kiểm toán bất thường có thể làm giảm độ tin cậy của BCTC.",
      dataToCheck: ["Báo cáo kiểm toán", "BCTC năm"],
    },
    {
      id: "related-party",
      title: "Giao dịch bên liên quan",
      status: "Thiếu dữ liệu",
      tone: "missing",
      whyItMatters:
        "Giao dịch bên liên quan có thể làm lợi nhuận, chi phí hoặc dòng tiền kém minh bạch nếu không được thuyết minh rõ.",
      dataToCheck: ["Thuyết minh BCTC", "Báo cáo thường niên", "Công bố thông tin"],
    },
    {
      id: "leadership-trading",
      title: "Giao dịch lãnh đạo/cổ đông lớn",
      status: "Cần theo dõi",
      tone: "caution",
      whyItMatters:
        "Giao dịch bất thường của người nội bộ là dữ liệu cần kiểm tra thêm, không phải kết luận chắc chắn.",
      dataToCheck: ["Công bố giao dịch", "Lịch sử sở hữu", "Tin doanh nghiệp"],
    },
  ],
  stopConditions: [
    "Không xác định được 3 rủi ro lớn nhất.",
    "CFO tiếp tục yếu hoặc không xác nhận lợi nhuận.",
    "Biên an toàn định giá quá mỏng.",
    "Rủi ro minh bạch còn thiếu dữ liệu quan trọng.",
    "Giá tăng nóng/FOMO nhưng luận điểm cơ bản chưa được xác nhận.",
  ],
  riskTimeline: {
    shortTerm: ["Giá tăng nóng", "Tin tức nhiễu", "Thanh khoản bất thường", "FOMO"],
    mediumTerm: [
      "Biên lợi nhuận không phục hồi",
      "CFO yếu",
      "Tăng trưởng chậm hơn kỳ vọng",
    ],
    longTerm: [
      "Mô hình kinh doanh mất lợi thế",
      "Cạnh tranh thay đổi",
      "Minh bạch/quản trị yếu",
    ],
  },
  reverseRiskNote:
    "Rủi ro không chỉ là hành động sai. Rủi ro cũng có thể là không cập nhật khi dữ liệu đã cải thiện. Tuy nhiên, điều này không có nghĩa là được FOMO; hãy chờ dữ liệu xác nhận thay vì hành động vì cảm xúc.",
  finalConclusion: {
    biggestRisk:
      "Rủi ro lớn nhất là lợi nhuận phục hồi nhưng dòng tiền và biên lợi nhuận không xác nhận.",
    missingData:
      "Cần kiểm tra thêm CFO quý gần nhất, thuyết minh khoản phải thu/tồn kho và giao dịch bên liên quan.",
    thesisBreaker:
      "Nếu lợi nhuận phục hồi chậm hoặc định giá đã phản ánh trước kỳ vọng, vùng giá hiện tại có thể không còn hấp dẫn.",
    readiness:
      "Chưa đủ điều kiện đầy đủ. Có thể sang Kiểm tra & luyện tư duy ở chế độ theo dõi, nhưng chưa nên mô phỏng.",
    nextStep:
      "Quay lại BCTC để kiểm tra CFO, quay lại Định giá để kiểm tra biên an toàn, sau đó mới sang Kiểm tra & luyện tư duy.",
  },
  nextActions: [
    { label: "Sang Kiểm tra & luyện tư duy", moduleKey: "checklist", primary: true },
    { label: "Đưa vào Watchlist", moduleKey: "watchlist", primary: true },
    { label: "Quay lại Báo cáo tài chính", moduleKey: "financials" },
    { label: "Quay lại Định giá", moduleKey: "valuation" },
  ],
};

const riskStatementSnapshot: RiskStatementSnapshot = {
  ticker: "MWG",
  companyType: "non_financial",
  industry: "Bán lẻ",
  period: "TTM/FY2024 mẫu",
  periodType: "ttm",
  sourceName: "Mock financial statement snapshot",
  collectedAt: "2026-06-01",
  revenue: 118_400_000_000_000,
  previousRevenue: 112_000_000_000_000,
  grossProfit: 25_800_000_000_000,
  operatingProfit: 5_800_000_000_000,
  previousOperatingProfit: 4_900_000_000_000,
  netProfit: 4_200_000_000_000,
  previousNetProfit: 3_600_000_000_000,
  totalAssets: 72_500_000_000_000,
  previousTotalAssets: 69_000_000_000_000,
  totalLiabilities: 43_100_000_000_000,
  totalEquity: 29_400_000_000_000,
  previousTotalEquity: 27_600_000_000_000,
  cashAndEquivalents: 9_000_000_000_000,
  shortTermDebt: 13_200_000_000_000,
  longTermDebt: 5_400_000_000_000,
  totalDebt: 18_600_000_000_000,
  currentAssets: 47_000_000_000_000,
  currentLiabilities: 34_000_000_000_000,
  inventory: 19_300_000_000_000,
  previousInventory: 17_900_000_000_000,
  accountsReceivable: 12_100_000_000_000,
  previousAccountsReceivable: 10_800_000_000_000,
  operatingCashFlow: 2_100_000_000_000,
  previousOperatingCashFlow: 2_500_000_000_000,
  capitalExpenditure: 1_300_000_000_000,
  ebit: 5_600_000_000_000,
  ebitda: 8_100_000_000_000,
  sharesOutstanding: 1_463_000_000,
  closePrice: 42_000,
  previousClosePrice: 40_500,
  volume: 2_400_000,
  avgVolume20d: 2_100_000,
  avgTradingValue20d: 88_200_000_000,
  dividendPerShare: 500,
};

export const riskDataQuality = {
  source: riskStatementSnapshot.sourceName,
  asOf: riskStatementSnapshot.collectedAt,
  isDemoData: true,
  isStale: false,
  missingFields: [
    "Thuyết minh giao dịch bên liên quan",
    "Dữ liệu quản trị cập nhật",
    "Kiểm toán nguồn thật",
    "Dữ liệu thanh khoản nguồn thật",
  ],
};

export const riskRedesignData: RiskRedesignData = buildRiskDeskData(
  baseRiskRedesignData,
  riskStatementSnapshot
);
