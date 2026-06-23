import { describe, it, expect } from "vitest";
import { buildCandidateImportRows } from "../vnstock-financials-candidate-import-flow";
import { type VnstockFinancialsCandidateRow } from "../vnstock-financials-candidate";

describe("buildCandidateImportRows", () => {
  it("maps EPS and sharesOutstanding correctly", () => {
    const candidates: VnstockFinancialsCandidateRow[] = [
      {
        ticker: "FPT",
        fiscalYear: 2025,
        period: null,
        field: "eps",
        value: 5000,
        unit: "vnd_per_share",
        sourceLabel: "vnstock_financials_candidate",
        dataMode: "research_only",
        productionApproved: false,
        status: "candidate",
        rawPath: null,
        provenanceNote: "",
        caveat: null,
      },
      {
        ticker: "FPT",
        fiscalYear: 2025,
        period: null,
        field: "sharesOutstanding",
        value: 1000000,
        unit: "shares",
        sourceLabel: "vnstock_financials_candidate",
        dataMode: "research_only",
        productionApproved: false,
        status: "candidate",
        rawPath: null,
        provenanceNote: "",
        caveat: null,
      },
      {
        ticker: "FPT",
        fiscalYear: 2025,
        period: null,
        field: "totalDebt",
        value: null,
        unit: "unknown",
        sourceLabel: "vnstock_financials_candidate",
        dataMode: "research_only",
        productionApproved: false,
        status: "missing",
        rawPath: null,
        provenanceNote: "",
        caveat: null,
      },
    ];

    const result = buildCandidateImportRows(candidates);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      ticker: "FPT",
      fiscalYear: 2025,
      periodType: "annual",
      sourceLabel: "vnstock_financials_candidate",
      dataMode: "research_only",
      productionApproved: false,
      eps: 5000,
      epsUnit: "vnd_per_share",
      sharesOutstanding: 1000000,
      sharesOutstandingUnit: "shares",
    });
  });

  it("blocks totalDebt from being imported even if present and valid", () => {
    const candidates: VnstockFinancialsCandidateRow[] = [
      {
        ticker: "FPT",
        fiscalYear: 2025,
        period: null,
        field: "totalDebt",
        value: 123456,
        unit: "vnd",
        sourceLabel: "vnstock_financials_candidate",
        dataMode: "research_only",
        productionApproved: false,
        status: "candidate",
        rawPath: null,
        provenanceNote: "",
        caveat: null,
      },
    ];

    const result = buildCandidateImportRows(candidates);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/totalDebt must not be imported/);
    expect(result.rows).toHaveLength(0);
  });

  it("does not map missing/null fields to zero", () => {
    const candidates: VnstockFinancialsCandidateRow[] = [
      {
        ticker: "MWG",
        fiscalYear: 2025,
        period: null,
        field: "eps",
        value: null, // missing
        unit: "unknown",
        sourceLabel: "vnstock_financials_candidate",
        dataMode: "research_only",
        productionApproved: false,
        status: "needs_review",
        rawPath: null,
        provenanceNote: "",
        caveat: null,
      },
    ];

    const result = buildCandidateImportRows(candidates);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].eps).toBeUndefined(); // Should not be 0
  });

  it("hardcodes productionApproved to false and uses correct research_only modes", () => {
    const candidates: VnstockFinancialsCandidateRow[] = [
      {
        ticker: "VCB",
        fiscalYear: 2025,
        period: null,
        field: "eps",
        value: 2000,
        unit: "vnd_per_share",
        sourceLabel: "vnstock_financials_candidate",
        dataMode: "research_only",
        productionApproved: false,
        status: "candidate",
        rawPath: null,
        provenanceNote: "",
        caveat: null,
      },
    ];

    const result = buildCandidateImportRows(candidates);
    expect(result.rows[0].productionApproved).toBe(false);
    expect(result.rows[0].dataMode).toBe("research_only");
    expect(result.rows[0].sourceLabel).toBe("vnstock_financials_candidate");
  });
});
