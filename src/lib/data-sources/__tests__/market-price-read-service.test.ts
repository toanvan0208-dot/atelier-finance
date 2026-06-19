import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getMarketPriceSeries,
  toPvtMarketPriceInput,
  type MarketPriceReadParams,
} from "../index";

type StoredMarketPrice = {
  ticker: string;
  tradingDate: Date;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  closePrice: number | null;
  volume: number | null;
  tradingValue: number | null;
  sourceLabel: string;
  dataMode: string;
  collectedAt?: Date | null;
};

class FakeMarketPriceReadDb {
  marketPrices: StoredMarketPrice[] = [];

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

      return this.marketPrices
        .filter((price) => {
          if (price.ticker !== input.where.ticker) return false;
          if (price.dataMode !== input.where.dataMode) return false;
          if (price.sourceLabel !== input.where.sourceLabel) return false;
          if (price.tradingDate.getTime() < input.where.tradingDate.gte.getTime()) return false;
          if (price.tradingDate.getTime() > input.where.tradingDate.lte.getTime()) return false;
          return true;
        })
        .sort((left, right) => left.tradingDate.getTime() - right.tradingDate.getTime());
    },
  };
}

const row = (patch: Partial<StoredMarketPrice> = {}): StoredMarketPrice => ({
  ticker: "FPT",
  tradingDate: new Date("2025-01-02"),
  openPrice: 100,
  highPrice: 110,
  lowPrice: 95,
  closePrice: 105,
  volume: 1000,
  tradingValue: 105000,
  sourceLabel: "vnstock",
  dataMode: "research_only",
  collectedAt: new Date("2026-06-19T00:00:00.000Z"),
  ...patch,
});

const params = (patch: Partial<MarketPriceReadParams> = {}): MarketPriceReadParams => ({
  ticker: "FPT",
  from: "2025-01-01",
  to: "2025-01-31",
  ...patch,
});

describe("market price read service", () => {
  let db: FakeMarketPriceReadDb;

  beforeEach(() => {
    db = new FakeMarketPriceReadDb();
  });

  it("reads research-only market price rows ordered by date", async () => {
    db.marketPrices.push(
      row({ tradingDate: new Date("2025-01-05"), closePrice: 107 }),
      row({ tradingDate: new Date("2025-01-02"), closePrice: 105 }),
    );

    const result = await getMarketPriceSeries(params(), { db });

    expect(result.status).toBe("completed");
    expect(result.ok).toBe(true);
    expect(result.count).toBe(2);
    expect(result.rows.map((item) => item.date)).toEqual(["2025-01-02", "2025-01-05"]);
    expect(result.rows.map((item) => item.close)).toEqual([105, 107]);
    expect(result.productionApproved).toBe(false);
  });

  it("filters ticker, date range, source label, and data mode", async () => {
    db.marketPrices.push(
      row({ ticker: "FPT", tradingDate: new Date("2025-01-10"), closePrice: 110 }),
      row({ ticker: "FPT", tradingDate: new Date("2024-12-31"), closePrice: 99 }),
      row({ ticker: "HPG", tradingDate: new Date("2025-01-10"), closePrice: 30 }),
      row({ ticker: "FPT", tradingDate: new Date("2025-01-11"), dataMode: "user_input", closePrice: 111 }),
      row({ ticker: "FPT", tradingDate: new Date("2025-01-12"), sourceLabel: "manual_upload", closePrice: 112 }),
    );

    const result = await getMarketPriceSeries(params({ ticker: " fpt " }), { db });

    expect(result.status).toBe("completed");
    expect(result.count).toBe(1);
    expect(result.rows[0]).toMatchObject({
      ticker: "FPT",
      date: "2025-01-10",
      close: 110,
    });
  });

  it("preserves null numeric values and does not convert them to zero", async () => {
    db.marketPrices.push(
      row({
        openPrice: null,
        highPrice: null,
        tradingValue: null,
      }),
    );

    const result = await getMarketPriceSeries(params(), { db });

    expect(result.rows[0]).toMatchObject({
      open: null,
      high: null,
      tradingValue: null,
    });
    expect(result.rows[0].open).not.toBe(0);
    expect(result.rows[0].tradingValue).not.toBe(0);
  });

  it("handles invalid input without reading the database", async () => {
    const findMany = vi.spyOn(db.marketPrice, "findMany");

    const emptyTicker = await getMarketPriceSeries(params({ ticker: " " }), { db });
    const invalidDate = await getMarketPriceSeries(params({ from: "invalid-date" }), { db });
    const reversedRange = await getMarketPriceSeries(
      params({ from: "2025-02-01", to: "2025-01-01" }),
      { db },
    );

    expect(emptyTicker.status).toBe("invalid_input");
    expect(invalidDate.status).toBe("invalid_input");
    expect(reversedRange.status).toBe("invalid_input");
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns not_found for an empty result without crashing", async () => {
    const result = await getMarketPriceSeries(params({ ticker: "VCB" }), { db });

    expect(result.status).toBe("not_found");
    expect(result.ok).toBe(false);
    expect(result.count).toBe(0);
    expect(result.rows).toEqual([]);
    expect(result.warnings.join(" ")).toContain("No matching market price rows");
    expect(result.productionApproved).toBe(false);
  });

  it("keeps metadata local/research and exposes adapter-ready PVT input", async () => {
    db.marketPrices.push(
      row({ tradingDate: new Date("2025-01-02"), closePrice: 100, volume: 1000, tradingValue: 100000 }),
      row({ tradingDate: new Date("2025-01-03"), closePrice: 102, volume: 2000, tradingValue: 204000 }),
    );

    const series = await getMarketPriceSeries(params(), { db });
    const pvtInput = toPvtMarketPriceInput(series);

    expect(series.sourceLabel).toBe("vnstock");
    expect(series.dataMode).toBe("research_only");
    expect(series.productionApproved).toBe(false);
    expect(pvtInput).toMatchObject({
      ticker: "FPT",
      sourceName: "vnstock",
      period: "2025-01-03",
      periodType: "day",
      closePrice: 102,
      previousClosePrice: 100,
      volume: 2000,
      avgVolume20d: 1500,
      avgTradingValue20d: 152000,
      productionApproved: false,
    });
  });

  it("does not expose investment recommendation fields", async () => {
    db.marketPrices.push(row());

    const result = await getMarketPriceSeries(params(), { db });
    const output = JSON.stringify(result);

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("rating");
    expect(output).not.toContain("targetPrice");
    expect(output).not.toContain("buySignal");
    expect(output).not.toContain("sellSignal");
    expect(output).not.toContain("holdSignal");
    expect(output).not.toContain("advice");
  });

  it("does not call network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    db.marketPrices.push(row());

    await getMarketPriceSeries(params(), { db });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
