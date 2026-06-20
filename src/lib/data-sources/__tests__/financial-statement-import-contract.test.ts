import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildFinancialStatementImportDryRun } from "../financial-statement-import-contract";
import { buildControlledValuationIntegrationBoundary } from "@/features/valuation/lib/controlled-valuation-integration-boundary";

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

  it("captures valid explicit unit metadata for import-owned fields", () => {
    const report = buildFinancialStatementImportDryRun([
      {
        ticker: "FPT",
        fiscalYear: 2025,
        periodType: "annual",
        revenue: "100",
        revenueUnit: "million_vnd",
        netIncome: "10",
        netIncomeUnit: "million_vnd",
        operatingCashFlow: "15",
        operatingCashFlowUnit: "million_vnd",
        totalAssets: "200",
        totalAssetsUnit: "million_vnd",
        totalDebt: "50",
        totalDebtUnit: "million_vnd",
        totalEquity: "80",
        equityUnit: "million_vnd",
        currentAssets: "70",
        currentAssetsUnit: "million_vnd",
        currentLiabilities: "30",
        currentLiabilitiesUnit: "million_vnd",
        eps: "1000",
        epsUnit: "vnd_per_share",
        sharesOutstanding: "100",
        sharesOutstandingUnit: "million_shares",
      },
    ]);

    expect(report.acceptedCount).toBe(1);
    expect(report.rejectedCount).toBe(0);
    expect(report.acceptedRows[0].unitMetadata.revenue).toMatchObject({
      productionApproved: false,
      status: "explicit",
      unit: "million_vnd",
    });
    expect(report.acceptedRows[0].unitMetadata.eps.unit).toBe("vnd_per_share");
    expect(report.acceptedRows[0].unitMetadata.sharesOutstanding.unit).toBe("million_shares");
    expect(report.acceptedRows[0].unitMetadata.totalDebt.status).toBe("explicit");
    expect(report.productionApproved).toBe(false);
  });

  it("rejects rows with invalid explicit unit metadata", () => {
    const report = buildFinancialStatementImportDryRun([
      { ticker: "FPT", fiscalYear: 2025, periodType: "annual", revenue: "100", revenueUnit: "usd" },
      { ticker: "MWG", fiscalYear: 2025, periodType: "annual", eps: "1000", epsUnit: "million_vnd" },
      {
        ticker: "VCB",
        fiscalYear: 2025,
        periodType: "annual",
        sharesOutstanding: "100",
        sharesOutstandingUnit: "vnd",
      },
    ]);

    expect(report.acceptedCount).toBe(0);
    expect(report.rejectedCount).toBe(3);
    expect(report.rejectedRows[0].invalidFields).toContain("revenueUnit");
    expect(report.rejectedRows[1].invalidFields).toContain("epsUnit");
    expect(report.rejectedRows[2].invalidFields).toContain("sharesOutstandingUnit");
    expect(report.errors.join(" ")).toContain("not accepted by the Financials unit contract");
  });

  it("keeps present values with missing units as unknown without guessing magnitude", () => {
    const report = buildFinancialStatementImportDryRun([
      {
        ticker: "FPT",
        fiscalYear: 2025,
        periodType: "annual",
        revenue: "1000000000000",
        totalEquity: "200",
      },
    ]);

    expect(report.acceptedCount).toBe(1);
    expect(report.acceptedRows[0].unitMetadata.revenue).toMatchObject({
      status: "unknown_unit",
      unit: "unknown",
      warnings: ["revenue_financials_unit_metadata_missing"],
    });
    expect(report.acceptedRows[0].unitMetadata.equity.status).toBe("unknown_unit");
    expect(report.acceptedRows[0].unitMetadata.revenue.unit).not.toBe("billion_vnd");
    expect(report.warnings.join(" ")).toContain("revenue_financials_unit_metadata_missing");
  });

  it("keeps missing value null when a unit is provided for that field", () => {
    const report = buildFinancialStatementImportDryRun([
      {
        ticker: "FPT",
        fiscalYear: 2025,
        periodType: "annual",
        revenue: "",
        revenueUnit: "million_vnd",
      },
    ]);

    expect(report.acceptedCount).toBe(1);
    expect(report.acceptedRows[0].revenue).toBeNull();
    expect(report.acceptedRows[0].revenue).not.toBe(0);
    expect(report.acceptedRows[0].unitMetadata.revenue.status).toBe("missing");
    expect(report.acceptedRows[0].warnings).toContain("revenue_unit_provided_for_missing_value");
  });

  it("can hand explicit import units to Valuation while unknown units remain blocked", () => {
    const explicit = buildFinancialStatementImportDryRun([
      {
        ticker: "FPT",
        fiscalYear: 2025,
        periodType: "annual",
        revenue: "100",
        revenueUnit: "million_vnd",
        totalEquity: "200",
        equityUnit: "million_vnd",
        eps: "1000",
        epsUnit: "vnd_per_share",
        sharesOutstanding: "10",
        sharesOutstandingUnit: "million_shares",
      },
    ]).acceptedRows[0];
    const explicitValuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        equity: explicit.totalEquity,
        eps: explicit.eps,
        revenue: explicit.revenue,
        sharesOutstanding: explicit.sharesOutstanding,
        units: {
          equity: explicit.unitMetadata.equity.unit,
          eps: explicit.unitMetadata.eps.unit,
          revenue: explicit.unitMetadata.revenue.unit,
          sharesOutstanding: explicit.unitMetadata.sharesOutstanding.unit,
        },
      },
      persistedValuationInputs: { marketPrice: 50_000, units: { marketPrice: "vnd_per_share" } },
    });
    const unknown = buildFinancialStatementImportDryRun([
      { ticker: "FPT", fiscalYear: 2025, periodType: "annual", totalEquity: "200" },
    ]).acceptedRows[0];
    const unknownValuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        equity: unknown.totalEquity,
        units: { equity: unknown.unitMetadata.equity.unit },
      },
      persistedValuationInputs: { marketPrice: 50_000, units: { marketPrice: "vnd_per_share" } },
    });

    expect(explicitValuation.selectedInputs.equity.normalizationStatus).toBe("ready");
    expect(explicitValuation.calculation.metrics.pe.status).toBe("ready");
    expect(explicitValuation.calculation.metrics.bvps.status).toBe("ready");
    expect(unknownValuation.selectedInputs.equity.normalizationStatus).toBe("unknown_unit");
    expect(unknownValuation.calculation.metrics.bvps.status).toBe("insufficient_data");
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
        [approvalFlag]: "true",
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
