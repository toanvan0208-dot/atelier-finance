/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "vitest";

import type { FinancialStatementLocalWriteDb } from "@/lib/data-sources/financial-statement-local-write-service";
import { readFinancialsUnitMetadataFromPersistencePayload } from "../financials-unit-metadata-persistence-boundary";
import {
  buildFptFinancialStatementDbWriteTrialPayload,
  phase79ExposedFunctionNames,
  phase79ForbiddenExposureTerms,
  runFptFinancialStatementDbWriteTrial,
  validateFptFinancialStatementDbWriteTrialPayload,
  verifyFptFinancialStatementDbWriteTrialReadBack,
} from "../fpt-financial-statement-db-write-trial";
import { buildFptLocalResearchTrialFixture } from "../fpt-local-research-data-trial";

type StoredSource = { id: string; name: string; sourceType: string };
type StoredCompany = { id: string; ticker: string; dataMode?: string };
type StoredFinancialStatement = {
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
  unitMetadata?: StoredFinancialStatementUnitMetadata[];
};
type StoredFinancialStatementUnitMetadata = {
  financialStatementId: string;
  field: string;
  unit: string;
  status: string;
  sourceLabel: string | null;
  dataMode: string | null;
  warningCodes: string;
  productionApproved: false;
};

type FinancialStatementWriteTransaction = Parameters<FinancialStatementLocalWriteDb["$transaction"]>[0] extends (
  tx: infer Tx,
) => Promise<unknown>
  ? Tx
  : never;

class FakeFptTrialDb implements FinancialStatementLocalWriteDb {
  sources: StoredSource[] = [];
  companies: StoredCompany[] = [];
  financialStatements: StoredFinancialStatement[] = [];
  financialStatementUnitMetadata: StoredFinancialStatementUnitMetadata[] = [];
  transactionCalls = 0;

  async $transaction<T>(fn: (tx: FinancialStatementWriteTransaction) => Promise<T>): Promise<T> {
    this.transactionCalls += 1;
    return fn(this.tx());
  }

  readonly financialStatement = {
    findMany: async (args: unknown): Promise<StoredFinancialStatement[]> => {
      const input = args as {
        where: { ticker: string; dataMode: string; sourceLabel: string; periodType?: string };
        take?: number;
      };
      return this.financialStatements
        .filter((statement) => {
          if (statement.ticker !== input.where.ticker) return false;
          if (statement.dataMode !== input.where.dataMode) return false;
          if (statement.sourceLabel !== input.where.sourceLabel) return false;
          if (input.where.periodType && statement.periodType !== input.where.periodType) return false;
          return true;
        })
        .sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))
        .slice(0, input.take ?? 8)
        .map((statement) => ({
          ...statement,
          unitMetadata: this.financialStatementUnitMetadata.filter((row) => row.financialStatementId === statement.id),
        }));
    },
  };

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
            dataMode: input.data.dataMode,
            ticker: input.data.ticker,
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
          const input = args as { data: Omit<StoredFinancialStatement, "id" | "unitMetadata"> };
          const statement = {
            id: `statement-${this.financialStatements.length + 1}`,
            ...input.data,
          };
          this.financialStatements.push(statement);
          return { id: statement.id };
        },
      },
      financialStatementUnitMetadata: {
        upsert: async (args) => {
          const input = args as {
            where: { financialStatementId_field: { financialStatementId: string; field: string } };
            create: StoredFinancialStatementUnitMetadata;
            update: Omit<StoredFinancialStatementUnitMetadata, "financialStatementId">;
          };
          const existing = this.financialStatementUnitMetadata.find(
            (row) =>
              row.financialStatementId === input.where.financialStatementId_field.financialStatementId &&
              row.field === input.where.financialStatementId_field.field,
          );
          if (existing) {
            Object.assign(existing, input.update);
            return existing;
          }
          this.financialStatementUnitMetadata.push(input.create);
          return input.create;
        },
      },
    };
  }
}

const payload = () => {
  const built = buildFptFinancialStatementDbWriteTrialPayload();
  if (!built) throw new Error("Expected Phase 78 FPT fixture to build a Phase 79 payload.");
  return built;
};

