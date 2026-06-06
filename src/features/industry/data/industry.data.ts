import type {
  IndustryBeneficiariesData,
  IndustryDeepDiveData,
  IndustryHealthData,
  IndustryImpactFactorsData,
  IndustryOutlookData,
  IndustryOverviewData,
  RepresentativeStocksData,
} from "../types";

export const industryOverviewData: IndustryOverviewData = {
  eyebrow: "Chương 3",
  icon: "▤",
  title: "Ngành Thép",
  description:
    "Một góc nhìn dễ hiểu trước khi đi vào doanh nghiệp: ngành đang làm gì, chịu tác động bởi yếu tố nào và nhóm nào có thể hưởng lợi hoặc bất lợi.",
  sectionTitle: "Tổng quan ngành",
  sectionIcon: "A",
  items: [
    {
      id: "doing",
      label: "Ngành làm gì?",
      value:
        "Ngành thép sản xuất và phân phối vật liệu thép dùng cho xây dựng, hạ tầng, công nghiệp và một phần xuất khẩu.",
    },
    {
      id: "serving",
      label: "Ngành phục vụ ai?",
      value:
        "Khách hàng chính gồm nhà thầu xây dựng, doanh nghiệp bất động sản, dự án hạ tầng, nhà máy sản xuất và đơn vị thương mại.",
    },
    {
      id: "monetization",
      label: "Ngành kiếm tiền bằng cách nào?",
      value:
        "Doanh nghiệp kiếm tiền từ chênh lệch giữa giá bán thép và chi phí đầu vào như quặng sắt, than cốc, điện, vận tải và chi phí tài chính.",
    },
  ],
};

export const industryHealthData: IndustryHealthData = {
  title: "Sức khỏe ngành",
  icon: "H",
  status: "Trung lập",
  statusType: "neutral",
  score: 58,
  scoreUnit: "/100",
  explanation:
    "Ngành có dấu hiệu phục hồi nhưng chưa thật sự mạnh. Nhu cầu xây dựng và đầu tư công hỗ trợ, trong khi giá đầu vào và sức mua bất động sản vẫn cần theo dõi.",
  metricLabels: {
    status: "Trạng thái",
    scale: "Cách đọc",
  },
  scaleValue: "0-100",
};

export const industryImpactFactorsData: IndustryImpactFactorsData = {
  title: "Các yếu tố tác động chính",
  icon: "I",
  factors: [
    {
      id: "macro",
      label: "Vĩ mô",
      icon: "M",
      description:
        "Lãi suất, tín dụng và đầu tư công ảnh hưởng trực tiếp tới nhu cầu xây dựng và chi phí vốn của doanh nghiệp.",
      impactLevel: "Cao",
    },
    {
      id: "policy",
      label: "Chính sách",
      icon: "P",
      description:
        "Giải ngân hạ tầng, quy định bất động sản và chính sách thương mại có thể làm nhu cầu thay đổi nhanh.",
      impactLevel: "Cao",
    },
    {
      id: "technology",
      label: "Công nghệ",
      icon: "T",
      description:
        "Công nghệ sản xuất tiết kiệm năng lượng và quản trị tồn kho giúp doanh nghiệp giảm biến động biên lợi nhuận.",
      impactLevel: "Vừa",
    },
    {
      id: "commodity",
      label: "Giá hàng hóa",
      icon: "C",
      description:
        "Quặng sắt, than cốc, điện và vận tải quyết định giá vốn. Giá đầu vào tăng nhanh có thể bóp biên lợi nhuận.",
      impactLevel: "Cao",
    },
    {
      id: "demand",
      label: "Nhu cầu thị trường",
      icon: "D",
      description:
        "Nhu cầu từ xây dựng dân dụng, bất động sản, hạ tầng và xuất khẩu là động lực chính cho sản lượng tiêu thụ.",
      impactLevel: "Cao",
    },
  ],
};

