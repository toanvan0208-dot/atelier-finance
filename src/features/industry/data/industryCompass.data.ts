import type { IndustryCompassData, IndustryCompassOption } from "../types";

const DATA_COMPLETION_WARNING =
  "Dữ liệu ngành đang được hoàn thiện. Phần này giúp hiểu bối cảnh, không biến thành quyết định đầu tư.";

const commonActions = [
  { label: "Kiểm tra ở Screening", targetModule: "screening", variant: "secondary" as const },
  { label: "Đọc BCTC doanh nghiệp", targetModule: "financials", variant: "secondary" as const },
  { label: "Lưu vào danh sách theo dõi", targetModule: "watchlist", variant: "secondary" as const },
  { label: "Quay lại Vĩ mô", targetModule: "macro", variant: "ghost" as const },
];

function buildSignals(
  leading: string[],
  confirming: string[],
  warning: string[]
): IndustryCompassOption["dataSignals"] {
  return {
    leading: leading.map((name) => ({
      name,
      sampleStatus: "Đang hoàn thiện",
      simpleRead: "Chỉ dùng như điểm cần kiểm tra tiếp cho bối cảnh ngành.",
      goodSignal: "Xu hướng cải thiện cần được xác nhận bằng dữ liệu doanh nghiệp.",
      badSignal: "Xấu đi nhanh hoặc trái với giả định ban đầu cần được kiểm tra lại.",
      frequency: "Tùy nguồn dữ liệu",
      relatedStep: "Đọc dữ liệu xác nhận",
    })),
    confirming: confirming.map((name) => ({
      name,
      sampleStatus: "Cần nguồn rà soát",
      simpleRead: "Cho biết bối cảnh ngành có đi vào doanh thu, biên lợi nhuận hoặc dòng tiền không.",
      goodSignal: "Cải thiện cùng lúc với chất lượng lợi nhuận và dòng tiền.",
      badSignal: "Doanh thu tăng nhưng biên, tồn kho hoặc dòng tiền xấu đi.",
      frequency: "Theo kỳ báo cáo",
      relatedStep: "Nối dữ liệu ngành sang BCTC",
    })),
    warning: warning.map((name) => ({
      name,
      sampleStatus: "Rủi ro cần kiểm tra",
      simpleRead: "Dùng để giảm mức tin cậy của bối cảnh nếu rủi ro xuất hiện.",
      goodSignal: "Rủi ro giảm dần hoặc được kiểm soát trong vài kỳ.",
      badSignal: "Tăng nhanh và làm sai giả định ban đầu.",
      frequency: "Theo kỳ báo cáo",
      relatedStep: "Kiểm tra rủi ro ngành",
    })),
  };
}

