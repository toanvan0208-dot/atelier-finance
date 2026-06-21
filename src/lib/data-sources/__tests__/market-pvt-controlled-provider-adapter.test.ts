import { afterEach, describe, expect, it, vi } from "vitest";

import { loadTechnicalDeskData } from "@/features/technical/lib/load-technical-desk-data";
import {
  normalizeControlledMarketPvtProviderResponse,
  runControlledMarketPvtProviderImport,
  type ControlledMarketPvtProviderResponse,
} from "../market-pvt-controlled-provider-adapter";
import { getMarketPriceSeries } from "../market-price-read-service";
import type { MarketPvtSafeImportDb } from "../market-pvt-safe-import-mvp";

const ENV_KEY = "ATELIER_LOCAL_IMPORTS_ENABLED";
const DATABASE_URL = "file:./phase-103-test.db";
const SOURCE_LABEL = "provider_candidate_phase_103";
const request = { ticker: "FPT", from: "2026-06-01", to: "2026-06-30" };
const EXPANDED_ROW_COUNT = 20;

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

class ProviderImportDb implements MarketPvtSafeImportDb {
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

  async $transaction<T>(fn: (tx: ReturnType<ProviderImportDb["transactionClient"]>) => Promise<T>): Promise<T> {
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

const providerResponse = (
  patch: Partial<ControlledMarketPvtProviderResponse> = {},
): ControlledMarketPvtProviderResponse => ({
  ticker: "FPT",
  asOf: "2026-06-30",
  sourceLabel: SOURCE_LABEL,
  currency: "VND",
  priceUnit: "vnd_per_share",
  volumeUnit: "shares",
  observations: Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 5, index + 1));
    return { date, weekday: date.getUTCDay() };
  })
    .filter(({ weekday }) => weekday !== 0 && weekday !== 6)
    .slice(0, EXPANDED_ROW_COUNT)
    .map(({ date }, index) => ({
      ticker: "FPT",
      tradingDate: date.toISOString().slice(0, 10),
      closePrice: 98000 + index * 500,
      volume: 400000 + index * 10000,
    })),
  ...patch,
});

