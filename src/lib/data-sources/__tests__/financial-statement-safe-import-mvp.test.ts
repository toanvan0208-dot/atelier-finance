import { beforeEach, describe, expect, it } from "vitest";

import {
  runFinancialStatementSafeImportMvp,
  type FinancialStatementSafeImportMvpInput,
} from "../financial-statement-safe-import-mvp";
import type { FinancialStatementLocalWriteDb } from "../financial-statement-local-write-service";

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
  warningCodes?: string;
};
type StoredFinancialStatementUnitMetadata = {
  financialStatementId: string;
  field: string;
  unit: string;
  status: string;
  sourceLabel?: string | null;
  dataMode?: string | null;
  productionApproved: false;
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
  financialStatementUnitMetadata: StoredFinancialStatementUnitMetadata[] = [];
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
            this.financialStatements.find(
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
        create: async (args) => {
          const input = args as { data: Omit<StoredFinancialStatement, "id"> };
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

const header = [
  "ticker",
  "period",
  "periodType",
  "statementType",
  "field",
  "value",
  "unit",
  "currency",
  "sourceLabel",
  "sourceOwner",
  "sourceUrl",
  "sourceDocumentRef",
  "asOf",
  "dataMode",
  "productionApproved",
  "evidenceNote",
  "basis",
].join(",");

const row = ({
  basis = "consolidated",
  field,
  period = "2024",
  periodType = "annual",
  productionApproved = "false",
  sourceDocumentRef = "local-reviewed-csv",
  statementType,
  unit,
  value,
}: {
  basis?: string;
  field: string;
  period?: string;
  periodType?: string;
  productionApproved?: string;
  sourceDocumentRef?: string;
  statementType: string;
  unit: string;
  value: string;
}) =>
  [
    "FPT",
    period,
    periodType,
    statementType,
    field,
    value,
    unit,
    "VND",
    "phase93_local_research_csv",
    "manual local review",
    "",
    sourceDocumentRef,
    "2026-06-21",
    "research_only",
    productionApproved,
    "Local research CSV; not official and not production-approved.",
    basis,
  ].join(",");

const csv = (rows: string[]) => [header, ...rows].join("\n");

const validCsv = () =>
  csv([
    row({ field: "revenue", statementType: "income_statement", unit: "billion_vnd", value: "60000" }),
    row({ field: "netIncome", statementType: "income_statement", unit: "billion_vnd", value: "8000" }),
    row({ field: "totalAssets", statementType: "balance_sheet", unit: "billion_vnd", value: "70000" }),
    row({ field: "totalEquity", statementType: "balance_sheet", unit: "billion_vnd", value: "35000" }),
    row({ field: "operatingCashFlow", statementType: "cash_flow", unit: "billion_vnd", value: "9000" }),
    row({ field: "sharesOutstanding", statementType: "balance_sheet", unit: "million_shares", value: "1500" }),
    row({ field: "eps", statementType: "income_statement", unit: "vnd_per_share", value: "5000" }),
  ]);

const importInput = (db: FakeFinancialStatementWriteDb, csvText = validCsv()): FinancialStatementSafeImportMvpInput => ({
  confirmWrite: true,
  csvText,
  databaseUrl: "file:./dev.db",
  db,
});

describe("financial statement safe import MVP", () => {
  let db: FakeFinancialStatementWriteDb;

  beforeEach(() => {
    db = new FakeFinancialStatementWriteDb();
  });

  it("returns a dry-run preview without writing to DB", async () => {
    const result = await runFinancialStatementSafeImportMvp({
      audit: {
        completedAt: "2026-06-21T01:05:00.000Z",
        importJobId: "financial-dry-run",
        startedAt: "2026-06-21T01:00:00.000Z",
      },
      csvText: validCsv(),
      db,
    });

    expect(result.status).toBe("preview_ready");
    expect(result.dryRun).toBe(true);
    expect(result.summary).toMatchObject({
      dryRun: true,
      invalidRows: 0,
      skippedRows: 0,
      validRows: 7,
      writtenRows: 0,
    });
    expect(result.audit).toMatchObject({
      completedAt: "2026-06-21T01:05:00.000Z",
      confirmWrite: false,
      dryRun: true,
      importJobId: "financial-dry-run",
      importType: "financial_statement",
      productionApproved: false,
      sourceLabel: "phase93_local_research_csv",
      startedAt: "2026-06-21T01:00:00.000Z",
      status: "dry_run_completed",
      validRows: 7,
      writtenRows: 0,
    });
    expect(result.audit.safetyFlags.invalidRowsNotWritten).toBe(true);
    expect(db.transactionCalls).toBe(0);
    expect(db.financialStatements).toEqual([]);
  });

  it("confirmed import writes only valid rows and preserves productionApproved false", async () => {
    const result = await runFinancialStatementSafeImportMvp(importInput(db));

    expect(result.status).toBe("import_completed");
    expect(result.summary.writtenRows).toBe(1);
    expect(result.audit.status).toBe("completed_with_warnings");
    expect(result.audit.writtenRows).toBe(1);
    expect(result.audit.tickers).toEqual(["FPT"]);
    expect(result.productionApproved).toBe(false);
    expect(result.sourceType).toBe("user_input");
    expect(result.sourceApprovalCreated).toBe(false);
    expect(db.financialStatements).toHaveLength(1);
    expect(db.financialStatements[0]).toMatchObject({
      dataMode: "research_only",
      revenue: 60000,
      sourceLabel: "phase93_local_research_csv",
      ticker: "FPT",
    });
    expect(db.financialStatementUnitMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "revenue",
          productionApproved: false,
          status: "explicit",
          unit: "billion_vnd",
        }),
      ]),
    );
  });

  it("invalid unit fails closed and keeps invalid rows out of DB", async () => {
    const result = await runFinancialStatementSafeImportMvp(
      importInput(db, csv([row({ field: "revenue", statementType: "income_statement", unit: "usd", value: "60000" })])),
    );

    expect(result.status).toBe("import_rejected");
    expect(result.summary.invalidRows).toBe(1);
    expect(result.audit.status).toBe("failed_validation");
    expect(result.audit.errors.join(" ")).toContain("invalid_unit");
    expect(result.audit.safetyFlags.missingUnitFailsClosed).toBe(true);
    expect(result.summary.errors.join(" ")).toContain("invalid_unit");
    expect(result.summary.writtenRows).toBe(0);
    expect(db.transactionCalls).toBe(0);
  });

  it("omitted numeric fields remain null instead of becoming zero", async () => {
    const partialCsv = csv([
      row({ field: "revenue", statementType: "income_statement", unit: "billion_vnd", value: "60000" }),
      row({ field: "totalAssets", statementType: "balance_sheet", unit: "billion_vnd", value: "70000" }),
      row({ field: "totalEquity", statementType: "balance_sheet", unit: "billion_vnd", value: "35000" }),
    ]);
    const result = await runFinancialStatementSafeImportMvp(importInput(db, partialCsv));

    expect(result.status).toBe("import_completed");
    expect(result.audit.safetyFlags.noZeroFillForMissing).toBe(true);
    expect(db.financialStatements[0].operatingCashFlow).toBeNull();
    expect(db.financialStatements[0].operatingCashFlow).not.toBe(0);
    expect(result.acceptedRows[0].missingFields).toEqual(expect.arrayContaining(["netIncome", "operatingCashFlow"]));
  });

  it("duplicate confirmed import is skipped safely instead of overwritten", async () => {
    const first = await runFinancialStatementSafeImportMvp(importInput(db));
    const second = await runFinancialStatementSafeImportMvp(importInput(db));

    expect(first.summary.writtenRows).toBe(1);
    expect(second.status).toBe("import_completed_with_skips");
    expect(second.summary.writtenRows).toBe(0);
    expect(second.summary.skippedRows).toBe(1);
    expect(second.audit.status).toBe("blocked");
    expect(second.audit.skippedRows).toBe(1);
    expect(second.audit.duplicateSkippedRows).toBe(1);
    expect(second.audit.safetyFlags.noOverwrite).toBe(true);
    expect(db.financialStatements).toHaveLength(1);
  });

  it("blocks production approval and source approval claims", async () => {
    const result = await runFinancialStatementSafeImportMvp(
      importInput(
        db,
        csv([
          row({
            field: "revenue",
            productionApproved: "true",
            statementType: "income_statement",
            unit: "billion_vnd",
            value: "60000",
          }),
        ]),
      ),
    );

    expect(result.productionApproved).toBe(false);
    expect(result.audit.productionApproved).toBe(false);
    expect(result.sourceApprovalCreated).toBe(false);
    expect(result.summary.errors.join(" ")).toContain("production_approval_not_allowed");
    expect(db.financialStatements).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('"productionApproved":true');
  });

  it("does not create valuation/product approval claims from imported data", async () => {
    const result = await runFinancialStatementSafeImportMvp(importInput(db));
    const output = JSON.stringify(result).toLowerCase();

    expect(result.valuationClaimCreated).toBe(false);
    expect(output).not.toContain("canclaimvaluationdbbacked:true");
    expect(output).not.toContain("target price");
    expect(output).not.toContain("fair value");
    expect(output).not.toContain("recommendation");
  });
});
