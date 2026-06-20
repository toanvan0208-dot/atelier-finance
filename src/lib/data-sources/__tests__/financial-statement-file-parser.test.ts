import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildFinancialStatementCsvDryRun } from "../financial-statement-file-parser";

describe("financial statement CSV dry-run bridge", () => {
  it("parses valid CSV and reuses the dry-run contract behavior", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow",
      "fpt,2024,annual,1000,5000,2000,300",
    ].join("\n"));

    expect(report.status).toBe("completed");
    expect(report.parseStatus).toBe("parsed");
    expect(report.dryRun).toBe(true);
    expect(report.writePlanned).toBe(false);
    expect(report.noDbWrite).toBe(true);
    expect(report.productionApproved).toBe(false);
    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(report.importDryRun.acceptedRows[0]).toMatchObject({
      ticker: "FPT",
      fiscalYear: 2024,
      periodType: "annual",
      revenue: 1000,
      totalAssets: 5000,
      totalEquity: 2000,
      operatingCashFlow: 300,
      productionApproved: false,
    });
  });

  it("keeps missing numeric cells as null through the Phase 39 contract", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,netIncome,totalAssets,totalEquity,operatingCashFlow",
      "FPT,2024,annual,,100,5000,2000,",
    ].join("\n"));

    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(report.importDryRun.acceptedRows[0].revenue).toBeNull();
    expect(report.importDryRun.acceptedRows[0].operatingCashFlow).toBeNull();
    expect(report.importDryRun.acceptedRows[0].missingFields).toEqual(["revenue", "operatingCashFlow"]);
    expect(report.importDryRun.acceptedRows[0].revenue).not.toBe(0);
    expect(report.importDryRun.acceptedRows[0].operatingCashFlow).not.toBe(0);
  });

  it("handles quoted comma numeric cells safely", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow",
      'FPT,2024,annual,"1,234","5,000",2000,300',
    ].join("\n"));

    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(report.importDryRun.acceptedRows[0].revenue).toBe(1234);
    expect(report.importDryRun.acceptedRows[0].totalAssets).toBe(5000);
    expect(report.importDryRun.acceptedRows[0].revenue).not.toBe(0);
  });

  it("warns on unknown headers without shifting known columns", () => {
    const report = buildFinancialStatementCsvDryRun([
      "symbol,year,period,randomColumn,revenue,assets,equity,cfo",
      'fpt,2024,annual,"text, with comma",1000,5000,2000,300',
    ].join("\n"));

    expect(report.parseStatus).toBe("parsed_with_warnings");
    expect(report.unknownHeaders).toEqual(["randomColumn"]);
    expect(report.parseWarnings.join(" ")).toContain("Unknown CSV headers");
    expect(report.importDryRun.acceptedRows[0]).toMatchObject({
      ticker: "FPT",
      fiscalYear: 2024,
      revenue: 1000,
      totalAssets: 5000,
      totalEquity: 2000,
      operatingCashFlow: 300,
    });
  });

  it("warns on missing required headers and lets the dry-run reject rows", () => {
    const report = buildFinancialStatementCsvDryRun([
      "periodType,revenue,totalAssets,totalEquity",
      "annual,1000,5000,2000",
    ].join("\n"));

    expect(report.parseStatus).toBe("parsed_with_warnings");
    expect(report.parseWarnings.join(" ")).toContain("Missing required CSV header: ticker");
    expect(report.parseWarnings.join(" ")).toContain("Missing required CSV header: fiscalYear");
    expect(report.importDryRun.acceptedCount).toBe(0);
    expect(report.importDryRun.rejectedCount).toBe(1);
    expect(report.importDryRun.rejectedRows[0].invalidFields).toEqual(["ticker", "fiscalYear"]);
  });

  it("reports duplicate rows through the Phase 39 dry-run contract", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow",
      "FPT,2024,annual,1000,5000,2000,300",
      "fpt,2024,year,1100,5100,2100,320",
    ].join("\n"));

    expect(report.status).toBe("completed_with_rejections");
    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(report.importDryRun.skippedCount).toBe(1);
    expect(report.importDryRun.skippedRows[0].duplicateKey).toBe("FPT|2024|annual|none");
  });

  it("blocks production approval attempts from CSV output", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow,productionApproved",
      "FPT,2024,annual,1000,5000,2000,300,true",
    ].join("\n"));

    expect(report.productionApproved).toBe(false);
    expect(report.importDryRun.productionApproved).toBe(false);
    expect(report.importDryRun.acceptedRows[0].productionApproved).toBe(false);
    expect(report.importDryRun.acceptedRows[0].warnings.join(" ")).toContain("ignored");
    expect(JSON.stringify(report)).not.toContain('"productionApproved":true');
  });

  it("keeps quoted delimiter text intact in mapped source labels", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,totalAssets,totalEquity,operatingCashFlow,sourceLabel",
      'FPT,2024,annual,1000,5000,2000,300,"manual, local review"',
    ].join("\n"));

    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(report.importDryRun.acceptedRows[0].sourceLabel).toBe("manual, local review");
  });

  it("fails parse without running import validation for malformed quotes", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue",
      'FPT,2024,annual,"1000',
    ].join("\n"));

    expect(report.status).toBe("parse_failed");
    expect(report.parseStatus).toBe("failed");
    expect(report.parseErrors.join(" ")).toContain("unterminated");
    expect(report.importDryRun.acceptedCount).toBe(0);
    expect(report.noDbWrite).toBe(true);
  });

  it("does not emit investment action wording in report output or parser source", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType",
      "FPT,2024,annual",
    ].join("\n"));
    const source = readFileSync(
      join(process.cwd(), "src/lib/data-sources/financial-statement-file-parser.ts"),
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
