import { describe, expect, it } from "vitest";

import {
  assertSourceAllowedForAdapter,
  blockedAdapterResult,
  canCacheSourceData,
  canRedistributeSourceData,
  canUseSourceForRuntime,
  evaluateSourceEvidence,
  getSourcePolicy,
  isSourceUsableForProductRuntime,
  mockSourceAdapter,
  normalizeSourcePolicyEntry,
  type SourceEvidence,
  type SourceRegistryEntry,
} from "../index";

const verifiedSourceEvidence: SourceEvidence = {
  sourceId: "verified-source",
  sourceName: "Verified source",
  sourceType: "licensed_vendor",
  dataGroups: ["market"],
  homepageUrl: "https://example.test",
  documentationUrl: "https://example.test/docs",
  licenseName: "Example Data License",
  licenseUrl: "https://example.test/license",
  termsUrl: "https://example.test/terms",
  allowsPersonalUse: true,
  allowsAcademicUse: true,
  allowsCommercialUse: true,
  allowsRuntimeDisplay: true,
  allowsCaching: true,
  allowsRedistribution: true,
  allowsDerivedData: true,
  requiresAttribution: true,
  attributionText: "Source: Example",
  accessMethod: "licensed_feed",
  evidenceStatus: "verified",
  reviewedAt: "2026-06-17",
  reviewedBy: "unit-test",
  reviewNote: "Fixture only.",
  notes: "Test evidence.",
  risks: [],
  blockedReason: null,
};

const registryEntry = (
  sourceEvidence: SourceEvidence,
  usageStatus: SourceRegistryEntry["usageStatus"] = "approved",
): SourceRegistryEntry => ({
  id: sourceEvidence.sourceId,
  name: sourceEvidence.sourceName,
  sourceType: sourceEvidence.sourceType,
  supportedDataGroups: sourceEvidence.dataGroups,
  usageStatus,
  licenseStatus: "approved",
  tosStatus: "approved",
  redistributionAllowed: true,
  cachingAllowed: true,
  accessMethod: sourceEvidence.accessMethod,
  evidence: ["unit-test evidence"],
  sourceEvidence,
  notes: "Test entry.",
});

