import { describe, expect, it } from "vitest";

import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildOverviewFinancialsRuntimeBoundary } from "../overview-financials-runtime-boundary";

const financialsRuntime = {
  runtimeStatus: "db_backed",
  source: {
    sourceLabel: "phase45_synthetic_financial_statement_local_write",
    dataMode: "research_only",
    productionApproved: false,
    fallbackUsed: false,
    readPath: "local_db",
    ticker: "MWG",
    asOf: "2024-12-31",
    fiscalYear: 2024,
    periodType: "annual",
  },
  dataQuality: {
    status: "partial",
    missingFields: ["revenue", "operatingCashFlow"],
    warnings: ["Some fields are missing and remain null."],
    errors: [],
  },
  statementSnapshot: {
    ticker: "MWG",
    period: "2024",
    periodType: "annual",
    sourceName: "phase45_synthetic_financial_statement_local_write",
    collectedAt: null,
    revenue: null,
    previousRevenue: null,
    grossProfit: null,
    operatingProfit: null,
    netProfit: 100,
    previousNetProfit: null,
    totalAssets: 2000,
    previousTotalAssets: null,
    totalLiabilities: null,
    totalEquity: 1200,
    previousTotalEquity: null,
    currentAssets: null,
    currentLiabilities: null,
    operatingCashFlow: null,
    previousOperatingCashFlow: null,
    capitalExpenditure: null,
    sharesOutstanding: null,
    eps: null,
  },
  readResult: null,
} satisfies FinancialsRuntimeData;

describe("overview financials runtime boundary", () => {
  it("marks local research Financials runtime as mixed source without a full Overview DB-backed claim", () => {
    const boundary = buildOverviewFinancialsRuntimeBoundary(financialsRuntime);

    expect(boundary.overviewRuntimeStatus).toBe("mixed_source");
    expect(boundary.financialsRuntimeStatus).toBe("db_backed");
    expect(boundary.financialsReadPath).toBe("local_db");
    expect(boundary.consumesFinancialsRuntime).toBe(true);
    expect(boundary.canClaimOverviewDbBacked).toBe(false);
    expect(boundary.productionApproved).toBe(false);
    expect(boundary.warnings.join(" ")).toContain("partial boundary only");
  });

  it("keeps production approval false for local and research-only Financials runtime", () => {
    const boundary = buildOverviewFinancialsRuntimeBoundary(financialsRuntime);

    expect(boundary.productionApproved).toBe(false);
    expect(boundary.derivedReadiness.productionApproved).toBe(false);
    expect(boundary.derivedReadiness.canClaimDbBacked).toBe(false);
    expect(boundary.warnings.join(" ")).toContain("not production-approved");
  });

  it("adds a clear fallback warning when Financials fallback is active", () => {
    const boundary = buildOverviewFinancialsRuntimeBoundary({
      ...financialsRuntime,
      runtimeStatus: "sample_fallback",
      source: {
        ...financialsRuntime.source,
        dataMode: "sample",
        fallbackUsed: true,
        readPath: "sample_static",
      },
      dataQuality: {
        status: "unavailable",
        missingFields: [],
        warnings: ["Financials runtime is using static sample data."],
        errors: [],
      },
    });

    expect(boundary.overviewRuntimeStatus).toBe("sample_fallback");
    expect(boundary.fallbackUsed).toBe(true);
    expect(boundary.warnings).toContain("Financials fallback is active; Overview must label this as fallback-derived.");
  });

  it("preserves missing Financials fields as null and unavailable instead of zero filling", () => {
    const boundary = buildOverviewFinancialsRuntimeBoundary(financialsRuntime);

    expect(boundary.snapshotFields.revenue).toBeNull();
    expect(boundary.snapshotFields.operatingCashFlow).toBeNull();
    expect(boundary.snapshotFields.revenue).not.toBe(0);
    expect(boundary.snapshotFields.operatingCashFlow).not.toBe(0);
    expect(boundary.missingFields).toEqual(["revenue", "operatingCashFlow"]);
    expect(boundary.warnings).toContain("Financials missing fields stay unavailable/null and are not zero-filled.");
  });

  it("does not emit official, realtime, production-approved, or recommendation wording for local research data", () => {
    const boundaryText = JSON.stringify(buildOverviewFinancialsRuntimeBoundary(financialsRuntime)).toLowerCase();
    const blockedPhrases = [
      "official source",
      "realtime",
      "production-approved claim",
      "nen mua",
      "nen ban",
      "tin hieu mua",
      "tin hieu ban",
      "diem mua",
    ];

    for (const phrase of blockedPhrases) {
      expect(boundaryText).not.toContain(phrase);
    }
  });

  it("does not inherit the Financials runtime boundary into Valuation or Risk state", () => {
    const boundary = buildOverviewFinancialsRuntimeBoundary(financialsRuntime);

    expect(boundary.boundaryNote).toContain("Overview");
    expect(boundary).not.toHaveProperty("valuationRuntimeStatus");
    expect(boundary).not.toHaveProperty("riskRuntimeStatus");
  });

  it("warns that existing Overview output remains mixed with static or support sections", () => {
    const boundary = buildOverviewFinancialsRuntimeBoundary(financialsRuntime);

    expect(boundary.warnings).toContain(
      "Overview also uses persisted local API inputs and existing static/support sections, so the source state is mixed.",
    );
  });
});
