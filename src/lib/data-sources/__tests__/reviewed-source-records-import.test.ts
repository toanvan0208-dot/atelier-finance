import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  parseReviewedSourceRecordsCsv,
  runReviewedSourceRecordImport,
} from "../reviewed-source-records-import";

const csvPath = join(process.cwd(), "docs/product/data/phase114_reviewed_source_records_candidate.csv");
const csvText = () => readFileSync(csvPath, "utf8");
const headers = [
  "ticker",
  "field",
  "value",
  "unit",
  "period",
  "asOf",
  "sourceLabel",
  "sourceType",
  "sourceUrl",
  "sourceDocumentTitle",
  "sourceLineItem",
  "rawValue",
  "rawUnit",
  "conversionFormula",
  "dataMode",
  "productionApproved",
  "reviewStatus",
  "notes",
];

const validRow = {
  asOf: "2024-12-31",
  conversionFormula: "raw_vnd / 1000000000",
  dataMode: "research_only",
  field: "totalDebt",
  notes: "Interest-bearing debt only",
  period: "2024",
  productionApproved: "false",
  rawUnit: "vnd",
  rawValue: "14947353988398",
  reviewStatus: "reviewed_candidate",
  sourceDocumentTitle: "FPT 2024 Audited Consolidated Financial Statements",
  sourceLabel: "manual_reviewed_financial_statement_2024",
  sourceLineItem: "Borrowings and finance lease liabilities",
  sourceType: "official_annual_report",
  sourceUrl: "https://fpt.com.vn",
  ticker: "FPT",
  unit: "billion_vnd",
  value: "14947.354",
};

const withCsvPatch = (patch: Record<string, string>): string => {
  const row = { ...validRow, ...patch };
  return `${headers.join(",")}\n${headers.map((header) => row[header as keyof typeof row] ?? "").join(",")}\n`;
};

const createFakeDb = () => {
  let id = 0;
  const source = { id: "source-1", name: "manual_reviewed_financial_statement_2024" };
  const companies: Array<{ id: string; ticker: string }> = [];
  const statements: Array<Record<string, unknown> & { eps: unknown; id: string; sharesOutstanding: unknown; ticker: string; totalDebt: unknown }> = [];
  const metadata: Array<Record<string, unknown> & { financialStatementId: string; field: string }> = [];
  const manualRecords: unknown[] = [];
  const sessions: unknown[] = [];

  const tx = {
    dataSource: {
      upsert: async () => source,
    },
    company: {
      findFirst: async (args: unknown) => {
        const ticker = (args as { where: { ticker: string } }).where.ticker;
        return companies.find((company) => company.ticker === ticker) ?? null;
      },
      create: async (args: unknown) => {
        const data = (args as { data: { ticker: string } }).data;
        const company = { id: `company-${++id}`, ticker: data.ticker };
        companies.push(company);
        return company;
      },
    },
    financialStatement: {
      findFirst: async (args: unknown) => {
        const where = (args as { where: { ticker: string; fiscalYear: number } }).where;
        return statements.find((item) => item.ticker === where.ticker && item.fiscalYear === where.fiscalYear) ?? null;
      },
      create: async (args: unknown) => {
        const data = (args as { data: Record<string, unknown> }).data;
        const statement = {
          eps: data.eps ?? null,
          id: `statement-${++id}`,
          sharesOutstanding: data.sharesOutstanding ?? null,
          totalDebt: data.totalDebt ?? null,
          ...data,
        } as Record<string, unknown> & { eps: unknown; id: string; sharesOutstanding: unknown; ticker: string; totalDebt: unknown };
        statements.push(statement);
        return { id: statement.id };
      },
      update: async (args: unknown) => {
        const { data, where } = args as { data: Record<string, unknown>; where: { id: string } };
        const statement = statements.find((item) => item.id === where.id);
        if (!statement) throw new Error("statement not found");
        Object.assign(statement, data);
        return { id: statement.id };
      },
    },
    financialStatementUnitMetadata: {
      upsert: async (args: unknown) => {
        const input = args as {
          create: Record<string, unknown> & { financialStatementId: string; field: string };
          update: Record<string, unknown>;
          where: { financialStatementId_field: { financialStatementId: string; field: string } };
        };
        const existing = metadata.find(
          (item) =>
            item.financialStatementId === input.where.financialStatementId_field.financialStatementId &&
            item.field === input.where.financialStatementId_field.field,
        );
        if (existing) Object.assign(existing, input.update);
        else metadata.push(input.create);
        return existing ?? input.create;
      },
    },
    manualImportSession: {
      create: async (args: unknown) => {
        sessions.push(args);
        return { id: `session-${++id}` };
      },
    },
    manualImportRecord: {
      create: async (args: unknown) => {
        manualRecords.push(args);
        return args;
      },
    },
  };

  return {
    db: {
      $transaction: async <T>(fn: (transaction: typeof tx) => Promise<T>) => fn(tx),
    },
    state: { manualRecords, metadata, sessions, statements },
  };
};

