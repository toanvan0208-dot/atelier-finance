import { describe, expect, it } from "vitest";
import { calculateValuationReadiness } from "../../../../lib/financial-logic";
import { baseValuationRefactoredData, valuationRefactoredData } from "../../data/valuationRefactored.data";
import { buildValuationDeskData } from "../build-valuation-desk-data";
import { mapValuationToLogicInput, type ValuationStatementSnapshot } from "../map-valuation-to-logic-input";

const completeSnapshot: ValuationStatementSnapshot = {
  ticker: "AAA",
  companyType: "non_financial",
  period: "TTM",
  periodType: "ttm",
  sourceName: "Test source",
  collectedAt: "2026-06-01",
  revenue: 10_000,
  netProfit: 1_000,
  totalEquity: 5_000,
  cashAndEquivalents: 500,
  totalDebt: 1_500,
  operatingCashFlow: 1_200,
  capitalExpenditure: 300,
  ebitda: 1_800,
  sharesOutstanding: 100,
  closePrice: 50,
  dividendPerShare: 2,
};

const getRange = (data: ReturnType<typeof buildValuationDeskData>, method: string) => {
  const row = data.ranges.rows.find((item) => item.method === method);
  if (!row) throw new Error(`Missing valuation row: ${method}`);
  return row;
};

describe("mapValuationToLogicInput", () => {
  it("maps fields without turning missing data into zero", () => {
    const input = mapValuationToLogicInput({ ticker: "AAA", revenue: undefined, closePrice: null });

    expect(input.ticker).toBe("AAA");
    expect(input.revenue).toBeUndefined();
    expect(input.closePrice).toBeNull();
  });
});

describe("buildValuationDeskData", () => {
  it("does not calculate P/E when EPS is negative", () => {
    const data = buildValuationDeskData(baseValuationRefactoredData, {
      ...completeSnapshot,
      eps: -1_200,
      netProfit: null,
    });

    const peRow = getRange(data, "P/E");
    expect(peRow.range).toBe("Không phù hợp để diễn giải");
    expect(peRow.keyAssumption).toContain("EPS");
    expect(peRow.range).not.toBe("0x");
  });

  it("does not calculate P/B when BVPS and total equity are negative", () => {
    const data = buildValuationDeskData(baseValuationRefactoredData, {
      ...completeSnapshot,
      bvps: -1_000,
      totalEquity: -5_000,
    });

    const pbRow = getRange(data, "P/B");
    expect(pbRow.range).toBe("Không phù hợp để diễn giải");
    expect(pbRow.keyAssumption).toContain("BVPS");
    expect(pbRow.range).not.toBe("0x");
  });

  it("marks valuation readiness as not ready when closePrice is missing", () => {
    const logicInput = mapValuationToLogicInput({
      ...completeSnapshot,
      closePrice: null,
    });

    const readiness = calculateValuationReadiness(logicInput);
    const data = buildValuationDeskData(baseValuationRefactoredData, {
      ...completeSnapshot,
      closePrice: null,
    });

    expect(readiness.status).toBe("not_ready");
    expect(readiness.usableMethods).toEqual([]);
    expect(data.summary.fairValueRange.conclusion).toContain("Chưa đủ dữ liệu");
  });

  it("lowers confidence and warns when source data is missing", () => {
    const data = buildValuationDeskData(baseValuationRefactoredData, {
      ...completeSnapshot,
      sourceName: null,
      collectedAt: null,
    });

    expect(data.summary.fairValueRange.confidence).toBe("Thấp");
    expect(JSON.stringify(data.assumptions.items).toLowerCase()).toContain("nguồn");
  });

  it("does not expose buy, sell, hold or recommendation wording in rendered valuation data", () => {
    const output = JSON.stringify(valuationRefactoredData).toLowerCase();

    expect(output).not.toContain("nên mua");
    expect(output).not.toContain("nên bán");
    expect(output).not.toContain("nắm giữ");
    expect(output).not.toContain("mua");
    expect(output).not.toContain("bán");
    expect(output).not.toContain("buy");
    expect(output).not.toContain("sell");
    expect(output).not.toContain("hold");
    expect(output).not.toContain("recommendation");
  });
});
