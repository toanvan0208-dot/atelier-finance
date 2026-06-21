import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import type { MarketPriceSeriesResult, MarketPriceSeriesRow } from "../../../../lib/data-sources";
import { buildControlledValuationIntegrationBoundary } from "../../../valuation/lib/controlled-valuation-integration-boundary";
import type { PVTObservationData } from "../../types";
import { buildTechnicalFromMarketPriceSeries } from "../build-technical-from-market-price-series";
import { loadTechnicalDeskData } from "../load-technical-desk-data";

const TRIAL_SOURCE_LABEL = "phase73_synthetic_market_pvt_metadata_trial";
const TRIAL_AS_OF = "2026-06-21";

const baseData: PVTObservationData = {
  ticker: "UNIT73",
  companyName: "UNIT73 synthetic",
  industry: "synthetic",
  currentPrice: 0,
  status: {
    label: "Base",
    tone: "neutral",
    conclusion: "Base conclusion",
  },
  keyLevels: {
    support: "0",
    resistance: "0",
  },
  volume: {
    currentVsAvg20: null,
    label: "Base volume",
    conclusion: "Base volume conclusion",
  },
  chart: {
    title: "PVT",
    points: [],
    events: [],
    quickRead: [],
  },
  signalLayers: [],
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
    score: null,
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
  ticker: "UNIT73",
  date: "2026-06-01",
  open: 49_000,
  high: 51_000,
  low: 48_500,
  close: 50_000,
  volume: 100_000,
  tradingValue: 5_000_000_000,
  ...patch,
});

const syntheticSeries = (
  rows: MarketPriceSeriesRow[] = Array.from({ length: 20 }, (_, index) =>
    row({
      date: `2026-06-${String(index + 1).padStart(2, "0")}`,
      close: index === 19 ? 50_000 : 49_000 + index,
      tradingValue: index === 19 ? 5_000_000_000 : 4_500_000_000,
    }),
  ),
  patch: Partial<MarketPriceSeriesResult> = {},
): MarketPriceSeriesResult => ({
  ok: true,
  status: "completed",
  ticker: "UNIT73",
  from: "2026-06-01",
  to: "2026-06-20",
  sourceLabel: TRIAL_SOURCE_LABEL,
  dataMode: "research_only",
  productionApproved: false,
  count: rows.length,
  rows,
  warnings: [],
  errors: [],
  ...patch,
});

const buildSyntheticTrial = () =>
  buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries(), {
    asOf: TRIAL_AS_OF,
    dataMode: "research_only",
    source: "market_pvt",
    sourceLabel: TRIAL_SOURCE_LABEL,
    units: {
      averageTradingValue20d: "vnd",
      marketCap: "vnd",
      marketPrice: "vnd_per_share",
      tradingValue: "vnd",
      volume: "shares",
    },
    values: {
      averageTradingValue20d: 4_500_000_000,
      marketCap: 5_000_000_000,
    },
  });