const originalLocalImportsEnabled = process.env.ATELIER_LOCAL_IMPORTS_ENABLED;

afterEach(() => {
  if (originalLocalImportsEnabled === undefined) delete process.env.ATELIER_LOCAL_IMPORTS_ENABLED;
  else process.env.ATELIER_LOCAL_IMPORTS_ENABLED = originalLocalImportsEnabled;
});

describe("Phase 114 reviewed source records import", () => {
  it("validates the reviewed candidate CSV as nine reviewed records", () => {
    const result = parseReviewedSourceRecordsCsv(csvText());

    expect(result.inputRows).toBe(9);
    expect(result.validRows).toHaveLength(9);
    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows.map((row) => `${row.ticker}:${row.field}`).sort()).toEqual([
      "FPT:eps",
      "FPT:sharesOutstanding",
      "FPT:totalDebt",
      "MWG:eps",
      "MWG:sharesOutstanding",
      "MWG:totalDebt",
      "VNM:eps",
      "VNM:sharesOutstanding",
      "VNM:totalDebt",
    ]);
    expect(result.validRows.every((row) => row.productionApproved === false)).toBe(true);
  });

  it.each([
    ["missing source URL", { sourceUrl: "" }, "missing_source_url"],
    ["missing source label", { sourceLabel: "" }, "missing_source_label"],
    ["missing unit", { unit: "" }, "invalid_unit"],
    ["missing as-of", { asOf: "" }, "missing_or_invalid_as_of"],
    ["missing period", { period: "" }, "missing_period"],
    ["missing data mode", { dataMode: "" }, "data_mode_must_be_research_only"],
    ["production approval attempt", { productionApproved: "true" }, "production_approval_not_allowed"],
    ["sample source", { sourceLabel: "sample_financials" }, "sample_mock_or_test_source_rejected"],
    ["totalDebt using shares unit", { unit: "shares" }, "invalid_unit"],
    ["totalDebt sourced from total liabilities", { sourceLineItem: "Total liabilities" }, "total_debt_source_line_item_cannot_be_total_liabilities"],
  ])("fails closed for %s", (_label, patch, reason) => {
    const result = parseReviewedSourceRecordsCsv(withCsvPatch(patch));

    expect(result.invalidRows[0]?.reasons).toContain(reason);
  });

  it("rejects EPS and sharesOutstanding invalid units", () => {
    const eps = parseReviewedSourceRecordsCsv(withCsvPatch({ field: "eps", unit: "billion_vnd", value: "4944" }));
    const shares = parseReviewedSourceRecordsCsv(
      withCsvPatch({ field: "sharesOutstanding", rawUnit: "shares", unit: "billion_vnd", value: "1471069183" }),
    );

    expect(eps.invalidRows[0]?.reasons).toContain("invalid_unit");
    expect(shares.invalidRows[0]?.reasons).toContain("invalid_unit");
  });

  it("blocks confirmed writes when the local import guard is disabled", async () => {
    delete process.env.ATELIER_LOCAL_IMPORTS_ENABLED;
    const result = await runReviewedSourceRecordImport({
      confirmWrite: true,
      csvText: csvText(),
      databaseUrl: "file:./dev.db",
    });

    expect(result.dryRun).toBe(true);
    expect(result.writtenRows).toBe(0);
    expect(result.errors).toEqual(expect.arrayContaining(["ATELIER_LOCAL_IMPORTS_ENABLED=true is required for confirmed reviewed source record writes."]));
  });

  it("writes reviewed records with per-ticker and per-field audit counts when confirmed", async () => {
    process.env.ATELIER_LOCAL_IMPORTS_ENABLED = "true";
    const { db, state } = createFakeDb();

    const result = await runReviewedSourceRecordImport({
      confirmWrite: true,
      csvText: csvText(),
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(result.dryRun).toBe(false);
    expect(result.inputRows).toBe(9);
    expect(result.validRows).toBe(9);
    expect(result.invalidRows).toBe(0);
    expect(result.writtenRows).toBe(9);
    expect(state.statements).toHaveLength(3);
    expect(state.metadata).toHaveLength(9);
    expect(state.manualRecords).toHaveLength(9);
    expect(result.breakdownByTicker.FPT.writtenRows).toBe(3);
    expect(result.breakdownByField.totalDebt.writtenRows).toBe(3);
  });
});
