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

  it("keeps default financial profile behavior when market-only fields are provided", () => {
    const dataQuality = assessDataQuality({
      closePrice: 50_000,
      previousClosePrice: 48_000,
      volume: 1_000_000,
      avgVolume20d: 900_000,
      sourceName: "Unit test",
      collectedAt: "2026-06-01",
    });

    expect(dataQuality.status).toBe("poor");
    expect(dataQuality.missingFields).toEqual(
      expect.arrayContaining(["revenue", "netProfit", "totalAssets", "totalEquity", "operatingCashFlow"])
    );
  });

  it("uses market profile without requiring financial statement fields", () => {
    const dataQuality = assessDataQuality(
      {
        closePrice: 50_000,
        previousClosePrice: 48_000,
        volume: 1_000_000,
        avgVolume20d: 900_000,
        sourceName: "Unit test",
        collectedAt: "2026-06-01",
      },
      { profile: "market" }
    );

    expect(dataQuality.status).toBe("good");
    expect(dataQuality.missingFields).not.toContain("revenue");
    expect(dataQuality.missingFields).not.toContain("netProfit");
    expect(dataQuality.missingFields).not.toContain("totalEquity");
  });

  it("warns specifically when market comparison price is missing", () => {
    const dataQuality = assessDataQuality(
      {
        closePrice: 50_000,
        previousClosePrice: null,
        volume: 1_000_000,
        avgVolume20d: 900_000,
        sourceName: "Unit test",
        collectedAt: "2026-06-01",
      },
      { profile: "market" }
    );

    expect(dataQuality.status).toBe("usable_with_caution");
    expect(dataQuality.missingFields).toContain("previousClosePrice");
    expect(dataQuality.warnings.join(" ")).toMatch(/giá phiên trước|biến động giá/i);
  });

  it("warns specifically when market volume is missing", () => {
    const dataQuality = assessDataQuality(
      {
        closePrice: 50_000,
        previousClosePrice: 48_000,
        volume: null,
        avgVolume20d: 900_000,
        sourceName: "Unit test",
        collectedAt: "2026-06-01",
      },
      { profile: "market" }
    );

    expect(dataQuality.status).toBe("usable_with_caution");
    expect(dataQuality.missingFields).toContain("volume");
    expect(dataQuality.warnings.join(" ")).toMatch(/khối lượng|giá trị giao dịch/i);
  });

  it("warns when 20-session market average is missing", () => {
    const dataQuality = assessDataQuality(
      {
        closePrice: 50_000,
        previousClosePrice: 48_000,
        volume: 1_000_000,
        avgVolume20d: null,
        avgTradingValue20d: null,
        sourceName: "Unit test",
        collectedAt: "2026-06-01",
      },
      { profile: "market" }
    );

    expect(dataQuality.status).toBe("usable_with_caution");
    expect(dataQuality.missingFields).toContain("avgTradingValue20d");
    expect(dataQuality.warnings.join(" ")).toMatch(/bình quân 20 phiên/i);
  });
});
