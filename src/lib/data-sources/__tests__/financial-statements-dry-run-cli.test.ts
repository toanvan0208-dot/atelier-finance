import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { FinancialStatementLocalFileDryRunReport } from "../financial-statement-local-file-dry-run";
import {
  formatFinancialStatementDryRunSummary,
  getFinancialStatementDryRunUsage,
  parseFinancialStatementDryRunArgs,
  runFinancialStatementDryRunCli,
} from "../../../../scripts/financial-statements-dry-run";

const report = (
  patch: Partial<FinancialStatementLocalFileDryRunReport> = {},
): FinancialStatementLocalFileDryRunReport => ({
  status: "completed",
  dryRun: true,
  writePlanned: false,
  noDbWrite: true,
  productionApproved: false,
  file: {
    filePath: "tmp.csv",
    safeDisplayPath: "tmp.csv",
    fileName: "tmp.csv",
    extension: ".csv",
    sizeBytes: 128,
    readStatus: "read",
  },
  warnings: [],
  errors: [],
  csvDryRun: {
    status: "completed",
    parseStatus: "parsed",
    dryRun: true,
    writePlanned: false,
    noDbWrite: true,
    productionApproved: false,
    parseWarnings: [],
    parseErrors: [],
    detectedHeaders: ["ticker", "fiscalYear"],
    unknownHeaders: [],
    rowCount: 1,
    fileName: "tmp.csv",
    delimiter: ",",
    parse: {
      status: "parsed",
      rowCount: 1,
      detectedHeaders: ["ticker", "fiscalYear"],
      unknownHeaders: [],
      warnings: [],
      errors: [],
      fileName: "tmp.csv",
      delimiter: ",",
    },
    importDryRun: {
      status: "completed",
      dryRun: true,
      writePlanned: false,
      noDbWrite: true,
      productionApproved: false,
      dataMode: "research_only",
      normalizedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      skippedCount: 0,
      warnings: [],
      errors: [],
      acceptedRows: [],
      rejectedRows: [],
      skippedRows: [],
      sourceSummary: {
        sourceLabel: "user_file",
        dataMode: "research_only",
        productionApproved: false,
        rowCount: 1,
        acceptedTickers: ["FPT"],
      },
    },
  },
  ...patch,
});

describe("financial statements dry-run CLI", () => {
  it("fails safely and prints usage when --file is missing", async () => {
    const runDryRun = vi.fn();
    const result = await runFinancialStatementDryRunCli([], { runDryRun });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Usage:");
    expect(result.stderr).toContain("file_required");
    expect(runDryRun).not.toHaveBeenCalled();
  });

  it("prints usage for --help without calling dry-run", async () => {
    const runDryRun = vi.fn();
    const result = await runFinancialStatementDryRunCli(["--help"], { runDryRun });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(runDryRun).not.toHaveBeenCalled();
  });

  it("maps valid args into the local file dry-run wrapper options", async () => {
    const runDryRun = vi.fn().mockResolvedValue(report());
    const result = await runFinancialStatementDryRunCli(
      [
        "--file",
        "./tmp.csv",
        "--base-dir",
        "./data",
        "--max-bytes",
        "1000",
        "--source-label",
        "user_file",
        "--data-mode",
        "research_only",
        "--delimiter",
        ",",
      ],
      { runDryRun },
    );

    expect(result.exitCode).toBe(0);
    expect(runDryRun).toHaveBeenCalledWith({
      filePath: "./tmp.csv",
      baseDir: "./data",
      maxBytes: 1000,
      sourceLabel: "user_file",
      dataMode: "research_only",
      delimiter: ",",
    });
    expect(result.stdout).toContain("writePlanned: false");
  });

  it("rejects write-like flags without calling dry-run", async () => {
    const runDryRun = vi.fn();
    const result = await runFinancialStatementDryRunCli(["--file", "./tmp.csv", "--write"], { runDryRun });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("write_not_supported");
    expect(result.stderr).toContain("dry-run only");
    expect(runDryRun).not.toHaveBeenCalled();
  });

  it("formats summary without raw CSV content", () => {
    const summary = formatFinancialStatementDryRunSummary(report());

    expect(summary).toContain("acceptedCount: 1");
    expect(summary).toContain("dryRun: true");
    expect(summary).toContain("writePlanned: false");
    expect(summary).toContain("productionApproved: false");
    expect(summary).not.toContain("FPT,2024,annual");
  });

  it("prints JSON report when --json is passed", async () => {
    const runDryRun = vi.fn().mockResolvedValue(report());
    const result = await runFinancialStatementDryRunCli(["--file", "./tmp.csv", "--json"], { runDryRun });
    const parsed = JSON.parse(result.stdout) as FinancialStatementLocalFileDryRunReport;

    expect(result.exitCode).toBe(0);
    expect(parsed.productionApproved).toBe(false);
    expect(parsed.writePlanned).toBe(false);
    expect(parsed.noDbWrite).toBe(true);
  });

  it("exits zero for completed_with_rejections dry-run validation results", async () => {
    const runDryRun = vi.fn().mockResolvedValue(report({ status: "completed_with_rejections" }));
    const result = await runFinancialStatementDryRunCli(["--file", "./tmp.csv"], { runDryRun });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("status: completed_with_rejections");
  });

  it("exits non-zero for fatal file or parse failures", async () => {
    const runDryRun = vi.fn().mockResolvedValue(report({ status: "file_validation_failed" }));
    const result = await runFinancialStatementDryRunCli(["--file", "./tmp.csv"], { runDryRun });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("status: file_validation_failed");
  });

  it("parses args without enabling write, commit, db, or seed flags", () => {
    const parsed = parseFinancialStatementDryRunArgs(["--file", "./tmp.csv", "--db"]);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.join(" ")).toContain("write_not_supported");
  });

  it("does not import database persistence APIs in the CLI script", () => {
    const source = readFileSync(join(process.cwd(), "scripts/financial-statements-dry-run.ts"), "utf8");

    expect(source).not.toMatch(/prisma|financialStatement\.(create|update|upsert)|\$transaction/);
  });

  it("does not include investment action wording in usage or summary", () => {
    const output = `${getFinancialStatementDryRunUsage()} ${formatFinancialStatementDryRunSummary(report())}`.toLowerCase();
    const unsafeTerms = [
      `n${"en"} ${"mua"}`,
      `n${"en"} ${"ban"}`,
      `tin hieu ${"mua"}`,
      `tin hieu ${"ban"}`,
      `diem ${"mua"}`,
      `co phieu ${"an toan"}`,
      `chac chan ${"re"}`,
      `chac chan ${"xau"}`,
    ];

    for (const term of unsafeTerms) {
      expect(output).not.toContain(term);
    }
  });
});