describe("source evidence policy hardening", () => {
  it("does not allow production runtime when license or terms are missing", () => {
    const evidence: SourceEvidence = {
      ...verifiedSourceEvidence,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
    };
    const evaluation = evaluateSourceEvidence(evidence, "approved");

    expect(evaluation.productionUsable).toBe(false);
    expect(evaluation.requiresLegalReview).toBe(true);
    expect(isSourceUsableForProductRuntime(registryEntry(evidence))).toBe(false);
  });

  it("does not allow production runtime when evidence is missing or partially verified", () => {
    for (const evidenceStatus of ["missing", "partially_verified"] as const) {
      const evidence: SourceEvidence = {
        ...verifiedSourceEvidence,
        evidenceStatus,
      };
      const evaluation = evaluateSourceEvidence(evidence, "approved");

      expect(evaluation.productionUsable).toBe(false);
      expect(evaluation.sourceStatus).toBe("needs_legal_review");
    }
  });

  it("does not approve private or undocumented APIs", () => {
    const evidence: SourceEvidence = {
      ...verifiedSourceEvidence,
      accessMethod: "private_or_undocumented_api",
      blockedReason: "Private API.",
    };
    const entry = normalizeSourcePolicyEntry(registryEntry(evidence));
    const evaluation = evaluateSourceEvidence(evidence, "approved");

    expect(entry.usageStatus).toBe("blocked");
    expect(evaluation.productionUsable).toBe(false);
    expect(evaluation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PRIVATE_SOURCE_BLOCKED" }),
      ]),
    );
  });

  it("does not production-approve scraped sources without legal review", () => {
    const evidence: SourceEvidence = {
      ...verifiedSourceEvidence,
      accessMethod: "scraped",
    };
    const entry = normalizeSourcePolicyEntry(registryEntry(evidence));

    expect(entry.usageStatus).toBe("needs_legal_review");
    expect(isSourceUsableForProductRuntime(entry)).toBe(false);
  });

  it("keeps academic-only sources out of production mode", () => {
    const evidence: SourceEvidence = {
      ...verifiedSourceEvidence,
      allowsCommercialUse: false,
      allowsCaching: "unknown",
      allowsRedistribution: false,
      allowsDerivedData: "unknown",
    };

    expect(canUseSourceForRuntime(evidence, "thesis_verification", "research_only")).toBe(true);
    expect(canUseSourceForRuntime(evidence, "production", "research_only")).toBe(false);
  });

  it("does not run research-only sources in production adapter mode", () => {
    const policy = getSourcePolicy("mock-inline-fixture");
    const blocked = assertSourceAllowedForAdapter(mockSourceAdapter, policy, "production");

    expect(blocked?.data).toBeNull();
    expect(blocked?.readiness).toBe("not_ready");
    expect(blocked?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SOURCE_MODE_NOT_ALLOWED" }),
      ]),
    );
  });

  it("returns a clear error for blocked sources", () => {
    const policy = getSourcePolicy("undocumented-market-api");
    const blocked = assertSourceAllowedForAdapter(mockSourceAdapter, policy, "development");

    expect(policy.usageStatus).toBe("blocked");
    expect(blocked?.data).toBeNull();
    expect(blocked?.readiness).toBe("not_ready");
    expect(blocked?.errors.length).toBeGreaterThan(0);
  });

  it("allows mock source only in test or development policy modes", () => {
    const policy = getSourcePolicy("mock-test-source");

    expect(policy.sourceEvidence).toBeDefined();
    expect(canUseSourceForRuntime(policy.sourceEvidence!, "test", policy.usageStatus)).toBe(true);
    expect(canUseSourceForRuntime(policy.sourceEvidence!, "development", policy.usageStatus)).toBe(true);
    expect(canUseSourceForRuntime(policy.sourceEvidence!, "production", policy.usageStatus)).toBe(false);
  });

  it("blocks caching and redistribution when permission is false or unknown", () => {
    expect(canCacheSourceData({ ...verifiedSourceEvidence, allowsCaching: false })).toBe(false);
    expect(canCacheSourceData({ ...verifiedSourceEvidence, allowsCaching: "unknown" })).toBe(false);
    expect(canRedistributeSourceData({ ...verifiedSourceEvidence, allowsRedistribution: false })).toBe(false);
    expect(canRedistributeSourceData({ ...verifiedSourceEvidence, allowsRedistribution: "unknown" })).toBe(false);
  });

  it("allows production runtime display without raw-data redistribution rights", () => {
    const evidence: SourceEvidence = {
      ...verifiedSourceEvidence,
      allowsRedistribution: false,
    };
    const evaluation = evaluateSourceEvidence(evidence, "approved");

    expect(evaluation.productionUsable).toBe(true);
    expect(evaluation.canRedistribute).toBe(false);
    expect(evaluation.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "REDISTRIBUTION_NOT_ALLOWED" }),
      ]),
    );
  });

  it("blocks production runtime when runtime display rights are not explicit", () => {
    const evidence: SourceEvidence = {
      ...verifiedSourceEvidence,
      allowsRuntimeDisplay: "unknown",
    };
    const evaluation = evaluateSourceEvidence(evidence, "approved");

    expect(evaluation.productionUsable).toBe(false);
    expect(evaluation.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "RUNTIME_DISPLAY_NOT_ALLOWED" }),
      ]),
    );
  });

  it("does not fallback to mock data when a real source is blocked", () => {
    const result = blockedAdapterResult("real-blocked-source", [
      { code: "SOURCE_BLOCKED", message: "Blocked source." },
    ]);

    expect(result.data).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.readiness).toBe("not_ready");
    expect(result.errors).toEqual([
      { code: "SOURCE_BLOCKED", message: "Blocked source." },
    ]);
  });
});
