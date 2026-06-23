import { describe, it, expect } from "vitest";
import { evaluateExtractionSafety } from "../../../../scripts/preview-annual-report-2025-financials";

describe("Phase 139A - PDF Extraction Safety and Provenance", () => {
  it("must preserve productionApproved: false", () => {
    const violations = evaluateExtractionSafety({
      productionApproved: true,
      status: "preview",
      page: "12",
    });
    expect(violations).toContain("productionApproved must remain false for PDF previews.");
  });

  it("must not convert missing values to 0", () => {
    const violations = evaluateExtractionSafety({
      value: 0,
      status: "missing",
    });
    expect(violations).toContain("Missing values must not be converted to 0.");
  });

  it("eps explicit value maps to vnd_per_share", () => {
    const violations = evaluateExtractionSafety({
      field: "eps",
      value: 1200,
      unit: "vnd",
    });
    expect(violations).toContain("EPS unit must be vnd_per_share.");
    
    const valid = evaluateExtractionSafety({
      field: "eps",
      value: 1200,
      unit: "vnd_per_share",
    });
    expect(valid).not.toContain("EPS unit must be vnd_per_share.");
  });

  it("sharesOutstanding maps to shares", () => {
    const violations = evaluateExtractionSafety({
      field: "sharesOutstanding",
      value: 1000000,
      unit: "vnd",
    });
    expect(violations).toContain("sharesOutstanding unit must be shares.");
  });

  it("totalLiabilities is blocked and never maps to totalDebt", () => {
    const violations = evaluateExtractionSafety({
      field: "totalDebt",
      notes: "Derived from total liabilities.",
    });
    expect(violations).toContain("totalLiabilities is blocked and never maps to totalDebt.");
  });

  it("VCB banking caveat blocks unsafe totalDebt mapping", () => {
    const violations = evaluateExtractionSafety({
      field: "totalDebt",
      ticker: "VCB",
      value: 500000,
      notes: "Extracted from balance sheet",
    });
    expect(violations).toContain("VCB banking caveat blocks unsafe totalDebt mapping.");
    
    const valid = evaluateExtractionSafety({
      field: "totalDebt",
      ticker: "VCB",
      value: 500000,
      notes: "Banking caveat: extracted via strictly defined line items.",
    });
    expect(valid).not.toContain("VCB banking caveat blocks unsafe totalDebt mapping.");
  });

  it("missing page provenance prevents reviewed-ready status", () => {
    const violations = evaluateExtractionSafety({
      status: "preview",
      page: null,
    });
    expect(violations).toContain("Missing page provenance prevents reviewed-ready status.");
    
    const valid = evaluateExtractionSafety({
      status: "needs_review",
      page: null,
    });
    expect(valid).not.toContain("Missing page provenance prevents reviewed-ready status.");
  });
});
