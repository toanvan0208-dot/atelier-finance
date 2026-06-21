import { describe, expect, it } from "vitest";

import {
  buildFinancialsDataSourceTransparency,
  forbiddenFinancialsTransparencyUiWarningPhrases,
} from "../financials-data-source-transparency";
import { buildFinancialsUnitMetadata, type FinancialsUnitMetadataMap } from "../financials-unit-metadata-contract";
import type { FinancialsRuntimeData } from "../financials-runtime-types";
import type { FinancialsStatementSnapshot } from "../map-financials-to-logic-input";

const snapshot = {
  ticker: "FPT",
  period: "2024",
  periodType: "annual",
  sourceName: "phase83_inline_runtime_fixture",
  collectedAt: "2026-06-21",
  revenue: 1000,
  previousRevenue: null,
  grossProfit: null,
  operatingProfit: null,
  netProfit: 100,
  previousNetProfit: null,
  totalAssets: 5000,
  previousTotalAssets: null,
  totalLiabilities: null,
  totalEquity: 2000,
  previousTotalEquity: null,
  currentAssets: 3000,
  currentLiabilities: 1200,
  operatingCashFlow: 300,
  previousOperatingCashFlow: null,
  capitalExpenditure: null,
  sharesOutstanding: 100,
  eps: 1000,
} satisfies FinancialsStatementSnapshot;

const explicitUnits = {
  currentAssets: "billion_vnd",
  currentLiabilities: "billion_vnd",
  eps: "vnd_per_share",
  equity: "billion_vnd",
  netIncome: "billion_vnd",
  operatingCashFlow: "billion_vnd",
  revenue: "billion_vnd",
  sharesOutstanding: "million_shares",
  totalAssets: "billion_vnd",
  totalDebt: "billion_vnd",
} as const;

const runtime = (patch: Partial<FinancialsRuntimeData> = {}): FinancialsRuntimeData => {
  const statementSnapshot = patch.statementSnapshot === undefined ? snapshot : patch.statementSnapshot;
  const unitMetadata =
    patch.unitMetadata ??
    buildFinancialsUnitMetadata({
      dataMode: "research_only",
      explicitUnits,
      snapshot: statementSnapshot,
      sourceLabel: "phase83_inline_runtime_fixture",
    });

  return {
    runtimeStatus: "db_backed",
    source: {
      sourceLabel: "phase83_inline_runtime_fixture",
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
      status: "available",
      missingFields: [],
      warnings: [],
      errors: [],
    },
    statementSnapshot,
    unitMetadata,
    readResult: null,
    ...patch,
  };
};

