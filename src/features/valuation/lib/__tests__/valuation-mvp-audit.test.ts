import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveInitialValuationTicker } from "../../components/ValuationPage";
import { buildControlledValuationCalculation } from "../controlled-valuation-calculation";
import { buildControlledValuationIntegrationBoundary } from "../controlled-valuation-integration-boundary";

const metricValues = (result: ReturnType<typeof buildControlledValuationCalculation>) => [
  result.metrics.pe.value,
  result.metrics.marketCap.value,
  result.metrics.bvps.value,
  result.metrics.pb.value,
  result.metrics.ps.value,
];

describe("Valuation MVP audit guardrails", () => {
  it.each(["FPT", "MWG", "VNM"])("uses the URL ticker %s instead of FPTLAB for initial valuation context", (ticker) => {
    expect(resolveInitialValuationTicker({ urlTicker: ticker })).toBe(ticker);
  });

  it("keeps the controlled scenario ticker ahead of URL ticker only for explicit controlled scenarios", () => {
    expect(resolveInitialValuationTicker({ controlledTicker: "UNIT71", urlTicker: "FPT" })).toBe("UNIT71");
  });

  it("uses FPTLAB only when no URL ticker or controlled scenario ticker exists", () => {
    expect(resolveInitialValuationTicker({})).toBe("FPTLAB");
  });

  it("keeps FPT, MWG, and VNM missing inputs as null instead of using wrong-ticker fallback values", () => {
    for (const ticker of ["FPT", "MWG", "VNM"]) {
      const boundary = buildControlledValuationIntegrationBoundary({
        persistedValuationInputs: null,
      });

      expect(ticker).toMatch(/^(FPT|MWG|VNM)$/);
      expect(boundary.calculation.metrics.pe.value).toBeNull();
      expect(boundary.calculation.metrics.marketCap.value).toBeNull();
      expect(boundary.calculation.metrics.pb.value).toBeNull();
      expect(boundary.calculation.sourceBoundary.productionApproved).toBe(false);
      expect(boundary.sourceBoundary.productionApproved).toBe(false);
    }
  });

  it.each([null, 0, -1])("blocks P/E when EPS is %s", (eps) => {
    const result = buildControlledValuationCalculation({
      financials: { eps },
      market: { marketPrice: 100 },
    });

    expect(result.metrics.pe.value).toBeNull();
    expect(result.metrics.pe.status).not.toBe("ready");
  });

  it.each([null, 0, -1])("blocks market cap and share metrics when sharesOutstanding is %s", (sharesOutstanding) => {
    const result = buildControlledValuationCalculation({
      financials: { equity: 1000, sharesOutstanding },
      market: { marketPrice: 100 },
    });

    expect(result.metrics.marketCap.value).toBeNull();
    expect(result.metrics.marketCap.status).not.toBe("ready");
    expect(result.metrics.bvps.value).toBeNull();
    expect(result.metrics.bvps.status).not.toBe("ready");
  });

  it.each([null, 0, -1])("blocks P/B and BVPS when equity is %s", (equity) => {
    const result = buildControlledValuationCalculation({
      financials: { equity, sharesOutstanding: 100 },
      market: { marketPrice: 100 },
    });

    expect(result.metrics.bvps.value).toBeNull();
    expect(result.metrics.bvps.status).not.toBe("ready");
    expect(result.metrics.pb.value).toBeNull();
    expect(result.metrics.pb.status).not.toBe("ready");
  });

  it.each([null, 0, -1])("blocks P/S when revenue is %s", (revenue) => {
    const result = buildControlledValuationCalculation({
      financials: { revenue },
      market: { marketCap: 1000 },
    });

    expect(result.metrics.ps.value).toBeNull();
    expect(result.metrics.ps.status).not.toBe("ready");
  });

  it("does not zero-fill missing values or divide by zero", () => {
    const result = buildControlledValuationCalculation({
      financials: { equity: 0, eps: 0, revenue: 0, sharesOutstanding: 0 },
      market: { marketPrice: 0, marketCap: 0 },
    });

    expect(metricValues(result)).not.toContain(0);
    expect(metricValues(result).every((value) => value === null)).toBe(true);
  });

  it("keeps research/local/sample source states unapproved for production", () => {
    for (const dataMode of ["research_only", "local", "sample"]) {
      const result = buildControlledValuationCalculation({
        source: { dataMode, productionApproved: true, fallbackUsed: dataMode === "sample" },
      });

      expect(result.sourceBoundary.productionApproved).toBe(false);
      expect(result.sourceBoundary.canClaimValuationDbBacked).toBe(false);
    }
  });

  it("does not render forbidden valuation or recommendation terms in user-facing valuation copy", () => {
    const source = [
      "src/features/valuation/components/ControlledValuationCalculationPanel.tsx",
      "src/features/valuation/components/ValuationPage.tsx",
      "src/features/valuation/components/ValuationSummaryHero.tsx",
      "src/features/valuation/components/ValuationRangeTable.tsx",
      "src/features/valuation/components/ValuationScenarioSafety.tsx",
      "src/features/valuation/components/ValuationFinalConclusion.tsx",
      "src/features/valuation/lib/build-valuation-desk-data.ts",
    ]
      .map((file) => readFileSync(join(process.cwd(), file), "utf8").toLowerCase())
      .join("\n");
    const forbidden = [
      "nên mua",
      "nên bán",
      "nên nắm giữ",
      "tín hiệu mua",
      "tín hiệu bán",
      "điểm mua",
      "cổ phiếu an toàn",
      "đáng mua",
      "giá mục tiêu",
      "fair value",
      "target price",
      "upside",
      "downside",
      "recommendation",
      "định giá hợp lý",
      "thấp hơn giá trị thật",
      "cao hơn giá trị thật",
      "hấp dẫn",
    ];

    for (const term of forbidden) expect(source).not.toContain(term);
  });
});
