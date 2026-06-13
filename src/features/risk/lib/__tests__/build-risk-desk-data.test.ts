import { describe, expect, it } from "vitest";
import { calculateEarningsQualityRisk, calculateOverallRiskScore } from "../../../../lib/financial-logic";
import { baseRiskRedesignData, riskRedesignData } from "../../data/riskRedesign.data";
import { buildRiskDeskData } from "../build-risk-desk-data";
import { mapRiskToLogicInput, type RiskStatementSnapshot } from "../map-risk-to-logic-input";

const completeSnapshot: RiskStatementSnapshot = {
  ticker: "AAA",
  companyType: "non_financial",
  period: "TTM",
  periodType: "ttm",
  sourceName: "Test source",
  collectedAt: "2026-06-01",
  revenue: 10_000,
  previousRevenue: 9_000,
  grossProfit: 3_000,
  operatingProfit: 1_500,
  previousOperatingProfit: 1_300,
  netProfit: 1_000,
  previousNetProfit: 900,
  totalAssets: 20_000,
  previousTotalAssets: 19_000,
  totalLiabilities: 8_000,
  totalEquity: 12_000,
  previousTotalEquity: 11_500,
  cashAndEquivalents: 3_000,
  totalDebt: 2_000,
  currentAssets: 9_000,
  currentLiabilities: 4_000,
  inventory: 2_000,
  operatingCashFlow: 1_200,
  previousOperatingCashFlow: 1_000,
  capitalExpenditure: 400,
  interestExpense: 120,
  ebit: 1_600,
  ebitda: 2_000,
  sharesOutstanding: 100,
  closePrice: 50,
  previousClosePrice: 48,
  volume: 1_000_000,
  avgTradingValue20d: 80_000_000_000,
};

const getSource = (data: ReturnType<typeof buildRiskDeskData>, sourceId: string) => {
  const source = data.riskSources.find((item) => item.id === sourceId);
  if (!source) throw new Error(`Missing risk source: ${sourceId}`);
  return source;
};

describe("mapRiskToLogicInput", () => {
  it("maps fields without turning missing data into zero", () => {
    const input = mapRiskToLogicInput({ ticker: "AAA", operatingCashFlow: undefined, totalDebt: null });

    expect(input.ticker).toBe("AAA");
    expect(input.operatingCashFlow).toBeUndefined();
    expect(input.totalDebt).toBeNull();
  });
});

describe("buildRiskDeskData", () => {
  it("keeps earnings quality risk from being low when profit is positive but CFO is negative", () => {
    const logicInput = mapRiskToLogicInput({
      ...completeSnapshot,
      netProfit: 1_000,
      operatingCashFlow: -800,
    });
    const earningsRisk = calculateEarningsQualityRisk(logicInput);
    const data = buildRiskDeskData(baseRiskRedesignData, {
      ...completeSnapshot,
      netProfit: 1_000,
      operatingCashFlow: -800,
    });

    expect(earningsRisk.level).not.toBe("low");
    expect(getSource(data, "earnings-quality-risk").tone).not.toBe("low");
    expect(JSON.stringify(getSource(data, "earnings-quality-risk")).toLowerCase()).toContain("dòng tiền");
  });

  it("does not allow poor data quality to produce low overall risk", () => {
    const logicInput = mapRiskToLogicInput({
      ...completeSnapshot,
      sourceName: null,
      collectedAt: null,
    });
    const overallRisk = calculateOverallRiskScore(logicInput);
    const data = buildRiskDeskData(baseRiskRedesignData, {
      ...completeSnapshot,
      sourceName: null,
      collectedAt: null,
    });

    expect(overallRisk.level).not.toBe("low");
    expect(data.overall.tone).not.toBe("low");
    expect(JSON.stringify(data).toLowerCase()).toContain("dữ liệu");
  });

  it("does not treat missing operating cash flow as low risk", () => {
    const logicInput = mapRiskToLogicInput({
      ...completeSnapshot,
      operatingCashFlow: null,
    });
    const earningsRisk = calculateEarningsQualityRisk(logicInput);
    const data = buildRiskDeskData(baseRiskRedesignData, {
      ...completeSnapshot,
      operatingCashFlow: null,
    });
    const source = getSource(data, "earnings-quality-risk");

    expect(earningsRisk.level).toBe("unknown");
    expect(earningsRisk.warnings.join(" ")).toContain("Thiếu dòng tiền kinh doanh");
    expect(source.status).toBe("Thiếu dữ liệu");
    expect(source.missingData).toContain("operatingCashFlow");
  });

  it("keeps bank debt metrics from being read mechanically", () => {
    const data = buildRiskDeskData(baseRiskRedesignData, {
      ...completeSnapshot,
      companyType: "bank",
    });
    const debtSourceText = JSON.stringify(getSource(data, "debt-risk")).toLowerCase();

    expect(debtSourceText).toContain("tài chính");
    expect(debtSourceText).toContain("không nên đọc");
  });

  it("does not expose buy, sell, hold or recommendation wording in rendered risk data", () => {
    const output = JSON.stringify(riskRedesignData).toLowerCase();

    expect(output).not.toContain("nên mua");
    expect(output).not.toContain("nên bán");
    expect(output).not.toContain("nắm giữ");
    expect(output).not.toContain("buy");
    expect(output).not.toContain("sell");
    expect(output).not.toContain("hold");
    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("cổ phiếu an toàn");
    expect(output).not.toContain("điểm mua tốt");
    expect(output).not.toContain("chắc chắn rẻ");
    expect(output).not.toContain("chắc chắn xấu");
    expect(output).not.toContain("gian lận");
  });
});
