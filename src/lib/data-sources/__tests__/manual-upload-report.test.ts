import { describe, expect, it } from "vitest";

import {
  buildManualUploadValidationReport,
  formatManualUploadValidationReport,
  normalizeManualUpload,
} from "../index";

const baseRow = {
  ticker: "FPT",
  period: "2024Q4",
  revenue: "1000000",
  netProfit: "200000",
  totalAssets: "5000000",
  totalEquity: "3000000",
  operatingCashFlow: "150000",
  totalDebt: "1000000",
  currentAssets: "1800000",
  currentLiabilities: "900000",
  eps: "4000",
  bookValuePerShare: "25000",
  sharesOutstanding: "1000000",
  closePrice: "95000",
  volume: "1000000",
  tradingValue: "95000000000",
  companyType: "non_financial",
  source: "manual_upload",
  asOf: "2025-01-31",
  currency: "VND",
};

const reportForRows = (rows: Array<Record<string, string | null | undefined>>) =>
  buildManualUploadValidationReport(normalizeManualUpload({ kind: "rows", rows }));

describe("manual upload validation report", () => {
  it("builds a report from a usable manual upload result", () => {
    const report = reportForRows([baseRow]);

    expect(["pass", "needs_review"]).toContain(report.status);
    expect(report.summary.totalRows).toBe(1);
    expect(report.summary.validRows).toBe(1);
    expect(report.summary.errorRows).toBe(0);
    expect(report.summary.validRatio).toBe(1);
    expect(report.moduleReadiness.financials.status).toBe("ready");
  });

  it("groups missing asOf as an error category", () => {
    const report = reportForRows([{ ...baseRow, asOf: "" }]);

    expect(report.status).toBe("failed");
    expect(report.categoryCounts.missing_as_of).toBeGreaterThan(0);
    expect(report.topIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "missing_as_of", severity: "error" }),
      ]),
    );
  });

  it("groups invalid numbers", () => {
    const report = reportForRows([{ ...baseRow, netProfit: "not-number" }]);

    expect(report.categoryCounts.invalid_number).toBeGreaterThan(0);
    expect(report.topIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "invalid_number", severity: "error" }),
      ]),
    );
  });

  it("treats missing operating cash flow as a warning and not zero", () => {
    const report = reportForRows([{ ...baseRow, operatingCashFlow: "N/A" }]);
    const cfoCoverage = report.fieldCoverage.find((field) => field.fieldName === "operatingCashFlow");

    expect(cfoCoverage?.presentCount).toBe(0);
    expect(cfoCoverage?.missingCount).toBeGreaterThan(0);
    expect(report.topIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ issueCode: "OPERATING_CASH_FLOW_MISSING", severity: "warning" }),
      ]),
    );
  });

  it("reports EPS guardrail without interpreting P/E", () => {
    const report = reportForRows([{ ...baseRow, eps: "0" }]);

    expect(report.categoryCounts.financial_guardrail).toBeGreaterThan(0);
    expect(report.topIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ issueCode: "EPS_NOT_POSITIVE", category: "financial_guardrail" }),
      ]),
    );
  });

  it("reports equity guardrail for ROE/PB/BVPS", () => {
    const report = reportForRows([{ ...baseRow, totalEquity: "0" }]);

    expect(report.categoryCounts.financial_guardrail).toBeGreaterThan(0);
    expect(report.moduleReadiness.valuation.status).toBe("needs_review");
    expect(report.topIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ issueCode: "EQUITY_NOT_POSITIVE", category: "financial_guardrail" }),
      ]),
    );
  });

  it("groups non-VND currency as warning and does not convert silently", () => {
    const report = reportForRows([{ ...baseRow, currency: "USD" }]);

    expect(report.categoryCounts.non_vnd_currency).toBeGreaterThan(0);
    expect(report.topIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "non_vnd_currency", severity: "warning" }),
      ]),
    );
  });

  it("groups unmapped fields and counts coverage", () => {
    const report = reportForRows([{ ...baseRow, unknownColumn: "abc" }]);
    const netIncomeCoverage = report.fieldCoverage.find((field) => field.fieldName === "netIncome");

    expect(report.categoryCounts.unmapped_field).toBeGreaterThan(0);
    expect(report.unmappedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldName: "unknownColumn", count: 1 }),
      ]),
    );
    expect(netIncomeCoverage?.presentCount).toBe(1);
    expect(netIncomeCoverage?.missingCount).toBe(0);
    expect(netIncomeCoverage?.coverageRatio).toBe(1);
  });

  it("marks module readiness conservatively when core fields are missing", () => {
    const report = reportForRows([
      {
        ...baseRow,
        closePrice: "",
        eps: "",
        bookValuePerShare: "",
        volume: "",
        tradingValue: "",
        totalDebt: "",
        currentAssets: "",
        currentLiabilities: "",
      },
    ]);

    expect(["not_ready", "insufficient_data"]).toContain(report.moduleReadiness.valuation.status);
    expect(["not_ready", "insufficient_data"]).toContain(report.moduleReadiness.pvt.status);
    expect(report.moduleReadiness.risk.status).toBe("needs_review");
  });

  it("formats a safe human-readable report without forbidden wording", () => {
    const report = reportForRows([{ ...baseRow, eps: "0", totalEquity: "0" }]);
    const markdown = formatManualUploadValidationReport(report);
    const forbidden = /(nên mua|nên bán|nên nắm giữ|tín hiệu mua|tín hiệu bán|cổ phiếu an toàn|chắc chắn rẻ|chắc chắn xấu)/i;

    expect(markdown).toContain("# Manual Upload Validation Report");
    expect(markdown).toContain("## Module Readiness");
    expect(markdown).not.toMatch(forbidden);
  });

  it("creates failed report for unsupported quoted CSV parser input", () => {
    const adapterResult = normalizeManualUpload({
      kind: "csv",
      csvText: "ticker,period\n\"FPT\",2024Q4",
    });
    const report = buildManualUploadValidationReport(adapterResult);

    expect(report.status).toBe("failed");
    expect(report.severityCounts.critical).toBeGreaterThan(0);
    expect(report.categoryCounts.parser_limitation).toBeGreaterThan(0);
  });
});

