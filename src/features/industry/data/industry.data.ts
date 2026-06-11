import type { IndustryBlockData, IndustryOption, IndustryPageData } from "../types";

const coreIndustryOptions: IndustryOption[] = [
  {
    id: "steel",
    name: "Thép và vật liệu xây dựng",
    shortName: "Thép",
    industryType: "Ngành chu kỳ / thâm dụng tài sản",
    status: "Đang phân tích",
    description: "Mẫu ngành chu kỳ để minh họa cách nối vĩ mô với BCTC.",
    keyQuestions: ["Giá đầu ra có phục hồi không?", "Giá nguyên liệu đầu vào gây áp lực thế nào?", "Đầu tư công có chuyển thành sản lượng thật không?"],
    quickAnswers: [
      { question: "Ngành này kiếm tiền bằng cách nào?", answer: "Từ sản lượng thép bán ra và chênh lệch giữa giá bán với chi phí đầu vào.", status: "Cần kiểm chứng", tone: "warning" },
      { question: "Ngành thuộc loại hình nào?", answer: "Ngành chu kỳ, thâm dụng tài sản, nhạy với bất động sản và đầu tư công.", status: "Giả thuyết", tone: "accent" },
      { question: "Biến vĩ mô nào ảnh hưởng mạnh nhất?", answer: "Lãi suất, tín dụng, đầu tư công, giá hàng hóa và thương mại toàn cầu.", status: "Theo dõi", tone: "neutral" },
      { question: "Ngành đang hưởng lợi, bất lợi hay trung lập?", answer: "Trung lập đến hưởng lợi có điều kiện, cần thêm dữ liệu sản lượng và biên lợi nhuận.", status: "Chưa chốt", tone: "warning" },
      { question: "Dữ liệu quan trọng nhất cần theo dõi?", answer: "Sản lượng tiêu thụ, tồn kho, giá quặng sắt/than cốc và biên lợi nhuận gộp.", status: "Ưu tiên", tone: "accent" },
      { question: "Có đủ cơ sở để chuyển sang lọc cổ phiếu chưa?", answer: "Có thể lọc thăm dò, nhưng cần gắn nhãn dữ liệu còn thiếu.", status: "Có điều kiện", tone: "success" },
    ],
    tutorNotes: [
      "Bạn đang phân tích ngành thép, hãy kiểm tra cả giá thép đầu ra và giá nguyên liệu đầu vào.",
      "Tin đầu tư công tích cực không có nghĩa mọi doanh nghiệp vật liệu xây dựng đều hưởng lợi ngay.",
      "Bạn nên kiểm tra xem kỳ vọng ngành đã phản ánh vào giá cổ phiếu chưa trước khi chuyển sang bước sau.",
    ],
  },
  {
    id: "banking",
    name: "Ngân hàng",
    shortName: "Ngân hàng",
    industryType: "Ngành tài chính / nhạy với lãi suất và tín dụng",
    status: "Cần bổ sung dữ liệu",
    description: "Ngành cần đọc tăng trưởng tín dụng, NIM, nợ xấu, dự phòng và chất lượng tài sản.",
    keyQuestions: ["Tín dụng có tăng bền không?", "NIM đang mở rộng hay thu hẹp?", "Nợ xấu và dự phòng có bị đánh giá thấp không?"],
    quickAnswers: [
      { question: "Ngành này kiếm tiền bằng cách nào?", answer: "Từ chênh lệch lãi suất, phí dịch vụ và quản trị rủi ro tín dụng.", status: "Cần kiểm chứng", tone: "warning" },
      { question: "Ngành thuộc loại hình nào?", answer: "Ngành tài chính, dùng đòn bẩy cao và rất nhạy với chu kỳ tín dụng.", status: "Giả thuyết", tone: "accent" },
      { question: "Biến vĩ mô nào ảnh hưởng mạnh nhất?", answer: "Lãi suất, tăng trưởng tín dụng, thanh khoản hệ thống và sức khỏe bất động sản.", status: "Theo dõi", tone: "neutral" },
      { question: "Ngành đang hưởng lợi, bất lợi hay trung lập?", answer: "Chưa đủ dữ liệu, cần kiểm tra NIM, nợ xấu và chi phí tín dụng.", status: "Chưa chốt", tone: "warning" },
      { question: "Dữ liệu quan trọng nhất cần theo dõi?", answer: "Tăng trưởng tín dụng, CASA, NIM, nợ nhóm 2, nợ xấu và bao phủ nợ xấu.", status: "Ưu tiên", tone: "accent" },
      { question: "Có đủ cơ sở để chuyển sang lọc cổ phiếu chưa?", answer: "Chỉ nên lọc thăm dò nếu đã có tiêu chí về chất lượng tài sản.", status: "Có điều kiện", tone: "success" },
    ],
    tutorNotes: [
      "Bạn đang phân tích ngân hàng, hãy xem chất lượng tài sản trước khi chỉ nhìn tăng trưởng lợi nhuận.",
      "NIM tăng chưa chắc tốt nếu đi kèm rủi ro nợ xấu hoặc chi phí vốn tăng.",
      "Trước khi lọc cổ phiếu ngân hàng, hãy xác định tiêu chí về nợ xấu và dự phòng.",
    ],
  },
  {
    id: "retail",
    name: "Bán lẻ",
    shortName: "Bán lẻ",
    industryType: "Ngành tiêu dùng / nhạy với sức mua",
    status: "Cần bổ sung dữ liệu",
    description: "Ngành cần đọc sức mua, biên gộp, tồn kho, mở rộng cửa hàng và hiệu quả trên mỗi điểm bán.",
    keyQuestions: ["Sức mua có phục hồi thật không?", "Biên gộp có giữ được không?", "Mở rộng cửa hàng có tạo lợi nhuận hay chỉ tăng doanh thu?"],
    quickAnswers: [
      { question: "Ngành này kiếm tiền bằng cách nào?", answer: "Từ lưu lượng khách, giá trị đơn hàng, biên gộp và hiệu quả vận hành cửa hàng.", status: "Cần kiểm chứng", tone: "warning" },
      { question: "Ngành thuộc loại hình nào?", answer: "Ngành tiêu dùng, nhạy với thu nhập, niềm tin người tiêu dùng và cạnh tranh giá.", status: "Giả thuyết", tone: "accent" },
      { question: "Biến vĩ mô nào ảnh hưởng mạnh nhất?", answer: "Thu nhập hộ gia đình, lãi suất tiêu dùng, lạm phát và sức mua đô thị.", status: "Theo dõi", tone: "neutral" },
      { question: "Ngành đang hưởng lợi, bất lợi hay trung lập?", answer: "Trung lập, cần xác nhận bằng doanh thu cùng cửa hàng và tồn kho.", status: "Chưa chốt", tone: "warning" },
      { question: "Dữ liệu quan trọng nhất cần theo dõi?", answer: "Doanh thu cùng cửa hàng, biên gộp, vòng quay tồn kho và chi phí bán hàng.", status: "Ưu tiên", tone: "accent" },
      { question: "Có đủ cơ sở để chuyển sang lọc cổ phiếu chưa?", answer: "Có thể lọc nếu phân biệt được tăng trưởng thật và tăng trưởng do mở rộng điểm bán.", status: "Có điều kiện", tone: "success" },
    ],
    tutorNotes: [
      "Bạn đang phân tích bán lẻ, đừng chỉ nhìn doanh thu tăng nếu tồn kho và chi phí bán hàng cũng tăng mạnh.",
      "Hãy tách tăng trưởng cùng cửa hàng khỏi tăng trưởng do mở rộng mạng lưới.",
      "Sức mua phục hồi cần được xác nhận bằng biên lợi nhuận và dòng tiền.",
    ],
  },
  {
    id: "industrial-parks",
    name: "Khu công nghiệp",
    shortName: "KCN",
    industryType: "Ngành tài sản / nhạy với FDI và pháp lý đất",
    status: "Cần bổ sung dữ liệu",
    description: "Ngành cần đọc FDI, diện tích sẵn sàng cho thuê, giá thuê, pháp lý đất và tiến độ hạ tầng.",
    keyQuestions: ["FDI có chuyển thành nhu cầu thuê đất không?", "Doanh nghiệp còn quỹ đất sạch không?", "Giá thuê tăng có bền không?"],
    quickAnswers: [
      { question: "Ngành này kiếm tiền bằng cách nào?", answer: "Từ cho thuê đất, hạ tầng khu công nghiệp và dịch vụ đi kèm.", status: "Cần kiểm chứng", tone: "warning" },
      { question: "Ngành thuộc loại hình nào?", answer: "Ngành tài sản, phụ thuộc quỹ đất, pháp lý, FDI và chu kỳ đầu tư sản xuất.", status: "Giả thuyết", tone: "accent" },
      { question: "Biến vĩ mô nào ảnh hưởng mạnh nhất?", answer: "FDI, dịch chuyển chuỗi cung ứng, tỷ giá, hạ tầng và chính sách đất đai.", status: "Theo dõi", tone: "neutral" },
      { question: "Ngành đang hưởng lợi, bất lợi hay trung lập?", answer: "Có thể hưởng lợi có điều kiện nếu quỹ đất sạch và pháp lý sẵn sàng.", status: "Chưa chốt", tone: "warning" },
      { question: "Dữ liệu quan trọng nhất cần theo dõi?", answer: "Diện tích còn cho thuê, tỷ lệ lấp đầy, giá thuê, backlog và tiến độ pháp lý.", status: "Ưu tiên", tone: "accent" },
      { question: "Có đủ cơ sở để chuyển sang lọc cổ phiếu chưa?", answer: "Có thể lọc nếu đã tách doanh nghiệp có quỹ đất thật khỏi câu chuyện FDI chung.", status: "Có điều kiện", tone: "success" },
    ],
    tutorNotes: [
      "Bạn đang phân tích khu công nghiệp, hãy kiểm tra quỹ đất sạch và thời điểm ghi nhận doanh thu.",
      "FDI tích cực không đồng nghĩa mọi doanh nghiệp khu công nghiệp đều hưởng lợi như nhau.",
      "Trước khi lọc cổ phiếu, hãy kiểm tra pháp lý đất và tỷ lệ lấp đầy.",
    ],
  },
];

