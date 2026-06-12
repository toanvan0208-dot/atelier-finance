export type BusinessFlowNodeType =
  | "source"
  | "operation"
  | "channel"
  | "customer"
  | "revenue"
  | "cost"
  | "profit";

export type BusinessFlowNode = {
  label: string;
  description?: string;
  type?: BusinessFlowNodeType;
};

export type BusinessStrengthItem = {
  label: string;
  explanation: string;
};

export type BusinessWeaknessItem = {
  label: string;
  explanation: string;
};

export type BusinessDirectionItem = {
  label: string;
  explanation: string;
};

export type BusinessCheckItem = {
  label: string;
  reason: string;
};

export type BusinessUnderstandingProfile = {
  ticker: string;
  companyName: string;
  industry: string;
  businessType: string;
  overview: {
    headline: string;
    shortDescription: string;
    keyTakeaway: string;
  };
  customerAndProduct: {
    title: string;
    products: string[];
    customers: string[];
    purchaseReasons: string[];
    demandDrivers: string[];
    analysisMeaning: string;
    commonMisread: string;
  };
  moneyFlow: {
    title: string;
    flow: BusinessFlowNode[];
    mainRevenueSources: string[];
    mainCostItems: string[];
    analysisMeaning: string;
    commonMisread: string;
  };
  competitivePosition: {
    title: string;
    strengths: BusinessStrengthItem[];
    weaknesses: BusinessWeaknessItem[];
    futureDirection: BusinessDirectionItem[];
    analysisMeaning: string;
    commonMisread: string;
  };
  businessConditions: {
    title: string;
    improvesWhen: string[];
    worsensWhen: string[];
    keySignalsToWatch: string[];
    analysisMeaning: string;
    commonMisread: string;
  };
  nextFinancialChecks: {
    title: string;
    description: string;
    checks: BusinessCheckItem[];
  };
};

