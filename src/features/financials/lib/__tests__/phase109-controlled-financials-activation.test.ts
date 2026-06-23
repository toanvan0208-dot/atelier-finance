/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "vitest";

import { getFinancialStatementSeries } from "@/lib/data-sources/financial-statement-read-service";
import type { FinancialStatementSafeImportMvpInput } from "@/lib/data-sources/financial-statement-safe-import-mvp";
import {
  buildPhase109ControlledFinancialsCsv,
  runPhase109ControlledFinancialsActivation,
} from "../phase109-controlled-financials-activation";
import { PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL } from "../phase109-controlled-financials-constants";

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

class Phase109FakeFinancialsDb implements WriteDb {
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

const runtimeDeps = (db: Phase109FakeFinancialsDb) => ({
  readSeries: (params: Parameters<typeof getFinancialStatementSeries>[0]) => getFinancialStatementSeries(params, { db }),
});

const auditFor = (report: Awaited<ReturnType<typeof runPhase109ControlledFinancialsActivation>>, ticker: string) => {
  const audit = report.tickerAudits.find((item) => item.ticker === ticker);
  if (!audit) throw new Error(`Missing audit for ${ticker}`);
  return audit;
};

describe("Phase 109 controlled multi-ticker financials activation", () => {
  let db: Phase109FakeFinancialsDb;

  beforeEach(() => {
    db = new Phase109FakeFinancialsDb();
  });

  it("defaults to dry-run and reports per-ticker zero writes", async () => {
    const report = await runPhase109ControlledFinancialsActivation({ db });

    expect(report.dryRun).toBe(true);
    expect(report.totals).toMatchObject({ inputRows: 27, invalidRows: 0, validRows: 27, writtenRows: 0 });
    expect(report.productionApproved).toBe(false);
    expect(report.tickerAudits.map((audit) => audit.ticker)).toEqual(["FPT", "MWG", "VNM"]);
    expect(report.tickerAudits.every((audit) => audit.writtenRows === 0 && audit.inputRows === 9)).toBe(true);
    expect(db.transactionCalls).toBe(0);
  });

  it("confirmed write persists FPT, MWG, and VNM rows through the existing import pipeline", async () => {
    const report = await runPhase109ControlledFinancialsActivation({
      confirmWrite: true,
      databaseUrl: "file:./dev.db",
      db,
      runtimeDeps: runtimeDeps(db),
      verifyRuntimeRead: true,
    });

    expect(report.totals).toMatchObject({ inputRows: 27, invalidRows: 0, skippedRows: 0, validRows: 27, writtenRows: 3 });
    for (const ticker of ["FPT", "MWG", "VNM"]) {
      const audit = auditFor(report, ticker);
      expect(audit).toMatchObject({
        dataMode: "research_only",
        invalidRows: 0,
        productionApproved: false,
        skippedReason: null,
        skippedRows: 0,
        sourceLabel: PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
        validRows: 9,
        writtenRows: 1,
      });
      expect(audit.runtimeProof).toMatchObject({
        checked: true,
        dataMode: "research_only",
        fallbackUsed: false,
        productionApproved: false,
        readPath: "local_db",
        runtimeStatus: "db_backed",
        sharesOutstanding: null,
        sourceLabel: PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL,
      });
      expect(audit.runtimeProof.eps).toBeNull();
      expect(audit.crossModuleReadiness).toMatchObject({
        canClaimRiskDbBacked: false,
        canClaimValuationDbBacked: false,
        overviewFinancialsStatus: "partial",
        overviewValuationStatus: "partial",
        riskLeverageReadiness: "insufficient_data",
        riskSourceMode: "mixed_source",
        valuationConsumesFinancialsRuntime: true,
        valuationMarketCapReadiness: "insufficient_data",
      });
    }
    expect(db.statements.map((statement) => statement.ticker).sort()).toEqual(["FPT", "MWG", "VNM"]);
    expect(db.statements.every((statement) => statement.sharesOutstanding === null && statement.eps === null)).toBe(true);
    expect(db.statements.some((statement) => statement.sharesOutstanding === 0 || statement.eps === 0)).toBe(false);
  });

  it("skips duplicate confirmed writes without overwriting existing rows", async () => {
    const first = await runPhase109ControlledFinancialsActivation({
      confirmWrite: true,
      databaseUrl: "file:./dev.db",
      db,
      tickers: ["MWG"],
    });
    const second = await runPhase109ControlledFinancialsActivation({
      confirmWrite: true,
      databaseUrl: "file:./dev.db",
      db,
      tickers: ["MWG"],
    });

    expect(auditFor(first, "MWG").writtenRows).toBe(1);
    expect(auditFor(second, "MWG").writtenRows).toBe(0);
    expect(auditFor(second, "MWG").skippedRows).toBe(1);
    expect(db.statements).toHaveLength(1);
    expect(db.statements[0]).toMatchObject({ revenue: 134_000, ticker: "MWG" });
  });

  it("fails closed for a ticker with invalid unit metadata", async () => {
    const invalidMwgCsv = buildPhase109ControlledFinancialsCsv("MWG")?.replace(
      "revenue,134000,billion_vnd",
      "revenue,134000,usd",
    );
    const report = await runPhase109ControlledFinancialsActivation({
      confirmWrite: true,
      csvTextByTicker: { MWG: invalidMwgCsv ?? "" },
      databaseUrl: "file:./dev.db",
      db,
      tickers: ["MWG"],
    });
    const audit = auditFor(report, "MWG");

    expect(audit.invalidRows).toBe(1);
    expect(audit.skippedReason).toBe("validation_failed");
    expect(audit.writtenRows).toBe(0);
    expect(audit.importResult?.dryRun).toBe(true);
    expect(audit.importResult?.summary.errors.join(" ")).toContain("invalid_unit");
    expect(db.statements).toHaveLength(0);
  });

  it("reports unavailable tickers as skipped instead of inventing data", async () => {
    const report = await runPhase109ControlledFinancialsActivation({ db, tickers: ["HPG"] });
    const audit = auditFor(report, "HPG");

    expect(audit.skippedReason).toBe("controlled_financials_data_unavailable");
    expect(audit.inputRows).toBe(0);
    expect(audit.validRows).toBe(0);
    expect(audit.writtenRows).toBe(0);
    expect(audit.sourceLabel).toBeNull();
  });
});