function createSuggestedIndustry({
  description,
  id,
  industryType,
  keyQuestions,
  name,
  shortName,
}: {
  id: string;
  name: string;
  shortName: string;
  industryType: string;
  description: string;
  keyQuestions: string[];
}): IndustryOption {
  return {
    id,
    name,
    shortName,
    industryType,
    status: "Cần bổ sung dữ liệu",
    description,
    keyQuestions,
    quickAnswers: [
      {
        question: "Ngành này kiếm tiền bằng cách nào?",
        answer: description,
        status: "Giả thuyết",
        tone: "accent",
      },
      {
        question: "Ngành thuộc loại hình nào?",
        answer: industryType,
        status: "Giả thuyết",
        tone: "accent",
      },
      {
        question: "Biến vĩ mô nào ảnh hưởng mạnh nhất?",
        answer: keyQuestions[0],
        status: "Theo dõi",
        tone: "neutral",
      },
      {
        question: "Ngành đang hưởng lợi, bất lợi hay trung lập?",
        answer: "Chưa chốt. Cần đi qua 5 cụm phân tích và kiểm tra dữ liệu xác nhận.",
        status: "Chưa đủ dữ liệu",
        tone: "warning",
      },
      {
        question: "Dữ liệu quan trọng nhất cần theo dõi?",
        answer: keyQuestions.join(", "),
        status: "Ưu tiên",
        tone: "accent",
      },
      {
        question: "Có đủ cơ sở để chuyển sang lọc cổ phiếu chưa?",
        answer: "Chỉ nên lọc thăm dò sau khi đã xác định biến ngành đi vào BCTC doanh nghiệp nào.",
        status: "Có điều kiện",
        tone: "success",
      },
    ],
    tutorNotes: [
      `Bạn đang phân tích ${name}. Hãy bắt đầu bằng cách xác định ngành kiếm tiền từ biến vận hành nào.`,
      "Không kết luận ngành tốt chỉ từ một tin tức vĩ mô hoặc một dữ liệu ngắn hạn.",
      "Trước khi chuyển sang cổ phiếu, hãy kiểm tra dữ liệu ngành có đi vào doanh thu, biên lợi nhuận hoặc dòng tiền không.",
    ],
  };
}

