import type { ValuationRefactoredData } from "../types";
import { buildValuationDeskData } from "../lib/build-valuation-desk-data";
import type { ValuationStatementSnapshot } from "../lib/map-valuation-to-logic-input";

export const baseValuationRefactoredData: ValuationRefactoredData = {
  isLoading: false,
  loading: {
    title: "Đang chuẩn bị dữ liệu định giá",
    content: "Hệ thống đang gom dữ liệu mẫu để minh họa vùng giá tham khảo.",
  },
  emptyState: {
    title: "Chưa có doanh nghiệp để định giá",
    description: "Hãy chuyển từ module Báo cáo tài chính sau khi đã đọc dữ liệu sơ bộ.",
    icon: "0",
  },
  summary: {
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    currentPrice: 42000,
    fairValueRange: {
      low: 37000,
      high: 46000,
      status: "Đang nằm trong vùng giá trị hợp lý",
      marginOfSafety: "Mỏng",
      confidence: "Trung bình",
      conclusion:
        "Giá hiện tại chưa đủ rẻ rõ ràng. Nhà đầu tư cần kiểm tra thêm giả định lợi nhuận phục hồi và biên lợi nhuận trước khi xem đây là cơ hội hấp dẫn.",
    },
  },
  assumptions: {
    intro:
      "Định giá không phải là dự đoán chắc chắn. Vùng giá dưới đây chỉ có ý nghĩa nếu các giả định nền phía sau hợp lý.",
    sensitiveNote:
      "Giả định nhạy nhất: EPS dự phóng và P/E hợp lý. Đây là hai yếu tố làm vùng giá thay đổi mạnh nhất.",
    items: [
      {
        title: "Lợi nhuận phục hồi",
        description:
          "Hệ thống đang giả định lợi nhuận năm tới không còn ở vùng thấp bất thường. Nếu lợi nhuận phục hồi chậm, vùng giá hợp lý sẽ thấp hơn.",
        sensitivity: "Rất cao",
      },
      {
        title: "Biên lợi nhuận cải thiện",
        description:
          "Hệ thống đang giả định doanh nghiệp kiểm soát chi phí tốt hơn và không phải giảm giá quá mạnh để cạnh tranh.",
        sensitivity: "Cao",
      },
      {
        title: "Thị trường chấp nhận P/E hợp lý",
        description:
          "Hệ thống đang giả định thị trường sẵn sàng trả khoảng 14 đến 16 lần lợi nhuận cho doanh nghiệp.",
        sensitivity: "Rất cao",
      },
      {
        title: "Không có cú sốc lớn từ ngành",
        description:
          "Nếu sức mua giảm mạnh, cạnh tranh tăng đột biến hoặc ngành xấu đi, kịch bản cơ sở sẽ kém tin cậy hơn.",
        sensitivity: "Trung bình",
      },
    ],
  },
  uncertainties: [
    {
      title: "Lợi nhuận dùng để định giá cần được chuẩn hóa",
      status: "Cần theo dõi",
      description: "Nếu lợi nhuận hiện tại thấp hoặc cao bất thường, P/E sẽ dễ gây hiểu nhầm.",
      targetModule: "financials",
    },
    {
      title: "CFO cần được kiểm tra",
      status: "Cần theo dõi",
      description: "Nếu lợi nhuận tăng nhưng dòng tiền kinh doanh yếu, định giá dựa trên lợi nhuận sẽ kém tin cậy.",
      targetModule: "financials",
    },
    {
      title: "Biên lợi nhuận phục hồi chưa chắc chắn",
      status: "Cần theo dõi",
      description: "Doanh thu tăng không đủ nếu doanh nghiệp phải giảm giá hoặc chi phí vẫn cao.",
      targetModule: "financials",
    },
    {
      title: "Kỳ vọng tăng trưởng ảnh hưởng mạnh đến kết quả",
      status: "Rủi ro cao",
      description: "Chỉ cần thay đổi giả định tăng trưởng, vùng giá hợp lý có thể thay đổi đáng kể.",
    },
  ],
  methods: [
    {
      name: "P/E",
      role: "Chính",
      explanation:
        "Phù hợp vì MWG là doanh nghiệp bán lẻ đã có lợi nhuận, thị trường thường so sánh bằng giá cổ phiếu chia cho lợi nhuận trên mỗi cổ phiếu.",
      confidence: "Trung bình",
    },
    {
      name: "EV/EBITDA",
      role: "Đối chiếu",
      explanation:
        "Dùng để kiểm tra thêm vì EBITDA giúp nhìn hoạt động kinh doanh trước ảnh hưởng của cấu trúc nợ và khấu hao.",
      confidence: "Trung bình",
    },
    {
      name: "DCF đơn giản",
      role: "Kiểm tra độ nhạy",
      explanation:
        "Không nên xem DCF là con số chính xác tuyệt đối. DCF dùng để xem giá trị thay đổi ra sao khi giả định tăng trưởng và dòng tiền thay đổi.",
      confidence: "Thấp",
    },
    {
      name: "P/B",
      role: "Chỉ tham khảo",
      explanation:
        "P/B thường phù hợp hơn với ngân hàng, bảo hiểm hoặc doanh nghiệp tài sản nặng. Với bán lẻ, P/B chỉ nên tham khảo.",
      confidence: "Thấp",
    },
  ],
  ranges: {
    rows: [
      {
        method: "P/E",
        keyAssumption: "EPS phục hồi, P/E hợp lý 14 đến 16 lần",
        range: "39.000 đến 46.000",
        confidence: "Trung bình",
        risk: "EPS có thể chưa ổn định",
      },
      {
        method: "EV/EBITDA",
        keyAssumption: "EBITDA phục hồi, biên lợi nhuận cải thiện",
        range: "37.000 đến 44.000",
        confidence: "Trung bình",
        risk: "EBITDA chưa phản ánh đầy đủ dòng tiền thật",
      },
      {
        method: "DCF đơn giản",
        keyAssumption: "Tăng trưởng vừa phải, dòng tiền phục hồi dần",
        range: "36.000 đến 48.000",
        confidence: "Thấp đến trung bình",
        risk: "Rất nhạy với tăng trưởng và chiết khấu",
      },
    ],
    combinedRange: "37.000 đến 46.000",
    explanation:
      "Vùng tổng hợp không phải trung bình máy móc. Nó là vùng tham khảo sau khi loại bỏ các kết quả quá lạc quan hoặc quá thiếu tin cậy.",
  },
  scenarios: {
    currentPrice: 42000,
    baseRange: "37.000 đến 46.000",
    conclusion:
      "Giá hiện tại đang nằm gần giữa vùng cơ sở. Biên an toàn chưa đủ dày. Nếu đánh giá ở vùng này, nhà đầu tư đang phụ thuộc vào khả năng lợi nhuận phục hồi đúng như kỳ vọng.",
    items: [
      {
        name: "Kịch bản xấu",
        range: "32.000 đến 37.000",
        explanation:
          "Lợi nhuận phục hồi chậm, biên lợi nhuận yếu, thị trường chỉ chấp nhận P/E thấp.",
        tone: "downside",
      },
      {
        name: "Kịch bản cơ sở",
        range: "37.000 đến 46.000",
        explanation:
          "Lợi nhuận phục hồi vừa phải, biên lợi nhuận cải thiện dần, P/E ở mức hợp lý.",
        tone: "base",
      },
      {
        name: "Kịch bản tốt",
        range: "46.000 đến 55.000",
        explanation:
          "Lợi nhuận phục hồi mạnh, biên lợi nhuận tốt hơn kỳ vọng, thị trường sẵn sàng trả P/E cao hơn.",
        tone: "upside",
      },
    ],
  },
  traps: [
    {
      title: "P/E thấp không có nghĩa là rẻ",
      description:
        "Nếu lợi nhuận đang ở đỉnh chu kỳ hoặc có khoản bất thường, P/E thấp có thể tạo diễn giải sai.",
    },
    {
      title: "DCF dễ bị làm đẹp bởi giả định",
      description:
        "Chỉ cần tăng nhẹ tăng trưởng dài hạn hoặc giảm tỷ lệ chiết khấu, giá trị DCF có thể tăng mạnh.",
    },
    {
      title: "Rẻ nhưng không có động lực cải thiện",
      description:
        "Một cổ phiếu có thể rẻ trong thời gian dài nếu lợi nhuận không phục hồi hoặc thị trường không có lý do định giá lại.",
    },
    {
      title: "Biên an toàn quá mỏng",
      description:
        "Nếu giá hiện tại đã nằm gần vùng hợp lý, sai số nhỏ trong giả định cũng có thể làm kết quả kém hấp dẫn.",
    },
  ],
  finalConclusion: {
    status: "Chưa đủ rẻ rõ ràng",
    pricePosition: "Giá hiện tại đang nằm trong vùng giá trị hợp lý, chưa rẻ rõ ràng.",
    marginOfSafety: "Biên an toàn hiện tại mỏng, chưa tạo lợi thế lớn cho nhà đầu tư trung hạn.",
    keyRisk:
      "Kết quả phụ thuộc nhiều vào giả định lợi nhuận phục hồi, biên lợi nhuận và mức P/E thị trường chấp nhận.",
    nextStep:
      "Có thể phân tích tiếp sang Rủi ro và Price - Volume - Time, nhưng chưa nên xem cổ phiếu là cơ hội hấp dẫn chỉ vì một vài chỉ số định giá nhìn thấp.",
  },
  nextActions: [
    {
      label: "Kiểm tra rủi ro trước khi mua",
      moduleKey: "risk",
      variant: "primary",
    },
    {
      label: "Xem Price - Volume - Time để chọn thời điểm",
      moduleKey: "technical",
      variant: "secondary",
    },
    {
      label: "Quay lại BCTC kiểm tra chất lượng lợi nhuận",
      moduleKey: "financials",
      variant: "ghost",
    },
  ],
};

