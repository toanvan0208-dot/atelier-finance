import { describe, expect, it } from "vitest";
import { calculateRevenueGrowth } from "../../../../lib/financial-logic";
import { buildFinancialReadingDeskData } from "../build-financial-reading-desk-data";
import { mapFinancialsToLogicInput, type FinancialsStatementSnapshot } from "../map-financials-to-logic-input";
import type { FinancialReadingDeskData } from "../../types";

const snapshot: FinancialsStatementSnapshot = {
  ticker: "ABC",
  companyType: "non_financial",
  period: "FY2025",
  revenue: 1_200,
  previousRevenue: 1_000,
  grossProfit: 300,
  netProfit: 100,
  previousNetProfit: 80,
  totalAssets: 2_000,
  previousTotalAssets: 1_800,
  totalLiabilities: 800,
  totalEquity: 1_200,
  previousTotalEquity: 1_100,
  totalDebt: 300,
  currentAssets: 700,
  currentLiabilities: 500,
  operatingCashFlow: 90,
  capitalExpenditure: 40,
  sourceName: "Unit test",
  collectedAt: "2026-06-01",
};

const baseDeskData: FinancialReadingDeskData = {
  ticker: "ABC",
  companyName: "ABC",
  period: "FY2025",
  preliminaryConclusion: {
    status: "Cần kiểm tra thêm",
    summary: "Base summary",
    score: 50,
    scoreNote: "Base note",
  },
  nextReadingStep: {
    stepId: "cash-quality",
    title: "Cash",
    reason: "Reason",
  },
  valuationReadiness: {
    status: "Cần kiểm tra thêm",
    missing: [],
    reason: "Base valuation note",
  },
  warnings: [],
  metrics: [],
  statementMap: [],
  readingSteps: [],
  cashQuality: {
    title: "Cash quality",
    summary: "Cash quality",
    checks: [],
  },
  riskCheck: {
    title: "Risk",
    summary: "Risk",
    checks: [],
  },
  conclusion: {
    confirmed: [],
    notConfirmed: [],
    weakeningSignals: [],
    readiness: {
      status: "Cần kiểm tra thêm",
      reason: "Reason",
    },
  },
};

describe("financials logic adapter", () => {
  it("maps module snapshot fields to FinancialStatementInput without calculating ratios", () => {
    const input = mapFinancialsToLogicInput(snapshot);

    expect(input.revenue).toBe(1_200);
    expect(input.previousRevenue).toBe(1_000);
    expect(input.companyType).toBe("non_financial");
    expect(input.periodType).toBe("annual");
  });

  it("keeps missing data as null in downstream financial logic", () => {
    const input = mapFinancialsToLogicInput({ revenue: null, previousRevenue: 1_000 });
    const revenueGrowth = calculateRevenueGrowth(input);

    expect(revenueGrowth.value).toBeNull();
    expect(revenueGrowth.missingFields).toContain("revenue");
    expect(revenueGrowth.displayValue).not.toBe("0%");
  });

  it("builds reading desk metrics from financial logic output", () => {
    const data = buildFinancialReadingDeskData(baseDeskData, snapshot);
    const revenueGrowth = data.metrics.find((metric) => metric.id === "revenue-growth");
    const freeCashFlow = data.metrics.find((metric) => metric.id === "fcf");

    expect(revenueGrowth?.value).toBe("20.0%");
    expect(revenueGrowth?.logicKey).toBe("revenueGrowth");
    expect(freeCashFlow?.value).toBe("50 tỷ VND");
    expect(data.preliminaryConclusion.scoreNote).toMatch(/không phải chỉ dẫn giao dịch/i);
  });
});
