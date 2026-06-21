import { afterEach, describe, expect, it, vi } from "vitest";

import { loadTechnicalDeskData } from "@/features/technical/lib/load-technical-desk-data";
import {
  runMarketPvtExternalFetchTrial,
  type ExternalMarketCandidateRow,
} from "../market-pvt-external-fetch-trial";
import { getMarketPriceSeries } from "../market-price-read-service";
import type { MarketPvtSafeImportDb } from "../market-pvt-safe-import-mvp";

const ENV_KEY = "ATELIER_LOCAL_IMPORTS_ENABLED";
const LOCAL_DATABASE_URL = "file:./phase-101-test.db";

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

class Phase101Db implements MarketPvtSafeImportDb {
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

  async $transaction<T>(fn: (tx: ReturnType<Phase101Db["transactionClient"]>) => Promise<T>): Promise<T> {
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

const rows = (ticker: string): ExternalMarketCandidateRow[] => [
  { symbol: ticker, timestamp: "2026-06-20", close_price: 98000, volume_shares: 400000 },
  { symbol: ticker, timestamp: "2026-06-21", close_price: 100000, volume_shares: 500000 },
];

const runConfirmed = (db: Phase101Db, patch: Record<string, unknown> = {}) =>
  runMarketPvtExternalFetchTrial({
    ticker: "FPT",
    fetcher: async (ticker) => rows(ticker),
    sourceLabel: "controlled_external_test",
    asOf: "2026-06-21",
    confirmWrite: true,
    databaseUrl: LOCAL_DATABASE_URL,
    db,
    ...patch,
  });

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe("Market/PVT controlled external fetch", () => {
  it("remains a zero-write dry run by default", async () => {
    const db = new Phase101Db();
    const result = await runMarketPvtExternalFetchTrial({
      ticker: "FPT",
      fetcher: async (ticker) => rows(ticker),
      sourceLabel: "controlled_external_test",
      asOf: "2026-06-21",
      databaseUrl: LOCAL_DATABASE_URL,
      db,
    });

    expect(result).toMatchObject({ dryRun: true, status: "preview_ready", productionApproved: false });
    expect(result.summary).toMatchObject({ validRows: 2, writtenRows: 0 });
    expect(result.audit.confirmWrite).toBe(false);
    expect(db.prices).toHaveLength(0);
  });

  it.each([undefined, "false", "TRUE", "yes"])(
    "blocks confirmed writes when the Phase 99 guard value is %s",
    async (guardValue) => {
      const db = new Phase101Db();
      if (guardValue === undefined) delete process.env[ENV_KEY];
      else process.env[ENV_KEY] = guardValue;

      const result = await runConfirmed(db);

      expect(result.status).toBe("import_rejected");
      expect(result.summary.writtenRows).toBe(0);
      expect(result.summary.errors).toContain("local_imports_disabled");
      expect(result.audit).toMatchObject({ confirmWrite: true, status: "blocked", writtenRows: 0 });
      expect(db.prices).toHaveLength(0);
    },
  );

  it('delegates confirmed writes to the Phase 96 pipeline only when the guard is exactly "true"', async () => {
    process.env[ENV_KEY] = "true";
    const db = new Phase101Db();
    const importRunner = vi.fn(async (input) => {
      const { runMarketPvtSafeImportMvp } = await import("../market-pvt-safe-import-mvp");
      return runMarketPvtSafeImportMvp(input);
    });

    const result = await runConfirmed(db, { importRunner });

    expect(importRunner).toHaveBeenCalledOnce();
    expect(importRunner).toHaveBeenCalledWith(
      expect.objectContaining({ confirmWrite: true, databaseUrl: LOCAL_DATABASE_URL, db }),
    );
    expect(result.summary.writtenRows).toBe(2);
  });

  it("writes valid rows with preserved provenance and audit metadata", async () => {
    process.env[ENV_KEY] = "true";
    const db = new Phase101Db();
    const result = await runConfirmed(db);

    expect(result.status).toBe("import_completed");
    expect(result.summary).toMatchObject({ validRows: 2, invalidRows: 0, skippedRows: 0, writtenRows: 2 });
    expect(result.audit).toMatchObject({ writtenRows: 2, productionApproved: false });
    expect(result.acceptedRows[1]).toMatchObject({
      ticker: "FPT",
      period: "2026-06-21",
      sourceLabel: "controlled_external_test",
      currency: "VND",
      productionApproved: false,
    });
    expect(result.acceptedRows[1].asOf.toISOString()).toContain("2026-06-21");
    expect(result.acceptedRows[1].marketUnitMetadata.marketPrice?.unit).toBe("vnd_per_share");
    expect(result.acceptedRows[1].marketUnitMetadata.volume?.unit).toBe("shares");
    expect(db.prices[1].tradingDate.toISOString()).toContain("2026-06-21");
  });

  it("fails closed on missing or invalid units and writes no rows", async () => {
    process.env[ENV_KEY] = "true";
    const db = new Phase101Db();
    const result = await runConfirmed(db, { priceUnit: "unknown_unit", volumeUnit: "" });

    expect(result.status).toBe("import_rejected");
    expect(result.summary).toMatchObject({ validRows: 0, invalidRows: 2, writtenRows: 0 });
    expect(result.summary.errors.join(" ")).toContain("marketPrice_unit_invalid");
    expect(result.summary.errors.join(" ")).toContain("volume_unit_missing");
    expect(result.audit.safetyFlags.missingUnitFailsClosed).toBe(true);
    expect(db.prices).toHaveLength(0);
  });

  it("rejects ambiguous duplicates and never overwrites an existing row", async () => {
    process.env[ENV_KEY] = "true";
    const db = new Phase101Db();
    const duplicateFetcher = async (ticker: string) => [rows(ticker)[0], rows(ticker)[0]];

    const ambiguous = await runConfirmed(db, { fetcher: duplicateFetcher });
    expect(ambiguous.summary).toMatchObject({ writtenRows: 0, skippedRows: 2 });
    expect(ambiguous.audit).toMatchObject({ status: "blocked", duplicateSkippedRows: 2 });

    const first = await runConfirmed(db, { fetcher: async (ticker: string) => [rows(ticker)[0]] });
    const second = await runConfirmed(db, {
      fetcher: async (ticker: string) => [{ ...rows(ticker)[0], close_price: 123456 }],
    });
    expect(first.summary.writtenRows).toBe(1);
    expect(second.summary).toMatchObject({ writtenRows: 0, skippedRows: 1 });
    expect(db.prices).toHaveLength(1);
    expect(db.prices[0].closePrice).toBe(98000);
  });

  it("makes written rows available to the existing Technical/PVT DB-backed read path", async () => {
    process.env[ENV_KEY] = "true";
    const db = new Phase101Db();
    const imported = await runConfirmed(db);
    expect(imported.summary.writtenRows).toBeGreaterThan(0);

    const result = await loadTechnicalDeskData(
      {
        ticker: "FPT",
        from: "2026-06-20",
        to: "2026-06-21",
        sourceLabel: "controlled_external_test",
        preferDb: true,
      },
      {
        readMarketPriceSeries: (params) => getMarketPriceSeries(params, { db }),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.source).toMatchObject({
      sourceType: "local_db_manual_import",
      provider: "local_import",
      sourceLabel: "controlled_external_test",
      dataMode: "research_only",
      productionApproved: false,
    });
    expect(result.data?.ticker).toBe("FPT");
    expect(result.data?.currentPrice).toBe(100000);
    expect(JSON.stringify(result)).not.toContain("sample_fallback");
  });

  it("falls back safely when DB rows lack required unit metadata", async () => {
    process.env[ENV_KEY] = "true";
    const db = new Phase101Db();
    await runConfirmed(db);
    db.units = [];

    const result = await loadTechnicalDeskData(
      {
        ticker: "FPT",
        from: "2026-06-20",
        to: "2026-06-21",
        sourceLabel: "controlled_external_test",
        preferDb: true,
      },
      { readMarketPriceSeries: (params) => getMarketPriceSeries(params, { db }) },
    );

    expect(result.fallbackUsed).toBe(true);
    expect(result.source).toMatchObject({ sourceType: "sample_static_fallback", productionApproved: false });
    expect(result.warnings.join(" ")).toContain("unit metadata checks");
  });

  it("does not introduce approval, advisory, or trading-signal claims", async () => {
    const result = await runMarketPvtExternalFetchTrial({
      ticker: "FPT",
      fetcher: async (ticker) => rows(ticker),
      asOf: "2026-06-21",
    });
    const output = JSON.stringify(result).toLowerCase();

    for (const phrase of [
      "recommendation",
      "target price",
      "fair value",
      "production-ready",
      "official source",
      "realtime data",
      "buy signal",
      "sell signal",
    ]) {
      expect(output).not.toContain(phrase);
    }
  });
});
