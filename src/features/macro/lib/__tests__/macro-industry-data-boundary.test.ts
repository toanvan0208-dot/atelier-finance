import { describe, expect, it } from "vitest";

import {
  buildMacroIndustryDataBoundary,
  buildMacroIndustryReadinessChecklist,
  getIndustrySupportedFields,
  getMacroIndustryBlockedReasons,
  getMacroSupportedFields,
  validateMacroIndustryBoundaryInput,
  type MacroIndustryBoundaryInput,
} from "../macro-industry-data-boundary";

const completeEvidence = {
  sourceLabel: "research_boundary_fixture",
  sourceOwner: "internal_research",
  documentReference: "phase87-boundary-note",
  termsReviewed: true,
  runtimeDisplayApproved: true,
  storageApproved: true,
  reviewNotes: "Boundary fixture only; not source-approved for production.",
};

const macroInput = (patch: Partial<MacroIndustryBoundaryInput> = {}): MacroIndustryBoundaryInput => ({
  domain: "macro",
  fieldId: "inflation",
  value: 4.2,
  unit: "percent",
  period: "2026-Q1",
  asOf: "2026-06-21",
  dataMode: "research_only",
  productionApproved: false,
  sourceEvidence: completeEvidence,
  ...patch,
});

const industryInput = (patch: Partial<MacroIndustryBoundaryInput> = {}): MacroIndustryBoundaryInput => ({
  domain: "industry",
  fieldId: "revenueGrowth",
  value: 8.5,
  unit: "percent",
  period: "2026-Q1",
  asOf: "2026-06-21",
  dataMode: "manual",
  productionApproved: false,
  sourceEvidence: completeEvidence,
  ...patch,
});

describe("macro industry data boundary", () => {
  it("lists supported Macro and Industry fields without adding calculations", () => {
    expect(getMacroSupportedFields().map((field) => field.id)).toEqual(
      expect.arrayContaining(["gdpGrowth", "inflation", "policyRate", "exchangeRate", "pmi"]),
    );
    expect(getIndustrySupportedFields().map((field) => field.id)).toEqual(
      expect.arrayContaining(["industryCode", "industryName", "revenueGrowth", "sectorIndexChange"]),
    );
  });

  it("requires explicit units for Macro unit-sensitive fields", () => {
    const result = validateMacroIndustryBoundaryInput(macroInput({ unit: null }));

    expect(result.readiness).toBe("blocked");
    expect(result.unit).toBe("unknown_unit");
    expect(result.blockedReasons).toContain("explicit_unit_required");
  });

  it("requires explicit units for Industry unit-sensitive fields", () => {
    const result = validateMacroIndustryBoundaryInput(industryInput({ unit: undefined }));

    expect(result.readiness).toBe("blocked");
    expect(result.unit).toBe("unknown_unit");
    expect(result.blockedReasons).toContain("explicit_unit_required");
  });

  it("does not convert missing values to zero", () => {
    const result = validateMacroIndustryBoundaryInput(macroInput({ value: null }));

    expect(result.value).toBeNull();
    expect(result.blockedReasons).toContain("missing_value");
    expect(JSON.stringify(result)).not.toContain('":0');
  });

  it("blocks unit-sensitive usage when unit metadata is missing", () => {
    const reasons = getMacroIndustryBlockedReasons(industryInput({ unit: null }));

    expect(reasons).toContain("explicit_unit_required");
  });

  it("blocks unit-sensitive usage when unit metadata is invalid", () => {
    const result = validateMacroIndustryBoundaryInput(macroInput({ fieldId: "exchangeRate", unit: "percent" }));

    expect(result.readiness).toBe("blocked");
    expect(result.unit).toBe("unknown_unit");
    expect(result.blockedReasons).toContain("invalid_unit");
  });

  it("forbids magnitude guessing even when a numeric value is present", () => {
    const result = validateMacroIndustryBoundaryInput(macroInput({ allowMagnitudeGuessing: true }));

    expect(result.value).toBe(4.2);
    expect(result.blockedReasons).toContain("magnitude_guessing_forbidden");
  });

  it("requires source and evidence metadata or marks it missing or partial", () => {
    const missing = validateMacroIndustryBoundaryInput(macroInput({ sourceEvidence: null }));
    const partial = validateMacroIndustryBoundaryInput(
      macroInput({ sourceEvidence: { sourceLabel: "partial_source", sourceOwner: null } }),
    );

    expect(missing.evidenceStatus).toBe("missing");
    expect(missing.blockedReasons).toContain("source_evidence_missing");
    expect(partial.evidenceStatus).toBe("partial");
    expect(partial.blockedReasons).toEqual(
      expect.arrayContaining(["missing_source_owner", "source_evidence_partial"]),
    );
  });

  it("keeps local, research, manual, sample, and synthetic data productionApproved:false", () => {
    for (const dataMode of ["local_db_research", "research_only", "manual", "sample", "synthetic"] as const) {
      const result = validateMacroIndustryBoundaryInput(macroInput({ dataMode, productionApproved: true }));

      expect(result.productionApproved).toBe(false);
      expect(result.blockedReasons).toContain("production_approval_not_allowed_for_data_mode");
      expect(result.warnings).toContain("productionApproved:false");
    }
  });

  it("keeps future DB-backed Macro/Industry state separate from production approval", () => {
    const result = validateMacroIndustryBoundaryInput(
      industryInput({ dataMode: "future_db_backed", productionApproved: true }),
    );

    expect(result.productionApproved).toBe(false);
    expect(result.blockedReasons).toEqual(
      expect.arrayContaining([
        "future_db_backed_not_source_approved",
        "production_approval_not_allowed_for_data_mode",
      ]),
    );
  });

  it("does not expose parser, import, write, API, fetch, or upload capabilities", () => {
    const boundary = buildMacroIndustryDataBoundary();

    expect(boundary.ioCapabilities).toEqual({
      readsFiles: false,
      writesFiles: false,
      writesDatabase: false,
      callsApis: false,
      fetchesData: false,
      importsRealData: false,
      exposesUploadEndpoint: false,
    });
  });

  it("does not add recommendation, target, fair value, or risk scoring outputs", () => {
    const boundary = buildMacroIndustryDataBoundary();
    const serialized = JSON.stringify(boundary).toLowerCase();

    expect(boundary.forbiddenCapabilitiesExposed).toBe(false);
    expect(serialized).not.toContain("recommendation");
    expect(serialized).not.toContain("target");
    expect(serialized).not.toContain("fair value");
    expect(serialized).not.toContain("risk scoring");
  });

  it("keeps future phase gates explicit and blocks production ingestion by default", () => {
    const boundary = buildMacroIndustryDataBoundary();
    const checklist = buildMacroIndustryReadinessChecklist();

    expect(boundary.futurePhaseGates).toContain("production_ingestion_blocked_by_default");
    expect(checklist.find((item) => item.id === "future_ingestion")).toMatchObject({
      required: true,
      defaultState: "blocked_until_future_phase",
    });
  });
});
