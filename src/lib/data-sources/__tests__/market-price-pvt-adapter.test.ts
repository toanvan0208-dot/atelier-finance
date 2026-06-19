import { describe, expect, it, vi } from "vitest";

import {
  adaptMarketPriceSeriesToPvt,
  type MarketPriceSeriesResult,
  type MarketPriceSeriesRow,
} from "../index";

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

describe("market price PVT adapter", () => {
  it("converts a market price series into sorted PVT adapter output", () => {
    const result = adaptMarketPriceSeriesToPvt(
      series([
        row({ date: "2025-01-03", close: 110, volume: 2000, tradingValue: 220000 }),
        row({ date: "2025-01-02", close: 100, volume: 1000, tradingValue: 100000 }),
      ]),
    );

    expect(result.status).toBe("completed");
    expect(result.count).toBe(2);
    expect(result.dateSpan).toEqual({ from: "2025-01-02", to: "2025-01-03" });
    expect(result.latestDate).toBe("2025-01-03");
    expect(result.latestClose).toBe(110);
    expect(result.previousClose).toBe(100);
    expect(result.priceChangePercent).toBeCloseTo(0.1);
    expect(result.latestVolume).toBe(2000);
    expect(result.latestTradingValue).toBe(220000);
  });

  it("preserves null values and does not replace missing data with zero", () => {
    const result = adaptMarketPriceSeriesToPvt(
      series([
        row({ date: "2025-01-02", close: null, tradingValue: null }),
        row({ date: "2025-01-03", close: null, volume: null, tradingValue: null }),
      ]),
    );

    expect(result.latestClose).toBeNull();
    expect(result.previousClose).toBeNull();
    expect(result.priceChangePercent).toBeNull();
    expect(result.latestVolume).toBeNull();
    expect(result.latestTradingValue).toBeNull();
    expect(result.pvtInput?.closePrice).toBeNull();
    expect(result.pvtInput?.avgTradingValue20d).toBeNull();
    expect(result.latestClose).not.toBe(0);
  });

  it("avoids division by zero for price change", () => {
    const result = adaptMarketPriceSeriesToPvt(
      series([
        row({ date: "2025-01-02", close: 0 }),
        row({ date: "2025-01-03", close: 110 }),
      ]),
    );

    expect(result.previousClose).toBe(0);
    expect(result.priceChangePercent).toBeNull();
  });

  it("carries local research metadata and permanent production approval false", () => {
    const result = adaptMarketPriceSeriesToPvt(series([row()]));

    expect(result.sourceLabel).toBe("vnstock");
    expect(result.dataMode).toBe("research_only");
    expect(result.productionApproved).toBe(false);
    expect(result.pvtInput?.productionApproved).toBe(false);
    expect(result.warnings.join(" ")).toContain("local academic/research");
  });

  it("handles incomplete series without producing adapter input", () => {
    const result = adaptMarketPriceSeriesToPvt(
      series([], {
        ok: false,
        status: "not_found",
        count: 0,
        rows: [],
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe("insufficient_data");
    expect(result.pvtInput).toBeNull();
    expect(result.count).toBe(0);
  });

  it("does not expose investment action fields", () => {
    const result = adaptMarketPriceSeriesToPvt(series([row()]));
    const output = JSON.stringify(result);

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("rating");
    expect(output).not.toContain("targetPrice");
    expect(output).not.toContain("buySignal");
    expect(output).not.toContain("sellSignal");
    expect(output).not.toContain("holdSignal");
    expect(output).not.toContain("advice");
  });

  it("does not call network", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    adaptMarketPriceSeriesToPvt(series([row()]));

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
