import { describe, expect, it } from "vitest";

import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import { buildValuationFinancialsRuntimeConsumption } from "../valuation-financials-runtime-consumption";

const localDbRuntime = {
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
    missingFields: ["eps", "sharesOutstanding"],
    warnings: ["Local research fields are partial."],
    errors: [],
  },
  statementSnapshot: {
    ticker: "FPT",
    period: "2024",
    periodType: "annual",
    sourceName: "phase45_synthetic_financial_statement_local_write",
    collectedAt: null,
    revenue: 1000,
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
  unitMetadata: buildFinancialsUnitMetadata(),
} satisfies FinancialsRuntimeData;

describe("valuation financials runtime consumption boundary", () => {
  it("uses mixed source mode when local research Financials runtime is available and persisted bridge remains the calculation path", () => {
    const result = buildValuationFinancialsRuntimeConsumption({
      financialsRuntimeData: localDbRuntime,
      persistedBridgeInputs: { eps: 10, equity: 1200, marketPrice: 50, sharesOutstanding: 100 },
    });

    expect(result.valuationSourceMode).toBe("mixed_source");
    expect(result.financialsRuntimeAvailable).toBe(true);
    expect(result.valuationConsumesFinancialsRuntime).toBe(true);
    expect(result.canClaimValuationDbBacked).toBe(false);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings).toContain("Valuation calculations still use the persisted input bridge.");
    expect(result.warnings).toContain("Financials runtime is consumed only as controlled metadata and safe snapshot fields.");
  });

  it("reports consumed and unavailable safe fields without inventing values", () => {
    const result = buildValuationFinancialsRuntimeConsumption({ financialsRuntimeData: localDbRuntime });

    expect(result.consumedFields).toEqual(["revenue", "netIncome", "totalAssets", "equity"]);
    expect(result.unavailableFields).toEqual(["operatingCashFlow", "sharesOutstanding", "eps"]);
  });

  it("keeps P/E not ready when EPS is missing and avoids valuation conclusion wording", () => {
    const result = buildValuationFinancialsRuntimeConsumption({
      financialsRuntimeData: localDbRuntime,
      persistedBridgeInputs: { eps: null, equity: 1200, marketPrice: 50, sharesOutstanding: 100 },
    });
    const output = JSON.stringify(result).toLowerCase();

    expect(result.calculationReadiness.pe).toBe("insufficient_data");
    expect(output).not.toContain("cheap");
    expect(output).not.toContain("hap dan");
    expect(output).not.toContain("dang re");
    expect(output).not.toContain("dang mua");
  });

  it("marks P/E not applicable when EPS is non-positive", () => {
    for (const eps of [0, -1]) {
      const result = buildValuationFinancialsRuntimeConsumption({
        financialsRuntimeData: localDbRuntime,
        persistedBridgeInputs: { eps, equity: 1200, marketPrice: 50, sharesOutstanding: 100 },
      });

      expect(result.calculationReadiness.pe).toBe("not_applicable");
    }
  });

  it("keeps equity missing as null-equivalent readiness and does not zero-fill", () => {
    const result = buildValuationFinancialsRuntimeConsumption({
      persistedBridgeInputs: { eps: 10, equity: null, marketPrice: 50, sharesOutstanding: 100 },
    });

    expect(result.calculationReadiness.pb).toBe("insufficient_data");
    expect(result.calculationReadiness.bvps).toBe("insufficient_data");
    expect(result.calculationReadiness.roe).toBe("insufficient_data");
    expect(result.warnings.join(" ")).toContain("Equity and BVPS missing");
    expect(result.warnings.join(" ")).not.toContain("equity 0");
  });

  it("marks equity-based readiness not applicable when equity is non-positive", () => {
    for (const equity of [0, -1]) {
      const result = buildValuationFinancialsRuntimeConsumption({
        persistedBridgeInputs: { eps: 10, equity, marketPrice: 50, sharesOutstanding: 100 },
      });

      expect(result.calculationReadiness.pb).toBe("not_applicable");
      expect(result.calculationReadiness.bvps).toBe("not_applicable");
      expect(result.calculationReadiness.roe).toBe("not_applicable");
    }
  });

  it("keeps market readiness unavailable when market price is missing", () => {
    const result = buildValuationFinancialsRuntimeConsumption({
      persistedBridgeInputs: { eps: 10, equity: 1200, marketPrice: null, sharesOutstanding: 100 },
    });

    expect(result.calculationReadiness.marketCap).toBe("insufficient_data");
  });

  it("keeps market cap and share-based metrics unavailable when shares outstanding is missing or non-positive", () => {
    for (const sharesOutstanding of [null, 0, -1]) {
      const result = buildValuationFinancialsRuntimeConsumption({
        persistedBridgeInputs: { eps: 10, equity: 1200, marketPrice: 50, sharesOutstanding },
      });

      expect(result.calculationReadiness.marketCap).toBe("insufficient_data");
      expect(result.calculationReadiness.bvps).not.toBe("ready");
    }
  });

  it("labels Financials fallback explicitly and keeps production approval false", () => {
    const result = buildValuationFinancialsRuntimeConsumption({
      financialsRuntimeData: {
        ...localDbRuntime,
        runtimeStatus: "sample_fallback",
        source: {
          ...localDbRuntime.source,
          dataMode: "sample",
          fallbackUsed: true,
          readPath: "sample_static",
        },
      },
    });

    expect(result.valuationSourceMode).toBe("sample_fallback");
    expect(result.fallbackUsed).toBe(true);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings).toContain("Financials fallback is active; source state must remain labeled as fallback.");
  });

  it("does not emit forbidden source or action wording", () => {
    const output = JSON.stringify(
      buildValuationFinancialsRuntimeConsumption({
        financialsRuntimeData: localDbRuntime,
        persistedBridgeInputs: { eps: -1, equity: -1, marketPrice: null, sharesOutstanding: null },
      }),
    ).toLowerCase();
    const blockedPhrases = [
      "nen mua",
      "tin hieu mua",
      "dinh gia hap dan",
      "dang re",
      "dang mua",
      "official",
      "realtime",
      "production-ready",
      "production-approved",
      "cheap",
    ];

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
