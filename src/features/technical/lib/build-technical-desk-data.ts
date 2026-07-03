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
import type {
  PVTChartSeries,
  PVTChartSeriesStatus,
  PVTDerivedMetrics,
  PVTLogicMetric,
  PVTObservationData,
  PVTObservationPoint,
  PVTStatus,
} from "../types";
import { mapTechnicalToLogicInput, type TechnicalMarketSnapshot } from "./map-technical-to-logic-input";

const UNVERIFIED_METADATA_LABEL = "Chua co du lieu xac minh";
const DERIVED_UNAVAILABLE_LABEL = "Chưa đủ dữ liệu";
const DERIVED_NOT_AVAILABLE_LABEL = "Không khả dụng";
const REQUIRED_TB20_OBSERVATIONS = 20;
const REQUIRED_MA20_OBSERVATIONS = 20;
const REQUIRED_MA50_OBSERVATIONS = 50;
const REQUIRED_BASIC_CHART_OBSERVATIONS = 2;
const REQUIRED_SUPPORT_RESISTANCE_OBSERVATIONS = 40;
const PIVOT_LOOKBACK = 3;
const PRICE_ZONE_TOLERANCE_PCT = 0.018;

type PriceZone = {
  lower: number;
  upper: number;
  midpoint: number;
  touches: number;
};

type SupportResistanceResult = {
  status: "computed_from_market_price_series" | "insufficient_data" | "unavailable";
  support: PriceZone | null;
  resistance: PriceZone | null;
  limitations: string[];
};

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

const formatPriceNumber = (value: number): string => new Intl.NumberFormat("vi-VN").format(Math.round(value));

const formatPriceRange = (zone: PriceZone | null): string | null => {
  if (!zone) return null;
  const lower = formatPriceNumber(zone.lower);
  const upper = formatPriceNumber(zone.upper);
  return lower === upper ? lower : `${lower} - ${upper}`;
};

const formatPercentDistance = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return DERIVED_NOT_AVAILABLE_LABEL;
  const formatted = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value * 100);
  return `${value > 0 ? "+" : ""}${formatted}%`;
};

const calculateVolumeVsAverage20 = (snapshot: TechnicalMarketSnapshot): number | null => {
  if (
    (snapshot.availableObservations ?? 0) < REQUIRED_TB20_OBSERVATIONS ||
    typeof snapshot.volume !== "number" ||
    !Number.isFinite(snapshot.volume) ||
    typeof snapshot.avgVolume20d !== "number" ||
    !Number.isFinite(snapshot.avgVolume20d) ||
    snapshot.avgVolume20d <= 0
  ) {
    return null;
  }

  return snapshot.volume / snapshot.avgVolume20d;
};

