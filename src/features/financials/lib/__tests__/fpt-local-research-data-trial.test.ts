import { describe, expect, it } from "vitest";

import {
  buildControlledValuationIntegrationBoundary,
  type ControlledValuationFinancialsRuntimeSnapshot,
} from "../../../valuation/lib/controlled-valuation-integration-boundary";
import {
  buildFptLocalResearchPreWriteChecklist,
  buildFptLocalResearchTrialFixture,
  mapValidTrialRowsToFinancialStatementDrafts,
  validateFptLocalResearchTrialRows,
  type FptLocalResearchTrialRow,
} from "../fpt-local-research-data-trial";

const fixture = () => buildFptLocalResearchTrialFixture();

const verifiedRuntime = (
  patch: ControlledValuationFinancialsRuntimeSnapshot,
): ControlledValuationFinancialsRuntimeSnapshot => ({
  asOf: "2024-12-31",
  dataMode: "research_only",
  fallbackUsed: false,
  fiscalYear: 2024,
  period: "2024",
  periodType: "annual",
  productionApproved: false,
  readPath: "local_db",
  runtimeStatus: "db_backed",
  sourceLabel: "phase78_fpt_local_research_financial_statement_trial",
  ...patch,
});

describe("Phase 78 FPT local research financial statement data trial", () => {
  it("keeps the trial fixture limited to one ticker only", () => {
    const rows = fixture();

    expect(new Set(rows.map((row) => row.ticker))).toEqual(new Set(["FPT"]));
    expect(rows.length).toBeGreaterThan(0);
  });

  it("uses research_only data mode and productionApproved false", () => {
    const rows = fixture();

    expect(rows.every((row) => row.dataMode === "research_only")).toBe(true);
    expect(rows.every((row) => row.productionApproved === false)).toBe(true);
  });

  it("includes explicit source and evidence metadata on every row", () => {
    const rows = fixture();

    expect(
      rows.every(
        (row) =>
          row.sourceLabel === "phase78_fpt_local_research_financial_statement_trial" &&
          row.sourceOwner === "user_provided_local_research" &&
          row.sourceDocumentRef.length > 0 &&
          row.asOf === "2026-06-21" &&
          row.evidenceNote.includes("not source-approved"),
      ),
    ).toBe(true);
  });

  it("passes pre-write validation for valid FPT trial rows", () => {
    const result = validateFptLocalResearchTrialRows(fixture());

    expect(result).toMatchObject({
      basis: "consolidated",
      productionApproved: false,
      readyForFutureWriteTrial: true,
      status: "ready_for_future_write_trial",
      ticker: "FPT",
    });
    expect(result.blockedReasons).toEqual([]);
  });

  it("blocks missing unit before any future write", () => {
    const rows = fixture();
    rows[0] = { ...rows[0], unit: null };

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("revenue_missing_unit");
  });

  it("blocks invalid unit before any future write", () => {
    const rows = fixture();
    rows[0] = { ...rows[0], unit: "shares" };

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("revenue_invalid_unit");
  });

  it("keeps missing value blocked and does not convert it to zero", () => {
    const rows = fixture();
    rows[0] = { ...rows[0], value: null };

    const result = validateFptLocalResearchTrialRows(rows);
    const drafts = mapValidTrialRowsToFinancialStatementDrafts(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("revenue_missing_value");
    expect(rows[0].value).toBeNull();
    expect(rows[0].value).not.toBe(0);
    expect(drafts).toEqual([]);
  });

  it("blocks unsupported fields before any future write", () => {
    const rows = fixture();
    rows.push({ ...rows[0], field: "grossProfit" as never, value: 30_000 });

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("grossProfit_unsupported_field");
  });

  it("blocks missing basis before any future write", () => {
    const rows = fixture();
    rows[0] = { ...rows[0], basis: "" as never };

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("basis_required");
  });

  it("blocks mixed consolidated and standalone basis without future reconciliation", () => {
    const rows = fixture();
    rows[1] = { ...rows[1], basis: "standalone" };

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.basis).toBe("mixed");
    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("mixed_basis_requires_future_reconciliation");
  });

  it("blocks duplicate row keys", () => {
    const rows = fixture();
    rows.push({ ...rows[0] });

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("duplicate_trial_row");
  });

  it("blocks production-approved claims when source evidence is missing", () => {
    const rows: FptLocalResearchTrialRow[] = fixture().map((row) => ({
      ...row,
      evidenceNote: "",
      productionApproved: true as never,
      sourceDocumentRef: "",
    }));

    const result = validateFptLocalResearchTrialRows(rows);

    expect(result.readyForFutureWriteTrial).toBe(false);
    expect(result.blockedReasons).toContain("production_approval_not_allowed");
    expect(result.blockedReasons).toContain("revenue_missing_source_evidence");
    expect(result.productionApproved).toBe(false);
  });

  it("maps valid rows to FinancialStatement draft/write-intent objects without DB write", () => {
    const drafts = mapValidTrialRowsToFinancialStatementDrafts(fixture());

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      asOf: "2026-06-21",
      basis: "consolidated",
      dataMode: "research_only",
      period: "2024",
      periodType: "year",
      productionApproved: false,
      sourceLabel: "phase78_fpt_local_research_financial_statement_trial",
      ticker: "FPT",
      writeIntent: "draft_only_no_db_write",
    });
    expect(drafts[0].values.revenue).toBe(60_000);
  });

  it("includes FinancialStatement unit metadata handoff in the draft", () => {
    const draft = mapValidTrialRowsToFinancialStatementDrafts(fixture())[0];

    expect(draft.unitMetadata.revenue).toMatchObject({
      productionApproved: false,
      sourceLabel: "phase78_fpt_local_research_financial_statement_trial",
      status: "explicit",
      unit: "billion_vnd",
    });
    expect(draft.unitMetadata.eps.unit).toBe("vnd_per_share");
    expect(draft.unitMetadata.sharesOutstanding.unit).toBe("million_shares");
  });

  it("allows Valuation handoff only for valid explicit Financials units", () => {
    const draft = mapValidTrialRowsToFinancialStatementDrafts(fixture())[0];
    const valid = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        eps: draft.values.eps,
        revenue: draft.values.revenue,
        sharesOutstanding: draft.values.sharesOutstanding,
        units: draft.valuationUnits,
      }),
      persistedValuationInputs: null,
    });
    const invalid = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        eps: draft.values.eps,
        revenue: draft.values.revenue,
        sharesOutstanding: draft.values.sharesOutstanding,
        units: { ...draft.valuationUnits, eps: "unknown" },
      }),
      persistedValuationInputs: null,
    });

    expect(valid.selectedInputs.eps.normalizationStatus).toBe("ready");
    expect(valid.selectedInputs.sharesOutstanding.normalizationStatus).toBe("ready");
    expect(invalid.selectedInputs.eps.normalizationStatus).toBe("unknown_unit");
    expect(invalid.calculation.metrics.pe.status).toBe("insufficient_data");
  });

  it("keeps Financials DB-backed separate from a fully DB-backed Valuation claim", () => {
    const draft = mapValidTrialRowsToFinancialStatementDrafts(fixture())[0];
    const valuation = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: verifiedRuntime({
        dataMode: draft.dataMode,
        eps: draft.values.eps,
        readPath: "local_db",
        revenue: draft.values.revenue,
        sourceLabel: draft.sourceLabel,
        units: draft.valuationUnits,
      }),
    });

    expect(valuation.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    expect(valuation.sourceBoundary.productionApproved).toBe(false);
    expect(valuation.sourceBoundary.warnings).toContain("can_claim_valuation_db_backed_false");
  });

  it("exposes no parser, importer, file reader, API fetch, or DB write function", async () => {
    const moduleExports = await import("../fpt-local-research-data-trial");
    const names = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(names).not.toContain("parse");
    expect(names).not.toContain("import");
    expect(names).not.toContain("readfile");
    expect(names).not.toContain("fetch");
    expect(names).not.toContain("writedb");
    expect(names).not.toContain("persist");
  });

  it("does not introduce recommendation, target, fair value, or risk scoring outputs", () => {
    const output = JSON.stringify({
      checklist: buildFptLocalResearchPreWriteChecklist(),
      draft: mapValidTrialRowsToFinancialStatementDrafts(fixture()),
      validation: validateFptLocalResearchTrialRows(fixture()),
    }).toLowerCase();

    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("targetprice");
    expect(output).not.toContain("fairvalue");
    expect(output).not.toContain("risk scoring");
  });
});
