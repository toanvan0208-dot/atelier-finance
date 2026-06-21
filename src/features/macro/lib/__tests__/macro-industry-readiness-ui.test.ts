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
      expect.arrayContaining(["Thieu bang chung", "Can khai bao ro", "productionApproved:false", "Chua san sang"]),
    );
    expect(model.badgeLabel).toBe("Dang chuan bi");
    expect(model.requiredFields).toEqual(expect.arrayContaining(["GDP growth", "Inflation", "PMI"]));
  });

  it("uses the Phase 87 boundary for Industry readiness UI state", () => {
    const model = buildMacroIndustryReadinessUiModel("industry");

    expect(model.moduleKey).toBe("industry");
    expect(model.statusCards.map((card) => card.value)).toEqual(
      expect.arrayContaining(["Thieu bang chung", "Can khai bao ro", "productionApproved:false", "Chua san sang"]),
    );
    expect(model.summary).toContain("chua phai du lieu san xuat");
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
    expect(serialized).toContain("Thieu bang chung nguon");
    expect(serialized).toContain("Can don vi ro");
    expect(serialized).toContain("Khong doan don vi tu do lon so");
    expect(serialized).toContain("du lieu thieu khong duoc thay bang 0");
  });

  it("shows future gates without enabling production readiness", () => {
    const model = buildMacroIndustryReadinessUiModel("macro");

    expect(model.futureGates.map((gate) => gate.label)).toEqual(
      expect.arrayContaining(["Mo ket noi du lieu that", "Kiem tra va duyet nguon"]),
    );
    expect(model.futureGates.map((gate) => gate.detail).join(" ")).toContain("Mac dinh van dong");
    expect(model.statusCards.find((card) => card.label === "San sang su dung")?.value).toBe("Chua san sang");
  });

  it("renders user-facing readiness copy without raw boundary labels or forbidden wording", () => {
    const html = [
      renderToStaticMarkup(createElement(MacroIndustryReadinessSkeleton, { domain: "macro" })),
      renderToStaticMarkup(createElement(MacroIndustryReadinessSkeleton, { domain: "industry" })),
    ].join("\n").toLowerCase();

    expect(html).toContain("productionapproved:false");
    expect(html).toContain("thieu bang chung");
    expect(html).toContain("can khai bao ro");
    expect(html).toContain("chua san sang");
    expect(html).not.toContain("boundary skeleton");
    expect(html).not.toContain("unknown_unit");
    expect(html).not.toContain("missingsourceevidence");
    expect(html).not.toContain("explicitunitrequired");
    expect(html).not.toContain("api");
    expect(html).not.toContain("upload");
    expect(html).not.toContain("parser");
    expect(html).not.toContain("schema");
    expect(html).not.toContain("migration");

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