describe("financials data source transparency", () => {
  it("keeps productionApproved:false visible for research, local, manual, and sample data", () => {
    const research = buildFinancialsDataSourceTransparency(runtime());
    const sample = buildFinancialsDataSourceTransparency(
      runtime({
        runtimeStatus: "sample_fallback",
        source: {
          ...runtime().source,
          dataMode: "sample",
          fallbackUsed: true,
          readPath: "sample_static",
          sourceLabel: "static_sample_financials",
        },
      }),
    );
    const manual = buildFinancialsDataSourceTransparency(
      runtime({
        runtimeStatus: "unavailable",
        source: { ...runtime().source, dataMode: "manual", readPath: "unavailable", sourceLabel: "manual_preview" },
      }),
    );

    expect(research.productionApproved).toBe(false);
    expect(sample.productionApproved).toBe(false);
    expect(manual.productionApproved).toBe(false);
    expect(research.uiWarnings.join(" ")).toContain("productionApproved:false");
    expect(sample.dataMode).toBe("sample");
    expect(manual.dataMode).toBe("manual");
  });

  it("does not label local research, manual, or sample data as official, realtime, or production-approved", () => {
    const outputs = [
      buildFinancialsDataSourceTransparency(runtime()),
      buildFinancialsDataSourceTransparency(
        runtime({ source: { ...runtime().source, dataMode: "manual", sourceLabel: "manual_preview" } }),
      ),
      buildFinancialsDataSourceTransparency(
        runtime({
          runtimeStatus: "sample_fallback",
          source: { ...runtime().source, dataMode: "sample", fallbackUsed: true, readPath: "sample_static" },
        }),
      ),
    ];
    const serialized = JSON.stringify(outputs).toLowerCase();

    expect(serialized).not.toContain("official");
    expect(serialized).not.toContain("realtime");
    expect(serialized).not.toContain("production-approved");
    expect(serialized).not.toContain("production ready");
  });

  it("marks explicit units as explicit and allows a ready Financials-to-Valuation handoff state", () => {
    const result = buildFinancialsDataSourceTransparency(runtime());

    expect(result.unitMetadataStatus).toBe("explicit");
    expect(result.valuationHandoffStatus).toBe("ready_with_explicit_units");
    expect(result.blockedReasons).toEqual([]);
  });

  it("blocks handoff when units are missing or unknown", () => {
    const missingUnits = buildFinancialsDataSourceTransparency(
      runtime({ unitMetadata: buildFinancialsUnitMetadata({ snapshot, sourceLabel: "phase83_inline_runtime_fixture" }) }),
    );

    expect(missingUnits.unitMetadataStatus).toBe("unknown");
    expect(missingUnits.valuationHandoffStatus).toBe("blocked");
    expect(missingUnits.blockedReasons).toContain("revenue_unit_unknown");
    expect(missingUnits.blockedReasons).toContain("eps_explicit_unit_required");
  });

  it("blocks handoff when unit metadata is invalid", () => {
    const unitMetadata: FinancialsUnitMetadataMap = {
      ...buildFinancialsUnitMetadata({ explicitUnits, snapshot, sourceLabel: "phase83_inline_runtime_fixture" }),
      eps: {
        ...buildFinancialsUnitMetadata({ explicitUnits, snapshot, sourceLabel: "phase83_inline_runtime_fixture" }).eps,
        status: "invalid_unit",
        unit: "vnd",
        warnings: ["eps_financials_unit_vnd_invalid"],
      },
    };
    const result = buildFinancialsDataSourceTransparency(runtime({ unitMetadata }));

    expect(result.unitMetadataStatus).toBe("invalid");
    expect(result.valuationHandoffStatus).toBe("blocked");
    expect(result.blockedReasons).toContain("eps_unit_invalid");
  });

  it("lists missing important fields without zero-filling values", () => {
    const result = buildFinancialsDataSourceTransparency(
      runtime({
        dataQuality: { status: "partial", missingFields: ["revenue"], warnings: [], errors: [] },
        statementSnapshot: { ...snapshot, revenue: null, operatingCashFlow: null },
        unitMetadata: buildFinancialsUnitMetadata({
          explicitUnits,
          snapshot: { ...snapshot, revenue: null, operatingCashFlow: null },
          sourceLabel: "phase83_inline_runtime_fixture",
        }),
      }),
    );

    expect(result.missingFields).toEqual(expect.arrayContaining(["operatingCashFlow", "revenue"]));
    expect(result.missingFields).not.toContain("0");
    expect(JSON.stringify(result)).not.toContain('":0');
  });

  it("keeps valuation handoff ready only when available fields have explicit valid metadata", () => {
    const ready = buildFinancialsDataSourceTransparency(runtime());
    const partial = buildFinancialsDataSourceTransparency(
      runtime({
        dataQuality: { status: "partial", missingFields: ["operatingCashFlow"], warnings: [], errors: [] },
        statementSnapshot: { ...snapshot, operatingCashFlow: null },
        unitMetadata: buildFinancialsUnitMetadata({
          explicitUnits,
          snapshot: { ...snapshot, operatingCashFlow: null },
          sourceLabel: "phase83_inline_runtime_fixture",
        }),
      }),
    );
    const blocked = buildFinancialsDataSourceTransparency(
      runtime({ unitMetadata: buildFinancialsUnitMetadata({ snapshot, sourceLabel: "phase83_inline_runtime_fixture" }) }),
    );

    expect(ready.valuationHandoffStatus).toBe("ready_with_explicit_units");
    expect(partial.valuationHandoffStatus).toBe("partial");
    expect(blocked.valuationHandoffStatus).toBe("blocked");
  });

  it("keeps Financials DB-backed separate from Valuation DB-backed claims", () => {
    const result = buildFinancialsDataSourceTransparency(runtime());

    expect(result.canClaimFinancialsDbBacked).toBe(true);
    expect(result.canClaimValuationDbBacked).toBe(false);
    expect(result.uiWarnings.join(" ")).toContain("canClaimValuationDbBacked:false");
  });

  it("keeps UI warnings away from recommendation, target, and fair-value wording", () => {
    const result = buildFinancialsDataSourceTransparency(runtime());
    const warnings = result.uiWarnings.join(" ").toLowerCase();

    for (const phrase of forbiddenFinancialsTransparencyUiWarningPhrases) {
      expect(warnings).not.toContain(phrase);
    }
    expect(warnings).not.toContain("recommendation");
    expect(warnings).not.toContain("target price");
    expect(warnings).not.toContain("fair value");
  });

  it("returns a stable UI-safe shape", () => {
    const result = buildFinancialsDataSourceTransparency(runtime());

    expect(Object.keys(result).sort()).toEqual([
      "blockedReasons",
      "canClaimFinancialsDbBacked",
      "canClaimValuationDbBacked",
      "dataMode",
      "missingFields",
      "productionApproved",
      "sourceEvidenceStatus",
      "sourceLabel",
      "sourceOwner",
      "uiWarnings",
      "unitMetadataStatus",
      "valuationHandoffStatus",
    ]);
    expect(result).toMatchObject({
      dataMode: "db_backed",
      productionApproved: false,
      sourceEvidenceStatus: "not_approved",
      unitMetadataStatus: "explicit",
      canClaimFinancialsDbBacked: true,
      canClaimValuationDbBacked: false,
    });
  });
});
