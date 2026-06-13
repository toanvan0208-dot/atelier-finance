import { describe, expect, it } from "vitest";
import { baseOverviewCaseData, overviewCaseData } from "../../data/overviewCase.data";
import { buildOverviewDeskData } from "../build-overview-desk-data";
import { mapOverviewToLogicInput, type OverviewStatementSnapshot } from "../map-overview-to-logic-input";

const completeSnapshot: OverviewStatementSnapshot = {
  ticker: "AAA",
  companyType: "non_financial",
  industry: "retail",
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

const getCard = (data: ReturnType<typeof buildOverviewDeskData>, id: string) => {
  const card = data.summaryCards.find((item) => item.id === id);
  if (!card) throw new Error(`Missing overview summary card: ${id}`);
  return card;
};

describe("mapOverviewToLogicInput", () => {
  it("maps fields without turning missing data into zero", () => {
    const input = mapOverviewToLogicInput({ ticker: "AAA", revenue: undefined, closePrice: null, operatingCashFlow: undefined });

    expect(input.ticker).toBe("AAA");
    expect(input.revenue).toBeUndefined();
    expect(input.closePrice).toBeNull();
    expect(input.operatingCashFlow).toBeUndefined();
  });
});

describe("buildOverviewDeskData", () => {
  it("does not show fake zero values when revenue, price and CFO are missing", () => {
    const data = buildOverviewDeskData(baseOverviewCaseData, {
      ...completeSnapshot,
      revenue: null,
      closePrice: null,
      operatingCashFlow: null,
    });
    const text = JSON.stringify(data.summaryCards);

    expect(text).toContain("Chưa đủ dữ liệu");
    expect(text).not.toContain("0%");
    expect(text).not.toContain("0x");
  });

  it("does not interpret P/E when EPS is negative", () => {
    const data = buildOverviewDeskData(baseOverviewCaseData, {
      ...completeSnapshot,
      eps: -1_200,
      netProfit: null,
    });
    const valuation = getCard(data, "valuation");

    expect(valuation.summary).toContain("P/E: Không phù hợp để diễn giải");
    expect(valuation.summary).not.toContain("P/E: 0x");
  });

  it("does not allow weak data quality to produce a low risk summary", () => {
    const data = buildOverviewDeskData(baseOverviewCaseData, {
      ...completeSnapshot,
      sourceName: null,
      collectedAt: null,
    });
    const risk = getCard(data, "risk");

    expect(risk.status).not.toBe("Chưa thấy cảnh báo lớn từ dữ liệu hiện có");
    expect(JSON.stringify(data).toLowerCase()).toContain("dữ liệu");
  });

  it("does not expose buy, sell, hold or recommendation wording in rendered overview data", () => {
    const output = JSON.stringify(overviewCaseData).toLowerCase();

    expect(output).not.toContain("nên mua");
    expect(output).not.toContain("nên bán");
    expect(output).not.toContain("nắm giữ");
    expect(output).not.toContain("buy");
    expect(output).not.toContain("sell");
    expect(output).not.toContain("hold");
    expect(output).not.toContain("recommendation");
    expect(output).not.toContain("khuyến nghị giao dịch");
    expect(output).not.toContain("khuyến nghị đầu tư");
    expect(output).not.toContain("khuyến nghị mua");
    expect(output).not.toContain("khuyến nghị bán");
    expect(output).not.toContain("cổ phiếu an toàn");
    expect(output).not.toContain("điểm mua tốt");
    expect(output).not.toContain("chắc chắn rẻ");
    expect(output).not.toContain("chắc chắn đắt");
    expect(output).not.toContain("chắc chắn xấu");
    expect(output).not.toContain("gian lận");
  });
});
