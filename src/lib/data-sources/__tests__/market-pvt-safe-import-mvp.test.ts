import { describe, expect, it } from "vitest";

import { runMarketPvtSafeImportMvp, type MarketPvtSafeImportDb } from "../market-pvt-safe-import-mvp";

type StoredMarketPrice = {
  id: string;
  ticker: string;
  tradingDate: Date;
  closePrice: number;
  volume: number | null;
  tradingValue: number | null;
  sourceId: string;
  sourceLabel: string;
  dataMode: string;
};

type StoredUnitMetadata = {
  marketPriceId: string;
  field: string;
  unit: string;
  status: string;
  productionApproved: boolean;
};

class FakeMarketPvtImportDb implements MarketPvtSafeImportDb {
  dataSources: Array<{ id: string; name: string; sourceType: string }> = [];
  companies: Array<{ id: string; ticker: string }> = [];
  marketPrices: StoredMarketPrice[] = [];
  unitMetadata: StoredUnitMetadata[] = [];

  async $transaction<T>(fn: (tx: ReturnType<FakeMarketPvtImportDb["tx"]>) => Promise<T>): Promise<T> {
    return fn(this.tx());
  }

  tx() {
    return {
      dataSource: {
        upsert: async (args: unknown) => {
          const input = args as { where: { name_sourceType: { name: string; sourceType: string } } };
          const found = this.dataSources.find(
            (source) =>
              source.name === input.where.name_sourceType.name &&
              source.sourceType === input.where.name_sourceType.sourceType,
          );
          if (found) return found;
          const created = {
            id: `source-${this.dataSources.length + 1}`,
            name: input.where.name_sourceType.name,
            sourceType: input.where.name_sourceType.sourceType,
          };
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
          return (
            this.marketPrices.find(
              (price) =>
                price.ticker === input.where.ticker &&
                price.sourceId === input.where.sourceId &&
                price.dataMode === input.where.dataMode &&
                price.tradingDate.getTime() === input.where.tradingDate.getTime(),
            ) ?? null
          );
        },
        create: async (args: unknown) => {
          const input = args as {
            data: {
              ticker: string;
              tradingDate: Date;
              closePrice: number;
              volume: number | null;
              tradingValue: number | null;
              sourceId: string;
              sourceLabel: string;
              dataMode: string;
            };
          };
          const created = { id: `price-${this.marketPrices.length + 1}`, ...input.data };
          this.marketPrices.push(created);
          return { id: created.id };
        },
      },
      marketPriceUnitMetadata: {
        upsert: async (args: unknown) => {
          const input = args as {
            where: { marketPriceId_field: { marketPriceId: string; field: string } };
            create: StoredUnitMetadata;
            update: StoredUnitMetadata;
          };
          const index = this.unitMetadata.findIndex(
            (metadata) =>
              metadata.marketPriceId === input.where.marketPriceId_field.marketPriceId &&
              metadata.field === input.where.marketPriceId_field.field,
          );
          if (index >= 0) {
            this.unitMetadata[index] = { ...this.unitMetadata[index], ...input.update };
            return this.unitMetadata[index];
          }
          this.unitMetadata.push(input.create);
          return input.create;
        },
      },
    };
  }
}

const validCsv = [
  "ticker,tradingDate,closePrice,volume,tradingValue,currency,priceUnit,volumeUnit,tradingValueUnit,source,asOf",
  " fpt ,2026-06-19,105.5,1000,105500,VND,vnd_per_share,shares,vnd,local_research_csv,2026-06-19",
].join("\n");

