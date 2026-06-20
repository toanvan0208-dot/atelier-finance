import {
  assessDataQuality,
  calculateAvgTradingValue20d,
  calculateLiquidityRisk,
  calculateLiquidityStatus,
  calculatePriceChangePct,
  calculateTradingValue,
  type FinancialMetricResult,
  type MetricLevel,
  type RiskLevel,
} from "../../../lib/financial-logic";
import type { PVTDerivedMetrics, PVTLogicMetric, PVTObservationData, PVTStatus } from "../types";
import { mapTechnicalToLogicInput, type TechnicalMarketSnapshot } from "./map-technical-to-logic-input";

const UNVERIFIED_METADATA_LABEL = "Chua co du lieu xac minh";
const DERIVED_UNAVAILABLE_LABEL = "Chưa đủ dữ liệu";
const DERIVED_NOT_AVAILABLE_LABEL = "Không khả dụng";
const REQUIRED_TB20_OBSERVATIONS = 20;

const levelToPvtStatus = (level: MetricLevel): PVTStatus => {
  if (level === "good") return "aligned";
  if (level === "watch") return "watch";
  if (level === "risk" || level === "danger") return "risk";
  if (level === "unknown" || level === "not_applicable") return "unclear";
  return "normal";
};

const metricValueLabel = (metric: FinancialMetricResult): string => {
  if (metric.value === null) return "Chưa đủ dữ liệu";
  if (metric.key === "liquidityStatus") {
    if (metric.value === 0) return "Thanh khoản thấp";
    if (metric.value === 1) return "Thanh khoản trung bình";
    if (metric.value === 2) return "Thanh khoản tương đối tốt";
  }
  return metric.displayValue;
};

const toLogicMetric = (metric: FinancialMetricResult): PVTLogicMetric => ({
  id: metric.key,
  label: metric.label,
  value: metricValueLabel(metric),
  rawValue: metric.value,
  status: levelToPvtStatus(metric.level),
  dataQuality: metric.dataQuality,
  warning: metric.warning,
  missingFields: metric.missingFields,
});

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const marketDataQualityRiskLevel = (status: ReturnType<typeof assessDataQuality>["status"]): RiskLevel => {
  if (status === "missing") return "unknown";
  if (status === "poor") return "high";
  if (status === "stale" || status === "usable_with_caution") return "medium";
  return "low";
};

const resolveStatus = (
  priceChange: FinancialMetricResult,
  liquidityStatus: FinancialMetricResult,
  missingFields: string[]
): PVTObservationData["status"] => {
  if (missingFields.length > 0) {
    return {
      label: "Cần bổ sung dữ liệu PVT",
      tone: "caution",
      conclusion: "Chưa đủ dữ liệu giá, khối lượng hoặc nguồn cập nhật để đọc PVT có trách nhiệm.",
    };
  }

  if (priceChange.level === "watch" || liquidityStatus.level === "watch") {
    return {
      label: "Biến động cần kiểm tra thêm",
      tone: "caution",
      conclusion:
        "Giá hoặc thanh khoản đang có biến động đáng chú ý. Đây là dữ liệu quan sát, chưa đủ để kết luận hành động.",
    };
  }

  return {
    label: "Dữ liệu PVT đủ để quan sát sơ bộ",
    tone: "neutral",
    conclusion:
      "Giá, khối lượng và thanh khoản có đủ dữ liệu để đọc sơ bộ, nhưng cần đối chiếu với định giá, rủi ro và bối cảnh ngành.",
  };
};

