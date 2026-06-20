import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { pvtDataQuality, pvtObservationData } from "../../data/pvtObservation.data";
import { TechnicalPage, type TechnicalPageRuntimeData } from "../TechnicalPage";

const renderPage = (initialRuntimeData: TechnicalPageRuntimeData) =>
  renderToStaticMarkup(
    createElement(TechnicalPage, {
      initialRuntimeData,
      onNavigate: () => undefined,
    }),
  );

const dbRuntimeBase = {
  data: {
    ...pvtObservationData,
    ticker: "FPT",
    companyName: "FPT",
    industry: "Chua co du lieu xac minh",
    currentPrice: 129.12,
    keyLevels: {
      support: "Chưa đủ dữ liệu",
      resistance: "Chưa đủ dữ liệu",
    },
    volume: {
      ...pvtObservationData.volume,
      currentVsAvg20: null,
      label: "Chưa đủ 20 phiên",
    },
    chart: {
      ...pvtObservationData.chart,
      quickRead: [
        {
          question: "Dữ liệu derived có đủ không?",
          answer: "Chưa đủ dữ liệu để tính vùng hỗ trợ/kháng cự từ chuỗi DB-backed.",
        },
      ],
    },
    riskReward: {
      ...pvtObservationData.riskReward,
      currentPrice: 129.12,
      supportPrice: null,
      resistancePrice: null,
      upside: "Không khả dụng",
      downside: "Không khả dụng",
      conclusion: "Chưa đủ dữ liệu để tính vùng hỗ trợ/kháng cự từ chuỗi DB-backed.",
    },
    fomo: {
      ...pvtObservationData.fomo,
      score: null,
      signs: ["FOMO chưa khả dụng cho dữ liệu DB-backed."],
      conclusion: "FOMO chưa khả dụng vì chưa được tính từ cùng chuỗi DB-backed.",
    },
    pvtDerivedMetrics: {
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false as const,
      dataStatus: "insufficient_data" as const,
      calculationBasis: "active_market_price_series" as const,
      requiredObservations: 20,
      availableObservations: 17,
      supportRange: {
        value: null,
        status: "unavailable" as const,
      },
      resistanceRange: {
        value: null,
        status: "unavailable" as const,
      },
      volumeRatio: {
        value: null,
        status: "insufficient_data" as const,
      },
      fomoScore: {
        value: null,
        status: "unavailable" as const,
      },
      limitations: ["Derived metrics require the active DB-backed series."],
      warnings: [],
    },
    confirmation: ["Chưa đủ dữ liệu để xác định điều kiện xác nhận từ chuỗi DB-backed."],
    invalidation: ["Chưa đủ dữ liệu để xác định điều kiện phủ nhận từ chuỗi DB-backed."],
    scenarios: [
      {
        name: "Derived metrics unavailable",
        condition: "Chuỗi DB-backed chưa đủ cơ sở để tính vùng kỹ thuật.",
        meaning: "Không sử dụng kịch bản sample cho dữ liệu DB-backed.",
      },
    ],
  },
  dataQuality: {
    ...pvtDataQuality,
    source: "vnstock",
    isDemoData: false,
  },
  source: {
    sourceType: "local_db_manual_import" as const,
    sourceLabel: "vnstock",
    dataMode: "research_only",
    productionApproved: false as const,
  },
  marketDataSource: {
    sourceType: "local_db_manual_import" as const,
    provider: "vnstock" as const,
    sourceLabel: "vnstock",
    dataMode: "research_only",
    productionApproved: false as const,
    fallbackUsed: false,
    ticker: "FPT",
    asOf: "2025-01-31",
    dateSpan: {
      from: "2025-01-01",
      to: "2025-01-31",
    },
  },
  fallbackUsed: false,
  warnings: ["Local academic/research only"],
};

describe("TechnicalPage source transparency", () => {
  it("displays fallback source transparency without crashing", () => {
    const html = renderPage({
      data: pvtObservationData,
      dataQuality: {
        ...pvtDataQuality,
        isDemoData: true,
      },
      source: {
        sourceType: "sample_static_fallback",
        sourceLabel: "sample_static_fallback",
        dataMode: "sample",
        productionApproved: false,
      },
      fallbackUsed: true,
      warnings: ["Static fallback"],
    });

    expect(html).toContain("Source transparency");
    expect(html).toContain("Sample/static fallback");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("sampleFallback");
    expect(html).toContain("metadata:static_sample");
    expect(html).toContain("derived:static_sample");
  });

  it("displays DB-backed source transparency and issuer metadata limitation without client DB imports", () => {
    const html = renderPage({
      ...dbRuntimeBase,
      issuerMetadata: {
        ticker: "FPT",
        displayName: null,
        issuerName: null,
        industry: null,
        sector: null,
        sourceLabel: "unavailable",
        dataMode: "unknown",
        productionApproved: false,
        verificationStatus: "unavailable",
        limitations: ["Company/issuer metadata is unavailable for this DB-backed ticker."],
        warnings: [],
      },
    });

    expect(html).toContain("Local DB manual import");
    expect(html).toContain("vnstock");
    expect(html).toContain("research_only");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("researchOnly");
    expect(html).toContain("Metadata doanh nghiep/nganh chua duoc xac minh");
    expect(html).toContain("metadata:unavailable");
    expect(html).toContain("derived:insufficient_data");
    expect(html).toContain("Derived PVT metrics are computed only from the active market price series");
    expect(html).toContain("Chưa đủ dữ liệu");
    expect(html).toContain("Chưa đủ 20 phiên");
    expect(html).toContain("Không khả dụng");
    expect(html).toContain("FOMO chưa khả dụng");
    expect(html).toContain("Industry: chua co du lieu xac minh");
    expect(html).not.toContain("Ban le");
    expect(html).not.toContain("38.000 - 40.000");
    expect(html).not.toContain("44.000 - 46.000");
    expect(html).not.toContain("1.4x TB20");
    expect(html).not.toContain("3/6");
  });

  it("displays local research seed issuer metadata without claiming official metadata", () => {
    const html = renderPage({
      ...dbRuntimeBase,
      issuerMetadata: {
        ticker: "FPT",
        displayName: "FPT",
        issuerName: "FPT",
        industry: null,
        sector: null,
        sourceLabel: "local_issuer_metadata_seed",
        dataMode: "research_only",
        productionApproved: false,
        verificationStatus: "local_research_seed",
        limitations: ["Local research-only issuer metadata seed."],
        warnings: [],
      },
    });

    expect(html).toContain("Metadata doanh nghiep: local research seed");
    expect(html).toContain("metadata:local_research_seed");
    expect(html).toContain("Chi dung cho academic/local research");
    expect(html).toContain("productionApproved:false");
    expect(html.toLowerCase()).not.toContain("official metadata");
  });
});
