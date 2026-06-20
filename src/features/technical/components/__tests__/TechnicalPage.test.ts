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
  });

  it("displays DB-backed source transparency without client DB imports", () => {
    const html = renderPage({
      data: {
        ...pvtObservationData,
        ticker: "FPT",
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
      fallbackUsed: false,
      warnings: ["Local academic/research only"],
    });

    expect(html).toContain("Local DB manual import");
    expect(html).toContain("vnstock");
    expect(html).toContain("research_only");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("researchOnly");
  });
});
