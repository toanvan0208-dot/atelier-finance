import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  persistVnstockResearchMarketPrices,
  VNSTOCK_RESEARCH_SOURCE_POLICY,
  type VnstockResearchMarketPriceRecord,
} from "../index";
import type { VnstockMarketPricePersistenceDb } from "../vnstock-market-price-persistence";

type StoredSource = { id: string; name: string; sourceType: string };
type StoredCompany = { id: string; ticker: string; dataMode?: string };
type StoredMarketPrice = {
  id: string;
  ticker: string;
  tradingDate: Date;
  sourceId: string;
  sourceType?: string;
  dataMode?: string;
  openPrice?: number | null;
  highPrice?: number | null;
  lowPrice?: number | null;
  closePrice?: number | null;
  volume?: number | null;
  tradingValue?: number | null;
};

const sameDay = (left: Date, right: Date): boolean => left.toISOString() === right.toISOString();

class FakePersistenceDb implements VnstockMarketPricePersistenceDb {
  sources: StoredSource[] = [];
  companies: StoredCompany[] = [];
  marketPrices: StoredMarketPrice[] = [];
  transactionCalls = 0;

  async $transaction<T>(fn: (tx: VnstockMarketPricePersistenceDbTransaction) => Promise<T>): Promise<T> {
    this.transactionCalls += 1;
    return fn(this.tx());
  }

  private tx(): VnstockMarketPricePersistenceDbTransaction {
    return {
      dataSource: {
        upsert: async (args) => {
          const input = args as {
            where: { name_sourceType: { name: string; sourceType: string } };
            create: { name: string; sourceType: string };
          };
          const existing = this.sources.find(
            (source) =>
              source.name === input.where.name_sourceType.name &&
              source.sourceType === input.where.name_sourceType.sourceType,
          );
          if (existing) return existing;

          const source = {
            id: `source-${this.sources.length + 1}`,
            name: input.create.name,
            sourceType: input.create.sourceType,
          };
          this.sources.push(source);
          return source;
        },
      },
      company: {
        findFirst: async (args) => {
          const input = args as { where: { ticker: string } };
          return this.companies.find((company) => company.ticker === input.where.ticker) ?? null;
        },
        create: async (args) => {
          const input = args as { data: { ticker: string; dataMode?: string } };
          const company = {
            id: `company-${this.companies.length + 1}`,
            ticker: input.data.ticker,
            dataMode: input.data.dataMode,
          };
          this.companies.push(company);
          return company;
        },
      },
      marketPrice: {
        findFirst: async (args) => {
          const input = args as {
            where: {
              ticker: string;
              tradingDate: Date;
              sourceId?: string;
              dataMode?: string;
            };
          };
          return (
            this.marketPrices.find((price) => {
              if (price.ticker !== input.where.ticker) return false;
              if (!sameDay(price.tradingDate, input.where.tradingDate)) return false;
              if (input.where.sourceId && price.sourceId !== input.where.sourceId) return false;
              if (input.where.dataMode && price.dataMode !== input.where.dataMode) return false;
              return true;
            }) ?? null
          );
        },
        create: async (args) => {
          const input = args as { data: Omit<StoredMarketPrice, "id"> };
          this.marketPrices.push({
            id: `price-${this.marketPrices.length + 1}`,
            ...input.data,
          });
        },
        update: async (args) => {
          const input = args as { where: { id: string }; data: Partial<StoredMarketPrice> };
          const index = this.marketPrices.findIndex((price) => price.id === input.where.id);
          if (index >= 0) {
            this.marketPrices[index] = { ...this.marketPrices[index], ...input.data };
          }
        },
      },
    };
  }
}

type VnstockMarketPricePersistenceDbTransaction = Parameters<
  VnstockMarketPricePersistenceDb["$transaction"]
>[0] extends (tx: infer Tx) => Promise<unknown>
  ? Tx
  : never;

const normalizedRecord = (
  patch: Partial<VnstockResearchMarketPriceRecord> = {},
): VnstockResearchMarketPriceRecord => ({
  ticker: "FPT",
  date: "2026-06-19",
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  volume: 1000,
  tradingValue: 105000,
  sourceProvider: "vnstock",
  sourceTool: "vnstock",
  sourceType: "third_party_tool",
  usageScope: "academic_non_commercial",
  productionApproved: false,
  asOf: "2026-06-19",
  retrievedAt: "2026-06-19T08:00:00.000Z",
  attribution: "Data access supported by Vnstock for academic/local research validation.",
  warnings: [],
  ...patch,
});

