import { describe, expect, it } from "vitest";

import { getMarketPriceSeries, type MarketPriceSeriesRow } from "../../../../lib/data-sources";
import {
  buildControlledValuationIntegrationBoundary,
  type ControlledValuationFinancialsRuntimeSnapshot,
} from "../../../valuation/lib/controlled-valuation-integration-boundary";
import type { PVTObservationData } from "../../types";
import { buildTechnicalFromMarketPriceSeries } from "../build-technical-from-market-price-series";
import { loadTechnicalDeskData } from "../load-technical-desk-data";
import {
  buildMarketPvtUnitMetadata,
  type MarketPvtFieldUnitMetadata,
  type MarketPvtUnitMetadataMap,
} from "../market-pvt-unit-metadata-contract";
import { persistMarketPvtUnitMetadataForMarketPrice } from "../market-pvt-unit-metadata-persistence-boundary";

const TICKER = "UNIT76";
const SOURCE_LABEL = "phase76_synthetic_market_pvt_metadata_persistence_trial";
const AS_OF = "2026-06-21";

const verifiedRuntime = (
  patch: ControlledValuationFinancialsRuntimeSnapshot,
): ControlledValuationFinancialsRuntimeSnapshot => ({
  asOf: AS_OF,
  dataMode: "research_only",
  fallbackUsed: false,
  fiscalYear: 2026,
  period: "2026",
  periodType: "annual",
  productionApproved: false,
  readPath: "local_db",
  runtimeStatus: "db_backed",
  sourceLabel: "phase95_market_pvt_persistence_write_financials_counterparty",
  ...patch,
});

type StoredSidecar = {
  field: string;
  unit: string;
  status: string;
  source?: string | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: Date | null;
  warningCodes?: string | null;
  productionApproved?: boolean | null;
};

type StoredMarketPrice = {
  id: string;
  ticker: string;
  tradingDate: Date;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  closePrice: number | null;
  volume: number | null;
  tradingValue: number | null;
  marketCap: number | null;
  sourceLabel: string;
  dataMode: string;
  asOf: Date;
  collectedAt: Date | null;
  unitMetadata: StoredSidecar[];
};

class ControlledMarketPvtTrialDb {
  rows: StoredMarketPrice[] = [];

  marketPrice = {
    findMany: async (args: unknown): Promise<StoredMarketPrice[]> => {
      const input = args as {
        where: {
          ticker: string;
          tradingDate: { gte: Date; lte: Date };
          dataMode: string;
          sourceLabel: string;
        };
      };

      return this.rows
        .filter((row) => {
          if (row.ticker !== input.where.ticker) return false;
          if (row.dataMode !== input.where.dataMode) return false;
          if (row.sourceLabel !== input.where.sourceLabel) return false;
          if (row.tradingDate.getTime() < input.where.tradingDate.gte.getTime()) return false;
          if (row.tradingDate.getTime() > input.where.tradingDate.lte.getTime()) return false;
          return true;
        })
        .sort((left, right) => left.tradingDate.getTime() - right.tradingDate.getTime());
    },
  };

  marketPriceUnitMetadata = {
    upsert: async (args: unknown): Promise<StoredSidecar> => {
      const input = args as {
        where: { marketPriceId_field: { marketPriceId: string; field: string } };
        update: StoredSidecar;
        create: StoredSidecar & { marketPriceId: string };
      };
      const row = this.rows.find((item) => item.id === input.where.marketPriceId_field.marketPriceId);
      if (!row) throw new Error("Synthetic MarketPrice row not found.");

      const existingIndex = row.unitMetadata.findIndex(
        (metadata) => metadata.field === input.where.marketPriceId_field.field,
      );
      const metadata = existingIndex >= 0 ? input.update : input.create;
      const stored: StoredSidecar = {
        asOf: metadata.asOf,
        dataMode: metadata.dataMode,
        field: metadata.field,
        productionApproved: false,
        source: metadata.source,
        sourceLabel: metadata.sourceLabel,
        status: metadata.status,
        unit: metadata.unit,
        warningCodes: metadata.warningCodes,
      };

      if (existingIndex >= 0) row.unitMetadata[existingIndex] = stored;
      else row.unitMetadata.push(stored);
      return stored;
    },
  };

