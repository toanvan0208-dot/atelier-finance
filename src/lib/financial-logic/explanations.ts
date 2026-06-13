import type { MetricExplanation } from "./types";

const baseWarning = "Cần đọc cùng ngành, chu kỳ kinh doanh và chất lượng dữ liệu; chỉ số riêng lẻ không đủ để kết luận.";
const baseMisread = "Không nên đọc một chỉ số tách khỏi bối cảnh hoặc dùng nó như kết luận độc lập.";

export const METRIC_EXPLANATIONS = {
  revenueGrowth: { beginner: "Tốc độ doanh thu cho biết quy mô bán hàng tăng hay giảm so với kỳ trước.", warning: "Doanh thu tăng cần kiểm tra thêm biên lợi nhuận và dòng tiền.", commonMisread: "Doanh thu tăng không đồng nghĩa lợi nhuận hoặc sức khỏe tài chính tốt hơn." },
  grossProfitGrowth: { beginner: "Tốc độ lợi nhuận gộp cho biết phần còn lại sau giá vốn thay đổi thế nào.", warning: "Cần đọc cùng biên gộp để biết tăng do doanh thu hay do giữ biên tốt hơn.", commonMisread: "Lợi nhuận gộp tăng nhưng chi phí bán hàng tăng mạnh vẫn có thể làm lợi nhuận ròng yếu." },
  operatingProfitGrowth: { beginner: "Tốc độ lợi nhuận hoạt động phản ánh phần lợi nhuận từ vận hành chính.", warning: "Cần loại trừ khoản bất thường và kiểm tra chi phí bán hàng, quản lý.", commonMisread: "Không nên xem lợi nhuận hoạt động tăng là chắc chắn bền vững nếu doanh thu hoặc dòng tiền không ủng hộ." },
  netProfitGrowth: { beginner: "Tốc độ lợi nhuận sau thuế cho biết phần cuối cùng thuộc về cổ đông thay đổi ra sao.", warning: "Lợi nhuận ròng có thể bị ảnh hưởng bởi tài chính, thuế hoặc khoản một lần.", commonMisread: "Lợi nhuận tăng một kỳ không đủ chứng minh xu hướng dài hạn." },
  grossMargin: { beginner: "Biên gộp cho biết mỗi 100 đồng doanh thu giữ lại bao nhiêu sau giá vốn.", warning: "Biên gộp cần so với mô hình kinh doanh và ngành.", commonMisread: "Biên gộp cao không tự động tốt nếu chi phí vận hành và vốn lưu động xấu." },
  operatingMargin: { beginner: "Biên hoạt động cho biết vận hành chính giữ lại bao nhiêu lợi nhuận trước lãi vay và thuế.", warning: "Cần kiểm tra chi phí bán hàng, quản lý và tính lặp lại của lợi nhuận.", commonMisread: "Không nên so biên hoạt động giữa các ngành quá khác nhau." },
  netMargin: { beginner: "Biên ròng cho biết mỗi 100 đồng doanh thu còn lại bao nhiêu lợi nhuận sau cùng.", warning: "Biên ròng có thể bị bóp méo bởi khoản bất thường.", commonMisread: "Biên ròng cao một kỳ không đảm bảo chất lượng lợi nhuận tốt." },
  roa: { beginner: "ROA đo hiệu quả tạo lợi nhuận trên tài sản.", warning: "Tài sản bình quân thiếu dữ liệu làm độ tin cậy thấp hơn.", commonMisread: "ROA thấp không luôn xấu với ngành cần tài sản lớn." },
  roe: { beginner: "ROE đo hiệu quả tạo lợi nhuận trên vốn chủ.", warning: "ROE cao cần đọc cùng đòn bẩy nợ và dòng tiền.", commonMisread: "ROE cao do vốn chủ thấp hoặc nợ cao không chắc là chất lượng tốt." },
  debtToEquity: { beginner: "Nợ vay trên vốn chủ cho biết mức dùng đòn bẩy tài chính.", warning: "Với ngân hàng, chứng khoán, bảo hiểm, không diễn giải máy móc như doanh nghiệp phi tài chính.", commonMisread: "D/E thấp vẫn cần đọc cùng dòng tiền, kỳ hạn nợ và nợ ngắn hạn." },
  liabilitiesToAssets: { beginner: "Tỷ lệ nợ phải trả trên tài sản cho biết phần tài sản được tài trợ bởi nghĩa vụ nợ.", warning: baseWarning, commonMisread: "Tỷ lệ cao cần hiểu cấu trúc ngành trước khi kết luận rủi ro." },
  netDebt: { beginner: "Nợ ròng là nợ vay sau khi trừ tiền mặt.", warning: "Tiền mặt có thể bị hạn chế sử dụng hoặc cần cho vận hành.", commonMisread: "Nợ ròng thấp không thay thế việc đọc kỳ hạn nợ và dòng tiền." },
  currentRatio: { beginner: "Hệ số thanh toán hiện hành so tài sản ngắn hạn với nợ ngắn hạn.", warning: "Hàng tồn kho hoặc phải thu kém chất lượng có thể làm chỉ số đẹp giả.", commonMisread: "Chỉ số trên 1 không chắc là thanh khoản tốt." },
  quickRatio: { beginner: "Hệ số thanh toán nhanh loại hàng tồn kho khỏi tài sản ngắn hạn.", warning: "Cần xét chất lượng khoản phải thu.", commonMisread: "Quick ratio thấp có thể bình thường với một số ngành quay vòng tiền nhanh." },
  interestCoverage: { beginner: "Khả năng trả lãi cho biết lợi nhuận hoạt động bao phủ chi phí lãi vay bao nhiêu lần.", warning: "Nếu lãi vay thiếu hoặc bằng 0, không nên suy luận khả năng trả lãi.", commonMisread: "Coverage cao một kỳ không đủ nếu lợi nhuận biến động mạnh." },
  cashToDebt: { beginner: "Tiền mặt trên nợ vay cho biết bộ đệm tiền so với nghĩa vụ vay.", warning: "Cần xem nợ đến hạn và khả năng tạo tiền mới.", commonMisread: "Nhiều tiền không luôn tốt nếu tiền không thuộc về cổ đông hoặc bị khóa." },
  cfoToNetProfit: { beginner: "So dòng tiền kinh doanh với lợi nhuận ròng để kiểm tra lợi nhuận có chuyển thành tiền không.", warning: "Một kỳ dòng tiền yếu có thể do mùa vụ hoặc vốn lưu động.", commonMisread: "CFO thấp không tự động là gian lận; chỉ là tín hiệu cần kiểm tra." },
  freeCashFlow: { beginner: "Dòng tiền tự do là tiền còn lại sau chi tiêu đầu tư duy trì hoặc mở rộng.", warning: "Capex âm/dương trong dữ liệu có thể khác quy ước, cần kiểm tra nguồn.", commonMisread: "FCF âm không luôn xấu nếu doanh nghiệp đang đầu tư có kỷ luật." },
  fcfMargin: { beginner: "Biên FCF cho biết mỗi 100 đồng doanh thu tạo ra bao nhiêu dòng tiền tự do.", warning: baseWarning, commonMisread: "FCF margin cao một kỳ có thể do giảm đầu tư tạm thời." },
  capexToRevenue: { beginner: "Capex trên doanh thu cho biết mức tái đầu tư tài sản so với quy mô bán hàng.", warning: "Cần hiểu ngành tài sản nặng hay nhẹ.", commonMisread: "Capex thấp không luôn tốt nếu doanh nghiệp đang thiếu đầu tư." },
  receivablesGrowthVsRevenueGrowth: { beginner: "So tốc độ phải thu với doanh thu để xem doanh thu có đi kèm tiền thu về không.", warning: "Phải thu tăng nhanh hơn doanh thu là điểm cần kiểm tra chính sách tín dụng.", commonMisread: "Không được kết luận gian lận chỉ từ phải thu tăng." },
  inventoryGrowthVsRevenueGrowth: { beginner: "So tốc độ tồn kho với doanh thu để xem hàng tồn có phình nhanh hơn bán hàng không.", warning: "Tồn kho tăng cần đọc cùng mùa vụ và kế hoạch mở rộng.", commonMisread: "Tồn kho tăng không luôn xấu nếu chuẩn bị cho tăng trưởng có thật." },
  eps: { beginner: "EPS cho biết lợi nhuận phân bổ trên mỗi cổ phiếu.", warning: "EPS có thể bị pha loãng hoặc ảnh hưởng bởi khoản bất thường.", commonMisread: "EPS cao không nói mức giá thị trường đã hợp lý nếu không xét chất lượng lợi nhuận." },
  bvps: { beginner: "BVPS cho biết giá trị sổ sách trên mỗi cổ phiếu.", warning: "Giá trị sổ sách phụ thuộc chất lượng tài sản.", commonMisread: "P/B thấp vẫn có thể đi kèm tài sản kém chất lượng hoặc lợi nhuận yếu." },
  peRatio: { beginner: "P/E so giá với lợi nhuận trên mỗi cổ phiếu.", warning: "P/E không dùng được khi EPS âm hoặc rất thấp.", commonMisread: "Không nên đọc P/E thấp hoặc cao như kết luận độc lập về mức định giá." },
  pbRatio: { beginner: "P/B so giá với giá trị sổ sách trên mỗi cổ phiếu.", warning: "Cần đọc cùng ROE và chất lượng tài sản.", commonMisread: "P/B thấp có thể phản ánh rủi ro tài sản hoặc lợi nhuận yếu." },
  psRatio: { beginner: "P/S so giá trị vốn hóa với doanh thu.", warning: "P/S bỏ qua biên lợi nhuận và dòng tiền.", commonMisread: "Doanh thu lớn không đủ nếu biên và tiền yếu." },
  marketCap: { beginner: "Vốn hóa thị trường là giá trị thị trường của toàn bộ cổ phiếu lưu hành.", warning: "Vốn hóa thay đổi theo giá thị trường.", commonMisread: "Vốn hóa lớn không tự động làm giảm các rủi ro cần kiểm tra." },
  enterpriseValue: { beginner: "EV cộng vốn hóa với nợ ròng để nhìn giá trị doanh nghiệp theo cấu trúc vốn.", warning: "Cần chắc dữ liệu nợ và tiền mặt đủ.", commonMisread: "EV không phải giá trị hợp lý nội tại." },
  evToEbitda: { beginner: "EV/EBITDA so giá trị doanh nghiệp với dòng lợi nhuận vận hành trước khấu hao.", warning: "Không phù hợp nếu EBITDA âm hoặc ngành có capex rất lớn.", commonMisread: "EV/EBITDA thấp vẫn cần đọc cùng capex, nợ và chất lượng lợi nhuận." },
  priceChangePct: { beginner: "Mức thay đổi giá cho biết giá biến động bao nhiêu so với mốc trước.", warning: "Biến động giá không phải tín hiệu quyết định độc lập.", commonMisread: "Giá tăng không chứng minh doanh nghiệp tốt hơn." },
  tradingValue: { beginner: "Giá trị giao dịch ước tính quy mô tiền khớp lệnh trong phiên.", warning: "Thanh khoản cao không đồng nghĩa chất lượng doanh nghiệp tốt.", commonMisread: "Khối lượng cao không nên được hiểu là xác nhận chắc chắn." },
  liquidityStatus: { beginner: "Trạng thái thanh khoản giúp nhận biết rủi ro khó thực thi ở quy mô lớn.", warning: "Chỉ dùng để hiểu khả năng thực thi giả định, không phải tín hiệu sinh lời.", commonMisread: "Thanh khoản tốt không biến một luận điểm yếu thành tốt." },
  financialHealth: { beginner: "Tóm tắt sức khỏe tài chính từ tăng trưởng, lợi nhuận, nợ và dòng tiền.", warning: baseWarning, commonMisread: "Điểm sức khỏe không thay thế phân tích chi tiết từng nguồn dữ liệu." },
  valuationReadiness: { beginner: "Mức sẵn sàng định giá cho biết dữ liệu đã đủ để đọc định giá sơ bộ chưa.", warning: "Thiếu dữ liệu làm mọi kết quả định giá giảm độ tin cậy.", commonMisread: "Sẵn sàng định giá không có nghĩa là đã có kết luận giá trị hợp lý." },
  valuationConfidence: { beginner: "Độ tin cậy định giá phản ánh số lượng và chất lượng dữ liệu hỗ trợ.", warning: "Độ tin cậy thấp cần ghi rõ giả định và khoảng bất định.", commonMisread: "Confidence cao không phải là đảm bảo đúng." },
  riskScore: { beginner: "Điểm rủi ro giúp gom các dấu hiệu cần kiểm tra trước khi đi tiếp.", warning: "Rủi ro cần được đọc theo bằng chứng và mức thiếu dữ liệu.", commonMisread: "Điểm rủi ro không phải quyết định hành động." },
  dataQuality: { beginner: "Chất lượng dữ liệu cho biết có đủ nguồn để tin vào phép tính hay không.", warning: "Dữ liệu thiếu hoặc cũ phải được cảnh báo trong mọi module.", commonMisread: "Có con số không có nghĩa con số đó đáng tin." },
} satisfies Record<string, MetricExplanation>;

export const getExplanation = (key: keyof typeof METRIC_EXPLANATIONS | string): MetricExplanation =>
  METRIC_EXPLANATIONS[key as keyof typeof METRIC_EXPLANATIONS] ?? {
    beginner: "Chỉ số này giúp người mới đọc một phần bức tranh tài chính.",
    warning: baseWarning,
    commonMisread: baseMisread,
  };