export const businessUnderstandingByTicker: Record<string, BusinessUnderstandingProfile> = {
  MWG: {
    ticker: "MWG",
    companyName: "CTCP Đầu tư Thế Giới Di Động",
    industry: "Bán lẻ",
    businessType: "Chuỗi bán lẻ tiêu dùng",
    overview: {
      headline: "MWG là doanh nghiệp bán lẻ phụ thuộc nhiều vào sức mua tiêu dùng nội địa.",
      shortDescription:
        "Doanh nghiệp vận hành các chuỗi bán lẻ như Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh và kênh online.",
      keyTakeaway: "Điểm cần chú ý là sức mua, hiệu quả cửa hàng, tồn kho, biên lợi nhuận và dòng tiền.",
    },
    customerAndProduct: {
      title: "MWG bán hàng tiêu dùng cho người tiêu dùng cá nhân.",
      products: ["Điện thoại", "Điện máy", "Hàng tiêu dùng"],
      customers: ["Người tiêu dùng cá nhân", "Hộ gia đình"],
      purchaseReasons: ["Tiện lợi", "Thương hiệu quen thuộc", "Dễ bảo hành", "Mạng lưới cửa hàng rộng"],
      demandDrivers: ["Thu nhập người dân", "Sức mua nội địa", "Nhu cầu thay thế thiết bị", "Tâm lý tiêu dùng"],
      analysisMeaning:
        "Vì khách hàng chính là người tiêu dùng cá nhân, MWG nhạy với chu kỳ tiêu dùng. Khi sức mua yếu, doanh thu điện thoại và điện máy có thể chịu áp lực.",
      commonMisread: "Doanh nghiệp nổi tiếng không đồng nghĩa cổ phiếu tốt.",
    },
    moneyFlow: {
      title: "Tiền của MWG đi qua mô hình bán lẻ chuỗi.",
      flow: [
        { label: "Nhà cung cấp", description: "Cung cấp điện thoại, điện máy, hàng tiêu dùng.", type: "source" },
        { label: "MWG nhập hàng", description: "Doanh nghiệp nhập hàng và phân phối qua các chuỗi.", type: "operation" },
        { label: "Cửa hàng và online", description: "Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh, kênh online.", type: "channel" },
        { label: "Khách hàng trả tiền", description: "Người tiêu dùng mua hàng tại cửa hàng hoặc online.", type: "customer" },
        { label: "Doanh thu", description: "Tiền thu từ bán hàng và dịch vụ đi kèm.", type: "revenue" },
        { label: "Chi phí vận hành", description: "Giá vốn, mặt bằng, nhân sự, logistics, tồn kho.", type: "cost" },
        { label: "Lợi nhuận và dòng tiền", description: "Phần còn lại sau chi phí, nếu tiền thật thu về tốt.", type: "profit" },
      ],
      mainRevenueSources: ["Bán hàng tại cửa hàng", "Bán online", "Dịch vụ đi kèm"],
      mainCostItems: ["Giá vốn", "Mặt bằng", "Nhân sự", "Logistics", "Tồn kho"],
      analysisMeaning:
        "Mô hình bán lẻ có doanh thu lớn nhưng biên lợi nhuận không quá dày, nên kiểm soát chi phí và tồn kho rất quan trọng.",
      commonMisread: "Doanh thu cao chưa chắc doanh nghiệp khỏe.",
    },
    competitivePosition: {
      title: "MWG có lợi thế về thương hiệu và mạng lưới, nhưng cũng chịu gánh nặng vận hành.",
      strengths: [
        {
          label: "Thương hiệu quen thuộc",
          explanation: "Giúp khách hàng dễ nhận diện và tin tưởng khi mua hàng.",
        },
        {
          label: "Mạng lưới cửa hàng rộng",
          explanation: "Giúp tiếp cận khách hàng tốt hơn, nhưng chỉ là lợi thế nếu cửa hàng vận hành hiệu quả.",
        },
        {
          label: "Kinh nghiệm vận hành chuỗi",
          explanation: "Có kinh nghiệm quản lý nhiều điểm bán, nhân sự, hàng hóa và logistics.",
        },
      ],
      weaknesses: [
        {
          label: "Chi phí vận hành lớn",
          explanation: "Mặt bằng, nhân sự và logistics có thể bào mòn lợi nhuận khi doanh thu yếu.",
        },
        {
          label: "Phụ thuộc sức mua",
          explanation: "Khi người dân thắt chặt chi tiêu, nhóm điện thoại và điện máy có thể bị ảnh hưởng.",
        },
        {
          label: "Cạnh tranh giá",
          explanation: "Ngành bán lẻ dễ phải khuyến mãi hoặc giảm giá để giữ doanh số.",
        },
      ],
      futureDirection: [
        {
          label: "Tối ưu Bách Hóa Xanh",
          explanation: "Chỉ có ý nghĩa nếu mô hình cửa hàng có lãi, tồn kho quay nhanh và logistics hiệu quả.",
        },
        {
          label: "Bán hàng đa kênh",
          explanation: "Có thể giúp tăng độ phủ nếu kết hợp tốt cửa hàng và online.",
        },
      ],
      analysisMeaning:
        "Điểm mạnh của MWG chỉ có giá trị nếu chuyển thành doanh thu, biên lợi nhuận và dòng tiền tốt.",
      commonMisread:
        "Mạng lưới rộng có thể là lợi thế, nhưng cũng có thể là gánh nặng nếu cửa hàng kém hiệu quả.",
    },
    businessConditions: {
      title: "Mô hình MWG tốt lên khi sức mua và hiệu quả vận hành cùng cải thiện.",
      improvesWhen: [
        "Sức mua phục hồi",
        "Hàng quay vòng nhanh",
        "Biên lợi nhuận ổn định",
        "Chi phí vận hành được kiểm soát",
        "Dòng tiền kinh doanh tốt",
      ],
      worsensWhen: [
        "Sức mua yếu",
        "Phải giảm giá mạnh",
        "Tồn kho tăng",
        "Chi phí vận hành tăng",
        "Lợi nhuận có nhưng tiền thật không về",
      ],
      keySignalsToWatch: ["Doanh thu", "Biên lợi nhuận", "Tồn kho", "Dòng tiền kinh doanh", "Chi phí bán hàng", "Nợ vay"],
      analysisMeaning:
        "Với MWG, cần đặc biệt chú ý xem tăng trưởng doanh thu có đi cùng biên lợi nhuận ổn định và dòng tiền thật hay không.",
      commonMisread: "Mô hình nghe tốt trên lý thuyết chưa chắc đang tốt trong thực tế.",
    },
    nextFinancialChecks: {
      title: "Sang Báo cáo tài chính để kiểm chứng.",
      description: "Báo cáo tài chính sẽ kiểm tra xem mô hình bán lẻ của MWG có được số liệu ủng hộ hay không.",
      checks: [
        { label: "Doanh thu", reason: "Kiểm tra sức mua và hiệu quả bán hàng." },
        { label: "Biên lợi nhuận", reason: "Kiểm tra doanh nghiệp giữ lại được bao nhiêu sau giá vốn." },
        { label: "Tồn kho", reason: "Kiểm tra hàng có bị kẹt không." },
        { label: "Dòng tiền kinh doanh", reason: "Kiểm tra lợi nhuận có biến thành tiền thật không." },
        { label: "Nợ vay", reason: "Kiểm tra áp lực tài chính khi mở rộng hoặc vận hành chuỗi." },
      ],
    },
  },
  FPT: {
    ticker: "FPT",
    companyName: "CTCP FPT",
    industry: "Công nghệ",
    businessType: "Công nghệ, viễn thông và giáo dục",
    overview: {
      headline: "FPT là doanh nghiệp công nghệ phụ thuộc vào năng lực nhân sự và nhu cầu chuyển đổi số.",
      shortDescription:
        "Doanh nghiệp hoạt động ở dịch vụ công nghệ thông tin, chuyển đổi số, viễn thông và giáo dục.",
      keyTakeaway: "Điểm cần chú ý là backlog, năng suất nhân sự, biên dịch vụ, nhu cầu quốc tế và dòng tiền.",
    },
    customerAndProduct: {
      title: "FPT cung cấp dịch vụ công nghệ, viễn thông và giáo dục cho nhiều nhóm khách hàng.",
      products: ["Dịch vụ công nghệ thông tin", "Chuyển đổi số", "Viễn thông", "Giáo dục"],
      customers: ["Doanh nghiệp trong nước", "Khách hàng quốc tế", "Người dùng viễn thông", "Học viên, sinh viên"],
      purchaseReasons: ["Năng lực triển khai công nghệ", "Đội ngũ kỹ sư", "Kinh nghiệm dự án", "Chi phí cạnh tranh", "Uy tín thương hiệu"],
      demandDrivers: ["Chi tiêu công nghệ của doanh nghiệp", "Xu hướng chuyển đổi số", "Nhu cầu kết nối viễn thông", "Nhu cầu học tập kỹ năng"],
      analysisMeaning:
        "FPT không phụ thuộc vào một sản phẩm đơn lẻ, nhưng chất lượng nhân sự và nhu cầu công nghệ của khách hàng là biến số rất quan trọng.",
      commonMisread: "Tăng trưởng công nghệ không tự động đồng nghĩa tăng trưởng đều ở mọi mảng.",
    },
    moneyFlow: {
      title: "Tiền của FPT đi qua dịch vụ công nghệ, viễn thông và giáo dục.",
      flow: [
        { label: "Khách hàng doanh nghiệp", description: "Tìm giải pháp công nghệ, chuyển đổi số và triển khai dự án.", type: "source" },
        { label: "FPT triển khai dịch vụ", description: "Đội ngũ kỹ sư, quản lý dự án, nền tảng công nghệ.", type: "operation" },
        { label: "Dịch vụ / nền tảng / mạng lưới", description: "IT services, viễn thông, giáo dục.", type: "channel" },
        { label: "Khách hàng và học viên", description: "Doanh nghiệp, người dùng viễn thông, học viên.", type: "customer" },
        { label: "Doanh thu", description: "Tiền thu từ hợp đồng dịch vụ, thuê bao và học phí.", type: "revenue" },
        { label: "Chi phí vận hành", description: "Nhân sự kỹ sư, hạ tầng, R&D, bán hàng và quản lý.", type: "cost" },
        { label: "Lợi nhuận và dòng tiền", description: "Phụ thuộc tiến độ dự án và hiệu quả vận hành.", type: "profit" },
      ],
      mainRevenueSources: ["Dịch vụ công nghệ", "Viễn thông", "Giáo dục", "Hợp đồng quốc tế"],
      mainCostItems: ["Chi phí nhân sự kỹ sư", "R&D", "Hạ tầng viễn thông", "Chi phí bán hàng và quản lý"],
      analysisMeaning:
        "Với FPT, doanh thu và lợi nhuận phụ thuộc vào chất lượng nhân sự, backlog và khả năng giữ biên dịch vụ trong môi trường cạnh tranh.",
      commonMisread: "Nhiều hợp đồng chưa chắc đã tạo ra biên lợi nhuận cao nếu chi phí nhân sự tăng nhanh.",
    },
    competitivePosition: {
      title: "FPT có lợi thế ở nhân sự, hệ sinh thái và khách hàng quốc tế, nhưng áp lực chi phí cũng rõ.",
      strengths: [
        { label: "Nguồn nhân lực công nghệ", explanation: "Là nền tảng của năng lực triển khai dự án và tăng trưởng dài hạn." },
        { label: "Khách hàng quốc tế", explanation: "Giúp đa dạng hóa doanh thu và tiếp cận thị trường lớn hơn." },
        { label: "Backlog dự án", explanation: "Cho thấy mức độ công việc đã ký kết cần triển khai trong tương lai." },
        { label: "Hệ sinh thái công nghệ, viễn thông, giáo dục", explanation: "Tạo điểm tựa chéo giữa các mảng kinh doanh." },
      ],
      weaknesses: [
        { label: "Phụ thuộc chất lượng nhân sự", explanation: "Thiếu nhân lực tốt có thể làm giảm tốc độ và chất lượng triển khai." },
        { label: "Áp lực chi phí lương", explanation: "Lương kỹ sư tăng có thể kéo biên lợi nhuận xuống." },
        { label: "Cạnh tranh toàn cầu", explanation: "Dịch vụ IT có cạnh tranh mạnh về chi phí và chất lượng." },
        { label: "Rủi ro tỷ giá và nhu cầu quốc tế", explanation: "Mảng nước ngoài có thể biến động theo chu kỳ chi tiêu CNTT." },
      ],
      futureDirection: [
        { label: "Tăng tỷ trọng dịch vụ giá trị cao", explanation: "Nếu thành công, biên có thể tốt hơn dịch vụ đơn thuần." },
        { label: "Mở rộng quốc tế", explanation: "Tạo dư địa tăng trưởng nhưng đòi hỏi năng lực cạnh tranh cao." },
        { label: "Kết nối công nghệ với giáo dục", explanation: "Giúp nuôi dưỡng nguồn nhân lực và hệ sinh thái dài hạn." },
      ],
      analysisMeaning:
        "FPT cần được đọc như doanh nghiệp dịch vụ công nghệ, nơi tốc độ tăng trưởng phải đi cùng chất lượng nhân sự và hiệu quả giao dự án.",
      commonMisread: "Tăng doanh thu công nghệ chưa chắc đồng nghĩa biên lợi nhuận sẽ tự động mở rộng.",
    },
    businessConditions: {
      title: "Mô hình FPT tốt lên khi nhu cầu công nghệ và chất lượng nhân sự cùng cải thiện.",
      improvesWhen: [
        "Nhu cầu chuyển đổi số tăng",
        "Backlog dự án lớn hơn",
        "Biên dịch vụ ổn định",
        "Năng suất nhân sự cao",
        "Khách hàng quốc tế mở rộng",
      ],
      worsensWhen: [
        "Chi phí nhân sự tăng nhanh",
        "Cạnh tranh giá mạnh",
        "Nhu cầu CNTT toàn cầu yếu đi",
        "Dự án chậm tiến độ",
        "Biên dịch vụ co lại",
      ],
      keySignalsToWatch: ["Doanh thu dịch vụ công nghệ", "Biên lợi nhuận", "Backlog", "Chi phí nhân sự", "Dòng tiền kinh doanh"],
      analysisMeaning:
        "Với FPT, điều quan trọng là doanh thu công nghệ có đi cùng backlog, biên và chất lượng dòng tiền hay không.",
      commonMisread: "Mô hình tốt không thể chỉ nhìn vào tốc độ tăng doanh thu.",
    },
    nextFinancialChecks: {
      title: "Sang Báo cáo tài chính để kiểm chứng.",
      description: "Báo cáo tài chính sẽ kiểm tra xem tăng trưởng của FPT có đi cùng biên và dòng tiền hay không.",
      checks: [
        { label: "Doanh thu dịch vụ công nghệ", reason: "Kiểm tra động lực tăng trưởng cốt lõi." },
        { label: "Biên lợi nhuận", reason: "Kiểm tra hiệu quả triển khai và sức chịu chi phí." },
        { label: "Backlog", reason: "Kiểm tra mức độ công việc đã ký kết còn chờ ghi nhận." },
        { label: "Chi phí nhân sự", reason: "Kiểm tra áp lực lớn nhất lên biên." },
        { label: "Dòng tiền kinh doanh", reason: "Kiểm tra lợi nhuận có biến thành tiền thật không." },
      ],
    },
  },
  HPG: {
    ticker: "HPG",
    companyName: "CTCP Tập đoàn Hòa Phát",
    industry: "Thép",
    businessType: "Sản xuất thép và vật liệu liên quan",
    overview: {
      headline: "HPG là doanh nghiệp thép nhạy với chu kỳ hàng hóa và giá nguyên liệu.",
      shortDescription:
        "Doanh nghiệp sản xuất thép xây dựng, HRC, ống thép, tôn mạ và một số mảng liên quan.",
      keyTakeaway: "Điểm cần chú ý là giá thép, sản lượng, spread, tồn kho, nguyên liệu và chu kỳ hàng hóa.",
    },
    customerAndProduct: {
      title: "HPG cung cấp sản phẩm thép cho xây dựng, sản xuất và xuất khẩu.",
      products: ["Thép xây dựng", "HRC", "Ống thép", "Tôn mạ", "Nông nghiệp"],
      customers: ["Nhà thầu xây dựng", "Đại lý thép", "Doanh nghiệp sản xuất", "Thị trường xuất khẩu"],
      purchaseReasons: ["Quy mô sản xuất lớn", "Giá cạnh tranh", "Nguồn cung ổn định", "Thương hiệu trong ngành thép"],
      demandDrivers: ["Đầu tư xây dựng", "Thị trường bất động sản", "Nhu cầu công nghiệp", "Xuất khẩu thép", "Chu kỳ hàng hóa"],
      analysisMeaning:
        "HPG phụ thuộc nhiều vào chu kỳ thép và nhu cầu đầu tư. Khi thị trường xây dựng và sản xuất giảm tốc, nhu cầu thép có thể yếu đi nhanh.",
      commonMisread: "Sản lượng tăng chưa đủ để kết luận kết quả kinh doanh sẽ tốt nếu giá bán và nguyên liệu đi ngược chiều.",
    },
    moneyFlow: {
      title: "Tiền của HPG đi qua sản xuất thép quy mô lớn.",
      flow: [
        { label: "Quặng sắt, than coke", description: "Nguyên liệu đầu vào của dây chuyền thép.", type: "source" },
        { label: "HPG luyện và cán thép", description: "Quy trình sản xuất tích hợp quy mô lớn.", type: "operation" },
        { label: "Sản phẩm thép", description: "Thép xây dựng, HRC, ống thép, tôn mạ.", type: "channel" },
        { label: "Nhà thầu và doanh nghiệp", description: "Mua thép cho xây dựng, sản xuất hoặc xuất khẩu.", type: "customer" },
        { label: "Doanh thu", description: "Tiền thu từ bán thép và các sản phẩm liên quan.", type: "revenue" },
        { label: "Chi phí vận hành", description: "Nguyên liệu, điện, khấu hao, logistics, tồn kho.", type: "cost" },
        { label: "Lợi nhuận và dòng tiền", description: "Phụ thuộc spread giữa giá bán và giá nguyên liệu.", type: "profit" },
      ],
      mainRevenueSources: ["Thép xây dựng", "HRC", "Ống thép", "Tôn mạ"],
      mainCostItems: ["Quặng sắt", "Than coke", "Điện", "Khấu hao", "Logistics", "Tồn kho nguyên liệu"],
      analysisMeaning:
        "Mô hình thép là mô hình chu kỳ, nên spread, sản lượng và giá nguyên liệu quan trọng hơn chỉ nhìn tăng trưởng doanh thu.",
      commonMisread: "Doanh thu lớn không tự động đồng nghĩa lợi nhuận cao trong ngành thép.",
    },
    competitivePosition: {
      title: "HPG có lợi thế quy mô và chuỗi tích hợp, nhưng chu kỳ thép vẫn là biến số lớn.",
      strengths: [
        { label: "Quy mô sản xuất", explanation: "Giúp cạnh tranh giá và phân bổ chi phí cố định tốt hơn." },
        { label: "Chuỗi sản xuất tích hợp", explanation: "Kiểm soát tốt hơn từ nguyên liệu đến thành phẩm." },
        { label: "Thương hiệu thép lớn", explanation: "Tạo lợi thế trong thị trường nội địa và xuất khẩu." },
        { label: "Hưởng lợi khi chu kỳ phục hồi", explanation: "Khi giá thép và nhu cầu cùng tăng, lợi nhuận có thể bật mạnh." },
      ],
      weaknesses: [
        { label: "Nhạy với chu kỳ thép", explanation: "Kết quả kinh doanh có thể biến động mạnh theo thị trường." },
        { label: "Nhạy với giá nguyên liệu", explanation: "Quặng sắt và than coke ảnh hưởng lớn đến biên." },
        { label: "Vốn đầu tư lớn", explanation: "Cần CAPEX lớn để duy trì và mở rộng công suất." },
        { label: "Tồn kho biến động mạnh", explanation: "Giá hàng hóa thay đổi có thể làm tồn kho và lợi nhuận dao động." },
      ],
      futureDirection: [
        { label: "Tối ưu hiệu suất lò cao và HRC", explanation: "Nếu chạy ổn định sẽ hỗ trợ biên và sản lượng." },
        { label: "Tăng hiệu quả chuỗi xuất khẩu", explanation: "Giúp giảm phụ thuộc vào một thị trường đơn lẻ." },
        { label: "Cân bằng tồn kho nguyên liệu", explanation: "Quan trọng để giảm sốc biên khi giá hàng hóa biến động." },
      ],
      analysisMeaning:
        "HPG cần được đọc như doanh nghiệp chu kỳ, nơi biên và lợi nhuận thay đổi theo giá thép, nguyên liệu và sản lượng.",
      commonMisread: "Lợi nhuận của HPG có thể rất tốt ở pha thuận lợi nhưng cũng co lại nhanh khi chu kỳ đảo chiều.",
    },
    businessConditions: {
      title: "Mô hình HPG tốt lên khi giá thép và nhu cầu cùng thuận lợi.",
      improvesWhen: [
        "Giá thép tăng hoặc giữ vững",
        "Sản lượng bán ra cao",
        "Spread giữa giá bán và giá nguyên liệu mở rộng",
        "Tồn kho nguyên liệu được kiểm soát",
        "Chu kỳ hàng hóa thuận lợi",
      ],
      worsensWhen: [
        "Giá nguyên liệu tăng nhanh hơn giá bán",
        "Nhu cầu xây dựng yếu",
        "Tồn kho tăng",
        "Biên bị co",
        "Chu kỳ hàng hóa đi xuống",
      ],
      keySignalsToWatch: ["Sản lượng bán hàng", "Giá thép", "Biên lợi nhuận", "Tồn kho", "Nợ vay", "Chu kỳ hàng hóa"],
      analysisMeaning:
        "Với HPG, điều cần theo dõi là chu kỳ thép, nguyên liệu và tồn kho có đang ủng hộ hay đang bóp biên.",
      commonMisread: "Một quý tốt không có nghĩa chu kỳ đã sang pha mới bền vững.",
    },
    nextFinancialChecks: {
      title: "Sang Báo cáo tài chính để kiểm chứng.",
      description: "Báo cáo tài chính sẽ cho biết pha chu kỳ hiện tại có đang ủng hộ HPG hay không.",
      checks: [
        { label: "Sản lượng bán hàng", reason: "Kiểm tra lực cầu thực tế." },
        { label: "Giá thép và biên", reason: "Kiểm tra spread có đang mở rộng hay co lại." },
        { label: "Tồn kho", reason: "Kiểm tra rủi ro hàng hóa và áp lực vốn." },
        { label: "Nợ vay", reason: "Kiểm tra áp lực vốn khi đầu tư lớn." },
        { label: "Dòng tiền kinh doanh", reason: "Kiểm tra kết quả kế toán có biến thành tiền không." },
      ],
    },
  },
  VCB: {
    ticker: "VCB",
    companyName: "Ngân hàng TMCP Ngoại thương Việt Nam",
    industry: "Ngân hàng",
    businessType: "Ngân hàng thương mại",
    overview: {
      headline: "VCB là ngân hàng mạnh về chi phí vốn và chất lượng khách hàng.",
      shortDescription:
        "Doanh nghiệp cung cấp cho vay, huy động, thanh toán, dịch vụ ngân hàng và bancassurance.",
      keyTakeaway: "Điểm cần chú ý là NIM, CASA, nợ xấu, dự phòng, tăng trưởng tín dụng và chất lượng tài sản.",
    },
    customerAndProduct: {
      title: "VCB cung cấp dịch vụ ngân hàng cho cá nhân, doanh nghiệp và tổ chức.",
      products: ["Cho vay", "Huy động", "Thanh toán", "Dịch vụ ngân hàng", "Bancassurance"],
      customers: ["Cá nhân", "Doanh nghiệp", "Tổ chức", "Khách hàng xuất nhập khẩu"],
      purchaseReasons: ["Uy tín ngân hàng lớn", "Chi phí vốn thấp", "Mạng lưới rộng", "Chất lượng dịch vụ", "An toàn và độ tin cậy"],
      demandDrivers: ["Tăng trưởng tín dụng", "Nhu cầu thanh toán", "Nhu cầu vốn doanh nghiệp", "Biến động lãi suất", "Môi trường kinh tế"],
      analysisMeaning:
        "VCB không bán hàng theo nghĩa truyền thống mà kiếm tiền từ chênh lệch lãi và dịch vụ, nên chất lượng tài sản và chi phí vốn rất quan trọng.",
      commonMisread: "Tăng trưởng tín dụng chỉ là một phần, còn chất lượng tài sản mới quyết định độ bền.",
    },
    moneyFlow: {
      title: "Tiền của VCB đi qua huy động vốn, cho vay và dịch vụ ngân hàng.",
      flow: [
        { label: "Người gửi tiền", description: "Tạo nguồn vốn huy động cho ngân hàng.", type: "source" },
        { label: "VCB huy động và phân bổ vốn", description: "Quản lý CASA, tiền gửi và thanh khoản.", type: "operation" },
        { label: "Cho vay và dịch vụ", description: "Cho vay, thanh toán, bancassurance, ngoại hối.", type: "channel" },
        { label: "Khách hàng cá nhân và doanh nghiệp", description: "Dùng dịch vụ tài chính và vốn vay.", type: "customer" },
        { label: "Thu nhập lãi và phí", description: "Nguồn doanh thu chính của ngân hàng.", type: "revenue" },
        { label: "Chi phí vốn và dự phòng", description: "Chi phí huy động vốn và chi phí tín dụng.", type: "cost" },
        { label: "Lợi nhuận và vốn tự có", description: "Kết quả sau chi phí và dự phòng.", type: "profit" },
      ],
      mainRevenueSources: ["Thu nhập lãi", "Phí dịch vụ", "Thanh toán", "Bancassurance"],
      mainCostItems: ["Chi phí vốn huy động", "Dự phòng rủi ro tín dụng", "Chi phí hoạt động", "Công nghệ và mạng lưới"],
      analysisMeaning:
        "Với ngân hàng, điều quan trọng không phải hàng hóa bán ra mà là cấu trúc nguồn vốn, chất lượng tín dụng và khả năng kiểm soát chi phí.",
      commonMisread: "Lợi nhuận ngân hàng cao không đồng nghĩa rủi ro thấp nếu chất lượng tài sản xấu đi.",
    },
    competitivePosition: {
      title: "VCB có lợi thế về chi phí vốn và chất lượng khách hàng, nhưng vẫn chịu chu kỳ tín dụng và chính sách.",
      strengths: [
        { label: "Thương hiệu ngân hàng lớn", explanation: "Tạo niềm tin và khả năng thu hút khách hàng chất lượng." },
        { label: "CASA tốt", explanation: "Giúp chi phí vốn thấp và nâng hiệu quả sinh lời." },
        { label: "Tệp khách hàng chất lượng", explanation: "Hỗ trợ kiểm soát rủi ro tín dụng tốt hơn." },
        { label: "Quản trị rủi ro tín dụng tốt", explanation: "Quan trọng để giữ chất lượng tài sản qua các chu kỳ." },
      ],
      weaknesses: [
        { label: "Phụ thuộc chu kỳ tín dụng", explanation: "Khi tín dụng chậm lại, tăng trưởng lợi nhuận bị ảnh hưởng." },
        { label: "Rủi ro nợ xấu", explanation: "Tăng nợ xấu có thể buộc ngân hàng trích lập cao hơn." },
        { label: "Áp lực NIM", explanation: "Biên lãi có thể thay đổi khi lãi suất biến động." },
        { label: "Phụ thuộc chính sách tiền tệ", explanation: "Môi trường lãi suất và tín dụng ảnh hưởng trực tiếp." },
      ],
      futureDirection: [
        { label: "Tối ưu CASA và phí vốn", explanation: "Giúp duy trì lợi thế chi phí vốn thấp." },
        { label: "Tăng dịch vụ phí", explanation: "Giảm phụ thuộc hoàn toàn vào lãi cho vay." },
        { label: "Nâng chất lượng tài sản", explanation: "Giữ bền lợi nhuận qua chu kỳ." },
      ],
      analysisMeaning:
        "VCB nên được đọc như ngân hàng thiên về chất lượng, nơi CASA, NIM và nợ xấu là bộ ba quan trọng.",
      commonMisread: "Ngân hàng mạnh không có nghĩa là miễn nhiễm với chu kỳ kinh tế và tín dụng.",
    },
    businessConditions: {
      title: "Mô hình VCB tốt lên khi chi phí vốn thấp và chất lượng tín dụng ổn định.",
      improvesWhen: [
        "CASA cao",
        "NIM ổn định hoặc cải thiện",
        "Tăng trưởng tín dụng lành mạnh",
        "Nợ xấu được kiểm soát",
        "Dự phòng hợp lý",
      ],
      worsensWhen: [
        "Lãi suất biến động mạnh",
        "NIM bị ép",
        "Nợ xấu tăng",
        "Dự phòng tăng cao",
        "Tăng trưởng tín dụng chậm",
      ],
      keySignalsToWatch: ["NIM", "CASA", "Tăng trưởng tín dụng", "Nợ xấu", "Dự phòng", "CIR", "ROE"],
      analysisMeaning:
        "Với VCB, điều cần xem là nguồn vốn có rẻ, chất lượng tài sản có tốt và dự phòng có đang ăn vào lợi nhuận không.",
      commonMisread: "Lợi nhuận đẹp hôm nay không thay thế được rủi ro tín dụng đang tích tụ.",
    },
    nextFinancialChecks: {
      title: "Sang Báo cáo tài chính để kiểm chứng.",
      description: "Báo cáo tài chính sẽ cho biết chất lượng tín dụng và hiệu quả vốn của VCB có thực sự bền không.",
      checks: [
        { label: "NIM", reason: "Kiểm tra biên lãi cốt lõi." },
        { label: "CASA", reason: "Kiểm tra chi phí vốn và khả năng hút tiền gửi." },
        { label: "Tăng trưởng tín dụng", reason: "Kiểm tra động lực tăng trưởng cho vay." },
        { label: "Nợ xấu", reason: "Kiểm tra chất lượng tài sản." },
        { label: "Dự phòng", reason: "Kiểm tra mức độ an toàn của lợi nhuận." },
        { label: "CIR", reason: "Kiểm tra hiệu quả vận hành." },
        { label: "ROE", reason: "Kiểm tra khả năng sinh lời trên vốn." },
      ],
    },
  },
};

export const businessUnderstandingTickerOrder = ["MWG", "FPT", "HPG", "VCB"] as const;

export type BusinessUnderstandingTicker = (typeof businessUnderstandingTickerOrder)[number];

export function findBusinessUnderstandingProfile(ticker?: string | null) {
  const normalizedTicker = ticker?.trim().toUpperCase();
  if (normalizedTicker && normalizedTicker in businessUnderstandingByTicker) {
    return businessUnderstandingByTicker[normalizedTicker];
  }

  return undefined;
}

export function getBusinessUnderstandingProfile(ticker?: string | null) {
  return findBusinessUnderstandingProfile(ticker) ?? businessUnderstandingByTicker[businessUnderstandingTickerOrder[0]];
}