export const industryOptions: IndustryOption[] = [
  ...coreIndustryOptions,
  createSuggestedIndustry({
    id: "securities",
    name: "Chứng khoán",
    shortName: "Chứng khoán",
    industryType: "Ngành tài chính / nhạy với thanh khoản và tâm lý thị trường",
    description: "Kiếm tiền từ môi giới, cho vay ký quỹ, tự doanh, ngân hàng đầu tư và quản lý tài sản.",
    keyQuestions: ["Thanh khoản thị trường có tăng bền không?", "Margin có mở rộng nhưng rủi ro kiểm soát được không?", "Tự doanh đang hỗ trợ hay làm biến động lợi nhuận?"],
  }),
  createSuggestedIndustry({
    id: "residential-real-estate",
    name: "Bất động sản dân dụng",
    shortName: "BĐS dân dụng",
    industryType: "Ngành tài sản / nhạy với tín dụng, pháp lý và sức mua nhà ở",
    description: "Kiếm tiền từ phát triển dự án, bán hàng, bàn giao và quản trị quỹ đất.",
    keyQuestions: ["Tín dụng và lãi suất có hỗ trợ sức mua không?", "Pháp lý dự án có đủ để ghi nhận doanh thu không?", "Hàng tồn kho là tài sản tốt hay rủi ro dòng tiền?"],
  }),
  createSuggestedIndustry({
    id: "oil-gas-energy",
    name: "Dầu khí và năng lượng",
    shortName: "Dầu khí",
    industryType: "Ngành hàng hóa / nhạy với giá dầu, đầu tư thượng nguồn và chính sách năng lượng",
    description: "Kiếm tiền theo từng khâu: thăm dò, khai thác, vận chuyển, phân phối, dịch vụ và điện năng.",
    keyQuestions: ["Giá dầu/khí đang hỗ trợ khâu nào?", "Backlog dự án có chuyển thành doanh thu không?", "Chi phí vốn và chính sách năng lượng tác động ra sao?"],
  }),
  createSuggestedIndustry({
    id: "power-utilities",
    name: "Điện và tiện ích",
    shortName: "Điện",
    industryType: "Ngành phòng thủ có điều tiết / nhạy với sản lượng, giá bán và chính sách",
    description: "Kiếm tiền từ sản lượng điện, giá hợp đồng, cơ cấu nguồn và hiệu suất vận hành.",
    keyQuestions: ["Sản lượng huy động có tăng không?", "Giá bán/hợp đồng có cải thiện không?", "Nợ vay và chi phí đầu vào có ăn vào biên lợi nhuận không?"],
  }),
  createSuggestedIndustry({
    id: "ports-logistics",
    name: "Cảng biển và logistics",
    shortName: "Logistics",
    industryType: "Ngành hạ tầng thương mại / nhạy với lưu lượng hàng hóa và công suất",
    description: "Kiếm tiền từ sản lượng container, giá dịch vụ, kho bãi, vận tải và hiệu suất khai thác tài sản.",
    keyQuestions: ["Lưu lượng hàng hóa có tăng thật không?", "Công suất còn dư địa hay đã nghẽn?", "Giá cước và cạnh tranh khu vực tác động thế nào?"],
  }),
  createSuggestedIndustry({
    id: "seafood-textile-wood",
    name: "Thủy sản/dệt may/gỗ",
    shortName: "Xuất khẩu",
    industryType: "Ngành xuất khẩu / nhạy với đơn hàng, tỷ giá và sức mua toàn cầu",
    description: "Kiếm tiền từ đơn hàng xuất khẩu, biên gia công, nguyên liệu, tỷ giá và năng lực giao hàng.",
    keyQuestions: ["Đơn hàng phục hồi thật hay chỉ bù hàng tồn?", "Tỷ giá và chi phí nguyên liệu hỗ trợ hay gây áp lực?", "Khách hàng lớn có quay lại đặt hàng không?"],
  }),
  createSuggestedIndustry({
    id: "chemicals-fertilizers",
    name: "Hóa chất và phân bón",
    shortName: "Hóa chất",
    industryType: "Ngành hàng hóa / nhạy với giá đầu vào, mùa vụ và cung cầu khu vực",
    description: "Kiếm tiền từ chênh lệch giá bán với nguyên liệu, sản lượng tiêu thụ và chu kỳ mùa vụ.",
    keyQuestions: ["Giá bán có tăng nhanh hơn chi phí đầu vào không?", "Mùa vụ có hỗ trợ sản lượng không?", "Cung mới khu vực có làm giảm biên lợi nhuận không?"],
  }),
  createSuggestedIndustry({
    id: "aviation-tourism",
    name: "Hàng không và du lịch",
    shortName: "Du lịch",
    industryType: "Ngành dịch vụ chu kỳ / nhạy với sức mua, giá nhiên liệu và lưu lượng khách",
    description: "Kiếm tiền từ lượng khách, giá vé/phòng, hệ số sử dụng, dịch vụ phụ trợ và kiểm soát chi phí.",
    keyQuestions: ["Lượng khách tăng có đi kèm giá bán tốt không?", "Nhiên liệu và tỷ giá có gây áp lực chi phí không?", "Công suất khai thác có phục hồi bền không?"],
  }),
  createSuggestedIndustry({
    id: "technology",
    name: "Công nghệ",
    shortName: "Công nghệ",
    industryType: "Ngành tăng trưởng / nhạy với đơn hàng, nhân sự và chu kỳ đầu tư số",
    description: "Kiếm tiền từ hợp đồng phần mềm, dịch vụ IT, chuyển đổi số, thuê ngoài và sản phẩm nền tảng.",
    keyQuestions: ["Backlog và đơn hàng mới có tăng không?", "Biên lợi nhuận có giữ được khi mở rộng nhân sự không?", "Khách hàng có cắt giảm ngân sách công nghệ không?"],
  }),
];

const steelMacroTable = {
  caption: "Bảng Vĩ mô đến Ngành",
  columns: [
    { key: "macroVariable" as const, header: "Biến vĩ mô" },
    { key: "industryImpact" as const, header: "Tác động đến ngành" },
    { key: "transmission" as const, header: "Kênh truyền dẫn" },
    { key: "classification" as const, header: "Trạng thái" },
    { key: "timeframe" as const, header: "Thời gian" },
    { key: "dataToWatch" as const, header: "Dữ liệu cần theo dõi" },
    { key: "module" as const, header: "Module quay lại" },
  ],
  rows: [
    {
      macroVariable: "Lãi suất",
      industryImpact: "Ảnh hưởng nhu cầu xây dựng, bất động sản và chi phí vốn",
      transmission: "Lãi vay, tín dụng dự án, sức mua nhà ở",
      classification: "Trung lập đến bất lợi",
      timeframe: "Trung hạn",
      dataToWatch: "Lãi suất cho vay, tín dụng bất động sản",
      module: "Vĩ mô, BCTC, Rủi ro",
    },
    {
      macroVariable: "Đầu tư công",
      industryImpact: "Hỗ trợ nhu cầu thép xây dựng và vật liệu",
      transmission: "Dự án hạ tầng kéo sản lượng tiêu thụ",
      classification: "Hưởng lợi có điều kiện",
      timeframe: "Ngắn đến trung hạn",
      dataToWatch: "Giải ngân đầu tư công, khối lượng dự án",
      module: "Vĩ mô, Lọc cổ phiếu",
    },
    {
      macroVariable: "Giá hàng hóa",
      industryImpact: "Tác động trực tiếp giá vốn và biên lợi nhuận",
      transmission: "Quặng sắt, than cốc, điện, logistics",
      classification: "Cần kiểm tra thêm",
      timeframe: "Ngắn hạn",
      dataToWatch: "Giá quặng sắt, than cốc, HRC",
      module: "BCTC, Định giá, Rủi ro",
    },
    {
      macroVariable: "Xuất khẩu và thương mại toàn cầu",
      industryImpact: "Ảnh hưởng đầu ra xuất khẩu và cạnh tranh nhập khẩu",
      transmission: "Nhu cầu khu vực, thuế, giá thép nhập khẩu",
      classification: "Chuyển pha",
      timeframe: "Trung hạn",
      dataToWatch: "Sản lượng xuất khẩu, giá thép khu vực",
      module: "Vĩ mô, Rủi ro",
    },
  ],
};

const indicatorTable = {
  caption: "Bảng chỉ báo ngành",
  columns: [
    { key: "indicator" as const, header: "Chỉ báo" },
    { key: "type" as const, header: "Nhóm" },
    { key: "meaning" as const, header: "Trả lời câu hỏi" },
    { key: "source" as const, header: "Nguồn dữ liệu" },
    { key: "frequency" as const, header: "Tần suất" },
    { key: "misread" as const, header: "Dễ hiểu sai" },
  ],
  rows: [
    {
      indicator: "Sản lượng tiêu thụ thép",
      type: "Chỉ báo xác nhận",
      meaning: "Nhu cầu thật có tăng không",
      source: "Hiệp hội ngành, báo cáo doanh nghiệp",
      frequency: "Tháng/quý",
      misread: "Sản lượng tăng nhưng biên lợi nhuận vẫn có thể giảm",
    },
    {
      indicator: "Giá quặng sắt và than cốc",
      type: "Chỉ báo sớm",
      meaning: "Giá vốn có tạo áp lực không",
      source: "Sàn hàng hóa, báo cáo thị trường",
      frequency: "Tuần/tháng",
      misread: "Giá đầu vào giảm chưa chắc tốt nếu giá bán giảm nhanh hơn",
    },
    {
      indicator: "Tồn kho thép",
      type: "Chỉ báo rủi ro",
      meaning: "Nguồn cung có đang dư không",
      source: "Báo cáo ngành, BCTC",
      frequency: "Quý",
      misread: "Tồn kho tăng có thể do chuẩn bị đơn hàng, không chỉ do bán chậm",
    },
    {
      indicator: "Biên lợi nhuận gộp doanh nghiệp đầu ngành",
      type: "Chỉ báo xác nhận",
      meaning: "Profit pool có cải thiện không",
      source: "BCTC doanh nghiệp",
      frequency: "Quý",
      misread: "Một quý tốt chưa đủ để kết luận chu kỳ mới",
    },
  ],
};