describe("Market/PVT safe import MVP", () => {
  it("previews valid and invalid rows without writing during dry-run", async () => {
    const db = new FakeMarketPvtImportDb();
    const csv = [
      validCsv,
      "VCB,2026-06-19,0,1000,100000,VND,vnd_per_share,shares,vnd,local_research_csv,2026-06-19",
    ].join("\n");

    const result = await runMarketPvtSafeImportMvp({ csvText: csv, db, dryRun: true });

    expect(result.status).toBe("preview_ready");
    expect(result.summary).toMatchObject({
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      writtenRows: 0,
      skippedRows: 0,
      dryRun: true,
    });
    expect(db.marketPrices).toHaveLength(0);
    expect(result.productionApproved).toBe(false);
  });

  it("confirmed import writes only valid rows and keeps local data productionApproved:false", async () => {
    const db = new FakeMarketPvtImportDb();
    const csv = [
      validCsv,
      "VCB,2026-06-19,-1,1000,100000,VND,vnd_per_share,shares,vnd,local_research_csv,2026-06-19",
    ].join("\n");

    const result = await runMarketPvtSafeImportMvp({
      confirmWrite: true,
      csvText: csv,
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(result.status).toBe("import_completed");
    expect(result.summary.writtenRows).toBe(1);
    expect(result.summary.invalidRows).toBe(1);
    expect(db.marketPrices).toHaveLength(1);
    expect(db.marketPrices[0]).toMatchObject({
      ticker: "FPT",
      closePrice: 105.5,
      volume: 1000,
      tradingValue: 105500,
      dataMode: "research_only",
    });
    expect(db.unitMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "marketPrice",
          unit: "vnd_per_share",
          status: "ready",
          productionApproved: false,
        }),
        expect.objectContaining({
          field: "volume",
          unit: "shares",
          status: "ready",
          productionApproved: false,
        }),
      ]),
    );
    expect(result.productionApproved).toBe(false);
    expect(result.sourceApprovalCreated).toBe(false);
  });

  it("fails closed when required unit metadata is missing or invalid", async () => {
    const db = new FakeMarketPvtImportDb();
    const csv = [
      "ticker,tradingDate,closePrice,volume,tradingValue,currency,priceUnit,volumeUnit,tradingValueUnit,source",
      "FPT,2026-06-19,105,1000,105000,VND,,shares,vnd,local_research_csv",
      "FPT,2026-06-20,106,1000,106000,VND,million_vnd,shares,vnd,local_research_csv",
    ].join("\n");

    const result = await runMarketPvtSafeImportMvp({
      confirmWrite: true,
      csvText: csv,
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(result.status).toBe("import_rejected");
    expect(result.summary.validRows).toBe(0);
    expect(result.summary.invalidRows).toBe(2);
    expect(result.summary.errors.join(" ")).toContain("marketPrice_unit_missing");
    expect(result.summary.errors.join(" ")).toContain("marketPrice_unit_invalid");
    expect(db.marketPrices).toHaveLength(0);
  });

  it("preserves missing optional numeric fields as null instead of zero-filling", async () => {
    const db = new FakeMarketPvtImportDb();
    const csv = [
      "ticker,tradingDate,closePrice,volume,tradingValue,currency,priceUnit,volumeUnit,tradingValueUnit,source",
      "FPT,2026-06-19,105,,,VND,vnd_per_share,,,local_research_csv",
    ].join("\n");

    const result = await runMarketPvtSafeImportMvp({
      confirmWrite: true,
      csvText: csv,
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(result.summary.writtenRows).toBe(1);
    expect(db.marketPrices[0].volume).toBeNull();
    expect(db.marketPrices[0].tradingValue).toBeNull();
    expect(db.marketPrices[0].volume).not.toBe(0);
    expect(db.marketPrices[0].tradingValue).not.toBe(0);
  });

  it("skips duplicate CSV rows safely and does not overwrite existing rows", async () => {
    const db = new FakeMarketPvtImportDb();
    const duplicateCsv = [validCsv, validCsv.split("\n")[1]].join("\n");

    const duplicatePreview = await runMarketPvtSafeImportMvp({
      confirmWrite: true,
      csvText: duplicateCsv,
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(duplicatePreview.summary.writtenRows).toBe(0);
    expect(duplicatePreview.summary.skippedRows).toBe(2);
    expect(db.marketPrices).toHaveLength(0);

    const first = await runMarketPvtSafeImportMvp({
      confirmWrite: true,
      csvText: validCsv,
      databaseUrl: "file:./dev.db",
      db,
    });
    const second = await runMarketPvtSafeImportMvp({
      confirmWrite: true,
      csvText: validCsv.replace("105.5", "110"),
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(first.summary.writtenRows).toBe(1);
    expect(second.summary.writtenRows).toBe(0);
    expect(second.summary.skippedRows).toBe(1);
    expect(db.marketPrices).toHaveLength(1);
    expect(db.marketPrices[0].closePrice).toBe(105.5);
  });
});
