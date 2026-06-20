import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import { buildFinancialStatementLocalFileDryRun } from "../financial-statement-local-file-dry-run";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "atelier-fs-dry-run-"));
  tempDirs.push(dir);
  return dir;
};

const writeTempFile = async (name: string, text: string): Promise<string> => {
  const dir = await makeTempDir();
  const filePath = join(dir, name);
  await writeFile(filePath, text, "utf8");
  return filePath;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("financial statement local file dry-run wrapper", () => {
  it("reads a valid local CSV temp file and returns dry-run output", async () => {
    const filePath = await writeTempFile("financials.csv", [
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow",
      "fpt,2024,annual,1000,5000,2000,300",
    ].join("\n"));

    const report = await buildFinancialStatementLocalFileDryRun({ filePath });

    expect(report.status).toBe("completed");
    expect(report.dryRun).toBe(true);
    expect(report.writePlanned).toBe(false);
    expect(report.noDbWrite).toBe(true);
    expect(report.productionApproved).toBe(false);
    expect(report.file.readStatus).toBe("read");
    expect(report.csvDryRun?.importDryRun.acceptedCount).toBe(1);
    expect(report.csvDryRun?.importDryRun.acceptedRows[0]).toMatchObject({
      ticker: "FPT",
      fiscalYear: 2024,
      productionApproved: false,
    });
  });

  it("keeps missing numeric cells as null through the dry-run chain", async () => {
    const filePath = await writeTempFile("financials.csv", [
      "ticker,fiscalYear,periodType,revenue,netIncome,totalAssets,totalEquity,operatingCashFlow",
      "FPT,2024,annual,,100,5000,2000,",
    ].join("\n"));

    const report = await buildFinancialStatementLocalFileDryRun({ filePath });
    const row = report.csvDryRun?.importDryRun.acceptedRows[0];

    expect(row?.revenue).toBeNull();
    expect(row?.operatingCashFlow).toBeNull();
    expect(row?.missingFields).toEqual(["revenue", "operatingCashFlow"]);
    expect(row?.revenue).not.toBe(0);
    expect(row?.operatingCashFlow).not.toBe(0);
  });

  it("rejects unsupported Excel and PDF extensions before parsing", async () => {
    const xlsxPath = await writeTempFile("financials.xlsx", "not an excel parser");
    const pdfPath = await writeTempFile("financials.pdf", "not a pdf parser");

    const xlsx = await buildFinancialStatementLocalFileDryRun({ filePath: xlsxPath });
    const pdf = await buildFinancialStatementLocalFileDryRun({ filePath: pdfPath });

    expect(xlsx.status).toBe("file_validation_failed");
    expect(xlsx.errors.join(" ")).toContain("unsupported_file_type");
    expect(xlsx.errors.join(" ")).toContain("Excel/PDF not supported");
    expect(xlsx.csvDryRun).toBeNull();
    expect(pdf.status).toBe("file_validation_failed");
    expect(pdf.errors.join(" ")).toContain("unsupported_file_type");
    expect(pdf.csvDryRun).toBeNull();
  });

  it("rejects remote URLs without fetching", async () => {
    const report = await buildFinancialStatementLocalFileDryRun({
      filePath: "https://example.com/financials.csv",
    });

    expect(report.status).toBe("file_validation_failed");
    expect(report.errors).toContain("remote_url_rejected");
    expect(report.csvDryRun).toBeNull();
    expect(report.noDbWrite).toBe(true);
  });

  it("rejects files above maxBytes before parsing content", async () => {
    const filePath = await writeTempFile("financials.csv", [
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow",
      "FPT,2024,annual,1000,5000,2000,300",
    ].join("\n"));

    const report = await buildFinancialStatementLocalFileDryRun({ filePath, maxBytes: 8 });

    expect(report.status).toBe("file_validation_failed");
    expect(report.errors.join(" ")).toContain("file_too_large");
    expect(report.csvDryRun).toBeNull();
  });

  it("handles missing files safely", async () => {
    const dir = await makeTempDir();
    const report = await buildFinancialStatementLocalFileDryRun({
      filePath: join(dir, "missing.csv"),
    });

    expect(report.status).toBe("file_read_failed");
    expect(report.errors.join(" ")).toContain("file_stat_failed");
    expect(report.csvDryRun).toBeNull();
  });

  it("handles empty and header-only files without DB writes", async () => {
    const emptyFile = await writeTempFile("empty.csv", "");
    const headerOnlyFile = await writeTempFile("header-only.csv", "ticker,fiscalYear,periodType");

    const empty = await buildFinancialStatementLocalFileDryRun({ filePath: emptyFile });
    const headerOnly = await buildFinancialStatementLocalFileDryRun({ filePath: headerOnlyFile });

    expect(empty.status).toBe("parse_failed");
    expect(empty.csvDryRun?.parseErrors.join(" ")).toContain("empty");
    expect(headerOnly.status).toBe("completed");
    expect(headerOnly.csvDryRun?.rowCount).toBe(0);
    expect(headerOnly.noDbWrite).toBe(true);
  });

  it("rejects paths outside baseDir", async () => {
    const baseDir = await makeTempDir();
    const outsidePath = await writeTempFile("outside.csv", "ticker,fiscalYear,periodType\nFPT,2024,annual");

    const report = await buildFinancialStatementLocalFileDryRun({
      filePath: outsidePath,
      baseDir,
    });

    expect(report.status).toBe("file_validation_failed");
    expect(report.errors).toContain("outside_base_dir");
    expect(report.csvDryRun).toBeNull();
  });

  it("blocks production approval attempts from local CSV output", async () => {
    const filePath = await writeTempFile("financials.csv", [
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow,productionApproved",
      "FPT,2024,annual,1000,5000,2000,300,true",
    ].join("\n"));

    const report = await buildFinancialStatementLocalFileDryRun({ filePath });

    expect(report.productionApproved).toBe(false);
    expect(report.csvDryRun?.productionApproved).toBe(false);
    expect(report.csvDryRun?.importDryRun.acceptedRows[0].productionApproved).toBe(false);
    expect(JSON.stringify(report)).not.toContain('"productionApproved":true');
  });

  it("does not wire database persistence APIs in the local file module", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/data-sources/financial-statement-local-file-dry-run.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/prisma|financialStatement\.(create|update|upsert)|\$transaction/);
  });

  it("does not emit investment action wording in report output or wrapper source", async () => {
    const filePath = await writeTempFile("financials.csv", "ticker,fiscalYear,periodType\nFPT,2024,annual");
    const report = await buildFinancialStatementLocalFileDryRun({ filePath });
    const source = readFileSync(
      join(process.cwd(), "src/lib/data-sources/financial-statement-local-file-dry-run.ts"),
      "utf8",
    );
    const output = `${JSON.stringify(report)} ${source}`.toLowerCase();
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