describe("controlled FPT financial statement DB write trial", () => {
  let db: FakeFptTrialDb;

  beforeEach(() => {
    db = new FakeFptTrialDb();
  });

  it("accepts the Phase 78 valid FPT draft/write-intent for a controlled DB trial", () => {
    const built = payload();
    const validation = validateFptFinancialStatementDbWriteTrialPayload(built);

    expect(built.scenario).toBe("phase79_fpt_financial_statement_db_write_trial");
    expect(built.sourceBaseline).toBe("phase78_fpt_local_research_financial_statement_trial");
    expect(validation.readyForDbWriteTrial).toBe(true);
    expect(validation.blockedReasons).toEqual([]);
  });

  it("blocks a non-FPT ticker for this one-ticker trial", () => {
    const built = payload();
    built.acceptedRows[0].ticker = "MWG";

    expect(validateFptFinancialStatementDbWriteTrialPayload(built).blockedReasons).toContain("ticker_must_be_fpt");
  });

  it("does not convert a missing value to zero and blocks the write gate", () => {
    const built = payload();
    built.acceptedRows[0].revenue = null;

    const validation = validateFptFinancialStatementDbWriteTrialPayload(built);

    expect(validation.blockedReasons).toContain("revenue_missing_value_blocks_db_write");
    expect(built.acceptedRows[0].revenue).toBeNull();
    expect(built.acceptedRows[0].revenue).not.toBe(0);
  });

  it("blocks missing unit metadata before DB write", () => {
    const built = payload();
    built.acceptedRows[0].unitMetadata.revenue = {
      ...built.acceptedRows[0].unitMetadata.revenue,
      status: "unknown_unit",
      unit: "unknown",
    };

    const validation = validateFptFinancialStatementDbWriteTrialPayload(built);

    expect(validation.blockedReasons).toEqual(
      expect.arrayContaining(["revenue_missing_explicit_unit_metadata", "revenue_missing_unit_blocks_db_write"]),
    );
  });

  it("blocks invalid unit metadata before DB write", () => {
    const built = payload();
    built.acceptedRows[0].unitMetadata.eps = {
      ...built.acceptedRows[0].unitMetadata.eps,
      status: "explicit",
      unit: "million_vnd",
    };

    expect(validateFptFinancialStatementDbWriteTrialPayload(built).blockedReasons).toContain(
      "eps_invalid_unit_blocks_db_write",
    );
  });

  it("does not guess magnitude from large numeric values", () => {
    const built = payload();
    built.acceptedRows[0].revenue = 60_000_000_000_000;
    built.acceptedRows[0].unitMetadata.revenue = {
      ...built.acceptedRows[0].unitMetadata.revenue,
      status: "unknown_unit",
      unit: "unknown",
    };

    const validation = validateFptFinancialStatementDbWriteTrialPayload(built);

    expect(validation.blockedReasons).toContain("revenue_missing_unit_blocks_db_write");
    expect(built.acceptedRows[0].unitMetadata.revenue.unit).not.toBe("billion_vnd");
  });

  it("persists the FinancialStatement row and linked FinancialStatementUnitMetadata rows", async () => {
    const result = await runFptFinancialStatementDbWriteTrial(payload(), { readDb: db, writeDb: db });

    expect(result.writeReport.status).toBe("write_completed");
    expect(result.writeReport.insertedCount).toBe(1);
    expect(db.financialStatements).toHaveLength(1);
    expect(db.financialStatementUnitMetadata).toHaveLength(10);
    expect(db.financialStatementUnitMetadata.every((row) => row.financialStatementId === "statement-1")).toBe(true);
    expect(db.financialStatementUnitMetadata.find((row) => row.field === "revenue")).toMatchObject({
      field: "revenue",
      financialStatementId: "statement-1",
      status: "explicit",
      unit: "billion_vnd",
    });
  });

  it("reads back explicit revenue, totalEquity, sharesOutstanding, and EPS metadata", async () => {
    const result = await runFptFinancialStatementDbWriteTrial(payload(), { readDb: db, writeDb: db });
    const record = result.readBack.records[0];

    expect(result.readBack.status).toBe("available");
    expect(record.values.revenue).toBe(60_000);
    expect(record.values.totalEquity).toBe(35_000);
    expect(record.values.sharesOutstanding).toBe(1_500);
    expect(record.values.eps).toBe(5_000);
    expect(record.unitMetadata?.revenue).toMatchObject({ status: "explicit", unit: "billion_vnd" });
    expect(record.unitMetadata?.equity).toMatchObject({ status: "explicit", unit: "billion_vnd" });
    expect(record.unitMetadata?.sharesOutstanding).toMatchObject({ status: "explicit", unit: "million_shares" });
    expect(record.unitMetadata?.eps).toMatchObject({ status: "explicit", unit: "vnd_per_share" });
  });

  it("preserves source/evidence metadata and keeps production approval/source approval false", async () => {
    const result = await runFptFinancialStatementDbWriteTrial(payload(), { readDb: db, writeDb: db });
    const record = result.readBack.records[0];

    expect(record.source.sourceLabel).toBe("phase79_fpt_financial_statement_db_write_trial");
    expect(record.source.dataMode).toBe("research_only");
    expect(record.source.productionApproved).toBe(false);
    expect(result.writeReport.productionApproved).toBe(false);
    expect(result.productionApproved).toBe(false);
  });

  it("verifies the full read-back and valuation boundary after the controlled write", async () => {
    const result = await runFptFinancialStatementDbWriteTrial(payload(), { readDb: db, writeDb: db });
    const verification = verifyFptFinancialStatementDbWriteTrialReadBack(result);

    expect(verification.readyForDbWriteTrial).toBe(true);
    expect(result.valuationBoundary.selectedInputs.revenue.normalizationStatus).toBe("ready");
    expect(result.valuationBoundary.selectedInputs.equity.normalizationStatus).toBe("ready");
    expect(result.valuationBoundary.selectedInputs.sharesOutstanding.normalizationStatus).toBe("ready");
    expect(result.valuationBoundary.selectedInputs.eps.normalizationStatus).toBe("ready");
    expect(result.valuationBoundary.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    expect(result.valuationBoundary.sourceBoundary.productionApproved).toBe(false);
  });

  it("keeps old rows without metadata unknown and not ready for unit-sensitive calculations", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: null,
      snapshot: {
        eps: 5_000,
        revenue: 60_000,
        sharesOutstanding: 1_500,
        sourceName: "legacy_without_sidecar",
        totalEquity: 35_000,
      },
    });

    expect(read.status).toBe("missing_metadata");
    expect(read.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(read.unitMetadata.revenue.unit).toBe("unknown");
  });

  it("does not let invalid persisted metadata be bypassed by numeric values", () => {
    const read = readFinancialsUnitMetadataFromPersistencePayload({
      payload: {
        productionApproved: false,
        schemaVersion: 1,
        unitMetadata: {
          eps: { status: "explicit", unit: "million_vnd" },
          revenue: { status: "explicit", unit: "usd" },
          sharesOutstanding: { status: "explicit", unit: "vnd" },
        },
      },
      snapshot: {
        eps: 5_000,
        revenue: 60_000,
        sharesOutstanding: 1_500,
        sourceName: "invalid_sidecar",
        totalEquity: 35_000,
      },
    });

    expect(read.status).toBe("invalid_metadata");
    expect(read.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(read.unitMetadata.eps.status).toBe("unknown_unit");
    expect(read.unitMetadata.sharesOutstanding.status).toBe("unknown_unit");
  });

  it("keeps valuation edge cases not applicable or blocked without adding metrics", async () => {
    const built = payload();
    built.acceptedRows[0].eps = 0;
    built.acceptedRows[0].totalEquity = 0;
    built.acceptedRows[0].sharesOutstanding = 0;
    const result = await runFptFinancialStatementDbWriteTrial(built, { readDb: db, writeDb: db });

    expect(result.valuationBoundary.calculation.metrics.pe.status).toBe("not_applicable");
    expect(["insufficient_data", "not_applicable"]).toContain(
      result.valuationBoundary.calculation.metrics.bvps.status,
    );
    expect(result.valuationBoundary.selectedInputs.sharesOutstanding.normalizationStatus).toBe("ready");
    expect(result.valuationBoundary.calculation.metrics).not.toHaveProperty("ev");
    expect(result.valuationBoundary.calculation.metrics).not.toHaveProperty("dcf");
    expect(result.valuationBoundary.calculation.metrics).not.toHaveProperty("fairValue");
    expect(result.valuationBoundary.calculation).not.toHaveProperty("recommendation");
  });

  it("does not expose parser, import, upload, recommendation, target, fair value, or risk scoring functions", async () => {
    const moduleExports = await import("../fpt-financial-statement-db-write-trial");
    const exportNames = Object.keys(moduleExports);

    expect(exportNames).toEqual(expect.arrayContaining([...phase79ExposedFunctionNames]));
    for (const term of phase79ForbiddenExposureTerms) {
      expect(exportNames.some((name) => name.toLowerCase().includes(term.toLowerCase()))).toBe(false);
    }
  });

  it("does not require raw CSV or real data files for the test fixture", () => {
    const fixture = buildFptLocalResearchTrialFixture();
    const built = payload();

    expect(fixture.every((row) => row.sourceDocumentRef === "phase78-inline-test-fixture-no-raw-csv")).toBe(true);
    expect(built.acceptedRows).toHaveLength(1);
    expect(built.databaseUrl).toBe("file:./dev.db");
    expect(db.financialStatements).toEqual([]);
  });
});