const industries: IndustryCompassOption[] = [
  {
    id: "information-technology-services",
    industryKey: "information_technology",
    name: "Công nghệ thông tin / Dịch vụ công nghệ",
    industryName: "Công nghệ thông tin / Dịch vụ công nghệ",
    shortName: "Công nghệ",
    description:
      "Ngành công nghệ thông tin cung cấp dịch vụ phần mềm, chuyển đổi số, hạ tầng công nghệ và các giải pháp số cho doanh nghiệp, tổ chức và người tiêu dùng.",
    shortDescription:
      "Cung cấp dịch vụ phần mềm, chuyển đổi số, hạ tầng công nghệ và giải pháp số.",
    industryType: "Ngành dịch vụ công nghệ, nhạy với chi tiêu CNTT, nhân lực và tỷ giá",
    statusLabel: "Dữ liệu nghiên cứu, đang hoàn thiện",
    statusTone: "watch",
    relatedTickers: ["FPT"],
    mainDrivers: [
      "Nhu cầu chuyển đổi số",
      "Chi tiêu công nghệ của doanh nghiệp",
      "Nhân lực công nghệ",
      "Đơn hàng từ thị trường trong và ngoài nước",
      "Tỷ giá nếu có doanh thu hoặc chi phí ngoại tệ",
    ],
    keyRisks: [
      "Cạnh tranh nhân lực",
      "Phụ thuộc khách hàng lớn hoặc thị trường xuất khẩu",
      "Biến động chi phí nhân sự",
      "Thay đổi nhu cầu công nghệ theo chu kỳ kinh tế",
    ],
    macroLinks: ["Chi tiêu doanh nghiệp", "Tỷ giá", "Nhu cầu thị trường xuất khẩu"],
    dataStatus: "partial",
    dataMode: "research_only",
    productionApproved: false,
    sourceName: null,
    sourceRef: null,
    sourceUrl: null,
    period: null,
    asOf: null,
    explanationForBeginner:
      "Hãy xem ngành này như nhóm doanh nghiệp bán năng lực công nghệ và dịch vụ triển khai, không phải một kết luận về cổ phiếu.",
    whatToCheckNext: [
      "Doanh thu theo mảng nếu có",
      "Biên lợi nhuận",
      "Tăng trưởng lợi nhuận",
      "Tỷ trọng doanh thu nước ngoài nếu có",
      "Rủi ro tỷ giá nếu có dữ liệu",
    ],
    warnings: [DATA_COMPLETION_WARNING],
    sensitivityTags: ["Chi tiêu CNTT", "Nhân lực", "Tỷ giá", "Thị trường xuất khẩu"],
    quickPicture: {
      summary:
        "Bối cảnh công nghệ cần đọc qua nhu cầu chuyển đổi số, đơn hàng, biên nhân sự và dòng tiền. Chưa có nguồn ngành định lượng được phê duyệt trong module này.",
      supports: [
        { title: "Nhu cầu chuyển đổi số", description: "Có thể tạo nhu cầu dịch vụ phần mềm và triển khai hệ thống." },
        { title: "Đơn hàng nước ngoài", description: "Cần kiểm tra tỷ trọng và biên lợi nhuận thay vì chỉ đọc câu chuyện tăng trưởng." },
        { title: "Dịch vụ lặp lại", description: "Doanh thu định kỳ nếu có sẽ giúp chất lượng dòng tiền dễ theo dõi hơn." },
      ],
      pressures: [
        { title: "Chi phí nhân sự", description: "Lương kỹ sư và cạnh tranh nhân lực có thể ép biên lợi nhuận." },
        { title: "Chu kỳ chi tiêu CNTT", description: "Khách hàng có thể hoãn dự án khi môi trường kinh doanh yếu." },
        { title: "Tỷ giá và hợp đồng", description: "Doanh thu/chi phí ngoại tệ cần được đọc cùng cấu trúc hợp đồng." },
      ],
      firstData: ["Doanh thu theo mảng", "Biên lợi nhuận", "Backlog nếu có", "Dòng tiền", "Tỷ trọng nước ngoài"],
      nextStep: "Kiểm tra FPT ở BCTC và doanh thu theo mảng trước khi dùng bối cảnh ngành cho bước sau.",
    },
    moneyMap: {
      sells: "Dịch vụ phần mềm, chuyển đổi số, hạ tầng công nghệ, vận hành hệ thống và giải pháp số.",
      customers: "Doanh nghiệp trong nước, khách hàng quốc tế, tổ chức và người dùng cuối.",
      revenueSource: "Hợp đồng dự án, thuê bao dịch vụ, vận hành hệ thống và sản phẩm số.",
      pricingPower: "Phụ thuộc năng lực kỹ thuật, quan hệ khách hàng, độ khó dự án và nguồn nhân lực.",
      biggestCosts: "Nhân sự kỹ thuật, hạ tầng, bán hàng, R&D và chi phí triển khai.",
      marginDependsOn: "Năng suất nhân sự, giá hợp đồng, tự động hóa và tỷ trọng dịch vụ có biên tốt.",
      cashPoint: "Tiền thường nằm ở hợp đồng lặp lại, khách hàng bền và khả năng thu tiền đúng hạn.",
      winnersWhenGood: "Doanh nghiệp có hợp đồng rõ, biên kiểm soát được và dòng tiền lành mạnh cần được kiểm tra tiếp.",
      pressureWhenBad: "Doanh nghiệp tăng doanh thu bằng dự án biên thấp hoặc phải thu tăng nhanh cần được rà soát kỹ.",
      valueChain: [
        { title: "Bán giải pháp", role: "Ký hợp đồng", whoEarns: "Doanh nghiệp có quan hệ khách hàng", risk: "Chu kỳ bán dài", metric: "Hợp đồng ký mới" },
        { title: "Triển khai", role: "Dùng đội ngũ kỹ sư", whoEarns: "Đội ngũ năng suất cao", risk: "Thiếu nhân sự", metric: "Biên dự án" },
        { title: "Vận hành", role: "Dịch vụ lặp lại", whoEarns: "Nhà cung cấp giữ chân khách", risk: "Khách hủy dịch vụ", metric: "Doanh thu định kỳ" },
        { title: "Thu tiền", role: "Quản trị công nợ", whoEarns: "Doanh nghiệp thu tiền tốt", risk: "Phải thu tăng", metric: "Dòng tiền hoạt động" },
      ],
    },
    macroDrivers: [
      { factor: "Chi tiêu CNTT", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Ngân sách số hóa ảnh hưởng đến hợp đồng và backlog.", chain: ["Ngân sách thay đổi", "Hợp đồng mới thay đổi", "Doanh thu/biên thay đổi", "Kiểm tra BCTC"], checkNext: "Backlog và doanh thu theo mảng có được công bố rõ không?", tone: "watch" },
      { factor: "Tỷ giá", direction: "Trái chiều", strength: "Chưa rõ", mechanism: "Doanh thu ngoại tệ và chi phí quốc tế có thể đi ngược chiều nhau.", chain: ["Tỷ giá thay đổi", "Doanh thu quy đổi thay đổi", "Chi phí thay đổi", "Kiểm tra biên"], checkNext: "Tỷ trọng doanh thu nước ngoài và chi phí ngoại tệ là bao nhiêu?", tone: "mixed" },
      { factor: "Thị trường lao động", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Thiếu nhân sự hoặc lương tăng có thể làm biên giảm.", chain: ["Lương kỹ sư tăng", "Chi phí dự án tăng", "Biên giảm", "Kiểm tra năng suất"], checkNext: "Doanh nghiệp có giữ biên khi tuyển thêm không?", tone: "watch" },
    ],
    dataSignals: buildSignals(
      ["Hợp đồng ký mới", "Backlog", "Tỷ giá", "Nhu cầu chuyển đổi số"],
      ["Doanh thu dịch vụ", "Biên lợi nhuận", "Dòng tiền", "Doanh thu định kỳ"],
      ["Biên giảm", "Phải thu tăng", "Dự án bị hoãn", "Chi phí nhân sự tăng"]
    ),
    companyGroups: [
      { title: "Mã liên quan trong hệ thống", description: "Mã được dùng để nối bối cảnh ngành sang bước doanh nghiệp và BCTC.", tickers: ["FPT"], role: "Dịch vụ công nghệ / chuyển đổi số", why: "FPT là ticker liên quan trực tiếp trong phạm vi MVP này.", checks: ["Doanh thu theo mảng", "Biên", "Dòng tiền", "Tỷ trọng nước ngoài"], tone: "watch" },
    ],
    conclusion: {
      blocks: [
        { title: "Bối cảnh hiện tại", content: "Bối cảnh nghiên cứu đang hoàn thiện, chưa có nguồn ngành định lượng được phê duyệt." },
        { title: "Điểm cần hiểu", content: "Ngành phụ thuộc nhu cầu chuyển đổi số, nhân lực, hợp đồng và biên dịch vụ." },
        { title: "Dữ liệu còn thiếu", content: "Thiếu nguồn ngành, kỳ dữ liệu và asOf để chuyển trạng thái thành available." },
        { title: "Mã cần kiểm tra", content: "FPT là mã liên quan trong phạm vi hệ thống hiện tại." },
        { title: "Điều kiện đổi góc nhìn", content: "Nếu doanh thu theo mảng, biên và dòng tiền không xác nhận bối cảnh, cần hạ mức tin cậy." },
      ],
      warning: DATA_COMPLETION_WARNING,
      actions: commonActions,
    },
  },
  {
    id: "retail",
    industryKey: "retail",
    name: "Bán lẻ",
    industryName: "Bán lẻ",
    shortName: "Bán lẻ",
    description:
      "Ngành bán lẻ phân phối hàng hóa đến người tiêu dùng cuối, chịu ảnh hưởng bởi sức mua, thu nhập, lạm phát, chi phí mặt bằng và hiệu quả vận hành.",
    shortDescription:
      "Phân phối hàng hóa đến người tiêu dùng cuối, nhạy với sức mua và vận hành cửa hàng.",
    industryType: "Ngành tiêu dùng, nhạy với sức mua, tồn kho và chi phí vận hành",
    statusLabel: "Dữ liệu nghiên cứu, đang hoàn thiện",
    statusTone: "watch",
    relatedTickers: ["MWG"],
    mainDrivers: ["Sức mua người tiêu dùng", "Lạm phát và thu nhập khả dụng", "Mở rộng cửa hàng", "Quản trị hàng tồn kho", "Chi phí thuê mặt bằng và vận hành"],
    keyRisks: ["Sức mua yếu", "Cạnh tranh giá", "Tồn kho cao", "Biên lợi nhuận bị thu hẹp", "Chi phí tài chính nếu dùng nợ vay"],
    macroLinks: ["CPI", "Thu nhập khả dụng", "Lãi suất tiêu dùng", "Sức mua hộ gia đình"],
    dataStatus: "partial",
    dataMode: "research_only",
    productionApproved: false,
    sourceName: null,
    sourceRef: null,
    sourceUrl: null,
    period: null,
    asOf: null,
    explanationForBeginner:
      "Bán lẻ kiếm tiền từ lưu lượng khách, giá trị đơn hàng, biên gộp và hiệu quả vận hành.",
    whatToCheckNext: ["Doanh thu cùng cửa hàng nếu có", "Biên lợi nhuận gộp", "Hàng tồn kho", "Nợ vay và chi phí tài chính", "Dòng tiền hoạt động"],
    warnings: [DATA_COMPLETION_WARNING],
    sensitivityTags: ["Sức mua", "Lạm phát", "Tồn kho", "Chi phí vận hành"],
    quickPicture: {
      summary:
        "Bối cảnh bán lẻ cần đọc qua sức mua, tồn kho, biên gộp và chi phí vận hành. Chưa có nguồn ngành định lượng được phê duyệt trong module này.",
      supports: [
        { title: "Sức mua cải thiện", description: "Có thể hỗ trợ lưu lượng khách và giá trị đơn hàng nếu được xác nhận." },
        { title: "Quản trị tồn kho", description: "Tồn kho hợp lý giúp giảm rủi ro giảm giá bán." },
        { title: "Hiệu quả cửa hàng", description: "Mỗi điểm bán tạo doanh thu và dòng tiền tốt hơn sẽ đáng kiểm tra tiếp." },
      ],
      pressures: [
        { title: "Sức mua yếu", description: "Người tiêu dùng trì hoãn mua sắm làm doanh thu và biên chịu áp lực." },
        { title: "Cạnh tranh giá", description: "Giảm giá kéo dài có thể làm biên lợi nhuận bị thu hẹp." },
        { title: "Chi phí vận hành", description: "Mặt bằng, nhân sự và logistics tăng làm hiệu quả cửa hàng giảm." },
      ],
      firstData: ["Doanh thu cùng cửa hàng", "Biên gộp", "Tồn kho", "Chi phí bán hàng", "Dòng tiền"],
      nextStep: "Kiểm tra MWG ở BCTC, đặc biệt là biên gộp, tồn kho và dòng tiền hoạt động.",
    },
    moneyMap: {
      sells: "Hàng điện máy, điện thoại, hàng tiêu dùng hoặc sản phẩm bán trực tiếp cho người tiêu dùng.",
      customers: "Hộ gia đình và người tiêu dùng cuối.",
      revenueSource: "Lưu lượng khách, giá trị đơn hàng, số cửa hàng và kênh online/offline.",
      pricingPower: "Phụ thuộc thương hiệu bán lẻ, danh mục hàng, nhà cung cấp và mức cạnh tranh giá.",
      biggestCosts: "Giá vốn hàng bán, mặt bằng, nhân sự, logistics, marketing và chi phí tài chính.",
      marginDependsOn: "Biên gộp, vòng quay tồn kho, chi phí vận hành và tỷ trọng hàng có biên tốt.",
      cashPoint: "Tiền nằm ở quay vòng hàng tồn kho nhanh và thu tiền khách trước khi trả nhà cung cấp.",
      winnersWhenGood: "Doanh nghiệp có vận hành chặt, tồn kho khỏe và dòng tiền tốt cần được kiểm tra tiếp.",
      pressureWhenBad: "Doanh nghiệp tồn kho cao, giảm giá nhiều hoặc mở rộng cửa hàng kém hiệu quả cần được rà soát.",
      valueChain: [
        { title: "Mua hàng", role: "Đàm phán nhà cung cấp", whoEarns: "Nhà bán lẻ có quy mô", risk: "Hàng nhập sai nhu cầu", metric: "Tồn kho" },
        { title: "Bán hàng", role: "Cửa hàng và online", whoEarns: "Điểm bán hiệu quả", risk: "Lưu lượng khách yếu", metric: "Doanh thu cùng cửa hàng" },
        { title: "Vận hành", role: "Quản lý mặt bằng và nhân sự", whoEarns: "Mạng lưới tối ưu", risk: "Chi phí cố định cao", metric: "Chi phí bán hàng" },
        { title: "Thu tiền", role: "Quay vòng vốn lưu động", whoEarns: "Doanh nghiệp quay vòng nhanh", risk: "Tồn kho chậm", metric: "Dòng tiền hoạt động" },
      ],
    },
    macroDrivers: [
      { factor: "Sức mua hộ gia đình", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Thu nhập và niềm tin tiêu dùng ảnh hưởng trực tiếp đến doanh thu bán lẻ.", chain: ["Sức mua thay đổi", "Lưu lượng khách thay đổi", "Doanh thu thay đổi", "Kiểm tra biên"], checkNext: "Doanh thu cùng cửa hàng có cải thiện không?", tone: "watch" },
      { factor: "Lạm phát", direction: "Trái chiều", strength: "Chưa rõ", mechanism: "Lạm phát làm chi phí và giá bán thay đổi, ảnh hưởng thu nhập khả dụng.", chain: ["CPI thay đổi", "Sức mua thay đổi", "Biên thay đổi", "Kiểm tra tồn kho"], checkNext: "Doanh nghiệp có giữ được biên khi cạnh tranh giá không?", tone: "mixed" },
      { factor: "Lãi suất", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Lãi suất ảnh hưởng mua trả góp, chi phí tài chính và hàng hóa giá trị cao.", chain: ["Lãi suất thay đổi", "Cầu mua hàng thay đổi", "Chi phí tài chính thay đổi", "Kiểm tra dòng tiền"], checkNext: "Nợ vay và chi phí tài chính có làm dòng tiền yếu đi không?", tone: "watch" },
    ],
    dataSignals: buildSignals(
      ["Sức mua người tiêu dùng", "Lưu lượng cửa hàng", "Giá bán", "Khuyến mại"],
      ["Doanh thu cùng cửa hàng", "Biên gộp", "Tồn kho", "Dòng tiền"],
      ["Tồn kho tăng", "Biên giảm", "Chi phí tài chính tăng", "Mở rộng kém hiệu quả"]
    ),
    companyGroups: [
      { title: "Mã liên quan trong hệ thống", description: "Mã được dùng để nối bối cảnh ngành sang bước doanh nghiệp và BCTC.", tickers: ["MWG"], role: "Bán lẻ hàng tiêu dùng/điện máy", why: "MWG là ticker liên quan trực tiếp trong phạm vi MVP này.", checks: ["Doanh thu cùng cửa hàng", "Biên gộp", "Tồn kho", "Dòng tiền"], tone: "watch" },
    ],
    conclusion: {
      blocks: [
        { title: "Bối cảnh hiện tại", content: "Bối cảnh nghiên cứu đang hoàn thiện, chưa có nguồn ngành định lượng được phê duyệt." },
        { title: "Điểm cần hiểu", content: "Ngành phụ thuộc sức mua, tồn kho, biên gộp và hiệu quả cửa hàng." },
        { title: "Dữ liệu còn thiếu", content: "Thiếu nguồn ngành, kỳ dữ liệu và asOf để chuyển trạng thái thành available." },
        { title: "Mã cần kiểm tra", content: "MWG là mã liên quan trong phạm vi hệ thống hiện tại." },
        { title: "Điều kiện đổi góc nhìn", content: "Nếu tồn kho tăng, biên giảm và dòng tiền yếu, cần hạ mức tin cậy của bối cảnh." },
      ],
      warning: DATA_COMPLETION_WARNING,
      actions: commonActions,
    },
  },
  {
    id: "dairy-consumer-staples",
    industryKey: "dairy_consumer_staples",
    name: "Sữa / hàng tiêu dùng thiết yếu",
    industryName: "Sữa / hàng tiêu dùng thiết yếu",
    shortName: "Sữa & thiết yếu",
    description:
      "Ngành sữa và hàng tiêu dùng thiết yếu cung cấp sản phẩm phục vụ nhu cầu tiêu dùng thường xuyên, chịu ảnh hưởng bởi sức mua, giá nguyên liệu, kênh phân phối và khả năng giữ biên lợi nhuận.",
    shortDescription:
      "Cung cấp sản phẩm tiêu dùng thường xuyên, nhạy với sức mua, nguyên liệu và phân phối.",
    industryType: "Ngành tiêu dùng thiết yếu, nhạy với nguyên liệu, thương hiệu và kênh phân phối",
    statusLabel: "Dữ liệu nghiên cứu, đang hoàn thiện",
    statusTone: "watch",
    relatedTickers: ["VNM"],
    mainDrivers: ["Sức mua hộ gia đình", "Giá nguyên liệu đầu vào", "Hệ thống phân phối", "Thương hiệu và thị phần", "Khả năng điều chỉnh giá bán"],
    keyRisks: ["Giá nguyên liệu biến động", "Cạnh tranh thương hiệu", "Tăng trưởng tiêu thụ chậm", "Biên lợi nhuận giảm", "Tỷ giá nếu nhập khẩu nguyên liệu"],
    macroLinks: ["Sức mua hộ gia đình", "CPI", "Tỷ giá", "Giá nguyên liệu"],
    dataStatus: "partial",
    dataMode: "research_only",
    productionApproved: false,
    sourceName: null,
    sourceRef: null,
    sourceUrl: null,
    period: null,
    asOf: null,
    explanationForBeginner:
      "Ngành này thường được đọc qua nhu cầu tiêu dùng lặp lại, thương hiệu, biên gộp và chi phí nguyên liệu.",
    whatToCheckNext: ["Doanh thu", "Biên lợi nhuận gộp", "Chi phí bán hàng", "Lợi nhuận sau thuế", "Dòng tiền", "Nợ vay nếu có"],
    warnings: [DATA_COMPLETION_WARNING],
    sensitivityTags: ["Sức mua", "Nguyên liệu", "Phân phối", "Tỷ giá"],
    quickPicture: {
      summary:
        "Bối cảnh sữa/hàng thiết yếu cần đọc qua sức mua, giá nguyên liệu, thương hiệu, kênh phân phối và biên lợi nhuận. Chưa có nguồn ngành định lượng được phê duyệt trong module này.",
      supports: [
        { title: "Nhu cầu lặp lại", description: "Sản phẩm thiết yếu có nhu cầu thường xuyên, nhưng vẫn cần kiểm tra sản lượng và doanh thu." },
        { title: "Thương hiệu và phân phối", description: "Thương hiệu mạnh và kênh phân phối rộng có thể hỗ trợ khả năng giữ khách." },
        { title: "Kiểm soát nguyên liệu", description: "Chi phí đầu vào ổn định giúp biên dễ theo dõi hơn." },
      ],
      pressures: [
        { title: "Giá nguyên liệu", description: "Sữa bột, đường, bao bì hoặc logistics tăng có thể làm biên gộp giảm." },
        { title: "Cạnh tranh thương hiệu", description: "Chi phí bán hàng và khuyến mại có thể tăng để giữ thị phần." },
        { title: "Tăng trưởng tiêu thụ chậm", description: "Nhu cầu bão hòa hoặc sức mua yếu cần được xác nhận bằng doanh thu." },
      ],
      firstData: ["Doanh thu", "Biên gộp", "Chi phí bán hàng", "Dòng tiền", "Nợ vay"],
      nextStep: "Kiểm tra VNM ở BCTC, đặc biệt là doanh thu, biên gộp, chi phí bán hàng và dòng tiền.",
    },
    moneyMap: {
      sells: "Sữa, sản phẩm dinh dưỡng và hàng tiêu dùng thiết yếu.",
      customers: "Hộ gia đình, kênh bán lẻ, đại lý và nhà phân phối.",
      revenueSource: "Sản lượng bán ra, giá bán, độ phủ phân phối và danh mục sản phẩm.",
      pricingPower: "Phụ thuộc thương hiệu, thị phần, độ thiết yếu của sản phẩm và cạnh tranh giá.",
      biggestCosts: "Nguyên liệu sữa, đường, bao bì, logistics, marketing và chi phí phân phối.",
      marginDependsOn: "Giá nguyên liệu, cơ cấu sản phẩm, khả năng điều chỉnh giá và chi phí bán hàng.",
      cashPoint: "Tiền nằm ở tốc độ bán hàng, thu tiền từ kênh phân phối và kiểm soát tồn kho.",
      winnersWhenGood: "Doanh nghiệp có thương hiệu, phân phối rộng và biên ổn định cần được kiểm tra tiếp.",
      pressureWhenBad: "Doanh nghiệp mất thị phần, chi phí bán hàng tăng hoặc nguyên liệu biến động cần được rà soát.",
      valueChain: [
        { title: "Đầu vào", role: "Nguyên liệu và bao bì", whoEarns: "Doanh nghiệp mua tốt", risk: "Giá nguyên liệu tăng", metric: "Biên gộp" },
        { title: "Sản xuất", role: "Chế biến sản phẩm", whoEarns: "Nhà máy hiệu quả", risk: "Công suất thấp", metric: "Giá vốn" },
        { title: "Phân phối", role: "Đại lý, bán lẻ, kênh hiện đại", whoEarns: "Mạng lưới phủ rộng", risk: "Chi phí bán hàng tăng", metric: "Chi phí bán hàng" },
        { title: "Thu tiền", role: "Quản trị công nợ và tồn kho", whoEarns: "Doanh nghiệp thu tiền tốt", risk: "Tồn kho hoặc phải thu tăng", metric: "Dòng tiền" },
      ],
    },
    macroDrivers: [
      { factor: "Sức mua hộ gia đình", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Sức mua ảnh hưởng sản lượng và cơ cấu sản phẩm.", chain: ["Thu nhập thay đổi", "Cầu tiêu dùng thay đổi", "Doanh thu thay đổi", "Kiểm tra biên"], checkNext: "Doanh thu và sản lượng có cải thiện cùng lúc không?", tone: "watch" },
      { factor: "Giá nguyên liệu", direction: "Trái chiều", strength: "Chưa rõ", mechanism: "Nguyên liệu tăng có thể ép biên nếu giá bán không điều chỉnh kịp.", chain: ["Nguyên liệu thay đổi", "Giá vốn thay đổi", "Biên gộp thay đổi", "Kiểm tra BCTC"], checkNext: "Biên gộp có giữ được khi nguyên liệu biến động không?", tone: "mixed" },
      { factor: "Tỷ giá", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Nếu nhập khẩu nguyên liệu, tỷ giá có thể làm chi phí đầu vào thay đổi.", chain: ["Tỷ giá thay đổi", "Chi phí nhập khẩu thay đổi", "Biên thay đổi", "Kiểm tra nguồn nguyên liệu"], checkNext: "Tỷ trọng nguyên liệu nhập khẩu và phòng ngừa tỷ giá là gì?", tone: "watch" },
    ],
    dataSignals: buildSignals(
      ["Sức mua hộ gia đình", "Giá nguyên liệu", "Tỷ giá", "Độ phủ phân phối"],
      ["Doanh thu", "Biên gộp", "Chi phí bán hàng", "Dòng tiền"],
      ["Biên giảm", "Chi phí bán hàng tăng", "Tăng trưởng tiêu thụ chậm", "Tỷ giá gây áp lực"]
    ),
    companyGroups: [
      { title: "Mã liên quan trong hệ thống", description: "Mã được dùng để nối bối cảnh ngành sang bước doanh nghiệp và BCTC.", tickers: ["VNM"], role: "Sữa / hàng tiêu dùng thiết yếu", why: "VNM là ticker liên quan trực tiếp trong phạm vi MVP này.", checks: ["Doanh thu", "Biên gộp", "Chi phí bán hàng", "Dòng tiền"], tone: "watch" },
    ],
    conclusion: {
      blocks: [
        { title: "Bối cảnh hiện tại", content: "Bối cảnh nghiên cứu đang hoàn thiện, chưa có nguồn ngành định lượng được phê duyệt." },
        { title: "Điểm cần hiểu", content: "Ngành phụ thuộc sức mua, nguyên liệu, thương hiệu, phân phối và khả năng giữ biên." },
        { title: "Dữ liệu còn thiếu", content: "Thiếu nguồn ngành, kỳ dữ liệu và asOf để chuyển trạng thái thành available." },
        { title: "Mã cần kiểm tra", content: "VNM là mã liên quan trong phạm vi hệ thống hiện tại." },
        { title: "Điều kiện đổi góc nhìn", content: "Nếu biên gộp giảm, chi phí bán hàng tăng hoặc dòng tiền yếu, cần hạ mức tin cậy." },
      ],
      warning: DATA_COMPLETION_WARNING,
      actions: commonActions,
    },
  },
];

const steelMaterialsCompassOption: IndustryCompassOption = {
  id: "steel-materials",
  industryKey: "steel_materials",
  name: "Thep / vat lieu xay dung",
  industryName: "Thep / vat lieu xay dung",
  shortName: "Thep - vat lieu",
  description:
    "Ngành thép và vật liệu xây dựng cần đọc cùng nhu cầu hạ tầng, sản lượng tiêu thụ, giá nguyên liệu, biên lợi nhuận và tồn kho.",
  shortDescription:
    "Boi canh thep va vat lieu xay dung, gan voi chu ky xay dung, dau tu cong, gia nguyen lieu va san luong tieu thu.",
  industryType: "Thép và vật liệu xây dựng",
  statusLabel: "Dữ liệu nghiên cứu, cần rà soát",
  statusTone: "watch",
  relatedTickers: ["HPG"],
  mainDrivers: [
    "Nhu cau xay dung va ha tang",
    "Dau tu cong va bat dong san",
    "Gia quang sat, than luyen coc va phe lieu",
    "San luong tieu thu thep",
    "Chenh lech gia ban va chi phi dau vao",
  ],
  keyRisks: [
    "Chu ky nhu cau yeu",
    "Bien dong gia nguyen lieu",
    "Ton kho va gia ban giam",
    "Canh tranh nhap khau hoac du cung",
    "No vay va von luu dong neu chu ky xau",
  ],
  macroLinks: ["Dau tu cong", "Tin dung", "Bat dong san", "Gia hang hoa", "Ty gia"],
  dataStatus: "partial",
  dataMode: "research_only",
  productionApproved: false,
  sourceName: null,
  sourceRef: null,
  sourceUrl: null,
  period: null,
  asOf: null,
  explanationForBeginner:
    "Hay xem nganh thep nhu mot nganh chu ky: nhu cau, gia ban, chi phi nguyen lieu va ton kho co the thay doi nhanh. Taxonomy va peer group la boi canh, khong phai chuan dinh gia hay rui ro.",
  whatToCheckNext: [
    "San luong ban hang",
    "Gia ban binh quan neu co",
    "Bien loi nhuan gop",
    "Ton kho",
    "Dong tien va no vay",
  ],
  warnings: [
    DATA_COMPLETION_WARNING,
    "Hướng dẫn ngành hiện là nội dung tĩnh. Phân loại ngành đã rà soát chỉ giới hạn ở HPG -> STEEL_MATERIALS; nhóm cùng ngành chỉ dùng cho nghiên cứu và cần rà soát.",
  ],
  sensitivityTags: ["Dau tu cong", "Xay dung", "Gia nguyen lieu", "Ton kho"],
  quickPicture: {
    summary:
      "Bối cảnh thép cần đọc qua nhu cầu xây dựng/hạ tầng, sản lượng tiêu thụ, giá nguyên liệu, biên gộp và tồn kho. Đây là hướng dẫn tĩnh; phân loại ngành và nhóm cùng ngành vẫn chỉ dùng cho nghiên cứu, cần rà soát.",
    supports: [
      { title: "Nhu cau ha tang", description: "Dau tu cong hoac xay dung phuc hoi co the lien quan den nhu cau thep, nhung can kiem tra bang san luong va doanh thu." },
      { title: "Bien gop cai thien", description: "Chi co y nghia khi gia ban, chi phi nguyen lieu va ton kho cung duoc kiem tra." },
      { title: "Dong tien van hanh", description: "Nganh chu ky can nhin dong tien de tranh chi doc cau chuyen doanh thu." },
    ],
    pressures: [
      { title: "Gia nguyen lieu", description: "Quang sat, than hoac phe lieu bien dong co the lam bien thay doi." },
      { title: "Ton kho cao", description: "Neu gia ban giam trong luc ton kho cao, chat luong loi nhuan can ra soat ky." },
      { title: "Du cung hoac nhap khau", description: "Canh tranh nguon cung co the tao ap luc len gia ban va cong suat." },
    ],
    firstData: ["San luong", "Bien gop", "Ton kho", "Dong tien", "No vay"],
    nextStep: "Kiểm tra HPG ở BCTC và đọc nhóm HSG/NKG/TVN như bối cảnh phân loại ngành, không dùng làm chuẩn định giá/rủi ro.",
  },
  moneyMap: {
    sells: "Thep xay dung, thep cuon, ong thep, ton ma hoac san pham vat lieu lien quan tuy doanh nghiep.",
    customers: "Nha thau, nha phan phoi, du an ha tang, xay dung dan dung va khach hang cong nghiep.",
    revenueSource: "San luong tieu thu, gia ban binh quan, co cau san pham va kenh phan phoi.",
    pricingPower: "Phu thuoc chu ky cung cau, chat luong san pham, quy mo, chi phi dau vao va canh tranh nhap khau.",
    biggestCosts: "Quang sat, than luyen coc, phe lieu, dien, logistics, khau hao va von luu dong.",
    marginDependsOn: "Chenh lech giua gia ban va chi phi nguyen lieu, cong suat nha may, co cau san pham va quan tri ton kho.",
    cashPoint: "Tien nam o toc do ban hang, vong quay ton kho, cong no va nhu cau von luu dong.",
    winnersWhenGood: "Doanh nghiep co chi phi canh tranh, san luong on dinh va dong tien duoc xac nhan can duoc kiem tra tiep bang du lieu.",
    pressureWhenBad: "Doanh nghiep ton kho cao, gia ban giam hoac no vay tang can duoc ra soat ky truoc khi chuyen module.",
    valueChain: [
      { title: "Nguyen lieu", role: "Quang, than, phe lieu", whoEarns: "Doanh nghiep kiem soat chi phi tot", risk: "Gia dau vao bien dong", metric: "Bien gop" },
      { title: "San xuat", role: "Luyen va can thep", whoEarns: "Nha may van hanh hieu qua", risk: "Cong suat thap", metric: "San luong" },
      { title: "Phan phoi", role: "Ban qua dai ly/du an", whoEarns: "Mang luoi ban hang tot", risk: "Cau yeu", metric: "Doanh thu" },
      { title: "Thu tien", role: "Quan tri cong no/ton kho", whoEarns: "Doanh nghiep quay vong von nhanh", risk: "Ton kho va phai thu tang", metric: "Dong tien" },
    ],
  },
  macroDrivers: [
    { factor: "Dau tu cong", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Ha tang co the lien quan den nhu cau thep nhung can xac nhan bang san luong va don hang.", chain: ["Ke hoach von thay doi", "Nhu cau vat lieu thay doi", "San luong/doanh thu thay doi", "Kiem tra BCTC"], checkNext: "San luong va doanh thu co di cung nhau khong?", tone: "watch" },
    { factor: "Bat dong san", direction: "Cần theo dõi", strength: "Chưa rõ", mechanism: "Xay dung dan dung anh huong den thep xay dung theo chu ky.", chain: ["Du an trien khai", "Cau thep thay doi", "Gia ban/ton kho thay doi", "Kiem tra bien"], checkNext: "Ton kho va gia ban co dang gay ap luc khong?", tone: "mixed" },
    { factor: "Gia nguyen lieu", direction: "Trái chiều", strength: "Chưa rõ", mechanism: "Nguyen lieu tang nhanh co the ep bien neu gia ban khong dieu chinh kip.", chain: ["Gia dau vao thay doi", "Gia von thay doi", "Bien gop thay doi", "Kiem tra dong tien"], checkNext: "Bien gop co giu duoc khi chi phi dau vao bien dong khong?", tone: "mixed" },
  ],
  dataSignals: buildSignals(
    ["Dau tu cong", "San luong tieu thu", "Gia nguyen lieu", "Gia ban"],
    ["Doanh thu", "Bien gop", "Ton kho", "Dong tien"],
    ["Ton kho tang", "Bien giam", "No vay tang", "Dong tien yeu"]
  ),
  companyGroups: [
    {
      title: "Ma lien quan trong he thong",
      description: "Ma duoc dung de noi boi canh nganh sang buoc doanh nghiep va BCTC.",
      tickers: ["HPG"],
      role: "Thep / vat lieu xay dung",
      why: "HPG là mã đại diện để bắt đầu đọc bối cảnh ngành thép và vật liệu xây dựng.",
      checks: ["San luong", "Bien gop", "Ton kho", "Dong tien"],
      tone: "watch",
    },
  ],
  conclusion: {
    blocks: [
      { title: "Bối cảnh hiện tại", content: "Phần đã rà soát hiện có phân loại HPG -> STEEL_MATERIALS và nhóm cùng ngành HSG/NKG/TVN ở phạm vi nghiên cứu." },
      { title: "Diem can hieu", content: "Nganh thep la nganh chu ky; can doc nhu cau, gia nguyen lieu, ton kho, bien va dong tien cung nhau." },
      { title: "Dữ liệu còn thiếu", content: "Chưa có chỉ số ngành định lượng hoặc chuẩn so sánh định giá/rủi ro." },
      { title: "Ma can kiem tra", content: "HPG la ticker mapped; HSG/NKG/TVN chi la peer group taxonomy, khong phai chuan so sanh dinh gia." },
      { title: "Dieu kien doi goc nhin", content: "Neu du lieu doanh nghiep khong xac nhan boi canh nganh, can giam do tin cay cua boi canh." },
    ],
    warning: DATA_COMPLETION_WARNING,
    actions: commonActions,
  },
};

const reviewedCompassIndustries: IndustryCompassOption[] = [
  steelMaterialsCompassOption,
  ...industries.filter((industry) => industry.id !== "information-technology-services"),
];

export const industryCompassData: IndustryCompassData = {
  industries: reviewedCompassIndustries,
  clusters: [
    {
      title: "Nhận diện ngành",
      question: "Doanh nghiệp thuộc ngành nào và ngành này nhạy với biến nào?",
      stepRange: [1, 2],
      output: "Biết ngành thuộc nhóm thép/vật liệu, bán lẻ hay tiêu dùng thiết yếu để đặt câu hỏi đúng.",
    },
    {
      title: "Hiểu cách ngành kiếm tiền",
      question: "Doanh nghiệp bán gì, cho ai và tiền nằm ở khâu nào?",
      stepRange: [3, 5],
      output: "Biết doanh thu, chi phí lớn, biên lợi nhuận và dòng tiền đến từ đâu.",
    },
    {
      title: "Nối ngành với vĩ mô",
      question: "Yếu tố vĩ mô nào cần kiểm tra tiếp cho ngành này?",
      stepRange: [6, 8],
      output: "Biết yếu tố vĩ mô tác động qua đường nào, không kết luận bằng tin tức đơn lẻ.",
    },
    {
      title: "Đọc dữ liệu xác nhận",
      question: "Dữ liệu nào chứng minh bối cảnh ngành đi vào doanh nghiệp?",
      stepRange: [9, 15],
      output: "Có bộ dữ liệu dẫn dắt, xác nhận và cảnh báo để theo dõi.",
    },
    {
      title: "Kết luận có điều kiện",
      question: "Dữ liệu còn thiếu gì trước khi chuyển sang module sau?",
      stepRange: [16, 17],
      output: "Kết luận chỉ là bối cảnh có điều kiện, kèm dữ liệu thiếu và điểm cần kiểm tra tiếp.",
    },
  ],
  termTips: {
    Backlog: "Khối lượng hợp đồng/đơn hàng đã ký nhưng chưa ghi nhận hết vào doanh thu.",
    "Biên lợi nhuận gộp": "Phần doanh thu còn lại sau khi trừ giá vốn hàng bán.",
    "Dòng tiền": "Tiền thật đi vào hoặc đi ra khỏi doanh nghiệp.",
    "Doanh thu cùng cửa hàng": "Doanh thu của các cửa hàng đã hoạt động đủ lâu, giúp tách tăng trưởng vận hành khỏi mở rộng mạng lưới.",
    "Tồn kho": "Hàng chưa bán được hoặc nguyên liệu đang giữ.",
  },
};