const updateSignalLayers = (
  baseLayers: PVTObservationData["signalLayers"],
  metrics: {
    priceChange: FinancialMetricResult;
    tradingValue: FinancialMetricResult;
    avgTradingValue20d: FinancialMetricResult;
    liquidityStatus: FinancialMetricResult;
  }
): PVTObservationData["signalLayers"] =>
  baseLayers.map((layer) => {
    if (layer.id === "price") {
      return {
        ...layer,
        conclusion:
          metrics.priceChange.value === null
            ? "Chưa đủ dữ liệu giá để đọc biến động giá so với phiên trước."
            : `Giá thay đổi ${metrics.priceChange.displayValue} so với phiên trước; cần đọc cùng volume và sự kiện liên quan.`,
        evidence: [
          `Thay đổi giá: ${metricValueLabel(metrics.priceChange)}.`,
          ...(metrics.priceChange.warning ? [metrics.priceChange.warning] : []),
          "Biến động giá chỉ là dữ liệu quan sát, không thay thế quyết định của người dùng.",
        ],
      };
    }

    if (layer.id === "volume") {
      return {
        ...layer,
        conclusion: metrics.liquidityStatus.beginnerInterpretation,
        evidence: [
          `Giá trị giao dịch hiện tại: ${metricValueLabel(metrics.tradingValue)}.`,
          `Giá trị giao dịch bình quân 20 phiên: ${metricValueLabel(metrics.avgTradingValue20d)}.`,
          `Trạng thái thanh khoản: ${metricValueLabel(metrics.liquidityStatus)}.`,
        ],
      };
    }

    return layer;
  });

const normalizeTicker = (ticker: string | null | undefined): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized ? normalized : null;
};

const buildIssuerMetadata = (
  baseData: PVTObservationData,
  snapshot: TechnicalMarketSnapshot
): PVTObservationData["issuerMetadata"] => {
  const snapshotTicker = normalizeTicker(snapshot.ticker);
  const baseTicker = normalizeTicker(baseData.ticker);
  const ticker = snapshotTicker ?? baseTicker ?? "UNKNOWN";

  if (snapshotTicker && baseTicker && snapshotTicker !== baseTicker) {
    return {
      ticker,
      displayName: null,
      issuerName: null,
      industry: null,
      sector: null,
      sourceLabel: "unavailable",
      dataMode: "unknown",
      productionApproved: false,
      verificationStatus: "unavailable",
      limitations: [
        "Company/issuer metadata is unavailable for this DB-backed ticker.",
        "Sample company, industry, and sector metadata were not reused because the ticker differs from the sample base ticker.",
      ],
      warnings: ["Issuer metadata has not been verified for this market price ticker."],
    };
  }

  return {
    ticker,
    displayName: baseData.companyName,
    issuerName: baseData.companyName,
    industry: baseData.industry,
    sector: null,
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
    verificationStatus: "static_sample",
    limitations: [
      "Static sample issuer metadata is for local product behavior checks only.",
      "It is not verified production issuer metadata.",
    ],
    warnings: ["Sample/static issuer metadata is not production approved."],
  };
};

const buildDerivedMetrics = ({
  baseData,
  isMarketPriceSeries,
  snapshot,
  volumeRatio,
}: {
  baseData: PVTObservationData;
  isMarketPriceSeries: boolean;
  snapshot: TechnicalMarketSnapshot;
  volumeRatio: number | null;
}): PVTDerivedMetrics => {
  if (!isMarketPriceSeries) {
    return {
      sourceLabel: "sample_static_fallback",
      dataMode: "sample",
      productionApproved: false,
      dataStatus: "static_sample",
      calculationBasis: "static_sample",
      requiredObservations: REQUIRED_TB20_OBSERVATIONS,
      availableObservations: baseData.chart.points.length,
      supportRange: {
        value: baseData.keyLevels.support,
        status: "static_sample",
      },
      resistanceRange: {
        value: baseData.keyLevels.resistance,
        status: "static_sample",
      },
      volumeRatio: {
        value: baseData.volume.currentVsAvg20,
        status: "static_sample",
      },
      fomoScore: {
        value: baseData.fomo.score,
        status: "static_sample",
      },
      limitations: [
        "Static sample PVT derived metrics are for local product behavior checks only.",
        "They are not production-approved technical analysis.",
      ],
      warnings: ["Sample/static derived metrics are not reused in DB-backed mode."],
    };
  }

  const availableObservations = snapshot.availableObservations ?? 0;
  const volumeStatus =
    availableObservations >= REQUIRED_TB20_OBSERVATIONS && volumeRatio !== null
      ? "computed_from_market_price_series"
      : "insufficient_data";

  return {
    sourceLabel: snapshot.sourceName ?? "market_price_series",
    dataMode: snapshot.dataMode ?? "research_only",
    productionApproved: false,
    dataStatus: "insufficient_data",
    calculationBasis: "active_market_price_series",
    requiredObservations: REQUIRED_TB20_OBSERVATIONS,
    availableObservations,
    supportRange: {
      value: null,
      status: "unavailable",
    },
    resistanceRange: {
      value: null,
      status: "unavailable",
    },
    volumeRatio: {
      value: volumeStatus === "computed_from_market_price_series" ? volumeRatio : null,
      status: volumeStatus,
    },
    fomoScore: {
      value: null,
      status: "unavailable",
    },
    limitations: [
      "Support/resistance ranges are not computed unless they come from the active market price series.",
      "Volume TB20 requires at least 20 observations from the active market price series.",
      "FOMO is unavailable unless computed from the active market price series.",
    ],
    warnings: [
      "Sample support/resistance, volume ratio, and FOMO metrics were not reused for DB-backed market price data.",
    ],
  };
};

