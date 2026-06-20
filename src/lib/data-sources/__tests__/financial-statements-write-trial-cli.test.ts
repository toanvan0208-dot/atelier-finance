import { describe, expect, it } from "vitest";

import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { NormalizedFinancialStatementImportRow } from "../financial-statement-import-contract";
import type { FinancialStatementLocalFileDryRunReport } from "../financial-statement-local-file-dry-run";
import type { FinancialStatementLocalWriteTrialReport } from "../financial-statement-local-write-service";
import {
  formatFinancialStatementWriteTrialSummary,
  parseFinancialStatementWriteTrialArgs,
  runFinancialStatementWriteTrialCli,
} from "../../../../scripts/financial-statements-write-trial";

const acceptedRow = (): NormalizedFinancialStatementImportRow => ({
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
  sourceLabel: "phase45_cli_test",
  dataMode: "research_only",
  productionApproved: false,
  unitMetadata: buildFinancialsUnitMetadata(),
  missingFields: [],
  warnings: [],
  rowIndex: 0,
  sourceRowNumber: 1,
});

const dryRunReport = (rows: NormalizedFinancialStatementImportRow[] = [acceptedRow()]): FinancialStatementLocalFileDryRunReport => ({
  status: "completed",
  dryRun: true,
  writePlanned: false,
  noDbWrite: true,
  productionApproved: false,
  file: {
    filePath: "./tmp.csv",
    safeDisplayPath: "./tmp.csv",
    fileName: "tmp.csv",
    extension: ".csv",
    sizeBytes: 128,
    readStatus: "read",
  },
  csvDryRun: {
    status: "completed",
    parseStatus: "parsed",
    dryRun: true,
    writePlanned: false,
    noDbWrite: true,
    productionApproved: false,
    fileName: "tmp.csv",
    delimiter: ",",
    detectedHeaders: ["ticker", "fiscalYear"],
    unknownHeaders: [],
    rowCount: rows.length,
    parse: {
      status: "parsed",
      rowCount: rows.length,
      detectedHeaders: ["ticker", "fiscalYear"],
      unknownHeaders: [],
      errors: [],
      warnings: [],
      fileName: "tmp.csv",
      delimiter: ",",
    },
    parseWarnings: [],
    parseErrors: [],
    importDryRun: {
      status: "completed",
      dryRun: true,
      writePlanned: false,
      noDbWrite: true,
      productionApproved: false,
      dataMode: "research_only",
      normalizedCount: rows.length,
      acceptedCount: rows.length,
      rejectedCount: 0,
      skippedCount: 0,
      warnings: [],
      errors: [],
      acceptedRows: rows,
      rejectedRows: [],
      skippedRows: [],
      sourceSummary: {
        sourceLabel: "phase45_cli_test",
        dataMode: "research_only",
        productionApproved: false,
        rowCount: rows.length,
        acceptedTickers: rows.map((row) => row.ticker),
      },
    },
  },
  warnings: [],
  errors: [],
});

const writeReport = (): FinancialStatementLocalWriteTrialReport => ({
  status: "write_completed",
  dryRun: false,
  writePlanned: false,
  writeExecuted: true,
  noDbWrite: false,
  insertedCount: 1,
  updatedCount: 0,
  skippedExistingCount: 0,
  rejectedCount: 0,
  warnings: [],
  errors: [],
  sourceLabel: "phase45_cli_test",
  dataMode: "research_only",
  productionApproved: false,
  databaseGuard: {
    accepted: true,
    databaseMode: "local_sqlite_dev",
    safeDatabaseUrlDisplay: "file:./dev.db",
    warnings: [],
    errors: [],
  },
  verificationHint: "verify",
});

const requiredArgs = [
  "--file",
  "./tmp.csv",
  "--source-label",
  "phase45_cli_test",
  "--data-mode",
  "research_only",
  "--confirm-local-research-only",
  "--confirm-no-production-source",
  "--confirm-reviewed-dry-run",
  "--confirm-no-production-database",
];

describe("financial statements write-trial CLI", () => {
  it("rejects missing confirmation flags before dry-run", async () => {
    const result = await runFinancialStatementWriteTrialCli(["--file", "./tmp.csv", "--source-label", "x"], {
      runDryRun: async () => dryRunReport(),
      runWriteTrial: async () => writeReport(),
      databaseUrl: "file:./dev.db",
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--confirm-local-research-only is required");
    expect(result.dryRunReport).toBeNull();
    expect(result.writeReport).toBeNull();
  });

  it("runs dry-run before write trial", async () => {
    const calls: string[] = [];
    const result = await runFinancialStatementWriteTrialCli(requiredArgs, {
      runDryRun: async () => {
        calls.push("dry-run");
        return dryRunReport();
      },
      runWriteTrial: async () => {
        calls.push("write");
        return writeReport();
      },
      databaseUrl: "file:./dev.db",
    });

    expect(result.exitCode).toBe(0);
    expect(calls).toEqual(["dry-run", "write"]);
    expect(result.stdout).toContain("insertedCount: 1");
  });

  it("aborts when dry-run has no accepted rows", async () => {
    const result = await runFinancialStatementWriteTrialCli(requiredArgs, {
      runDryRun: async () => dryRunReport([]),
      runWriteTrial: async () => writeReport(),
      databaseUrl: "file:./dev.db",
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("acceptedRows is empty");
    expect(result.writeReport).toBeNull();
  });

  it("does not print raw CSV in summary output", () => {
    const output = formatFinancialStatementWriteTrialSummary({
      dryRun: dryRunReport(),
      write: writeReport(),
    });

    expect(output).toContain("rejectedRowsWritten: false");
    expect(output).not.toContain("ticker,fiscalYear");
    expect(output).not.toContain("1000,100");
  });

  it("keeps investment action wording out of parser and summary surfaces", () => {
    const parsed = parseFinancialStatementWriteTrialArgs(requiredArgs);
    const output = `${JSON.stringify(parsed)} ${formatFinancialStatementWriteTrialSummary({
      dryRun: dryRunReport(),
      write: writeReport(),
    })}`.toLowerCase();

    const blockedPhrases = [
      ["nen", "mua"],
      ["nen", "ban"],
      ["tin", "hieu", "mua"],
      ["tin", "hieu", "ban"],
      ["diem", "mua"],
    ].map((parts) => parts.join(" "));

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
