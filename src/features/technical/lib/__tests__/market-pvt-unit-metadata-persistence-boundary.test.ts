import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildControlledValuationIntegrationBoundary,
  type ControlledValuationFinancialsRuntimeSnapshot,
} from "../../../valuation/lib/controlled-valuation-integration-boundary";
import {
  buildMarketPvtUnitMetadata,
  type MarketPvtFieldUnitMetadata,
  type MarketPvtNumericField,
} from "../market-pvt-unit-metadata-contract";
import {
  persistMarketPvtUnitMetadataForMarketPrice,
  readMarketPvtUnitMetadataFromPersistencePayload,
  unitMetadataPayloadFromMarketPriceSidecar,
} from "../market-pvt-unit-metadata-persistence-boundary";

const values = {
  averageTradingValue20d: 4_500_000_000,
  marketCap: 5_000_000_000,
  marketPrice: 50_000,
  tradingValue: 5_000_000_000,
  volume: 100_000,
};

const verifiedRuntime = (
  patch: ControlledValuationFinancialsRuntimeSnapshot,
): ControlledValuationFinancialsRuntimeSnapshot => ({
  asOf: "2026-06-21",
  dataMode: "research_only",
  fallbackUsed: false,
  fiscalYear: 2026,
  period: "2026",
  periodType: "annual",
  productionApproved: false,
  readPath: "local_db",
  runtimeStatus: "db_backed",
  sourceLabel: "phase95_market_pvt_persistence_boundary",
  ...patch,
});

const validMetadata = () =>
  buildMarketPvtUnitMetadata({
    asOf: "2026-06-21",
    dataMode: "research_only",
    source: "persisted_market_bridge",
    sourceLabel: "phase75_local_market_bridge",
    units: {
      averageTradingValue20d: "vnd",
      marketCap: "billion_vnd",
      marketPrice: "vnd_per_share",
      tradingValue: "vnd",
      volume: "shares",
    },
    values,
  });

