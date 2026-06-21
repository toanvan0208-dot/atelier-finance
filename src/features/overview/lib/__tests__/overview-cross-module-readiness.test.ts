import { describe, expect, it } from "vitest";

import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import type { FinancialsStatementSnapshot } from "@/features/financials/lib/map-financials-to-logic-input";
import {
  buildOverviewCrossModuleReadinessSummary,
  forbiddenOverviewReadinessPhrases,
} from "../overview-cross-module-readiness";

const snapshot: FinancialsStatementSnapshot = {
  ticker: "FPTLAB",
  period: "2025",
  periodType: "annual",
  sourceName: "local research sample",
  revenue: 1000,
  netProfit: 100,
  operatingCashFlow: null,
  totalAssets: 2000,
  totalDebt: null,
  totalEquity: 1200,
  eps: null,
  sharesOutstanding: 100,
};

const runtimeData = (): FinancialsRuntimeData => ({
  dataQuality: {
    errors: [],
    missingFields: ["operatingCashFlow", "eps"],
    status: "partial",
    warnings: ["missing fields stay unavailable"],
  },
  readResult: null,
  runtimeStatus: "sample_fallback",
  source: {
    asOf: "2026-06-21",
    dataMode: "sample",
    fallbackUsed: true,
    fiscalYear: 2025,
    periodType: "annual",
    productionApproved: false,
    readPath: "sample_static",
    sourceLabel: "static_sample",
    ticker: "FPTLAB",
  },
  statementSnapshot: snapshot,
  unitMetadata: buildFinancialsUnitMetadata({
    dataMode: "sample",
    explicitUnits: {
      revenue: "billion_vnd",
      netIncome: "billion_vnd",
      sharesOutstanding: "million_shares",
      totalAssets: "billion_vnd",
    },
    snapshot,
    sourceLabel: "static_sample",
  }),
});

const item = (moduleKey: string) => {
  const found = buildOverviewCrossModuleReadinessSummary(runtimeData()).items.find(
    (readiness) => readiness.moduleKey === moduleKey,
  );
  if (!found) throw new Error(`Missing module readiness item: ${moduleKey}`);
  return found;
};

const itemFor = (moduleKey: string, data: FinancialsRuntimeData) => {
  const found = buildOverviewCrossModuleReadinessSummary(data).items.find((readiness) => readiness.moduleKey === moduleKey);
  if (!found) throw new Error(`Missing module readiness item: ${moduleKey}`);
  return found;
};

describe("overview cross-module readiness summary", () => {
  it("includes Financials readiness with source, unit, missing data, and productionApproved:false", () => {
    const financials = item("financials");

    expect(financials.label).toBe("Financials");
    expect(financials.productionApproved).toBe(false);
    expect(financials.sourceStatus).toBe("not_approved");
    expect(financials.unitStatus).toBe("partial");
    expect(financials.blockedReasons).toEqual(
      expect.arrayContaining(["operatingCashFlow_missing", "eps_missing", "productionApproved:false"]),
    );
  });

  it("marks Financials db_backed only when runtime actually used local DB rows", () => {
    const dbBackedFinancials = itemFor("financials", {
      ...runtimeData(),
      runtimeStatus: "db_backed",
      source: {
        ...runtimeData().source,
        dataMode: "research_only",
        fallbackUsed: false,
        readPath: "local_db",
      },
    });
    const fallbackFinancials = itemFor("financials", runtimeData());

    expect(dbBackedFinancials.dataMode).toBe("db_backed");
    expect(dbBackedFinancials.productionApproved).toBe(false);
    expect(fallbackFinancials.dataMode).toBe("sample");
    expect(JSON.stringify(fallbackFinancials)).not.toContain('"dataMode":"db_backed"');
  });

  it("includes Valuation boundary status without claiming full DB-backed readiness", () => {
    const valuation = item("valuation");
    const text = JSON.stringify(valuation);

    expect(valuation.label).toBe("Valuation");
    expect(valuation.status).toBe("blocked");
    expect(valuation.productionApproved).toBe(false);
    expect(text).toContain("canClaimValuationDbBacked:false");
    expect(text.toLowerCase()).not.toContain("fully db-backed ready");
  });

  it("marks Valuation partial, not complete, when only Financials input is DB-backed", () => {
    const dbBackedRuntime = {
      ...runtimeData(),
      runtimeStatus: "db_backed",
      source: {
        ...runtimeData().source,
        dataMode: "research_only",
        fallbackUsed: false,
        readPath: "local_db",
      },
    } satisfies FinancialsRuntimeData;
    const valuation = itemFor("valuation", dbBackedRuntime);
    const text = JSON.stringify(valuation);

    expect(valuation.status).toBe("partial");
    expect(valuation.productionApproved).toBe(false);
    expect(text).toContain("Market price missing");
    expect(text).toContain("canClaimValuationDbBacked:false");
    expect(text.toLowerCase()).not.toContain("fully db-backed");
  });

  it("includes Technical/PVT source and unit readiness status", () => {
    const technical = item("technical");

    expect(technical.label).toBe("Technical/PVT");
    expect(technical.sourceStatus).toBe("not_approved");
    expect(technical.unitStatus).toBe("unknown");
    expect(technical.blockedReasons).toEqual(
      expect.arrayContaining(["market_source_not_approved", "issuer_metadata_not_verified"]),
    );
  });

  it("includes Macro and Industry boundary-only readiness without production data claims", () => {
    const macro = item("macro");
    const industry = item("industry");

    expect(macro.status).toBe("boundary_only");
    expect(industry.status).toBe("boundary_only");
    expect(macro.sourceStatus).toBe("missing");
    expect(industry.sourceStatus).toBe("missing");
    expect(JSON.stringify([macro, industry])).toContain("productionApproved:false");
    expect(JSON.stringify([macro, industry]).toLowerCase()).not.toContain("production data ready");
  });

  it("shows blocked reasons without zero-filling missing data", () => {
    const summary = buildOverviewCrossModuleReadinessSummary(runtimeData());
    const text = JSON.stringify(summary);

    expect(text).toContain("missing_values_stay_null_not_zero");
    expect(text).toContain("Du lieu thieu giu la null/unavailable, khong thay bang 0.");
    expect(text).not.toContain("zero-filled");
  });

  it("does not expose recommendation, target, import, upload, parser, API, or write capability wording", () => {
    const text = JSON.stringify(buildOverviewCrossModuleReadinessSummary(runtimeData())).toLowerCase();

    for (const phrase of forbiddenOverviewReadinessPhrases) {
      expect(text).not.toContain(phrase);
    }
  });
});
