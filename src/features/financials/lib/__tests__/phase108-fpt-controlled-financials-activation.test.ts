/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "vitest";

import { getFinancialStatementSeries } from "@/lib/data-sources/financial-statement-read-service";
import type { FinancialStatementSafeImportMvpInput } from "@/lib/data-sources/financial-statement-safe-import-mvp";
import { buildValuationFinancialsRuntimeReadiness } from "@/features/valuation/lib/valuation-financials-runtime-readiness";
import {
  buildPhase108FptControlledFinancialsCsv,
  runPhase108FptFinancialsActivation,
} from "../phase108-fpt-controlled-financials-activation";
import { PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL } from "../phase108-fpt-controlled-financials-constants";

type WriteDb = NonNullable<FinancialStatementSafeImportMvpInput["db"]>;
type Tx = Parameters<WriteDb["$transaction"]>[0] extends (tx: infer T) => Promise<unknown> ? T : never;
type Statement = {
  id: string;
  ticker: string;
  periodType: string;
  period: string;
  fiscalYear: number | null;
  fiscalQuarter: number | null;
  reportDate: Date | string | null;
  currency: string | null;
  revenue: number | null;
  grossProfit: number | null;
  netIncome: number | null;
  operatingCashFlow: number | null;
  totalAssets: number | null;
  equity: number | null;
  totalDebt: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  eps: number | null;
  sharesOutstanding: number | null;
  sourceId: string;
  sourceLabel: string;
  dataMode: string;
  asOf: Date | string;
  collectedAt: Date | string | null;
  missingFields: string;
  warningCodes: string;
  errorCodes: string;
};
type UnitMetadata = {
  financialStatementId: string;
  field: string;
  unit: string;
  status: string;
  sourceLabel: string | null;
  dataMode: string | null;
  warningCodes: string;
  productionApproved: false;
};

class Phase108FakeFinancialsDb implements WriteDb {
  sources: Array<{ id: string; name: string; sourceType: string }> = [];
  companies: Array<{ id: string; ticker: string }> = [];
  statements: Statement[] = [];
  unitMetadata: UnitMetadata[] = [];
  transactionCalls = 0;

  financialStatement = {
    findMany: async (args: unknown) => {
      const input = args as {
        where: { ticker: string; dataMode: string; sourceLabel: string; periodType?: string };
        take?: number;
      };
      return this.statements
        .filter((statement) => {
          if (statement.ticker !== input.where.ticker) return false;
          if (statement.dataMode !== input.where.dataMode) return false;
          if (statement.sourceLabel !== input.where.sourceLabel) return false;
          return input.where.periodType ? statement.periodType === input.where.periodType : true;
        })
        .sort((left, right) => (right.fiscalYear ?? 0) - (left.fiscalYear ?? 0))
        .slice(0, input.take ?? 8)
        .map((statement) => ({
          ...statement,
          unitMetadata: this.unitMetadata.filter((metadata) => metadata.financialStatementId === statement.id),
        }));
    },
  };

  async $transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    this.transactionCalls += 1;
    return fn(this.tx());
  }

  private tx(): Tx {
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
        create: async (args) => {
          const input = args as { data: { ticker: string } };
          const company = { id: `company-${this.companies.length + 1}`, ticker: input.data.ticker };
          this.companies.push(company);
          return company;
        },
        findFirst: async (args) => {
          const input = args as { where: { ticker: string } };
          return this.companies.find((company) => company.ticker === input.where.ticker) ?? null;
        },
      },
      financialStatement: {
        create: async (args) => {
          const input = args as { data: Omit<Statement, "id"> };
          const statement = { id: `statement-${this.statements.length + 1}`, ...input.data };
          this.statements.push(statement);
          return { id: statement.id };
        },
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
            this.statements.find(
              (statement) =>
                statement.ticker === input.where.ticker &&
                statement.fiscalYear === input.where.fiscalYear &&
                statement.fiscalQuarter === input.where.fiscalQuarter &&
                statement.periodType === input.where.periodType &&
                statement.sourceId === input.where.sourceId &&
                statement.dataMode === input.where.dataMode,
            ) ?? null
          );
        },
      },
      financialStatementUnitMetadata: {
        upsert: async (args) => {
          const input = args as {
            where: { financialStatementId_field: { financialStatementId: string; field: string } };
            create: UnitMetadata;
            update: Omit<UnitMetadata, "financialStatementId">;
          };
          const existing = this.unitMetadata.find(
            (metadata) =>
              metadata.financialStatementId === input.where.financialStatementId_field.financialStatementId &&
              metadata.field === input.where.financialStatementId_field.field,
          );
          if (existing) {
            Object.assign(existing, input.update);
            return existing;
          }
          this.unitMetadata.push(input.create);
          return input.create;
        },
      },
    };
  }
}

const runtimeDeps = (db: Phase108FakeFinancialsDb) => ({
  readSeries: (params: Parameters<typeof getFinancialStatementSeries>[0]) => getFinancialStatementSeries(params, { db }),
});

