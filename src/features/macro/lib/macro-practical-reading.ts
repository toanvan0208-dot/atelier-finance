import type { MacroCompassMetric } from "../types";
import { formatMacroCompassMetricValue } from "./macro-compass-data-contract";

const getNumericMetricValue = (metric: MacroCompassMetric): number | null => {
  if (typeof metric.value === "number" && Number.isFinite(metric.value)) return metric.value;
  if (typeof metric.value !== "string") return null;

  const normalized = metric.value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export function buildMacroPracticalReading(metric: MacroCompassMetric): MacroCompassMetric["practicalReading"] {
  const value = getNumericMetricValue(metric);
  const formattedValue = formatMacroCompassMetricValue(metric);

  if (value === null) {
    return {
      current: "Chưa có số liệu đủ sạch để đọc trạng thái hiện tại. Không nên thay dữ liệu thiếu bằng 0 hoặc dùng mô tả lý thuyết để lấp khoảng trống.",
      benchmark: "Mốc đọc nhanh chỉ có ý nghĩa sau khi có giá trị, đơn vị, kỳ dữ liệu và nguồn rõ ràng.",
      impact: "Tạm thời chỉ coi đây là mắt xích cần bổ sung dữ liệu trước khi nối sang ngành hoặc cổ phiếu.",
      caveat: "Cần bổ sung quan sát mới nhất, lịch sử vài kỳ và nguồn dữ liệu đã rà soát.",
    };
  }

  switch (metric.id) {
    case "gdp": {
      const state =
        value >= 7
          ? "đang ở vùng tăng trưởng mạnh sơ bộ"
          : value >= 5
            ? "đang ở vùng mở rộng vừa phải"
            : value >= 0
              ? "đang tăng chậm, cần thận trọng với sức cầu"
              : "đang co lại, đây là tín hiệu vĩ mô xấu";
      return {
        current: `${formattedValue} cho thấy nền kinh tế ${state}. Nếu doanh thu doanh nghiệp hoặc ngành tăng thấp hơn nhiều so với GDP, cần hỏi liệu doanh nghiệp có đang mất thị phần, ngành có đang lệch chu kỳ, hoặc số liệu doanh thu chưa phản ánh nền kinh tế chung.`,
        benchmark: "Trên 7% là nền tăng trưởng mạnh sơ bộ; 5-7% là mở rộng bình thường; dưới 5% là chậm; âm là co lại. Đây là mốc đọc bối cảnh, không phải chuẩn định giá cổ phiếu.",
        impact: "GDP cao thường là gió thuận cho ngân hàng, tiêu dùng, logistics, vật liệu và doanh nghiệp bán vào nội địa, nhưng chỉ thật sự có ích khi đi xuống đơn hàng, sản lượng, biên lợi nhuận và dòng tiền.",
        caveat: "Cần xem cấu phần tăng trưởng: tiêu dùng, đầu tư công, xuất khẩu hay tồn kho. Một con số GDP đẹp nhưng không lan vào ngành đang phân tích thì không giúp được thesis.",
      };
    }
    case "cpi": {
      const state =
        value <= 0
          ? "rất thấp hoặc giảm giá, cần kiểm tra sức cầu"
          : value < 4
            ? "đang trong vùng tương đối dễ chịu"
            : value <= 6
              ? "đã vào vùng cần theo dõi"
              : "là áp lực lạm phát rõ";
      return {
        current: `${formattedValue} nghĩa là mặt bằng giá ${state}. Với cổ phiếu, câu hỏi thực chiến không phải CPI cao hay thấp, mà là doanh nghiệp có chuyển được chi phí sang giá bán không.`,
        benchmark: "0-4% thường dễ chịu hơn cho lãi suất và sức mua; 4-6% cần theo dõi; trên 6% là áp lực lớn hơn với chi phí vốn và biên lợi nhuận.",
        impact: "CPI thấp vừa phải hỗ trợ sức mua và dư địa lãi suất; CPI tăng nhanh gây áp lực cho bán lẻ, tiêu dùng không thiết yếu và doanh nghiệp dùng nhiều đầu vào.",
        caveat: "Cần tách CPI lõi, giá năng lượng, lương thực và xu hướng vài tháng. Một kỳ CPI đơn lẻ chưa đủ để kết luận lãi suất hay sức mua sẽ đổi chiều.",
      };
    }
    case "usd-vnd": {
      const state =
        value >= 26000
          ? "đang ở vùng áp lực tỷ giá cao"
          : value >= 24500
            ? "đang ở vùng cần theo dõi"
            : "chưa phải vùng căng rõ theo mốc sơ bộ";
      return {
        current: `${formattedValue} cho thấy USD/VND ${state}. USD/VND càng cao nghĩa là VND yếu hơn so với USD; doanh nghiệp nhập khẩu, vay USD hoặc có chi phí ngoại tệ cần được soi kỹ hơn.`,
        benchmark: "Trên 26.000 là vùng áp lực cao sơ bộ; 24.500-26.000 là vùng cần theo dõi; dưới 24.500 thường dễ thở hơn. Mốc này chỉ để định hướng, không thay cho so sánh theo thời gian.",
        impact: "Bất lợi thường nằm ở chi phí nhập khẩu, nợ ngoại tệ, tỷ giá ghi nhận lỗ/lãi tài chính và tâm lý khối ngoại. Ngược lại, doanh nghiệp xuất khẩu có doanh thu USD nhưng chi phí VND có thể được hỗ trợ một phần.",
        caveat: "Phải xem tốc độ tăng so với tháng/quý trước, tỷ giá ngân hàng so với tỷ giá trung tâm, dự trữ ngoại hối và chính sách lãi suất. Chỉ nhìn một mức tỷ giá tuyệt đối dễ kết luận sai.",
      };
    }
    case "domestic-rate": {
      const state = value < 5 ? "khá hỗ trợ chi phí vốn" : value <= 7 ? "trung tính đến cần theo dõi" : "có thể tạo áp lực chi phí vốn";
      return {
        current: `${formattedValue} cho thấy mặt bằng lãi suất ${state}. Với doanh nghiệp, tác động đi thẳng vào chi phí lãi vay, nhu cầu tín dụng và định giá tài sản.`,
        benchmark: "Dưới 5% thường hỗ trợ hơn; 5-7% là vùng theo dõi; trên 7% là vùng chi phí vốn căng hơn.",
        impact: "Lãi suất thấp hơn thường hỗ trợ bất động sản, chứng khoán, tiêu dùng trả góp và doanh nghiệp vay nợ nhiều; lãi suất cao hơn làm câu chuyện tăng trưởng dễ bị bào mòn bởi chi phí tài chính.",
        caveat: "Cần phân biệt lãi suất điều hành, lãi suất huy động và lãi suất cho vay thực tế. Doanh nghiệp vay cố định và vay thả nổi sẽ chịu tác động khác nhau.",
      };
    }
    case "pmi": {
      const state = value >= 50 ? "sản xuất đang mở rộng" : "sản xuất đang thu hẹp";
      return {
        current: `${formattedValue} cho thấy ${state} theo ngưỡng PMI. Đây là chỉ báo gần hơn với đơn hàng và sản xuất so với GDP năm.`,
        benchmark: "Trên 50 là mở rộng; dưới 50 là thu hẹp; càng xa 50 thì tín hiệu càng rõ hơn.",
        impact: "PMI cải thiện hỗ trợ xuất khẩu, khu công nghiệp, logistics và nhà cung ứng sản xuất; PMI yếu thường báo trước áp lực đơn hàng, công suất và tồn kho.",
        caveat: "Cần xem đơn hàng mới, việc làm, tồn kho và số tháng liên tiếp trên/dưới 50. Một tháng bật lên chưa đủ nói chu kỳ đã đảo chiều.",
      };
    }
    case "exports": {
      const state = value >= 10 ? "tăng khá mạnh" : value > 0 ? "đang tăng nhưng chưa quá mạnh" : "đang giảm";
      return {
        current: `${formattedValue} cho thấy xuất khẩu ${state}. Điểm cần soi là tăng do sản lượng, giá bán, tỷ giá hay nền so sánh thấp.`,
        benchmark: "Trên 10% là phục hồi/tăng trưởng mạnh sơ bộ; 0-10% là tăng nhẹ; âm là cầu bên ngoài yếu hoặc nền so sánh bất lợi.",
        impact: "Hỗ trợ rõ hơn cho dệt may, thủy sản, gỗ, điện tử, cảng biển và logistics nếu đơn hàng thật sự cải thiện.",
        caveat: "Cần tách theo thị trường và nhóm hàng. Xuất khẩu chung tăng không đảm bảo ngành đang phân tích cũng tăng.",
      };
    }
    case "credit-growth": {
      const state = value >= 12 ? "khá hỗ trợ thanh khoản nền kinh tế" : value >= 6 ? "ở mức vừa phải" : "yếu, có thể phản ánh cầu vay thấp";
      return {
        current: `${formattedValue} cho thấy tín dụng ${state}. Nhưng tín dụng tăng chỉ tốt khi tiền đi vào hoạt động thật, không làm phình nợ xấu.`,
        benchmark: "Trên 12% là lực bơm tín dụng đáng chú ý; 6-12% là vừa phải; dưới 6% là yếu.",
        impact: "Tín dụng cải thiện có thể hỗ trợ ngân hàng, bất động sản, tiêu dùng và chứng khoán; tín dụng yếu làm doanh thu nhạy vốn khó bứt lên.",
        caveat: "Cần xem chất lượng tín dụng, nợ xấu, nhóm vay nào hấp thụ vốn và lãi suất cho vay thực tế.",
      };
    }
    case "public-investment": {
      const isPlanRatio = String(metric.unit ?? "").includes("percent");
      return {
        current: isPlanRatio
          ? `${formattedValue} cho biết tiến độ giải ngân so với kế hoạch. Số càng cao càng cho thấy vốn đầu tư công đã đi vào thực tế nhiều hơn.`
          : `${formattedValue} là quy mô giải ngân/giá trị đầu tư công theo đơn vị hiện có. Con số này cần đặt cạnh kế hoạch năm để biết nhanh hay chậm.`,
        benchmark: isPlanRatio
          ? "Trên 60% kế hoạch khi còn sớm trong năm là tích cực; 40-60% là cần theo dõi; dưới 40% thường chậm."
          : "Giá trị tuyệt đối chỉ nói quy mô, chưa nói tiến độ. Cần tỷ lệ hoàn thành kế hoạch hoặc so với cùng kỳ.",
        impact: "Khi giải ngân thật tăng, tác động thường đi qua vật liệu xây dựng, xây lắp hạ tầng, đá, thép, xi măng, logistics và khu công nghiệp.",
        caveat: "Cần kiểm tra độ trễ từ giải ngân sang doanh thu doanh nghiệp, biên lợi nhuận dự án và tồn kho. Không phải doanh nghiệp vật liệu nào cũng hưởng lợi như nhau.",
      };
    }
    case "foreign-flow": {
      const state = value > 0 ? "mua ròng" : value < 0 ? "bán ròng" : "cân bằng";
      return {
        current: `${formattedValue} cho thấy khối ngoại đang ${state} theo nguồn hiện có. Đây là biến tâm lý và thanh khoản, không phải tín hiệu mua bán độc lập.`,
        benchmark: "Dương là mua ròng, âm là bán ròng; cần xem độ lớn so với thanh khoản và số phiên kéo dài.",
        impact: "Bán ròng kéo dài có thể gây áp lực tâm lý lên VN30, ngân hàng và nhóm vốn hóa lớn; mua ròng hỗ trợ thanh khoản nhưng chưa đủ xác nhận xu hướng.",
        caveat: "Cần xem cổ phiếu/ngành bị mua bán, giao dịch thỏa thuận, ETF và dòng tiền nội có hấp thụ được không.",
      };
    }
    case "market-liquidity": {
      return {
        current: `${formattedValue} cho biết quy mô tiền giao dịch theo đơn vị hệ thống đang lưu. Thanh khoản cao giúp thị trường dễ hấp thụ cung, nhưng cũng có thể là giao dịch nóng nếu độ rộng kém.`,
        benchmark: "So với trung bình 20-60 phiên sẽ hữu ích hơn nhiều so với nhìn một con số tuyệt đối.",
        impact: "Thanh khoản cải thiện hỗ trợ chứng khoán, ngân hàng và nhóm dẫn dắt; thanh khoản yếu làm tín hiệu giá dễ nhiễu.",
        caveat: "Cần xem độ rộng thị trường, nhóm ngành dẫn dắt và tỷ trọng giao dịch ở vài cổ phiếu lớn.",
      };
    }
    default:
      return {
        current: `${formattedValue} là số liệu hiện có của chỉ số này. Hãy đọc nó như một biến đầu vào, không phải kết luận cuối cùng.`,
        benchmark: "Mốc đọc nhanh phụ thuộc vào đơn vị, tần suất và lịch sử của từng chỉ số.",
        impact: metric.marketImpact,
        caveat: "Cần so sánh với các kỳ trước, nguồn dữ liệu và ngành chịu tác động trực tiếp.",
      };
  }
}
