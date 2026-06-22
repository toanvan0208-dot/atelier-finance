import { describe, expect, it } from "vitest";

import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildTraceableInputSourceDecisions, type TraceableInputCandidate } from "../traceable-input-source-decisions";

const financialsRuntime = (patch: Partial<NonNullable<FinancialsRuntimeData["statementSnapshot"]>> = {}): FinancialsRuntimeData => {
  const snapshot = {
    eps: null,
    netProfit: 8_700,
    operatingCashFlow: 9_800,
    period: "2024",
    periodType: "annual" as const,
    revenue: 62_000,
    sharesOutstanding: null,
    ticker: "FPT",
    totalAssets: 75_000,
    totalDebt: null,
    totalEquity: 36_000,
    totalLiabilities: 39_000,
    ...patch,
  };

  return {
    dataQuality: { errors: [], missingFields: ["eps", "sharesOutstanding"], status: "partial", warnings: [] },
    readResult: null,
    runtimeStatus: "db_backed",
    source: {
      asOf: "2026-06-22",
      dataMode: "research_only",
      fallbackUsed: false,
      fiscalYear: 2024,
      periodType: "annual",
      productionApproved: false,
      readPath: "local_db",
      sourceLabel: "phase109_controlled_local_financials",
      ticker: "FPT",
    },
    statementSnapshot: snapshot,
    unitMetadata: buildFinancialsUnitMetadata({
      dataMode: "research_only",
      explicitUnits: { equity: "billion_vnd", netIncome: "billion_vnd", revenue: "billion_vnd", totalAssets: "billion_vnd" },
      snapshot,
      sourceLabel: "phase109_controlled_local_financials",
    }),
  };
};

const candidate = (patch: Partial<TraceableInputCandidate> = {}): TraceableInputCandidate => ({
  asOf: "2026-06-22",
  dataMode: "research_only",
  field: "eps",
  period: "2024",
  productionApproved: false,
  sourceLabel: "traceable_research_financial_input",
  ticker: "FPT",
  unit: "vnd_per_share",
  value: 5_000,
  ...patch,
});

describe("traceable input source decisions", () => {
  it("returns fail-closed decisions for all three missing fields without zero-fill", () => {
    const decisions = buildTraceableInputSourceDecisions({ financials: financialsRuntime(), ticker: "FPT" });

    expect(Object.keys(decisions)).toEqual(["totalDebt", "eps", "sharesOutstanding"]);
    for (const decision of Object.values(decisions)) {
      expect(decision.status).toBe("unavailable");
      expect(decision.activationStatus).toBe("deferred");
      expect(decision.value).toBeNull();
      expect(decision.value).not.toBe(0);
      expect(decision.productionApproved).toBe(false);
    }
    expect(decisions.totalDebt.reason).toContain("total liabilities are not treated as debt");
    expect(decisions.totalDebt.pilotChecks?.map((check) => check.status)).toEqual([
      "checked_no_value",
      "boundary_only",
      "boundary_only",
    ]);
  });

  it.each([
    ["missing unit", candidate({ unit: null }), "unit_missing_or_invalid"],
    ["missing data mode", candidate({ dataMode: null }), "source_metadata_incomplete"],
    ["missing source", candidate({ sourceLabel: null }), "source_metadata_incomplete"],
    ["missing as-of", candidate({ asOf: null }), "source_metadata_incomplete"],
    ["missing period", candidate({ period: null }), "ticker_field_or_period_mismatch"],
    ["period mismatch", candidate({ period: "2023" }), "ticker_field_or_period_mismatch"],
  ])("fails closed for %s", (_label, epsCandidate, reasonCode) => {
    const decisions = buildTraceableInputSourceDecisions({
      candidates: { eps: epsCandidate as TraceableInputCandidate },
      financials: financialsRuntime(),
      ticker: "FPT",
    });

    expect(decisions.eps.status).toBe("insufficient_source");
    expect(decisions.eps.activationStatus).toBe("deferred");
    expect(decisions.eps.reasonCode).toBe(reasonCode);
  });

  it("activates only a candidate with matching ticker, field, explicit unit, source, as-of, and period", () => {
    const decisions = buildTraceableInputSourceDecisions({
      candidates: { eps: candidate() },
      financials: financialsRuntime(),
      ticker: "FPT",
    });

    expect(decisions.eps).toMatchObject({
      activationStatus: "activated",
      productionApproved: false,
      status: "available",
      unit: "vnd_per_share",
      value: 5_000,
    });
    expect(decisions.totalDebt.status).toBe("unavailable");
    expect(decisions.sharesOutstanding.status).toBe("unavailable");
  });

  it("activates a traceable totalDebt candidate without accepting liabilities as debt", () => {
    const decisions = buildTraceableInputSourceDecisions({
      candidates: { totalDebt: candidate({ field: "totalDebt", unit: "billion_vnd", value: 500 }) },
      financials: financialsRuntime(),
      ticker: "FPT",
    });

    expect(decisions.totalDebt).toMatchObject({
      activationStatus: "activated",
      field: "totalDebt",
      productionApproved: false,
      status: "available",
      unit: "billion_vnd",
      value: 500,
    });
    expect(decisions.totalDebt.pilotChecks?.at(-1)).toMatchObject({
      path: "candidate_validation",
      status: "passed",
    });
    expect(decisions.eps.status).toBe("unavailable");
  });

  it("rejects sample or mock totalDebt candidates during the pilot", () => {
    const decisions = buildTraceableInputSourceDecisions({
      candidates: {
        totalDebt: candidate({
          field: "totalDebt",
          sourceLabel: "sample_financials",
          unit: "billion_vnd",
          value: 500,
        }),
      },
      financials: financialsRuntime(),
      ticker: "FPT",
    });

    expect(decisions.totalDebt.status).toBe("insufficient_source");
    expect(decisions.totalDebt.activationStatus).toBe("deferred");
    expect(decisions.totalDebt.reasonCode).toBe("sample_or_mock_source_rejected");
    expect(decisions.totalDebt.pilotChecks?.at(-1)).toMatchObject({
      path: "candidate_validation",
      status: "rejected",
    });
  });
});
