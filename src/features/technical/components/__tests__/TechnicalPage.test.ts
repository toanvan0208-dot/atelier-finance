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
    expect(html).toContain("Industry: chua co du lieu xac minh");
    expect(html).not.toContain("Ban le");
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

