import { describe, expect, it, vi } from "vitest";

import type { MarketPriceSeriesResult, MarketPriceSeriesRow } from "../../../../lib/data-sources";
import type { PVTObservationData } from "../../types";
import { loadTechnicalDeskData } from "../load-technical-desk-data";

const baseData: PVTObservationData = {
  ticker: "MWG",
  companyName: "MWG Sample",
  industry: "Ban le",
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

const fallbackDataQuality = {
  source: "sample",
  asOf: "2026-06-01",
  isDemoData: true,
  isStale: false,
  missingFields: [],
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

const input = {
  ticker: "FPT",
  from: "2025-01-01",
  to: "2025-01-31",
};

describe("loadTechnicalDeskData", () => {
  it("uses the DB-backed path when preferred and market price rows are available", async () => {
    const readMarketPriceSeries = vi.fn().mockResolvedValue(
      series([
        row({ date: "2025-01-02", close: 100, volume: 1000, tradingValue: 100000 }),
        row({ date: "2025-01-03", close: 110, volume: 2000, tradingValue: 220000 }),
      ]),
    );

    const result = await loadTechnicalDeskData(
      { ...input, preferDb: true },
      {
        readMarketPriceSeries,
        fallbackData: baseData,
        fallbackDataQuality,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.source).toMatchObject({
      sourceType: "local_db_manual_import",
      provider: "vnstock",
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
    });
    expect(result.data?.ticker).toBe("FPT");
    expect(result.data?.currentPrice).toBe(110);
    expect(result.data?.industry).not.toBe("Ban le");
    expect(result.marketDataSource).toMatchObject({
      sourceType: "local_db_manual_import",
      provider: "vnstock",
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
      fallbackUsed: false,
      ticker: "FPT",
    });
    expect(result.issuerMetadata).toMatchObject({
      ticker: "FPT",
      displayName: null,
      industry: null,
      sector: null,
      sourceLabel: "unavailable",
      dataMode: "unknown",
      productionApproved: false,
      verificationStatus: "unavailable",
    });
    expect(result.warnings.join(" ")).toContain("local academic/research");
  });

  it("falls back safely when the DB read returns no usable rows", async () => {
    const readMarketPriceSeries = vi.fn().mockResolvedValue(
      series([], {
        ok: false,
        status: "not_found",
        count: 0,
        rows: [],
        warnings: ["No matching market price rows were found."],
      }),
    );

    const result = await loadTechnicalDeskData(
      { ...input, preferDb: true },
      {
        readMarketPriceSeries,
        fallbackData: baseData,
        fallbackDataQuality,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.source.sourceType).toBe("sample_static_fallback");
    expect(result.source.productionApproved).toBe(false);
    expect(result.marketDataSource).toMatchObject({
      sourceType: "sample_static_fallback",
      sourceLabel: "sample_static_fallback",
      dataMode: "sample",
      productionApproved: false,
      fallbackUsed: true,
    });
    expect(result.issuerMetadata).toMatchObject({
      ticker: "MWG",
      displayName: "MWG Sample",
      industry: "Ban le",
      sourceLabel: "sample_static_fallback",
      dataMode: "sample",
      productionApproved: false,
      verificationStatus: "static_sample",
    });
    expect(result.data).toBe(baseData);
    expect(result.warnings.join(" ")).toContain("static fallback");
  });

  it("handles invalid input without reading DB and falls back with warnings", async () => {
    const readMarketPriceSeries = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await loadTechnicalDeskData(
      { ticker: " ", from: "bad-date", to: "2025-01-31", preferDb: true },
      {
        readMarketPriceSeries,
        fallbackData: baseData,
        fallbackDataQuality,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.errors.join(" ")).toContain("Ticker is required");
    expect(readMarketPriceSeries).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("keeps null values unavailable instead of fabricating zero values", async () => {
    const readMarketPriceSeries = vi.fn().mockResolvedValue(
      series([
        row({ date: "2025-01-02", close: null, volume: null, tradingValue: null }),
        row({ date: "2025-01-03", close: null, volume: null, tradingValue: null }),
      ]),
    );

    const result = await loadTechnicalDeskData(
      { ...input, preferDb: true },
      {
        readMarketPriceSeries,
        fallbackData: baseData,
        fallbackDataQuality,
      },
    );
    const priceChange = result.data?.logicSummary?.metrics.find((metric) => metric.id === "priceChangePct");
    const tradingValue = result.data?.logicSummary?.metrics.find((metric) => metric.id === "tradingValue");

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(priceChange?.rawValue).toBeNull();
    expect(tradingValue?.rawValue).toBeNull();
    expect(priceChange?.rawValue).not.toBe(0);
  });

  it("does not expose prohibited investment fields", async () => {
    const readMarketPriceSeries = vi.fn().mockResolvedValue(series([row()]));

    const result = await loadTechnicalDeskData(
      { ...input, preferDb: true },
      {
        readMarketPriceSeries,
        fallbackData: baseData,
        fallbackDataQuality,
      },
    );
    const output = JSON.stringify(result);

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("rating");
    expect(output).not.toContain("targetPrice");
    expect(output).not.toContain("buySignal");
    expect(output).not.toContain("sellSignal");
    expect(output).not.toContain("holdSignal");
    expect(output).not.toContain("entryPoint");
    expect(output).not.toContain("exitPoint");
  });

  it("defaults to static fallback when DB preference is not enabled", async () => {
    const readMarketPriceSeries = vi.fn();

    const result = await loadTechnicalDeskData(input, {
      readMarketPriceSeries,
      fallbackData: baseData,
      fallbackDataQuality,
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.source.sourceType).toBe("sample_static_fallback");
    expect(result.source.productionApproved).toBe(false);
    expect(readMarketPriceSeries).not.toHaveBeenCalled();
  });
});
