import type { LearningPageData } from "../types";

export const learningPageData: LearningPageData = {
  header: {
    eyebrow: "AI Learning Coach",
    title: "Học tập cá nhân",
    description:
      "Học đúng kiến thức cần dùng trong quá trình phân tích cổ phiếu. Hệ thống gợi ý bài học dựa trên module bạn đang dùng, lỗi sai gần đây và chủ đề còn yếu.",
  },
  todayLessonId: "cyclical-pe",
  stages: [
    {
      id: "financial-basics",
      title: "Mất gốc tài chính",
      description:
        "Hiểu cổ phiếu, doanh nghiệp, lợi nhuận và dòng tiền trước khi nhìn chỉ số.",
      relatedModules: ["Nền tảng đầu tư", "BCTC cơ bản"],
      progress: { completed: 2, total: 5 },
      status: "Đang học",
      lessonIds: ["stock-basics", "business-model", "profit-cashflow"],
    },
    {
      id: "self-awareness",
      title: "Hiểu bản thân",
      description:
        "Biết khẩu vị rủi ro, nhận diện FOMO và tránh hành động theo cảm xúc.",
      relatedModules: ["Hiểu bản thân", "Mô phỏng", "Rủi ro"],
      progress: { completed: 1, total: 4 },
      status: "Cần ôn",
      lessonIds: ["risk-appetite", "fomo"],
    },
    {
      id: "context-reading",
      title: "Đọc bối cảnh",
      description:
        "Hiểu cổ phiếu chịu ảnh hưởng từ lãi suất, tỷ giá, tín dụng, sức mua và chu kỳ ngành.",
      relatedModules: ["Vĩ mô", "Phân tích ngành", "Lọc cổ phiếu"],
      progress: { completed: 2, total: 6 },
      status: "Đang học",
      lessonIds: ["macro-sector", "good-sector-bad-stock"],
    },
    {
      id: "business-reading",
      title: "Đọc doanh nghiệp",
      description:
        "Hiểu công ty bán gì, khách hàng là ai, biên lợi nhuận đến từ đâu và lợi thế có bền không.",
      relatedModules: ["Hiểu doanh nghiệp", "Phân tích ngành", "BCTC"],
      progress: { completed: 1, total: 5 },
      status: "Chưa bắt đầu",
      lessonIds: ["business-model", "customer-dependence"],
    },
    {
      id: "valuation-and-reports",
      title: "Đọc báo cáo & định giá",
      description:
        "Không bị lừa bởi lợi nhuận đẹp, P/E thấp, câu chuyện tăng trưởng hoặc định giá rẻ giả.",
      relatedModules: ["BCTC", "Định giá", "PVT", "Lọc cổ phiếu"],
      progress: { completed: 1, total: 6 },
      status: "Cần ôn",
      lessonIds: ["profit-cashflow", "value-trap", "cyclical-pe"],
    },
    {
      id: "portfolio-operator",
      title: "Vận hành như quỹ nhỏ",
      description:
        "Biến kiến thức thành quy trình có kỷ luật: watchlist, rủi ro, mô phỏng, checklist và hậu kiểm.",
      relatedModules: ["Watchlist", "Rủi ro", "Mô phỏng", "Checklist"],
      progress: { completed: 1, total: 5 },
      status: "Chưa bắt đầu",
      lessonIds: ["watchlist-purpose", "process-vs-luck"],
    },
  ],
  lessons: [
    {
      id: "stock-basics",
      title: "Cổ phiếu là gì?",
      duration: "4 phút",
      level: "Cơ bản",
      stageId: "financial-basics",
      relatedModules: ["Nền tảng đầu tư", "Watchlist"],
      status: "Đã học",
      problemSolved:
        "Hiểu cổ phiếu là quyền sở hữu một phần doanh nghiệp, không phải vé đoán giá.",
      whySuggested:
        "Bạn cần nền tảng này trước khi đọc doanh nghiệp hoặc tạo watchlist.",
      outcome: "Biết phân biệt cổ phiếu, doanh nghiệp và biến động giá ngắn hạn.",
      concept: "Cổ phiếu đại diện cho một phần quyền sở hữu trong doanh nghiệp.",
      simpleExplanation:
        "Khi sở hữu cổ phiếu, bạn đang sở hữu một phần rất nhỏ của công ty, nên cần hiểu công ty đó làm ăn ra sao.",
      usedInModule: "Watchlist, Hiểu doanh nghiệp, Mô phỏng.",
      realExample:
        "Nếu theo dõi MWG, bạn không chỉ nhìn giá MWG mà cần hiểu chuỗi bán lẻ kiếm tiền như thế nào.",
      commonMistake: "Xem cổ phiếu như mã để lướt giá mà quên doanh nghiệp phía sau.",
      dataToCheck: ["Doanh thu", "Lợi nhuận", "Dòng tiền", "Ngành kinh doanh"],
      quiz: {
        question: "Cổ phiếu đại diện cho điều gì?",
        answer: "Một phần quyền sở hữu doanh nghiệp.",
      },
    },
    {
      id: "business-model",
      title: "Doanh nghiệp kiếm tiền bằng cách nào?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "business-reading",
      relatedModules: ["Hiểu doanh nghiệp", "BCTC"],
      status: "Đang học",
      problemSolved:
        "Biết nhìn nguồn doanh thu và chi phí trước khi xem chỉ số.",
      whySuggested:
        "Bạn đang phân tích doanh nghiệp nhưng chưa mô tả được hộp đen tạo tiền.",
      outcome: "Nói được công ty bán gì, bán cho ai và kiếm lợi nhuận từ đâu.",
      concept: "Mô hình kinh doanh là cách công ty tạo doanh thu và lợi nhuận.",
      simpleExplanation:
        "Trước khi hỏi cổ phiếu có hấp dẫn không, hãy hỏi công ty bán gì và vì sao khách hàng trả tiền.",
      usedInModule: "Hiểu doanh nghiệp, BCTC, Lọc cổ phiếu.",
      realExample:
        "Một chuỗi bán lẻ kiếm tiền từ doanh thu cửa hàng, biên lợi nhuận sản phẩm và hiệu quả vận hành.",
      commonMistake: "Nhìn tăng trưởng doanh thu nhưng không hiểu chi phí đi kèm.",
      dataToCheck: ["Nguồn doanh thu", "Biên lợi nhuận", "Chi phí chính", "Khách hàng"],
      quiz: {
        question: "Vì sao phải hiểu mô hình kinh doanh trước khi xem định giá?",
        answer: "Vì định giá chỉ có ý nghĩa khi hiểu dòng tiền đến từ đâu và có bền không.",
      },
    },
    {
      id: "profit-cashflow",
      title: "Lợi nhuận khác dòng tiền như thế nào?",
      duration: "6 phút",
      level: "Cơ bản",
      stageId: "valuation-and-reports",
      relatedModules: ["BCTC", "Rủi ro", "Định giá"],
      status: "Cần ôn lại",
      problemSolved:
        "Tránh nhầm doanh nghiệp có lãi là đã có tiền thật.",
      whySuggested:
        "Bạn từng kết luận doanh nghiệp khỏe chỉ vì lợi nhuận tăng, nhưng chưa kiểm tra CFO.",
      outcome: "Biết kiểm tra lợi nhuận có chuyển thành tiền thật không.",
      concept: "Lợi nhuận là kết quả kế toán; dòng tiền cho biết tiền thật đi vào và đi ra.",
      simpleExplanation:
        "Một công ty có thể báo lãi nhưng chưa thu được tiền nếu bán chịu nhiều hoặc tồn kho tăng.",
      usedInModule: "BCTC, Rủi ro, Định giá.",
      realExample:
        "Doanh thu tăng 25%, lợi nhuận tăng 20%, nhưng CFO âm và phải thu tăng mạnh thì cần thận trọng.",
      commonMistake: "Chỉ nhìn lợi nhuận sau thuế mà bỏ qua dòng tiền hoạt động.",
      dataToCheck: ["CFO", "Khoản phải thu", "Tồn kho", "Biên gộp"],
      quiz: {
        question: "Lợi nhuận tăng nhưng CFO âm thì nên kiểm tra gì?",
        answer: "Khoản phải thu, tồn kho, chất lượng doanh thu và dòng tiền hoạt động.",
      },
      miniCase: {
        prompt:
          "Một doanh nghiệp báo lợi nhuận tăng 20%, nhưng CFO âm 2 quý liên tiếp. Bạn có kết luận doanh nghiệp khỏe ngay không?",
        goodAnswer:
          "Không. Cần kiểm tra tiền có thu được không, phải thu có tăng bất thường không và tồn kho có bị đẩy lên không.",
      },
    },
    {
      id: "risk-appetite",
      title: "Khẩu vị rủi ro là gì?",
      duration: "4 phút",
      level: "Cơ bản",
      stageId: "self-awareness",
      relatedModules: ["Hiểu bản thân", "Mô phỏng", "Rủi ro"],
      status: "Chưa học",
      problemSolved:
        "Biết mức biến động mình chịu được trước khi theo dõi cổ phiếu.",
      whySuggested:
        "Bạn thường thay đổi kế hoạch khi giá biến động mạnh.",
      outcome: "Biết chọn bài phân tích phù hợp với khả năng chịu rủi ro.",
      concept: "Khẩu vị rủi ro là mức thua lỗ, biến động và bất định bạn chịu được.",
      simpleExplanation:
        "Nếu không chịu được biến động mạnh, bạn không nên bắt đầu bằng cổ phiếu quá chu kỳ hoặc quá khó hiểu.",
      usedInModule: "Hiểu bản thân, Rủi ro, Mô phỏng.",
      realExample:
        "Cổ phiếu dầu khí có thể biến động mạnh theo giá dầu, không phù hợp nếu bạn dễ hoảng khi giá giảm.",
      commonMistake: "Nói mình chịu rủi ro cao nhưng bán tháo khi giá giảm nhẹ.",
      dataToCheck: ["Biến động giá", "Thanh khoản", "Rủi ro ngành", "Điểm sai của thesis"],
      quiz: {
        question: "Khẩu vị rủi ro giúp bạn quyết định điều gì?",
        answer: "Giúp chọn mức độ phức tạp và biến động phù hợp trước khi phân tích sâu.",
      },
    },
    {
      id: "fomo",
      title: "FOMO ảnh hưởng quyết định thế nào?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "self-awareness",
      relatedModules: ["PVT", "Mô phỏng", "Nhật ký"],
      status: "AI gợi ý",
      problemSolved:
        "Nhận ra lúc nào mình phản ứng vì đám đông thay vì dữ liệu.",
      whySuggested:
        "Bạn vừa muốn theo dõi một mã chỉ vì giá tăng mạnh và nhiều người nhắc đến.",
      outcome: "Biết dừng lại và viết lý do phân tích trước khi thêm mã vào watchlist.",
      concept: "FOMO là nỗi sợ bỏ lỡ khiến bạn hành động khi chưa đủ dữ liệu.",
      simpleExplanation:
        "Nếu lý do duy nhất là nhiều người đang nói về mã đó, bạn chưa có thesis.",
      usedInModule: "PVT, Watchlist, Mô phỏng, Nhật ký.",
      realExample:
        "Một mã tăng trần nhiều phiên không đồng nghĩa doanh nghiệp tốt hơn hoặc định giá còn hợp lý.",
      commonMistake: "Vào watchlist vì đám đông, sau đó mới tìm lý do để hợp thức hóa.",
      dataToCheck: ["Lý do theo dõi", "Sự kiện", "Thanh khoản", "Rủi ro sai thesis"],
      quiz: {
        question: "Dấu hiệu nào cho thấy bạn đang FOMO?",
        answer: "Bạn muốn hành động nhanh nhưng chưa viết được lý do phân tích và dữ liệu cần kiểm tra.",
      },
    },
    {
      id: "macro-sector",
      title: "Vĩ mô ảnh hưởng ngành như thế nào?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "context-reading",
      relatedModules: ["Vĩ mô", "Ngành"],
      status: "AI gợi ý",
      problemSolved:
        "Nối lãi suất, tỷ giá, tín dụng, đầu tư công với nhóm ngành liên quan.",
      whySuggested:
        "Bạn đang đọc dữ liệu vĩ mô nhưng chưa nối được sang ngành hưởng lợi hoặc chịu áp lực.",
      outcome: "Biết biến vĩ mô nào cần theo dõi cho từng nhóm ngành.",
      concept: "Vĩ mô là bối cảnh tác động đến doanh thu, chi phí và kỳ vọng của ngành.",
      simpleExplanation:
        "Lãi suất, tỷ giá hay tín dụng không tác động giống nhau đến mọi doanh nghiệp.",
      usedInModule: "Vĩ mô, Phân tích ngành, Lọc cổ phiếu.",
      realExample:
        "Lãi suất giảm có thể hỗ trợ tiêu dùng, bất động sản hoặc chứng khoán, nhưng cần kiểm tra từng ngành.",
      commonMistake: "Thấy vĩ mô tốt rồi kết luận mọi cổ phiếu đều thuận lợi.",
      dataToCheck: ["Lãi suất", "Tín dụng", "Tỷ giá", "Sức mua", "Đầu tư công"],
      quiz: {
        question: "Vĩ mô tốt có đồng nghĩa mọi ngành đều tốt không?",
        answer: "Không. Cần xem biến vĩ mô đó tác động đến ngành nào và doanh nghiệp nào.",
      },
    },
    {
      id: "good-sector-bad-stock",
      title: "Ngành thuận lợi chưa chắc doanh nghiệp phù hợp vì sao?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "context-reading",
      relatedModules: ["Ngành", "Hiểu doanh nghiệp", "Watchlist"],
      status: "AI gợi ý",
      problemSolved:
        "Tránh suy luận từ ngành sang doanh nghiệp khi chưa có dữ liệu xác nhận.",
      whySuggested:
        "Bạn đang chọn mã từ một ngành có câu chuyện tốt nhưng chưa kiểm tra doanh nghiệp cụ thể.",
      outcome: "Biết tách luận điểm ngành khỏi chất lượng doanh nghiệp.",
      concept: "Một ngành có gió thuận nhưng từng doanh nghiệp vẫn có thể yếu.",
      simpleExplanation:
        "Ngành tốt là điều kiện hỗ trợ, không phải bảo chứng cho mọi cổ phiếu trong ngành.",
      usedInModule: "Phân tích ngành, Lọc cổ phiếu, Watchlist.",
      realExample:
        "Bán lẻ phục hồi không có nghĩa mọi chuỗi bán lẻ đều có tồn kho tốt và biên lợi nhuận tốt.",
      commonMistake: "Chọn mã theo dõi chỉ vì ngành đang được nhắc đến nhiều.",
      dataToCheck: ["Thị phần", "Biên lợi nhuận", "Tồn kho", "Dòng tiền", "Quản trị"],
      quiz: {
        question: "Sau khi xác định ngành thuận lợi, cần kiểm tra tiếp điều gì?",
        answer: "Doanh nghiệp cụ thể có hưởng lợi thật không và dữ liệu tài chính có xác nhận không.",
      },
    },
    {
      id: "value-trap",
      title: "Value trap là gì?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "valuation-and-reports",
      relatedModules: ["Định giá", "Rủi ro"],
      status: "AI gợi ý",
      problemSolved:
        "Tránh kết luận cổ phiếu rẻ khi doanh nghiệp có vấn đề chất lượng.",
      whySuggested:
        "Bạn có xu hướng xem P/E thấp là rẻ nhưng chưa kiểm tra vì sao thị trường trả giá thấp.",
      outcome: "Biết khi nào giá rẻ có thể là bẫy thay vì cơ hội.",
      concept: "Value trap là cổ phiếu nhìn rẻ nhưng rẻ vì chất lượng hoặc triển vọng xấu.",
      simpleExplanation:
        "Một món hàng giảm giá không phải lúc nào cũng phù hợp; có thể nó bị lỗi.",
      usedInModule: "Định giá, Rủi ro, Watchlist.",
      realExample:
        "P/E thấp nhưng lợi nhuận đang giảm, nợ tăng và dòng tiền yếu thì cần thận trọng.",
      commonMistake: "Thấy P/E thấp rồi kết luận định giá hấp dẫn.",
      dataToCheck: ["Tăng trưởng lợi nhuận", "CFO", "Nợ vay", "Biên lợi nhuận", "Triển vọng ngành"],
      quiz: {
        question: "P/E thấp có luôn là cơ hội không?",
        answer: "Không. Cần kiểm tra chất lượng lợi nhuận, triển vọng và rủi ro doanh nghiệp.",
      },
    },
    {
      id: "cyclical-pe",
      title: "P/E ngành chu kỳ vì sao dễ gây hiểu nhầm?",
      duration: "6 phút",
      level: "Cơ bản",
      stageId: "valuation-and-reports",
      relatedModules: ["Định giá", "Lọc cổ phiếu", "Watchlist"],
      status: "AI gợi ý",
      problemSolved:
        "Tránh hiểu nhầm P/E thấp là rẻ ở ngành chu kỳ.",
      whySuggested:
        "Bạn đang xem cổ phiếu ngành thép và có dấu hiệu kết luận dựa trên P/E thấp.",
      outcome:
        "Biết phân biệt P/E thấp do rẻ thật và P/E thấp do lợi nhuận đang ở đỉnh chu kỳ.",
      concept:
        "Ở ngành chu kỳ, lợi nhuận có thể tăng mạnh ở đỉnh chu kỳ, làm P/E nhìn thấp bất thường.",
      simpleExplanation:
        "Mẫu số của P/E là lợi nhuận. Nếu lợi nhuận đang cao bất thường, P/E thấp có thể đánh lừa bạn.",
      usedInModule: "Định giá, Lọc cổ phiếu, Watchlist, Rủi ro.",
      realExample:
        "Doanh nghiệp thép có thể có P/E thấp khi giá thép và biên lợi nhuận đang ở mức rất cao.",
      commonMistake:
        "Thấy P/E thấp ở ngành chu kỳ rồi nghĩ cổ phiếu rẻ mà không kiểm tra pha chu kỳ.",
      dataToCheck: ["Lợi nhuận theo chu kỳ", "Biên lợi nhuận", "Giá nguyên liệu", "Tồn kho", "CFO"],
      quiz: {
        question: "P/E thấp ở ngành chu kỳ cần kiểm tra gì trước?",
        answer: "Cần kiểm tra lợi nhuận có đang ở đỉnh chu kỳ không và biên lợi nhuận có bền không.",
      },
      miniCase: {
        prompt:
          "Một cổ phiếu thép có P/E 6 lần sau giai đoạn lợi nhuận tăng mạnh. Bạn có gọi là rẻ ngay không?",
        goodAnswer:
          "Không. Cần kiểm tra giá thép, biên lợi nhuận, tồn kho, nhu cầu xây dựng và lợi nhuận bình thường qua chu kỳ.",
      },
    },
    {
      id: "customer-dependence",
      title: "Phụ thuộc khách hàng lớn có rủi ro gì?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "business-reading",
      relatedModules: ["Hiểu doanh nghiệp", "Rủi ro"],
      status: "Chưa học",
      problemSolved:
        "Nhận ra doanh thu tăng có thể kém bền nếu phụ thuộc ít khách hàng.",
      whySuggested:
        "Bạn đang đọc doanh thu tăng nhưng chưa kiểm tra cơ cấu khách hàng.",
      outcome: "Biết hỏi doanh thu đến từ ai và có dễ mất không.",
      concept: "Phụ thuộc khách hàng lớn là khi một vài khách hàng chiếm tỷ trọng doanh thu lớn.",
      simpleExplanation:
        "Nếu một khách hàng lớn rời đi, doanh thu và lợi nhuận có thể giảm mạnh.",
      usedInModule: "Hiểu doanh nghiệp, Rủi ro, BCTC.",
      realExample:
        "Doanh nghiệp xuất khẩu phụ thuộc một khách hàng lớn có thể bị ảnh hưởng mạnh khi đơn hàng giảm.",
      commonMistake: "Chỉ nhìn tăng trưởng doanh thu mà không xem độ tập trung khách hàng.",
      dataToCheck: ["Cơ cấu khách hàng", "Doanh thu theo khách hàng", "Hợp đồng", "Biên lợi nhuận"],
      quiz: {
        question: "Vì sao phụ thuộc khách hàng lớn là rủi ro?",
        answer: "Vì mất khách hàng đó có thể làm doanh thu và lợi nhuận giảm mạnh.",
      },
    },
    {
      id: "watchlist-purpose",
      title: "Watchlist dùng để làm gì?",
      duration: "4 phút",
      level: "Cơ bản",
      stageId: "portfolio-operator",
      relatedModules: ["Watchlist", "Mô phỏng"],
      status: "Đã học",
      problemSolved:
        "Biết Watchlist là nơi quản lý ý tưởng cần kiểm chứng thêm.",
      whySuggested:
        "Bạn cần phân biệt theo dõi một mã và ra quyết định hành động.",
      outcome: "Biết ghi lý do theo dõi, dữ liệu cần kiểm tra và điều kiện sai.",
      concept: "Watchlist là danh sách ý tưởng đang theo dõi, không phải danh sách hành động.",
      simpleExplanation:
        "Một mã vào watchlist nghĩa là cần quan sát thêm, chưa phải kết luận cuối.",
      usedInModule: "Watchlist, Checklist, Mô phỏng.",
      realExample:
        "Thêm MWG vào watchlist để theo dõi sức mua, tồn kho và biên lợi nhuận trong vài quý tới.",
      commonMistake: "Thêm mã vào watchlist rồi xem như đã đủ lý do hành động.",
      dataToCheck: ["Lý do theo dõi", "Dữ liệu xác nhận", "Dữ liệu phủ định", "Thời điểm xem lại"],
      quiz: {
        question: "Watchlist có phải danh sách hành động không?",
        answer: "Không. Watchlist là nơi theo dõi ý tưởng và dữ liệu cần kiểm chứng.",
      },
    },
    {
      id: "process-vs-luck",
      title: "Đúng quy trình khác gì may mắn?",
      duration: "5 phút",
      level: "Cơ bản",
      stageId: "portfolio-operator",
      relatedModules: ["Mô phỏng", "Nhật ký", "Checklist"],
      status: "AI gợi ý",
      problemSolved:
        "Không nhầm kết quả lãi/lỗ ngắn hạn với chất lượng phân tích.",
      whySuggested:
        "Bạn vừa đánh giá một mô phỏng là đúng chỉ vì kết quả đang có lãi.",
      outcome: "Biết hậu kiểm quy trình thay vì chỉ nhìn kết quả.",
      concept: "Quy trình tốt là có giả thuyết, dữ liệu kiểm chứng và điểm sai rõ ràng.",
      simpleExplanation:
        "Một quyết định có thể lãi do may mắn hoặc lỗ dù quy trình đúng. Cần hậu kiểm cách nghĩ.",
      usedInModule: "Mô phỏng, Checklist, Nhật ký.",
      realExample:
        "Một mã tăng giá sau khi vào mô phỏng không chứng minh thesis đúng nếu catalyst không xảy ra.",
      commonMistake: "Thấy lãi thì nghĩ mình phân tích đúng, thấy lỗ thì nghĩ mình phân tích sai.",
      dataToCheck: ["Thesis ban đầu", "Dữ liệu xác nhận", "Dữ liệu phủ định", "Điểm sai"],
      quiz: {
        question: "Vì sao không nên đánh giá quy trình chỉ bằng kết quả lãi/lỗ?",
        answer: "Vì kết quả ngắn hạn có thể do may mắn hoặc nhiễu thị trường.",
      },
    },
  ],
  mistakes: [
    {
      id: "early-conclusion",
      title: "Kết luận quá sớm",
      signal:
        "Bạn nhìn thấy GDP tăng rồi kết luận mọi cổ phiếu đều hưởng lợi.",
      danger:
        "Vĩ mô thuận lợi không có nghĩa mọi ngành và mọi doanh nghiệp đều phù hợp để đi tiếp.",
      miniCase:
        "Ngành hưởng lợi nhưng doanh nghiệp yếu về dòng tiền thì có nên đưa vào nhóm ưu tiên không?",
      relatedLessonIds: ["macro-sector", "good-sector-bad-stock"],
      severity: "high",
    },
    {
      id: "valuation-misread",
      title: "Hiểu sai định giá",
      signal:
        "Kết luận P/E thấp là rẻ mà chưa kiểm tra chu kỳ lợi nhuận.",
      danger:
        "Có thể theo dõi đúng lúc lợi nhuận đang ở đỉnh và định giá nhìn rẻ giả.",
      miniCase:
        "Cổ phiếu thép có P/E thấp sau một năm lợi nhuận tăng đột biến. Bạn kiểm tra gì?",
      relatedLessonIds: ["cyclical-pe", "value-trap"],
      severity: "high",
    },
    {
      id: "cashflow-blind",
      title: "Bỏ qua dòng tiền",
      signal:
        "Chỉ nhìn lợi nhuận tăng mà không xem CFO, phải thu và tồn kho.",
      danger:
        "Lợi nhuận kế toán đẹp nhưng tiền thật yếu có thể là dấu hiệu rủi ro.",
      miniCase:
        "Lợi nhuận tăng nhưng CFO âm 2 quý liên tiếp. Bạn có kết luận doanh nghiệp khỏe không?",
      relatedLessonIds: ["profit-cashflow"],
      severity: "medium",
    },
    {
      id: "fomo",
      title: "FOMO",
      signal:
        "Muốn theo dõi một mã chỉ vì giá tăng mạnh và nhiều người nhắc đến.",
      danger:
        "Bạn dễ hợp thức hóa quyết định bằng lý do tìm sau, thay vì có thesis trước.",
      miniCase:
        "Một mã tăng mạnh 4 phiên nhưng bạn chưa biết catalyst là gì. Bạn làm gì trước?",
      relatedLessonIds: ["fomo", "watchlist-purpose"],
      severity: "medium",
    },
    {
      id: "process-vs-result",
      title: "Nhầm kết quả với quy trình",
      signal:
        "Mô phỏng đang lãi nên kết luận thesis chắc chắn đúng.",
      danger:
        "Kết quả ngắn hạn có thể do may mắn, không chứng minh chất lượng phân tích.",
      miniCase:
        "Một vị thế mô phỏng lãi nhưng dữ liệu xác nhận thesis chưa xuất hiện. Bạn đánh giá thế nào?",
      relatedLessonIds: ["process-vs-luck"],
      severity: "low",
    },
  ],
  profile: {
    level: "Người mới có nền tảng cơ bản",
    learnedTopics: ["Cổ phiếu là gì", "Watchlist dùng để làm gì", "P/E cơ bản"],
    weakTopics: ["Dòng tiền kinh doanh", "Value trap", "FOMO", "P/E ngành chu kỳ"],
    completedLessons: "8 bài",
    completedQuiz: "8 quiz",
    completedMiniCase: "2 mini case",
    personalNote:
      "Khi thấy một cổ phiếu có vẻ hấp dẫn, hãy viết rõ dữ liệu xác nhận và dữ liệu phủ định trước khi đi tiếp.",
    readiness: [
      {
        moduleName: "Vĩ mô",
        status: "Sẵn sàng dùng",
        reason: "Đã hiểu biến chính nhưng cần nối sang ngành cẩn thận.",
        recommendedLessonId: "macro-sector",
      },
      {
        moduleName: "Phân tích ngành",
        status: "Có thể dùng với hướng dẫn",
        reason: "Cần ôn thêm phần ngành thuận lợi chưa chắc doanh nghiệp phù hợp.",
        recommendedLessonId: "good-sector-bad-stock",
      },
      {
        moduleName: "Lọc cổ phiếu",
        status: "Có thể dùng với hướng dẫn",
        reason: "Đã hiểu kết quả lọc chỉ là ứng viên, nhưng còn dễ bị ảnh hưởng bởi mã nổi tiếng.",
        recommendedLessonId: "good-sector-bad-stock",
      },
      {
        moduleName: "BCTC",
        status: "Cần học thêm trước",
        reason: "Còn yếu ở dòng tiền hoạt động và khoản phải thu.",
        recommendedLessonId: "profit-cashflow",
      },
      {
        moduleName: "Định giá",
        status: "Cần học thêm trước",
        reason: "Còn yếu ở value trap và P/E ngành chu kỳ.",
        recommendedLessonId: "cyclical-pe",
      },
      {
        moduleName: "Watchlist",
        status: "Sẵn sàng dùng",
        reason: "Đã hiểu watchlist là nơi theo dõi ý tưởng, không phải kết luận hành động.",
        recommendedLessonId: "watchlist-purpose",
      },
      {
        moduleName: "Mô phỏng",
        status: "Có thể dùng với hướng dẫn",
        reason: "Đã biết thesis nhưng cần hậu kiểm quy trình rõ hơn.",
        recommendedLessonId: "process-vs-luck",
      },
      {
        moduleName: "Checklist",
        status: "Có thể dùng với hướng dẫn",
        reason: "Cần ghi rõ dữ liệu còn thiếu và điều kiện sai trước khi đi tiếp.",
        recommendedLessonId: "process-vs-luck",
      },
    ],
  },
};
