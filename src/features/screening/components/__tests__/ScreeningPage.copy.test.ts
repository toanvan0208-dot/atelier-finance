import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScreeningPage } from "../ScreeningPage";

describe("ScreeningPage product copy", () => {
  it("renders readable source status without raw debug labels", () => {
    const html = renderToStaticMarkup(createElement(ScreeningPage, {}));

    expect(html).toContain("Dữ liệu nghiên cứu");
    expect(html).toContain("Nguồn chưa phê duyệt sản xuất");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain("productionApproved:true");
    expect(html).not.toContain("research_only");
  });
});
