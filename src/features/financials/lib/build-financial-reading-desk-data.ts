import {
  assessDataQuality,
  calculateCfoToNetProfit,
  calculateCurrentRatio,
  calculateDebtToEquity,
  calculateFinancialHealth,
  calculateFreeCashFlow,
  calculateGrossMargin,
  calculateNetMargin,
  calculateRevenueGrowth,
  calculateRoa,
  calculateRoe,
  calculateValuationReadiness,
  type FinancialMetricResult,
  type MetricLevel,
  type ValuationReadinessStatus,
} from "../../../lib/financial-logic";
import { DEFAULT_THRESHOLDS } from "../../../lib/financial-logic/thresholds";
import type { FinancialStatementInput } from "../../../lib/financial-logic/types";
import type {
  FinancialConclusionReadiness,
  FinancialDeskMetric,
  FinancialDeskMetricStatus,
  FinancialReadingDeskData,
  FinancialStatementLineItem,
  FinancialStatementDeskItem,
  FinancialValuationNavigationStatus,
} from "../types";
import type { FinancialsIndustryMetricReference } from "./financials-runtime-types";
import { mapFinancialsToLogicInput, type FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

type MetricPatch = {
  id: string;
  label?: string;
};

type MarginReferenceCode = "GROSS_MARGIN_COMPANY_REFERENCE" | "NET_MARGIN_COMPANY_REFERENCE";

const levelToDeskStatus = (level: MetricLevel): FinancialDeskMetricStatus => {
  if (level === "good") return "good";
  if (level === "risk" || level === "danger") return "risk";
  if (level === "watch") return "watch";
  if (level === "unknown" || level === "not_applicable") return "unknown";
  return "neutral";
};

const metricValueLabel = (metric: FinancialMetricResult): string => {
  if (metric.value !== null) return metric.displayValue;
  if (metric.level === "not_applicable") return "Không phù hợp để diễn giải";
  return "Chưa đủ dữ liệu";
};

const metricLevelLabel = (metric: FinancialMetricResult): string => {
  if (metric.level === "good") return "tốt sơ bộ";
  if (metric.level === "neutral") return "ở vùng chấp nhận được";
  if (metric.level === "watch") return "cần theo dõi";
  if (metric.level === "risk" || metric.level === "danger") return "có rủi ro";
  if (metric.level === "not_applicable") return "không phù hợp để diễn giải thông thường";
  return "chưa đủ dữ liệu";
};

const percent = (value: number): string => `${(value * 100).toFixed(0)}%`;
const percentVi = (value: number, digits = 2): string => `${value.toFixed(digits).replace(".", ",")}%`;
const moneyVi = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? `${(value / 1_000_000_000_000).toFixed(1).replace(".", ",")} nghìn tỷ` : "chưa có dữ liệu";

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const moneyLine = (label: string, value: number | null | undefined, note?: string): FinancialStatementLineItem => ({
  label,
  value: moneyVi(value),
  status: isFiniteNumber(value) ? "available" : "missing",
  note: isFiniteNumber(value) ? note : "Chưa có trong bộ dữ liệu hiện tại",
});

const derivedMoneyLine = (
  label: string,
  value: number | null | undefined,
  note: string,
): FinancialStatementLineItem => ({
  label,
  value: moneyVi(value),
  status: isFiniteNumber(value) ? "derived" : "missing",
  note: isFiniteNumber(value) ? note : "Chưa đủ dữ liệu để suy ra",
});

const unavailableLine = (label: string, note: string): FinancialStatementLineItem => ({
  label,
  value: "Chưa có dữ liệu",
  status: "missing",
  note,
});

const marginReferenceCodeByMetricKey: Partial<Record<string, MarginReferenceCode>> = {
  grossMargin: "GROSS_MARGIN_COMPANY_REFERENCE",
  netMargin: "NET_MARGIN_COMPANY_REFERENCE",
};

const tickerFromSourceKey = (sourceKey: string): string => {
  const parts = sourceKey.split(":");
  return parts.length >= 4 ? parts[2] : sourceKey;
};

const hasPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const peerComparisonByMetric = (
  metric: FinancialMetricResult,
  context?: FinancialStatementInput,
  reference?: FinancialsIndustryMetricReference | null,
): string | undefined => {
  if (metric.value === null) return undefined;

  const referenceCode = marginReferenceCodeByMetricKey[metric.key];
  if (!referenceCode) return undefined;

  if (!reference || reference.status !== "available" || reference.metrics.length === 0) {
    return "Chưa có mẫu tham chiếu cùng ngành đủ điều kiện để so sánh. Không nên kết luận tốt/xấu chỉ bằng một ngưỡng cố định.";
  }

  const currentTicker = context?.ticker?.trim().toUpperCase();
  const allPeers = reference.metrics
    .filter((item) => item.metricCode === referenceCode && item.provenanceCount > 0)
    .sort((a, b) => b.value - a.value);
  const peers = currentTicker ? allPeers.filter((peer) => tickerFromSourceKey(peer.sourceKey) !== currentTicker) : allPeers;

  if (allPeers.length === 0) {
    return "Có dữ liệu ngành, nhưng chưa có mẫu tham chiếu phù hợp cho chỉ số này.";
  }

  if (peers.length === 0) {
    return "Hiện mới có mẫu tham chiếu của chính doanh nghiệp này, chưa có peer khác đủ nguồn để so sánh ngang hàng. Vì vậy chưa nên kết luận tốt/xấu theo ngành.";
  }

  const currentPercent = metric.value * 100;
  const higherCount = peers.filter((peer) => currentPercent > peer.value + 0.1).length;
  const equalCount = peers.filter((peer) => Math.abs(currentPercent - peer.value) <= 0.1).length;
  const peerText = peers
    .map((peer) => `${tickerFromSourceKey(peer.sourceKey)} ${peer.periodLabel}: ${percentVi(peer.value)}`)
    .join("; ");

  const positionText =
    equalCount > 0
      ? `xấp xỉ ${equalCount}/${peers.length} mẫu`
      : higherCount === peers.length
        ? `cao hơn toàn bộ ${peers.length}/${peers.length} mẫu`
        : higherCount === 0
          ? `thấp hơn toàn bộ ${peers.length}/${peers.length} mẫu`
          : `cao hơn ${higherCount}/${peers.length} mẫu`;

  const provenanceText = reference.readyForUiDisplay
    ? "các mẫu đều có nguồn/provenance, nhưng vẫn là dữ liệu nghiên cứu cần rà soát."
    : "Một phần mẫu tham chiếu chưa đủ provenance, nên chỉ dùng để gợi ý câu hỏi tiếp theo.";

  return `So với mẫu tham chiếu đang có (${peerText}), mức ${metric.displayValue} đang ${positionText}. Đây chưa phải benchmark ngành; ${provenanceText}`;
};

const benchmarkGuideByMetric = (
  metric: FinancialMetricResult,
  reference?: FinancialsIndustryMetricReference | null,
): string => {
  if (metric.key === "revenueGrowth") {
    return `Đọc thực chiến: tăng trưởng doanh thu chỉ là điểm mở đầu. Trên ${percent(DEFAULT_THRESHOLDS.growth.strong)} là tăng mạnh, nhưng phải hỏi tiếp: biên lợi nhuận có giữ được không, CFO có đi cùng không, và tăng trưởng có đến từ bán chịu hay tồn kho không.`;
  }

  if (metric.key === "grossMargin" || metric.key === "netMargin") {
    const sampleCount =
      reference?.metrics.filter((item) => item.metricCode === marginReferenceCodeByMetricKey[metric.key]).length ?? 0;
    if (sampleCount > 0) {
      return `Không dùng mốc cứng để kết luận. Hãy đọc cùng lịch sử doanh nghiệp và ${sampleCount} mẫu tham chiếu cùng ngành đang có ở phần so sánh.`;
    }

    return `Trên ${percent(DEFAULT_THRESHOLDS.margin.good)} là tốt sơ bộ; ${percent(DEFAULT_THRESHOLDS.margin.watch)}-${percent(DEFAULT_THRESHOLDS.margin.good)} là vùng trung tính; 0-${percent(DEFAULT_THRESHOLDS.margin.watch)} là mỏng; âm là rủi ro. Mốc này chỉ là ngưỡng nội bộ tạm thời khi chưa có mẫu ngành.`;
  }

  if (metric.key === "roe") {
    return `Đọc thực chiến: ROE trên ${percent(DEFAULT_THRESHOLDS.roe.good)} thường hấp dẫn hơn, ${percent(DEFAULT_THRESHOLDS.roe.watch)}-${percent(DEFAULT_THRESHOLDS.roe.good)} là vùng chấp nhận được. Nhưng ROE chỉ đáng tin khi không bị thổi lên bởi nợ cao, vốn chủ thấp bất thường hoặc lợi nhuận chu kỳ.`;
  }

  if (metric.key === "roa") {
    return `Đọc thực chiến: ROA trên ${percent(DEFAULT_THRESHOLDS.roa.good)} là tốt sơ bộ, ${percent(DEFAULT_THRESHOLDS.roa.watch)}-${percent(DEFAULT_THRESHOLDS.roa.good)} là trung tính. Với ngành tài sản nặng, hãy so ROA theo nhiều năm và với peer, không so máy móc với ngành tài sản nhẹ.`;
  }

  if (metric.key === "debtToEquity") {
    return "Đọc thực chiến: D/E dưới 1x thường chưa quá căng, 1-2x bắt đầu cần soi kỳ hạn và lãi vay, trên 2x là áp lực nợ cao. Nhưng D/E không đủ một mình; phải xem tiền mặt, CFO, nợ ngắn hạn/dài hạn và chi phí lãi vay.";
  }

  if (metric.key === "currentRatio") {
    return `Đọc thực chiến: trên ${DEFAULT_THRESHOLDS.liquidity.currentRatioGood}x là đệm tốt hơn, 1-${DEFAULT_THRESHOLDS.liquidity.currentRatioGood}x cần soi chất lượng tài sản ngắn hạn, dưới 1x là áp lực thanh khoản. Nếu thiếu currentAssets/currentLiabilities thì chưa được kết luận.`;
  }

  if (metric.key === "cfoToNetProfit") {
    return `Đọc thực chiến: quanh 1x nghĩa là tiền kinh doanh xấp xỉ lợi nhuận kế toán; trên ${DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitGood}x là tín hiệu tốt sơ bộ; ${DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitWatch}-${DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitGood}x cần soi vốn lưu động; dưới ${DEFAULT_THRESHOLDS.cashFlow.cfoToNetProfitWatch}x là lợi nhuận chưa ra tiền tương xứng.`;
  }

  if (metric.key === "freeCashFlow") {
    return "FCF = CFO - CAPEX, hoặc lấy trực tiếp từ dòng tiền tự do nếu nguồn đã tính sẵn. Có CFO thôi chưa đủ, vì doanh nghiệp còn phải chi tiền đầu tư duy trì/mở rộng trước khi biết còn dư tiền tự do hay không.";
  }

  return "Đây chỉ là khung sơ bộ; cần so với ngành, chu kỳ kinh doanh và dữ liệu các năm trước.";
};

const previousGrossMarginText = (context?: FinancialStatementInput): string | null => {
  if (!hasPositiveFiniteNumber(context?.previousGrossProfit) || !hasPositiveFiniteNumber(context?.previousRevenue)) {
    return null;
  }

  const previousMargin = context.previousGrossProfit / context.previousRevenue;
  const currentMargin =
    hasPositiveFiniteNumber(context.grossProfit) && hasPositiveFiniteNumber(context.revenue)
      ? context.grossProfit / context.revenue
      : null;
  if (currentMargin === null) return null;

  const change = currentMargin - previousMargin;
  if (Math.abs(change) < 0.0025) {
    return ` Gần như đi ngang so với năm trước (${(previousMargin * 100).toFixed(1)}%).`;
  }

  return change > 0
    ? ` Cao hơn năm trước ${(change * 100).toFixed(1)} điểm %, từ ${(previousMargin * 100).toFixed(1)}% lên ${(currentMargin * 100).toFixed(1)}%.`
    : ` Thấp hơn năm trước ${Math.abs(change * 100).toFixed(1)} điểm %, từ ${(previousMargin * 100).toFixed(1)}% xuống ${(currentMargin * 100).toFixed(1)}%.`;
};

const contextLabel = (context?: FinancialStatementInput): string =>
  [context?.ticker, context?.period].filter(Boolean).join(" ") || "kỳ hiện tại";

const currentInterpretationByMetric = (metric: FinancialMetricResult, context?: FinancialStatementInput): string => {
  if (metric.value === null) {
    if (metric.key === "freeCashFlow") {
      const hasCfo = isFiniteNumber(context?.operatingCashFlow);
      const cfoText = hasCfo ? `Hệ thống đã có CFO ${moneyVi(context?.operatingCashFlow)},` : "Hệ thống chưa có CFO,";
      return `${cfoText} nhưng chưa có CAPEX hoặc dòng freeCashFlow đã tính sẵn. Vì vậy chưa thể nói sau đầu tư doanh nghiệp còn dư bao nhiêu tiền tự do. Không được lấy CFO thay cho FCF vì sẽ bỏ qua tiền đầu tư nhà máy, máy móc, cửa hàng hoặc tài sản dài hạn.`;
    }

    if (metric.key === "currentRatio") {
      return "Chưa thể đọc thanh khoản ngắn hạn vì thiếu tài sản ngắn hạn hoặc nợ ngắn hạn. Có tổng tài sản không thay thế được chỉ số này, vì doanh nghiệp có thể có nhiều tài sản dài hạn nhưng vẫn căng tiền ngắn hạn.";
    }

    return metric.level === "not_applicable"
      ? "Chỉ số này không phù hợp để kết luận theo cách thông thường với dữ liệu hiện tại."
      : "Chưa đủ dữ liệu để nói con số này tốt hay xấu; cần bổ sung các dòng dữ liệu đầu vào trước.";
  }

  const levelLabel = metricLevelLabel(metric);
  const displayValue = metric.displayValue;

  if (metric.key === "grossMargin") {
    return `${displayValue} nghĩa là cứ 100 đồng doanh thu thì còn khoảng ${(metric.value * 100).toFixed(1)} đồng sau giá vốn.${previousGrossMarginText(context) ?? ""} Kết luận chắc hơn khi đọc cùng lịch sử doanh nghiệp, mẫu tham chiếu cùng ngành và chất lượng nguồn dữ liệu.`;
  }

  if (metric.key === "netMargin") {
    return `${displayValue} nghĩa là cứ 100 đồng doanh thu thì giữ lại khoảng ${(metric.value * 100).toFixed(1)} đồng LNST. Với ${contextLabel(context)}, doanh thu ${moneyVi(context?.revenue)} tạo ra LNST ${moneyVi(context?.netProfit)}. Đây là mức chấp nhận được, nhưng vẫn cần soi thêm giá vốn, chi phí lãi vay, khoản bất thường và chu kỳ ngành.`;
  }

  if (metric.key === "revenueGrowth") {
    return `${displayValue} cho biết doanh thu đang thay đổi so với kỳ trước. Với dữ liệu hiện tại, doanh thu tăng từ ${moneyVi(context?.previousRevenue)} lên ${moneyVi(context?.revenue)}. Tăng trưởng chỉ đáng tin khi biên lợi nhuận và CFO đi cùng; nếu doanh thu tăng nhưng tiền không về, cần soi phải thu và tồn kho.`;
  }

  if (metric.key === "roe") {
    return `${displayValue} nghĩa là 100 đồng vốn chủ tạo ra khoảng ${(metric.value * 100).toFixed(1)} đồng LNST. Với ${contextLabel(context)}, vốn chủ ${moneyVi(context?.totalEquity)} tạo LNST ${moneyVi(context?.netProfit)}. Mức này ở vùng chấp nhận được; điểm cần soi là ROE có đến từ vận hành thật hay chỉ nhờ đòn bẩy, vốn chủ thấp hoặc chu kỳ ngành.`;
  }

  if (metric.key === "roa") {
    return `${displayValue} nghĩa là 100 đồng tài sản tạo khoảng ${(metric.value * 100).toFixed(1)} đồng LNST. Nếu doanh nghiệp thuộc nhóm tài sản nặng, ROA không cần cao như ngành tài sản nhẹ, nhưng phải đủ để bù chi phí vốn và chu kỳ đầu tư. Vì thiếu tài sản kỳ trước, chỉ số này đang dùng tài sản cuối kỳ nên độ tin cậy thấp hơn.`;
  }

  if (metric.key === "debtToEquity") {
    return `${displayValue} nghĩa là nợ vay bằng khoảng ${(metric.value * 100).toFixed(0)}% vốn chủ. Với ${contextLabel(context)}, nợ vay ${moneyVi(context?.totalDebt)} so với vốn chủ ${moneyVi(context?.totalEquity)}. Mức này chưa phải đòn bẩy căng, nhưng vẫn phải soi tiền mặt, kỳ hạn nợ và chi phí lãi vay.`;
  }

  if (metric.key === "currentRatio") {
    return `${displayValue} cho biết tài sản ngắn hạn có phủ được nợ ngắn hạn không. Mức này đang ${levelLabel}; nếu tài sản ngắn hạn chủ yếu là tồn kho chậm bán hoặc phải thu khó thu thì chỉ số đẹp vẫn có thể đánh lừa.`;
  }

  if (metric.key === "cfoToNetProfit") {
    const cfo = isFiniteNumber(context?.operatingCashFlow) ? context.operatingCashFlow : null;
    const netProfit = isFiniteNumber(context?.netProfit) ? context.netProfit : null;
    const gap = isFiniteNumber(cfo) && isFiniteNumber(netProfit) ? cfo - netProfit : null;
    const gapText = isFiniteNumber(gap)
      ? gap >= 0
        ? ` CFO đang cao hơn LNST khoảng ${moneyVi(gap)}, tức lợi nhuận kế toán có tiền thật xác nhận ở mức khá.`
        : ` CFO đang thấp hơn LNST khoảng ${moneyVi(Math.abs(gap))}, cần soi tiền bị kẹt ở tồn kho, phải thu hoặc trả trước.`
      : "";
    return `${displayValue} nghĩa là mỗi 1 đồng lợi nhuận sau thuế đang tạo ra khoảng ${displayValue.replace("x", "")} đồng tiền kinh doanh.${gapText} Đây là tín hiệu tốt sơ bộ khi đọc riêng năm hiện tại, nhưng chưa đủ để kết luận dòng tiền bền: vẫn cần xem phải thu, tồn kho, CAPEX và lịch vay/trả nợ.`;
  }

  if (metric.key === "freeCashFlow") {
    return `${displayValue} là lượng tiền còn lại sau khi lấy CFO trừ tiền đầu tư. Mức này đang ${levelLabel}; cần xem FCF dương có bền, có đến từ hoạt động kinh doanh thật hay chỉ do cắt giảm đầu tư tạm thời.`;
  }

  return `${displayValue} đang được xếp loại ${levelLabel}. Hãy đọc cùng nguồn dữ liệu, xu hướng nhiều kỳ và bối cảnh ngành.`;
};

const goodSignalByMetric = (metric: FinancialMetricResult, context?: FinancialStatementInput): string => {
  if (metric.key === "revenueGrowth") {
    return "Doanh thu tăng có giá trị hơn khi đi cùng biên gộp/biên ròng ổn và CFO tăng. Đây là tín hiệu sản lượng, giá bán hoặc nhu cầu thị trường đang thuận hơn.";
  }

  if (metric.key === "grossMargin") {
    return "Biên gộp cải thiện cho thấy doanh nghiệp giữ được nhiều tiền hơn sau giá vốn. Với thép, đây thường là tín hiệu giá bán, nguyên liệu hoặc mix sản phẩm đang thuận hơn.";
  }

  if (metric.key === "netMargin") {
    return `Biên ròng ${metric.displayValue} cho thấy sau giá vốn, chi phí vận hành, lãi vay và thuế, doanh nghiệp vẫn giữ lại được phần lợi nhuận đáng kể.`;
  }

  if (metric.key === "roe") {
    return "ROE ở vùng chấp nhận được và không đi kèm D/E quá cao là nền tương đối ổn để nối sang định giá, miễn là lợi nhuận có dòng tiền xác nhận.";
  }

  if (metric.key === "roa") {
    return "ROA dương cho thấy khối tài sản lớn vẫn tạo lợi nhuận. Với ngành tài sản nặng, nên đọc ROA cùng vòng quay tài sản và chu kỳ đầu tư.";
  }

  if (metric.key === "debtToEquity") {
    return `D/E ${metric.displayValue} cho thấy nợ vay chưa vượt vốn chủ. Nếu CFO vẫn dương như hiện tại (${moneyVi(context?.operatingCashFlow)}), áp lực nợ nhìn sơ bộ chưa quá căng.`;
  }

  if (metric.key === "currentRatio") {
    return "Khi có đủ dữ liệu, chỉ số trên 1 và tài sản ngắn hạn có chất lượng tốt sẽ cho thấy doanh nghiệp có đệm trả nợ ngắn hạn.";
  }

  if (metric.key === "cfoToNetProfit") {
    return "CFO bằng hoặc cao hơn LNST cho thấy lợi nhuận kế toán có tiền kinh doanh xác nhận. Đây là điểm cộng lớn trước khi dùng lợi nhuận để định giá.";
  }

  if (metric.key === "freeCashFlow") {
    return "FCF dương và lặp lại nhiều năm cho thấy sau khi đầu tư, doanh nghiệp vẫn còn tiền để giảm nợ, chia cổ tức hoặc tái đầu tư.";
  }

  return metric.dataQuality === "sufficient"
    ? "Dữ liệu đủ để đọc sơ bộ, nhưng vẫn cần so với ngành và các kỳ trước."
    : "Chỉ đọc như tín hiệu tham khảo vì dữ liệu chưa đầy đủ.";
};

const badSignalByMetric = (metric: FinancialMetricResult): string => {
  if (metric.key === "revenueGrowth") {
    return "Không được khen doanh thu tăng nếu biên lợi nhuận co lại, CFO yếu, hoặc tăng trưởng đến từ bán chịu làm phải thu phình ra.";
  }

  if (metric.key === "grossMargin") {
    return "Biên gộp tốt một năm chưa đủ. Với ngành thép, biên có thể đảo chiều khi giá bán giảm, nguyên liệu tăng hoặc tồn kho bị trích lập.";
  }

  if (metric.key === "netMargin") {
    return "Không nên dùng biên ròng một năm để kết luận bền vững. Cần tách lợi nhuận bất thường, lãi vay, thuế và chu kỳ giá hàng hóa.";
  }

  if (metric.key === "roe") {
    return `ROE ${metric.displayValue} vẫn có thể kém hấp dẫn nếu đến từ đòn bẩy, lợi nhuận chu kỳ hoặc vốn chủ thấp bất thường. Hãy đọc cùng D/E và CFO.`;
  }

  if (metric.key === "roa") {
    return "ROA đang kém tin cậy hơn vì thiếu tài sản kỳ trước. Đừng dùng ROA cuối kỳ để kết luận hiệu quả tài sản dài hạn nếu chưa có dữ liệu nhiều năm.";
  }

  if (metric.key === "debtToEquity") {
    return "D/E thấp không có nghĩa là an toàn tuyệt đối. Vẫn cần biết nợ ngắn hạn/dài hạn, tiền mặt, lãi vay và lịch đáo hạn; thiếu các phần này thì chưa đánh giá được áp lực nợ thật.";
  }

  if (metric.key === "currentRatio") {
    return "Thiếu tài sản ngắn hạn và nợ ngắn hạn nên chưa đọc được thanh khoản. Tổng tài sản lớn không đảm bảo công ty có đủ tiền trả nợ ngắn hạn.";
  }

  if (metric.key === "cfoToNetProfit") {
    return "Không được kết luận công ty tốt chỉ vì CFO/LNST trên 1 trong một năm. Cần soi xem CFO cao do hoạt động kinh doanh thật, hay do giảm tồn kho/phải thu tạm thời.";
  }

  if (metric.key === "freeCashFlow") {
    return "Không được lấy CFO làm FCF. Nếu thiếu CAPEX hoặc freeCashFlow, chưa biết sau đầu tư doanh nghiệp còn dư tiền hay phải tiếp tục vay/bán tài sản.";
  }

  return metric.warning ?? metric.commonMisread;
};

const dataQualityInterpretation = (
  dataQuality: ReturnType<typeof assessDataQuality>,
  input: FinancialStatementInput,
): string => {
  const missing = dataQuality.missingFields;
  if (missing.length === 0) {
    return "Bộ dữ liệu hiện đủ để đọc sơ bộ các chỉ số chính. Tuy vậy đây vẫn là dữ liệu nghiên cứu, cần đối chiếu báo cáo gốc trước khi dùng cho quyết định thật.";
  }

  const missingText = missing.join(", ");
  const knownText = [
    isFiniteNumber(input.revenue) ? "doanh thu" : null,
    isFiniteNumber(input.netProfit) ? "LNST" : null,
    isFiniteNumber(input.totalAssets) ? "tổng tài sản" : null,
    isFiniteNumber(input.totalEquity) ? "vốn chủ" : null,
    isFiniteNumber(input.totalDebt) ? "nợ vay" : null,
    isFiniteNumber(input.operatingCashFlow) ? "CFO" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const impactText = missing
    .map((field) => {
      if (field === "totalLiabilities") return "thiếu tổng nợ phải trả nên chưa đọc được nợ phải trả/tài sản và cấu trúc nguồn vốn đầy đủ";
      if (field === "volume") return "thiếu khối lượng giao dịch nên phần thanh khoản thị trường/định giá giao dịch còn yếu";
      if (field === "closePrice") return "thiếu giá thị trường nên chưa nối định giá P/E, P/B hoặc vốn hóa";
      if (field === "operatingCashFlow") return "thiếu CFO nên chưa xác nhận được chất lượng lợi nhuận bằng tiền";
      if (field === "totalAssets") return "thiếu tổng tài sản nên ROA và hiệu quả tài sản không đọc được";
      if (field === "totalEquity") return "thiếu vốn chủ nên ROE và D/E không đọc được";
      if (field === "revenue") return "thiếu doanh thu nên không đọc được tăng trưởng và biên lợi nhuận";
      if (field === "netProfit") return "thiếu LNST nên không đọc được biên ròng, ROE, ROA";
      return `thiếu ${field}`;
    })
    .join("; ");

  return `Có thể đọc sơ bộ vì đã có ${knownText || "một số dòng chính"}, nhưng chưa đủ để đọc sâu mọi rủi ro. Các trường còn thiếu (${missingText}) ảnh hưởng cụ thể: ${impactText}.`;
};

const dataQualityBenchmarkGuide = (dataQuality: ReturnType<typeof assessDataQuality>): string =>
  dataQuality.missingFields.length === 0
    ? "Dùng được cho đọc sơ bộ, nhưng vẫn cần so với báo cáo gốc và dữ liệu nhiều năm."
    : "Nguyên tắc thực chiến: thiếu trường nào thì không kết luận phần đó. Thiếu totalLiabilities thì chưa đọc được nợ phải trả/tài sản; thiếu volume thì chưa đọc được thanh khoản thị trường; thiếu closePrice thì chưa nối được định giá thị trường.";

const toDeskMetric = (
  metric: FinancialMetricResult,
  patch: MetricPatch,
  context?: FinancialStatementInput,
  reference?: FinancialsIndustryMetricReference | null,
): FinancialDeskMetric => ({
  id: patch.id,
  label: patch.label ?? metric.label,
  value: metricValueLabel(metric),
  unit: undefined,
  period: metric.period ?? "Kỳ hiện tại",
  status: levelToDeskStatus(metric.level),
  definition: metric.explanation,
  howToRead: metric.beginnerInterpretation,
  goodSignal: goodSignalByMetric(metric, context),
  badSignal: badSignalByMetric(metric),
  currentInterpretation: currentInterpretationByMetric(metric, context),
  benchmarkGuide: benchmarkGuideByMetric(metric, reference),
  peerComparison: peerComparisonByMetric(metric, context, reference),
  dataQuality: metric.dataQuality,
  warning: metric.warning,
  missingFields: metric.missingFields,
  logicKey: metric.key,
});

const metricValue = (metrics: FinancialDeskMetric[], id: string): string =>
  metrics.find((metric) => metric.id === id)?.value ?? "chưa đủ dữ liệu";

const buildStatementMap = (
  baseItems: FinancialStatementDeskItem[],
  metrics: FinancialDeskMetric[],
  input: FinancialStatementInput,
): FinancialStatementDeskItem[] => {
  const revenueGrowth = metricValue(metrics, "revenue-growth");
  const grossMargin = metricValue(metrics, "gross-margin");
  const netMargin = metricValue(metrics, "net-margin");
  const debtToEquity = metricValue(metrics, "debt-to-equity");
  const currentRatio = metricValue(metrics, "current-ratio");
  const roa = metricValue(metrics, "roa");
  const cfoToNetProfit = metricValue(metrics, "cfo-to-net-profit");
  const fcf = metricValue(metrics, "fcf");
  const costOfGoodsSold =
    isFiniteNumber(input.revenue) && isFiniteNumber(input.grossProfit) ? input.revenue - input.grossProfit : null;

  return baseItems.map((item) => {
    if (item.id === "income-statement") {
      return {
        ...item,
        relatedMetricIds: ["revenue-growth", "gross-margin", "net-margin", "roe"],
        readSummary: `KQKD đang nói: doanh thu ${moneyVi(input.revenue)}, tăng trưởng ${revenueGrowth}; biên gộp ${grossMargin}, biên ròng ${netMargin}.`,
        sourceLines: [
          moneyLine("Doanh thu", input.revenue, "Dòng gốc từ báo cáo kết quả kinh doanh"),
          derivedMoneyLine("Giá vốn", costOfGoodsSold, "Suy ra = doanh thu - lợi nhuận gộp"),
          moneyLine("Lợi nhuận gộp", input.grossProfit, "Dòng gốc để tính biên lợi nhuận gộp"),
          unavailableLine("Chi phí bán hàng", "Bộ dữ liệu HPG 2025 hiện chưa lưu dòng chi phí bán hàng riêng"),
          moneyLine("LNST", input.netProfit, "Dòng gốc để tính biên lợi nhuận ròng, ROE và ROA"),
        ],
        dataPoints: [
          `Doanh thu hiện tại: ${moneyVi(input.revenue)}`,
          `Doanh thu năm trước: ${moneyVi(input.previousRevenue)}`,
          `Lợi nhuận sau thuế: ${moneyVi(input.netProfit)}`,
          `Lợi nhuận gộp: ${moneyVi(input.grossProfit)}`,
        ],
        interpretation:
          "Nếu doanh thu tăng và biên lợi nhuận cùng cải thiện, câu chuyện kinh doanh đang sáng hơn. Nếu doanh thu tăng nhưng biên ròng không theo kịp, cần soi giá vốn, chi phí bán hàng, chi phí tài chính và khoản bất thường.",
        watchOut:
          "Đừng chỉ nhìn doanh thu. Với doanh nghiệp thép, giá bán, giá nguyên liệu và chu kỳ tồn kho có thể làm biên lợi nhuận biến động mạnh.",
      };
    }

    if (item.id === "balance-sheet") {
      return {
        ...item,
        relatedMetricIds: ["debt-to-equity", "current-ratio", "roa", "data-quality"],
        readSummary: `Bảng cân đối đang nói: tổng tài sản ${moneyVi(input.totalAssets)}, vốn chủ ${moneyVi(input.totalEquity)}, nợ vay/vốn chủ ${debtToEquity}.`,
        sourceLines: [
          moneyLine("Tổng tài sản", input.totalAssets, "Dòng gốc đang có trong bảng cân đối"),
          moneyLine("Vốn chủ sở hữu", input.totalEquity, "Dòng gốc để tính ROE và nợ vay/vốn chủ"),
          moneyLine("Nợ vay", input.totalDebt, "Dòng gốc dùng để đọc đòn bẩy tài chính"),
          moneyLine("Tiền và tương đương tiền", input.cashAndEquivalents, "Cần để đọc thanh khoản tiền mặt"),
          moneyLine("Hàng tồn kho", input.inventory, "Cần để kiểm tra vốn lưu động"),
          moneyLine("Phải thu", input.accountsReceivable, "Cần để kiểm tra doanh thu có chuyển thành tiền không"),
        ],
        dataPoints: [
          `Tổng tài sản: ${moneyVi(input.totalAssets)}`,
          `Vốn chủ sở hữu: ${moneyVi(input.totalEquity)}`,
          `Nợ vay: ${moneyVi(input.totalDebt)}`,
          `ROA: ${roa}; thanh khoản hiện hành: ${currentRatio}`,
        ],
        interpretation:
          "Bảng cân đối cho biết lợi nhuận đang được tạo ra trên nền tài sản nào và doanh nghiệp dùng nợ hay vốn chủ để tài trợ. Nợ/vốn chủ không tự động xấu, nhưng phải đọc cùng dòng tiền và chu kỳ ngành.",
        watchOut:
          "Nếu nợ vay tăng nhanh hơn dòng tiền kinh doanh, tăng trưởng lợi nhuận có thể đi kèm áp lực lãi vay hoặc nhu cầu vốn lưu động lớn.",
      };
    }

    if (item.id === "cash-flow") {
      return {
        ...item,
        relatedMetricIds: ["cfo-to-net-profit", "fcf", "net-margin"],
        readSummary: `Dòng tiền đang nói: CFO ${moneyVi(input.operatingCashFlow)}, CFO/LNST ${cfoToNetProfit}, FCF ${fcf}.`,
        sourceLines: [
          moneyLine("CFO", input.operatingCashFlow, "Dòng tiền từ hoạt động kinh doanh"),
          moneyLine("CAPEX", input.capitalExpenditure, "Cần để tính dòng tiền tự do"),
          moneyLine("FCF", input.freeCashFlow, "Nếu thiếu, hệ thống không tự thay bằng CFO"),
          unavailableLine("Vay/trả nợ", "Bộ dữ liệu hiện chưa tách dòng tiền tài chính chi tiết"),
          unavailableLine("Cổ tức", "Bộ dữ liệu hiện chưa lưu dòng cổ tức tiền mặt"),
        ],
        dataPoints: [
          `Dòng tiền kinh doanh: ${moneyVi(input.operatingCashFlow)}`,
          `Lợi nhuận sau thuế: ${moneyVi(input.netProfit)}`,
          `CFO/LNST: ${cfoToNetProfit}`,
          `Dòng tiền tự do: ${fcf}`,
        ],
        interpretation:
          "CFO cho biết lợi nhuận có chuyển thành tiền thật hay không. CFO cao hơn lợi nhuận là tín hiệu thuận lợi, nhưng FCF vẫn cần CAPEX/free cash flow để biết sau đầu tư doanh nghiệp còn dư tiền hay không.",
        watchOut:
          "Nếu FCF chưa đủ dữ liệu, chưa nên kết luận doanh nghiệp tạo tiền tự do tốt hay xấu. Cần bổ sung CAPEX hoặc free cash flow từ báo cáo lưu chuyển tiền tệ.",
      };
    }

    return item;
  });
};

const upsertMetric = (metrics: FinancialDeskMetric[], nextMetric: FinancialDeskMetric): FinancialDeskMetric[] => {
  const index = metrics.findIndex((metric) => metric.id === nextMetric.id);
  if (index === -1) return [...metrics, nextMetric];
  return metrics.map((metric, currentIndex) => (currentIndex === index ? { ...metric, ...nextMetric } : metric));
};

const healthStatusLabel: Record<ReturnType<typeof calculateFinancialHealth>["status"], string> = {
  healthy: "Khỏe sơ bộ",
  acceptable: "Tạm ổn, cần đọc tiếp",
  watch: "Cần kiểm tra thêm",
  risk: "Có điểm cần chú ý",
  unknown: "Chưa đủ dữ liệu",
};

const valuationNavigationByStatus: Record<
  ValuationReadinessStatus,
  {
    canContinue: boolean;
    logicStatus: FinancialValuationNavigationStatus;
    status: FinancialConclusionReadiness;
    reason: string;
    nextStepSuggestion: string;
  }
> = {
  ready: {
    canContinue: true,
    logicStatus: "ready",
    status: "Có thể chuyển",
    reason: "Đủ dữ liệu để xem định giá sơ bộ.",
    nextStepSuggestion: "Đủ dữ liệu để xem định giá sơ bộ.",
  },
  partial: {
    canContinue: true,
    logicStatus: "needs_review",
    status: "Cần kiểm tra thêm",
    reason: "Có thể xem định giá sơ bộ, nhưng cần kiểm tra thêm trước khi tin vào định giá.",
    nextStepSuggestion: "Có thể xem định giá sơ bộ, cần kiểm tra thêm trước khi tin vào định giá.",
  },
  not_ready: {
    canContinue: false,
    logicStatus: "not_ready",
    status: "Chưa nên định giá",
    reason: "Chưa đủ dữ liệu để đọc định giá có trách nhiệm.",
    nextStepSuggestion: "Bổ sung dữ liệu còn thiếu trước khi chuyển sang định giá.",
  },
  unknown: {
    canContinue: false,
    logicStatus: "not_ready",
    status: "Chưa nên định giá",
    reason: "Chưa đủ dữ liệu để đọc định giá có trách nhiệm.",
    nextStepSuggestion: "Bổ sung dữ liệu còn thiếu trước khi chuyển sang định giá.",
  },
};

export const buildFinancialReadingDeskData = (
  baseData: FinancialReadingDeskData,
  snapshot: FinancialsStatementSnapshot,
  industryMetricReference?: FinancialsIndustryMetricReference | null,
): FinancialReadingDeskData => {
  const logicInput = mapFinancialsToLogicInput(snapshot);
  const financialHealth = calculateFinancialHealth(logicInput);
  const dataQuality = assessDataQuality(logicInput);
  const valuationReadiness = calculateValuationReadiness(logicInput);
  const valuationNavigation = valuationNavigationByStatus[valuationReadiness.status];
  const valuationReadinessItems =
    valuationReadiness.warnings.length > 0
      ? valuationReadiness.warnings
      : valuationReadiness.missingFields.map((field) => `Thiếu dữ liệu: ${field}.`);

  const logicMetrics = [
    toDeskMetric(
      calculateRevenueGrowth(logicInput),
      { id: "revenue-growth", label: "Tăng trưởng doanh thu" },
      logicInput,
      industryMetricReference,
    ),
    toDeskMetric(calculateGrossMargin(logicInput), { id: "gross-margin" }, logicInput, industryMetricReference),
    toDeskMetric(calculateNetMargin(logicInput), { id: "net-margin" }, logicInput, industryMetricReference),
    toDeskMetric(calculateRoa(logicInput), { id: "roa" }, logicInput, industryMetricReference),
    toDeskMetric(calculateRoe(logicInput), { id: "roe" }, logicInput, industryMetricReference),
    toDeskMetric(calculateDebtToEquity(logicInput), { id: "debt-to-equity" }, logicInput, industryMetricReference),
    toDeskMetric(calculateCurrentRatio(logicInput), { id: "current-ratio" }, logicInput, industryMetricReference),
    toDeskMetric(
      calculateCfoToNetProfit(logicInput),
      { id: "cfo-to-net-profit", label: "CFO / LNST" },
      logicInput,
      industryMetricReference,
    ),
    toDeskMetric(calculateFreeCashFlow(logicInput), { id: "fcf" }, logicInput, industryMetricReference),
    {
      id: "data-quality",
      label: "Chất lượng dữ liệu",
      value: dataQuality.status === "good" ? "Đủ để đọc sơ bộ" : "Cần bổ sung dữ liệu",
      period: logicInput.period ?? baseData.period,
      status: dataQuality.status === "good" ? "neutral" : "unknown",
      definition: "Kiểm tra nguồn, thời điểm cập nhật và các trường dữ liệu cốt lõi.",
      howToRead: dataQuality.beginnerInterpretation,
      goodSignal: "Các dòng chính đang có nguồn và không bị thay thế bằng số 0 giả. Có thể dùng để đặt câu hỏi phân tích tiếp theo.",
      badSignal:
        dataQuality.missingFields.length > 0
          ? "Thiếu dữ liệu không có nghĩa doanh nghiệp xấu; nó chỉ có nghĩa phần liên quan chưa được phép kết luận."
          : "Có con số không có nghĩa con số đó đáng tin tuyệt đối; vẫn cần đối chiếu báo cáo gốc.",
      currentInterpretation: dataQualityInterpretation(dataQuality, logicInput),
      benchmarkGuide: dataQualityBenchmarkGuide(dataQuality),
      dataQuality: dataQuality.status === "good" ? "sufficient" : "partial",
      warning: dataQuality.warnings[0] ?? null,
      missingFields: dataQuality.missingFields,
      logicKey: "dataQuality",
    } satisfies FinancialDeskMetric,
  ];

  const metrics = logicMetrics.reduce(upsertMetric, baseData.metrics);
  const statementMap = buildStatementMap(baseData.statementMap, metrics, logicInput);
  const dataQualityWarnings = dataQuality.warnings.map((warning, index) => ({
    id: `data-quality-${index + 1}`,
    title: "Dữ liệu cần kiểm tra",
    severity: "watch" as const,
    summary: warning,
    cause: "Financial logic đánh dấu dữ liệu thiếu, cũ hoặc chưa có nguồn rõ ràng.",
    targetStepId: "three-statements",
  }));

  return {
    ...baseData,
    preliminaryConclusion: {
      ...baseData.preliminaryConclusion,
      status: healthStatusLabel[financialHealth.status],
      score: financialHealth.score,
      summary:
        financialHealth.status === "unknown"
          ? financialHealth.beginnerInterpretation
          : `${financialHealth.beginnerInterpretation} Điểm cần đọc tiếp: ${
              [...financialHealth.watchPoints, ...financialHealth.riskPoints][0] ??
              "dòng tiền, nợ và biên lợi nhuận."
            }`,
      scoreNote:
        financialHealth.score === null
          ? "Chưa đủ dữ liệu để tính điểm phụ; hệ thống không thay dữ liệu thiếu bằng 0."
          : "Điểm chỉ dùng để định hướng phần cần đọc tiếp, không phải chỉ dẫn giao dịch.",
    },
    warnings: [...dataQualityWarnings, ...baseData.warnings],
    metrics,
    statementMap,
    valuationReadiness: {
      ...baseData.valuationReadiness,
      status: valuationNavigation.status,
      logicStatus: valuationNavigation.logicStatus,
      canContinue: valuationNavigation.canContinue,
      missing: valuationReadinessItems,
      reason: valuationReadiness.beginnerInterpretation || valuationNavigation.reason,
      nextStepSuggestion: valuationNavigation.nextStepSuggestion,
      usableMethods: valuationReadiness.usableMethods,
    },
  };
};