describe("Phase 108 FPT controlled financials activation", () => {
  let db: Phase108FakeFinancialsDb;

  beforeEach(() => {
    db = new Phase108FakeFinancialsDb();
  });

  it("defaults to dry-run and writes zero rows", async () => {
    const report = await runPhase108FptFinancialsActivation({ db });

    expect(report.dryRun).toBe(true);
    expect(report.inputRows).toBe(9);
    expect(report.validRows).toBe(9);
    expect(report.invalidRows).toBe(0);
    expect(report.writtenRows).toBe(0);
    expect(report.productionApproved).toBe(false);
    expect(db.transactionCalls).toBe(0);
  });

  it("confirmed write persists controlled FPT rows and runtime reads DB-backed data without fallback", async () => {
    const report = await runPhase108FptFinancialsActivation({
      confirmWrite: true,
      databaseUrl: "file:./dev.db",
      db,
      runtimeDeps: runtimeDeps(db),
      verifyRuntimeRead: true,
    });

    expect(report.writtenRows).toBe(1);
    expect(report.skippedRows).toBe(0);
    expect(report.sourceLabel).toBe(PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL);
    expect(report.runtimeProof).toMatchObject({
      checked: true,
      dataMode: "research_only",
      fallbackUsed: false,
      productionApproved: false,
      readPath: "local_db",
      runtimeStatus: "db_backed",
      sharesOutstanding: null,
      sourceLabel: PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL,
    });
    expect(report.runtimeProof.eps).toBeNull();
    expect(report.runtimeProof.sharesOutstanding).not.toBe(0);
    expect(db.statements[0]).toMatchObject({
      ticker: "FPT",
      revenue: 62_000,
      netIncome: 8_700,
      operatingCashFlow: 9_800,
      sharesOutstanding: null,
      sourceLabel: PHASE108_FPT_CONTROLLED_FINANCIALS_SOURCE_LABEL,
    });
    expect(db.unitMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "revenue", status: "explicit", unit: "billion_vnd" }),
        expect.objectContaining({ field: "equity", status: "explicit", unit: "billion_vnd" }),
        expect.objectContaining({ field: "operatingCashFlow", status: "explicit", unit: "billion_vnd" }),
      ]),
    );
    expect(db.unitMetadata.some((metadata) => metadata.field === "sharesOutstanding")).toBe(false);
  });

  it("keeps Valuation partial when FPT financials exist but sharesOutstanding is unavailable", async () => {
    const report = await runPhase108FptFinancialsActivation({
      confirmWrite: true,
      databaseUrl: "file:./dev.db",
      db,
      runtimeDeps: runtimeDeps(db),
      verifyRuntimeRead: true,
    });
    const runtime = report.importResult.summary.writtenRows > 0 ? report.runtimeProof : null;
    const valuation = buildValuationFinancialsRuntimeReadiness({
      inputs: {
        equity: db.statements[0]?.equity ?? null,
        eps: report.runtimeProof.eps,
        marketPrice: null,
        sharesOutstanding: runtime?.sharesOutstanding ?? null,
      },
      valuationConsumesFinancialsRuntime: true,
    });

    expect(valuation.canClaimValuationDbBacked).toBe(false);
    expect(valuation.calculationReadiness.marketCap).toBe("insufficient_data");
    expect(valuation.calculationReadiness.bvps).toBe("insufficient_data");
    expect(valuation.inputSnapshot.sharesOutstanding).toBeNull();
    expect(valuation.inputSnapshot.sharesOutstanding).not.toBe(0);
    expect(valuation.blockedReasons.join(" ")).toContain("Shares outstanding missing");
  });

  it("skips duplicate confirmed writes without overwriting existing rows", async () => {
    const first = await runPhase108FptFinancialsActivation({ confirmWrite: true, databaseUrl: "file:./dev.db", db });
    const second = await runPhase108FptFinancialsActivation({ confirmWrite: true, databaseUrl: "file:./dev.db", db });

    expect(first.writtenRows).toBe(1);
    expect(second.writtenRows).toBe(0);
    expect(second.skippedRows).toBe(1);
    expect(db.statements).toHaveLength(1);
    expect(db.statements[0].revenue).toBe(62_000);
  });

  it("fails closed when a unit is invalid", async () => {
    const invalidCsv = buildPhase108FptControlledFinancialsCsv().replace("revenue,62000,billion_vnd", "revenue,62000,usd");
    const report = await runPhase108FptFinancialsActivation({
      confirmWrite: true,
      csvText: invalidCsv,
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(report.invalidRows).toBe(1);
    expect(report.writtenRows).toBe(0);
    expect(report.importResult.status).toBe("preview_ready");
    expect(report.importResult.dryRun).toBe(true);
    expect(report.importResult.summary.errors.join(" ")).toContain("invalid_unit");
    expect(db.statements).toHaveLength(0);
  });
});
