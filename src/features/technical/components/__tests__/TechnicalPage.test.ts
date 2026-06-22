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

const rawSourceStatusTerms = [
  "productionApproved:false",
  "productionApproved:true",
  "productionApproved",
  "researchOnly",
  "research_only",
  "dataMode",
  "sourceType",
  "local_db_manual_import",
  "vnstock_research_candidate",
  "phase116_reviewed_financial_missing_fields",
  "manual_reviewed_financial_statement_2024",
  "phase109_controlled_local_financials",
];

const expectNoRawSourceStatus = (html: string) => {
  for (const term of rawSourceStatusTerms) expect(html).not.toContain(term);
};

const dbRuntimeBase = {
  data: {
    ...pvtObservationData,
    ticker: "FPT",
    companyName: "FPT",
    industry: "Chua co du lieu xac minh",
    currentPrice: 129.12,
    keyLevels: {
      support: "Chua du du lieu",
      resistance: "Chua du du lieu",
    },
    volume: {
      ...pvtObservationData.volume,
      currentVsAvg20: null,
      label: "Chua du 20 phien",
    },
    chart: {
      title: pvtObservationData.chart.title,
      points: Array.from({ length: 17 }, (_, index) => ({
        label: `2025-01-${String(index + 1).padStart(2, "0")}`,
        price: 100 + index,
        volume: 1000 + index,
      })),
      events: [],
      quickRead: [
        {
          question: "Chart dung nguon nao?",
          answer: "Chart uses active local DB market price series; sample chart points and sample annotations are not reused.",
        },
        {
          question: "Du lieu derived co du khong?",
          answer: "Chua du du lieu de tinh vung ho tro/khang cu tu chuoi DB-backed.",
        },
      ],
    },
    riskReward: {
      ...pvtObservationData.riskReward,
      currentPrice: 129.12,
      supportPrice: null,
      resistancePrice: null,
      upside: "Khong kha dung",
      downside: "Khong kha dung",
      conclusion: "Chua du du lieu de tinh vung ho tro/khang cu tu chuoi DB-backed.",
    },
    fomo: {
      ...pvtObservationData.fomo,
      score: null,
      signs: ["FOMO chua kha dung cho du lieu DB-backed."],
      conclusion: "FOMO chua kha dung vi chua duoc tinh tu cung chuoi DB-backed.",
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
    pvtChartSeries: {
      sourceLabel: "vnstock",
      dataMode: "research_only",
      productionApproved: false as const,
      status: "computed_from_market_price_series" as const,
      ticker: "FPT",
      availableObservations: 17,
      requiredObservations: 2,
      points: {
        count: 17,
        status: "computed_from_market_price_series" as const,
      },
      volume: {
        count: 17,
        status: "computed_from_market_price_series" as const,
      },
      movingAverages: {
        ma20: {
          status: "insufficient_data" as const,
          requiredObservations: 20,
        },
        ma50: {
          status: "insufficient_data" as const,
          requiredObservations: 50,
        },
      },
      annotations: {
        count: 0,
        status: "unavailable" as const,
      },
      limitations: ["Chart points are built from the active local DB market price series."],
      warnings: [],
    },
    confirmation: ["Chua du du lieu de xac dinh dieu kien xac nhan tu chuoi DB-backed."],
    invalidation: ["Chua du du lieu de xac dinh dieu kien phu nhan tu chuoi DB-backed."],
    scenarios: [
      {
        name: "Derived metrics unavailable",
        condition: "Chuoi DB-backed chua du co so de tinh vung ky thuat.",
        meaning: "Khong su dung kich ban sample cho du lieu DB-backed.",
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
    sourceLabel: "vnstock_research_candidate",
    dataMode: "research_only",
    productionApproved: false as const,
  },
  marketDataSource: {
    sourceType: "local_db_manual_import" as const,
    provider: "vnstock" as const,
    sourceLabel: "vnstock_research_candidate",
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

    expect(html).toContain("Minh bạch nguồn dữ liệu");
    expect(html).toContain("Dữ liệu minh họa dự phòng");
    expect(html).toContain("Dữ liệu nghiên cứu, chưa phê duyệt sản xuất");
    expect(html).toContain("Thông tin doanh nghiệp minh họa, chưa phê duyệt sản xuất");
    expect(html).toContain("Chỉ số kỹ thuật: Dữ liệu minh họa");
    expect(html).toContain("Biểu đồ: Dữ liệu minh họa");
    expectNoRawSourceStatus(html);
    expect(html).toContain("Biên tăng gần");
    expect(html).toContain("Biên giảm gần");
    expect(html.toLowerCase()).not.toContain("upside");
    expect(html.toLowerCase()).not.toContain("downside");
  });

  it("does not render any prohibited recommendation or prediction wording", () => {
    const html = renderPage({
      ...dbRuntimeBase,
    });
    const forbidden = ["nên mua", "nên bán", "nắm giữ", "tín hiệu", "điểm mua", "điểm bán", "vào lệnh", "thoát lệnh", "fair value", "target price", "đáng mua", "đáng bán", "cổ phiếu khỏe để mua", "cổ phiếu yếu nên bán", "khuyến nghị"];
    for (const term of forbidden) {
      expect(html.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  it("displays DB-backed source transparency and chart boundary without client DB imports", () => {
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

    expect(html).toContain("Dữ liệu giá tham khảo từ nguồn nghiên cứu");
    expect(html).toContain("Dữ liệu nghiên cứu, chưa phê duyệt sản xuất");
    expect(html).toContain("Thông tin doanh nghiệp và ngành đang được kiểm tra");
    expect(html).toContain("Thông tin doanh nghiệp: Nguồn đang được kiểm tra");
    expect(html).toContain("Chỉ số kỹ thuật: Chưa đủ dữ liệu");
    expect(html).toContain("Biểu đồ: Đã tính từ chuỗi giá đang hiển thị");
    expect(html).toContain("Chart uses active local DB market price series");
    expect(html).toContain("Biểu đồ phải dùng cùng chuỗi dữ liệu đang hiển thị");
    expect(html).toContain("Chỉ số PVT chỉ được tính từ chuỗi giá đang hiển thị");
    expect(html).toContain("Chua du du lieu");
    expect(html).toContain("Chua du 20 phien");
    expect(html).toContain("Khong kha dung");
    expect(html).toContain("FOMO chua kha dung");
    expect(html).toContain("Ngành: Chưa có dữ liệu xác minh");
    expectNoRawSourceStatus(html);
    expect(html).not.toContain("Ban le");
    expect(html).not.toContain("38.000 - 40.000");
    expect(html).not.toContain("44.000 - 46.000");
    expect(html).not.toContain("1.4x TB20");
    expect(html).not.toContain("3/6");
    expect(html).not.toContain("KQKD");
    expect(html).not.toContain("MA20 · MA50");
  });

  it("displays an unavailable state without rendering sample data for explicit no-data tickers", () => {
    const html = renderPage({
      data: null,
      dataQuality: {
        ...pvtDataQuality,
        source: "Nguon dang hoan thien",
        isDemoData: false,
      },
      source: {
        sourceType: "sample_static_fallback",
        sourceLabel: "sample_static_fallback",
        dataMode: "sample",
        productionApproved: false,
      },
      marketDataSource: {
        sourceType: "sample_static_fallback",
        provider: "sample_static",
        sourceLabel: "sample_static_fallback",
        dataMode: "sample",
        productionApproved: false,
        fallbackUsed: false,
        ticker: "FPT",
        asOf: "2025-06-30",
        dateSpan: {
          from: null,
          to: null,
        },
      },
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
        sharesOutstanding: null,
        sharesUnit: null,
        sharesStatus: "unavailable",
        limitations: ["Company/issuer metadata is unavailable for this DB-backed ticker."],
        warnings: [],
      },
      fallbackUsed: false,
      warnings: ["Fallback disabled"],
    });

    expect(html).toContain("Chua du du lieu Technical/PVT cho FPT");
    expect(html).toContain("khong dung du lieu minh hoa hoac du lieu ticker khac");
    expect(html).not.toContain("MWG");
    expect(html).not.toContain("38.000 - 40.000");
    expectNoRawSourceStatus(html);
  });

  it("displays controlled local company metadata without overclaiming", () => {
    const html = renderPage({
      ...dbRuntimeBase,
      issuerMetadata: {
        ticker: "FPT",
        displayName: "FPT",
        issuerName: "FPT Corporation",
        industry: "Information technology",
        sector: null,
        sourceLabel: "controlled_local_company_metadata",
        dataMode: "research_only",
        productionApproved: false,
        verificationStatus: "controlled_local_research",
        sharesOutstanding: null,
        sharesUnit: null,
        sharesStatus: "unavailable",
        limitations: ["Controlled local/research company metadata backbone."],
        warnings: [],
      },
    });

    expect(html).toContain("Thông tin doanh nghiệp nội bộ đã kiểm soát");
    expect(html).toContain("Thông tin doanh nghiệp: Dữ liệu nội bộ đã kiểm soát");
    expect(html).toContain("Số cổ phiếu lưu hành: Chưa đủ dữ liệu");
    expect(html).toContain("Chỉ dùng cho nghiên cứu; chưa đủ điều kiện xác nhận sản xuất.");
    expectNoRawSourceStatus(html);
    expect(html.toLowerCase()).not.toContain("official metadata");
  });
});
