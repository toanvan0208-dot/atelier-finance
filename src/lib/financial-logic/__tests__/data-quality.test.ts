import { describe, expect, it } from "vitest";
import { assessDataQuality, calculateDataQualityRisk } from "../index";

describe("data quality", () => {
  it("warns when source and update timestamp are missing", () => {
    const dataQuality = assessDataQuality({
      revenue: 10_000,
      netProfit: 1_000,
      totalAssets: 20_000,
      totalLiabilities: 5_000,
      totalEquity: 15_000,
      operatingCashFlow: 1_200,
      closePrice: 50_000,
      volume: 1_000_000,
      sourceName: null,
      collectedAt: null,
    });
    const dataQualityRisk = calculateDataQualityRisk({
      revenue: 10_000,
      netProfit: 1_000,
      totalAssets: 20_000,
      totalLiabilities: 5_000,
      totalEquity: 15_000,
      operatingCashFlow: 1_200,
      closePrice: 50_000,
      volume: 1_000_000,
      sourceName: null,
      collectedAt: null,
    });

    expect(dataQuality.status).not.toBe("good");
    expect(dataQualityRisk.dataQuality).not.toBe("sufficient");
    expect(dataQuality.warnings.join(" ")).toMatch(/Thiếu dữ liệu|Dữ liệu có thể đã cũ|Thiếu tên nguồn/i);
  });
});