const templateTable = {
  caption: "Template dữ liệu theo ngành",
  columns: [
    { key: "template" as const, header: "Ngành" },
    { key: "dataToWatch" as const, header: "Dữ liệu cần xem" },
    { key: "why" as const, header: "Vì sao quan trọng" },
    { key: "linkage" as const, header: "Liên kết module" },
  ],
  rows: [
    {
      template: "Ngân hàng",
      dataToWatch: "NIM, CASA, NPL, tín dụng, dự phòng",
      why: "Cho biết chất lượng tăng trưởng và rủi ro tài sản",
      linkage: "BCTC, Định giá, Rủi ro",
    },
    {
      template: "Bán lẻ",
      dataToWatch: "Doanh thu/cửa hàng, biên gộp, tồn kho, chi phí bán hàng",
      why: "Tách tăng trưởng thật khỏi mở rộng quá nhanh",
      linkage: "Business, BCTC, Watchlist",
    },
    {
      template: "Thép và vật liệu xây dựng",
      dataToWatch: "Sản lượng, giá bán, quặng sắt, than cốc, tồn kho",
      why: "Ngành chu kỳ nhạy với cả đầu ra và đầu vào",
      linkage: "Vĩ mô, BCTC, Định giá, Rủi ro",
    },
    {
      template: "Cảng biển và logistics",
      dataToWatch: "Sản lượng container, giá cước, công suất, thương mại toàn cầu",
      why: "Cho biết lưu lượng hàng hóa và quyền định giá",
      linkage: "Vĩ mô, BCTC, Rủi ro",
    },
  ],
};

const linkageTable = {
  caption: "Dữ liệu ngành đi vào cổ phiếu",
  columns: [
    { key: "indicator" as const, header: "Dữ liệu ngành" },
    { key: "businessImpact" as const, header: "Tác động đến doanh nghiệp" },
    { key: "financialLine" as const, header: "Dòng BCTC bị ảnh hưởng" },
    { key: "valuationImpact" as const, header: "Ảnh hưởng đến định giá" },
    { key: "riskToCarry" as const, header: "Rủi ro cần chuyển tiếp" },
    { key: "module" as const, header: "Module kiểm tra" },
  ],
  rows: [
    {
      indicator: "Giá quặng sắt tăng",
      businessImpact: "Giá vốn doanh nghiệp thép tăng",
      financialLine: "Biên lợi nhuận gộp, lợi nhuận sau thuế",
      valuationImpact: "P/E và biên an toàn có thể thay đổi",
      riskToCarry: "Rủi ro chi phí đầu vào",
      module: "BCTC, Định giá, Rủi ro",
    },
    {
      indicator: "Đầu tư công tăng tốc",
      businessImpact: "Sản lượng thép xây dựng có thể được hỗ trợ",
      financialLine: "Doanh thu, hàng tồn kho, dòng tiền",
      valuationImpact: "Kịch bản doanh thu cần cập nhật",
      riskToCarry: "Rủi ro kỳ vọng chưa vào đơn hàng",
      module: "Vĩ mô, Lọc cổ phiếu",
    },
    {
      indicator: "Tồn kho ngành tăng",
      businessImpact: "Áp lực giảm giá bán hoặc vòng quay tồn kho chậm",
      financialLine: "Tồn kho, dòng tiền hoạt động, biên lợi nhuận",
      valuationImpact: "Giả định chu kỳ cần thận trọng hơn",
      riskToCarry: "Rủi ro dư cung",
      module: "BCTC, Rủi ro",
    },
  ],
};

