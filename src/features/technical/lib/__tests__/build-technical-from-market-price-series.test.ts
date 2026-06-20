import { describe, expect, it } from "vitest";

import type { MarketPriceSeriesResult, MarketPriceSeriesRow } from "../../../../lib/data-sources";
import type { PVTObservationData } from "../../types";
import { buildTechnicalFromMarketPriceSeries } from "../build-technical-from-market-price-series";

const baseData: PVTObservationData = {
  ticker: "FPT",
  companyName: "FPT",
  industry: "Technology",
  currentPrice: 0,
  status: {
    label: "Base",
    tone: "neutral",
    conclusion: "Base conclusion",
  },
  keyLevels: {
    support: "38.000 - 40.000",
    resistance: "44.000 - 46.000",
  },
  volume: {
    currentVsAvg20: 1.4,
    label: "Base volume",
    conclusion: "Base volume conclusion",
  },
  chart: {
    title: "PVT",
    points: [
      { label: "Sample-1", price: 38, volume: 1.4, ma20: 39, ma50: 40 },
      { label: "Sample-2", price: 45, volume: 1.6, ma20: 40, ma50: 41 },
    ],
    events: [
      {
        label: "KQKD",
        title: "Sample earnings event",
        pointIndex: 0,
        note: "Sample event",
      },
      {
        label: "Ngành",
        title: "Sample industry event",
        pointIndex: 1,
        note: "Sample event",
      },
    ],
    quickRead: [],
  },
  signalLayers: [
    {
      id: "price",
      title: "Price",
      shortTitle: "Price",
      question: "Price?",
      conclusion: "Base price",
      evidence: [],
      commonMistake: "Base",
    },
    {
      id: "volume",
      title: "Volume",
      shortTitle: "Volume",
      question: "Volume?",
      conclusion: "Base volume",
      evidence: [],
      commonMistake: "Base",
    },
  ],
  confirmation: [],
  invalidation: [],
  scenarios: [],
  riskReward: {
    currentPrice: 0,
    supportPrice: 0,
    resistancePrice: 0,
    upside: "N/A",
    downside: "N/A",
    conclusion: "Base risk/reward",
  },
  fomo: {
    level: "Thấp",
    score: 3,
    maxScore: 6,
    signs: [],
    conclusion: "Base fomo",
  },
  finalConclusion: {
    status: "Base status",
    positive: "Base positive",
    caution: "Base caution",
    nextStep: "Base next step",
  },
  nextActions: [],
};

const row = (patch: Partial<MarketPriceSeriesRow> = {}): MarketPriceSeriesRow => ({
  ticker: "FPT",
  date: "2025-01-02",
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  volume: 1000,
  tradingValue: 105000,
  ...patch,
});

const series = (
  rows: MarketPriceSeriesRow[],
  patch: Partial<MarketPriceSeriesResult> = {},
): MarketPriceSeriesResult => ({
  ok: true,
  status: "completed",
  ticker: "FPT",
  from: "2025-01-01",
  to: "2025-01-31",
  sourceLabel: "vnstock",
  dataMode: "research_only",
  productionApproved: false,
  count: rows.length,
  rows,
  warnings: [],
  errors: [],
  ...patch,
});

