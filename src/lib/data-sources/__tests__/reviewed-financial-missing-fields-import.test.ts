import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { getFinancialStatementSeries } from "../financial-statement-read-service";
import {
  parseReviewedFinancialMissingFieldsCsv,
  runReviewedFinancialMissingFieldsImport,
} from "../reviewed-financial-missing-fields-import";

const csvPath = join(process.cwd(), "docs/product/data/phase116_reviewed_financial_missing_fields.csv");
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
  field: "cashAndEquivalents",
  notes: "Cash and cash equivalents from consolidated balance sheet",
  period: "2024",
  productionApproved: "false",
  rawUnit: "vnd",
  rawValue: "9315440438884",
  reviewStatus: "reviewed_candidate",
  sourceDocumentTitle: "FPT Annual Report 2024",
  sourceLabel: "phase116_reviewed_financial_missing_fields",
  sourceLineItem: "Cash and cash equivalents",
  sourceType: "official_annual_report",
  sourceUrl: "https://fpt.com/annual-report-2024.pdf",
  ticker: "FPT",
  unit: "billion_vnd",
  value: "9315.440438884",
};

const withCsvPatch = (patch: Record<string, string>): string => {
  const row = { ...validRow, ...patch };
  return `${headers.join(",")}\n${headers.map((header) => row[header as keyof typeof row] ?? "").join(",")}\n`;
};

type FakeManualRecord = Record<string, unknown> & {
  dataMode: string;
  financialStatementId: string;
  id: string;
  normalizedPayload: string;
  period: string;
  qualityStatus: string;
  readiness: string;
  sourceLabel: string;
  ticker: string;
};

const createFakeDb = () => {
  const source = { id: "source-116", name: "phase116_reviewed_financial_missing_fields" };
  const statements = [
    { companyId: "company-fpt", dataMode: "research_only", fiscalYear: 2024, id: "statement-fpt", periodType: "year", sourceLabel: "phase109_controlled_local_financials", ticker: "FPT" },
    { companyId: "company-mwg", dataMode: "research_only", fiscalYear: 2024, id: "statement-mwg", periodType: "year", sourceLabel: "phase109_controlled_local_financials", ticker: "MWG" },
    { companyId: "company-vnm", dataMode: "research_only", fiscalYear: 2024, id: "statement-vnm", periodType: "year", sourceLabel: "phase109_controlled_local_financials", ticker: "VNM" },
  ];
  const manualRecords: FakeManualRecord[] = [];
  const sessions: unknown[] = [];
  let id = 0;

  const tx = {
    dataSource: {
      upsert: async () => source,
    },
    financialStatement: {
      findFirst: async (args: unknown) => {
        const where = (args as {
          where: { dataMode: string; fiscalYear: number; periodType: string; sourceLabel: string; ticker: string };
        }).where;
        return statements.find((statement) =>
          statement.ticker === where.ticker &&
          statement.fiscalYear === where.fiscalYear &&
          statement.periodType === where.periodType &&
          statement.sourceLabel === where.sourceLabel &&
          statement.dataMode === where.dataMode,
        ) ?? null;
      },
    },
    manualImportSession: {
      create: async (args: unknown) => {
        sessions.push(args);
        return { id: `session-${++id}` };
      },
    },
    manualImportRecord: {
      findFirst: async (args: unknown) => {
        const where = (args as {
          where: {
            dataMode: string;
            financialStatementId: string;
            normalizedPayload: { contains: string };
            period: string;
            sourceLabel: string;
            ticker: string;
          };
        }).where;
        const existing = manualRecords.find((record) =>
          record.ticker === where.ticker &&
          record.financialStatementId === where.financialStatementId &&
          record.period === where.period &&
          record.sourceLabel === where.sourceLabel &&
          record.dataMode === where.dataMode &&
          record.normalizedPayload.includes(where.normalizedPayload.contains),
        );
        return existing ? { id: existing.id } : null;
      },
      create: async (args: unknown) => {
        const data = (args as { data: Omit<FakeManualRecord, "id"> }).data;
        const record = { id: `manual-${++id}`, ...data } as FakeManualRecord;
        manualRecords.push(record);
        return record;
      },
    },
  };

  return {
    db: {
      $transaction: async <T>(fn: (transaction: typeof tx) => Promise<T>) => fn(tx),
    },
    state: { manualRecords, sessions, statements },
  };
};

const originalLocalImportsEnabled = process.env.ATELIER_LOCAL_IMPORTS_ENABLED;

afterEach(() => {
  if (originalLocalImportsEnabled === undefined) delete process.env.ATELIER_LOCAL_IMPORTS_ENABLED;
  else process.env.ATELIER_LOCAL_IMPORTS_ENABLED = originalLocalImportsEnabled;
});

