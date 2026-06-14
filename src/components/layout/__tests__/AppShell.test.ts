import { describe, expect, it } from "vitest";
import { resolveActiveModule, shouldNormalizeInvalidModule } from "../app-shell-routing";

const moduleKeys = new Set(["overview", "financials", "valuation"]);

describe("AppShell module routing helpers", () => {
  it("keeps a valid module from URL", () => {
    expect(resolveActiveModule("valuation", moduleKeys, "overview")).toBe("valuation");
    expect(shouldNormalizeInvalidModule("valuation", moduleKeys)).toBe(false);
  });

  it("falls back to overview for an invalid module", () => {
    expect(resolveActiveModule("abc", moduleKeys, "overview")).toBe("overview");
    expect(shouldNormalizeInvalidModule("abc", moduleKeys)).toBe(true);
  });

  it("does not normalize when no module query is present", () => {
    expect(resolveActiveModule(null, moduleKeys, "overview")).toBe("overview");
    expect(shouldNormalizeInvalidModule(null, moduleKeys)).toBe(false);
  });
});
