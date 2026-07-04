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

    expect(html).toContain("Dữ liệu ngành đang đọc từ hệ thống");
    expect(html).toContain("Đã đọc mapping DB");
    expect(html).toContain("HPG");
    expect(html).toContain("STEEL_MATERIALS");
    expect(html).toContain("Chưa có bối cảnh ngành có nguồn");
    expect(html).toContain("Chưa có metric ngành");
    expect(html).not.toContain("IndustryContext is available");
  });

  it("renders source-backed Layer 4 qualitative context details from runtime payload", () => {
    const hpgRuntimePayload: IndustryContextRuntimePayload = {
      ticker: "HPG",
      status: "available",
      missingReason: null,
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
          industryName: "Steel and Materials",
          displayNameVi: "Thep va vat lieu",
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
            industryName: "Steel and Materials",
            displayNameVi: "Thep va vat lieu",
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
      context: {
        industryCode: "STEEL_MATERIALS",
        industryName: "Steel and Materials",
        industryOverview: "Steel businesses transform raw materials into products used across construction and infrastructure.",
        howIndustryMakesMoney: "Revenue depends on shipped volume, output price, product mix, plant utilization, and input-cost spread.",
        keyDrivers: JSON.stringify(["Construction and infrastructure demand", "Plant utilization and product mix"]),
        industryRisks: JSON.stringify(["Weak demand cycles", "Input cost volatility"]),
        macroSensitivity: JSON.stringify(["Infrastructure and construction activity", "Iron ore and energy costs"]),
        nextChecks: JSON.stringify(["Check revenue, gross margin, inventory, operating cash flow, and debt trend."]),
        commonMisread: "A steel label frames business-cycle exposure; it does not decide ticker quality.",
        relatedTickers: ["HPG"],
        asOfDate: "2026-07-01T00:00:00.000Z",
        sourceLabel: "Phase 157E reviewed qualitative context - World Steel Association - Steel and raw materials fact sheet",
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
        numericIndustryMetricsAvailable: false,
        valuationRiskBenchmarksAvailable: false,
        caveats: [],
        warningCodes: ["INDUSTRY_QUALITATIVE_CONTEXT_SOURCE_BACKED"],
        provenanceLimitations: [],
        reviewedQualitativeContextAvailable: true,
        fullQualitativeContextAvailable: true,
        qualitativeContextSourceStatus: "source_backed",
        staticGuidanceUsedAsReviewedContext: false,
        provenanceSummary: {
          rowsFound: 1,
          sourceLabels: ["World Steel Association - Steel and raw materials fact sheet"],
          sourceUrls: ["https://worldsteel.org/wp-content/uploads/Fact-sheet-raw-materials-2023-1.pdf"],
          sourceTypes: ["industry_association"],
          productionApprovedTrueCount: 0,
          needsReviewTrueCount: 1,
          warningCodes: ["SOURCE_BACKED_DRY_RUN_ONLY"],
          sidecarReadStatus: "available",
        },
      },
    };

    const html = renderToStaticMarkup(
      createElement(IndustryPage, {
        initialIndustryContexts: {
          HPG: hpgRuntimePayload,
        },
      }),
    );

    expect(html).toContain("Nguồn dữ liệu Layer 4");
    expect(html).toContain("Có nguồn");
    expect(html).toContain("Thẻ này chỉ giữ nguồn và trạng thái dữ liệu");
    expect(html).toContain("Steel businesses transform raw materials");
    expect(html).toContain("Revenue depends on shipped volume");
    expect(html).toContain("Construction and infrastructure demand");
    expect(html).toContain("Weak demand cycles");
    expect(html).toContain("World Steel Association");
    expect(html).toContain("https://worldsteel.org/wp-content/uploads/Fact-sheet-raw-materials-2023-1.pdf");
    expect(html).toContain("Chưa có metric ngành");
    expect(html).not.toContain("Layer 4 dang thieu");
  });

  it("renders research-only Layer 5 industry metrics without promoting them", () => {
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
          industryName: "Steel and Materials",
          displayNameVi: "Thep va vat lieu",
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
            industryName: "Steel and Materials",
            displayNameVi: "Thep va vat lieu",
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
      industryMetricSummary: {
        status: "available",
        industryCode: "STEEL_MATERIALS",
        rowsFound: 2,
        missingReason: null,
        productionApprovedTrueCount: 0,
        needsReviewTrueCount: 2,
        rowsWithoutProvenance: 0,
        dataMode: "research_only",
        readyForUiDisplay: true,
        readyForAssistantUse: false,
        usedAsAutoComparison: false,
        usedAsInvestmentConclusion: false,
        warningCodes: ["INDUSTRY_METRICS_RESEARCH_ONLY"],
        caveats: ["Layer 5 metrics are research-only."],
        metrics: [
          {
            industryCode: "STEEL_MATERIALS",
            metricCode: "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION",
            metricName: "Global crude steel production",
            metricLabelVi: "San luong thep tho toan cau",
            metricGroup: "volume",
            value: 159.9,
            unit: "million_tonnes",
            periodType: "month",
            periodLabel: "2026-03",
            observationDate: "2026-03-31T00:00:00.000Z",
            sourceLabel: "Local PDF - Steel market Q1 2026",
            sourceKey: "local_pdf_steel_q1_2026:p3:global_crude_steel_mar_2026",
            dataMode: "research_only",
            productionApproved: false,
            needsReview: true,
            qualityStatus: "needs_review",
            provenanceCount: 1,
            caveats: [],
            warningCodes: [],
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

    expect(html).toContain("Ghi chu cach doc so lieu nganh");
    expect(html).toContain("Co metric DB");
    expect(html).toContain("San luong thep tho toan cau");
    expect(html).toContain("159,9 trieu tan");
    expect(html).toContain("So nay noi gi");
    expect(html).toContain("Can soi tiep");
    expect(html).toContain("San luong ban hang cua doanh nghiep co di cung chieu thi truong khong");
    expect(html).toContain("Chi so nen tu tim them");
    expect(html).toContain("Xem ghi chu");
    expect(html).toContain("chua phai metric trong DB");
    expect(html).not.toContain("San luong thep Viet Nam");
    expect(html).toContain("Local PDF - Steel market Q1 2026");
    expect(html).toContain("productionApproved=false");
    expect(html).toContain("Chi la ghi chu doc so");
  });

  it("renders Vietnamese display copy for PDF-backed Layer 4 context without changing source metadata", () => {
    const hpgRuntimePayload: IndustryContextRuntimePayload = {
      ticker: "HPG",
      status: "available",
      missingReason: null,
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
          industryName: "Steel and Materials",
          displayNameVi: "Thep va vat lieu",
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
            industryName: "Steel and Materials",
            displayNameVi: "Thep va vat lieu",
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
      context: {
        industryCode: "STEEL_MATERIALS",
        industryName: "Steel and Materials",
        industryOverview: "Steel and construction-material businesses are exposed to global and domestic steel supply.",
        howIndustryMakesMoney: "Revenue is driven by shipped volume and selling price.",
        keyDrivers: JSON.stringify(["Domestic construction and infrastructure demand"]),
        industryRisks: JSON.stringify(["Input-cost pressure"]),
        macroSensitivity: JSON.stringify(["Infrastructure and construction cycle"]),
        nextChecks: JSON.stringify(["Check revenue volume and inventory."]),
        commonMisread: "A steel-market report gives context only.",
        relatedTickers: ["HPG"],
        asOfDate: "2026-05-05T00:00:00.000Z",
        sourceLabel: "Phase 158D PDF Layer 4 - Local PDF - Bao cao thi truong thep Quy I 2026",
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
        numericIndustryMetricsAvailable: false,
        valuationRiskBenchmarksAvailable: false,
        caveats: [],
        warningCodes: ["INDUSTRY_QUALITATIVE_CONTEXT_SOURCE_BACKED"],
        provenanceLimitations: [],
        reviewedQualitativeContextAvailable: true,
        fullQualitativeContextAvailable: true,
        qualitativeContextSourceStatus: "source_backed",
        staticGuidanceUsedAsReviewedContext: false,
        provenanceSummary: {
          rowsFound: 1,
          sourceLabels: ["Local PDF - Bao cao thi truong thep Quy I 2026"],
          sourceUrls: ["local-pdf://bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf"],
          sourceTypes: ["reviewed_manual_note"],
          productionApprovedTrueCount: 0,
          needsReviewTrueCount: 1,
          warningCodes: ["PDF_SOURCE_LOCAL_REVIEW_ONLY"],
          sidecarReadStatus: "available",
        },
      },
    };

    const html = renderToStaticMarkup(
      createElement(IndustryPage, {
        initialIndustryContexts: {
          HPG: hpgRuntimePayload,
        },
      }),
    );

    expect(html).toContain("Bản hiển thị tiếng Việt");
    expect(html).toContain("Ngành thép cần đọc qua cung cầu thép");
    expect(html).toContain("Doanh thu đến từ sản lượng bán ra");
    expect(html).toContain("Nhu cầu xây dựng và đầu tư hạ tầng trong nước");
    expect(html).toContain("Phase 158D PDF Layer 4 - Local PDF - Bao cao thi truong thep Quy I 2026");
    expect(html).toContain("local-pdf://bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf");
    expect(html).not.toContain("Steel and construction-material businesses are exposed");
  });
});
