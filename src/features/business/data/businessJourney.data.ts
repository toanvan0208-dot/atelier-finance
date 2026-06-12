import type { BusinessJourneyData } from "../types";

export const businessJourneyByTicker: Record<string, BusinessJourneyData> = {
  MWG: {
    isLoading: false,
    loading: {
      title: "Đang chuẩn bị hồ sơ hiểu doanh nghiệp",
      description: "Hệ thống đang gom dữ liệu mô hình kinh doanh để dẫn bạn qua từng câu hỏi.",
    },
    emptyState: {
      title: "Chưa có dữ liệu mô hình kinh doanh cho mã này",
      description: "Prototype hiện có dữ liệu mẫu MWG. Hãy chọn MWG hoặc bỏ ticker trên URL để xem luồng minh họa.",
      icon: "DN",
    },
    businessIdentity: {
      id: "identity",
      ticker: "MWG",
      companyName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
      businessType: "Bán lẻ chuỗi",
      simpleDescription:
        "MWG là doanh nghiệp bán lẻ chuỗi, kiếm tiền bằng cách bán điện thoại, điện máy và hàng tiêu dùng cho khách hàng cá nhân thông qua cửa hàng và online.",
      modelTags: ["Bán lẻ chuỗi", "Phụ thuộc sức mua", "Cần vận hành hiệu quả"],
      cycleType: "Nhạy với sức mua và cạnh tranh giá, không phải mô hình phòng thủ tuyệt đối.",
      coreMessage:
        "Cốt lõi của MWG không chỉ là bán được hàng, mà là vận hành chuỗi đủ hiệu quả để cửa hàng, tồn kho, nhân viên và trải nghiệm mua hàng cùng tạo ra lợi nhuận.",
      question: "Doanh nghiệp này là ai?",
      shortExplanation: "Trước khi đọc số, cần biết công ty thuộc kiểu mô hình nào và sống bằng hoạt động gì.",
      example:
        "Với MWG, câu trả lời ngắn là: một chuỗi bán lẻ lớn, lấy quy mô, thương hiệu và năng lực vận hành làm trung tâm.",
      practicalConclusion:
        "Nếu không hiểu cách chuỗi bán lẻ vận hành, bạn sẽ dễ nhầm doanh thu lớn với doanh nghiệp mạnh.",
      beginnerRemember: "Hãy nói lại bằng một câu: MWG bán gì, bán cho ai và điều gì làm mô hình này sống được.",
      deepDive: {
        title: "Bản chất mô hình bán lẻ chuỗi",
        plainLanguage:
          "Một chuỗi bán lẻ tốt phải vừa kéo khách vào cửa hàng, vừa kiểm soát hàng tồn, mặt bằng, nhân viên và trải nghiệm mua hàng.",
        checklist: [
          "Doanh nghiệp kiếm tiền từ hoạt động chính hay từ câu chuyện phụ?",
          "Mô hình này phụ thuộc sức mua, chính sách, chu kỳ hàng hóa hay năng lực vận hành?",
          "Nếu quy mô tăng, mô hình dễ hơn hay khó kiểm soát hơn?",
        ],
        realWorldSignals: [
          "Cửa hàng đông khách hay vắng hơn trước.",
          "Khách còn nhắc đến thương hiệu khi cần mua đồ công nghệ hoặc điện máy.",
          "Chuỗi mới mở ra có tạo cảm giác rõ ràng hay dàn trải.",
        ],
        verifyIn: ["Báo cáo tài chính", "Phân tích ngành"],
      },
    },
    customers: {
      id: "customers",
      question: "Ai trả tiền và vì sao họ mua?",
      shortExplanation: "Doanh thu có chất lượng hơn khi bạn hiểu người trả tiền là ai và lý do họ chọn công ty.",
      mainCustomers: ["Người tiêu dùng cá nhân", "Hộ gia đình", "Khách cần mua nhanh, có bảo hành và nơi bán đáng tin"],
      whatTheyBuy: ["Điện thoại", "Laptop", "Điện máy", "Phụ kiện", "Hàng tiêu dùng qua chuỗi liên quan"],
      whyTheyBuy: ["Tiện vị trí", "Quen thương hiệu", "Dễ đổi trả và bảo hành", "Có nhiều lựa chọn", "Cảm giác an tâm hơn cửa hàng nhỏ lẻ"],
      repeatBehavior:
        "Khách có thể quay lại khi đổi điện thoại, mua đồ điện máy, mua phụ kiện hoặc dùng các chuỗi khác trong hệ sinh thái.",
      priceSensitivity:
        "Khách vẫn nhạy với giá. Nếu chênh lệch quá lớn, họ có thể chuyển sang cửa hàng khác hoặc kênh online.",
      example:
        "Khách mua ở MWG không chỉ vì sản phẩm, mà vì tiện, quen, dễ bảo hành và cảm giác ít rủi ro hơn.",
      practicalConclusion:
        "Nếu khách mua vì thương hiệu, tiện lợi và niềm tin, doanh thu bền hơn. Nếu khách mua chỉ vì giá rẻ, công ty dễ bị ép giảm lợi nhuận.",
      beginnerRemember: "Đừng chỉ hỏi công ty bán gì. Hãy hỏi vì sao khách chịu trả tiền cho công ty này.",
      deepDive: {
        title: "Chất lượng nhu cầu của khách hàng",
        plainLanguage:
          "Một doanh nghiệp tốt thường có lý do để khách quay lại mà không cần giảm giá quá nhiều.",
        checklist: [
          "Khách mua vì cần thiết, vì thương hiệu, vì tiện lợi hay chỉ vì khuyến mãi?",
          "Công ty có tăng giá mà khách vẫn mua không?",
          "Khách có mua lặp lại hay chỉ mua một lần rồi thôi?",
        ],
        realWorldSignals: [
          "Mức độ khuyến mãi trên cửa hàng và online.",
          "Khách còn ưu tiên cửa hàng lớn khi mua sản phẩm giá trị cao.",
          "Đánh giá bảo hành, đổi trả và trải nghiệm nhân viên.",
        ],
        verifyIn: ["Phân tích ngành", "Tin tức / sự kiện"],
      },
    },
    moneyMachine: {
      id: "money-machine",
      question: "Cỗ máy kiếm tiền vận hành như thế nào?",
      shortExplanation: "Biến doanh nghiệp thành một dòng chảy dễ hiểu: đầu vào, vận hành, bán hàng, thu tiền, mở rộng.",
      inputs: ["Hàng từ nhà cung cấp", "Mặt bằng", "Nhân viên bán hàng", "Hệ thống quản lý tồn kho", "Vốn lưu động"],
      operations: ["Kiểm soát cửa hàng", "Quản lý tồn kho", "Đào tạo nhân viên", "Giữ trải nghiệm mua hàng ổn định"],
      salesChannels: ["Cửa hàng", "Online", "Dịch vụ kèm theo"],
      cashCollection: ["Chủ yếu thu tiền trực tiếp từ khách hàng cá nhân", "Một phần có thể đi qua trả góp hoặc đối tác thanh toán"],
      expansionMethod: ["Mở thêm chuỗi", "Tối ưu cửa hàng hiện hữu", "Mở ngành hàng mới", "Tăng hiệu quả online"],
      bottlenecks: ["Tồn kho", "Chi phí mặt bằng", "Sức mua yếu", "Cạnh tranh giá", "Chuỗi mới chưa đủ hiệu quả"],
      example:
        "MWG nhập hàng, đưa vào cửa hàng hoặc online, bán cho khách cá nhân, thu tiền rồi phải kiểm soát tồn kho, mặt bằng và nhân viên để còn lại lợi nhuận.",
      practicalConclusion:
        "Mô hình này tốt lên khi chuỗi vận hành mượt. Nó xấu đi khi hàng tồn, chi phí và cửa hàng kém hiệu quả ăn hết phần còn lại.",
      beginnerRemember: "Hãy nhìn MWG như một hệ thống cửa hàng cần chạy đều, không phải chỉ là một nơi bán điện thoại.",
      deepDive: {
        title: "Điểm nghẽn trong cỗ máy vận hành",
        plainLanguage:
          "Một khâu nhỏ bị kẹt có thể làm cả chuỗi yếu đi: hàng nhập sai, cửa hàng vắng, nhân viên yếu hoặc khách chuyển kênh mua.",
        checklist: [
          "Khâu nào khó nhất để mở rộng mà không giảm chất lượng?",
          "Muốn lớn hơn, công ty cần thêm cửa hàng, thêm sản phẩm hay vận hành tốt hơn?",
          "Nếu sức mua yếu, khâu nào chịu áp lực đầu tiên?",
        ],
        realWorldSignals: [
          "Cửa hàng đóng, mở hoặc đổi mô hình nhiều.",
          "Hàng khuyến mãi sâu bất thường.",
          "Khách chuyển sang mua online hoặc sàn thương mại điện tử nhiều hơn.",
        ],
        verifyIn: ["Báo cáo tài chính", "Rủi ro"],
      },
    },
    competitiveAdvantage: {
      id: "advantage",
      question: "Công ty mạnh ở đâu và lợi thế đó có thật không?",
      shortExplanation: "Không chỉ liệt kê điểm mạnh. Cần biết lợi thế đó tạo tiền bằng cách nào và phải nghi ngờ điều gì.",
      advantages: [
        {
          advantageName: "Mạng lưới cửa hàng rộng",
          howItCreatesMoney: "Giúp tiếp cận khách nhanh, tăng nhận diện và làm việc mua hàng thuận tiện hơn.",
          whatToQuestion: "Nếu cửa hàng kém hiệu quả, mạng lưới rộng trở thành chi phí lớn.",
          durabilityLevel: "Cần kiểm chứng",
        },
        {
          advantageName: "Thương hiệu quen thuộc",
          howItCreatesMoney: "Khách tin hơn, dễ mua hơn và ít phải chọn cửa hàng nhỏ lẻ.",
          whatToQuestion: "Thương hiệu có còn mạnh với thế hệ khách hàng mới và kênh online không?",
          durabilityLevel: "Tương đối bền",
        },
        {
          advantageName: "Quy mô lớn",
          howItCreatesMoney: "Có thể đàm phán tốt hơn với nhà cung cấp và chia sẻ chi phí hệ thống.",
          whatToQuestion: "Quy mô lớn có làm bộ máy cồng kềnh hoặc phản ứng chậm hơn không?",
          durabilityLevel: "Cần kiểm chứng",
        },
      ],
      example:
        "Thương hiệu và mạng lưới giúp MWG dễ tiếp cận khách hàng, nhưng chỉ là lợi thế nếu mỗi cửa hàng tạo đủ kết quả để bù chi phí.",
      practicalConclusion:
        "Lợi thế chỉ đáng tin khi nó giúp công ty kiếm tiền tốt hơn hoặc chịu đựng cạnh tranh tốt hơn.",
      beginnerRemember: "Mỗi khi nghe nói công ty có lợi thế, hãy hỏi: lợi thế này tạo tiền bằng cách nào?",
      deepDive: {
        title: "Cách kiểm tra lợi thế có thật",
        plainLanguage:
          "Lợi thế thật thường làm khách chọn công ty dễ hơn, giúp công ty đỡ phải giảm giá hoặc giúp vận hành rẻ hơn đối thủ.",
        checklist: [
          "Đối thủ có sao chép lợi thế này dễ không?",
          "Lợi thế nằm ở thương hiệu, vị trí, dữ liệu, quan hệ hay hệ thống vận hành?",
          "Nếu ngành khó khăn, lợi thế này giúp công ty trụ tốt hơn không?",
        ],
        realWorldSignals: [
          "Khách vẫn chọn thương hiệu dù không rẻ nhất.",
          "Đối thủ mở rộng nhưng không kéo được khách tương tự.",
          "Công ty giữ trải nghiệm ổn định khi quy mô lớn hơn.",
        ],
        verifyIn: ["Phân tích ngành", "Báo cáo tài chính", "Rủi ro"],
      },
    },
    strategyAndLeadership: {
      id: "strategy",
      question: "Ban lãnh đạo đang đưa công ty đi đâu?",
      shortExplanation: "Chiến lược không nên đọc như khẩu hiệu. Hãy biến nó thành câu hỏi kiểm chứng.",
      strategicDirection: ["Tối ưu chuỗi hiện hữu", "Mở rộng ngành hàng và chuỗi mới", "Tăng vai trò online", "Cải thiện hiệu quả vận hành"],
      executionCapability: [
        "Có kinh nghiệm vận hành chuỗi lớn.",
        "Có khả năng thử nghiệm mô hình mới.",
        "Thử nghiệm mới cần kỷ luật vì mỗi chuỗi có bài toán vận hành khác nhau.",
      ],
      capitalAllocationNotes: [
        "Cần xem tiền được dùng để mở rộng có tạo hiệu quả thật không.",
        "Mở rộng quá nhanh có thể làm tăng độ phức tạp trước khi tạo kết quả.",
      ],
      leadershipConcerns: [
        "Mảng mới có thể khác năng lực lõi ban đầu.",
        "Chi phí thử nghiệm có thể kéo dài nếu chiến lược sai.",
        "Nhà đầu tư nhỏ cần theo dõi cam kết và hành động thực tế của lãnh đạo.",
      ],
      shareholderAlignment: "Cần kiểm tra thêm qua công bố chính thức, sở hữu lãnh đạo và cách công ty truyền thông với cổ đông.",
      example:
        "Nếu MWG mở rộng mạnh sang bán lẻ thực phẩm, cần hỏi công ty có đủ năng lực kiểm soát hao hụt, tồn kho và cửa hàng biên thấp không.",
      practicalConclusion:
        "Chiến lược tốt không phải câu chuyện hay. Nó phải phù hợp với năng lực lõi và được thực thi có kỷ luật.",
      beginnerRemember: "Đừng chỉ nghe công ty muốn tăng trưởng. Hãy hỏi họ tăng trưởng bằng cách nào và có làm nổi không.",
      deepDive: {
        title: "Biến chiến lược thành câu hỏi kiểm chứng",
        plainLanguage:
          "Một kế hoạch nghe hấp dẫn vẫn có thể sai nếu công ty không có năng lực vận hành hoặc dùng tiền quá dàn trải.",
        checklist: [
          "Chiến lược mới có gần với năng lực lõi không?",
          "Công ty có mở rộng quá nhanh so với khả năng quản trị không?",
          "Lợi ích của lãnh đạo và cổ đông nhỏ có đi cùng nhau không?",
        ],
        realWorldSignals: [
          "Tần suất thay đổi chiến lược hoặc đóng mở chuỗi.",
          "Lãnh đạo giải thích rõ sai lầm và cách sửa hay chỉ nói khẩu hiệu.",
          "Công ty có cắt bỏ thử nghiệm kém hiệu quả đúng lúc không.",
        ],
        verifyIn: ["Tin tức / sự kiện", "Rủi ro", "Báo cáo tài chính"],
      },
    },
    nonFinancialRisks: {
      id: "risks",
      question: "Rủi ro nào báo cáo tài chính chưa nói rõ?",
      shortExplanation: "Một số rủi ro xuất hiện ngoài đời trước khi hiện rõ trong số liệu.",
      risks: [
        {
          riskName: "Khách hàng đổi hành vi",
          riskType: "Khách hàng",
          whyItMatters: "Nếu khách chuyển mạnh sang online hoặc sàn, mạng lưới cửa hàng có thể bớt lợi thế.",
          realWorldSignals: ["Khách ít vào cửa hàng", "Đánh giá online xấu đi", "Sàn thương mại điện tử khuyến mãi mạnh"],
          severity: "Quan trọng",
          practicalConclusion: "Cần quan sát kênh mua của khách thay đổi nhanh hay chậm.",
        },
        {
          riskName: "Cạnh tranh giá",
          riskType: "Mô hình",
          whyItMatters: "Bán lẻ dễ bị kéo vào khuyến mãi nếu sản phẩm khó khác biệt.",
          realWorldSignals: ["Giảm giá kéo dài", "Đối thủ bán rẻ hơn", "Khách chờ khuyến mãi mới mua"],
          severity: "Cần theo dõi",
          practicalConclusion: "Nếu chỉ thắng bằng giá, lợi thế thương hiệu yếu đi.",
        },
        {
          riskName: "Mở rộng quá nhanh",
          riskType: "Vận hành",
          whyItMatters: "Chuỗi mới có thể làm tăng chi phí, tồn kho và độ phức tạp quản trị.",
          realWorldSignals: ["Mở điểm bán dày", "Đóng cửa hàng sau thử nghiệm", "Truyền thông thay đổi mục tiêu nhiều lần"],
          severity: "Quan trọng",
          practicalConclusion: "Tăng quy mô chỉ tốt khi năng lực vận hành theo kịp.",
        },
        {
          riskName: "Thương hiệu suy yếu",
          riskType: "Thương hiệu",
          whyItMatters: "Khi khách không còn tin hoặc không thấy khác biệt, công ty phải cạnh tranh nhiều hơn bằng giá.",
          realWorldSignals: ["Phàn nàn dịch vụ tăng", "Khách trẻ ít nhắc đến thương hiệu", "Trải nghiệm cửa hàng không đồng đều"],
          severity: "Cần theo dõi",
          practicalConclusion: "Thương hiệu phải được nhìn qua hành vi khách, không chỉ qua tên tuổi cũ.",
        },
      ],
      example:
        "Sức mua yếu, cạnh tranh giá, hành vi mua online và mở rộng quá nhanh là những rủi ro cần quan sát trước khi chúng hiện rõ trong số liệu.",
      practicalConclusion:
        "Đừng chờ báo cáo tài chính nói hết. Với bán lẻ, nhiều tín hiệu đến từ cửa hàng, khách hàng, đối thủ và cách công ty mở rộng.",
      beginnerRemember: "Rủi ro ngoài số liệu thường xuất hiện ở hành vi khách và vận hành cửa hàng trước.",
      deepDive: {
        title: "Bản đồ rủi ro ngoài số liệu",
        plainLanguage:
          "Bạn có thể phát hiện sớm bằng cách quan sát khách mua ở đâu, cửa hàng hoạt động ra sao và công ty có đổi chiến lược liên tục không.",
        checklist: [
          "Rủi ro đến từ khách hàng, mô hình, thương hiệu, vận hành hay chính sách?",
          "Rủi ro này có làm lợi thế cũ biến thành gánh nặng không?",
          "Tín hiệu ngoài đời nào có thể quan sát trước số liệu?",
        ],
        realWorldSignals: [
          "Cửa hàng vắng hơn dù khuyến mãi nhiều.",
          "Đối thủ online chiếm nhiều chú ý hơn.",
          "Công ty phải sửa chiến lược liên tục.",
        ],
        verifyIn: ["Rủi ro", "Tin tức / sự kiện", "Phân tích ngành"],
      },
    },
    bridgeToFinancialStatements: {
      title: "Tạm kết trước khi sang Báo cáo tài chính",
      businessUnderstandingSummary:
        "Tạm hiểu: MWG là mô hình bán lẻ chuỗi, có lợi thế về thương hiệu, quy mô và kinh nghiệm vận hành. Nhưng mô hình này nhạy với sức mua, chi phí mặt bằng, hiệu quả cửa hàng và tồn kho.",
      strengthsToVerify: ["Thương hiệu còn kéo khách", "Mạng lưới cửa hàng còn tạo hiệu quả", "Quy mô còn giúp vận hành tốt hơn"],
      weaknessesToVerify: ["Cửa hàng kém hiệu quả", "Chuỗi mới kéo chi phí", "Khách chuyển kênh mua nhanh hơn công ty thích nghi"],
      financialMetricsToCheck: [
        "Biên lợi nhuận gộp",
        "Vòng quay tồn kho",
        "Chi phí bán hàng",
        "Dòng tiền kinh doanh",
        "Hiệu quả cửa hàng nếu có dữ liệu",
      ],
      nextModuleSuggestion:
        "Sang Báo cáo tài chính để kiểm chứng các giả thuyết trên bằng số liệu, không dùng phần này để kết luận mua hoặc bán.",
    },
    beginnerSummary: [
      "MWG là chuỗi bán lẻ, không chỉ là công ty bán điện thoại.",
      "Khách trả tiền vì tiện, quen thương hiệu và cảm giác an tâm.",
      "Cỗ máy vận hành mạnh khi cửa hàng, tồn kho và nhân viên chạy hiệu quả.",
      "Lợi thế phải tạo tiền thật, nếu không chỉ là câu chuyện đẹp.",
      "Sang BCTC chỉ để kiểm chứng, không phải để đảo ngược mục tiêu của module này.",
    ],
  },
};

export const defaultBusinessJourneyTicker = "MWG";
