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

  it("parses canonical CSV unit columns into accepted row metadata", () => {
    const report = buildFinancialStatementCsvDryRun([
      [
        "ticker",
        "fiscalYear",
        "periodType",
        "revenue",
        "revenue_unit",
        "netIncome",
        "net_income_unit",
        "operatingCashFlow",
        "operating_cash_flow_unit",
        "totalAssets",
        "total_assets_unit",
        "totalDebt",
        "total_debt_unit",
        "totalEquity",
        "equity_unit",
        "currentAssets",
        "current_assets_unit",
        "currentLiabilities",
        "current_liabilities_unit",
        "eps",
        "eps_unit",
        "sharesOutstanding",
        "shares_outstanding_unit",
      ].join(","),
      [
        "FPT",
        "2024",
        "annual",
        "100",
        "million_vnd",
        "10",
        "million_vnd",
        "15",
        "million_vnd",
        "200",
        "million_vnd",
        "50",
        "million_vnd",
        "80",
        "million_vnd",
        "70",
        "million_vnd",
        "30",
        "million_vnd",
        "1000",
        "vnd_per_share",
        "10",
        "million_shares",
      ].join(","),
    ].join("\n"));

    const row = report.importDryRun.acceptedRows[0];

    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(row.unitMetadata.revenue.status).toBe("explicit");
    expect(row.unitMetadata.netIncome.unit).toBe("million_vnd");
    expect(row.unitMetadata.operatingCashFlow.unit).toBe("million_vnd");
    expect(row.unitMetadata.totalAssets.unit).toBe("million_vnd");
    expect(row.unitMetadata.totalDebt.unit).toBe("million_vnd");
    expect(row.unitMetadata.equity.unit).toBe("million_vnd");
    expect(row.unitMetadata.currentAssets.unit).toBe("million_vnd");
    expect(row.unitMetadata.currentLiabilities.unit).toBe("million_vnd");
    expect(row.unitMetadata.eps.unit).toBe("vnd_per_share");
    expect(row.unitMetadata.sharesOutstanding.unit).toBe("million_shares");
  });

  it("parses selected unit aliases without broad guessing", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,revenueUnit,totalEquity,unit_equity,sharesOutstanding,sharesOutstanding_unit",
      "FPT,2024,annual,100,billion_vnd,200,billion_vnd,10,shares",
    ].join("\n"));

    expect(report.importDryRun.acceptedCount).toBe(1);
    expect(report.importDryRun.acceptedRows[0].unitMetadata.revenue.unit).toBe("billion_vnd");
    expect(report.importDryRun.acceptedRows[0].unitMetadata.equity.unit).toBe("billion_vnd");
    expect(report.importDryRun.acceptedRows[0].unitMetadata.sharesOutstanding.unit).toBe("shares");
  });

  it("rejects invalid CSV unit columns while keeping dry-run write flags false", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,revenue_unit,eps,eps_unit,sharesOutstanding,shares_outstanding_unit",
      "FPT,2024,annual,100,usd,1000,million_vnd,10,vnd",
    ].join("\n"));

    expect(report.status).toBe("failed");
    expect(report.importDryRun.acceptedCount).toBe(0);
    expect(report.importDryRun.rejectedCount).toBe(1);
    expect(report.importDryRun.rejectedRows[0].invalidFields).toEqual(
      expect.arrayContaining(["revenueUnit", "epsUnit", "sharesOutstandingUnit"]),
    );
    expect(report.noDbWrite).toBe(true);
    expect(report.writePlanned).toBe(false);
  });

  it("keeps missing CSV units as unknown metadata and preserves large values without guessing", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,totalEquity",
      "FPT,2024,annual,1000000000000,200000000000",
    ].join("\n"));
    const row = report.importDryRun.acceptedRows[0];

    expect(row.unitMetadata.revenue.status).toBe("unknown_unit");
    expect(row.unitMetadata.revenue.unit).toBe("unknown");
    expect(row.unitMetadata.revenue.unit).not.toBe("billion_vnd");
    expect(row.revenue).toBe(1_000_000_000_000);
  });

  it("prints unit metadata in JSON-shaped dry-run results", () => {
    const report = buildFinancialStatementCsvDryRun([
      "ticker,fiscalYear,periodType,revenue,revenue_unit",
      "FPT,2024,annual,100,million_vnd",
    ].join("\n"));
    const parsed = JSON.parse(JSON.stringify(report)) as typeof report;

    expect(parsed.importDryRun.acceptedRows[0].unitMetadata.revenue.unit).toBe("million_vnd");
    expect(parsed.importDryRun.acceptedRows[0].unitMetadata.revenue.productionApproved).toBe(false);
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
