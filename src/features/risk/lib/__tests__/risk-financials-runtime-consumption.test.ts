import { describe, expect, it } from "vitest";

import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildRiskFinancialsRuntimeConsumption } from "../risk-financials-runtime-consumption";

const localDbRuntime = {
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
    warnings: ["Local research fields are partial."],
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

describe("risk financials runtime consumption boundary", () => {
  it("uses mixed source mode when local research Financials runtime is available and static Risk cards remain", () => {
    const result = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: localDbRuntime });

    expect(result.riskSourceMode).toBe("mixed_source");
    expect(result.financialsRuntimeAvailable).toBe(true);
    expect(result.riskConsumesFinancialsRuntime).toBe(true);
    expect(result.canClaimRiskDbBacked).toBe(false);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings).toContain("Risk display cards still use the static/sample calculation path.");
    expect(result.warnings).toContain(
      "Financials runtime is consumed only as controlled metadata and available snapshot fields.",
    );
  });

  it("reports consumed and unavailable fields without inventing debt or liquidity values", () => {
    const result = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: localDbRuntime });

    expect(result.consumedFields).toEqual(["netIncome", "totalAssets", "equity"]);
    expect(result.unavailableFields).toEqual([
      "revenue",
      "operatingCashFlow",
      "totalDebt",
      "currentAssets",
      "currentLiabilities",
    ]);
  });

  it("keeps operating cash flow missing as insufficient data without strong conclusion wording", () => {
    const result = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: localDbRuntime });
    const output = JSON.stringify(result).toLowerCase();

    expect(result.calculationReadiness.cashFlowQuality).toBe("insufficient_data");
    expect(output).not.toContain("cash-flow quality is good");
    expect(output).not.toContain("cash-flow quality is bad");
    expect(output).not.toContain("chac chan");
  });

  it("keeps earnings quality unavailable when net income is missing", () => {
    const result = buildRiskFinancialsRuntimeConsumption({
      financialsRuntimeData: {
        ...localDbRuntime,
        statementSnapshot: {
          ...localDbRuntime.statementSnapshot,
          netProfit: null,
        },
      },
    });

    expect(result.calculationReadiness.earningsQuality).toBe("insufficient_data");
  });

  it("keeps leverage not ready when debt is missing", () => {
    const result = buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: localDbRuntime });

    expect(result.calculationReadiness.leverageRisk).toBe("insufficient_data");
    expect(result.unavailableFields).toContain("totalDebt");
  });

  it("keeps leverage not ready when equity is missing and does not zero-fill it", () => {
    const result = buildRiskFinancialsRuntimeConsumption({
      financialsRuntimeData: {
        ...localDbRuntime,
        statementSnapshot: {
          ...localDbRuntime.statementSnapshot,
          totalEquity: null,
        },
      },
    });

    expect(result.calculationReadiness.leverageRisk).toBe("insufficient_data");
    expect(result.consumedFields).not.toContain("equity");
    expect(result.unavailableFields).toContain("equity");
  });

  it("marks leverage not applicable when equity is non-positive", () => {
    for (const totalEquity of [0, -1]) {
      const result = buildRiskFinancialsRuntimeConsumption({
        financialsRuntimeData: {
          ...localDbRuntime,
          statementSnapshot: {
            ...localDbRuntime.statementSnapshot,
            totalEquity,
          },
        },
      });

      expect(result.calculationReadiness.leverageRisk).not.toBe("ready");
      expect(result.warnings.join(" ")).toContain("equity non-positive");
    }
  });

  it("keeps asset-scaled risk not ready when total assets are missing or non-positive", () => {
    for (const totalAssets of [null, 0, -1]) {
      const result = buildRiskFinancialsRuntimeConsumption({
        financialsRuntimeData: {
          ...localDbRuntime,
          statementSnapshot: {
            ...localDbRuntime.statementSnapshot,
            totalAssets,
          },
        },
      });

      expect(result.calculationReadiness.assetScaledRisk).not.toBe("ready");
    }
  });

  it("keeps liquidity not ready when current liabilities are missing or non-positive", () => {
    for (const currentLiabilities of [null, 0, -1]) {
      const result = buildRiskFinancialsRuntimeConsumption({
        financialsRuntimeData: {
          ...localDbRuntime,
          statementSnapshot: {
            ...localDbRuntime.statementSnapshot,
            currentAssets: 500,
            currentLiabilities,
          },
        },
      });

      expect(result.calculationReadiness.liquidityRisk).not.toBe("ready");
    }
  });

  it("labels Financials fallback explicitly and keeps production approval false", () => {
    const result = buildRiskFinancialsRuntimeConsumption({
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

    expect(result.riskSourceMode).toBe("sample_fallback");
    expect(result.fallbackUsed).toBe(true);
    expect(result.productionApproved).toBe(false);
    expect(result.warnings).toContain("Financials fallback is active; Risk source state must remain labeled as fallback.");
  });

  it("does not emit forbidden source, certainty, or action wording", () => {
    const output = JSON.stringify(buildRiskFinancialsRuntimeConsumption({ financialsRuntimeData: localDbRuntime })).toLowerCase();
    const blockedPhrases = [
      "co phieu an toan",
      "rui ro thap chac chan",
      "chac chan xau",
      "an toan",
      "dang mua",
      "nen mua",
      "tin hieu mua",
      "official",
      "realtime",
      "production-ready",
      "production-approved",
    ];

    for (const phrase of blockedPhrases) {
      expect(output).not.toContain(phrase);
    }
  });
});
