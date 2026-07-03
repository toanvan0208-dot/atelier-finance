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
      expect.arrayContaining(["Thiếu bằng chứng", "Cần khai báo rõ", "Chưa đủ điều kiện", "Chưa sẵn sàng"]),
    );
    expect(model.badgeLabel).toBe("Đang chuẩn bị");
    expect(model.requiredFields).toEqual(expect.arrayContaining(["GDP growth", "Inflation", "PMI"]));
  });

  it("uses the Phase 87 boundary for Industry readiness UI state", () => {
    const model = buildMacroIndustryReadinessUiModel("industry");

    expect(model.moduleKey).toBe("industry");
    expect(model.statusCards.map((card) => card.value)).toEqual(
      expect.arrayContaining(["Thiếu bằng chứng", "Cần khai báo rõ", "Chưa đủ điều kiện", "Chưa sẵn sàng"]),
    );
    expect(model.summary).toContain("chưa phải dữ liệu chính thức");
    expect(model.requiredFields).toEqual(
      expect.arrayContaining(["Industry code", "Industry name", "Revenue growth", "Sector index change"]),
    );
  });

  it("represents source approval gaps without raw debug labels", () => {
    const serialized = JSON.stringify([
      buildMacroIndustryReadinessUiModel("macro"),
      buildMacroIndustryReadinessUiModel("industry"),
    ]);

    expect(serialized).toContain("Chưa đủ điều kiện");
    expect(serialized).toContain("Nguồn chưa đủ điều kiện");
    expect(serialized).not.toContain("productionApproved:false");
    expect(serialized).toContain("Thiếu bằng chứng nguồn");
    expect(serialized).toContain("Cần đơn vị rõ");
    expect(serialized).toContain("Không đoán đơn vị từ độ lớn số");
    expect(serialized).toContain("dữ liệu thiếu không được thay bằng 0");
  });

  it("shows future gates without enabling production readiness", () => {
    const model = buildMacroIndustryReadinessUiModel("macro");

    expect(model.futureGates.map((gate) => gate.label)).toEqual(
      expect.arrayContaining(["Mở kết nối dữ liệu thật", "Kiểm tra và duyệt nguồn"]),
    );
    expect(model.futureGates.map((gate) => gate.detail).join(" ")).toContain("Mặc định vẫn đóng");
    expect(model.statusCards.find((card) => card.label === "Sẵn sàng sử dụng")?.value).toBe("Chưa sẵn sàng");
  });

  it("renders user-facing readiness copy without raw boundary labels or forbidden wording", () => {
    const html = [
      renderToStaticMarkup(createElement(MacroIndustryReadinessSkeleton, { domain: "macro" })),
      renderToStaticMarkup(createElement(MacroIndustryReadinessSkeleton, { domain: "industry" })),
    ].join("\n").toLowerCase();

    expect(html).toContain("chưa đủ điều kiện");
    expect(html).not.toContain("productionapproved:false");
    expect(html).toContain("thiếu bằng chứng");
    expect(html).toContain("cần khai báo rõ");
    expect(html).toContain("chưa sẵn sàng");
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
