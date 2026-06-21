import { describe, expect, it } from "vitest";

import {
  buildFinancialStatementCsvImportTrialPlan,
  getFinancialStatementCsvImportTrialBlockedReasons,
  getRequiredFinancialStatementCsvTrialColumns,
  validateFinancialStatementCsvImportTrialPlan,
} from "../financial-statement-csv-import-trial-plan";

const validRow = {
  asOf: "2026-06-21",
  basis: "consolidated",
  currency: "VND",
  dataMode: "research_only",
  evidenceNote: "Local research CSV row for a future controlled trial.",
  field: "revenue",
  period: "2024",
  periodType: "annual",
  productionApproved: false,
  sourceDocumentRef: "local-user-provided-financial-statement-csv",
  sourceLabel: "phase77_planned_real_financial_statement_csv_trial",
  sourceOwner: "user_provided_local_research",
  sourceUrl: "",
  statementType: "income_statement",
  ticker: "FPT",
  unit: "vnd",
  value: 1_000_000_000,
};

describe("financial statement CSV import trial plan", () => {
  it("requires explicit unit and source evidence columns", () => {
    const columns = getRequiredFinancialStatementCsvTrialColumns();
    const plan = buildFinancialStatementCsvImportTrialPlan();

    expect(columns).toEqual(expect.arrayContaining(["unit", "sourceLabel", "sourceOwner", "asOf"]));
    expect(plan.requiredSourceEvidenceColumns).toEqual(
      expect.arrayContaining(["sourceLabel", "sourceOwner", "asOf", "dataMode", "productionApproved", "evidenceNote"]),
    );
    expect(plan.requiredColumns).toContain("sourceUrl");
    expect(plan.requiredColumns).toContain("sourceDocumentRef");
  });

  it("blocks missing units before any future write", () => {
    const result = validateFinancialStatementCsvImportTrialPlan({ ...validRow, unit: "" });

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("missing_unit");
    expect(result.productionApproved).toBe(false);
  });

  it("blocks invalid units before any future write", () => {
    const result = validateFinancialStatementCsvImportTrialPlan({ ...validRow, field: "eps", unit: "million_vnd" });

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("invalid_unit");
  });

  it("keeps missing value blocked instead of converting it to zero", () => {
    const result = validateFinancialStatementCsvImportTrialPlan({ ...validRow, value: null });

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("missing_value");
    expect(result.warnings).toContain("missing_values_must_remain_null");
  });

  it("treats unknown unit as a blocker for unit-sensitive calculations", () => {
    const result = validateFinancialStatementCsvImportTrialPlan({ ...validRow, unit: "unknown" });

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("missing_unit");
    expect(result.warnings).toContain("units_must_not_be_inferred_from_magnitude");
  });

  it("keeps local research manual CSV productionApproved false", () => {
    const result = validateFinancialStatementCsvImportTrialPlan({ ...validRow, productionApproved: true });

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("production_approval_not_allowed");
    expect(result.productionApproved).toBe(false);
  });

  it("blocks production approval claims when source evidence is missing", () => {
    const result = validateFinancialStatementCsvImportTrialPlan({
      ...validRow,
      evidenceNote: "",
      productionApproved: true,
      sourceDocumentRef: "",
      sourceOwner: "",
      sourceUrl: "",
    });

    expect(result.blockedReasons).toContain("missing_source_evidence");
    expect(result.blockedReasons).toContain("production_approval_not_allowed");
  });

  it("limits supported write fields to the existing Financials unit contract", () => {
    const plan = buildFinancialStatementCsvImportTrialPlan();

    expect(plan.currentlySupportedFields.sort()).toEqual(
      [
        "currentAssets",
        "currentLiabilities",
        "eps",
        "equity",
        "netIncome",
        "operatingCashFlow",
        "revenue",
        "sharesOutstanding",
        "totalAssets",
        "totalDebt",
      ].sort(),
    );
    expect(plan.candidateSourceFields).toEqual(expect.arrayContaining(["grossProfit", "capitalExpenditure"]));
    expect(plan.currentlySupportedFields).not.toContain("grossProfit");
    expect(plan.currentlySupportedFields).not.toContain("capitalExpenditure");
  });

  it("states Phase 77 is plan-only with explicit Phase 78 gates", () => {
    const plan = buildFinancialStatementCsvImportTrialPlan();

    expect(plan.phase).toBe(77);
    expect(plan.planOnly).toBe(true);
    expect(plan.realImportAllowedInPhase).toBe(false);
    expect(plan.dbWriteAllowedInPhase).toBe(false);
    expect(plan.futurePhase78Gates.join(" ")).toContain("one small controlled local research dataset");
    expect(plan.futurePhase78Gates.join(" ")).toContain("Require explicit units");
  });

  it("exposes no parser, importer, file reader, or DB write surface", () => {
    const moduleExports = {
      buildFinancialStatementCsvImportTrialPlan,
      getFinancialStatementCsvImportTrialBlockedReasons,
      getRequiredFinancialStatementCsvTrialColumns,
      validateFinancialStatementCsvImportTrialPlan,
    };
    const exportNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportNames).not.toContain("parse");
    expect(exportNames).not.toContain("importfile");
    expect(exportNames).not.toContain("readfile");
    expect(exportNames).not.toContain("write");
  });

  it("accepts a complete future-trial row only as readiness planning, not a real import", () => {
    const result = validateFinancialStatementCsvImportTrialPlan(validRow);

    expect(result.readyForFutureWriteTrial).toBe(true);
    expect(result.blockedReasons).toEqual([]);
    expect(result.warnings).toContain("phase_77_plan_only_no_real_csv_import");
  });
});
