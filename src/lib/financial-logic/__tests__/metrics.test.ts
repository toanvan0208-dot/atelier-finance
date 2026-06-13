import { describe, expect, it } from "vitest";
import {
  calculateCfoToNetProfit,
  calculateCurrentRatio,
  calculateDebtToEquity,
  calculateFreeCashFlow,
  calculateRevenueGrowth,
  calculateRoe,
} from "../metrics";

describe("financial metrics edge cases", () => {
  it("does not convert missing revenue growth data into zero", () => {
    const revenueGrowth = calculateRevenueGrowth({ revenue: null, previousRevenue: 900 });

    expect(revenueGrowth.value).toBeNull();
    expect(revenueGrowth.missingFields).toContain("revenue");
    expect(revenueGrowth.displayValue).not.toBe("0%");
  });

  it("returns null and warning when previous revenue is zero", () => {
    const revenueGrowth = calculateRevenueGrowth({ revenue: 1_000, previousRevenue: 0 });

    expect(revenueGrowth.value).toBeNull();
    expect(revenueGrowth.warning).toMatch(/không thể diễn giải tăng trưởng/i);
  });

  it("does not interpret ROE conventionally when equity is negative", () => {
    const roe = calculateRoe({ netProfit: 1_000, totalEquity: -500 });

    expect(roe.value).toBeNull();
    expect(["not_applicable", "unknown"]).toContain(roe.level);
    expect(roe.warning).toMatch(/không dương|không thể diễn giải|không còn ý nghĩa/i);
  });

  it("does not apply current ratio mechanically to banks", () => {
    const currentRatio = calculateCurrentRatio({
      companyType: "bank",
      currentAssets: 10_000,
      currentLiabilities: 8_000,
    });

    expect(currentRatio.value).toBeNull();
    expect(currentRatio.level).toBe("not_applicable");
    expect(currentRatio.warning).toMatch(/không phù hợp|doanh nghiệp tài chính/i);
  });

  it("does not interpret debt to equity like non-financial companies for banks", () => {
    const debtToEquity = calculateDebtToEquity({
      companyType: "bank",
      totalDebt: 50_000,
      totalEquity: 5_000,
    });

    expect(debtToEquity.level).toBe("not_applicable");
    expect(debtToEquity.warning).toMatch(/không nên đọc|doanh nghiệp tài chính/i);
  });

  it("warns when earnings are positive but operating cash flow is negative", () => {
    const cfoToNetProfit = calculateCfoToNetProfit({
      netProfit: 2_500,
      operatingCashFlow: -800,
    });

    expect(cfoToNetProfit.value).toBeLessThan(0);
    expect(cfoToNetProfit.level).toBe("risk");
    expect(cfoToNetProfit.warning).toMatch(/chưa chuyển thành tiền|vốn lưu động|bất thường/i);
  });

  it("derives free cash flow by treating positive capex as cash spent", () => {
    const freeCashFlow = calculateFreeCashFlow({
      operatingCashFlow: 3_000,
      capitalExpenditure: 1_000,
    });

    expect(freeCashFlow.value).toBe(2_000);
    expect(freeCashFlow.formula).toContain("abs(capitalExpenditure)");
  });
});
