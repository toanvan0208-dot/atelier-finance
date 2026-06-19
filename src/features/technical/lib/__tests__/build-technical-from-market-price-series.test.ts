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
    support: "N/A",
    resistance: "N/A",
  },
  volume: {
    currentVsAvg20: 1,
    label: "Base volume",
    conclusion: "Base volume conclusion",
  },
  chart: {
    title: "PVT",
    points: [],
    events: [],
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
    score: 1,
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
});
