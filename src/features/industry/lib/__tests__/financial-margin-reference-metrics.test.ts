import { describe, expect, it } from "vitest";

import { buildFinancialMarginReferenceMetrics } from "../financial-margin-reference-metrics";

describe("buildFinancialMarginReferenceMetrics", () => {
  it("builds single-company margin references without calling them benchmarks", () => {
    const metrics = buildFinancialMarginReferenceMetrics({
      fiscalYear: 2024,
      grossProfit: 27499210077000,
      netIncome: 3733288229000,
      revenue: 134341152849000,
      sourceLabel: "VNStock financial statements long safe CSV",
      ticker: "MWG",
    });

    expect(metrics).toHaveLength(2);
    expect(metrics[0]).toMatchObject({
      industryCode: "RETAIL",
      metricCode: "GROSS_MARGIN_COMPANY_REFERENCE",
      unit: "percent",
      value: 20.47,
    });
    expect(metrics[0].warningCodes).toEqual(
      expect.arrayContaining(["SINGLE_COMPANY_REFERENCE_NOT_INDUSTRY_BENCHMARK", "NOT_AUTO_COMPARISON"]),
    );
    expect(JSON.stringify(metrics).toLowerCase()).not.toContain("investment advice");
  });

  it("builds reviewed PDF steel peer margin references", () => {
    const metrics = buildFinancialMarginReferenceMetrics({
      fiscalYear: 2025,
      grossProfit: 785173587619,
      netIncome: 197096350389,
      revenue: 14808145017155,
      sourceLabel: "NKG FY2025 audited annual report PDF",
      sourceType: "local_pdf_reviewed_mapping",
      ticker: "NKG",
    });

    expect(metrics[0]).toMatchObject({
      industryCode: "STEEL_MATERIALS",
      metricCode: "GROSS_MARGIN_COMPANY_REFERENCE",
      sourceType: "local_pdf_reviewed_mapping",
      value: 5.3,
    });
    expect(metrics[1]).toMatchObject({
      metricCode: "NET_MARGIN_COMPANY_REFERENCE",
      value: 1.33,
    });
  });
});
