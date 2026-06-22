import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { industryCompassData } from "../../data/industryCompass.data";
import { IndustryCurrentHeader } from "../IndustryCompassSections";

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