  createSyntheticMarketPrice(patch: Partial<StoredMarketPrice> = {}): StoredMarketPrice {
    const index = this.rows.length + 1;
    const tradingDate = patch.tradingDate ?? new Date(`2026-06-${String(index).padStart(2, "0")}`);
    const row: StoredMarketPrice = {
      id: patch.id ?? `market-price-${index}`,
      ticker: patch.ticker ?? TICKER,
      tradingDate,
      openPrice: patch.openPrice ?? 49_000,
      highPrice: patch.highPrice ?? 51_000,
      lowPrice: patch.lowPrice ?? 48_500,
      closePrice: patch.closePrice ?? 49_000,
      volume: patch.volume ?? 100_000,
      tradingValue: patch.tradingValue ?? 4_473_684_210.526316,
      marketCap: patch.marketCap ?? null,
      sourceLabel: patch.sourceLabel ?? SOURCE_LABEL,
      dataMode: patch.dataMode ?? "research_only",
      asOf: patch.asOf ?? new Date(AS_OF),
      collectedAt: patch.collectedAt ?? new Date(`${AS_OF}T00:00:00.000Z`),
      unitMetadata: patch.unitMetadata ?? [],
    };
    this.rows.push(row);
    return row;
  }
}

const baseData: PVTObservationData = {
  ticker: TICKER,
  companyName: "UNIT76 synthetic",
  industry: "synthetic",
  currentPrice: 0,
  status: { label: "Base", tone: "neutral", conclusion: "Base conclusion" },
  keyLevels: { support: "0", resistance: "0" },
  volume: { currentVsAvg20: null, label: "Base volume", conclusion: "Base volume conclusion" },
  chart: { title: "PVT", points: [], events: [], quickRead: [] },
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
  fomo: { level: "Thấp", score: null, maxScore: 6, signs: [], conclusion: "Base fomo" },
  finalConclusion: {
    status: "Base status",
    positive: "Base positive",
    caution: "Base caution",
    nextStep: "Base next step",
  },
  nextActions: [],
};

const seedTwentyRows = (db: ControlledMarketPvtTrialDb): StoredMarketPrice => {
  for (let index = 1; index <= 20; index += 1) {
    db.createSyntheticMarketPrice({
      closePrice: index === 20 ? 50_000 : 49_000,
      id: `market-price-${index}`,
      marketCap: index === 20 ? 5_000_000_000 : null,
      tradingDate: new Date(`2026-06-${String(index).padStart(2, "0")}`),
      tradingValue: index === 20 ? 5_000_000_000 : 4_473_684_210.526316,
    });
  }

  return db.rows[19];
};

const validMetadata = (): MarketPvtUnitMetadataMap =>
  buildMarketPvtUnitMetadata({
    asOf: AS_OF,
    dataMode: "research_only",
    source: "persisted_market_bridge",
    sourceLabel: SOURCE_LABEL,
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
      marketPrice: 50_000,
      tradingValue: 5_000_000_000,
      volume: 100_000,
    },
  });

const readTrialSeries = (db: ControlledMarketPvtTrialDb) =>
  getMarketPriceSeries(
    {
      dataMode: "research_only",
      from: "2026-06-01",
      sourceLabel: SOURCE_LABEL,
      ticker: TICKER,
      to: AS_OF,
    },
    { db },
  );

const invalidMarketPriceMetadata = (): MarketPvtFieldUnitMetadata => ({
  acceptedUnits: ["vnd_per_share"],
  asOf: AS_OF,
  dataMode: "research_only",
  field: "marketPrice",
  owner: "market_pvt",
  productionApproved: false,
  source: "persisted_market_bridge",
  sourceLabel: SOURCE_LABEL,
  status: "invalid_unit",
  unit: "million_vnd",
  usedByValuation: true,
  value: 50_000,
  warnings: ["marketPrice_market_pvt_unit_million_vnd_invalid_unit"],
});

