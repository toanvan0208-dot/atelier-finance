import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildFinancialStatementImportDryRun } from "../financial-statement-import-contract";

describe("financial statement import dry-run contract", () => {
  it("normalizes valid rows without planning any write", () => {
    const report = buildFinancialStatementImportDryRun([
      {
        ticker: " fpt ",
        fiscalYear: "2025",
        fiscalQuarter: "",
        periodType: "annual",
        statementDate: "2026-03-31",
        currency: " vnd ",
        revenue: "1,000",
        grossProfit: "300",
        operatingIncome: "200",
        netIncome: "-50",
        totalAssets: "2500",
        totalLiabilities: "900",
        totalEquity: "1600",
        operatingCashFlow: "-25",
        sharesOutstanding: "100",
        eps: "-5",
      },
    ]);

    expect(report).toMatchObject({
      status: "completed",
      dryRun: true,
      writePlanned: false,
      noDbWrite: true,
      productionApproved: false,
      normalizedCount: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      skippedCount: 0,
    });
    expect(report.acceptedRows[0]).toMatchObject({
      ticker: "FPT",
      fiscalYear: 2025,
      fiscalQuarter: null,
      periodType: "annual",
      statementDate: "2026-03-31",
      currency: "VND",
      revenue: 1000,
      grossProfit: 300,
      operatingIncome: 200,
      netIncome: -50,
      totalAssets: 2500,
      totalLiabilities: 900,
      totalEquity: 1600,
      operatingCashFlow: -25,
      sharesOutstanding: 100,
      eps: -5,
      sourceLabel: "user_provided_local_research",
      dataMode: "research_only",
      productionApproved: false,
      missingFields: [],
      rowIndex: 0,
      sourceRowNumber: 1,
    });
  });

  it("keeps missing numeric cells as null and records review fields", () => {
    const report = buildFinancialStatementImportDryRun([
      {
        ticker: "FPT",
        fiscalYear: 2025,
        periodType: "annual",
        revenue: "",
        netIncome: "10",
        totalAssets: "100",
        totalEquity: "40",
      },
    ]);

    expect(report.acceptedCount).toBe(1);
    expect(report.acceptedRows[0].revenue).toBeNull();
    expect(report.acceptedRows[0].operatingCashFlow).toBeNull();
    expect(report.acceptedRows[0].missingFields).toEqual(["revenue", "operatingCashFlow"]);
    expect(report.acceptedRows[0].revenue).not.toBe(0);
    expect(report.acceptedRows[0].operatingCashFlow).not.toBe(0);
  });

  it("rejects invalid ticker and fiscal year without accepting the rows", () => {
    const approvalFlag = "productionApproved";
    const report = buildFinancialStatementImportDryRun([
      { ticker: "", fiscalYear: 2025, periodType: "annual", [approvalFlag]: true },
      { ticker: "FPT", fiscalYear: "20x5", periodType: "annual" },
    ]);

    expect(report.status).toBe("failed");
    expect(report.acceptedCount).toBe(0);
    expect(report.rejectedCount).toBe(2);
    expect(report.rejectedRows[0].invalidFields).toContain("ticker");
    expect(report.rejectedRows[1].invalidFields).toContain("fiscalYear");
    expect(report.rejectedRows[0].rawRow.productionApproved).toBe(false);
    expect(JSON.stringify(report)).not.toContain('"productionApproved":true');
  });

  it("blocks production approval from passing through accepted output", () => {
    const approvalFlag = "productionApproved";
    const report = buildFinancialStatementImportDryRun([
      {
        ticker: "FPT",
        fiscalYear: 2025,
        periodType: "annual",
        revenue: "100",
        netIncome: "10",
        totalAssets: "200",
        totalEquity: "80",
        operatingCashFlow: "15",
        [approvalFlag]: true,
      },
    ]);

    expect(report.productionApproved).toBe(false);
    expect(report.sourceSummary.productionApproved).toBe(false);
    expect(report.acceptedRows[0].productionApproved).toBe(false);
    expect(report.acceptedRows[0].warnings.join(" ")).toContain("ignored");
    expect(JSON.stringify(report)).not.toContain('"productionApproved":true');
  });

  it("skips duplicate rows by ticker, fiscal year, period type, and quarter", () => {
    const report = buildFinancialStatementImportDryRun([
      { ticker: "FPT", fiscalYear: 2025, fiscalQuarter: 1, periodType: "quarterly" },
      { ticker: " fpt ", fiscalYear: "2025", fiscalQuarter: "1", periodType: "quarter" },
    ]);

    expect(report.status).toBe("completed_with_rejections");
    expect(report.acceptedCount).toBe(1);
    expect(report.skippedCount).toBe(1);
    expect(report.skippedRows[0].duplicateKey).toBe("FPT|2025|quarterly|1");
    expect(report.warnings.join(" ")).toContain("Duplicate");
  });

  it("rejects invalid numeric text and disallowed negative balances", () => {
    const report = buildFinancialStatementImportDryRun([
      { ticker: "FPT", fiscalYear: 2025, periodType: "annual", revenue: "abc" },
      { ticker: "MWG", fiscalYear: 2025, periodType: "annual", totalAssets: "-1" },
      { ticker: "VCB", fiscalYear: 2025, periodType: "annual", sharesOutstanding: "-100" },
    ]);

    expect(report.acceptedCount).toBe(0);
    expect(report.rejectedCount).toBe(3);
    expect(report.rejectedRows[0].invalidFields).toContain("revenue");
    expect(report.rejectedRows[1].invalidFields).toContain("totalAssets");
    expect(report.rejectedRows[2].invalidFields).toContain("sharesOutstanding");
  });

  it("validates annual and quarterly period rules", () => {
    const report = buildFinancialStatementImportDryRun([
      { ticker: "FPT", fiscalYear: 2025, fiscalQuarter: "", periodType: "annual" },
      { ticker: "MWG", fiscalYear: 2025, fiscalQuarter: "4", periodType: "quarterly" },
      { ticker: "VCB", fiscalYear: 2025, fiscalQuarter: "5", periodType: "quarterly" },
    ]);

    expect(report.acceptedCount).toBe(2);
    expect(report.rejectedCount).toBe(1);
    expect(report.acceptedRows[0].fiscalQuarter).toBeNull();
    expect(report.acceptedRows[1].fiscalQuarter).toBe(4);
    expect(report.rejectedRows[0].invalidFields).toContain("fiscalQuarter");
  });

  it("keeps the dry-run module pure and disconnected from DB persistence APIs", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/data-sources/financial-statement-import-contract.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["'].*database|prisma|financialStatement\.(create|update|upsert)|\$transaction/);
  });

  it("does not emit investment action wording in report output", () => {
    const report = buildFinancialStatementImportDryRun([
      { ticker: "FPT", fiscalYear: 2025, periodType: "annual" },
    ]);
    const output = JSON.stringify(report).toLowerCase();
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
