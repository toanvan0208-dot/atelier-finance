import { describe, expect, it } from "vitest";

import type { FinancialsRuntimeData } from "../financials-runtime-types";
import { buildFinancialsUnitMetadata } from "../financials-unit-metadata-contract";
import {
  buildCurrentFinancialsDerivedModuleReadiness,
  buildFinancialsDerivedModuleReadiness,
  FINANCIALS_DERIVED_BOUNDARY_NOTE,
} from "../financials-derived-module-readiness";

const localDbFinancialsRuntime = {
  runtimeStatus: "db_backed",
  source: {
    sourceLabel: "phase45_synthetic_financial_statement_local_write",
    dataMode: "research_only",
    productionApproved: false,
    fallbackUsed: false,
    readPath: "local_db",
    ticker: "FPT",
    asOf: "2024-12-31",
    fiscalYear: 2024,
    periodType: "annual",
  },
  dataQuality: {
    status: "partial",
    missingFields: ["eps", "operatingCashFlow"],
    warnings: ["Local/research-only financial statement data is not production-approved."],
    errors: [],
  },
  statementSnapshot: null,
  unitMetadata: buildFinancialsUnitMetadata(),
  readResult: null,
} satisfies FinancialsRuntimeData;

describe("financials-derived module readiness boundary", () => {
  it("does not let Overview claim DB-backed when Financials local DB runtime is available but not consumed", () => {
    const readiness = buildFinancialsDerivedModuleReadiness({
      moduleKey: "overview",
      financialsRuntimeData: localDbFinancialsRuntime,
      consumesFinancialsRuntimeSnapshot: false,
      moduleDataSourceMode: "not_wired",
    });

    expect(readiness.financialsRuntimeStatus).toBe("db_backed");
    expect(readiness.financialsReadPath).toBe("local_db");
    expect(readiness.moduleDataSourceMode).toBe("not_wired");
    expect(readiness.canClaimDbBacked).toBe(false);
    expect(readiness.productionApproved).toBe(false);
  });

  it("does not let Valuation claim DB-backed when Financials local DB runtime is available but not consumed", () => {
    const readiness = buildFinancialsDerivedModuleReadiness({
      moduleKey: "valuation",
      financialsRuntimeData: localDbFinancialsRuntime,
      consumesFinancialsRuntimeSnapshot: false,
      moduleDataSourceMode: "not_wired",
    });

    expect(readiness.moduleKey).toBe("valuation");
    expect(readiness.canClaimDbBacked).toBe(false);
    expect(readiness.productionApproved).toBe(false);
  });

  it("does not let Risk claim DB-backed when Financials local DB runtime is available but not consumed", () => {
    const readiness = buildFinancialsDerivedModuleReadiness({
      moduleKey: "risk",
      financialsRuntimeData: localDbFinancialsRuntime,
      consumesFinancialsRuntimeSnapshot: false,
      moduleDataSourceMode: "sample_static",
    });

    expect(readiness.moduleKey).toBe("risk");
    expect(readiness.moduleDataSourceMode).toBe("sample_static");
    expect(readiness.canClaimDbBacked).toBe(false);
    expect(readiness.productionApproved).toBe(false);
  });

  it("keeps production approval false for local, research-only, sample, and missing sources", () => {
    const local = buildFinancialsDerivedModuleReadiness({
      moduleKey: "overview",
      financialsRuntimeData: localDbFinancialsRuntime,
      consumesFinancialsRuntimeSnapshot: true,
      moduleDataSourceMode: "db_backed",
    });
    const sample = buildFinancialsDerivedModuleReadiness({
      moduleKey: "valuation",
      financialsRuntimeData: {
        ...localDbFinancialsRuntime,
        runtimeStatus: "sample_fallback",
        source: {
          ...localDbFinancialsRuntime.source,
          dataMode: "sample",
          fallbackUsed: true,
          readPath: "sample_static",
        },
      },
      moduleDataSourceMode: "sample_fallback",
    });
    const missing = buildFinancialsDerivedModuleReadiness({ moduleKey: "risk" });

    expect(local.productionApproved).toBe(false);
    expect(sample.productionApproved).toBe(false);
    expect(missing.productionApproved).toBe(false);
    expect(local.canClaimDbBacked).toBe(false);
  });

  it("emits a clear boundary warning when Financials DB-backed runtime is available but a module is not consuming it", () => {
    const readiness = buildCurrentFinancialsDerivedModuleReadiness(localDbFinancialsRuntime);

    for (const moduleReadiness of Object.values(readiness)) {
      expect(moduleReadiness.boundaryNote).toBe(FINANCIALS_DERIVED_BOUNDARY_NOTE);
      expect(moduleReadiness.warnings).toContain("Financials runtime available, but this module is not yet DB-backed.");
      expect(moduleReadiness.warnings).toContain(
        "Local, research-only, sample, or missing Financials source is not production-approved.",
      );
    }
  });

  it("defines missing data policy without zero substitution or divide-by-zero", () => {
    const readiness = buildFinancialsDerivedModuleReadiness({ moduleKey: "overview" });

    expect(readiness.missingDataPolicy).toMatchObject({
      missingValue: "null",
      substituteZeroForMissing: false,
      divideByZeroAllowed: false,
    });
    expect(readiness.warnings).toContain("Missing values must remain null/unavailable and must not be replaced with 0.");
  });

  it("blocks normal or cheap P/E interpretation when EPS is zero, negative, or missing", () => {
    for (const eps of [null, 0, -1]) {
      const readiness = buildFinancialsDerivedModuleReadiness({
        moduleKey: "valuation",
        eps,
        equity: 100,
      });

      expect(readiness.guardrails.peInterpretationAllowed).toBe(false);
      expect(readiness.guardrails.reasons.join(" ")).toContain("P/E must not be interpreted as normal or cheap");
    }
  });

  it("blocks normal ROE/P/B/BVPS interpretation when equity and BVPS are zero, negative, or missing", () => {
    for (const value of [null, 0, -1]) {
      const readiness = buildFinancialsDerivedModuleReadiness({
        moduleKey: "risk",
        eps: 10,
        equity: value,
        bvps: value,
      });

      expect(readiness.guardrails.equityBasedInterpretationAllowed).toBe(false);
      expect(readiness.guardrails.reasons.join(" ")).toContain("ROE/P/B/BVPS must not be interpreted normally");
    }
  });
});