const valuationStatementSnapshot: ValuationStatementSnapshot = {
  ticker: "MWG",
  companyType: "non_financial",
  industry: "retail",
  period: "TTM/FY2024 mẫu",
  periodType: "ttm",
  sourceName: "Mock financial statement snapshot",
  collectedAt: "2026-06-01",
  revenue: 118_400_000_000_000,
  netProfit: 4_200_000_000_000,
  totalEquity: 29_400_000_000_000,
  cashAndEquivalents: 9_000_000_000_000,
  totalDebt: 18_600_000_000_000,
  operatingCashFlow: 2_100_000_000_000,
  capitalExpenditure: 1_300_000_000_000,
  ebitda: 8_100_000_000_000,
  sharesOutstanding: 1_463_000_000,
  closePrice: 42_000,
  dividendPerShare: 500,
};

export const valuationDataQuality = {
  source: valuationStatementSnapshot.sourceName,
  asOf: valuationStatementSnapshot.collectedAt,
  isDemoData: true,
  isStale: false,
  missingFields: [
    "Giả định tăng trưởng từ nguồn thật",
    "So sánh ngành nguồn thật",
    "Dữ liệu chi phí vốn",
    "Kiểm chứng EPS chuẩn hóa",
  ],
};

export const valuationRefactoredData: ValuationRefactoredData = buildValuationDeskData(
  baseValuationRefactoredData,
  valuationStatementSnapshot
);