const blocks: IndustryBlockData[] = [
  {
    id: "industry-type",
    stepNumber: 1,
    tab: "understand",
    title: "Ngành này thuộc kiểu ngành nào?",
    icon: "1",
    centralQuestion: "Ngành này thuộc kiểu ngành nào?",
    easyExplanation:
      "Trước khi đọc số liệu, hãy biết ngành đang vận hành giống ngành chu kỳ, phòng thủ, tài chính hay tiêu dùng. Mỗi loại có cách đọc dữ liệu khác nhau.",
    fields: [
      { label: "Ngành đang phân tích", value: "Thép và vật liệu xây dựng", tone: "accent" },
      { label: "Loại hình gợi ý", value: "Ngành chu kỳ / thâm dụng tài sản", tone: "warning" },
      { label: "Biến nhạy nhất", value: "Đầu tư công, bất động sản, giá quặng sắt" },
      { label: "Cách đọc phù hợp", value: "Đọc theo chu kỳ sản lượng, tồn kho và biên lợi nhuận" },
    ],
    states: [
      {
        label: "Ngành chu kỳ",
        description: "Lợi nhuận lên xuống mạnh theo cung cầu và giá hàng hóa.",
        evidence: "Sản lượng, tồn kho, giá đầu vào và giá bán thay đổi nhanh.",
        pitfall: "P/E thấp ở đỉnh chu kỳ có thể gây hiểu nhầm.",
        tone: "warning",
      },
      {
        label: "Ngành phòng thủ",
        description: "Nhu cầu ít biến động hơn, thường đọc qua dòng tiền và chính sách giá.",
        evidence: "Doanh thu ổn định, biến động biên lợi nhuận thấp hơn.",
        pitfall: "Ổn định không đồng nghĩa luôn hấp dẫn.",
        tone: "neutral",
      },
      {
        label: "Ngành tài sản nhẹ/công nghệ",
        description: "Cần chú ý khả năng mở rộng, nhân sự và doanh thu lặp lại.",
        evidence: "Biên lợi nhuận, hợp đồng mới, tỷ lệ giữ chân khách hàng.",
        pitfall: "Tăng trưởng cao nhưng định giá có thể đã phản ánh kỳ vọng.",
        tone: "accent",
      },
    ],
    dataToWatch: ["Sản lượng tiêu thụ", "Tồn kho", "Giá quặng sắt", "Giá thép xây dựng"],
    moduleLinks: ["Vĩ mô", "BCTC", "Định giá"],
    pitfalls: ["Đừng dùng cùng một cách đọc cho mọi ngành.", "Ngành chu kỳ cần đọc lợi nhuận bình thường hóa."],
    outputPrompts: [
      "Tôi đang phân tích ngành...",
      "Ngành này thuộc loại hình...",
      "Lý do tôi phân loại như vậy là...",
      "Biến vĩ mô ngành này nhạy nhất là...",
    ],
  },
  {
    id: "money-model",
    stepNumber: 2,
    tab: "understand",
    title: "Ngành kiếm tiền từ đâu?",
    icon: "2",
    centralQuestion: "Ngành kiếm tiền từ đâu?",
    easyExplanation:
      "Một ngành kiếm tiền từ sản lượng, giá bán, phí dịch vụ, lãi suất, hợp đồng dài hạn hoặc thuê tài sản. Với thép, trọng tâm là chênh lệch giữa giá bán và chi phí đầu vào.",
    examples: [
      { title: "Thép", content: "Doanh thu đến từ sản lượng x giá bán; lợi nhuận phụ thuộc giá quặng, than cốc, điện và tồn kho." },
      { title: "Ngân hàng", content: "Doanh thu đến từ lãi vay, phí dịch vụ; cần đọc NIM cùng nợ xấu và dự phòng." },
      { title: "Bán lẻ", content: "Doanh thu đến từ lưu lượng khách, doanh thu/cửa hàng, biên gộp và chi phí vận hành." },
    ],
    dataToWatch: ["Sản lượng", "Giá bán bình quân", "Giá vốn", "Biên lợi nhuận gộp"],
    moduleLinks: ["Hiểu doanh nghiệp", "BCTC"],
    pitfalls: ["Doanh thu tăng chưa chắc tốt nếu phải giảm giá.", "Sản lượng tăng chưa chắc tốt nếu tồn kho cũng tăng."],
    outputPrompts: [
      "Ngành này kiếm tiền chủ yếu từ...",
      "Doanh thu phụ thuộc vào...",
      "Chi phí quan trọng nhất là...",
      "Biên lợi nhuận phụ thuộc vào...",
    ],
  },
  {
    id: "value-chain",
    stepNumber: 3,
    tab: "understand",
    title: "Tiền nằm ở khâu nào trong ngành?",
    icon: "3",
    centralQuestion: "Tiền nằm ở khâu nào trong ngành?",
    easyExplanation:
      "Không phải khâu nào trong chuỗi giá trị cũng giữ được lợi nhuận. Cần biết khâu nào có quyền định giá và khâu nào dễ bị ép biên lợi nhuận.",
    valueChain: ["Đầu vào", "Sản xuất", "Phân phối", "Khách hàng cuối"],
    fields: [
      { label: "Profit pool lớn", value: "Doanh nghiệp có quy mô, tự chủ đầu vào và đầu ra ổn định", tone: "accent" },
      { label: "Khâu dễ bị ép biên", value: "Phân phối nhỏ lẻ hoặc doanh nghiệp tồn kho yếu", tone: "warning" },
      { label: "Doanh nghiệp cần phân tích", value: "Nằm ở khâu sản xuất và phân phối" },
    ],
    dataToWatch: ["Biên lợi nhuận từng khâu", "Thị phần", "Quyền định giá", "Vòng quay tồn kho"],
    moduleLinks: ["Hiểu doanh nghiệp", "BCTC", "Rủi ro"],
    pitfalls: ["Doanh nghiệp cùng ngành nhưng khác khâu có rủi ro rất khác nhau."],
    outputPrompts: [
      "Chuỗi giá trị chính của ngành gồm...",
      "Khâu có lợi nhuận hấp dẫn nhất là...",
      "Khâu có rủi ro lớn nhất là...",
      "Doanh nghiệp tôi muốn phân tích nằm ở khâu...",
    ],
  },
  {
    id: "macro-transmission",
    stepNumber: 4,
    tab: "macro",
    title: "Vĩ mô đang kéo ngành lên hay đè ngành xuống?",
    icon: "4",
    centralQuestion: "Vĩ mô đang kéo ngành lên hay đè ngành xuống?",
    easyExplanation:
      "Vĩ mô không tác động thẳng vào cổ phiếu. Nó đi qua nhu cầu ngành, chi phí, dòng BCTC, kỳ vọng định giá và rủi ro cần kiểm tra.",
    table: steelMacroTable,
    dataToWatch: ["Lãi suất", "Tín dụng", "Đầu tư công", "Giá hàng hóa", "Tỷ giá"],
    moduleLinks: ["Vĩ mô", "BCTC", "Định giá", "Rủi ro"],
    pitfalls: ["Tin vĩ mô tích cực chưa chắc đã đi vào BCTC ngay.", "Cần phân biệt tác động ngắn hạn và dài hạn."],
  },
  {
    id: "macro-state",
    stepNumber: 5,
    tab: "macro",
    title: "Ngành đang hưởng lợi, bất lợi hay trung lập?",
    icon: "5",
    centralQuestion: "Ngành đang hưởng lợi, bất lợi hay trung lập?",
    easyExplanation:
      "Trạng thái ngành chỉ là giả thuyết làm việc. Cần có dữ liệu xác nhận trước khi chuyển sang lọc cổ phiếu.",
    states: [
      {
        label: "Hưởng lợi có điều kiện",
        description: "Đầu tư công hỗ trợ đầu ra nhưng cần kiểm chứng bằng sản lượng và đơn hàng.",
        evidence: "Giải ngân tăng, sản lượng tiêu thụ cải thiện.",
        pitfall: "Câu chuyện tích cực có thể đã được kỳ vọng trước.",
        tone: "accent",
      },
      {
        label: "Trung lập",
        description: "Có yếu tố hỗ trợ nhưng cũng có áp lực từ đầu vào hoặc nhu cầu yếu.",
        evidence: "Dữ liệu trái chiều giữa sản lượng, tồn kho và biên lợi nhuận.",
        pitfall: "Không nên ép ngành vào trạng thái thuận lợi khi dữ liệu chưa đủ.",
        tone: "neutral",
      },
      {
        label: "Bất lợi",
        description: "Chi phí đầu vào, lãi suất hoặc nhu cầu yếu tạo áp lực.",
        evidence: "Tồn kho tăng, biên lợi nhuận giảm, đơn hàng chậm.",
        pitfall: "Một quý xấu chưa đủ để kết luận xu hướng dài hạn.",
        tone: "warning",
      },
    ],
    dataToWatch: ["Dữ liệu xác nhận thesis", "Tác động vào BCTC", "Kỳ vọng đã phản ánh vào giá hay chưa"],
    moduleLinks: ["Vĩ mô", "Lọc cổ phiếu", "Định giá"],
    pitfalls: ["Đừng gọi ngành thuận lợi chỉ vì một câu chuyện hấp dẫn."],
    outputPrompts: ["Ngành đang thuộc trạng thái nào?", "Dữ liệu nào xác nhận?", "Tác động đã vào BCTC chưa?"],
  },
  {
    id: "demand",
    stepNumber: 6,
    tab: "data",
    title: "Khách hàng có đang cần ngành này nhiều hơn không?",
    icon: "6",
    centralQuestion: "Khách hàng có đang cần ngành này nhiều hơn không?",
    easyExplanation:
      "Nhu cầu ngành cần được tách thành sản lượng, giá bán và độ bền của nhu cầu. Phục hồi từ nền thấp không giống tăng trưởng bền.",
    dataToWatch: ["Sản lượng tiêu thụ", "Doanh thu toàn ngành", "Đơn hàng mới", "Tỷ lệ sử dụng công suất"],
    moduleLinks: ["Vĩ mô", "BCTC"],
    pitfalls: ["Nhu cầu tăng chưa chắc lợi nhuận tăng nếu chi phí tăng mạnh hơn.", "Doanh thu tăng chưa chắc tốt nếu phải bán giảm giá."],
  },
  {
    id: "supply",
    stepNumber: 7,
    tab: "data",
    title: "Nguồn cung ngành có đang gây áp lực không?",
    icon: "7",
    centralQuestion: "Nguồn cung ngành có đang gây áp lực không?",
    easyExplanation:
      "Nguồn cung quyết định quyền định giá. Khi công suất dư hoặc tồn kho cao, doanh nghiệp có thể khó giữ biên lợi nhuận.",
    examples: [
      { title: "Thép", content: "Công suất mới và tồn kho cao có thể tạo áp lực giảm giá bán." },
      { title: "Bất động sản", content: "Nguồn cung pháp lý mới quyết định tốc độ bàn giao và dòng tiền." },
      { title: "Hàng không", content: "Số ghế cung ứng và giá nhiên liệu ảnh hưởng biên lợi nhuận." },
    ],
    dataToWatch: ["Công suất", "Tồn kho", "Nguồn cung mới", "Hàng nhập khẩu"],
    moduleLinks: ["BCTC", "Rủi ro"],
    pitfalls: ["Nguồn cung thắt chặt có thể tốt cho giá bán nhưng xấu nếu thiếu đầu vào."],
  },
  {
    id: "lifecycle",
    stepNumber: 8,
    tab: "data",
    title: "Ngành đang tăng trưởng, bão hòa, suy giảm hay phục hồi?",
    icon: "8",
    centralQuestion: "Ngành đang tăng trưởng, bão hòa, suy giảm hay phục hồi?",
    easyExplanation:
      "Giai đoạn ngành ảnh hưởng cách đọc định giá. Ngành ở đáy chu kỳ có thể P/E cao vì lợi nhuận thấp, còn ở đỉnh có thể P/E thấp vì lợi nhuận cao bất thường.",
    states: [
      { label: "Hình thành", description: "Dữ liệu ít, tăng trưởng nhanh nhưng rủi ro mô hình cao.", evidence: "Người dùng mới, sản phẩm mới.", pitfall: "Dễ phóng đại quy mô thị trường.", tone: "neutral" },
      { label: "Tăng trưởng", description: "Nhu cầu mở rộng, cạnh tranh bắt đầu tăng.", evidence: "Doanh thu ngành tăng và biên còn giữ được.", pitfall: "Tăng trưởng ngành không chia đều cho mọi doanh nghiệp.", tone: "accent" },
      { label: "Phục hồi", description: "Dữ liệu tốt lên từ nền thấp.", evidence: "Sản lượng, biên lợi nhuận và tồn kho cùng cải thiện.", pitfall: "Nhầm phục hồi ngắn hạn thành chu kỳ dài hạn.", tone: "warning" },
    ],
    dataToWatch: ["Tăng trưởng doanh thu ngành", "Biên lợi nhuận", "Tồn kho", "P/E bình thường hóa"],
    moduleLinks: ["Định giá", "Rủi ro"],
    pitfalls: ["Không đọc P/E ngành chu kỳ theo cách máy móc."],
  },
  {
    id: "competition",
    stepNumber: 9,
    tab: "data",
    title: "Ai đang cạnh tranh với ai?",
    icon: "9",
    centralQuestion: "Ai đang cạnh tranh với ai?",
    easyExplanation:
      "Ngành tăng trưởng không có nghĩa mọi doanh nghiệp hưởng lợi như nhau. Cần biết ai dẫn đầu, ai cạnh tranh bằng giá, ai có lợi thế chi phí.",
    fields: [
      { label: "Cách cạnh tranh", value: "Quy mô, chi phí sản xuất, mạng lưới phân phối, chất lượng sản phẩm" },
      { label: "Dữ liệu cần so", value: "Thị phần, biên lợi nhuận, vòng quay tồn kho" },
      { label: "Lợi thế cần kiểm chứng", value: "Quy mô và tự chủ đầu vào" },
    ],
    dataToWatch: ["Thị phần", "Biên lợi nhuận giữa doanh nghiệp", "Giá bán", "Chi phí vốn"],
    moduleLinks: ["Hiểu doanh nghiệp", "BCTC"],
    pitfalls: ["Doanh nghiệp nhỏ có thể rủi ro hơn trong ngành phục hồi nếu không có quyền định giá."],
  },
  {
    id: "entry-barrier",
    stepNumber: 10,
    tab: "data",
    title: "Người mới có dễ nhảy vào ngành không?",
    icon: "10",
    centralQuestion: "Người mới có dễ nhảy vào ngành không?",
    easyExplanation:
      "Rào cản gia nhập giúp ngành giữ lợi nhuận lâu hơn. Nhưng rào cản cao cũng có thể đi kèm vốn lớn và rủi ro chu kỳ.",
    dataToWatch: ["Vốn đầu tư", "Giấy phép", "Lợi thế quy mô", "Mạng lưới phân phối", "Chi phí chuyển đổi"],
    moduleLinks: ["Hiểu doanh nghiệp", "Rủi ro"],
    pitfalls: ["Rào cản cao không bảo vệ doanh nghiệp nếu nhu cầu ngành suy yếu mạnh."],
    outputPrompts: ["Rào cản gia nhập cao/trung bình/thấp vì...", "Ai có quyền mặc cả lớn hơn?"],
  },
  {
    id: "substitute",
    stepNumber: 11,
    tab: "data",
    title: "Ngành có thể bị thay thế không?",
    icon: "11",
    centralQuestion: "Ngành có thể bị thay thế không?",
    easyExplanation:
      "Sản phẩm thay thế, công nghệ mới hoặc thay đổi hành vi khách hàng có thể làm mô hình cũ kém hấp dẫn hơn.",
    dataToWatch: ["Công nghệ mới", "Sản phẩm thay thế", "Thay đổi hành vi khách hàng", "Chi phí chuyển đổi"],
    moduleLinks: ["Hiểu doanh nghiệp", "Rủi ro"],
    pitfalls: ["Mức thấp/trung bình/cao chỉ là mức độ cần theo dõi, không phải tín hiệu hành động."],
  },
  {
    id: "policy",
    stepNumber: 12,
    tab: "data",
    title: "Chính sách có thể làm ngành đổi hướng không?",
    icon: "12",
    centralQuestion: "Chính sách có thể làm ngành đổi hướng không?",
    easyExplanation:
      "Tin chính sách tích cực không có nghĩa lợi nhuận doanh nghiệp tăng ngay. Cần kiểm tra thời gian thực thi, đối tượng hưởng lợi và tác động vào BCTC.",
    dataToWatch: ["Thuế/phí", "Quy chuẩn kỹ thuật", "Giấy phép", "Hỗ trợ hoặc siết chặt ngành", "Thời gian thực thi"],
    moduleLinks: ["Vĩ mô", "BCTC", "Rủi ro"],
    pitfalls: ["Kỳ vọng chính sách thường đến trước dữ liệu xác nhận."],
  },
  {
    id: "indicator-map",
    stepNumber: 13,
    tab: "data",
    title: "Dữ liệu nào cần theo dõi trước, xác nhận và cảnh báo rủi ro?",
    icon: "13",
    centralQuestion: "Dữ liệu nào cần theo dõi trước, dữ liệu nào xác nhận, dữ liệu nào cảnh báo rủi ro?",
    easyExplanation:
      "Chỉ báo sớm giúp phát hiện thay đổi, chỉ báo xác nhận kiểm chứng thesis, chỉ báo rủi ro nhắc bạn quay lại module liên quan.",
    table: indicatorTable,
    dataToWatch: ["PMI", "Đơn hàng mới", "Giá hàng hóa", "Sản lượng", "Tồn kho", "Biên lợi nhuận"],
    moduleLinks: ["Vĩ mô", "BCTC", "Rủi ro"],
    pitfalls: ["Một chỉ báo đơn lẻ hiếm khi đủ để kết luận ngành đổi pha."],
  },
  {
    id: "template-library",
    stepNumber: 14,
    tab: "data",
    title: "Mỗi ngành cần xem dữ liệu nào?",
    icon: "14",
    centralQuestion: "Mỗi ngành cần xem dữ liệu nào?",
    easyExplanation:
      "Mỗi ngành có bộ dữ liệu riêng. Module này cho template để bạn biết nên đọc gì trước khi đi sâu vào doanh nghiệp.",
    table: templateTable,
    dataToWatch: ["Template ngành", "Dữ liệu trọng yếu", "Liên kết BCTC/định giá/rủi ro"],
    moduleLinks: ["Lọc cổ phiếu", "Hiểu doanh nghiệp"],
    pitfalls: ["Không dùng template ngành này để đánh giá máy móc ngành khác."],
  },
  {
    id: "data-linkage",
    stepNumber: 15,
    tab: "data",
    title: "Dữ liệu ngành đi vào cổ phiếu như thế nào?",
    icon: "15",
    centralQuestion: "Dữ liệu ngành đi vào cổ phiếu như thế nào?",
    easyExplanation:
      "Dữ liệu ngành chỉ hữu ích khi bạn biết nó đi vào doanh nghiệp, BCTC, định giá và rủi ro ở đâu.",
    table: linkageTable,
    dataToWatch: ["Tác động doanh thu", "Tác động giá vốn", "Dòng tiền", "Rủi ro chuyển tiếp"],
    moduleLinks: ["BCTC", "Định giá", "Rủi ro"],
    pitfalls: ["Không nên đưa dữ liệu ngành vào định giá nếu chưa hiểu nó ảnh hưởng dòng nào."],
  },
  {
    id: "traps",
    stepNumber: 16,
    tab: "synthesis",
    title: "Ngành thuận lợi chưa chắc doanh nghiệp phù hợp",
    icon: "16",
    centralQuestion: "Ngành thuận lợi chưa chắc doanh nghiệp phù hợp, tôi có đang suy luận quá nhanh không?",
    easyExplanation:
      "Phân tích ngành chỉ là một lớp của quy trình. Bạn vẫn cần kiểm tra doanh nghiệp, BCTC, định giá và rủi ro.",
    dataToWatch: ["Dữ liệu xác nhận", "Kỳ vọng đã phản ánh", "Chất lượng doanh nghiệp", "Dòng tiền"],
    moduleLinks: ["Hiểu doanh nghiệp", "BCTC", "Định giá", "Rủi ro"],
    pitfalls: [
      "Ngành thuận lợi nhưng doanh nghiệp yếu.",
      "Ngành tăng trưởng nhưng cạnh tranh khốc liệt.",
      "Ngành phục hồi nhưng kỳ vọng đã đi trước.",
      "P/E thấp nhưng ngành đang ở đỉnh chu kỳ.",
      "Doanh thu tăng nhưng dòng tiền doanh nghiệp yếu.",
    ],
    outputPrompts: ["Tôi có đang kết luận ngành chỉ vì câu chuyện hấp dẫn không?", "Tôi đã kiểm tra dữ liệu xác nhận chưa?"],
  },
  {
    id: "outlook",
    stepNumber: 17,
    tab: "synthesis",
    title: "Ngành đang thuận lợi, trung tính, khó khăn hay chưa đủ dữ liệu?",
    icon: "17",
    centralQuestion: "Ngành đang thuận lợi, trung tính, khó khăn hay chưa đủ dữ liệu?",
    easyExplanation:
      "Trạng thái cuối module nên là nhận định có điều kiện, kèm dữ liệu xác nhận, rủi ro và điều kiện làm nhận định thay đổi.",
    states: [
      { label: "Thuận lợi", description: "Có yếu tố hỗ trợ rõ và dữ liệu xác nhận đang tốt lên.", evidence: "Sản lượng, biên lợi nhuận, tồn kho cùng cải thiện.", pitfall: "Kỳ vọng có thể đã phản ánh trước.", tone: "success" },
      { label: "Trung tính", description: "Yếu tố hỗ trợ và áp lực cùng tồn tại.", evidence: "Dữ liệu vĩ mô và dữ liệu ngành chưa đồng thuận.", pitfall: "Không ép kết luận khi dữ liệu còn mâu thuẫn.", tone: "neutral" },
      { label: "Chưa đủ dữ liệu", description: "Thiếu dữ liệu quan trọng để chuyển sang lọc cổ phiếu.", evidence: "Chưa rõ nhu cầu, cung hoặc biên lợi nhuận.", pitfall: "Theo dõi mơ hồ dễ tạo FOMO.", tone: "warning" },
    ],
    dataToWatch: ["Dữ liệu quan trọng nhất", "Dữ liệu mâu thuẫn", "Tác động ngắn/dài hạn", "Doanh nghiệp phù hợp để phân tích tiếp"],
    moduleLinks: ["Lọc cổ phiếu", "Watchlist"],
    pitfalls: ["Nhận định ngành cần có điều kiện sai, không phải kết luận cố định."],
  },
];

