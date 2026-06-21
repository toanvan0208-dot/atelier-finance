import { describe, expect, it } from "vitest";

import {
  buildMarketPvtUnitMetadata,
  isMarketPvtUnitAccepted,
  marketPvtUnitContracts,
} from "../market-pvt-unit-metadata-contract";

describe("market PVT unit metadata contract", () => {
  it("accepts only VND per share for market price", () => {
    expect(isMarketPvtUnitAccepted("marketPrice", "vnd_per_share")).toBe(true);
    expect(isMarketPvtUnitAccepted("marketPrice", "million_vnd")).toBe(false);
  });

  it("accepts VND-scale units for market cap and trading values", () => {
    expect(isMarketPvtUnitAccepted("marketCap", "vnd")).toBe(true);
    expect(isMarketPvtUnitAccepted("marketCap", "billion_vnd")).toBe(true);
    expect(isMarketPvtUnitAccepted("tradingValue", "million_vnd")).toBe(true);
    expect(isMarketPvtUnitAccepted("averageTradingValue20d", "thousand_vnd")).toBe(true);
    expect(isMarketPvtUnitAccepted("marketCap", "vnd_per_share")).toBe(false);
  });

  it("accepts share units for volume", () => {
    expect(isMarketPvtUnitAccepted("volume", "shares")).toBe(true);
    expect(isMarketPvtUnitAccepted("volume", "thousand_shares")).toBe(true);
    expect(isMarketPvtUnitAccepted("volume", "million_shares")).toBe(true);
    expect(isMarketPvtUnitAccepted("volume", "vnd")).toBe(false);
  });

  it("marks present values without units as unknown without guessing magnitude", () => {
    const metadata = buildMarketPvtUnitMetadata({
      values: {
        marketCap: 1_000_000_000_000,
        marketPrice: 50_000,
      },
    });

    expect(metadata.marketCap).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      value: 1_000_000_000_000,
    });
    expect(metadata.marketCap.unit).not.toBe("billion_vnd");
    expect(metadata.marketPrice.warnings).toContain("marketPrice_market_pvt_unit_metadata_missing");
  });

  it("marks incompatible units as invalid", () => {
    const metadata = buildMarketPvtUnitMetadata({
      units: {
        marketCap: "vnd_per_share",
        marketPrice: "million_vnd",
      },
      values: {
        marketCap: 5000,
        marketPrice: 50_000,
      },
    });

    expect(metadata.marketPrice).toMatchObject({
      status: "invalid_unit",
      unit: "million_vnd",
    });
    expect(metadata.marketCap.warnings).toContain("marketCap_market_pvt_unit_vnd_per_share_invalid_unit");
  });

  it("keeps ownership and source approval boundaries explicit", () => {
    const metadata = buildMarketPvtUnitMetadata({
      asOf: "2026-06-21",
      dataMode: "research_only",
      sourceLabel: "market_pvt_unit_test",
      units: { marketPrice: "vnd_per_share" },
      values: { marketPrice: 50_000 },
    });

    expect(marketPvtUnitContracts.marketPrice.owner).toBe("market_pvt");
    expect(metadata.marketPrice).toMatchObject({
      asOf: "2026-06-21",
      dataMode: "research_only",
      owner: "market_pvt",
      productionApproved: false,
      sourceLabel: "market_pvt_unit_test",
      status: "ready",
      unit: "vnd_per_share",
    });
  });

  it("does not emit restricted wording in generated metadata", () => {
    const output = JSON.stringify(
      buildMarketPvtUnitMetadata({
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
      "upside",
      "downside",
      "official",
      "realtime",
      "production-ready",
      "production-approved",
    ];

    for (const phrase of blocked) {
      expect(output).not.toContain(phrase);
    }
  });
});