describe("Phase 76 controlled Market/PVT metadata persistence write trial", () => {
  it("writes explicit valid synthetic metadata by marketPriceId and field, then reads every persisted unit ready", async () => {
    const db = new ControlledMarketPvtTrialDb();
    const latest = seedTwentyRows(db);

    const write = await persistMarketPvtUnitMetadataForMarketPrice(
      {
        asOf: AS_OF,
        dataMode: "research_only",
        marketPriceId: latest.id,
        marketUnitMetadata: validMetadata(),
        sourceLabel: SOURCE_LABEL,
      },
      db,
    );
    const series = await readTrialSeries(db);

    expect(write).toMatchObject({
      productionApproved: false,
      rejectedCount: 0,
      upsertedCount: 5,
    });
    expect(latest.unitMetadata.map((metadata) => metadata.field).sort()).toEqual(
      ["averageTradingValue20d", "marketCap", "marketPrice", "tradingValue", "volume"].sort(),
    );
    expect(latest.unitMetadata.every((metadata) => metadata.productionApproved === false)).toBe(true);
    expect(series.marketUnitMetadata?.marketPrice).toMatchObject({
      asOf: AS_OF,
      dataMode: "research_only",
      productionApproved: false,
      source: "persisted_market_bridge",
      sourceLabel: SOURCE_LABEL,
      status: "ready",
      unit: "vnd_per_share",
      value: 50_000,
    });
    expect(series.marketUnitMetadata?.marketCap).toMatchObject({ status: "ready", unit: "vnd", value: 5_000_000_000 });
    expect(series.marketUnitMetadata?.volume).toMatchObject({ status: "ready", unit: "shares", value: 100_000 });
    expect(series.marketUnitMetadata?.tradingValue).toMatchObject({
      status: "ready",
      unit: "vnd",
      value: 5_000_000_000,
    });
    expect(series.marketUnitMetadata?.averageTradingValue20d).toMatchObject({
      status: "ready",
      unit: "vnd",
      value: 4_500_000_000,
    });
  });

  it("passes persisted read-back metadata through Technical/PVT runtime and controlled Valuation", async () => {
    const db = new ControlledMarketPvtTrialDb();
    const latest = seedTwentyRows(db);
    await persistMarketPvtUnitMetadataForMarketPrice(
      {
        marketPriceId: latest.id,
        marketUnitMetadata: validMetadata(),
      },
      db,
    );

    const series = await readTrialSeries(db);
    const technical = buildTechnicalFromMarketPriceSeries(baseData, series);
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        eps: 2_500,
        revenue: 1_000_000_000,
        sharesOutstanding: 100_000,
        units: {
          eps: "vnd_per_share",
          revenue: "vnd",
          sharesOutstanding: "shares",
        },
      }),
      persistedValuationInputs: {
        dataMode: "research_only",
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
        marketUnitMetadata: technical.marketUnitMetadata,
        sourceLabel: SOURCE_LABEL,
      },
    });

    expect(technical.marketUnitMetadata.marketPrice.status).toBe("ready");
    expect(technical.marketUnitMetadata.marketPrice.source).toBe("persisted_market_bridge");
    expect(valuation.calculation.metrics.marketCap).toMatchObject({
      reason: "ready_from_direct_market_cap",
      status: "ready",
      value: 5_000_000_000,
    });
    expect(valuation.calculation.metrics.pe).toMatchObject({ status: "ready", value: 20 });
    expect(valuation.sourceBoundary.productionApproved).toBe(false);
    expect(valuation.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    expect(valuation.calculation.blockedMetrics.ev.status).toBe("blocked");
    expect(valuation.calculation.blockedMetrics.evToEbitda.status).toBe("blocked");
    expect(valuation.calculation.blockedMetrics.dcf.status).toBe("blocked");
    expect(valuation.calculation.blockedMetrics.fairValueRange.status).toBe("blocked");
  });

  it("keeps old MarketPrice rows without metadata as unknown_unit without magnitude guessing", async () => {
    const db = new ControlledMarketPvtTrialDb();
    seedTwentyRows(db);

    const series = await readTrialSeries(db);

    expect(series.marketUnitMetadata?.marketPrice).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 50_000,
    });
    expect(series.marketUnitMetadata?.marketCap).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 5_000_000_000,
    });
    expect(series.marketUnitMetadata?.marketCap.unit).not.toBe("vnd");
    expect(series.marketUnitMetadata?.tradingValue.unit).not.toBe("billion_vnd");
  });

  it("rejects invalid or missing units and does not let persisted numeric values bypass metadata", async () => {
    const db = new ControlledMarketPvtTrialDb();
    const latest = seedTwentyRows(db);
    const write = await persistMarketPvtUnitMetadataForMarketPrice(
      {
        marketPriceId: latest.id,
        marketUnitMetadata: {
          marketCap: {
            ...validMetadata().marketCap,
            status: "unknown_unit",
            unit: "unknown",
            warnings: ["marketCap_market_pvt_unit_metadata_missing"],
          },
          marketPrice: invalidMarketPriceMetadata(),
        },
      },
      db,
    );
    const series = await readTrialSeries(db);
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({ eps: 2_500, units: { eps: "vnd_per_share" } }),
      persistedValuationInputs: {
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
        marketUnitMetadata: series.marketUnitMetadata,
      },
    });

    expect(write).toMatchObject({ rejectedCount: 2, upsertedCount: 0 });
    expect(series.marketUnitMetadata?.marketPrice).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 50_000,
    });
    expect(series.marketUnitMetadata?.marketPrice.value).not.toBe(0);
    expect(valuation.selectedInputs.marketPrice.normalizationStatus).toBe("unknown_unit");
    expect(valuation.calculation.metrics.pe.status).toBe("insufficient_data");
  });

  it("treats corrupted persisted sidecar units as fail-closed read-back metadata", async () => {
    const db = new ControlledMarketPvtTrialDb();
    const latest = seedTwentyRows(db);
    latest.unitMetadata.push(
      {
        field: "marketPrice",
        productionApproved: false,
        status: "ready",
        unit: "million_vnd",
        warningCodes: "[]",
      },
      {
        field: "marketCap",
        productionApproved: false,
        status: "ready",
        unit: "vnd_per_share",
        warningCodes: "[]",
      },
    );

    const series = await readTrialSeries(db);
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({ eps: 2_500, units: { eps: "vnd_per_share" } }),
      persistedValuationInputs: {
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
        marketUnitMetadata: series.marketUnitMetadata,
      },
    });

    expect(series.warnings).toContain("marketPrice_persisted_market_pvt_unit_metadata_invalid");
    expect(series.warnings).toContain("marketCap_persisted_market_pvt_unit_metadata_invalid");
    expect(series.marketUnitMetadata?.marketPrice.status).toBe("unknown_unit");
    expect(series.marketUnitMetadata?.marketCap.status).toBe("unknown_unit");
    expect(valuation.calculation.metrics.pe.status).toBe("insufficient_data");
    expect(valuation.calculation.metrics.pb.status).toBe("insufficient_data");
  });

  it("keeps safe-error and fallback paths from zero-filling or guessing units", async () => {
    const safeError = await loadTechnicalDeskData(
      { allowFallback: false, from: "bad-date", preferDb: true, ticker: "", to: AS_OF },
      { fallbackData: baseData },
    );
    const fallback = await loadTechnicalDeskData(
      { from: "2026-06-01", preferDb: false, ticker: TICKER, to: AS_OF },
      { fallbackData: baseData },
    );

    expect(safeError.marketUnitMetadata.marketPrice).toMatchObject({
      status: "missing",
      unit: "unknown",
      value: null,
    });
    expect(fallback.marketUnitMetadata.marketPrice).toMatchObject({
      status: "missing",
      unit: "unknown",
      value: null,
    });
    expect(safeError.marketUnitMetadata.marketPrice.value).not.toBe(0);
    expect(fallback.marketUnitMetadata.marketPrice.value).not.toBe(0);
  });

  it("keeps Financials ownership blocked for marketPrice and marketCap", () => {
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        eps: 2_500,
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
        units: { eps: "vnd_per_share" },
      } as never),
    });

    expect(valuation.selectedInputs.marketPrice.source).toBe("unavailable");
    expect(valuation.selectedInputs.marketCap.source).toBe("unavailable");
  });

  it("does not emit prohibited investment action fields or source overclaims", async () => {
    const db = new ControlledMarketPvtTrialDb();
    const latest = seedTwentyRows(db);
    await persistMarketPvtUnitMetadataForMarketPrice(
      {
        marketPriceId: latest.id,
        marketUnitMetadata: validMetadata(),
      },
      db,
    );
    const series = await readTrialSeries(db);
    const output = JSON.stringify({
      series,
      technicalRows: series.rows satisfies MarketPriceSeriesRow[],
    }).toLowerCase();

    for (const phrase of [
      "recommendation",
      "targetprice",
      "target price",
      "fairvalue",
      "fair value",
      "risk scoring",
      "production-ready",
      "realtime",
      "official source",
    ]) {
      expect(output).not.toContain(phrase);
    }
  });
});