export const industryPageData: IndustryPageData = {
  isLoading: false,
  loading: {
    title: "Đang chuẩn bị module ngành",
    description: "Hệ thống đang gom dữ liệu mẫu để dẫn dắt phân tích ngành theo từng bước.",
  },
  emptyState: {
    title: "Chưa có ngành để phân tích",
    description: "Hãy chọn một ngành sau khi đọc bối cảnh vĩ mô.",
    icon: "∅",
  },
  header: {
    moduleName: "Phân tích ngành",
    subtitle: "Hiểu ngành trước khi chọn cổ phiếu",
    industryName: "Thép và vật liệu xây dựng",
    industryType: "Ngành chu kỳ / thâm dụng tài sản",
    status: "Đang phân tích",
    actions: [
      { label: "Quay lại Vĩ mô", variant: "secondary" },
      { label: "Chuyển sang Lọc cổ phiếu", variant: "primary" },
      { label: "Chuyển sang Hiểu doanh nghiệp", variant: "secondary" },
    ],
  },
  quickOverview: {
    title: "Bản đồ ngành nhanh",
    description: "Sáu câu trả lời ngắn để hiểu ngành ở mức định hướng, chưa phải kết luận cuối.",
    icon: "M",
    metrics: [
      {
        title: "Ngành đang học",
        value: "Thép",
        description: "Mẫu ngành chu kỳ để minh họa cách nối vĩ mô với BCTC.",
        icon: "ST",
        status: "Mẫu",
      },
      {
        title: "Lộ trình",
        value: "18",
        description: "Mười tám bước được chia vào bốn tab để tránh quá tải.",
        icon: "18",
        status: "Có hướng dẫn",
      },
      {
        title: "Trạng thái cuối",
        value: "4",
        description: "Thuận lợi, trung tính, khó khăn hoặc chưa đủ dữ liệu.",
        icon: "ST",
        status: "Có điều kiện",
      },
    ],
    answers: [
      { question: "Ngành này kiếm tiền bằng cách nào?", answer: "Từ sản lượng thép bán ra và chênh lệch giữa giá bán với chi phí đầu vào.", status: "Cần kiểm chứng", tone: "warning" },
      { question: "Ngành thuộc loại hình nào?", answer: "Ngành chu kỳ, thâm dụng tài sản, nhạy với bất động sản và đầu tư công.", status: "Giả thuyết", tone: "accent" },
      { question: "Biến vĩ mô nào ảnh hưởng mạnh nhất?", answer: "Lãi suất, tín dụng, đầu tư công, giá hàng hóa và thương mại toàn cầu.", status: "Theo dõi", tone: "neutral" },
      { question: "Ngành đang hưởng lợi, bất lợi hay trung lập?", answer: "Trung lập đến hưởng lợi có điều kiện, cần thêm dữ liệu sản lượng và biên lợi nhuận.", status: "Chưa chốt", tone: "warning" },
      { question: "Dữ liệu quan trọng nhất cần theo dõi?", answer: "Sản lượng tiêu thụ, tồn kho, giá quặng sắt/than cốc và biên lợi nhuận gộp.", status: "Ưu tiên", tone: "accent" },
      { question: "Có đủ cơ sở để chuyển sang lọc cổ phiếu chưa?", answer: "Có thể lọc thăm dò, nhưng cần gắn nhãn dữ liệu còn thiếu.", status: "Có điều kiện", tone: "success" },
    ],
  },
  journey: {
    title: "Lộ trình phân tích ngành",
    description: "Năm cụm lớn giúp đi từ hiểu ngành, nối vĩ mô, đọc dữ liệu, đến trạng thái ngành có điều kiện.",
    steps: blocks.map((block) => ({
      group:
        block.stepNumber <= 3
          ? "Hiểu ngành"
          : block.stepNumber <= 5
            ? "Nối ngành với vĩ mô"
            : block.stepNumber <= 15
              ? "Đọc dữ liệu và cạnh tranh"
              : "Tổng hợp nhận định",
      title: block.title,
      question: block.centralQuestion,
      status: block.stepNumber <= 4 ? "Đang làm" : "Cần kiểm tra thêm",
      linkedModule: block.moduleLinks[0] ?? "Ngành",
      details: block.details ?? block.dataToWatch,
    })),
  },
  blocks,
  insightPanel: {
    title: "Liên kết sang module sau",
    description: "Dữ liệu ngành chỉ hữu ích khi biết nó đi vào doanh nghiệp, BCTC, định giá và rủi ro ở đâu.",
    links: [
      { moduleName: "Vĩ mô", howItConnects: "Xác định biến kéo hoặc đè ngành.", nextCheck: "Quay lại khi lãi suất, tín dụng hoặc đầu tư công đổi hướng." },
      { moduleName: "Lọc cổ phiếu", howItConnects: "Dùng trạng thái ngành để lọc ứng viên có dữ liệu cần kiểm tra.", nextCheck: "Không lọc theo câu chuyện ngành nếu thiếu dữ liệu xác nhận." },
      { moduleName: "Hiểu doanh nghiệp", howItConnects: "So doanh nghiệp với chuỗi giá trị và profit pool của ngành.", nextCheck: "Kiểm tra doanh nghiệp nằm ở khâu nào." },
      { moduleName: "BCTC", howItConnects: "Đưa dữ liệu ngành vào doanh thu, giá vốn, tồn kho, dòng tiền.", nextCheck: "Đọc biên gộp, tồn kho và nợ vay." },
      { moduleName: "Định giá", howItConnects: "Điều chỉnh kịch bản doanh thu, biên lợi nhuận và chu kỳ.", nextCheck: "Tránh đọc P/E ngành chu kỳ máy móc." },
      { moduleName: "Rủi ro", howItConnects: "Chuyển rủi ro dư cung, đầu vào, chính sách và FOMO sang checklist rủi ro.", nextCheck: "Ghi điều kiện làm thesis ngành sai." },
    ],
  },
  tutor: {
    title: "Giải thích dễ hiểu trong module ngành",
    notes: [
      "Bạn đang phân tích ngành thép, hãy kiểm tra cả giá thép đầu ra và giá nguyên liệu đầu vào.",
      "Tin đầu tư công tích cực không có nghĩa mọi doanh nghiệp vật liệu xây dựng đều hưởng lợi ngay.",
      "Bạn nên kiểm tra xem kỳ vọng ngành đã phản ánh vào giá cổ phiếu chưa trước khi chuyển sang bước sau.",
    ],
  },
  disclaimer: {
    title: "Lưu ý cuối module",
    content:
      "Phân tích ngành chỉ giúp trả lời ngành kiếm tiền bằng cách nào, đang thuận lợi hay bất lợi, và dữ liệu nào cần kiểm chứng. Nó chưa đủ để kết luận ý tưởng phù hợp để đi tiếp. Trước khi chọn cổ phiếu, cần kiểm tra doanh nghiệp, BCTC, định giá và rủi ro.",
  },
  nextActions: {
    title: "Bạn đã đủ hiểu ngành để chuyển sang bước tiếp theo chưa?",
    description: "Chọn bước tiếp theo theo mức độ dữ liệu bạn đã kiểm chứng.",
    actions: [
      { label: "Chuyển sang Lọc cổ phiếu", variant: "primary" },
      { label: "Chuyển sang Hiểu doanh nghiệp", variant: "secondary" },
      { label: "Quay lại Vĩ mô", variant: "secondary" },
      { label: "Ghi chú điểm cần kiểm tra thêm", variant: "ghost" },
    ],
  },
};