describe("Phase 116 reviewed financial missing-fields import", () => {
  it("validates the reviewed missing-field CSV as six additive records", () => {
    const result = parseReviewedFinancialMissingFieldsCsv(csvText());

    expect(result.inputRows).toBe(6);
    expect(result.validRows).toHaveLength(6);
    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows.map((row) => `${row.ticker}:${row.field}`).sort()).toEqual([
      "FPT:capitalExpenditure",
      "FPT:cashAndEquivalents",
      "MWG:capitalExpenditure",
      "MWG:cashAndEquivalents",
      "VNM:capitalExpenditure",
      "VNM:cashAndEquivalents",
    ]);
    expect(result.validRows.every((row) => row.productionApproved === false)).toBe(true);
  });

  it.each([
    ["invalid unit", { unit: "million_vnd" }, "invalid_unit"],
    ["production approval attempt", { productionApproved: "true" }, "production_approval_not_allowed"],
    ["sample source", { sourceLabel: "sample_financials" }, "source_label_must_be_phase116"],
    ["cash sourced from current assets", { sourceLineItem: "Current assets" }, "cash_source_line_item_required"],
    ["capex sourced from total liabilities", { field: "capitalExpenditure", sourceLineItem: "Total liabilities", value: "-10" }, "capex_source_line_item_required"],
    ["capex positive sign", { field: "capitalExpenditure", sourceLineItem: "Purchase and construction of fixed assets", value: "10" }, "capex_must_preserve_reported_cash_outflow_negative_sign"],
  ])("fails closed for %s", (_label, patch, reason) => {
    const result = parseReviewedFinancialMissingFieldsCsv(withCsvPatch(patch));

    expect(result.invalidRows[0]?.reasons).toContain(reason);
  });

  it("keeps duplicates invalid inside one CSV", () => {
    const one = headers.map((header) => validRow[header as keyof typeof validRow] ?? "").join(",");
    const result = parseReviewedFinancialMissingFieldsCsv(`${headers.join(",")}\n${one}\n${one}\n`);

    expect(result.validRows).toHaveLength(1);
    expect(result.invalidRows.map((row) => row.reasons)).toEqual([["duplicate_record_key"]]);
  });

  it("writes reviewed records once and skips duplicates without overwrite", async () => {
    process.env.ATELIER_LOCAL_IMPORTS_ENABLED = "true";
    const { db, state } = createFakeDb();

    const first = await runReviewedFinancialMissingFieldsImport({
      confirmWrite: true,
      csvText: csvText(),
      databaseUrl: "file:./dev.db",
      db,
    });
    const second = await runReviewedFinancialMissingFieldsImport({
      confirmWrite: true,
      csvText: csvText(),
      databaseUrl: "file:./dev.db",
      db,
    });

    expect(first.writtenRows).toBe(6);
    expect(first.skippedRows).toBe(0);
    expect(second.writtenRows).toBe(0);
    expect(second.skippedRows).toBe(6);
    expect(state.manualRecords).toHaveLength(6);
    expect(state.manualRecords.every((record) => JSON.parse(record.normalizedPayload).productionApproved === false)).toBe(true);
  });

  it("reads supplemental cash and capex from linked manual DB records without zero-fill", async () => {
    process.env.ATELIER_LOCAL_IMPORTS_ENABLED = "true";
    const { db, state } = createFakeDb();
    await runReviewedFinancialMissingFieldsImport({
      confirmWrite: true,
      csvText: csvText(),
      databaseUrl: "file:./dev.db",
      db,
    });

    const result = await getFinancialStatementSeries(
      { dataMode: "research_only", sourceLabel: "phase109_controlled_local_financials", ticker: "FPT" },
      {
        db: {
          financialStatement: {
            findMany: async () => [
              {
                asOf: new Date("2026-06-22T00:00:00.000Z"),
                collectedAt: new Date("2026-06-22T00:00:00.000Z"),
                currency: "VND",
                currentAssets: 30000,
                currentLiabilities: 17000,
                dataMode: "research_only",
                eps: null,
                errorCodes: "[]",
                equity: 36000,
                fiscalQuarter: null,
                fiscalYear: 2024,
                grossProfit: 24800,
                id: "statement-fpt",
                manualImportRecords: state.manualRecords
                  .filter((record) => record.ticker === "FPT")
                  .map((record) => ({
                    dataMode: record.dataMode,
                    normalizedPayload: record.normalizedPayload,
                    qualityStatus: record.qualityStatus,
                    readiness: record.readiness,
                    sourceLabel: record.sourceLabel,
                  })),
                missingFields: "[]",
                netIncome: 8700,
                operatingCashFlow: 9800,
                period: "2024",
                periodType: "year",
                reportDate: new Date("2026-06-22T00:00:00.000Z"),
                revenue: 62000,
                sharesOutstanding: null,
                sourceLabel: "phase109_controlled_local_financials",
                ticker: "FPT",
                totalAssets: 75000,
                totalDebt: 39000,
                unitMetadata: [],
                warningCodes: "[]",
              },
            ],
          },
        },
      },
    );

    expect(result.records[0]?.values.cashAndEquivalents).toBe(9315.440438884);
    expect(result.records[0]?.values.capitalExpenditure).toBe(-3275.312325702);
    expect(result.records[0]?.values.cashAndEquivalents).not.toBe(0);
    expect(result.records[0]?.values.capitalExpenditure).not.toBe(0);
  });
});
