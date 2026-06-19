import { describe, expect, it, vi } from "vitest";

import {
  createVnstockResearchConnector,
  getVnstockResearchConnectorStatus,
  isVnstockResearchConnectorProductionApproved,
  VNSTOCK_RESEARCH_SOURCE_POLICY,
} from "../index";

describe("vnstock research connector skeleton", () => {
  it("fails closed by default", () => {
    const result = createVnstockResearchConnector();

    expect(result.ok).toBe(false);
    expect(result.status).toBe("disabled");
    expect(result.data).toBeNull();
    expect(result.metadata.provider).toBe("vnstock");
    expect(result.metadata.productionApproved).toBe(false);
  });

  it("does not fetch when enabled but network is disabled", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = getVnstockResearchConnectorStatus({
      enabled: true,
      allowNetwork: false,
      mode: "local_research",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.status).toBe("network_not_allowed");
    expect(result.data).toBeNull();
    expect(result.warnings.join(" ")).toContain("not production-approved");
    expect(result.warnings.join(" ")).toContain("network access is disabled");

    fetchSpy.mockRestore();
  });

  it("preserves academic research metadata classification", () => {
    expect(VNSTOCK_RESEARCH_SOURCE_POLICY).toMatchObject({
      sourceCandidateId: "vnstock-academic-research-connector",
      provider: "vnstock",
      sourceType: "third_party_tool",
      usageScope: "academic_non_commercial",
      reviewStatus: "research_connector_candidate",
      legalStatus: "needs_review",
      productionApproved: false,
      attributionRequired: true,
      implementationStatus: "skeleton_only",
      runtimeUse: "not_configured",
    });
  });

  it("never reports production approval", () => {
    expect(isVnstockResearchConnectorProductionApproved()).toBe(false);
  });

  it("does not contain unsafe approval metadata", () => {
    const serialized = JSON.stringify(VNSTOCK_RESEARCH_SOURCE_POLICY);

    expect(serialized).not.toContain('"productionApproved":true');
  });
});