export const industryOutlookData: IndustryOutlookData = {
  title: "Triển vọng 6-12 tháng",
  icon: "O",
  tone: "neutral",
  label: "Trung lập",
  reasonsTitle: "Lý do chính",
  watchItemsTitle: "Điều cần theo dõi tiếp",
  reasons: [
    "Đầu tư công và nhu cầu hạ tầng có thể hỗ trợ sản lượng.",
    "Bất động sản phục hồi chậm khiến nhu cầu chưa bùng nổ.",
    "Biên lợi nhuận còn phụ thuộc vào giá nguyên liệu và khả năng tăng giá bán.",
  ],
  watchItems: [
    "Tốc độ giải ngân đầu tư công",
    "Tín dụng bất động sản và số dự án mở bán",
    "Giá quặng sắt, than cốc và tồn kho thép",
  ],
};

export const industryBeneficiariesData: IndustryBeneficiariesData = {
  title: "Nhóm hưởng lợi / bất lợi",
  icon: "B",
  beneficiariesTitle: "Nhóm hưởng lợi",
  disadvantagedTitle: "Nhóm bất lợi",
  beneficiaries: [
    {
      id: "integrated-producers",
      title: "Doanh nghiệp quy mô lớn, tích hợp sản xuất",
      description:
        "Có lợi thế chi phí, năng lực bán hàng và khả năng hấp thụ biến động đầu vào tốt hơn.",
    },
    {
      id: "public-investment-exposure",
      title: "Doanh nghiệp có đầu ra gắn với hạ tầng",
      description:
        "Có thể hưởng lợi khi đầu tư công và dự án xây dựng lớn được đẩy nhanh.",
    },
  ],
  disadvantaged: [
    {
      id: "high-debt",
      title: "Doanh nghiệp nợ cao",
      description:
        "Dễ chịu áp lực khi lãi suất hoặc vòng quay hàng tồn kho không thuận lợi.",
    },
    {
      id: "weak-inventory-control",
      title: "Doanh nghiệp quản trị tồn kho yếu",
      description:
        "Có thể bị ảnh hưởng mạnh nếu giá thép hoặc nguyên liệu đảo chiều nhanh.",
    },
  ],
};

export const representativeStocksData: RepresentativeStocksData = {
  title: "Cổ phiếu tiêu biểu",
  icon: "S",
  caption: "Cổ phiếu tiêu biểu theo ngành",
  columns: {
    ticker: "Mã",
    category: "Vai trò",
    rationale: "Lý do theo dõi",
    riskNote: "Lưu ý",
  },
  stocks: [
    {
      id: "leader",
      ticker: "AAA",
      name: "Doanh nghiệp dẫn đầu ngành",
      category: "Dẫn đầu ngành",
      rationale:
        "Quy mô lớn, chuỗi sản xuất tương đối khép kín và có khả năng đại diện cho xu hướng ngành.",
      riskNote: "Cần kiểm tra biên lợi nhuận và tồn kho khi giá hàng hóa biến động.",
    },
    {
      id: "clear-beneficiary",
      ticker: "BBB",
      name: "Doanh nghiệp hưởng lợi rõ",
      category: "Hưởng lợi rõ",
      rationale:
        "Có đầu ra liên quan nhiều tới hạ tầng và xây dựng công nghiệp trong giai đoạn phục hồi.",
      riskNote: "Cần theo dõi tiến độ đơn hàng và khả năng chuyển giá đầu vào.",
    },
    {
      id: "high-risk",
      ticker: "CCC",
      name: "Doanh nghiệp rủi ro cao",
      category: "Rủi ro cao",
      rationale:
        "Đòn bẩy tài chính cao hoặc phụ thuộc nhiều vào một nhóm khách hàng/nguyên liệu.",
      riskNote: "Không nên chỉ nhìn giá rẻ; cần đọc kỹ dòng tiền và nợ vay.",
    },
    {
      id: "watch-more",
      ticker: "DDD",
      name: "Doanh nghiệp cần theo dõi thêm",
      category: "Cần theo dõi thêm",
      rationale:
        "Có tín hiệu cải thiện nhưng dữ liệu chưa đủ rõ để đánh giá sức khỏe dài hơn.",
      riskNote: "Cần chờ thêm báo cáo quý, sản lượng và biến động tồn kho.",
    },
  ],
};

