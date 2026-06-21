import { afterEach, describe, expect, it, vi } from "vitest";

import { loadTechnicalDeskData } from "@/features/technical/lib/load-technical-desk-data";
import { getMarketPriceSeries } from "../market-price-read-service";
import type { MarketPvtSafeImportDb } from "../market-pvt-safe-import-mvp";
import {
  CONTROLLED_VNSTOCK_TICKERS,
  normalizeVnstockHistoryResponse,
  runControlledVnstockMarketPvtIngestion,
  VNSTOCK_RESEARCH_SOURCE_LABEL,
  type RawVnstockHistoryRow,
  type RunControlledVnstockMarketPvtOptions,
} from "../vnstock-market-pvt-controlled-ingestion";

const ENV_KEY = "ATELIER_LOCAL_IMPORTS_ENABLED";
const DATABASE_URL = "file:./phase-104-test.db";
const request = { ticker: "FPT", from: "2025-06-02", to: "2025-06-30" };
const ROW_COUNT = 20;

type StoredPrice = {
  id: string;
  ticker: string;
  tradingDate: Date;
  closePrice: number;
  volume: number | null;
  tradingValue: number | null;
  sourceId: string;
  sourceLabel: string;
  dataMode: string;
  asOf: Date;
  collectedAt: Date;
};

type StoredUnit = {
  marketPriceId: string;
  field: string;
  unit: string;
  status: string;
  source: string;
  sourceLabel: string;
  dataMode: string;
  asOf: Date;
  warningCodes: string;
  productionApproved: boolean;
};

class VnstockImportDb implements MarketPvtSafeImportDb {
  dataSources: Array<{ id: string; name: string; sourceType: string }> = [];
  companies: Array<{ id: string; ticker: string }> = [];
  prices: StoredPrice[] = [];
  units: StoredUnit[] = [];

  marketPrice = {
    findMany: async (args: unknown) => {
      const input = args as {
        where: {
          ticker: string;
          tradingDate: { gte: Date; lte: Date };
          dataMode: string;
          sourceLabel: string;
        };
      };
      return this.prices
        .filter(
          (price) =>
            price.ticker === input.where.ticker &&
            price.dataMode === input.where.dataMode &&
            price.sourceLabel === input.where.sourceLabel &&
            price.tradingDate >= input.where.tradingDate.gte &&
            price.tradingDate <= input.where.tradingDate.lte,
        )
        .sort((left, right) => left.tradingDate.getTime() - right.tradingDate.getTime())
        .map((price) => ({
          ...price,
          openPrice: null,
          highPrice: null,
          lowPrice: null,
          marketCap: null,
          unitMetadata: this.units.filter((unit) => unit.marketPriceId === price.id),
        }));
    },
  };

  async $transaction<T>(fn: (tx: ReturnType<VnstockImportDb["transactionClient"]>) => Promise<T>): Promise<T> {
    return fn(this.transactionClient());
  }

  private transactionClient() {
    return {
      dataSource: {
        upsert: async (args: unknown) => {
          const input = args as { where: { name_sourceType: { name: string; sourceType: string } } };
          const key = input.where.name_sourceType;
          const existing = this.dataSources.find(
            (source) => source.name === key.name && source.sourceType === key.sourceType,
          );
          if (existing) return existing;
          const created = { id: `source-${this.dataSources.length + 1}`, ...key };
          this.dataSources.push(created);
          return created;
        },
      },
      company: {
        findFirst: async (args: unknown) => {
          const input = args as { where: { ticker: string } };
          return this.companies.find((company) => company.ticker === input.where.ticker) ?? null;
        },
        create: async (args: unknown) => {
          const input = args as { data: { ticker: string } };
          const created = { id: `company-${this.companies.length + 1}`, ticker: input.data.ticker };
          this.companies.push(created);
          return created;
        },
      },
      marketPrice: {
        findFirst: async (args: unknown) => {
          const input = args as {
            where: { ticker: string; tradingDate: Date; sourceId: string; dataMode: string };
          };
          return this.prices.find(
            (price) =>
              price.ticker === input.where.ticker &&
              price.sourceId === input.where.sourceId &&
              price.dataMode === input.where.dataMode &&
              price.tradingDate.getTime() === input.where.tradingDate.getTime(),
          ) ?? null;
        },
        create: async (args: unknown) => {
          const input = args as { data: Omit<StoredPrice, "id"> };
          const created = { id: `price-${this.prices.length + 1}`, ...input.data };
          this.prices.push(created);
          return { id: created.id };
        },
      },
      marketPriceUnitMetadata: {
        upsert: async (args: unknown) => {
          const input = args as { create: StoredUnit };
          this.units.push(input.create);
          return input.create;
        },
      },
    };
  }
}

