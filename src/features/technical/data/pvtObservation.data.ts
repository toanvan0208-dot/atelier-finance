import type { PVTObservationData } from "../types";
import { buildTechnicalDeskData } from "../lib/build-technical-desk-data";
import type { TechnicalMarketSnapshot } from "../lib/map-technical-to-logic-input";

const basePvtObservationData: PVTObservationData = {
  ticker: "MWG",
  companyName: "CTCP Đầu tư Thế Giới Di Động",
  industry: "Bán lẻ",
  currentPrice: 42000,
  status: {
    label: "Có dấu hiệu cải thiện nhưng chưa xác nhận đủ mạnh",
    tone: "caution",
    conclusion:
      "Giá đang tiến gần vùng kháng cự trong khi biên an toàn định giá chưa rõ. Không nên hành động chỉ vì giá đang tăng.",
  },
  keyLevels: {
    support: "38.000 - 40.000",
    resistance: "44.000 - 46.000",
  },
  volume: {
    currentVsAvg20: 1.4,
    label: "Cao hơn trung bình 20 phiên",
    conclusion: "Volume đang cải thiện nhưng cần duy trì thêm vài phiên để xác nhận.",
  },
  chart: {
    title: "Biểu đồ giá và thanh khoản",
    points: [
      { label: "T-11", price: 37.8, volume: 2.1, ma20: 38.2, ma50: 39.4 },
      { label: "T-10", price: 38.5, volume: 2.3, ma20: 38.2, ma50: 39.1 },
      { label: "T-9", price: 39.1, volume: 2.0, ma20: 38.4, ma50: 39.0 },
      { label: "T-8", price: 38.6, volume: 1.9, ma20: 38.5, ma50: 38.9 },
      { label: "T-7", price: 39.7, volume: 2.8, ma20: 38.8, ma50: 38.9 },
      { label: "T-6", price: 40.2, volume: 3.1, ma20: 39.0, ma50: 39.0 },
      { label: "T-5", price: 40.8, volume: 3.4, ma20: 39.3, ma50: 39.2 },
      { label: "T-4", price: 41.5, volume: 3.7, ma20: 39.7, ma50: 39.4 },
      { label: "T-3", price: 42.3, volume: 4.2, ma20: 40.1, ma50: 39.7 },
      { label: "T-2", price: 41.8, volume: 3.0, ma20: 40.4, ma50: 39.9 },
      { label: "T-1", price: 42.6, volume: 4.0, ma20: 40.8, ma50: 40.2 },
      { label: "Hiện tại", price: 42.0, volume: 3.9, ma20: 41.0, ma50: 40.4 },
    ],
    events: [
      {
        label: "KQKD",
        title: "Kỳ vọng kết quả kinh doanh phục hồi",
        pointIndex: 6,
        note: "Nhịp tăng cần đối chiếu với dữ liệu tài chính thật.",
      },
      {
        label: "Ngành",
        title: "Tin sức mua bán lẻ cải thiện",
        pointIndex: 9,
        note: "Tác động còn cần kiểm chứng qua doanh thu và biên.",
      },
    ],
    quickRead: [
      {
        question: "Giá đang ở đâu?",
        answer: "Giá đang tiến gần vùng kháng cự 44.000 - 46.000.",
      },
      {
        question: "Volume có xác nhận không?",
        answer: "Volume tăng so với trung bình, nhưng cần duy trì thêm vài phiên.",
      },
      {
        question: "Có sự kiện nào đi kèm không?",
        answer: "Nhịp tăng cần đối chiếu với kỳ vọng phục hồi và kết quả kinh doanh.",
      },
    ],
  },
  signalLayers: [
    {
      id: "price",
      title: "Price: Giá",
      shortTitle: "Giá",
      question: "Giá đang ở đoạn nào của hành trình?",
      conclusion:
        "Giá đang tiến gần vùng kháng cự, chưa phải vùng quan sát có biên an toàn kỹ thuật tốt.",
      evidence: [
        "Giá đã tăng từ vùng nền gần nhất.",
        "Vùng 44.000 - 46.000 là kháng cự gần.",
        "Khoảng cách tới hỗ trợ và kháng cự tương đối cân bằng.",
      ],
      commonMistake:
        "Thấy giá xanh nhiều phiên không có nghĩa vùng quan sát hiện tại còn hấp dẫn.",
    },
    {
      id: "volume",
      title: "Volume: Thanh khoản",
      shortTitle: "Thanh khoản",
      question: "Volume đang xác nhận hay phủ nhận giá?",
      conclusion: "Volume cải thiện nhưng chưa đủ để xác nhận dòng tiền bền vững.",
      evidence: [
        "Volume hiện tại khoảng 1,4 lần trung bình 20 phiên.",
        "Cần xem volume có duy trì sau phiên tăng mạnh không.",
        "Nếu phiên giảm có volume lớn, bối cảnh giá/khối lượng sẽ cần kiểm tra lại nhanh.",
      ],
      commonMistake:
        "Volume cao không phải lúc nào cũng tốt; giá giảm mạnh kèm volume cao có thể là áp lực bán.",
    },
    {
      id: "time",
      title: "Time: Thời điểm",
      shortTitle: "Thời điểm",
      question: "Các khung thời gian có đồng thuận không?",
      conclusion: "Khung ngắn hạn tích cực hơn, nhưng trung hạn chưa xác nhận rõ.",
      evidence: [
        "Ngắn hạn cải thiện.",
        "Trung hạn vẫn cần quan sát.",
        "Chưa có xác nhận đồng thuận rõ giữa các khung.",
      ],
      commonMistake:
        "Chart ngắn hạn đẹp không có nghĩa xu hướng trung hạn đã đảo chiều.",
    },
    {
      id: "relative_strength",
      title: "Relative Strength: So với thị trường/ngành",
      shortTitle: "So sánh",
      question: "Cổ phiếu đang mạnh hơn hay yếu hơn thị trường và ngành?",
      conclusion: "Cổ phiếu có cải thiện, nhưng chưa phải mã dẫn dắt rõ trong nhóm.",
      evidence: [
        "Mạnh hơn nhẹ so với VN-Index.",
        "Ngang bằng so với ngành bán lẻ.",
        "Chưa nổi bật so với nhóm cùng ngành.",
      ],
      commonMistake:
        "Chỉ nhìn một chart riêng lẻ dễ khiến bạn đánh giá sai sức mạnh thật.",
    },
    {
      id: "event_psychology",
      title: "Sự kiện và tâm lý",
      shortTitle: "Sự kiện",
      question: "Biến động này đến từ sự kiện thật hay cảm xúc thị trường?",
      conclusion:
        "Nhịp tăng gần đây cần đối chiếu với dữ liệu thật, chưa nên xem là xác nhận chắc chắn.",
      evidence: [
        "Có kỳ vọng phục hồi sức mua.",
        "Cần kiểm tra kết quả kinh doanh.",
        "FOMO ở mức trung bình.",
      ],
      commonMistake:
        "Tin tốt ra nhưng giá không tăng cần được quan sát như phản ứng giá sau sự kiện/tin tức.",
    },
  ],
  confirmation: [
    "Giá vượt vùng 44.000 - 46.000 với volume cao hơn trung bình 20 phiên.",
    "Sau khi vượt, giá không rơi lại ngay dưới vùng vừa vượt.",
    "VN-Index không gãy hỗ trợ quan trọng.",
    "Nhóm bán lẻ không suy yếu đồng loạt.",
    "Tin hỗ trợ đến từ dữ liệu thật, không chỉ là kỳ vọng ngắn hạn.",
  ],
  invalidation: [
    "Giá không vượt được kháng cự và quay đầu với volume lớn.",
    "Phiên tăng có volume thấp, phiên giảm có volume cao.",
    "Giá thủng hỗ trợ gần nhất.",
    "Cổ phiếu yếu hơn VN-Index và ngành liên tục.",
    "Tin tốt xuất hiện nhưng giá không phản ứng tích cực.",
  ],
  scenarios: [
    {
      name: "Kịch bản tích cực",
      condition: "Giá vượt kháng cự với volume tốt, sau đó giữ được vùng vừa vượt.",
      meaning: "Dòng tiền có thể đang xác nhận luận điểm.",
    },
    {
      name: "Kịch bản trung tính",
      condition: "Giá đi ngang trong vùng 40.000 - 44.000, volume giảm dần.",
      meaning: "Cần chờ thêm, chưa có xác nhận rõ.",
    },
    {
      name: "Kịch bản tiêu cực",
      condition: "Giá thủng hỗ trợ 38.000 với volume lớn.",
      meaning: "Cấu trúc PVT xấu đi, nên quay lại kiểm tra rủi ro.",
    },
  ],
  riskReward: {
    currentPrice: 42000,
    supportPrice: 38000,
    resistancePrice: 46000,
    upside: "+9,5%",
    downside: "-9,5%",
    conclusion:
      "Tỷ lệ rủi ro/lợi nhuận ngắn hạn chưa hấp dẫn vì upside và downside gần tương đương.",
  },
  fomo: {
    level: "Trung bình",
    score: 3,
    maxScore: 6,
    signs: [
      "Giá đang gần kháng cự.",
      "Volume tăng sau nhịp giá mạnh.",
      "Biên an toàn định giá chưa rõ.",
    ],
    conclusion:
      "Không nên hành động chỉ vì giá đang chạy. Cần chờ xác nhận hoặc vùng quan sát có tỷ lệ rủi ro/lợi nhuận tốt hơn.",
  },
  finalConclusion: {
    status: "MWG có dấu hiệu cải thiện ngắn hạn nhưng chưa xác nhận đủ mạnh.",
    positive: "Giá giữ được vùng hỗ trợ gần và volume bắt đầu cải thiện.",
    caution:
      "Giá đang gần kháng cự, biên an toàn định giá chưa rõ và FOMO ở mức trung bình.",
    nextStep:
      "Có thể đưa vào Watchlist để theo dõi điều kiện xác nhận, đồng thời chuyển sang Rủi ro để kiểm tra điều gì có thể làm luận điểm sai.",
  },
  nextActions: [
    { label: "Đưa vào Watchlist", moduleKey: "watchlist", primary: true },
    { label: "Chuyển sang Rủi ro", moduleKey: "risk", primary: true },
    { label: "Quay lại Định giá", moduleKey: "valuation" },
    { label: "Kiểm tra FOMO sâu hơn", moduleKey: "checklist" },
  ],
};

const technicalMarketSnapshot: TechnicalMarketSnapshot = {
  ticker: "MWG",
  companyType: "non_financial",
  industry: "Bán lẻ",
  period: "Phiên hiện tại",
  periodType: "unknown",
  sourceName: "Dữ liệu mẫu nội bộ",
  collectedAt: "2026-06-01",
  closePrice: 42_000,
  previousClosePrice: 42_600,
  volume: 3_900_000,
  avgVolume20d: 2_785_714,
};

export const pvtDataQuality = {
  source: technicalMarketSnapshot.sourceName,
  asOf: technicalMarketSnapshot.collectedAt,
  isDemoData: true,
  isStale: false,
  missingFields: [
    "Nguồn giá/khối lượng thật",
    "Trading value bình quân",
    "Dữ liệu intraday",
    "Sự kiện thị trường cập nhật",
  ],
};

export const pvtObservationData = buildTechnicalDeskData(basePvtObservationData, technicalMarketSnapshot);