describe("Phase 73 controlled Market/PVT metadata write/read-through trial", () => {
  it("keeps Phase 73 read-through fixtures compatible after additive sidecar persistence", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const marketPriceModel = schema.slice(schema.indexOf("model MarketPrice"), schema.indexOf("model DataSource"));

    expect(marketPriceModel).toContain("unitMetadata");
    expect(schema).toContain("model MarketPriceUnitMetadata");
  });

  it("builds ready metadata for every explicit synthetic Market/PVT field", () => {
    const result = buildSyntheticTrial();

    expect(result.ok).toBe(true);
    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      asOf: TRIAL_AS_OF,
      dataMode: "research_only",
      productionApproved: false,
      source: "market_pvt",
      sourceLabel: TRIAL_SOURCE_LABEL,
      status: "ready",
      unit: "vnd_per_share",
      value: 50_000,
    });
    expect(result.marketUnitMetadata.marketCap).toMatchObject({
      status: "ready",
      unit: "vnd",
      value: 5_000_000_000,
    });
    expect(result.marketUnitMetadata.volume).toMatchObject({
      status: "ready",
      unit: "shares",
      value: 100_000,
    });
    expect(result.marketUnitMetadata.tradingValue).toMatchObject({
      status: "ready",
      unit: "vnd",
      value: 5_000_000_000,
    });
    expect(result.marketUnitMetadata.averageTradingValue20d).toMatchObject({
      status: "ready",
      unit: "vnd",
      value: 4_500_000_000,
    });
  });

  it("keeps old rows without explicit unit metadata as unknown_unit without guessing magnitude", () => {
    const result = buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries());

    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 50_000,
    });
    expect(result.marketUnitMetadata.tradingValue).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 5_000_000_000,
    });
    expect(result.marketUnitMetadata.tradingValue.unit).not.toBe("billion_vnd");
  });

  it("keeps missing and invalid synthetic metadata fail-closed", () => {
    const invalid = buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries([row({ close: null })]), {
      source: "market_pvt",
      units: {
        marketCap: "vnd_per_share",
        marketPrice: "vnd_per_share",
        volume: "vnd",
      },
      values: {
        marketCap: 5_000_000_000,
        volume: 0,
      },
    });

    expect(invalid.marketUnitMetadata.marketPrice).toMatchObject({
      status: "missing",
      unit: "unknown",
      value: null,
    });
    expect(invalid.marketUnitMetadata.marketCap).toMatchObject({
      status: "invalid_unit",
      unit: "vnd_per_share",
    });
    expect(invalid.marketUnitMetadata.volume).toMatchObject({
      status: "invalid_value",
      value: 0,
    });
  });

  it("returns marketUnitMetadata through loadTechnicalDeskData read-through, fallback, and safe-error paths", async () => {
    const trial = buildSyntheticTrial();
    const buildFromMarketPriceSeries = vi.fn().mockReturnValue(trial);
    const readMarketPriceSeries = vi.fn().mockResolvedValue(syntheticSeries());

    const readThrough = await loadTechnicalDeskData(
      { ticker: "UNIT73", from: "2026-06-01", to: "2026-06-20", preferDb: true },
      {
        buildFromMarketPriceSeries,
        fallbackData: baseData,
        readMarketPriceSeries,
      },
    );
    const fallback = await loadTechnicalDeskData(
      { ticker: "UNIT73", from: "2026-06-01", to: "2026-06-20", preferDb: false },
      { fallbackData: baseData },
    );
    const safeError = await loadTechnicalDeskData(
      { ticker: "", from: "bad-date", to: "2026-06-20", preferDb: true, allowFallback: false },
      { fallbackData: baseData },
    );

    expect(readThrough.marketUnitMetadata.marketPrice.status).toBe("ready");
    expect(readThrough.marketUnitMetadata.marketCap.status).toBe("ready");
    expect(readThrough.source.productionApproved).toBe(false);
    expect(fallback.marketUnitMetadata.marketPrice.status).toBe("missing");
    expect(fallback.marketUnitMetadata.marketPrice.value).toBeNull();
    expect(safeError.marketUnitMetadata.marketPrice.status).toBe("missing");
    expect(safeError.marketUnitMetadata.marketPrice.value).toBeNull();
  });

  it("hands read-through Market/PVT metadata to Valuation ready and blocked paths", () => {
    const trial = buildSyntheticTrial();
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        equity: 2_000_000_000,
        eps: 2_500,
        revenue: 1_000_000_000,
        sharesOutstanding: 100_000,
        dataMode: "research_only",
        readPath: "local_db",
        units: {
          equity: "vnd",
          eps: "vnd_per_share",
          revenue: "vnd",
          sharesOutstanding: "shares",
        },
      },
      persistedValuationInputs: {
        dataMode: "research_only",
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
        marketUnitMetadata: trial.marketUnitMetadata,
      },
    });

    expect(valuation.calculation.metrics.marketCap).toMatchObject({
      reason: "ready_from_direct_market_cap",
      status: "ready",
      value: 5_000_000_000,
    });
    expect(valuation.calculation.metrics.pe).toMatchObject({ status: "ready", value: 20 });
    expect(valuation.calculation.metrics.bvps).toMatchObject({ status: "ready", value: 20_000 });
    expect(valuation.calculation.metrics.pb).toMatchObject({ status: "ready", value: 2.5 });
    expect(valuation.calculation.metrics.ps).toMatchObject({ status: "ready", value: 5 });
    expect(valuation.calculation.blockedMetrics.ev.status).toBe("blocked");
    expect(valuation.calculation.blockedMetrics.evToEbitda.status).toBe("blocked");
    expect(valuation.calculation.blockedMetrics.dcf.status).toBe("blocked");
    expect(valuation.calculation.blockedMetrics.fairValueRange.status).toBe("blocked");
    expect(valuation.sourceBoundary.productionApproved).toBe(false);
    expect(valuation.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    expect(valuation.sourceBoundary.warnings).toContain("valuation_remains_mixed_source");
  });

  it("derives market cap from explicit marketPrice and shares when direct marketCap is unavailable", () => {
    const trial = buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries(), {
      source: "market_pvt",
      sourceLabel: TRIAL_SOURCE_LABEL,
      units: {
        marketPrice: "vnd_per_share",
      },
    });
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        sharesOutstanding: 100_000,
        units: { sharesOutstanding: "shares" },
      },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: trial.marketUnitMetadata,
      },
    });

    expect(valuation.calculation.metrics.marketCap).toMatchObject({
      reason: "ready_from_market_price_and_shares",
      status: "ready",
      value: 5_000_000_000,
    });
  });

  it("blocks unknown, invalid, and Financials-owned market handoff cases", () => {
    const unknown = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 2_500, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries()).marketUnitMetadata,
      },
    });
    const invalid = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 2_500, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries(), {
          source: "market_pvt",
          units: { marketPrice: "million_vnd" },
        }).marketUnitMetadata,
      },
    });
    const financialsOwned = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        eps: 2_500,
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
        units: { eps: "vnd_per_share" },
      } as never,
    });

    expect(unknown.selectedInputs.marketPrice.normalizationStatus).toBe("unknown_unit");
    expect(unknown.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(invalid.selectedInputs.marketPrice.normalizationStatus).toBe("not_normalized");
    expect(invalid.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(financialsOwned.selectedInputs.marketPrice.source).toBe("unavailable");
    expect(financialsOwned.selectedInputs.marketCap.source).toBe("unavailable");
  });

  it("does not bypass invalid metadata with a parallel raw persisted market number", () => {
    const invalidTrial = buildTechnicalFromMarketPriceSeries(baseData, syntheticSeries(), {
      source: "market_pvt",
      units: { marketPrice: "vnd_per_share" },
      values: { marketPrice: -50_000 },
    });
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: { eps: 2_500, units: { eps: "vnd_per_share" } },
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: invalidTrial.marketUnitMetadata,
      },
    });

    expect(valuation.selectedInputs.marketPrice.normalizationStatus).toBe("invalid");
    expect(valuation.calculation.metrics.pe.status).toBe("insufficient_data");
  });

  it("does not emit restricted wording in stringified trial outputs", () => {
    const output = JSON.stringify({
      technical: buildSyntheticTrial().marketUnitMetadata,
      valuation: buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          eps: 2_500,
          units: { eps: "vnd_per_share" },
        },
        persistedValuationInputs: {
          marketPrice: 50_000,
          marketUnitMetadata: buildSyntheticTrial().marketUnitMetadata,
        },
      }),
    }).toLowerCase();
    const blocked = [
      "nen mua",
      "tin hieu mua",
      "dinh gia hap dan",
      "dang re",
      "dang mua",
      "gia muc tieu",
      "muc tieu gia",
      "upside",
      "downside",
      "official",
      "realtime",
      "production-ready",
    ];

    for (const phrase of blocked) {
      expect(output).not.toContain(phrase);
    }
  });
});
