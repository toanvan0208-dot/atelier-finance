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
  });

  it("displays DB-backed source transparency and issuer metadata limitation without client DB imports", () => {
    const html = renderPage({
      data: {
        ...pvtObservationData,
        ticker: "FPT",
        companyName: "FPT",
        industry: "Chua co du lieu xac minh",
        currentPrice: 129.12,
      },
      dataQuality: {
        ...pvtDataQuality,
        source: "vnstock",
        isDemoData: false,
      },
      source: {
        sourceType: "local_db_manual_import",
        sourceLabel: "vnstock",
        dataMode: "research_only",
        productionApproved: false,
      },
      marketDataSource: {
        sourceType: "local_db_manual_import",
        provider: "vnstock",
        sourceLabel: "vnstock",
        dataMode: "research_only",
        productionApproved: false,
        fallbackUsed: false,
        ticker: "FPT",
        asOf: "2025-01-31",
        dateSpan: {
          from: "2025-01-01",
          to: "2025-01-31",
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
        limitations: ["Company/issuer metadata is unavailable for this DB-backed ticker."],
        warnings: [],
      },
      fallbackUsed: false,
      warnings: ["Local academic/research only"],
    });

    expect(html).toContain("Local DB manual import");
    expect(html).toContain("vnstock");
    expect(html).toContain("research_only");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("researchOnly");
    expect(html).toContain("Metadata doanh nghiệp/ngành chưa được xác minh");
    expect(html).toContain("metadata:unavailable");
    expect(html).toContain("Industry: chua co du lieu xac minh");
    expect(html).not.toContain("Ban le");
  });
});
