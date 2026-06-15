import type { OverviewCaseDashboardData } from "../types";
import { buildOverviewDeskData } from "../lib/build-overview-desk-data";
import type { OverviewStatementSnapshot } from "../lib/map-overview-to-logic-input";

export const baseOverviewCaseData: OverviewCaseDashboardData = {
  activeCase: {
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    industry: "Bán lẻ",
    caseStatus: "Có thesis sơ bộ nhưng chưa đủ tin cậy",
    currentStage: "Báo cáo tài chính -> Định giá",
    temporaryThesis:
      "MWG có dấu hiệu phục hồi, nhưng cần kiểm chứng thêm dòng tiền, tồn kho, biên lợi nhuận và vùng định giá.",
    mainWarning:
      "Luận điểm phục hồi chưa đủ đáng tin nếu lợi nhuận không chuyển thành dòng tiền thật.",
    notReadyFor: [
      "Mô phỏng",
      "Kết luận cổ phiếu hấp dẫn",
      "Tăng tỷ trọng giả lập",
    ],
  },
  nextBestAction: {
    title: "Kiểm chứng lợi nhuận có chuyển thành tiền không",
    module: "Báo cáo tài chính",
    priority: "Cao",
    reason:
      "Nếu CFO yếu, thesis phục hồi của MWG giảm độ tin cậy. Lợi nhuận kế toán tăng nhưng không chuyển thành dòng tiền thì định giá dựa trên lợi nhuận sẽ kém chắc.",
    cta: {
      label: "Mở Báo cáo tài chính",
      moduleKey: "financials",
    },
    secondaryActions: [
      { title: "Tạo vùng định giá sơ bộ", moduleKey: "valuation" },
      { title: "Kiểm tra rủi ro minh bạch", moduleKey: "risk" },
    ],
  },
  summaryCards: [],
  missingData: [
    {
      title: "CFO quý gần nhất",
      whyItMatters:
        "Chưa biết lợi nhuận phục hồi có chuyển thành tiền thật không.",
      consequence: "Định giá dựa trên lợi nhuận có thể quá lạc quan.",
      priority: "Cao",
      targetModule: "Báo cáo tài chính",
      moduleKey: "financials",
    },
    {
      title: "Vùng định giá tham khảo",
      whyItMatters:
        "Chưa biết giá hiện tại có biên an toàn hay không.",
      consequence: "Người dùng dễ bị FOMO nếu chỉ nhìn giá tăng.",
      priority: "Cao",
      targetModule: "Định giá",
      moduleKey: "valuation",
    },
    {
      title: "Rủi ro minh bạch và quản trị",
      whyItMatters:
        "Chưa biết dữ liệu tài chính và thuyết minh có đủ đáng tin không.",
      consequence:
        "Luận điểm đầu tư có thể dựa trên dữ liệu chưa được kiểm chứng.",
      priority: "Vừa",
      targetModule: "Rủi ro & minh bạch",
      moduleKey: "risk",
    },
    {
      title: "PVT/FOMO check",
      whyItMatters:
        "Chưa biết hành vi giá và volume đang xác nhận luận điểm hay chỉ tạo cảm xúc.",
      consequence:
        "Người dùng có thể hành động vì giá chạy thay vì vì luận điểm.",
      priority: "Vừa",
      targetModule: "Price - Volume - Time",
      moduleKey: "technical",
    },
  ],
  progressMap: [
    {
      id: "macro",
      title: "Vĩ mô",
      status: "Hoàn thành sơ bộ",
      summary:
        "Bối cảnh vĩ mô không phải rào cản lớn, nhưng cần theo dõi lãi suất và sức mua.",
      moduleKey: "macro",
    },
    {
      id: "industry",
      title: "Ngành",
      status: "Hoàn thành sơ bộ",
      summary: "Ngành bán lẻ có dấu hiệu phục hồi nhưng cạnh tranh vẫn cao.",
      moduleKey: "industry",
    },
    {
      id: "screening",
      title: "Lọc cổ phiếu",
      status: "Hoàn thành sơ bộ",
      summary: "MWG qua bộ lọc ban đầu, nhưng chưa đủ để kết luận.",
      moduleKey: "screening",
    },
    {
      id: "business",
      title: "Hiểu doanh nghiệp",
      status: "Hoàn thành sơ bộ",
      summary: "MWG có mô hình rõ, nhưng cần kiểm tra biên lợi nhuận từng mảng.",
      moduleKey: "business",
    },
    {
      id: "financials",
      title: "Báo cáo tài chính",
      status: "Đang làm",
      summary: "Cần kiểm tra CFO, tồn kho và phải thu.",
      moduleKey: "financials",
    },
    {
      id: "valuation",
      title: "Định giá",
      status: "Thiếu dữ liệu",
      summary: "Chưa có vùng giá trị hợp lý và biên an toàn.",
      moduleKey: "valuation",
    },
    {
      id: "technical",
      title: "Price - Volume - Time",
      status: "Chưa làm",
      summary: "Chưa biết giá và volume đang xác nhận hay tạo FOMO.",
      moduleKey: "technical",
    },
    {
      id: "risk",
      title: "Rủi ro & minh bạch",
      status: "Chưa làm",
      summary: "Chưa xác định điều gì có thể làm luận điểm sai.",
      moduleKey: "risk",
    },
    {
      id: "checklist",
      title: "Kiểm tra cổ phiếu",
      status: "Khóa/chưa đủ điều kiện",
      summary: "Cần hoàn thiện BCTC, Định giá và Rủi ro trước.",
      moduleKey: "checklist",
    },
  ],
  actionStatus: {
    canDo: [
      "Tiếp tục phân tích Báo cáo tài chính",
      "Đưa MWG vào Watchlist để theo dõi dữ liệu còn thiếu",
      "Học nhanh bài CFO nếu chưa hiểu",
    ],
    shouldNotDoYet: [
      "Chưa nên mô phỏng",
      "Chưa nên kết luận cổ phiếu hấp dẫn",
      "Chưa nên tăng tỷ trọng giả lập",
      "Chưa nên hành động chỉ vì giá tăng",
    ],
    unlockConditions: [
      "Kiểm tra CFO và tồn kho",
      "Có vùng định giá sơ bộ",
      "Xác định top 3 rủi ro sống còn",
      "Kiểm tra PVT/FOMO",
    ],
    conclusion:
      "MWG hiện phù hợp để tiếp tục phân tích hoặc đưa vào Watchlist theo dõi, nhưng chưa đủ điều kiện để mô phỏng.",
  },
  support: {
    watchlist: [
      { ticker: "MWG", status: "Đang phân tích dở", note: "Thiếu CFO và định giá" },
      { ticker: "FPT", status: "Cần cập nhật", note: "Cần xem lại định giá" },
      { ticker: "PNJ", status: "Theo dõi", note: "Chờ kiểm tra ngành và PVT" },
    ],
    learning: [
      {
        title: "Dòng tiền kinh doanh CFO là gì?",
        reason:
          "Bạn đang cần kiểm chứng lợi nhuận có chuyển thành tiền thật không.",
        moduleKey: "learning",
      },
      {
        title: "Vì sao lợi nhuận không đồng nghĩa với tiền thật?",
        reason: "Giúp tránh tin nhầm vào lợi nhuận kế toán.",
        moduleKey: "learning",
      },
    ],
    profile: {
      status: "Chưa hoàn tất",
      message:
        "Hồ sơ phân tích của bạn chưa hoàn tất. Điều này có thể làm hệ thống điều hướng chưa sát với mục tiêu đầu tư của bạn.",
      moduleKey: "route-config",
    },
  },
  disclaimer:
    "Tổng quan chỉ điều phối case đang phân tích, dữ liệu còn thiếu và bước tiếp theo. Nội dung chỉ là dữ liệu tham khảo.",
};

const overviewStatementSnapshot: OverviewStatementSnapshot = {
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
  operatingCashFlow: 2_100_000_000_000,
  previousOperatingCashFlow: 2_500_000_000_000,
  capitalExpenditure: 1_300_000_000_000,
  interestExpense: 420_000_000_000,
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

export const overviewDataQuality = {
  source: overviewStatementSnapshot.sourceName,
  asOf: overviewStatementSnapshot.collectedAt,
  isDemoData: true,
  isStale: false,
  missingFields: [
    "CFO quý gần nhất",
    "Thuyết minh tồn kho/phải thu",
    "Dữ liệu định giá nguồn thật",
    "Dữ liệu PVT nguồn thật",
  ],
};

export const overviewCaseData: OverviewCaseDashboardData = buildOverviewDeskData(
  baseOverviewCaseData,
  overviewStatementSnapshot
);