export const industryDeepDiveData: IndustryDeepDiveData = {
  title: "Phân tích chuyên sâu",
  icon: "D",
  triggerLabel: "Xem phân tích chuyên sâu",
  sections: [
    {
      id: "value-chain",
      title: "Chuỗi giá trị",
      description:
        "Nhìn dòng tiền đi qua các khâu để biết doanh nghiệp nằm ở đâu trong ngành.",
      items: [
        "Đầu vào: quặng sắt, than cốc, thép phế, điện và vận tải.",
        "Sản xuất: luyện gang thép, cán thép, HRC, thép xây dựng.",
        "Đầu ra: xây dựng, công nghiệp, thương mại và xuất khẩu.",
      ],
    },
    {
      id: "competition",
      title: "Cấu trúc cạnh tranh",
      items: [
        "Doanh nghiệp lớn thường có lợi thế quy mô và kênh phân phối.",
        "Doanh nghiệp nhỏ nhạy hơn với giá đầu vào và vòng quay tồn kho.",
        "Cạnh tranh có thể đến từ nhập khẩu khi giá khu vực thấp.",
      ],
    },
    {
      id: "entry-barriers",
      title: "Rào cản gia nhập",
      items: [
        "Cần vốn lớn, công suất lớn và thời gian xây dựng nhà máy dài.",
        "Yêu cầu quản trị nguyên liệu, tồn kho, môi trường và bán hàng tốt.",
      ],
    },
    {
      id: "substitutes",
      title: "Sản phẩm thay thế",
      items: [
        "Một số vật liệu xây dựng khác có thể thay thế ở từng ứng dụng hẹp.",
        "Trong hạ tầng và công nghiệp nặng, thép vẫn khó bị thay thế hoàn toàn.",
      ],
    },
    {
      id: "kpi",
      title: "KPI ngành",
      items: [
        "Sản lượng tiêu thụ thép xây dựng và HRC.",
        "Biên lợi nhuận gộp, vòng quay tồn kho, giá bán bình quân.",
        "Tỷ lệ nợ vay và chi phí lãi vay.",
      ],
    },
    {
      id: "catalyst",
      title: "Catalyst",
      items: [
        "Đầu tư công tăng tốc.",
        "Bất động sản mở bán trở lại.",
        "Giá đầu vào giảm trong khi giá bán giữ ổn định.",
      ],
    },
    {
      id: "bull-bear",
      title: "Bull case / Bear case",
      items: [
        "Bull case: nhu cầu tăng, giá đầu vào hạ, doanh nghiệp cải thiện biên lợi nhuận.",
        "Bear case: nhu cầu yếu, tồn kho cao, giá đầu vào tăng hoặc cạnh tranh nhập khẩu mạnh.",
      ],
    },
    {
      id: "policy",
      title: "Chính sách",
      items: [
        "Đầu tư công, bất động sản, thuế nhập khẩu và tiêu chuẩn môi trường đều có thể tác động.",
        "Nên xem chính sách là yếu tố kiểm chứng, không phải lý do duy nhất để kết luận.",
      ],
    },
  ],
  dataTable: {
    title: "Dữ liệu trọng yếu",
    icon: "K",
    columns: {
      category: "Nhóm dữ liệu",
      dataPoint: "Dữ liệu cần theo dõi",
      whyItMatters: "Vì sao quan trọng",
    },
    rows: [
      {
        category: "Nhu cầu",
        dataPoint: "Sản lượng tiêu thụ, đầu tư công, bất động sản",
        whyItMatters: "Cho biết ngành có bán được nhiều hơn hay không.",
      },
      {
        category: "Chi phí",
        dataPoint: "Quặng sắt, than cốc, điện, logistics",
        whyItMatters: "Ảnh hưởng trực tiếp tới biên lợi nhuận.",
      },
      {
        category: "Tài chính",
        dataPoint: "Tồn kho, nợ vay, dòng tiền kinh doanh",
        whyItMatters: "Giúp kiểm tra chất lượng phục hồi của doanh nghiệp.",
      },
      {
        category: "Cạnh tranh",
        dataPoint: "Giá thép nhập khẩu, công suất mới, thị phần",
        whyItMatters: "Cho biết áp lực giá bán và sức mạnh của từng doanh nghiệp.",
      },
    ],
  },
};
