import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { industryCompassData } from "../../data/industryCompass.data";
import type { IndustryContextRuntimePayload } from "../../lib/load-industry-context";
import { IndustryPage } from "../IndustryPage";
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
    expect(html).toContain("Dữ liệu ngành đang được rà soát");
    expect(html).not.toContain("Nguồn đang hoàn thiện");
    expect(html).not.toContain("DB taxonomy");
    expect(html).not.toContain("DB peer group");
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
    expect(html.match(/Ứng viên sàng lọc/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(html).toContain("chưa mở phân tích sâu");
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

describe("IndustryPage runtime read path", () => {
  it("renders DB-backed industry taxonomy mapping without promoting missing qualitative context", () => {
    const hpgRuntimePayload: IndustryContextRuntimePayload = {
      ticker: "HPG",
      status: "missing",
      context: null,
      missingReason: "No eligible IndustryContext row found for this ticker.",
      peerGroupSummary: {
        ticker: "HPG",
        status: "missing",
        industryCode: null,
        anchorTicker: "HPG",
        peers: [],
        missingReason: "No peer group rows.",
        warnings: [],
        peerGroupUsedAsValuationBenchmark: false,
        peerGroupUsedAsRiskBenchmark: false,
        peerGroupInferred: false,
      },
      taxonomy: {
        ticker: "HPG",
        status: "available",
        missingReason: null,
        peerGroupsAvailable: false,
        numericIndustryMetricsAvailable: false,
        valuationRiskBenchmarksAvailable: false,
        peerGroupInferred: false,
        industryMetricCreated: false,
        valuationRiskBenchmarkInvented: false,
        warningCodes: ["INDUSTRY_TAXONOMY_RESEARCH_ONLY"],
        taxonomySummary: {
          status: "available",
          ticker: "HPG",
          industryCode: "STEEL_MATERIALS",
          industryName: "Thép và vật liệu",
          displayNameVi: "Thép và vật liệu",
          roleType: "reviewed_lane_ticker",
          mappingConfidence: "reviewed",
          dataMode: "research_only",
          productionApproved: false,
          needsReview: true,
          sourceType: "manual_review",
          sourceUrl: "external-review-workspace",
          warnings: [],
        },
        mappings: [
          {
            ticker: "HPG",
            industryCode: "STEEL_MATERIALS",
            industryName: "Thép và vật liệu",
            displayNameVi: "Thép và vật liệu",
            sectorCode: null,
            sectorName: null,
            classificationSystem: "atelier_reviewed",
            roleType: "reviewed_lane_ticker",
            segmentDescription: null,
            mappingConfidence: "reviewed",
            sourceLabel: "External financials review workspace - industry code 2025",
            sourceUrl: "external-review-workspace",
            sourceType: "manual_review",
            dataMode: "research_only",
            productionApproved: false,
            needsReview: true,
            warningCodes: [],
            caveats: [],
          },
        ],
      },
    };

    const html = renderToStaticMarkup(
      createElement(IndustryPage, {
        initialIndustryContexts: {
          HPG: hpgRuntimePayload,
        },
      }),
    );

    expect(html).toContain("Du lieu nganh dang doc tu he thong");
    expect(html).toContain("Da doc mapping DB");
    expect(html).toContain("HPG");
    expect(html).toContain("STEEL_MATERIALS");
    expect(html).toContain("Chua co qualitative context co nguon");
    expect(html).toContain("Chua co metric nganh");
    expect(html).not.toContain("IndustryContext is available");
  });
});
