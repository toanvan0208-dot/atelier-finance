import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  MvpAvailableData,
  MvpCurrentTicker,
  MvpMissingData,
  MvpNextSteps,
} from "../OverviewPage";
import { baseOverviewCaseData } from "../../data/overviewCase.data";
import type { OverviewCrossModuleReadinessSummary } from "../../lib/overview-cross-module-readiness";
import type { OverviewBottleneck, OverviewCaseData } from "../../types";

describe("OverviewPage MVP", () => {
  it("renders 4 MVP blocks and enforces language guardrails", () => {
    const activeCase: OverviewCaseData = {
      ...baseOverviewCaseData.activeCase,
      ticker: "FPT",
      companyName: "CTCP FPT",
      industry: "CÃ´ng nghá»‡",
    };
    const summary: OverviewCrossModuleReadinessSummary = {
      title: "Tong quan trang thai du lieu",
      description: "Du lieu dang trong trang thai kiem tra.",
      productionApprovedLabel: "productionApproved:false",
      items: [
        {
          moduleKey: "financials",
          label: "Financials",
          status: "partial",
          dataMode: "research_only",
          productionApproved: false,
          sourceStatus: "partial",
          unitStatus: "unknown",
          summary: "Financials co du lieu nghien cuu.",
          blockedReasons: [],
          nextChecks: [],
        },
      ],
      safeNotes: [],
    };
    const bottlenecks: OverviewBottleneck[] = [
      {
        title: "EPS",
        whyItMatters: "Cáº§n Ä‘á»‹nh giÃ¡",
        consequence: "ChÆ°a Ä‘á»§ dá»¯ liá»‡u.",
        priority: "Cao",
        targetModule: "Financials",
        moduleKey: "financials",
      },
    ];

    const tickerHtml = renderToStaticMarkup(createElement(MvpCurrentTicker, { activeCase }));
    const dataHtml = renderToStaticMarkup(createElement(MvpAvailableData, { summary }));
    const missingHtml = renderToStaticMarkup(createElement(MvpMissingData, { bottlenecks }));
    const nextStepsHtml = renderToStaticMarkup(createElement(MvpNextSteps, { onNavigate: () => {} }));

    const html = tickerHtml + dataHtml + missingHtml + nextStepsHtml;

    expect(html).toContain("Bạn đang xem mã nào");
    expect(html).toContain("Dữ liệu hiện có");
    expect(html).toContain("Dữ liệu còn thiếu");
    expect(html).toContain("Nên xem gì tiếp theo trong hệ thống");

    expect(html).toContain("Bạn đang xem: FPT");
    expect(html).toContain("CTCP FPT");

    expect(html).toContain("Có dữ liệu");
    expect(html).toContain("Cần kiểm tra thêm");

    const forbiddenWords = [
      "buy",
      "sell",
      "hold",
      "recommendation",
      "khuyáº¿n nghá»‹",
      "nÃªn mua",
      "nÃªn bÃ¡n",
      "náº¯m giá»¯",
      "tÃ­n hiá»‡u mua",
      "tÃ­n hiá»‡u bÃ¡n",
      "Ä‘iá»ƒm mua",
      "Ä‘iá»ƒm bÃ¡n",
      "vÃ o lá»‡nh",
      "thoÃ¡t lá»‡nh",
      "fair value",
      "target price",
      "upside",
      "downside",
      "Ä‘Ã¡ng mua",
      "Ä‘Ã¡ng bÃ¡n",
      "háº¥p dáº«n",
      "tiá»m nÄƒng",
      "cá»• phiáº¿u tá»‘t",
      "cá»• phiáº¿u xáº¥u",
      "an toÃ n Ä‘á»ƒ Ä‘áº§u tÆ°",
      "vÃ­ tháº¿",
      "trading",
      "trading game",
      "paper trading",
    ];

    const lowerHtml = html.toLowerCase();
    for (const word of forbiddenWords) {
      expect(lowerHtml).not.toContain(word.toLowerCase());
    }

    const rawTerms = [
      "productionapproved:false",
      "productionapproved:true",
      "productionapproved",
      "research_only",
      "researchonly",
      "datamode",
      "sourcetype",
      "sourcelabel",
      "local_db_manual_import",
      "vnstock_research_candidate",
    ];

    for (const term of rawTerms) {
      expect(lowerHtml).not.toContain(term.toLowerCase());
    }
  });
});
