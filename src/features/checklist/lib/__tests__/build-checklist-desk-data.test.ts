import { describe, expect, it } from "vitest";
import { baseCheckThinkingData } from "../../data/checkThinking.data";
import type { ChecklistLogicGroup, ChecklistLogicStep } from "../../types";
import { buildChecklistDeskData } from "../build-checklist-desk-data";
import { mapChecklistToLogicInput, type ChecklistStatementSnapshot } from "../map-checklist-to-logic-input";

const completeSnapshot: ChecklistStatementSnapshot = {
  ticker: "MWG",
  companyType: "non_financial",
  industry: "retail",
  period: "TTM",
  periodType: "ttm",
  sourceName: "Test source",
  collectedAt: "2026-06-01",
  revenue: 10_000,
  previousRevenue: 9_000,
  grossProfit: 2_800,
  operatingProfit: 1_500,
  netProfit: 1_000,
  previousNetProfit: 900,
  totalAssets: 20_000,
  totalLiabilities: 8_000,
  totalEquity: 12_000,
  cashAndEquivalents: 3_000,
  totalDebt: 2_000,
  inventory: 1_800,
  previousInventory: 1_700,
  accountsReceivable: 1_200,
  previousAccountsReceivable: 1_100,
  operatingCashFlow: 1_200,
  capitalExpenditure: 400,
  interestExpense: 120,
  ebit: 1_600,
  ebitda: 2_000,
  sharesOutstanding: 100,
  eps: 10,
  bvps: 120,
  closePrice: 50,
  previousClosePrice: 48,
  volume: 1_000_000,
  avgTradingValue20d: 80_000_000_000,
};

const buildStock = (snapshot: ChecklistStatementSnapshot = completeSnapshot) => {
  const data = buildChecklistDeskData(baseCheckThinkingData, [snapshot]);
  const stock = data.stockReadinessByTicker.find((item) => item.ticker === snapshot.ticker);
  if (!stock) throw new Error(`Missing stock ${snapshot.ticker}`);
  return stock;
};

const findStep = (groups: ChecklistLogicGroup[] | undefined, id: string): ChecklistLogicStep => {
  const step = groups?.flatMap((group) => group.steps).find((item) => item.id === id);
  if (!step) throw new Error(`Missing checklist step ${id}`);
  return step;
};

describe("mapChecklistToLogicInput", () => {
  it("maps fields without turning missing data into zero", () => {
    const input = mapChecklistToLogicInput({ ticker: "AAA", revenue: undefined, closePrice: null, operatingCashFlow: undefined });

    expect(input.ticker).toBe("AAA");
    expect(input.revenue).toBeUndefined();
    expect(input.closePrice).toBeNull();
    expect(input.operatingCashFlow).toBeUndefined();
  });
});

describe("buildChecklistDeskData", () => {
  it("does not mark data quality as completed when core data is missing", () => {
    const stock = buildStock({
      ...completeSnapshot,
      revenue: null,
      previousRevenue: null,
      closePrice: null,
      operatingCashFlow: null,
    });
    const dataQualityStep = findStep(stock.logicChecklistGroups, "core-financial-data");
    const missingStep = findStep(stock.logicChecklistGroups, "missing-fields");
    const text = JSON.stringify(stock.logicChecklistGroups);

    expect(dataQualityStep.status).not.toBe("completed");
    expect(missingStep.missingFields).toEqual(expect.arrayContaining(["revenue", "closePrice", "operatingCashFlow"]));
    expect(text).not.toContain("0%");
    expect(text).not.toContain("0x");
  });

  it("marks P/E as not applicable when EPS is negative", () => {
    const stock = buildStock({ ...completeSnapshot, eps: -1_200, netProfit: null });
    const peStep = findStep(stock.logicChecklistGroups, "pe-ratio");

    expect(peStep.status).toBe("not_applicable");
    expect(peStep.value).toBe("Không phù hợp để diễn giải");
    expect(peStep.summary).not.toContain("rẻ");
  });

  it("does not complete earnings quality when CFO is missing", () => {
    const stock = buildStock({ ...completeSnapshot, operatingCashFlow: null });
    const earningsQualityStep = findStep(stock.logicChecklistGroups, "earnings-quality-risk");

    expect(earningsQualityStep.status).not.toBe("completed");
    expect(earningsQualityStep.missingFields).toContain("operatingCashFlow");
  });

  it("does not mark overall risk as low when data quality is poor", () => {
    const stock = buildStock({
      ...completeSnapshot,
      sourceName: null,
      collectedAt: null,
      revenue: null,
      closePrice: null,
      operatingCashFlow: null,
    });
    const overallRiskStep = findStep(stock.logicChecklistGroups, "overall-risk");

    expect(overallRiskStep.status).not.toBe("completed");
    expect(overallRiskStep.value).not.toBe("0/100");
    expect(stock.finalReadiness.status).toBe("not_enough_data");
  });

  it("does not expose buy, sell, hold or recommendation wording in checklist logic output", () => {
    const stock = buildStock();
    const output = JSON.stringify({
      groups: stock.logicChecklistGroups,
      finalReadiness: stock.finalReadiness,
      moduleReadiness: stock.moduleReadiness,
    }).toLowerCase();

    expect(output).not.toContain("nên mua");
    expect(output).not.toContain("nên bán");
    expect(output).not.toContain("nắm giữ");
    expect(output).not.toContain("buy");
    expect(output).not.toContain("sell");
    expect(output).not.toContain("hold");
    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("khuyến nghị");
    expect(output).not.toContain("cổ phiếu an toàn");
    expect(output).not.toContain("điểm mua tốt");
    expect(output).not.toContain("đáng mua");
    expect(output).not.toContain("chắc chắn rẻ");
    expect(output).not.toContain("chắc chắn đắt");
    expect(output).not.toContain("chắc chắn xấu");
    expect(output).not.toContain("gian lận");
  });
});
