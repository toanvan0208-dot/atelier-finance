import { describe, expect, it } from "vitest";
import { calculateFinancialHealth } from "../health";
import { calculatePeRatio } from "../valuation";
import { calculateOverallRiskScore } from "../risk";

describe("risk guardrails", () => {
  it("does not allow poor data quality to produce low overall risk", () => {
    const overallRisk = calculateOverallRiskScore({
      revenue: 10_000,
      previousRevenue: 9_500,
      grossProfit: 3_000,
      operatingProfit: 1_500,
      netProfit: 1_000,
      previousNetProfit: 900,
      totalAssets: 20_000,
      previousTotalAssets: 19_000,
      totalLiabilities: 5_000,
      totalEquity: 15_000,
      previousTotalEquity: 14_500,
      cashAndEquivalents: 4_000,
      totalDebt: 1_000,
      currentAssets: 8_000,
      currentLiabilities: 3_000,
      operatingCashFlow: 1_200,
      closePrice: 50_000,
      previousClosePrice: 49_000,
      avgTradingValue20d: 50_000_000_000,
      sharesOutstanding: 100_000_000,
      sourceName: null,
      collectedAt: null,
    });

    expect(overallRisk.score).not.toBeNull();
    expect(overallRisk.score).toBeGreaterThanOrEqual(60);
    expect(overallRisk.level).not.toBe("low");
  });

  it("does not emit buy sell hold or recommendation language in core outputs", () => {
    const outputs = [
      calculatePeRatio({ closePrice: 50_000, eps: 4_000 }),
      calculateOverallRiskScore({
        revenue: 10_000,
        netProfit: 1_000,
        totalAssets: 20_000,
        totalLiabilities: 5_000,
        totalEquity: 15_000,
        operatingCashFlow: 1_200,
        closePrice: 50_000,
        volume: 1_000_000,
        sourceName: "Test source",
        collectedAt: new Date(),
      }),
      calculateFinancialHealth({
        revenue: 10_000,
        netProfit: 1_000,
        totalAssets: 20_000,
        totalLiabilities: 5_000,
        totalEquity: 15_000,
        operatingCashFlow: 1_200,
        closePrice: 50_000,
        volume: 1_000_000,
        sourceName: "Test source",
        collectedAt: new Date(),
      }),
    ];
    const text = JSON.stringify(outputs).toLowerCase();

    expect(text).not.toMatch(/nên mua|nên bán|buy|sell|hold|recommendation/);
    expect(text).not.toContain("mua");
    expect(text).not.toContain("bán");
  });
});
