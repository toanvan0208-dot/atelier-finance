import { beforeEach, describe, expect, it } from "vitest";

import type { NormalizedFinancialStatementImportRow } from "../financial-statement-import-contract";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import {
  runFinancialStatementLocalWriteTrial,
  type FinancialStatementLocalWriteDb,
} from "../financial-statement-local-write-service";

type StoredSource = { id: string; name: string; sourceType: string };
type StoredCompany = { id: string; ticker: string; dataMode?: string };
type StoredFinancialStatement = {
  id: string;
  ticker: string;
  fiscalYear: number | null;
  fiscalQuarter: number | null;
  periodType: string;
  sourceId: string;
  sourceLabel: string;
  dataMode: string;
  revenue?: number | null;
  operatingCashFlow?: number | null;
  equity?: number | null;
  missingFields?: string;
};

type FinancialStatementWriteTransaction = Parameters<FinancialStatementLocalWriteDb["$transaction"]>[0] extends (
  tx: infer Tx,
) => Promise<unknown>
  ? Tx
  : never;

class FakeFinancialStatementWriteDb implements FinancialStatementLocalWriteDb {
  sources: StoredSource[] = [];
  companies: StoredCompany[] = [];
  financialStatements: StoredFinancialStatement[] = [];
  transactionCalls = 0;

  async $transaction<T>(fn: (tx: FinancialStatementWriteTransaction) => Promise<T>): Promise<T> {
    this.transactionCalls += 1;
    return fn(this.tx());
  }

  private tx(): FinancialStatementWriteTransaction {
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
      financialStatement: {
        findFirst: async (args) => {
          const input = args as {
            where: {
              ticker: string;
              fiscalYear: number;
              fiscalQuarter: number | null;
              periodType: string;
              sourceId: string;
              dataMode: string;
            };
          };
          return (
            this.financialStatements.find((statement) => {
              if (statement.ticker !== input.where.ticker) return false;
              if (statement.fiscalYear !== input.where.fiscalYear) return false;
              if (statement.fiscalQuarter !== input.where.fiscalQuarter) return false;
              if (statement.periodType !== input.where.periodType) return false;
              if (statement.sourceId !== input.where.sourceId) return false;
              return statement.dataMode === input.where.dataMode;
            }) ?? null
          );
        },
        create: async (args) => {
          const input = args as { data: Omit<StoredFinancialStatement, "id"> };
          this.financialStatements.push({
            id: `statement-${this.financialStatements.length + 1}`,
            ...input.data,
          });
        },
      },
    };
  }
}

const acceptedRow = (
  patch: Partial<NormalizedFinancialStatementImportRow> = {},
): NormalizedFinancialStatementImportRow => ({
  ticker: "FPT",
  fiscalYear: 2024,
  fiscalQuarter: null,
  periodType: "annual",
  statementDate: null,
  currency: "VND",
  revenue: 1000,
  grossProfit: null,
  operatingIncome: null,
  netIncome: 100,
  totalAssets: 5000,
  totalLiabilities: null,
  totalDebt: null,
  totalEquity: 2000,
  currentAssets: null,
  currentLiabilities: null,
  cashAndEquivalents: null,
  operatingCashFlow: 300,
  capitalExpenditure: null,
  sharesOutstanding: null,
  eps: null,
  sourceLabel: "phase45_test",
  dataMode: "research_only",
  productionApproved: false,
  unitMetadata: buildFinancialsUnitMetadata(),
  missingFields: [],
  warnings: [],
  rowIndex: 0,
  sourceRowNumber: 1,
  ...patch,
});

const confirmations = {
  confirmLocalResearchOnly: true,
  confirmNoProductionSource: true,
  confirmReviewedDryRun: true,
  confirmNoProductionDatabase: true,
};

describe("financial statement local write service", () => {
  let db: FakeFinancialStatementWriteDb;

  beforeEach(() => {
    db = new FakeFinancialStatementWriteDb();
  });

  it("requires all confirmations before writing", async () => {
    const result = await runFinancialStatementLocalWriteTrial(
      {
        acceptedRows: [acceptedRow()],
        sourceLabel: "phase45_test",
        dataMode: "research_only",
        databaseUrl: "file:./dev.db",
        confirmations: { ...confirmations, confirmReviewedDryRun: false },
      },
      { db },
    );

    expect(result.status).toBe("write_rejected");
    expect(result.insertedCount).toBe(0);
    expect(result.noDbWrite).toBe(true);
    expect(db.transactionCalls).toBe(0);
  });

  it("writes accepted rows only and forces unapproved research metadata", async () => {
    const result = await runFinancialStatementLocalWriteTrial(
      {
        acceptedRows: [acceptedRow(), acceptedRow({ ticker: "MWG", revenue: null, operatingCashFlow: null })],
        sourceLabel: "phase45_test",
        dataMode: "research_only",
        databaseUrl: "file:./dev.db",
        confirmations,
      },
      { db },
    );

    expect(result.status).toBe("write_completed");
    expect(result.insertedCount).toBe(2);
    expect(result.updatedCount).toBe(0);
    expect(result.productionApproved).toBe(false);
    expect(db.financialStatements).toHaveLength(2);
    expect(db.financialStatements[0]).toMatchObject({
      ticker: "FPT",
      sourceLabel: "phase45_test",
      dataMode: "research_only",
    });
  });

  it("preserves null values instead of replacing missing cells with zero", async () => {
    await runFinancialStatementLocalWriteTrial(
      {
        acceptedRows: [
          acceptedRow({
            ticker: "MWG",
            revenue: null,
            operatingCashFlow: null,
            missingFields: ["revenue", "operatingCashFlow"],
          }),
        ],
        sourceLabel: "phase45_test",
        dataMode: "research_only",
        databaseUrl: "file:./dev.db",
        confirmations,
      },
      { db },
    );

    expect(db.financialStatements[0].revenue).toBeNull();
    expect(db.financialStatements[0].operatingCashFlow).toBeNull();
    expect(db.financialStatements[0].revenue).not.toBe(0);
  });

  it("skips existing duplicate rows instead of overwriting", async () => {
    const input = {
      acceptedRows: [acceptedRow()],
      sourceLabel: "phase45_test",
      dataMode: "research_only",
      databaseUrl: "file:./dev.db",
      confirmations,
    };

    const first = await runFinancialStatementLocalWriteTrial(input, { db });
    const second = await runFinancialStatementLocalWriteTrial(input, { db });

    expect(first.insertedCount).toBe(1);
    expect(second.insertedCount).toBe(0);
    expect(second.skippedExistingCount).toBe(1);
    expect(second.status).toBe("write_completed_with_skips");
    expect(db.financialStatements).toHaveLength(1);
  });

  it("rejects unsafe database URLs before transaction", async () => {
    const result = await runFinancialStatementLocalWriteTrial(
      {
        acceptedRows: [acceptedRow()],
        sourceLabel: "phase45_test",
        dataMode: "research_only",
        databaseUrl: "postgresql://user:password@example.com/db",
        confirmations,
      },
      { db },
    );

    expect(result.status).toBe("write_rejected");
    expect(result.databaseGuard.accepted).toBe(false);
    expect(db.transactionCalls).toBe(0);
    expect(db.financialStatements).toEqual([]);
  });
});
