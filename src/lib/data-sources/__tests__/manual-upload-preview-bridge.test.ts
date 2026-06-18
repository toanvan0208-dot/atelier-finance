import { describe, expect, it } from "vitest";

import { buildManualUploadPreview } from "../index";

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

const previewForRows = (
  rows: Array<Record<string, string | null | undefined>>,
  options: Parameters<typeof buildManualUploadPreview>[0]["options"] = { mode: "thesis_verification" },
) => buildManualUploadPreview({ kind: "rows", rows, options });

describe("manual upload preview bridge", () => {
  it("builds preview from a usable row", () => {
    const result = previewForRows([baseRow]);

    expect(result.report).toBeDefined();
    expect(result.markdownReport).toContain("# Manual Upload Validation Report");
    expect(result.selectedRecord?.rowIndex).toBe(1);
    expect(result.financialsPreview.input?.logicInput.netProfit).toBe(200000);
    expect(["ready", "needs_review", "insufficient_data"]).toContain(result.financialsPreview.readiness);
    expect(["ready", "needs_review", "insufficient_data"]).toContain(result.valuationPreview.readiness);
  });

  it("does not choose automatically when multiple records have no target", () => {
    const result = previewForRows([
      baseRow,
      { ...baseRow, ticker: "HPG", period: "2024Q4", asOf: "2025-02-01" },
    ]);

    expect(result.selectedRecord).toBeNull();
    expect(result.status).toBe("needs_review");
    expect(result.availableRecords).toHaveLength(2);
    expect(result.diagnostics.unmatchedTargetReason).toContain("Multiple valid records");
  });

  it("selects targetTicker and targetPeriod match", () => {
    const result = previewForRows(
      [
        baseRow,
        { ...baseRow, ticker: "HPG", period: "2024Q4", asOf: "2025-02-01" },
      ],
      { mode: "thesis_verification", targetTicker: "HPG", targetPeriod: "2024Q4" },
    );

    expect(result.selectedRecord?.financialStatement?.ticker).toBe("HPG");
    expect(result.diagnostics.selectedRowIndex).toBe(2);
  });

  it("returns not ready when target does not match", () => {
    const result = previewForRows([baseRow], {
      mode: "thesis_verification",
      targetTicker: "AAA",
      targetPeriod: "2024Q4",
    });

    expect(result.selectedRecord).toBeNull();
    expect(result.status).toBe("not_ready");
    expect(result.diagnostics.unmatchedTargetReason).toContain("No record matches");
  });

  it("warns on duplicate match and selects first row", () => {
    const result = previewForRows(
      [baseRow, { ...baseRow, revenue: "2000000", asOf: "2025-02-01" }],
      { mode: "thesis_verification", targetTicker: "FPT", targetPeriod: "2024Q4" },
    );

    expect(result.selectedRecord?.rowIndex).toBe(1);
    expect(result.financialsPreview.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "DUPLICATE_TARGET_MATCH" }),
      ]),
    );
  });

  it("keeps missing operating cash flow as null and warns financials preview", () => {
    const result = previewForRows([{ ...baseRow, operatingCashFlow: "N/A" }]);

    expect(result.selectedRecord?.financialStatement?.operatingCashFlow).toBeNull();
    expect(result.financialsPreview.readiness).toBe("needs_review");
    expect(result.financialsPreview.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OPERATING_CASH_FLOW_MISSING" }),
      ]),
    );
  });

  it("does not calculate asset-denominator ratios when totalAssets is zero", () => {
    const result = previewForRows([{ ...baseRow, totalAssets: "0" }]);

    expect(result.financialsPreview.input?.contractMetrics.roa.value).toBeNull();
    expect(result.financialsPreview.input?.contractMetrics.roa.status).toBe("insufficient_data");
    expect(["insufficient_data", "not_ready"]).toContain(result.financialsPreview.readiness);
  });

  it("keeps P/E not applicable when EPS is not positive", () => {
    const result = previewForRows([{ ...baseRow, eps: "0" }]);

    expect(result.valuationPreview.input?.contractMetrics.peInterpretation.interpretation).toBe("not_applicable");
    expect(result.valuationPreview.input?.moduleMetrics.peRatio.value).toBeNull();
  });

  it("keeps P/B/BVPS/ROE not applicable when equity is not positive", () => {
    const result = previewForRows([{ ...baseRow, totalEquity: "0" }]);

    expect(result.valuationPreview.input?.contractMetrics.equityInterpretation.interpretation).toBe("not_applicable");
    expect(result.valuationPreview.input?.moduleMetrics.pbRatio.value).toBeNull();
    expect(result.valuationPreview.input?.moduleMetrics.bvps.value).toBeNull();
    expect(result.valuationPreview.input?.moduleMetrics.roe.value).toBeNull();
  });

  it("marks valuation preview not ready when closePrice is missing", () => {
    const result = previewForRows([{ ...baseRow, closePrice: "" }]);

    expect(result.valuationPreview.readiness).toBe("not_ready");
    expect(result.valuationPreview.blockedReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("closePrice"),
      ]),
    );
  });

  it("does not derive marketCap when sharesOutstanding is missing", () => {
    const result = previewForRows([{ ...baseRow, sharesOutstanding: "0" }]);

    expect(result.selectedRecord?.valuationInput?.marketCap).toBeNull();
    expect(result.valuationPreview.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SHARES_OUTSTANDING_MISSING" }),
      ]),
    );
  });

  it("keeps non-VND currency as needs review and does not convert", () => {
    const result = previewForRows([{ ...baseRow, currency: "USD" }]);

    expect(result.status).toBe("needs_review");
    expect(result.report.categoryCounts.non_vnd_currency).toBeGreaterThan(0);
  });

  it("keeps invalid asOf out of ready preview", () => {
    const result = previewForRows([{ ...baseRow, asOf: "bad-date" }]);

    expect(result.status).toBe("failed");
    expect(result.report.categoryCounts.invalid_date).toBeGreaterThan(0);
    expect(result.selectedRecord).toBeNull();
  });

  it("fails quoted CSV with parser limitation report", () => {
    const result = buildManualUploadPreview({
      kind: "csv",
      csvText: "ticker,period\n\"FPT\",2024Q4",
      options: { mode: "thesis_verification" },
    });

    expect(result.status).toBe("failed");
    expect(result.report.categoryCounts.parser_limitation).toBeGreaterThan(0);
  });

  it("includes markdown report and avoids forbidden wording", () => {
    const result = previewForRows([{ ...baseRow, eps: "0", totalEquity: "0" }]);
    const forbidden = /(nên mua|nên bán|nên nắm giữ|tín hiệu mua|tín hiệu bán|cổ phiếu an toàn|chắc chắn rẻ|chắc chắn xấu)/i;

    expect(result.markdownReport).toContain("# Manual Upload Validation Report");
    expect(result.markdownReport).not.toMatch(forbidden);
  });
});