// Legacy named exports kept for older, unused components.
export const industryOverviewData = {
  eyebrow: "Chương 3",
  icon: "▤",
  title: "Ngành Thép",
  description: "Module ngành đã được nâng cấp sang lộ trình phân tích.",
  sectionTitle: "Tổng quan ngành",
  sectionIcon: "A",
  items: [],
};
export const industryHealthData = {
  title: "Sức khỏe ngành",
  icon: "H",
  status: "Trung lập",
  statusType: "neutral" as const,
  score: 58,
  scoreUnit: "/100",
  explanation: "Dữ liệu mẫu legacy.",
  metricLabels: { status: "Trạng thái", scale: "Cách đọc" },
  scaleValue: "0-100",
};
export const industryImpactFactorsData = { title: "Yếu tố tác động", icon: "I", factors: [] };
export const industryOutlookData = {
  title: "Triển vọng",
  icon: "O",
  tone: "neutral" as const,
  label: "Trung lập",
  reasonsTitle: "Lý do",
  watchItemsTitle: "Theo dõi",
  reasons: [],
  watchItems: [],
};
export const industryBeneficiariesData = {
  title: "Nhóm tác động",
  icon: "B",
  beneficiariesTitle: "Nhóm hưởng lợi",
  disadvantagedTitle: "Nhóm bất lợi",
  beneficiaries: [],
  disadvantaged: [],
};
export const representativeStocksData = {
  title: "Cổ phiếu tiêu biểu",
  icon: "S",
  caption: "Cổ phiếu tiêu biểu",
  columns: { ticker: "Mã", category: "Vai trò", rationale: "Lý do", riskNote: "Lưu ý" },
  stocks: [],
};
export const industryDeepDiveData = {
  title: "Phân tích chuyên sâu",
  icon: "D",
  triggerLabel: "Xem chi tiết",
  sections: [],
  dataTable: {
    title: "Dữ liệu",
    icon: "K",
    columns: { category: "Nhóm", dataPoint: "Dữ liệu", whyItMatters: "Ý nghĩa" },
    rows: [],
  },
};
