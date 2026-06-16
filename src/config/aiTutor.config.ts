export type AITutorLesson = {
  title: string;
  duration: string;
  usedIn: string;
  reason: string;
};

export type AITutorConfig = {
  moduleId: string;
  moduleName: string;
  currentGoal: string;
  whatThisStepDoes: string;
  questionsToCheck: string[];
  commonMistakes: string[];
  suggestedQuestions: string[];
  recommendedLessons: AITutorLesson[];
  nextActions: Array<{
    label: string;
    moduleKey: string;
    primary?: boolean;
  }>;
  softWarning: string;
};

const sharedNoSignalWarning =
  "AI Trợ giảng không đưa ra kết luận hành động. Hãy dùng phần này để kiểm tra dữ liệu, rủi ro và giả định trước khi tự kết luận.";

export const aiTutorConfig: Record<string, AITutorConfig> = {
  overview: {
    moduleId: "overview",
    moduleName: "Tổng quan",
    currentGoal: "Theo dõi toàn bộ lộ trình phân tích, học tập, watchlist, mô phỏng và checklist.",
    whatThisStepDoes: "Màn Tổng quan giúp bạn biết mình đang ở đâu, nên làm gì tiếp và còn thiếu dữ liệu gì.",
    questionsToCheck: [
      "Bạn đã thiết lập Hồ sơ phân tích hôm nay chưa?",
      "Có bài học nào nên học trước không?",
      "Có module nào còn thiếu dữ liệu không?",
      "Có cổ phiếu nào trong Watchlist thiếu thesis không?",
    ],
    commonMistakes: [
      "Nhảy thẳng vào cổ phiếu mà chưa biết lộ trình phân tích.",
      "Bỏ qua Hồ sơ phân tích nên hệ thống chưa biết nên giải thích ở mức nào.",
      "Tập trung vào giá mà chưa hiểu rủi ro.",
    ],
    suggestedQuestions: [
      "Tôi nên bắt đầu từ module nào?",
      "Vì sao cần Hồ sơ phân tích?",
      "Watchlist khác danh sách theo dõi dữ liệu như thế nào?",
    ],
    recommendedLessons: [
      { title: "Lộ trình phân tích cổ phiếu cho người mới", duration: "6 phút", usedIn: "Tổng quan, Hồ sơ phân tích", reason: "Giúp bạn biết thứ tự học, phân tích và kiểm tra." },
      { title: "Vì sao không nên hành động chỉ vì giá tăng?", duration: "4 phút", usedIn: "PVT, Watchlist", reason: "Giúp tránh FOMO khi thấy cổ phiếu tăng nóng." },
    ],
    nextActions: [
      { label: "Hồ sơ phân tích", moduleKey: "route-config", primary: true },
      { label: "Học bài nền tảng", moduleKey: "learning" },
      { label: "Bắt đầu Module Vĩ mô", moduleKey: "macro" },
    ],
    softWarning: sharedNoSignalWarning,
  },
  "route-config": {
    moduleId: "route-config",
    moduleName: "Hồ sơ phân tích",
    currentGoal: "Chọn mục tiêu hôm nay, cách đi qua hệ thống, mức AI giải thích và điểm đang vướng.",
    whatThisStepDoes: "Bước này tạo lộ trình cá nhân hóa để bạn biết nên học, phân tích, mô phỏng hoặc checklist theo thứ tự nào.",
    questionsToCheck: [
      "Hôm nay bạn muốn làm gì?",
      "Bạn muốn đi từng bước hay đi nhanh đến phần còn thiếu?",
      "Bạn muốn AI giải thích ở mức nào?",
      "Bạn đang vướng phần nào?",
      "Bạn đã có mã cổ phiếu hoặc ngành muốn phân tích chưa?",
    ],
    commonMistakes: [
      "Cố trả lời như một bài test đúng/sai.",
      "Chọn quá nhanh mà không nghĩ mình đang cần gì hôm nay.",
      "Nhảy sang cổ phiếu khi chưa biết cần kiểm tra dữ liệu nào.",
    ],
    suggestedQuestions: [
      "Tôi nên bắt đầu từ Vĩ mô hay từ cổ phiếu?",
      "Nếu tôi chưa biết gì thì chọn chế độ nào?",
      "Nếu tôi đã có mã cổ phiếu thì nên đi theo flow nào?",
      "Tại sao cần cấu hình mức AI giải thích?",
      "Tôi có nên mô phỏng trước khi dùng tiền thật không?",
    ],
    recommendedLessons: [
      { title: "Lộ trình phân tích cổ phiếu cho người mới", duration: "6 phút", usedIn: "Hồ sơ phân tích, Tổng quan", reason: "Giúp bạn hiểu hệ thống sẽ dẫn bạn đi qua các module nào." },
      { title: "Vì sao không nên hành động chỉ vì giá tăng?", duration: "4 phút", usedIn: "PVT, Watchlist", reason: "Giúp bạn tránh FOMO khi cấu hình có điểm vướng về cảm xúc." },
      { title: "Thesis đầu tư là gì?", duration: "5 phút", usedIn: "Watchlist, Mô phỏng", reason: "Giúp bạn biết cần viết gì trước khi theo dõi hoặc mô phỏng." },
      { title: "FOMO trong đầu tư là gì?", duration: "4 phút", usedIn: "Checklist, Mô phỏng", reason: "Giúp bạn nhận diện quyết định đến từ dữ liệu hay cảm xúc." },
    ],
    nextActions: [
      { label: "Mở Hồ sơ phân tích", moduleKey: "route-config", primary: true },
      { label: "Mở Module Học tập", moduleKey: "learning" },
      { label: "Bắt đầu Vĩ mô", moduleKey: "macro" },
    ],
    softWarning: "Không có câu trả lời đúng/sai ở đây. Hãy chọn mục tiêu gần nhất với nhu cầu hiện tại, bạn có thể chỉnh lại sau.",
  },
  learning: {
    moduleId: "learning",
    moduleName: "Học tập",
    currentGoal: "Học đúng kiến thức đang cần trong từng bước phân tích.",
    whatThisStepDoes: "Module Học tập đóng vai trò trợ giảng nền tảng, giúp bạn hiểu thuật ngữ và tránh lỗi phổ biến.",
    questionsToCheck: ["Bạn đang yếu khái niệm nào?", "Bài học này dùng ở module nào?", "Bạn đã làm quiz kiểm tra hiểu đúng chưa?"],
    commonMistakes: ["Học quá nhiều nhưng không áp dụng.", "Bỏ qua quiz.", "Học định giá trước khi hiểu BCTC."],
    suggestedQuestions: ["Tôi nên học bài nào trước?", "P/E là gì?", "Dòng tiền kinh doanh quan trọng thế nào?"],
    recommendedLessons: [
      { title: "Lộ trình phân tích cổ phiếu cho người mới", duration: "6 phút", usedIn: "Tổng quan", reason: "Giúp bạn biết thứ tự học và phân tích." },
    ],
    nextActions: [
      { label: "Quay lại Tổng quan", moduleKey: "overview", primary: true },
      { label: "Bắt đầu Vĩ mô", moduleKey: "macro" },
    ],
    softWarning: "Học tập là để hiểu dữ liệu tốt hơn, không thay thế kiểm chứng trong từng module.",
  },
  macro: {
    moduleId: "macro",
    moduleName: "Vĩ mô",
    currentGoal: "Hiểu bối cảnh kinh tế đang hỗ trợ hay gây áp lực cho thị trường và nhóm ngành nào.",
    whatThisStepDoes: "Vĩ mô giúp bạn hiểu lãi suất, tỷ giá, tín dụng, lạm phát, đầu tư công và dòng vốn ảnh hưởng đến ngành như thế nào.",
    questionsToCheck: ["Lãi suất đang hỗ trợ hay gây áp lực?", "Tỷ giá có căng không?", "Tín dụng có chảy vào nền kinh tế thật không?", "Ngành nào có thể hưởng lợi?", "Dữ liệu nào chưa xác nhận?"],
    commonMistakes: ["Kết luận thị trường tốt chỉ vì một chỉ số vĩ mô tích cực.", "Nghĩ lãi suất giảm là mọi cổ phiếu đều tốt.", "Không kiểm tra vĩ mô đã đi vào BCTC doanh nghiệp chưa."],
    suggestedQuestions: ["Lãi suất ảnh hưởng cổ phiếu như thế nào?", "Tỷ giá ảnh hưởng ngành nào?", "Đầu tư công đi vào doanh nghiệp ra sao?", "Risk-on/risk-off là gì?"],
    recommendedLessons: [
      { title: "Lãi suất ảnh hưởng cổ phiếu thế nào?", duration: "5 phút", usedIn: "Vĩ mô, Ngành, Định giá", reason: "Giúp bạn nối biến vĩ mô với ngành và định giá." },
    ],
    nextActions: [
      { label: "Xem kết luận vĩ mô có điều kiện", moduleKey: "macro", primary: true },
      { label: "Xem bản đồ ngành", moduleKey: "industry" },
      { label: "Chuyển sang Module Ngành", moduleKey: "industry" },
    ],
    softWarning: "Một chỉ số vĩ mô tích cực không đủ để kết luận thị trường tốt. Cần kiểm tra ngành, BCTC và định giá.",
  },
  industry: {
    moduleId: "industry",
    moduleName: "Phân tích ngành",
    currentGoal: "Hiểu ngành kiếm tiền thế nào, chịu tác động từ vĩ mô ra sao và dữ liệu ngành nào cần theo dõi.",
    whatThisStepDoes: "Module Ngành giúp bạn chuyển từ bối cảnh vĩ mô sang ngành cụ thể trước khi chọn cổ phiếu.",
    questionsToCheck: ["Ngành thuộc loại nào?", "Ngành nhạy với biến vĩ mô nào?", "Ngành đang ở pha nào?", "Ai đang cạnh tranh với ai?", "Dữ liệu nào xác nhận ngành đang tốt lên?"],
    commonMistakes: ["Ngành tốt không có nghĩa mọi cổ phiếu trong ngành đều tốt.", "Kết luận ngành hưởng lợi chỉ vì một tin chính sách."],
    suggestedQuestions: ["Ngành chu kỳ là gì?", "Vĩ mô đi vào ngành như thế nào?", "Dữ liệu nào xác nhận ngành tốt lên?"],
    recommendedLessons: [
      { title: "P/E ngành chu kỳ vì sao dễ gây hiểu nhầm?", duration: "5 phút", usedIn: "Ngành, Định giá, Rủi ro", reason: "Giúp tránh kết luận rẻ khi lợi nhuận đang ở đỉnh chu kỳ." },
    ],
    nextActions: [
      { label: "Chọn ngành để phân tích", moduleKey: "industry", primary: true },
      { label: "Chuyển sang Lọc cổ phiếu", moduleKey: "screening" },
      { label: "Quay lại Vĩ mô", moduleKey: "macro" },
    ],
    softWarning: "Ngành thuận lợi chỉ là một lớp bối cảnh, không phải danh sách quyết định đầu tư.",
  },
  screening: {
    moduleId: "stock-filter",
    moduleName: "Lọc cổ phiếu",
    currentGoal: "Tạo danh sách ứng viên để phân tích sâu hơn, không biến bộ lọc thành kết luận hành động.",
    whatThisStepDoes: "Bộ lọc giúp thu hẹp phạm vi theo tiêu chí dữ liệu, sau đó vẫn phải kiểm tra doanh nghiệp, BCTC, định giá và rủi ro.",
    questionsToCheck: ["Tiêu chí lọc có liên quan thesis không?", "Kết quả nào cần kiểm tra sâu?", "Có loại bỏ cổ phiếu vì thiếu dữ liệu không?"],
    commonMistakes: ["Xem kết quả lọc là kết luận hành động.", "Dùng quá nhiều tiêu chí máy móc.", "Không kiểm tra chất lượng dữ liệu."],
    suggestedQuestions: ["Bộ lọc cổ phiếu nên bắt đầu từ đâu?", "Tiêu chí lọc có phải thesis không?", "Vì sao lọc ra vẫn phải kiểm tra tiếp?"],
    recommendedLessons: [
      { title: "Bộ lọc cổ phiếu không phải kết luận hành động", duration: "4 phút", usedIn: "Lọc cổ phiếu, Watchlist", reason: "Giúp bạn phân biệt ứng viên và quyết định." },
    ],
    nextActions: [
      { label: "Chọn ứng viên để hiểu doanh nghiệp", moduleKey: "business", primary: true },
      { label: "Đưa vào Watchlist", moduleKey: "watchlist" },
    ],
    softWarning: sharedNoSignalWarning,
  },
  business: {
    moduleId: "business-understanding",
    moduleName: "Hiểu doanh nghiệp",
    currentGoal: "Hiểu doanh nghiệp kiếm tiền bằng cách nào, lợi thế nằm ở đâu và rủi ro chính là gì.",
    whatThisStepDoes: "Bước này chuyển từ câu chuyện ngành sang mô hình kinh doanh cụ thể của từng doanh nghiệp.",
    questionsToCheck: ["Doanh nghiệp bán gì?", "Khách hàng là ai?", "Lợi thế cạnh tranh có thật không?", "Rủi ro mô hình kinh doanh là gì?"],
    commonMistakes: ["Chỉ đọc câu chuyện tăng trưởng.", "Không hiểu doanh thu đến từ đâu.", "Không nối mô hình kinh doanh với BCTC."],
    suggestedQuestions: ["Moat là gì?", "Doanh nghiệp tốt cần kiểm tra gì?", "Chuỗi giá trị ảnh hưởng lợi nhuận thế nào?"],
    recommendedLessons: [
      { title: "Doanh nghiệp kiếm tiền bằng cách nào?", duration: "5 phút", usedIn: "Hiểu doanh nghiệp, BCTC", reason: "Giúp bạn đọc doanh thu và biên lợi nhuận có ngữ cảnh." },
    ],
    nextActions: [
      { label: "Kiểm tra BCTC", moduleKey: "financials", primary: true },
      { label: "Ghi rủi ro mô hình", moduleKey: "risk" },
    ],
    softWarning: "Doanh nghiệp nghe hấp dẫn chưa chắc có dữ liệu tài chính xác nhận.",
  },
  financials: {
    moduleId: "financials",
    moduleName: "Báo cáo tài chính",
    currentGoal: "Kiểm tra doanh thu, lợi nhuận, dòng tiền, nợ vay, tồn kho, khoản phải thu và chất lượng lợi nhuận.",
    whatThisStepDoes: "BCTC giúp bạn kiểm tra doanh nghiệp có thực sự tạo ra tiền và có sức khỏe tài chính đủ ổn không.",
    questionsToCheck: ["Lợi nhuận có đến từ hoạt động chính không?", "Dòng tiền kinh doanh có cùng chiều với lợi nhuận không?", "Khoản phải thu có tăng nhanh hơn doanh thu không?", "Hàng tồn kho có bất thường không?", "Nợ vay và chi phí lãi vay có gây áp lực không?"],
    commonMistakes: ["Chỉ nhìn lợi nhuận mà bỏ qua dòng tiền.", "Không kiểm tra khoản phải thu và tồn kho.", "Không phân biệt lợi nhuận cốt lõi và lợi nhuận bất thường."],
    suggestedQuestions: ["Vì sao lợi nhuận cao nhưng dòng tiền yếu?", "Khoản phải thu tăng có đáng lo không?", "Chất lượng lợi nhuận là gì?"],
    recommendedLessons: [
      { title: "Vì sao lợi nhuận cao nhưng dòng tiền yếu?", duration: "5 phút", usedIn: "BCTC, Rủi ro, Định giá", reason: "Giúp bạn không chỉ nhìn lợi nhuận mà bỏ qua chất lượng dòng tiền." },
    ],
    nextActions: [
      { label: "Kiểm tra dòng tiền", moduleKey: "financials", primary: true },
      { label: "Chuyển sang Định giá", moduleKey: "valuation" },
    ],
    softWarning: "Lợi nhuận tăng không có nghĩa doanh nghiệp chắc chắn khỏe nếu dòng tiền yếu.",
  },
  valuation: {
    moduleId: "valuation",
    moduleName: "Định giá",
    currentGoal: "Kiểm tra giá hiện tại có hợp lý với chất lượng doanh nghiệp, lợi nhuận và rủi ro hay không.",
    whatThisStepDoes: "Định giá giúp bạn đặt giả định rõ ràng, kiểm tra biên an toàn và tránh kết luận rẻ quá nhanh.",
    questionsToCheck: ["P/E đang phản ánh điều gì?", "P/B có phù hợp ngành không?", "DCF nhạy với giả định nào?", "Có value trap không?", "Biên an toàn đủ chưa?"],
    commonMistakes: ["P/E thấp không tự động có nghĩa cổ phiếu rẻ.", "DCF chính xác giả tạo vì giả định quá lạc quan.", "Bỏ qua rủi ro chu kỳ."],
    suggestedQuestions: ["P/E thấp có phải cổ phiếu rẻ không?", "Value trap là gì?", "DCF dễ sai ở đâu?", "Biên an toàn là gì?"],
    recommendedLessons: [
      { title: "P/E ngành chu kỳ vì sao dễ gây hiểu nhầm?", duration: "5 phút", usedIn: "Ngành, Định giá, Rủi ro", reason: "Giúp bạn tránh kết luận cổ phiếu rẻ chỉ vì P/E thấp." },
    ],
    nextActions: [
      { label: "Kiểm tra biên an toàn", moduleKey: "valuation", primary: true },
      { label: "Chuyển sang Rủi ro", moduleKey: "risk" },
    ],
    softWarning: "Định giá là kiểm tra giả định, không phải kết luận hành động.",
  },
  technical: {
    moduleId: "pvt",
    moduleName: "Quan sát Giá - Thanh khoản - Thời điểm",
    currentGoal: "Quan sát giá, khối lượng, thời điểm và sự kiện như bối cảnh thị trường, không biến thành kết luận hành động.",
    whatThisStepDoes: "PVT giúp bạn đọc hành vi thị trường và rủi ro FOMO trước khi mô phỏng hoặc checklist.",
    questionsToCheck: ["Giá đang thay đổi vì gì?", "Volume có bất thường không?", "So với VN-Index thì cổ phiếu mạnh hay yếu?", "So với ngành thì cổ phiếu có vượt trội không?", "Có sự kiện nào gần đây không?"],
    commonMistakes: ["Giá tăng mạnh không có nghĩa doanh nghiệp tốt hơn.", "Xem mẫu hình giá là kết luận chắc chắn.", "Bỏ qua sự kiện và thanh khoản."],
    suggestedQuestions: ["Giá tăng mạnh có phải doanh nghiệp tốt hơn không?", "Volume bất thường nói lên điều gì?", "Tôi có đang FOMO không?"],
    recommendedLessons: [
      { title: "Giá tăng mạnh có phải doanh nghiệp tốt hơn không?", duration: "4 phút", usedIn: "PVT, Rủi ro, Mô phỏng", reason: "Giúp bạn tránh FOMO khi cổ phiếu tăng nóng." },
    ],
    nextActions: [
      { label: "Kiểm tra sự kiện và volume", moduleKey: "technical", primary: true },
      { label: "Chuyển sang Rủi ro", moduleKey: "risk" },
    ],
    softWarning: "PVT chỉ là quan sát giá/khối lượng/thời điểm, không phải hệ thống kết luận hành động.",
  },
  risk: {
    moduleId: "risk",
    moduleName: "Rủi ro & minh bạch",
    currentGoal: "Dừng lại để soi rủi ro trước khi mô phỏng hoặc quyết định.",
    whatThisStepDoes: "Module Rủi ro giúp bạn kiểm tra điều gì có thể sai trong thesis, dữ liệu, định giá và hành vi.",
    questionsToCheck: ["Rủi ro mô hình kinh doanh là gì?", "Rủi ro tài chính có đáng kể không?", "Chất lượng lợi nhuận có vấn đề không?", "Định giá có bẫy không?", "Có rủi ro quản trị hoặc thanh khoản không?"],
    commonMistakes: ["Một dấu hiệu rủi ro đơn lẻ chưa đủ để kết luận doanh nghiệp xấu.", "Bỏ qua nhiều dấu hiệu cùng xuất hiện.", "Chỉ tìm dữ liệu xác nhận thesis."],
    suggestedQuestions: ["Rủi ro chất lượng lợi nhuận là gì?", "Governance risk đọc thế nào?", "Làm sao biết tôi đang thiên kiến xác nhận?"],
    recommendedLessons: [
      { title: "Checklist rủi ro trước khi đi tiếp", duration: "5 phút", usedIn: "Rủi ro, Checklist, Mô phỏng", reason: "Giúp bạn không đưa thesis thiếu dữ liệu vào mô phỏng." },
    ],
    nextActions: [
      { label: "Hoàn thành checklist rủi ro", moduleKey: "risk", primary: true },
      { label: "Mở Watchlist", moduleKey: "watchlist" },
    ],
    softWarning: "Rủi ro không phải để phủ định mọi ý tưởng, mà để biết điều kiện nào làm thesis sai.",
  },
  watchlist: {
    moduleId: "watchlist",
    moduleName: "Watchlist",
    currentGoal: "Quản lý ý tưởng đầu tư có kỷ luật, không phải danh sách quyết định hành động.",
    whatThisStepDoes: "Watchlist giúp lưu ý tưởng, thesis, dữ liệu còn thiếu và bước phân tích tiếp theo.",
    questionsToCheck: ["Mỗi mã có lý do theo dõi chưa?", "Mỗi mã có thesis chưa?", "Mã nào thiếu dữ liệu?", "Mã nào cần kiểm tra rủi ro?", "Mã nào cần mở Checklist trước khi đi tiếp?"],
    commonMistakes: ["Cổ phiếu nằm trong Watchlist vẫn cần dữ liệu và luận điểm rõ ràng.", "Theo dõi vì tin nóng nhưng không ghi thesis.", "Không cập nhật rủi ro mới."],
    suggestedQuestions: ["Thesis trong Watchlist nên viết thế nào?", "Khi nào một mã sẵn sàng mô phỏng?", "Thiếu dữ liệu nào là nghiêm trọng?"],
    recommendedLessons: [
      { title: "Viết thesis theo dõi cổ phiếu", duration: "5 phút", usedIn: "Watchlist, Mô phỏng", reason: "Giúp bạn phân biệt lý do theo dõi và cảm xúc." },
    ],
    nextActions: [
      { label: "Bổ sung thesis Watchlist", moduleKey: "watchlist", primary: true },
      { label: "Mở Checklist", moduleKey: "checklist" },
    ],
    softWarning: "Watchlist là danh sách theo dõi dữ liệu và luận điểm, không phải danh sách quyết định đầu tư.",
  },
  checklist: {
    moduleId: "checklist",
    moduleName: "Checklist",
    currentGoal: "Kiểm tra chất lượng phân tích trước khi đi tiếp, gồm dữ liệu, thesis, rủi ro, định giá, PVT, danh mục và cảm xúc.",
    whatThisStepDoes: "Checklist là một cổng kiểm tra thống nhất. Bạn chọn mục tiêu kiểm tra, hệ thống ưu tiên nhóm câu hỏi phù hợp và chỉ ra điểm còn thiếu.",
    questionsToCheck: [
      "Bạn đang kiểm tra để làm gì?",
      "Dữ liệu nền đã đủ chưa?",
      "Thesis có dữ liệu xác nhận và dữ liệu phủ định chưa?",
      "Rủi ro, định giá và PVT còn thiếu điểm nào?",
      "Bạn có đang FOMO hoặc kết luận vội không?",
      "Nên mô phỏng, quay lại phân tích, ghi nhật ký hay tạm dừng?",
    ],
    commonMistakes: [
      "Checklist không phải công cụ đưa ra kết luận hành động.",
      "Nếu thiếu dữ liệu, không hành động cũng là một lựa chọn có kỷ luật.",
      "Đừng tích câu hỏi cho xong nếu bạn chưa hiểu dữ liệu phía sau.",
    ],
    suggestedQuestions: [
      "Tôi nên dùng checklist này như thế nào?",
      "Nếu thiếu BCTC thì có nên mô phỏng không?",
      "FOMO trong checklist nhận diện thế nào?",
      "Khi nào nên quay lại Module Rủi ro?",
      "Nếu thesis chưa rõ thì nên làm gì?",
      "Lãi/lỗ mô phỏng có chứng minh tôi đúng/sai không?",
    ],
    recommendedLessons: [
      { title: "Thesis đầu tư là gì?", duration: "5 phút", usedIn: "Watchlist, Checklist, Mô phỏng", reason: "Giúp bạn biết cần viết gì trước khi đi tiếp." },
      { title: "FOMO trong đầu tư là gì?", duration: "4 phút", usedIn: "Checklist, Watchlist, Mô phỏng", reason: "Giúp bạn kiểm tra cảm xúc trước khi hành động." },
      { title: "Vì sao lợi nhuận cao nhưng dòng tiền yếu?", duration: "5 phút", usedIn: "BCTC, Rủi ro, Checklist", reason: "Giúp bạn không bỏ qua chất lượng dòng tiền." },
      { title: "Value trap là gì?", duration: "5 phút", usedIn: "Định giá, Rủi ro, Checklist", reason: "Giúp tránh kết luận vội khi chỉ thấy chỉ số định giá thấp." },
      { title: "Đúng quy trình khác gì may mắn?", duration: "4 phút", usedIn: "Mô phỏng, Checklist", reason: "Giúp bạn học từ quy trình thay vì chỉ nhìn kết quả." },
    ],
    nextActions: [
      { label: "Hoàn thành Checklist", moduleKey: "checklist", primary: true },
      { label: "Chuyển sang Mô phỏng", moduleKey: "simulation" },
    ],
    softWarning: "Checklist chỉ giúp kiểm tra kỷ luật và dữ liệu còn thiếu. Nó không thay bạn ra quyết định.",
  },
  simulation: {
    moduleId: "simulation",
    moduleName: "Mô phỏng",
    currentGoal: "Luyện theo dõi thesis bằng vị thế giả lập, không phải trading game.",
    whatThisStepDoes: "Mô phỏng giúp bạn kiểm tra thesis theo dữ liệu mới, benchmark và cảm xúc trước khi dùng tiền thật.",
    questionsToCheck: ["Thesis ban đầu là gì?", "Mốc xem lại là gì?", "Kết quả so với VN-Index ra sao?", "Dữ liệu mới xác nhận hay phủ định thesis?", "Bạn thay đổi vì dữ liệu hay cảm xúc?"],
    commonMistakes: ["Lãi không chắc đúng. Lỗ không chắc sai.", "Xem mô phỏng như game trading.", "Không ghi nhật ký khi thesis đổi."],
    suggestedQuestions: ["Lãi/lỗ mô phỏng có chứng minh tôi đúng/sai không?", "Benchmark dùng để làm gì?", "Mốc xem lại thesis là gì?", "Tôi có đang FOMO không?"],
    recommendedLessons: [
      { title: "Benchmark trong mô phỏng dùng để làm gì?", duration: "5 phút", usedIn: "Mô phỏng", reason: "Giúp bạn đánh giá thesis thay vì chỉ nhìn lãi/lỗ." },
    ],
    nextActions: [
      { label: "Cập nhật thesis mô phỏng", moduleKey: "simulation", primary: true },
    ],
    softWarning: "Mô phỏng không chứng minh bạn đúng sai tuyệt đối. Nó giúp học từ dữ liệu và quy trình.",
  },
};

export const fallbackAITutorConfig = aiTutorConfig.overview;
