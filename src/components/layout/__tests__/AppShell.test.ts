import { describe, expect, it } from "vitest";
import {
  buildModuleNavigationUrl,
  readModuleFromLocation,
  resolveActiveModule,
  shouldNormalizeInvalidModule,
} from "../app-shell-routing";

const moduleKeys = new Set([
  "overview",
  "macro",
  "industry",
  "screening",
  "business",
  "financials",
  "valuation",
  "risk",
]);

describe("AppShell module routing helpers", () => {
  it("keeps a valid module from URL", () => {
    for (const moduleKey of ["risk", "valuation", "financials", "business"]) {
      expect(resolveActiveModule(moduleKey, moduleKeys, "overview")).toBe(moduleKey);
      expect(shouldNormalizeInvalidModule(moduleKey, moduleKeys)).toBe(false);
    }
  });

  it("falls back to overview for an invalid module", () => {
    expect(resolveActiveModule("abc", moduleKeys, "overview")).toBe("overview");
    expect(shouldNormalizeInvalidModule("abc", moduleKeys)).toBe(true);
  });

  it("does not normalize when no module query is present", () => {
    expect(resolveActiveModule(null, moduleKeys, "overview")).toBe("overview");
    expect(shouldNormalizeInvalidModule(null, moduleKeys)).toBe(false);
  });

  it("reads the module query on direct workspace loads", () => {
    expect(readModuleFromLocation("?module=risk&ticker=FPT", "")).toBe("risk");
    expect(readModuleFromLocation("?ticker=FPT", "#valuation")).toBe("valuation");
  });

  it("preserves ticker when navigating between modules", () => {
    const nextUrl = buildModuleNavigationUrl(
      "http://localhost:3000/workspace?module=screening&ticker=FPT",
      "business",
    );

    expect(nextUrl.pathname).toBe("/workspace");
    expect(nextUrl.searchParams.get("module")).toBe("business");
    expect(nextUrl.searchParams.get("ticker")).toBe("FPT");
  });
});
