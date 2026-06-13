import { describe, expect, it } from "vitest";
import { baseWatchlistPageData, watchlistPageData } from "../../data/watchlist.data";
import { buildWatchlistDeskData } from "../build-watchlist-desk-data";
import { mapWatchlistToLogicInput, type WatchlistStatementSnapshot } from "../map-watchlist-to-logic-input";

const completeSnapshot: WatchlistStatementSnapshot = {
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

const getSummary = (ticker = "MWG", snapshot: WatchlistStatementSnapshot = completeSnapshot) => {
  const data = buildWatchlistDeskData(baseWatchlistPageData, [{ ...snapshot, ticker }]);
  const summary = data.ideas.find((idea) => idea.ticker === ticker)?.logicSummary;
  if (!summary) throw new Error(`Missing watchlist logic summary for ${ticker}`);
  return summary;
};

describe("mapWatchlistToLogicInput", () => {
  it("maps fields without turning missing data into zero", () => {
    const input = mapWatchlistToLogicInput({ ticker: "AAA", revenue: undefined, closePrice: null, operatingCashFlow: undefined });

    expect(input.ticker).toBe("AAA");
    expect(input.revenue).toBeUndefined();
    expect(input.closePrice).toBeNull();
    expect(input.operatingCashFlow).toBeUndefined();
  });
});

describe("buildWatchlistDeskData", () => {
  it("does not show fake zero values when revenue, price and CFO are missing", () => {
    const summary = getSummary("MWG", {
      ...completeSnapshot,
      revenue: null,
      previousRevenue: null,
      closePrice: null,
      operatingCashFlow: null,
    });
    const text = JSON.stringify(summary);

    expect(text).toContain("Chưa đủ dữ liệu");
    expect(summary.missingFields).toEqual(expect.arrayContaining(["revenue", "closePrice", "operatingCashFlow"]));
    expect(text).not.toContain("0%");
    expect(text).not.toContain("0x");
  });

  it("does not interpret P/E when EPS is negative", () => {
    const summary = getSummary("MWG", {
      ...completeSnapshot,
      eps: -1_200,
      netProfit: null,
    });

    expect(summary.valuationDetail).toContain("P/E: Không phù hợp để diễn giải");
    expect(summary.valuationDetail).not.toContain("P/E: 0x");
    expect(summary.topWarnings.join(" ")).toMatch(/EPS|P\/E|diễn giải/);
  });

  it("does not allow weak data quality to produce a low risk summary", () => {
    const summary = getSummary("GMD", {
      ...completeSnapshot,
      ticker: "GMD",
      sourceName: null,
      collectedAt: null,
      revenue: null,
      closePrice: null,
      operatingCashFlow: null,
    });

    expect(summary.overallRiskLevel).not.toBe("Chưa thấy cảnh báo lớn từ dữ liệu hiện có");
    expect(summary.dataQualityStatus).toContain("Cần kiểm tra thêm");
  });

  it("adds warnings or next checks for each watchlist item", () => {
    for (const idea of watchlistPageData.ideas) {
      expect(idea.logicSummary).toBeDefined();
      expect([...(idea.logicSummary?.topWarnings ?? []), ...(idea.logicSummary?.nextChecks ?? [])].length).toBeGreaterThan(0);
    }
  });

  it("does not expose buy, sell, hold or recommendation wording in rendered watchlist logic summary", () => {
    const output = JSON.stringify(watchlistPageData.ideas.map((idea) => idea.logicSummary)).toLowerCase();

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
