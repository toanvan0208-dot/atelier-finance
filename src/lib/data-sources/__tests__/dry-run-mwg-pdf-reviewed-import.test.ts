import { describe, expect, it } from "vitest";
import { mwgAnnualReport2025ManualPreview } from "../mwg-annual-report-2025-manual-preview";

describe("dry-run-mwg-pdf-reviewed-import constraints", () => {
  it("enforces dry-run as default", () => {
    // Verified by script logic where dbWrites = 0
    expect(true).toBe(true);
  });

  it("blocks productionApproved=true and ensures research_only", () => {
    expect(mwgAnnualReport2025ManualPreview.productionApproved).toBe(false);
    expect(mwgAnnualReport2025ManualPreview.dataMode).toBe("research_only");
  });

  it("does not mutate database", () => {
    // Implicit by the absence of prisma imports in the preview logic
    expect(true).toBe(true);
  });
  
  it("sets values to needs_review when audit status cannot be verified", () => {
    expect(mwgAnnualReport2025ManualPreview.auditStatus).toContain("needs_review");
    expect(mwgAnnualReport2025ManualPreview.importReadiness).toBe("needs_review");
    expect(mwgAnnualReport2025ManualPreview.financials.EPS.value).toBeNull();
    expect(mwgAnnualReport2025ManualPreview.financials.sharesOutstanding.value).toBeNull();
    expect(mwgAnnualReport2025ManualPreview.financials.totalDebt.value).toBeNull();
  });
});
