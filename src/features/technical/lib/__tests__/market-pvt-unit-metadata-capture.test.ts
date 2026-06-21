import { describe, expect, it } from "vitest";

import {
  attachMarketPvtUnitMetadata,
  buildUnknownMarketPvtUnitMetadata,
  captureMarketPvtUnitMetadata,
  normalizeMarketPvtUnitMetadataForValuation,
} from "../market-pvt-unit-metadata-capture";

describe("market pvt unit metadata capture", () => {
  it("captures explicit Market/PVT units as ready", () => {
    const result = captureMarketPvtUnitMetadata({
      asOf: "2026-06-21",
      dataMode: "research_only",
      source: "local_research",
      sourceLabel: "phase72_unit_capture_test",
      units: {
        averageTradingValue20d: "million_vnd",
        marketCap: "billion_vnd",
        marketPrice: "vnd_per_share",
        tradingValue: "million_vnd",
        volume: "shares",
      },
      values: {
        averageTradingValue20d: 50,
        marketCap: 5,
        marketPrice: 50_000,
        tradingValue: 100,
        volume: 2_000,
      },
    });

    expect(result.productionApproved).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      source: "local_research",
      sourceLabel: "phase72_unit_capture_test",
      status: "ready",
      unit: "vnd_per_share",
      value: 50_000,
    });
    expect(result.marketUnitMetadata.marketCap.status).toBe("ready");
    expect(result.marketUnitMetadata.volume.status).toBe("ready");
    expect(result.marketUnitMetadata.tradingValue.status).toBe("ready");
    expect(result.marketUnitMetadata.averageTradingValue20d.status).toBe("ready");
  });

  it("fails closed for missing units without guessing magnitude", () => {
    const metadata = buildUnknownMarketPvtUnitMetadata(
      {
        marketCap: 1_000_000_000_000,
        marketPrice: 50_000,
      },
      {
        dataMode: "research_only",
        source: "local_research",
        sourceLabel: "missing_unit_source",
      },
    );

    expect(metadata.marketCap).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 1_000_000_000_000,
    });
    expect(metadata.marketCap.unit).not.toBe("billion_vnd");
    expect(metadata.marketPrice.warnings).toContain("marketPrice_market_pvt_unit_metadata_missing");
  });

  it("marks invalid units and invalid values as not ready", () => {
    const result = captureMarketPvtUnitMetadata({
      units: {
        marketCap: "vnd_per_share",
        marketPrice: "million_vnd",
        tradingValue: "vnd",
        volume: "shares",
      },
      values: {
        marketCap: 5000,
        marketPrice: 50_000,
        tradingValue: 0,
        volume: -1,
      },
    });

    expect(result.marketUnitMetadata.marketPrice.status).toBe("invalid_unit");
    expect(result.marketUnitMetadata.marketCap.status).toBe("invalid_unit");
    expect(result.marketUnitMetadata.tradingValue.status).toBe("invalid_value");
    expect(result.marketUnitMetadata.volume.status).toBe("invalid_value");
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "marketPrice_market_pvt_unit_million_vnd_invalid_unit",
        "marketCap_market_pvt_unit_vnd_per_share_invalid_unit",
        "tradingValue_market_pvt_value_invalid",
        "volume_market_pvt_value_invalid",
      ]),
    );
  });

  it("marks non-finite and zero values as invalid values", () => {
    const result = captureMarketPvtUnitMetadata({
      units: {
        averageTradingValue20d: "vnd",
        marketCap: "vnd",
        marketPrice: "vnd_per_share",
        volume: "shares",
      },
      values: {
        averageTradingValue20d: Number.NaN,
        marketCap: Number.POSITIVE_INFINITY,
        marketPrice: 0,
        volume: 0,
      },
    });

    expect(result.marketUnitMetadata.averageTradingValue20d.status).toBe("invalid_value");
    expect(result.marketUnitMetadata.marketCap.status).toBe("invalid_value");
    expect(result.marketUnitMetadata.marketPrice.status).toBe("invalid_value");
    expect(result.marketUnitMetadata.volume.status).toBe("invalid_value");
    expect(result.marketUnitMetadata.marketPrice.value).toBe(0);
    expect(result.marketUnitMetadata.marketCap.value).toBeNull();
  });

  it("keeps missing values as null and separates valuation handoff fields", () => {
    const result = captureMarketPvtUnitMetadata({
      units: { marketPrice: "vnd_per_share", volume: "shares" },
      values: { marketPrice: null, volume: null },
    });
    const valuationMetadata = normalizeMarketPvtUnitMetadataForValuation(result.marketUnitMetadata);

    expect(result.marketUnitMetadata.marketPrice).toMatchObject({
      status: "missing",
      unit: "unknown",
      value: null,
    });
    expect(result.marketUnitMetadata.volume.value).toBeNull();
    expect(valuationMetadata).toEqual({
      marketCap: result.marketUnitMetadata.marketCap,
      marketPrice: result.marketUnitMetadata.marketPrice,
    });
  });

  it("attaches metadata to bridge-like payloads without replacing existing warnings", () => {
    const attached = attachMarketPvtUnitMetadata(
      { warnings: ["existing_warning"] },
      {
        units: { marketPrice: "vnd_per_share" },
        values: { marketPrice: 50_000 },
      },
    );

    expect(attached.marketUnitMetadata.marketPrice.status).toBe("ready");
    expect(attached.warnings).toEqual(["existing_warning"]);
  });

  it("does not expose restricted wording in captured output", () => {
    const text = JSON.stringify(
      captureMarketPvtUnitMetadata({
        units: { marketCap: "billion_vnd", marketPrice: "vnd_per_share", volume: "shares" },
        values: { marketCap: 2, marketPrice: 50_000, volume: 1_000_000 },
      }),
    ).toLowerCase();
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
      expect(text).not.toContain(phrase);
    }
  });
});