describe("Phase 75 Market/PVT unit metadata persistence boundary", () => {
  it("adds the additive Prisma sidecar relation shape and migration", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma/migrations/20260621093000_phase_75_market_pvt_unit_metadata_sidecar/migration.sql",
      ),
      "utf8",
    );

    expect(schema).toContain("model MarketPriceUnitMetadata");
    expect(schema).toContain("unitMetadata        MarketPriceUnitMetadata[]");
    expect(schema).toContain("@@unique([marketPriceId, field])");
    expect(migration).toContain('CREATE TABLE "MarketPriceUnitMetadata"');
    expect(migration).toContain('CREATE UNIQUE INDEX "MarketPriceUnitMetadata_marketPriceId_field_key"');
  });

  it("maps old MarketPrice rows without sidecar metadata to unknown_unit", () => {
    const result = readMarketPvtUnitMetadataFromPersistencePayload({
      dataMode: "research_only",
      payload: undefined,
      sourceLabel: "vnstock",
      values,
    });

    expect(result.status).toBe("missing_metadata");
    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 50_000,
    });
    expect(result.marketUnitMetadata.marketCap.unit).not.toBe("vnd");
  });

  it("accepts valid persisted marketPrice and marketCap units as ready", () => {
    const payload = unitMetadataPayloadFromMarketPriceSidecar([
      { field: "marketPrice", status: "ready", unit: "vnd_per_share" },
      { field: "marketCap", status: "ready", unit: "vnd" },
    ]);
    const result = readMarketPvtUnitMetadataFromPersistencePayload({
      dataMode: "research_only",
      payload,
      sourceLabel: "vnstock",
      values,
    });

    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      source: "persisted_market_bridge",
      status: "ready",
      unit: "vnd_per_share",
      value: 50_000,
    });
    expect(result.marketUnitMetadata.marketCap).toMatchObject({
      status: "ready",
      unit: "vnd",
      value: 5_000_000_000,
    });
  });

  it("keeps missing and invalid units fail-closed without zero-fill or defaults", () => {
    const result = readMarketPvtUnitMetadataFromPersistencePayload({
      payload: unitMetadataPayloadFromMarketPriceSidecar([
        { field: "marketPrice", status: "ready", unit: "million_vnd" },
        { field: "marketCap", status: "ready", unit: null },
      ]),
      values: {
        marketCap: 5_000_000_000,
        marketPrice: 50_000,
      },
    });

    expect(result.status).toBe("invalid_metadata");
    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 50_000,
    });
    expect(result.marketUnitMetadata.marketCap).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 5_000_000_000,
    });
    expect(result.marketUnitMetadata.marketPrice.value).not.toBe(0);
    expect(result.marketUnitMetadata.marketCap.unit).not.toBe("vnd");
  });

  it("does not let persisted numeric market values bypass invalid metadata in Valuation", () => {
    const result = readMarketPvtUnitMetadataFromPersistencePayload({
      payload: unitMetadataPayloadFromMarketPriceSidecar([
        { field: "marketPrice", status: "ready", unit: "million_vnd" },
      ]),
      values: { marketPrice: 50_000 },
    });
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({ eps: 2_500, units: { eps: "vnd_per_share" } }),
      persistedValuationInputs: {
        marketPrice: 50_000,
        marketUnitMetadata: result.marketUnitMetadata,
      },
    });

    expect(valuation.selectedInputs.marketPrice.normalizationStatus).toBe("unknown_unit");
    expect(valuation.calculation.metrics.pe.status).toBe("insufficient_data");
  });

  it("keeps Financials ownership of marketPrice and marketCap blocked", () => {
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

  it("upserts only explicit valid metadata and leaves production approval false", async () => {
    const calls: unknown[] = [];
    const metadata = validMetadata();
    const invalidMarketCap: MarketPvtFieldUnitMetadata = {
      ...metadata.marketCap,
      status: "invalid_unit",
      unit: "vnd_per_share",
      warnings: ["marketCap_market_pvt_unit_vnd_per_share_invalid_unit"],
    };

    const result = await persistMarketPvtUnitMetadataForMarketPrice(
      {
        marketPriceId: "market-price-1",
        marketUnitMetadata: {
          marketCap: invalidMarketCap,
          marketPrice: metadata.marketPrice,
          volume: metadata.volume,
        },
      },
      {
        marketPriceUnitMetadata: {
          upsert: async (args: unknown) => {
            calls.push(args);
            return {};
          },
        },
      },
    );

    expect(result).toMatchObject({
      productionApproved: false,
      rejectedCount: 1,
      upsertedCount: 2,
    });
    expect(JSON.stringify(calls)).toContain("vnd_per_share");
    expect(JSON.stringify(calls)).toContain("\"productionApproved\":false");
    expect(JSON.stringify(calls)).not.toContain("vnd_per_share_invalid_unit");
  });

  it("migration SQL is additive and contains no destructive operation or guessed backfill", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma/migrations/20260621093000_phase_75_market_pvt_unit_metadata_sidecar/migration.sql",
      ),
      "utf8",
    ).toLowerCase();
    const forbidden = [
      "drop table",
      "drop column",
      "delete from",
      "update \"marketprice\"",
      "alter table \"marketprice\" drop",
      "insert into \"marketpriceunitmetadata\"",
      "billion_vnd",
      "million_vnd",
    ];

    for (const token of forbidden) {
      expect(migration).not.toContain(token);
    }
  });

  it("persists every approved Phase 75 field without adding unrelated fields", () => {
    const fields = Object.keys(validMetadata()) as MarketPvtNumericField[];

    expect(fields.sort()).toEqual(
      [
        "averageTradingValue20d",
        "marketCap",
        "marketPrice",
        "tradingValue",
        "volume",
      ].sort(),
    );
  });
});
