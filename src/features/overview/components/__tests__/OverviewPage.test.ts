import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { 
  MvpCurrentTicker, 
  MvpAvailableData, 
  MvpMissingData, 
  MvpNextSteps 
} from "../OverviewPage";

describe("OverviewPage MVP", () => {
  it("renders 4 MVP blocks and enforces language guardrails", () => {
    const tickerHtml = renderToStaticMarkup(createElement(MvpCurrentTicker, { 
      activeCase: { ticker: "FPT", companyName: "CTCP FPT", industry: "Công nghệ" } as any 
    }));
    const dataHtml = renderToStaticMarkup(createElement(MvpAvailableData, { 
      summary: { items: [{ moduleKey: "financials", label: "Financials", status: "partial", dataMode: "research_only" }] } as any 
    }));
    const missingHtml = renderToStaticMarkup(createElement(MvpMissingData, { 
      bottlenecks: [{ title: "EPS", whyItMatters: "Cần định giá" }] as any 
    }));
    const nextStepsHtml = renderToStaticMarkup(createElement(MvpNextSteps, { 
      onNavigate: () => {} 
    }));

    const html = tickerHtml + dataHtml + missingHtml + nextStepsHtml;

    // Check 4 MVP blocks components content
    expect(html).toContain("Bạn đang xem mã nào");
    expect(html).toContain("Dữ liệu hiện có");
    expect(html).toContain("Dữ liệu còn thiếu");
    expect(html).toContain("Nên xem gì tiếp theo trong hệ thống");

    // Check ticker rendering
    expect(html).toContain("Bạn đang xem: FPT");
    expect(html).toContain("CTCP FPT");

    // Check neutral status language
    expect(html).toContain("Có dữ liệu");
    expect(html).toContain("Cần kiểm tra thêm");

    // Enforce NO forbidden words
    const forbiddenWords = [
      "buy", "sell", "hold", "recommendation",
      "khuyến nghị", "nên mua", "nên bán", "nắm giữ",
      "tín hiệu mua", "tín hiệu bán", "điểm mua", "điểm bán",
      "vào lệnh", "thoát lệnh", "fair value", "target price",
      "upside", "downside", "đáng mua", "đáng bán",
      "hấp dẫn", "tiềm năng", "cổ phiếu tốt", "cổ phiếu xấu",
      "an toàn để đầu tư"
    ];

    const lowerHtml = html.toLowerCase();
    for (const word of forbiddenWords) {
      expect(lowerHtml).not.toContain(word.toLowerCase());
    }

    // No raw debug terms
    const rawTerms = [
      "productionapproved:false",
      "productionapproved:true",
      "research_only",
      "researchonly",
      "datamode",
      "sourcetype",
      "local_db_manual_import",
      "vnstock_research_candidate"
    ];

    for (const term of rawTerms) {
      expect(lowerHtml).not.toContain(term.toLowerCase());
    }
  });
});
