import { describe, expect, it } from "vitest";

import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import { buildRiskFinancialsRuntimeReadiness } from "../risk-financials-runtime-readiness";

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
    missingFields: ["operatingCashFlow", "currentLiabilities"],
    warnings: ["Some local research fields are missing."],
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

describe("risk financials runtime readiness boundary", () => {
  it("does not let Risk claim DB-backed when Financials local DB runtime exists but Risk is not wired", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      financialsRuntimeData: localDbFinancialsRuntime,
      riskConsumesFinancialsRuntime: false,
      inputs: {
        operatingCashFlow: 100,
        netIncome: 90,
        revenue: 1000,
        totalDebt: 300,
        equity: 1200,
        totalAssets: 2000,
        currentAssets: 500,
        currentLiabilities: 250,
      },
    });

    expect(readiness.financialsRuntimeStatus).toBe("db_backed");
    expect(readiness.financialsReadPath).toBe("local_db");
    expect(readiness.riskRuntimeStatus).toBe("mixed_source");
    expect(readiness.riskConsumesFinancialsRuntime).toBe(false);
    expect(readiness.canClaimRiskDbBacked).toBe(false);
    expect(readiness.productionApproved).toBe(false);
    expect(readiness.warnings).toContain("Financials runtime available, but Risk calculation is not yet wired.");
  });

  it("marks cash-flow quality not ready when operatingCashFlow is missing without strong conclusion wording", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      inputs: { operatingCashFlow: null, netIncome: 90, revenue: 1000, totalDebt: 300, equity: 1200, totalAssets: 2000, currentAssets: 500, currentLiabilities: 250 },
    });
    const output = JSON.stringify(readiness).toLowerCase();

    expect(readiness.calculationReadiness.cashFlowQuality).toBe("insufficient_data");
    expect(output).not.toContain("cash-flow quality is good");
    expect(output).not.toContain("cash-flow quality is bad");
    expect(output).not.toContain("chac chan");
    expect(output).not.toContain("safe");
  });

  it("marks earnings quality not ready when netIncome is missing", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      inputs: { operatingCashFlow: 100, netIncome: null, revenue: 1000, totalDebt: 300, equity: 1200, totalAssets: 2000, currentAssets: 500, currentLiabilities: 250 },
    });

    expect(readiness.calculationReadiness.earningsQuality).toBe("insufficient_data");
    expect(readiness.blockedReasons.join(" ")).toContain("netIncome missing");
  });

  it("marks revenue-related data quality not ready when revenue is missing", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      inputs: { operatingCashFlow: 100, netIncome: 90, revenue: null, totalDebt: 300, equity: 1200, totalAssets: 2000, currentAssets: 500, currentLiabilities: 250 },
    });

    expect(readiness.calculationReadiness.dataQualityRisk).toBe("insufficient_data");
    expect(readiness.blockedReasons.join(" ")).toContain("revenue missing");
  });

  it("marks leverage risk not ready when debt is missing", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      inputs: { operatingCashFlow: 100, netIncome: 90, revenue: 1000, totalDebt: null, equity: 1200, totalAssets: 2000, currentAssets: 500, currentLiabilities: 250 },
    });

    expect(readiness.calculationReadiness.leverageRisk).toBe("insufficient_data");
    expect(readiness.blockedReasons.join(" ")).toContain("debt missing");
  });

  it("marks leverage risk not ready when equity is missing and does not zero-fill it", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      inputs: { operatingCashFlow: 100, netIncome: 90, revenue: 1000, totalDebt: 300, equity: null, totalAssets: 2000, currentAssets: 500, currentLiabilities: 250 },
    });

    expect(readiness.calculationReadiness.leverageRisk).toBe("insufficient_data");
    expect(readiness.inputSnapshot.equity).toBeNull();
    expect(readiness.inputSnapshot.equity).not.toBe(0);
  });

  it("marks equity-based risk not applicable when equity is zero or negative", () => {
    for (const equity of [0, -1]) {
      const readiness = buildRiskFinancialsRuntimeReadiness({
        inputs: { operatingCashFlow: 100, netIncome: 90, revenue: 1000, totalDebt: 300, equity, totalAssets: 2000, currentAssets: 500, currentLiabilities: 250 },
      });

      expect(readiness.calculationReadiness.leverageRisk).toBe("not_applicable");
      expect(readiness.blockedReasons.join(" ")).toContain("equity non-positive");
    }
  });

  it("marks asset-scaled risk not ready when totalAssets is missing or non-positive", () => {
    for (const totalAssets of [null, 0, -1]) {
      const readiness = buildRiskFinancialsRuntimeReadiness({
        inputs: { operatingCashFlow: 100, netIncome: 90, revenue: 1000, totalDebt: 300, equity: 1200, totalAssets, currentAssets: 500, currentLiabilities: 250 },
      });

      expect(readiness.calculationReadiness.assetScaledRisk).not.toBe("ready");
      expect(readiness.missingValuePolicy.divideByZeroAllowed).toBe(false);
    }
  });

  it("marks liquidity risk not ready when current liabilities are missing or non-positive", () => {
    for (const currentLiabilities of [null, 0, -1]) {
      const readiness = buildRiskFinancialsRuntimeReadiness({
        inputs: { operatingCashFlow: 100, netIncome: 90, revenue: 1000, totalDebt: 300, equity: 1200, totalAssets: 2000, currentAssets: 500, currentLiabilities },
      });

      expect(readiness.calculationReadiness.liquidityRisk).not.toBe("ready");
      expect(readiness.missingValuePolicy.divideByZeroAllowed).toBe(false);
    }
  });

  it("keeps production approval false for sample, local, and research-only data", () => {
    const sample = buildRiskFinancialsRuntimeReadiness({
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
    });
    const local = buildRiskFinancialsRuntimeReadiness({ financialsRuntimeData: localDbFinancialsRuntime });
    const missing = buildRiskFinancialsRuntimeReadiness();

    expect(sample.productionApproved).toBe(false);
    expect(local.productionApproved).toBe(false);
    expect(missing.productionApproved).toBe(false);
    expect(sample.warnings).toContain("Financials fallback is active; Risk readiness must treat it as fallback-derived.");
  });

  it("keeps missing/null policy explicit and never substitutes zero", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness();

    expect(readiness.missingValuePolicy).toMatchObject({
      missingValue: "null",
      displayFallback: "unavailable",
      substituteZeroForMissing: false,
      divideByZeroAllowed: false,
    });
    expect(readiness.inputSnapshot.operatingCashFlow).toBeNull();
    expect(readiness.inputSnapshot.operatingCashFlow).not.toBe(0);
  });

  it("maps totalDebt from statementSnapshot.totalDebt when explicit input is missing", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      financialsRuntimeData: {
        ...localDbFinancialsRuntime,
         
        statementSnapshot: {
          ...localDbFinancialsRuntime.statementSnapshot,
          totalDebt: 5000,
        } as never,
      },
    });

    expect(readiness.inputSnapshot.totalDebt).toBe(5000);
  });

  it("does not map totalLiabilities to totalDebt", () => {
    const readiness = buildRiskFinancialsRuntimeReadiness({
      financialsRuntimeData: {
        ...localDbFinancialsRuntime,
        statementSnapshot: {
          ...localDbFinancialsRuntime.statementSnapshot,
          totalDebt: null,
          totalLiabilities: 10000,
         
        } as never,
      },
    });

    expect(readiness.inputSnapshot.totalDebt).toBeNull();
  });

  it("does not expose forbidden source, certainty, or action wording", () => {
    const output = JSON.stringify(
      buildRiskFinancialsRuntimeReadiness({
        financialsRuntimeData: localDbFinancialsRuntime,
        inputs: { operatingCashFlow: null, netIncome: null, revenue: null, totalDebt: null, equity: -1, totalAssets: 0, currentAssets: null, currentLiabilities: 0 },
      }),
    ).toLowerCase();
    const blockedPhrases = [
      "co phieu an toan",
      "rui ro thap chac chan",
      "chac chan xau",
      "nen mua",
      "tin hieu mua",
      "official",
      "realtime",
      "production-approved",
      "safe stock",
    ];

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
