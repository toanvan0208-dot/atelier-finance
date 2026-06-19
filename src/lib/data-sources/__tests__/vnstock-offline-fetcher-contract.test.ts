import { describe, expect, it, vi } from "vitest";

import { VNSTOCK_MARKET_PRICE_RAW_FIXTURE } from "../__fixtures__/vnstock-market-price-raw.fixture";
import { fetchVnstockResearchMarketPrices } from "../vnstock-research-connector";

const runFixtureNormalization = async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const fetchMarketPrices = vi.fn().mockResolvedValue(
    VNSTOCK_MARKET_PRICE_RAW_FIXTURE.map((record) => ({ ...record })),
  );

  const result = await fetchVnstockResearchMarketPrices(
    { ticker: "FPT", startDate: "2025-01-01", endDate: "2025-01-31" },
    {
      enabled: true,
      allowNetwork: true,
      mode: "local_research",
      fetchMarketPrices,
      now: new Date("2026-06-19T00:00:00.000Z"),
    },
  );

  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();

  return { result, fetchMarketPrices };
};

describe("vnstock offline fetcher contract fixture", () => {
  it("normalizes a fake valid OHLCV fixture record", async () => {
    const { result, fetchMarketPrices } = await runFixtureNormalization();

    expect(fetchMarketPrices).toHaveBeenCalledWith({
      ticker: "FPT",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });
    expect(result.ok).toBe(true);
    expect(result.data?.[0]).toMatchObject({
      ticker: "FPT",
      date: "2025-01-02",
      open: 100000,
      high: 101000,
      low: 99000,
      close: 100500,
      volume: 1234567,
      tradingValue: 123000000000,
      sourceProvider: "vnstock",
      sourceType: "third_party_tool",
      usageScope: "academic_non_commercial",
      productionApproved: false,
      retrievedAt: "2026-06-19T00:00:00.000Z",
    });
  });

  it("keeps missing numeric fields null and invalid numbers null with warnings", async () => {
    const { result } = await runFixtureNormalization();

    expect(result.ok).toBe(true);
    expect(result.data?.[1]).toMatchObject({
      ticker: "FPT",
      date: "2025-01-03",
      open: null,
      high: null,
      low: null,
      close: 100000,
      volume: null,
      tradingValue: null,
    });
    expect(result.data?.[1].high).not.toBe(0);
    expect(result.data?.[1].low).not.toBe(0);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("low could not be parsed as a number"),
      ]),
    );
  });

  it("rejects invalid ticker and date fixture records safely", async () => {
    const { result } = await runFixtureNormalization();

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.warnings.join(" ")).toContain("ticker is missing");
    expect(result.warnings.join(" ")).toContain("date is invalid");
  });

  it("ignores unknown raw fields and emits no investment signal fields", async () => {
    const { result } = await runFixtureNormalization();

    expect(result.ok).toBe(true);
    const normalized = result.data?.[0] as Record<string, unknown>;
    const forbiddenOutputFields = [
      "unexpectedField",
      "recommendation",
      "rating",
      "targetPrice",
      "buySignal",
      "sellSignal",
      "holdSignal",
      "advice",
    ];

    for (const field of forbiddenOutputFields) {
      expect(Object.prototype.hasOwnProperty.call(normalized, field)).toBe(false);
    }
  });
});