describe("buildTechnicalFromMarketPriceSeries", () => {
  it("connects read-service market prices to the existing Technical/PVT builder", () => {
    const result = buildTechnicalFromMarketPriceSeries(
      baseData,
      series([
        row({ date: "2025-01-02", close: 100, volume: 1000, tradingValue: 100000 }),
        row({ date: "2025-01-03", close: 110, volume: 2000, tradingValue: 220000 }),
      ]),
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.adapter.productionApproved).toBe(false);
    expect(result.adapter.sourceLabel).toBe("vnstock");
    expect(result.adapter.dataMode).toBe("research_only");
    expect(result.data?.ticker).toBe("FPT");
    expect(result.data?.currentPrice).toBe(110);
    expect(result.data?.chart.points).toHaveLength(2);
    expect(result.data?.chart.points[0]).toMatchObject({
      label: "2025-01-02",
      price: 100,
      volume: 1000,
    });
    expect(result.data?.chart.points[1]).toMatchObject({
      label: "2025-01-03",
      price: 110,
      volume: 2000,
    });
    expect(result.data?.chart.points.map((point) => point.price)).not.toEqual([38, 45]);
    expect(result.data?.chart.points.some((point) => point.ma20 !== undefined || point.ma50 !== undefined)).toBe(false);
    expect(result.data?.chart.events).toEqual([]);
    expect(JSON.stringify(result.data?.chart)).not.toMatch(/KQKD|Ngành/);
    expect(result.data?.pvtChartSeries).toMatchObject({
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
      status: "computed_from_market_price_series",
      availableObservations: 2,
      points: {
        count: 2,
        status: "computed_from_market_price_series",
      },
      movingAverages: {
        ma20: {
          status: "insufficient_data",
        },
        ma50: {
          status: "insufficient_data",
        },
      },
      annotations: {
        count: 0,
        status: "unavailable",
      },
    });
    expect(result.data?.keyLevels.support).not.toBe("38.000 - 40.000");
    expect(result.data?.keyLevels.resistance).not.toBe("44.000 - 46.000");
    expect(result.data?.pvtDerivedMetrics).toMatchObject({
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
      dataStatus: "insufficient_data",
      calculationBasis: "active_market_price_series",
      requiredObservations: 20,
      availableObservations: 2,
      supportRange: {
        value: null,
        status: "unavailable",
      },
      resistanceRange: {
        value: null,
        status: "unavailable",
      },
      volumeRatio: {
        value: null,
        status: "insufficient_data",
      },
      fomoScore: {
        value: null,
        status: "unavailable",
      },
    });
    expect(result.data?.volume.currentVsAvg20).toBeNull();
    expect(result.data?.fomo.score).toBeNull();
    expect(result.data?.logicSummary?.metrics.find((metric) => metric.id === "priceChangePct")?.rawValue)
      .toBeCloseTo(0.1);
  });

  it("keeps missing values unavailable instead of replacing them with zero", () => {
    const result = buildTechnicalFromMarketPriceSeries(
      baseData,
      series([
        row({ date: "2025-01-02", close: null, volume: null, tradingValue: null }),
        row({ date: "2025-01-03", close: null, volume: null, tradingValue: null }),
      ]),
    );

    const priceChange = result.data?.logicSummary?.metrics.find((metric) => metric.id === "priceChangePct");
    const tradingValue = result.data?.logicSummary?.metrics.find((metric) => metric.id === "tradingValue");

    expect(result.ok).toBe(true);
    expect(result.data?.currentPrice).toBe(baseData.currentPrice);
    expect(priceChange?.rawValue).toBeNull();
    expect(tradingValue?.rawValue).toBeNull();
    expect(priceChange?.rawValue).not.toBe(0);
  });

  it("marks volume TB20 insufficient when the DB-backed series has fewer than 20 observations", () => {
    const result = buildTechnicalFromMarketPriceSeries(
      baseData,
      series(
        Array.from({ length: 17 }, (_, index) =>
          row({
            date: `2025-01-${String(index + 1).padStart(2, "0")}`,
            close: 100 + index,
            volume: 1000 + index,
            tradingValue: 100000 + index,
          }),
        ),
      ),
    );

    expect(result.ok).toBe(true);
    expect(result.data?.chart.points).toHaveLength(17);
    expect(result.data?.chart.points.at(-1)).toMatchObject({
      label: "2025-01-17",
      price: 116,
      volume: 1016,
    });
    expect(result.data?.chart.points.some((point) => point.ma20 !== undefined || point.ma50 !== undefined)).toBe(false);
    expect(result.data?.chart.events).toEqual([]);
    expect(result.data?.pvtChartSeries).toMatchObject({
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
      status: "computed_from_market_price_series",
      availableObservations: 17,
      points: {
        count: 17,
        status: "computed_from_market_price_series",
      },
      movingAverages: {
        ma20: {
          status: "insufficient_data",
        },
        ma50: {
          status: "insufficient_data",
        },
      },
      annotations: {
        count: 0,
        status: "unavailable",
      },
    });
    expect(result.data?.pvtDerivedMetrics?.availableObservations).toBe(17);
    expect(result.data?.pvtDerivedMetrics?.volumeRatio).toMatchObject({
      value: null,
      status: "insufficient_data",
    });
    expect(result.data?.volume.currentVsAvg20).toBeNull();
    expect(result.data?.volume.label).toMatch(/20/);
  });

  it("returns an adapter-ready failure when the series is not completed", () => {
    const result = buildTechnicalFromMarketPriceSeries(
      baseData,
      series([], {
        ok: false,
        status: "not_found",
        count: 0,
        rows: [],
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("insufficient_data");
    expect(result.data).toBeNull();
  });

  it("does not emit prohibited investment fields or action wording", () => {
    const result = buildTechnicalFromMarketPriceSeries(baseData, series([row()]));
    const output = JSON.stringify(result).toLowerCase();

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("rating");
    expect(output).not.toContain("targetprice");
    expect(output).not.toContain("buysignal");
    expect(output).not.toContain("sellsignal");
    expect(output).not.toContain("holdsignal");
    expect(output).not.toContain("advice");
  });

  it("keeps sample fallback chart marked static sample when the base builder is used without DB series", () => {
    const result = buildTechnicalFromMarketPriceSeries(
      baseData,
      series([], {
        ok: false,
        status: "not_found",
        count: 0,
        rows: [],
      }),
    );

    expect(result.data).toBeNull();
  });
});
