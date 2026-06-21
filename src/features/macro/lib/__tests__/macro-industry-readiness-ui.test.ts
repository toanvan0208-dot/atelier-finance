import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { navigationItems } from "@/config/navigation.config";
import { MacroIndustryReadinessSkeleton } from "../../components/MacroIndustryReadinessSkeleton";
import { buildMacroIndustryReadinessUiModel } from "../macro-industry-readiness-ui";

const forbiddenBrowserPhrases = [
  "official data",
  "realtime data",
  "production-ready",
  "production-approved",
  "buy",
  "sell",
  "hold",
  "cheap",
  "expensive",
  "fair value",
  "target price",
  "upside",
  "downside",
  "recommendation",
  "risk scoring",
];

describe("macro industry readiness UI model", () => {
  it("uses the Phase 87 boundary for Macro readiness UI state", () => {
    const model = buildMacroIndustryReadinessUiModel("macro");

    expect(model.moduleKey).toBe("macro");
    expect(model.statusCards.map((card) => card.value)).toEqual(
      expect.arrayContaining(["missing", "unknown_unit", "productionApproved:false", "blocked"]),
    );
    expect(model.requiredFields).toEqual(expect.arrayContaining(["GDP growth", "Inflation", "PMI"]));
  });

  it("uses the Phase 87 boundary for Industry readiness UI state", () => {
    const model = buildMacroIndustryReadinessUiModel("industry");

    expect(model.moduleKey).toBe("industry");
    expect(model.statusCards.map((card) => card.value)).toEqual(
      expect.arrayContaining(["missing", "unknown_unit", "productionApproved:false", "blocked"]),
    );
    expect(model.requiredFields).toEqual(
      expect.arrayContaining(["Industry code", "Industry name", "Revenue growth", "Sector index change"]),
    );
  });

  it("represents productionApproved:false, source/evidence gaps, and explicit unit requirements", () => {
    const serialized = JSON.stringify([
      buildMacroIndustryReadinessUiModel("macro"),
      buildMacroIndustryReadinessUiModel("industry"),
    ]);

    expect(serialized).toContain("productionApproved:false");
    expect(serialized).toContain("missingSourceEvidence");
    expect(serialized).toContain("explicitUnitRequired");
    expect(serialized).toContain("Don vi du lieu can khai bao ro");
  });

  it("shows future gates without enabling production readiness", () => {
    const model = buildMacroIndustryReadinessUiModel("macro");

    expect(model.futureGates).toEqual(
      expect.arrayContaining(["Production ingestion gate", "Source approval workflow gate"]),
    );
    expect(model.statusCards.find((card) => card.label === "Readiness")?.value).toBe("blocked");
  });

  it("does not introduce recommendation, target, fair-value, or risk-scoring wording", () => {
    const html = [
      renderToStaticMarkup(createElement(MacroIndustryReadinessSkeleton, { domain: "macro" })),
      renderToStaticMarkup(createElement(MacroIndustryReadinessSkeleton, { domain: "industry" })),
    ].join("\n").toLowerCase();

    for (const phrase of forbiddenBrowserPhrases) {
      expect(html).not.toContain(phrase);
    }
  });

  it("does not expose import, upload, API, parser, filesystem, or write capability", () => {
    const model = buildMacroIndustryReadinessUiModel("industry");

    expect(model.forbiddenCapabilities).toEqual({
      dbWrite: false,
      importUploadApi: false,
      parserOrFilesystemRead: false,
      recommendationOrScoring: false,
    });
  });

  it("respects existing module keys instead of inventing a route", () => {
    const routeKeys = navigationItems.map((item) => item.key);
    const macro = buildMacroIndustryReadinessUiModel("macro");
    const industry = buildMacroIndustryReadinessUiModel("industry");

    expect(routeKeys).toContain("macro");
    expect(routeKeys).toContain("industry");
    expect(routeKeys).toContain(macro.moduleKey);
    expect(routeKeys).toContain(industry.moduleKey);
  });
});