export const buildTechnicalDeskData = (
  baseData: PVTObservationData,
  snapshot: TechnicalMarketSnapshot
): PVTObservationData => {
  const logicInput = mapTechnicalToLogicInput(snapshot);
  const priceChange = calculatePriceChangePct(logicInput);
  const tradingValue = calculateTradingValue(logicInput);
  const avgTradingValue20d = calculateAvgTradingValue20d(logicInput);
  const liquidityStatus = calculateLiquidityStatus(logicInput);
  const liquidityRisk = calculateLiquidityRisk(logicInput);
  const dataQuality = assessDataQuality(logicInput, { profile: "market" });
  const dataQualityRiskLevel = marketDataQualityRiskLevel(dataQuality.status);

  const metrics = [priceChange, tradingValue, avgTradingValue20d, liquidityStatus].map(toLogicMetric);
  const warnings = unique([
    ...metrics.flatMap((metric) => (metric.warning ? [metric.warning] : [])),
    ...liquidityRisk.warnings,
    ...dataQuality.warnings,
  ]);
  const missingFields = unique([
    ...metrics.flatMap((metric) => metric.missingFields),
    ...liquidityRisk.missingFields,
    ...dataQuality.missingFields,
  ]);
  const snapshotTicker = normalizeTicker(snapshot.ticker);
  const baseTicker = normalizeTicker(baseData.ticker);
  const tickerChanged = Boolean(snapshotTicker && baseTicker && snapshotTicker !== baseTicker);
  const issuerMetadata = buildIssuerMetadata(baseData, snapshot);
  const isMarketPriceSeries = snapshot.sourceKind === "market_price_series";
  const pvtDerivedMetrics = buildDerivedMetrics({
    baseData,
    isMarketPriceSeries,
    snapshot,
    volumeRatio: liquidityStatus.value,
  });

  return {
    ...baseData,
    ticker: snapshot.ticker ?? baseData.ticker,
    companyName:
      tickerChanged
        ? snapshotTicker ?? baseData.ticker
        : baseData.companyName,
    industry: tickerChanged ? UNVERIFIED_METADATA_LABEL : baseData.industry,
    issuerMetadata,
    pvtDerivedMetrics,
    currentPrice: snapshot.closePrice ?? baseData.currentPrice,
    status: resolveStatus(priceChange, liquidityStatus, missingFields),
    keyLevels: isMarketPriceSeries
      ? {
          support: DERIVED_UNAVAILABLE_LABEL,
          resistance: DERIVED_UNAVAILABLE_LABEL,
        }
      : baseData.keyLevels,
    volume: {
      ...baseData.volume,
      currentVsAvg20: isMarketPriceSeries ? null : baseData.volume.currentVsAvg20,
      label: isMarketPriceSeries ? "Chưa đủ 20 phiên" : metricValueLabel(liquidityStatus),
      conclusion:
        liquidityStatus.value === null
          ? "Chưa đủ dữ liệu để đọc thanh khoản."
          : `${liquidityStatus.beginnerInterpretation} Giá trị giao dịch hiện tại: ${metricValueLabel(tradingValue)}.`,
    },
    chart: {
      ...baseData.chart,
      quickRead: [
        {
          question: "Giá thay đổi thế nào?",
          answer:
            priceChange.value === null
              ? "Chưa đủ dữ liệu giá hiện tại hoặc giá phiên trước để tính biến động."
              : `Giá thay đổi ${priceChange.displayValue} so với phiên trước.`,
        },
        {
          question: "Thanh khoản có đủ để quan sát không?",
          answer: liquidityStatus.beginnerInterpretation,
        },
        {
          question: "Dữ liệu có đáng tin để đọc tiếp không?",
          answer:
            dataQuality.status === "good"
              ? "Nguồn và thời điểm cập nhật đủ để đọc sơ bộ."
              : "Dữ liệu còn thiếu nguồn, thời điểm cập nhật hoặc trường cốt lõi; cần kiểm tra thêm.",
        },
      ],
    },
    signalLayers: updateSignalLayers(baseData.signalLayers, {
      priceChange,
      tradingValue,
      avgTradingValue20d,
      liquidityStatus,
    }),
    confirmation: isMarketPriceSeries
      ? ["Chưa đủ dữ liệu để xác định điều kiện xác nhận từ chuỗi DB-backed."]
      : baseData.confirmation,
    invalidation: isMarketPriceSeries
      ? ["Chưa đủ dữ liệu để xác định điều kiện phủ nhận từ chuỗi DB-backed."]
      : baseData.invalidation,
    scenarios: isMarketPriceSeries
      ? [
          {
            name: "Derived metrics unavailable",
            condition: "Chuỗi DB-backed chưa đủ cơ sở để tính vùng kỹ thuật.",
            meaning: "Không sử dụng kịch bản sample cho dữ liệu DB-backed.",
          },
        ]
      : baseData.scenarios,
    riskReward: isMarketPriceSeries
      ? {
          currentPrice: snapshot.closePrice ?? baseData.currentPrice,
          supportPrice: null,
          resistancePrice: null,
          upside: DERIVED_NOT_AVAILABLE_LABEL,
          downside: DERIVED_NOT_AVAILABLE_LABEL,
          conclusion: "Chưa đủ dữ liệu để tính vùng hỗ trợ/kháng cự từ chuỗi DB-backed.",
        }
      : baseData.riskReward,
    fomo: isMarketPriceSeries
      ? {
          level: baseData.fomo.level,
          score: null,
          maxScore: baseData.fomo.maxScore,
          signs: ["FOMO chưa khả dụng cho dữ liệu DB-backed."],
          conclusion: "FOMO chưa khả dụng vì chưa được tính từ cùng chuỗi DB-backed.",
        }
      : baseData.fomo,
    finalConclusion: {
      ...baseData.finalConclusion,
      status: resolveStatus(priceChange, liquidityStatus, missingFields).label,
      caution:
        warnings[0] ??
        "PVT chỉ phản ánh dữ liệu thị trường tại thời điểm quan sát, không phải kết luận hành động.",
      nextStep:
        missingFields.length > 0
          ? "Bổ sung dữ liệu còn thiếu trước khi dùng PVT để hỗ trợ kiểm tra rủi ro thực thi."
          : baseData.finalConclusion.nextStep,
    },
    logicSummary: {
      metrics,
      liquidityRisk: {
        level: liquidityRisk.level,
        score: liquidityRisk.score,
        warnings: liquidityRisk.warnings,
        missingFields: liquidityRisk.missingFields,
      },
      dataQualityRisk: {
        level: dataQualityRiskLevel,
        score: dataQuality.status === "missing" ? null : 100 - dataQuality.score,
        warnings: dataQuality.warnings,
        missingFields: dataQuality.missingFields,
      },
      warnings,
      missingFields,
    },
  };
};
