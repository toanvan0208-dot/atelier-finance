import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { industryCompassData } from "../../data/industryCompass.data";
import { IndustryCompanyMapSection, IndustryCurrentHeader } from "../IndustryCompassSections";

describe("IndustryCurrentHeader product copy", () => {
  it("renders source status without raw production approval labels", () => {
    const html = renderToStaticMarkup(
      createElement(IndustryCurrentHeader, {
        industries: industryCompassData.industries,
        onSelectIndustry: () => undefined,
        selectedIndustry: industryCompassData.industries[0],
      }),
    );

    expect(html).toContain("Dữ liệu nghiên cứu");
    expect(html).toContain("Nguồn đang hoàn thiện");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain("research_only");
    expect(html).not.toContain("nên mua");
    expect(html).not.toContain("mua/bán");
  });
});

describe("IndustryCompanyMapSection steel screening candidate cards", () => {
  it("renders HSG and NKG beside HPG as screening candidates only", () => {
    const steelIndustry = industryCompassData.industries.find((industry) => industry.industryKey === "steel_materials");
    expect(steelIndustry).toBeDefined();
    if (!steelIndustry) throw new Error("steel_materials industry is required for this test");

    const html = renderToStaticMarkup(
      createElement(IndustryCompanyMapSection, {
        selectedIndustry: steelIndustry,
      }),
    );

    expect(html).toContain("HPG");
    expect(html).toContain("HSG");
    expect(html).toContain("NKG");
    expect(html).not.toContain("TVN");
    expect(html).toContain("Hoa Sen Group");
    expect(html).toContain("Nam Kim Steel");
    expect(html.match(/screening_candidate/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(html).toContain("chua mo phan tich sau");
    expect(html.match(/Screening/g)?.length ?? 0).toBeGreaterThanOrEqual(3);

    const forbiddenCopy = [
      "buy",
      "sell",
      "hold",
      "target price",
      "fair value",
      "upside",
      "downside",
      "hap dan",
      "dang mua",
      "ranking",
      "scoring",
      "score",
    ];
    const normalized = html.toLowerCase();
    for (const term of forbiddenCopy) {
      expect(normalized).not.toContain(term);
    }

    expect(html).not.toContain("Business");
    expect(html).not.toContain("Financials");
    expect(html).not.toContain("Valuation");
    expect(html).not.toContain("Risk");
  });
});