const vnstockRows = (): RawVnstockHistoryRow[] =>
  Array.from({ length: 29 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 5, index + 2));
    return { date, weekday: date.getUTCDay() };
  })
    .filter(({ weekday }) => weekday !== 0 && weekday !== 6)
    .slice(0, ROW_COUNT)
    .map(({ date }, index) => ({
      ticker: "FPT",
      time: `${date.toISOString().slice(0, 10)}T00:00:00.000`,
      close: 98 + index * 0.5,
      volume: 2_000_000 + index * 10_000,
    }));

const runVnstock = (
  db: VnstockImportDb,
  rows: RawVnstockHistoryRow[] = vnstockRows(),
  patch: Partial<RunControlledVnstockMarketPvtOptions> = {},
) =>
  runControlledVnstockMarketPvtIngestion({
    ...request,
    allowNetwork: true,
    fetchHistory: async () => rows,
    databaseUrl: DATABASE_URL,
    db,
    ...patch,
  });

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe("controlled VNStock Market/PVT ingestion", () => {
  it("normalizes VNStock history rows with explicit units and transparent source metadata", () => {
    const normalized = normalizeVnstockHistoryResponse(request, vnstockRows());

    expect(CONTROLLED_VNSTOCK_TICKERS).toEqual(["FPT", "MWG", "VNM"]);
    expect(normalized).toMatchObject({
      ticker: "FPT",
      asOf: "2025-06-30",
      sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL,
      currency: "VND",
      priceUnit: "vnd_per_share",
      volumeUnit: "shares",
    });
    expect(normalized.observations).toHaveLength(ROW_COUNT);
    expect(normalized.observations[0]).toEqual({
      ticker: "FPT",
      tradingDate: "2025-06-02",
      closePrice: 98000,
      volume: 2_000_000,
    });
  });

  it("requires explicit network opt-in and rejects tickers outside the small allowlist", async () => {
    const fetchHistory = vi.fn();

    await expect(
      runControlledVnstockMarketPvtIngestion({ ...request, fetchHistory }),
    ).rejects.toThrow("controlled_vnstock_network_not_enabled");
    await expect(
      runControlledVnstockMarketPvtIngestion({
        ...request,
        ticker: "VCB",
        allowNetwork: true,
        fetchHistory,
      }),
    ).rejects.toThrow("controlled_vnstock_ticker_not_allowed");
    expect(fetchHistory).not.toHaveBeenCalled();
  });

  it("remains dry-run by default and writes zero rows", async () => {
    const db = new VnstockImportDb();
    const result = await runVnstock(db);

    expect(result).toMatchObject({ dryRun: true, status: "preview_ready", productionApproved: false });
    expect(result.summary).toMatchObject({
      totalRows: ROW_COUNT,
      validRows: ROW_COUNT,
      invalidRows: 0,
      skippedRows: 0,
      writtenRows: 0,
    });
    expect(result.audit).toMatchObject({ dryRun: true, confirmWrite: false, writtenRows: 0 });
    expect(db.prices).toHaveLength(0);
  });

  it.each([undefined, "false", "TRUE"])("blocks confirmed writes when the local import guard is %s", async (value) => {
    const db = new VnstockImportDb();
    if (value === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = value;

    const result = await runVnstock(db, vnstockRows(), { confirmWrite: true });

    expect(result.status).toBe("import_rejected");
    expect(result.summary.writtenRows).toBe(0);
    expect(result.summary.errors).toContain("local_imports_disabled");
    expect(result.audit).toMatchObject({ status: "blocked", confirmWrite: true, writtenRows: 0 });
    expect(db.prices).toHaveLength(0);
  });

  it("writes 20 VNStock-normalized rows through the existing safe import pipeline", async () => {
    process.env[ENV_KEY] = "true";
    const db = new VnstockImportDb();
    const importRunner = vi.fn(async (input) => {
      const { runMarketPvtSafeImportMvp } = await import("../market-pvt-safe-import-mvp");
      return runMarketPvtSafeImportMvp(input);
    });

    const result = await runVnstock(db, vnstockRows(), { confirmWrite: true, importRunner });

    expect(importRunner).toHaveBeenCalledWith(
      expect.objectContaining({ confirmWrite: true, databaseUrl: DATABASE_URL, db }),
    );
    expect(result.summary).toMatchObject({
      totalRows: ROW_COUNT,
      validRows: ROW_COUNT,
      invalidRows: 0,
      skippedRows: 0,
      writtenRows: ROW_COUNT,
    });
    expect(result.summary.writtenRows).toBeGreaterThan(0);
    expect(result.audit).toMatchObject({
      confirmWrite: true,
      writtenRows: ROW_COUNT,
      productionApproved: false,
    });
    expect(result.acceptedRows[0]).toMatchObject({
      ticker: "FPT",
      period: "2025-06-02",
      closePrice: 98000,
      volume: 2_000_000,
      sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL,
      currency: "VND",
      productionApproved: false,
    });
    expect(result.acceptedRows[0].asOf.toISOString()).toContain("2025-06-30");
  });

  it("fails closed when explicit VNStock unit metadata is missing or invalid", async () => {
    process.env[ENV_KEY] = "true";
    const db = new VnstockImportDb();
    const result = await runVnstock(db, vnstockRows(), {
      confirmWrite: true,
      unitMetadata: { currency: "VND", priceUnit: "unknown_unit", volumeUnit: "" },
    });

    expect(result.status).toBe("import_rejected");
    expect(result.summary).toMatchObject({ validRows: 0, invalidRows: ROW_COUNT, writtenRows: 0 });
    expect(result.summary.errors.join(" ")).toContain("marketPrice_unit_invalid");
    expect(result.summary.errors.join(" ")).toContain("volume_unit_missing");
    expect(db.prices).toHaveLength(0);
  });

  it("preserves missing VNStock volume as null instead of zero-filling", async () => {
    process.env[ENV_KEY] = "true";
    const db = new VnstockImportDb();
    const row = { ...vnstockRows()[0], volume: null };
    const result = await runVnstock(db, [row], {
      confirmWrite: true,
      unitMetadata: { currency: "VND", priceUnit: "vnd_per_share", volumeUnit: "" },
    });

    expect(result.summary.writtenRows).toBe(1);
    expect(db.prices[0].volume).toBeNull();
    expect(db.prices[0].volume).not.toBe(0);
  });

  it("rejects ambiguous duplicates and does not overwrite an existing VNStock row", async () => {
    process.env[ENV_KEY] = "true";
    const db = new VnstockImportDb();
    const row = vnstockRows()[0];

    const ambiguous = await runVnstock(db, [row, row], { confirmWrite: true });
    expect(ambiguous.summary).toMatchObject({ skippedRows: 2, writtenRows: 0 });

    const first = await runVnstock(db, [row], { confirmWrite: true });
    const second = await runVnstock(db, [{ ...row, close: 123.456 }], { confirmWrite: true });
    expect(first.summary.writtenRows).toBe(1);
    expect(second.summary).toMatchObject({ skippedRows: 1, writtenRows: 0 });
    expect(db.prices).toHaveLength(1);
    expect(db.prices[0].closePrice).toBe(98000);
  });

  it("lets Technical/PVT read VNStock-normalized FPT rows without mixing another ticker", async () => {
    process.env[ENV_KEY] = "true";
    const db = new VnstockImportDb();
    const imported = await runVnstock(db, vnstockRows(), { confirmWrite: true });
    expect(imported.summary.writtenRows).toBe(ROW_COUNT);

    const readMarketPriceSeries = (params: Parameters<typeof getMarketPriceSeries>[0]) =>
      getMarketPriceSeries(params, { db });
    const fpt = await loadTechnicalDeskData(
      { ...request, sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL, preferDb: true },
      { readMarketPriceSeries },
    );
    const mwg = await loadTechnicalDeskData(
      { ...request, ticker: "MWG", sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL, preferDb: true },
      { readMarketPriceSeries },
    );

    expect(fpt.fallbackUsed).toBe(false);
    expect(fpt.source).toMatchObject({
      provider: "vnstock",
      sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
    });
    expect(fpt.data?.ticker).toBe("FPT");
    expect(fpt.data?.pvtDerivedMetrics?.availableObservations).toBe(ROW_COUNT);
    expect(JSON.stringify(fpt)).not.toContain("sample_fallback");
    expect(mwg.fallbackUsed).toBe(true);
    expect(mwg.source).toMatchObject({ sourceType: "sample_static_fallback", productionApproved: false });
  });

  it("falls back safely when VNStock-normalized rows lack required unit metadata", async () => {
    process.env[ENV_KEY] = "true";
    const db = new VnstockImportDb();
    await runVnstock(db, vnstockRows(), { confirmWrite: true });
    db.units = [];

    const technical = await loadTechnicalDeskData(
      { ...request, sourceLabel: VNSTOCK_RESEARCH_SOURCE_LABEL, preferDb: true },
      { readMarketPriceSeries: (params) => getMarketPriceSeries(params, { db }) },
    );

    expect(technical.fallbackUsed).toBe(true);
    expect(technical.warnings.join(" ")).toContain("unit metadata checks");
  });

  it("does not introduce source approval, advisory, or trading-signal claims", async () => {
    const result = await runVnstock(new VnstockImportDb());
    const output = JSON.stringify(result).toLowerCase();

    for (const phrase of [
      "recommendation",
      "target price",
      "fair value",
      "production-ready",
      "official source",
      "realtime data",
      "source approved",
      "buy signal",
      "sell signal",
    ]) {
      expect(output).not.toContain(phrase);
    }
  });
});