const runProvider = (
  db: ProviderImportDb,
  response: ControlledMarketPvtProviderResponse = providerResponse(),
  patch: { confirmWrite?: boolean; importRunner?: Parameters<typeof runControlledMarketPvtProviderImport>[0]["importRunner"] } = {},
) =>
  runControlledMarketPvtProviderImport({
    ...request,
    fetcher: async () => response,
    databaseUrl: DATABASE_URL,
    db,
    ...patch,
  });

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe("controlled Market/PVT provider adapter", () => {
  it("normalizes the bounded provider response into the Phase 100/101 candidate shape", () => {
    const normalized = normalizeControlledMarketPvtProviderResponse(request, providerResponse());

    expect(normalized).toMatchObject({
      request,
      asOf: "2026-06-30",
      sourceLabel: SOURCE_LABEL,
      currency: "VND",
      priceUnit: "vnd_per_share",
      volumeUnit: "shares",
      productionApproved: false,
      errors: [],
    });
    expect(normalized.candidateRows).toHaveLength(EXPANDED_ROW_COUNT);
    expect(normalized.candidateRows[0]).toEqual({
      symbol: "FPT",
      timestamp: "2026-06-01",
      close_price: 98000,
      volume_shares: 400000,
    });
    expect(normalized.candidateRows.at(-1)).toEqual({
      symbol: "FPT",
      timestamp: "2026-06-26",
      close_price: 107500,
      volume_shares: 590000,
    });
  });

  it("enforces a single ticker and a bounded date range before calling the provider", async () => {
    const fetcher = vi.fn();

    await expect(
      runControlledMarketPvtProviderImport({
        ticker: "FPT,VCB",
        from: "2026-06-20",
        to: "2026-06-21",
        fetcher,
      }),
    ).rejects.toThrow("controlled_provider_ticker_invalid");
    await expect(
      runControlledMarketPvtProviderImport({
        ticker: "FPT",
        from: "2026-01-01",
        to: "2026-06-21",
        fetcher,
      }),
    ).rejects.toThrow("controlled_provider_date_range_too_large");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails closed when a provider response exceeds the bounded observation count", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    const base = providerResponse();
    const oversized = providerResponse({
      observations: Array.from({ length: 32 }, (_, index) => ({
        ...base.observations[index % base.observations.length],
        tradingDate: `2026-06-${String((index % 30) + 1).padStart(2, "0")}`,
      })),
    });
    const normalized = normalizeControlledMarketPvtProviderResponse(request, oversized);
    const result = await runProvider(db, oversized, { confirmWrite: true });

    expect(normalized.errors).toContain("controlled_provider_observation_count_exceeded");
    expect(normalized.candidateRows.every((row) => row.close_price === null)).toBe(true);
    expect(result.summary).toMatchObject({ validRows: 0, invalidRows: 32, writtenRows: 0 });
    expect(db.prices).toHaveLength(0);
  });

  it("remains dry-run by default and writes zero rows", async () => {
    const db = new ProviderImportDb();
    const result = await runProvider(db);

    expect(result).toMatchObject({ dryRun: true, status: "preview_ready", productionApproved: false });
    expect(result.summary).toMatchObject({
      totalRows: EXPANDED_ROW_COUNT,
      validRows: EXPANDED_ROW_COUNT,
      invalidRows: 0,
      skippedRows: 0,
      writtenRows: 0,
    });
    expect(result.audit).toMatchObject({ dryRun: true, confirmWrite: false, writtenRows: 0 });
    expect(db.prices).toHaveLength(0);
  });

  it.each([undefined, "false", "TRUE"])("blocks confirmed writes when the guard is %s", async (value) => {
    const db = new ProviderImportDb();
    if (value === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = value;

    const result = await runProvider(db, providerResponse(), { confirmWrite: true });

    expect(result.status).toBe("import_rejected");
    expect(result.summary.writtenRows).toBe(0);
    expect(result.summary.errors).toContain("local_imports_disabled");
    expect(result.audit).toMatchObject({ status: "blocked", confirmWrite: true, writtenRows: 0 });
    expect(db.prices).toHaveLength(0);
  });

  it("writes valid provider rows through the existing Phase 101 pipeline only when enabled and confirmed", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    const importRunner = vi.fn(async (input) => {
      const { runMarketPvtSafeImportMvp } = await import("../market-pvt-safe-import-mvp");
      return runMarketPvtSafeImportMvp(input);
    });

    const result = await runProvider(db, providerResponse(), { confirmWrite: true, importRunner });

    expect(importRunner).toHaveBeenCalledWith(
      expect.objectContaining({ confirmWrite: true, databaseUrl: DATABASE_URL, db }),
    );
    expect(result.status).toBe("import_completed");
    expect(result.summary).toMatchObject({
      totalRows: EXPANDED_ROW_COUNT,
      validRows: EXPANDED_ROW_COUNT,
      invalidRows: 0,
      skippedRows: 0,
      writtenRows: EXPANDED_ROW_COUNT,
    });
    expect(result.summary.writtenRows).toBeGreaterThan(2);
    expect(result.audit).toMatchObject({
      confirmWrite: true,
      totalRows: EXPANDED_ROW_COUNT,
      validRows: EXPANDED_ROW_COUNT,
      invalidRows: 0,
      skippedRows: 0,
      writtenRows: EXPANDED_ROW_COUNT,
      productionApproved: false,
    });
    expect(result.acceptedRows.at(-1)).toMatchObject({
      ticker: "FPT",
      period: "2026-06-26",
      sourceLabel: SOURCE_LABEL,
      currency: "VND",
      productionApproved: false,
    });
    expect(result.acceptedRows.at(-1)?.asOf.toISOString()).toContain("2026-06-30");
    expect(result.acceptedRows.at(-1)?.marketUnitMetadata.marketPrice?.unit).toBe("vnd_per_share");
    expect(result.acceptedRows.at(-1)?.marketUnitMetadata.volume?.unit).toBe("shares");
  });

  it("fails closed on missing or invalid provider units", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    const result = await runProvider(
      db,
      providerResponse({ priceUnit: "unknown_unit", volumeUnit: "" }),
      { confirmWrite: true },
    );

    expect(result.status).toBe("import_rejected");
    expect(result.summary).toMatchObject({
      validRows: 0,
      invalidRows: EXPANDED_ROW_COUNT,
      writtenRows: 0,
    });
    expect(result.summary.errors.join(" ")).toContain("marketPrice_unit_invalid");
    expect(result.summary.errors.join(" ")).toContain("volume_unit_missing");
    expect(db.prices).toHaveLength(0);
  });

  it("preserves missing volume as null instead of zero-filling", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    const response = providerResponse({
      volumeUnit: "",
      observations: [
        { ticker: "FPT", tradingDate: "2026-06-21", closePrice: 100000, volume: null },
      ],
    });
    const result = await runProvider(db, response, { confirmWrite: true });

    expect(result.summary.writtenRows).toBe(1);
    expect(db.prices[0].volume).toBeNull();
    expect(db.prices[0].volume).not.toBe(0);
  });

  it("rejects ambiguous provider duplicates and does not overwrite existing rows", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    const duplicate = providerResponse({
      observations: [
        { ticker: "FPT", tradingDate: "2026-06-21", closePrice: 100000, volume: 500000 },
        { ticker: "FPT", tradingDate: "2026-06-21", closePrice: 100000, volume: 500000 },
      ],
    });

    const ambiguous = await runProvider(db, duplicate, { confirmWrite: true });
    expect(ambiguous.summary).toMatchObject({ skippedRows: 2, writtenRows: 0 });
    expect(ambiguous.audit).toMatchObject({ status: "blocked", duplicateSkippedRows: 2 });

    const oneRow = providerResponse({ observations: [providerResponse().observations[0]] });
    const first = await runProvider(db, oneRow, { confirmWrite: true });
    const second = await runProvider(
      db,
      providerResponse({ observations: [{ ...oneRow.observations[0], closePrice: 123456 }] }),
      { confirmWrite: true },
    );
    expect(first.summary.writtenRows).toBe(1);
    expect(second.summary).toMatchObject({ skippedRows: 1, writtenRows: 0 });
    expect(db.prices).toHaveLength(1);
    expect(db.prices[0].closePrice).toBe(98000);
  });

  it("lets Technical/PVT read provider-imported DB rows without sample fallback", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    const imported = await runProvider(db, providerResponse(), { confirmWrite: true });
    expect(imported.summary.writtenRows).toBeGreaterThan(0);

    const technical = await loadTechnicalDeskData(
      { ...request, sourceLabel: SOURCE_LABEL, preferDb: true },
      { readMarketPriceSeries: (params) => getMarketPriceSeries(params, { db }) },
    );

    expect(technical.fallbackUsed).toBe(false);
    expect(technical.source).toMatchObject({
      sourceType: "local_db_manual_import",
      provider: "local_import",
      sourceLabel: SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
    });
    expect(technical.marketDataSource).toMatchObject({ provider: "local_import", productionApproved: false });
    expect(technical.data?.currentPrice).toBe(107500);
    expect(technical.data?.pvtDerivedMetrics?.availableObservations).toBe(EXPANDED_ROW_COUNT);
    expect(JSON.stringify(technical)).not.toContain("sample_fallback");
  });

  it("falls back safely when provider-imported rows lack required unit metadata", async () => {
    process.env[ENV_KEY] = "true";
    const db = new ProviderImportDb();
    await runProvider(db, providerResponse(), { confirmWrite: true });
    db.units = [];

    const technical = await loadTechnicalDeskData(
      { ...request, sourceLabel: SOURCE_LABEL, preferDb: true },
      { readMarketPriceSeries: (params) => getMarketPriceSeries(params, { db }) },
    );

    expect(technical.fallbackUsed).toBe(true);
    expect(technical.source).toMatchObject({ sourceType: "sample_static_fallback", productionApproved: false });
    expect(technical.warnings.join(" ")).toContain("unit metadata checks");
  });

  it("does not introduce approval, advisory, or trading-signal claims", async () => {
    const result = await runProvider(new ProviderImportDb());
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