describe("vnstock market price persistence", () => {
  let db: FakePersistenceDb;

  beforeEach(() => {
    db = new FakePersistenceDb();
  });

  it("rejects missing source metadata without writing", async () => {
    const result = await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord()],
        sourceMetadata: null,
      },
      { db },
    );

    expect(result.insertedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings.join(" ")).toContain("source metadata is missing or unsafe");
    expect(db.transactionCalls).toBe(0);
    expect(db.marketPrices).toEqual([]);
  });

  it("rejects unsafe production approval metadata", async () => {
    const result = await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord()],
        sourceMetadata: {
          ...VNSTOCK_RESEARCH_SOURCE_POLICY,
          productionApproved: true,
        } as unknown as typeof VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db },
    );

    expect(result.insertedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.productionApproved).toBe(false);
    expect(db.marketPrices).toEqual([]);
  });

  it("persists normalized market price records only", async () => {
    const result = await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord()],
        sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db },
    );

    expect(result.insertedCount).toBe(1);
    expect(result.updatedCount).toBe(0);
    expect(result.rejectedCount).toBe(0);
    expect(result.sourceMetadata?.provider).toBe("vnstock");
    expect(result.productionApproved).toBe(false);
    expect(db.marketPrices).toHaveLength(1);
    expect(db.marketPrices[0]).toMatchObject({
      ticker: "FPT",
      openPrice: 100,
      highPrice: 110,
      lowPrice: 95,
      closePrice: 105,
      volume: 1000,
      tradingValue: 105000,
      dataMode: "research_only",
    });
  });

  it("keeps missing numeric fields null", async () => {
    await persistVnstockResearchMarketPrices(
      {
        records: [
          normalizedRecord({
            open: null,
            high: null,
            low: null,
            close: null,
            volume: null,
            tradingValue: null,
          }),
        ],
        sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db },
    );

    expect(db.marketPrices[0]).toMatchObject({
      openPrice: null,
      highPrice: null,
      lowPrice: null,
      closePrice: null,
      volume: null,
      tradingValue: null,
    });
    expect(db.marketPrices[0].closePrice).not.toBe(0);
  });

  it("handles duplicates with an explicit skip report", async () => {
    const input = {
      records: [normalizedRecord()],
      sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
    };

    const first = await persistVnstockResearchMarketPrices(input, { db });
    const second = await persistVnstockResearchMarketPrices(input, { db });

    expect(first.insertedCount).toBe(1);
    expect(second.insertedCount).toBe(0);
    expect(second.skippedCount).toBe(1);
    expect(second.warnings.join(" ")).toContain("was skipped");
    expect(db.marketPrices).toHaveLength(1);
  });

  it("can update duplicates only when explicitly requested", async () => {
    await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord({ close: 105 })],
        sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db },
    );

    const result = await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord({ close: 106 })],
        sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db, duplicatePolicy: "update" },
    );

    expect(result.updatedCount).toBe(1);
    expect(db.marketPrices).toHaveLength(1);
    expect(db.marketPrices[0].closePrice).toBe(106);
  });

  it("does not overwrite user or manual data silently", async () => {
    db.companies.push({ id: "manual-company", ticker: "FPT", dataMode: "user_input" });
    db.marketPrices.push({
      id: "manual-price",
      ticker: "FPT",
      tradingDate: new Date("2026-06-19"),
      sourceId: "manual-source",
      sourceType: "user_input",
      dataMode: "user_input",
      closePrice: 99,
    });

    const result = await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord({ close: 105 })],
        sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db },
    );

    expect(result.insertedCount).toBe(1);
    expect(result.warnings.join(" ")).toContain("left unchanged");
    expect(db.marketPrices.find((price) => price.id === "manual-price")?.closePrice).toBe(99);
    expect(db.marketPrices).toHaveLength(2);
  });

  it("does not call network or accept a fetcher", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await persistVnstockResearchMarketPrices(
      {
        records: [normalizedRecord()],
        sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      },
      { db },
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
