import { describe, it, expect } from "vitest";
import { buildDryRunImport, RawPreviewData } from "../../../../scripts/dry-run-vnm-pdf-reviewed-import";

describe("Phase 139F VNM PDF 2025 dry run import", () => {
  it("normalizes VNM EPS, shares, and totalDebt correctly", () => {
    const raw: RawPreviewData[] = [
      {
        ticker: "VNM",
        field: "eps",
        value: 4070,
        unit: "vnd_per_share",
        status: "preview",
        notes: "Test"
      },
      {
        ticker: "VNM",
        field: "sharesOutstanding",
        value: 2089955445,
        unit: "shares",
        status: "preview",
        notes: "Test"
      },
      {
        ticker: "VNM",
        field: "totalDebt",
        value: 9456645,
        unit: "million_vnd",
        status: "derived_preview",
        notes: "Derived"
      }
    ];

    const result = buildDryRunImport(raw);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({
      ticker: "VNM",
      fiscalYear: 2025,
      periodType: "annual",
      sourceLabel: "annual_report_2025_pdf_reviewed_preview",
      dataMode: "research_only",
      productionApproved: false,
      eps: 4070,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 2089955445,
      sharesOutstandingUnit: "shares",
      totalDebt: 9456.645,
      totalDebtUnit: "billion_vnd",
      status: "derived_preview_import_candidate",
    }));
  });

  it("blocks other tickers like FPT or HPG", () => {
    const raw: RawPreviewData[] = [
      {
        ticker: "FPT",
        field: "eps",
        value: 1000,
        unit: "vnd_per_share",
        status: "preview",
        notes: "Test"
      }
    ];

    const result = buildDryRunImport(raw);
    expect(result).toHaveLength(0);
  });
});
