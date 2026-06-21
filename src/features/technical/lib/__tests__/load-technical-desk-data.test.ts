import { describe, expect, it, vi } from "vitest";

import type { MarketPriceSeriesResult, MarketPriceSeriesRow } from "../../../../lib/data-sources";
import type { PVTObservationData } from "../../types";
import { buildMarketPvtUnitMetadata } from "../market-pvt-unit-metadata-contract";
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
    score: 3,
    maxScore: 6,
    signs: [],
    conclusion: "Base fomo",
  },
  pvtDerivedMetrics: {
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
    dataStatus: "static_sample",
    calculationBasis: "static_sample",
    requiredObservations: 20,
    availableObservations: 0,
    supportRange: {
      value: "38.000 - 40.000",
      status: "static_sample",
    },
    resistanceRange: {
      value: "44.000 - 46.000",
      status: "static_sample",
    },
    volumeRatio: {
      value: 1.4,
      status: "static_sample",
    },
    fomoScore: {
      value: 3,
      status: "static_sample",
    },
    limitations: ["Static sample derived metrics."],
    warnings: [],
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
  marketUnitMetadata: buildMarketPvtUnitMetadata({
    asOf: rows.at(-1)?.date ?? "2025-01-31",
    dataMode: "research_only",
    source: "local_research",
    sourceLabel: "vnstock",
    units: {
      marketPrice: "vnd_per_share",
      tradingValue: "vnd",
      volume: "shares",
    },
    values: {
      marketPrice: rows.at(-1)?.close ?? null,
      tradingValue: rows.at(-1)?.tradingValue ?? null,
      volume: rows.at(-1)?.volume ?? null,
    },
  }),
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
    expect(result.data?.keyLevels.support).not.toBe("38.000 - 40.000");
    expect(result.data?.keyLevels.resistance).not.toBe("44.000 - 46.000");
    expect(result.data?.volume.currentVsAvg20).toBeNull();
    expect(result.data?.fomo.score).toBeNull();
    expect(result.data?.pvtDerivedMetrics).toMatchObject({
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
      dataStatus: "insufficient_data",
      availableObservations: 2,
      volumeRatio: {
        value: null,
        status: "insufficient_data",
      },
      fomoScore: {
        value: null,
        status: "unavailable",
      },
    });
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
      displayName: "FPT",
      issuerName: "FPT Corporation",
      industry: "Information technology",
      sector: null,
      sourceLabel: "controlled_local_company_metadata",
      dataMode: "research_only",
      productionApproved: false,
      verificationStatus: "controlled_local_research",
      sharesOutstanding: null,
      sharesUnit: null,
      sharesStatus: "unavailable",
    });
    expect(result.issuerMetadata.sourceLabel).not.toBe(result.marketDataSource.sourceLabel);
    expect(result.issuerMetadata.sharesOutstanding).not.toBe(0);
    expect(result.warnings.join(" ")).toContain("local academic/research");
  });

  it("keeps DB-backed market source separate when issuer metadata is unavailable", async () => {
    const readMarketPriceSeries = vi.fn().mockResolvedValue(
      series(
        [
          row({ ticker: "XYZ", date: "2025-01-02", close: 100, volume: 1000, tradingValue: 100000 }),
          row({ ticker: "XYZ", date: "2025-01-03", close: 110, volume: 2000, tradingValue: 220000 }),
        ],
        { ticker: "XYZ" },
      ),
    );

    const result = await loadTechnicalDeskData(
      { ticker: "XYZ", from: "2025-01-01", to: "2025-01-31", preferDb: true },
      {
        readMarketPriceSeries,
        fallbackData: baseData,
        fallbackDataQuality,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.marketDataSource).toMatchObject({
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false,
      ticker: "XYZ",
    });
    expect(result.issuerMetadata).toMatchObject({
      ticker: "XYZ",
      displayName: null,
      industry: null,
      sector: null,
      sourceLabel: "unavailable",
      dataMode: "unavailable",
      verificationStatus: "unavailable",
      productionApproved: false,
    });
    expect(result.data?.industry).not.toBe("Ban le");
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
    expect(result.data?.pvtDerivedMetrics).toMatchObject({
      dataStatus: "static_sample",
      productionApproved: false,
      supportRange: {
        value: "38.000 - 40.000",
        status: "static_sample",
      },
      fomoScore: {
        value: 3,
        status: "static_sample",
      },
    });
    expect(result.warnings.join(" ")).toContain("static fallback");
  });

  it("falls back safely when DB rows fail Market/PVT unit metadata checks", async () => {
    const readMarketPriceSeries = vi.fn().mockResolvedValue(
      series(
        [
          row({ date: "2025-01-02", close: 100, volume: 1000, tradingValue: 100000 }),
          row({ date: "2025-01-03", close: 110, volume: 2000, tradingValue: 220000 }),
        ],
        {
          marketUnitMetadata: buildMarketPvtUnitMetadata({
            asOf: "2025-01-03",
            dataMode: "research_only",
            source: "local_research",
            sourceLabel: "vnstock",
            values: {
              marketPrice: 110,
              tradingValue: 220000,
              volume: 2000,
            },
          }),
        },
      ),
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
    expect(result.warnings.join(" ")).toContain("unit metadata checks");
    expect(result.warnings).toContain("marketPrice_market_pvt_unit_metadata_not_ready");
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
        row({ date: "2025-01-02", close: 100, volume: null, tradingValue: null }),
        row({ date: "2025-01-03", close: 101, volume: null, tradingValue: null }),
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
    const tradingValue = result.data?.logicSummary?.metrics.find((metric) => metric.id === "tradingValue");

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(tradingValue?.rawValue).toBeNull();
    expect(result.data?.volume.currentVsAvg20).toBeNull();
    expect(tradingValue?.rawValue).not.toBe(0);
    expect(result.data?.volume.currentVsAvg20).not.toBe(0);
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