const formatVolumeRatioLabel = (ratio: number | null, fallback: string): string => {
  if (ratio === null) return fallback;
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(ratio)}x TB20`;
};

const volumeLabel = (snapshot: TechnicalMarketSnapshot, ratio: number | null, fallback: string): string => {
  if ((snapshot.availableObservations ?? 0) < REQUIRED_TB20_OBSERVATIONS) return "Chưa đủ 20 phiên";
  return formatVolumeRatioLabel(ratio, fallback);
};

const toPriceZone = (prices: number[]): PriceZone => {
  const sorted = [...prices].sort((left, right) => left - right);
  const midpoint = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return {
    lower: sorted[0],
    upper: sorted[sorted.length - 1],
    midpoint,
    touches: sorted.length,
  };
};

const clusterPivotPrices = (prices: number[]): PriceZone[] => {
  const sorted = [...prices].sort((left, right) => left - right);
  const clusters = sorted.reduce<number[][]>((items, price) => {
    const last = items.at(-1);
    if (!last) return [[price]];
    const midpoint = last.reduce((sum, value) => sum + value, 0) / last.length;
    const tolerance = Math.max(midpoint * PRICE_ZONE_TOLERANCE_PCT, 1);
    if (Math.abs(price - midpoint) <= tolerance) {
      last.push(price);
      return items;
    }
    items.push([price]);
    return items;
  }, []);

  return clusters.map(toPriceZone);
};

const buildSupportResistance = (points: PVTObservationPoint[], currentPrice: number | null): SupportResistanceResult => {
  if (points.length < REQUIRED_SUPPORT_RESISTANCE_OBSERVATIONS || currentPrice === null) {
    return {
      status: "insufficient_data",
      support: null,
      resistance: null,
      limitations: [
        `Need at least ${REQUIRED_SUPPORT_RESISTANCE_OBSERVATIONS} close-price observations to compute support/resistance zones.`,
      ],
    };
  }

  const lows: number[] = [];
  const highs: number[] = [];

  for (let index = PIVOT_LOOKBACK; index < points.length - PIVOT_LOOKBACK; index += 1) {
    const price = points[index]?.price;
    const left = points[index - 1]?.price;
    const right = points[index + 1]?.price;
    const window = points.slice(index - PIVOT_LOOKBACK, index + PIVOT_LOOKBACK + 1).map((point) => point.price);
    if (price === undefined || left === undefined || right === undefined) continue;

    if (price <= Math.min(...window) && price < left && price < right) lows.push(price);
    if (price >= Math.max(...window) && price > left && price > right) highs.push(price);
  }

  const support = clusterPivotPrices(lows)
    .filter((zone) => zone.touches >= 2 && zone.upper < currentPrice)
    .sort((left, right) => right.midpoint - left.midpoint)[0] ?? null;
  const resistance = clusterPivotPrices(highs)
    .filter((zone) => zone.touches >= 2 && zone.lower > currentPrice)
    .sort((left, right) => left.midpoint - right.midpoint)[0] ?? null;
  const status = support || resistance ? "computed_from_market_price_series" : "unavailable";

  return {
    status,
    support,
    resistance,
    limitations:
      status === "computed_from_market_price_series"
        ? [
            "Support/resistance zones are estimated from repeated local pivot lows/highs in the active market price series.",
            "These zones are reference ranges only and must be read with volume, market context, valuation, and risk.",
          ]
        : ["No repeated pivot zone was found near the current price in the active market price series."],
  };
};

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
  const isMarketPriceSeries = snapshot.sourceKind === "market_price_series";

  if ((snapshotTicker && baseTicker && snapshotTicker !== baseTicker) || isMarketPriceSeries) {
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
        "Thông tin doanh nghiệp chưa khả dụng cho mã này.",
        "Không dùng dữ liệu thay thế cho ngành và lĩnh vực.",
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
  priceZones,
  snapshot,
  volumeRatio,
}: {
  baseData: PVTObservationData;
  isMarketPriceSeries: boolean;
  priceZones: SupportResistanceResult | null;
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
      warnings: ["Không dùng dữ liệu thay thế cho các chỉ số dẫn xuất."],
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
    dataStatus:
      priceZones?.status === "computed_from_market_price_series" || volumeStatus === "computed_from_market_price_series"
        ? "computed_from_market_price_series"
        : "insufficient_data",
    calculationBasis: "active_market_price_series",
    requiredObservations: REQUIRED_TB20_OBSERVATIONS,
    availableObservations,
    supportRange: {
      value: formatPriceRange(priceZones?.support ?? null),
      status: priceZones?.support ? "computed_from_market_price_series" : "unavailable",
    },
    resistanceRange: {
      value: formatPriceRange(priceZones?.resistance ?? null),
      status: priceZones?.resistance ? "computed_from_market_price_series" : "unavailable",
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
      ...(priceZones?.limitations ?? [
        "Support/resistance ranges are not computed unless they come from the active market price series.",
      ]),
      "Volume TB20 requires at least 20 observations from the active market price series.",
      "Tâm lý thị trường chưa khả dụng nếu chưa được tính từ chuỗi giá đang hiển thị.",
    ],
    warnings: [
      "Không dùng dữ liệu thay thế cho vùng giá, khối lượng và tâm lý thị trường.",
    ],
  };
};

const averageNullable = (values: Array<number | null>): number | null => {
  if (values.some((value) => value === null)) return null;
  if (values.length === 0) return null;
  const numericValues = values.filter((value): value is number => value !== null);
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const movingAverageAt = (
  values: Array<number | null>,
  index: number,
  windowSize: number,
): number | null => {
  if (index + 1 < windowSize) return null;
  return averageNullable(values.slice(index + 1 - windowSize, index + 1));
};

const buildChartMetadata = ({
  sourceLabel,
  dataMode,
  ticker,
  availableObservations,
  pointsCount,
  volumeCount,
  status,
  pointsStatus,
  volumeStatus,
  ma20Status,
  ma50Status,
  annotationsStatus,
  annotationsCount,
  limitations,
  warnings,
}: {
  sourceLabel: string;
  dataMode: string;
  ticker: string | null;
  availableObservations: number;
  pointsCount: number;
  volumeCount: number;
  status: PVTChartSeriesStatus;
  pointsStatus: PVTChartSeriesStatus;
  volumeStatus: PVTChartSeriesStatus;
  ma20Status: PVTChartSeriesStatus;
  ma50Status: PVTChartSeriesStatus;
  annotationsStatus: PVTChartSeriesStatus;
  annotationsCount: number;
  limitations: string[];
  warnings: string[];
}): PVTChartSeries => ({
  sourceLabel,
  dataMode,
  productionApproved: false,
  status,
  ticker,
  availableObservations,
  requiredObservations: REQUIRED_BASIC_CHART_OBSERVATIONS,
  points: {
    count: pointsCount,
    status: pointsStatus,
  },
  volume: {
    count: volumeCount,
    status: volumeStatus,
  },
  movingAverages: {
    ma20: {
      status: ma20Status,
      requiredObservations: REQUIRED_MA20_OBSERVATIONS,
    },
    ma50: {
      status: ma50Status,
      requiredObservations: REQUIRED_MA50_OBSERVATIONS,
    },
  },
  annotations: {
    count: annotationsCount,
    status: annotationsStatus,
  },
  limitations,
  warnings,
});

const buildChartSeries = ({
  baseData,
  isMarketPriceSeries,
  snapshot,
}: {
  baseData: PVTObservationData;
  isMarketPriceSeries: boolean;
  snapshot: TechnicalMarketSnapshot;
}): {
  chart: PVTObservationData["chart"];
  pvtChartSeries: PVTChartSeries;
} => {
  if (!isMarketPriceSeries) {
    return {
      chart: baseData.chart,
      pvtChartSeries: buildChartMetadata({
        sourceLabel: "sample_static_fallback",
        dataMode: "sample",
        ticker: normalizeTicker(baseData.ticker),
        availableObservations: baseData.chart.points.length,
        pointsCount: baseData.chart.points.length,
        volumeCount: baseData.chart.points.filter((point) => point.volume !== null).length,
        status: "static_sample",
        pointsStatus: "static_sample",
        volumeStatus: "static_sample",
        ma20Status: "static_sample",
        ma50Status: "static_sample",
        annotationsStatus: baseData.chart.events.length > 0 ? "presentation_only" : "static_sample",
        annotationsCount: baseData.chart.events.length,
        limitations: [
          "Static sample chart series is for local product behavior checks only.",
          "It is not production-approved market chart data.",
        ],
        warnings: ["Không dùng dữ liệu thay thế cho biểu đồ."],
      }),
    };
  }

  const sourceRows = [...(snapshot.sourceRows ?? [])].sort(
    (left, right) => Date.parse(left.date) - Date.parse(right.date),
  );
  const closeValues = sourceRows.map((row) => row.close);
  const validCloseRows = sourceRows.filter((row) => row.close !== null);
  const availableObservations = snapshot.availableObservations ?? sourceRows.length;
  const sourceLabel = snapshot.sourceName ?? "market_price_series";
  const dataMode = snapshot.dataMode ?? "research_only";
  const ticker = normalizeTicker(snapshot.ticker);

  if (validCloseRows.length < REQUIRED_BASIC_CHART_OBSERVATIONS) {
    return {
      chart: {
        ...baseData.chart,
        points: [],
        events: [],
        quickRead: [
          {
            question: "Biểu đồ có đủ dữ liệu không?",
            answer: "Chưa đủ dữ liệu để vẽ biểu đồ từ chuỗi hiện tại.",
          },
        ],
      },
      pvtChartSeries: buildChartMetadata({
        sourceLabel,
        dataMode,
        ticker,
        availableObservations,
        pointsCount: validCloseRows.length,
        volumeCount: validCloseRows.filter((row) => row.volume !== null).length,
        status: "insufficient_data",
        pointsStatus: "insufficient_data",
        volumeStatus: "insufficient_data",
        ma20Status: "insufficient_data",
        ma50Status: "insufficient_data",
        annotationsStatus: "unavailable",
        annotationsCount: 0,
        limitations: [
          "Chart needs at least two close-price observations from the active market price series.",
          "Không dùng dữ liệu thay thế cho các điểm biểu đồ, đường trung bình, khối lượng và sự kiện.",
        ],
        warnings: ["Chưa đủ dữ liệu giá để vẽ biểu đồ."],
      }),
    };
  }

  const points = sourceRows.reduce<PVTObservationPoint[]>((items, row, index) => {
      if (row.close === null) return items;
      const ma20 = movingAverageAt(closeValues, index, REQUIRED_MA20_OBSERVATIONS);
      const ma50 = movingAverageAt(closeValues, index, REQUIRED_MA50_OBSERVATIONS);

      items.push({
        label: row.date,
        price: row.close,
        volume: row.volume,
        ...(ma20 === null ? {} : { ma20 }),
        ...(ma50 === null ? {} : { ma50 }),
      });
      return items;
    }, []);
  const volumeCount = points.filter((point) => point.volume !== null).length;
  const ma20Status =
    availableObservations >= REQUIRED_MA20_OBSERVATIONS && points.some((point) => point.ma20 !== null && point.ma20 !== undefined)
      ? "computed_from_market_price_series"
      : "insufficient_data";
  const ma50Status =
    availableObservations >= REQUIRED_MA50_OBSERVATIONS && points.some((point) => point.ma50 !== null && point.ma50 !== undefined)
      ? "computed_from_market_price_series"
      : "insufficient_data";

  return {
    chart: {
      ...baseData.chart,
      points,
      events: [],
      quickRead: [
        {
          question: "Nguồn dữ liệu biểu đồ?",
          answer: "Biểu đồ dùng dữ liệu giá và khối lượng đã lưu trong hệ thống.",
        },
        {
          question: "MA20/MA50 co hien thi khong?",
          answer: "MA20/MA50 là trung bình giá trong 20/50 phiên. Nếu chưa đủ số phiên dữ liệu, hệ thống sẽ hiển thị chưa đủ dữ liệu thay vì tính bừa.",
        },
        {
          question: "Co su kien tren chart khong?",
          answer: "Dữ liệu sự kiện chưa khả dụng.",
        },
      ],
    },
    pvtChartSeries: buildChartMetadata({
      sourceLabel,
      dataMode,
      ticker,
      availableObservations,
      pointsCount: points.length,
      volumeCount,
      status: "computed_from_market_price_series",
      pointsStatus: "computed_from_market_price_series",
      volumeStatus: volumeCount > 0 ? "computed_from_market_price_series" : "unavailable",
      ma20Status,
      ma50Status,
      annotationsStatus: "unavailable",
      annotationsCount: 0,
      limitations: [
        "Chart points are built from the active local DB market price series.",
        "MA20 requires 20 observations and MA50 requires 50 observations from the same active series.",
        "Annotations are unavailable until an event source is connected.",
      ],
      warnings: ["Static chart points, static MA lines, static volume bars, and static annotations were not reused."],
    }),
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
  const volumeVsAvg20 = calculateVolumeVsAverage20(snapshot);
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
  const { chart, pvtChartSeries } = buildChartSeries({
    baseData,
    isMarketPriceSeries,
    snapshot,
  });
  const priceZones = isMarketPriceSeries
    ? buildSupportResistance(chart.points, snapshot.closePrice ?? null)
    : null;
  const pvtDerivedMetrics = buildDerivedMetrics({
    baseData,
    isMarketPriceSeries,
    priceZones,
    snapshot,
    volumeRatio: volumeVsAvg20,
  });

  return {
    ...baseData,
    ticker: snapshot.ticker ?? baseData.ticker,
    companyName:
      (tickerChanged || isMarketPriceSeries)
        ? snapshotTicker ?? baseData.ticker
        : baseData.companyName,
    industry: (tickerChanged || isMarketPriceSeries) ? UNVERIFIED_METADATA_LABEL : baseData.industry,
    issuerMetadata,
    pvtDerivedMetrics,
    pvtChartSeries,
    currentPrice: snapshot.closePrice ?? baseData.currentPrice,
    status: resolveStatus(priceChange, liquidityStatus, missingFields),
    keyLevels: isMarketPriceSeries
      ? {
          support: formatPriceRange(priceZones?.support ?? null) ?? DERIVED_UNAVAILABLE_LABEL,
          resistance: formatPriceRange(priceZones?.resistance ?? null) ?? DERIVED_UNAVAILABLE_LABEL,
        }
      : baseData.keyLevels,
    volume: {
      ...baseData.volume,
      currentVsAvg20: isMarketPriceSeries ? volumeVsAvg20 : baseData.volume.currentVsAvg20,
      label: isMarketPriceSeries
        ? volumeLabel(snapshot, volumeVsAvg20, metricValueLabel(liquidityStatus))
        : metricValueLabel(liquidityStatus),
      conclusion:
        liquidityStatus.value === null
          ? "Chưa đủ dữ liệu để đọc thanh khoản."
          : `${liquidityStatus.beginnerInterpretation} Giá trị giao dịch hiện tại: ${metricValueLabel(tradingValue)}.`,
    },
    chart: {
      ...chart,
      quickRead: [
        ...(isMarketPriceSeries ? chart.quickRead : []),
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
      ? ["Chưa đủ dữ liệu để xác định điều kiện xác nhận."]
      : baseData.confirmation,
    invalidation: isMarketPriceSeries
      ? ["Chưa đủ dữ liệu để xác định điều kiện phủ nhận."]
      : baseData.invalidation,
    scenarios: isMarketPriceSeries
      ? [
          {
            name: priceZones?.status === "computed_from_market_price_series" ? "Vùng kỹ thuật đã tính" : "Derived metrics unavailable",
            condition: "Chưa đủ dữ liệu để tính vùng kỹ thuật.",
            meaning: "Không dùng dữ liệu thay thế.",
          },
        ]
      : baseData.scenarios,
    riskReward: isMarketPriceSeries
      ? {
          currentPrice: snapshot.closePrice ?? baseData.currentPrice,
          supportPrice: priceZones?.support?.midpoint ?? null,
          resistancePrice: priceZones?.resistance?.midpoint ?? null,
          upside: formatPercentDistance(
            priceZones?.resistance && snapshot.closePrice ? priceZones.resistance.midpoint / snapshot.closePrice - 1 : null,
          ),
          downside: formatPercentDistance(
            priceZones?.support && snapshot.closePrice ? priceZones.support.midpoint / snapshot.closePrice - 1 : null,
          ),
          conclusion: "Chưa đủ dữ liệu để tính vùng giá.",
        }
      : baseData.riskReward,
    fomo: isMarketPriceSeries
      ? {
          level: baseData.fomo.level,
          score: null,
          maxScore: baseData.fomo.maxScore,
          signs: ["Tâm lý thị trường chưa khả dụng."],
          conclusion: "Chưa đủ dữ liệu để đánh giá tâm lý thị trường.",
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
          ? "Bổ sung dữ liệu còn thiếu trước khi dùng PVT để củng cố kiểm tra rủi ro thực thi."
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
