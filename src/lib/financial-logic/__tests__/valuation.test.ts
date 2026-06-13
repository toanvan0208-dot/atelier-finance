import { describe, expect, it } from "vitest";
import { calculatePbRatio, calculatePeRatio } from "../valuation";

describe("valuation edge cases", () => {
  it("returns not applicable P/E when EPS is negative", () => {
    const peRatio = calculatePeRatio({ closePrice: 50_000, eps: -1_200 });

    expect(peRatio.value).toBeNull();
    expect(peRatio.level).toBe("not_applicable");
    expect(["not_applicable", "sufficient"]).toContain(peRatio.dataQuality);
    expect(peRatio.warning).toMatch(/EPS không dương|P\/E không phù hợp/i);
  });

  it("returns not applicable P/E when EPS is zero", () => {
    const peRatio = calculatePeRatio({ closePrice: 50_000, eps: 0 });

    expect(peRatio.value).toBeNull();
    expect(peRatio.level).toBe("not_applicable");
    expect(["not_applicable", "sufficient"]).toContain(peRatio.dataQuality);
    expect(peRatio.warning).toMatch(/EPS không dương|P\/E không phù hợp/i);
  });

  it("does not interpret P/B conventionally when equity or BVPS is negative", () => {
    const pbRatio = calculatePbRatio({
      closePrice: 50_000,
      bvps: -1_000,
      totalEquity: -500,
    });

    expect(pbRatio.value).toBeNull();
    expect(pbRatio.level).toBe("not_applicable");
    expect(pbRatio.warning).toMatch(/không dương|P\/B không thể diễn giải/i);
  });
});
