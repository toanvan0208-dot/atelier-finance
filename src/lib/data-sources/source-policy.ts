import type {
  SourceAccessMethod,
  SourceAdapter,
  SourceRegistryEntry,
} from "./types";
import {
  evaluateSourceEvidence,
  canCacheSourceData,
  canRedistributeSourceData,
} from "./source-evidence";

const riskyAccessMethods: SourceAccessMethod[] = [
  "private_api",
  "undocumented_api",
  "private_or_undocumented_api",
];

const scrapedAccessMethods: SourceAccessMethod[] = ["scraping", "scraped"];

export const normalizeSourcePolicyEntry = (
  entry: SourceRegistryEntry,
): SourceRegistryEntry => {
  if (riskyAccessMethods.includes(entry.accessMethod) && entry.usageStatus === "approved") {
    return {
      ...entry,
      usageStatus: entry.accessMethod === "scraping" ? "needs_legal_review" : "blocked",
      notes: `${entry.notes} Risky access methods cannot be approved without explicit license and ToS evidence.`.trim(),
    };
  }

  if (scrapedAccessMethods.includes(entry.accessMethod) && entry.usageStatus === "approved") {
    return {
      ...entry,
      usageStatus: "needs_legal_review",
      notes: `${entry.notes} Scraped sources cannot be approved without explicit legal review evidence.`.trim(),
    };
  }

  if (entry.sourceEvidence) {
    const evaluation = evaluateSourceEvidence(entry.sourceEvidence, entry.usageStatus);
    if (entry.usageStatus === "approved" && !evaluation.productionUsable) {
      return {
        ...entry,
        usageStatus: evaluation.sourceStatus === "blocked" ? "blocked" : "needs_legal_review",
        cachingAllowed: canCacheSourceData(entry.sourceEvidence),
        redistributionAllowed: canRedistributeSourceData(entry.sourceEvidence),
        notes: `${entry.notes} Source evidence does not satisfy production runtime requirements.`.trim(),
      };
    }
  }

  if (
    entry.usageStatus === "approved" &&
    (entry.licenseStatus !== "approved" ||
      entry.tosStatus !== "approved" ||
      entry.redistributionAllowed !== true ||
      entry.cachingAllowed !== true ||
      entry.evidence.length === 0)
  ) {
    return {
      ...entry,
      usageStatus: "needs_legal_review",
      notes: `${entry.notes} Approved runtime use requires license, ToS, caching, redistribution, and evidence.`.trim(),
    };
  }

  return entry;
};

export const SOURCE_POLICY_REGISTRY: Record<string, SourceRegistryEntry> = {
  "mock-inline-fixture": normalizeSourcePolicyEntry({
    id: "mock-inline-fixture",
    name: "Inline mock fixture",
    sourceType: "curated_internal",
    supportedDataGroups: ["market", "financial_statement", "valuation"],
    usageStatus: "research_only",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: "unknown",
    cachingAllowed: "unknown",
    accessMethod: "manual_fixture",
    evidence: [],
    sourceEvidence: {
      sourceId: "mock-inline-fixture",
      sourceName: "Inline mock fixture",
      sourceType: "curated_internal",
      dataGroups: ["market", "financial_statement", "valuation"],
      homepageUrl: null,
      documentationUrl: null,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
      allowsPersonalUse: true,
      allowsAcademicUse: true,
      allowsCommercialUse: false,
      allowsRuntimeDisplay: false,
      allowsCaching: false,
      allowsRedistribution: false,
      allowsDerivedData: true,
      requiresAttribution: false,
      attributionText: null,
      accessMethod: "manual_fixture",
      evidenceStatus: "missing",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "Inline test source only.",
      notes: "Tiny inline test fixture only. It is not a production data source.",
      risks: ["mock_data"],
      blockedReason: null,
    },
    notes: "Tiny inline test fixture only. It is not a production data source.",
  }),
  "mock-test-source": normalizeSourcePolicyEntry({
    id: "mock-test-source",
    name: "Mock test source",
    sourceType: "curated_internal",
    supportedDataGroups: ["market", "financial_statement", "valuation"],
    usageStatus: "research_only",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: false,
    cachingAllowed: false,
    accessMethod: "manual_fixture",
    evidence: [],
    sourceEvidence: {
      sourceId: "mock-test-source",
      sourceName: "Mock test source",
      sourceType: "curated_internal",
      dataGroups: ["market", "financial_statement", "valuation"],
      homepageUrl: null,
      documentationUrl: null,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
      allowsPersonalUse: true,
      allowsAcademicUse: true,
      allowsCommercialUse: false,
      allowsRuntimeDisplay: false,
      allowsCaching: false,
      allowsRedistribution: false,
      allowsDerivedData: true,
      requiresAttribution: false,
      attributionText: null,
      accessMethod: "manual_fixture",
      evidenceStatus: "missing",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "Test mode only.",
      notes: "Fixture source for tests and local development warnings.",
      risks: ["mock_data"],
      blockedReason: null,
    },
    notes: "Fixture source for tests and local development warnings.",
  }),
  "manual-academic-source": normalizeSourcePolicyEntry({
    id: "manual-academic-source",
    name: "Manual academic source",
    sourceType: "curated_internal",
    supportedDataGroups: ["financial_statement", "company_profile"],
    usageStatus: "research_only",
    licenseStatus: "needs_review",
    tosStatus: "needs_review",
    redistributionAllowed: false,
    cachingAllowed: "unknown",
    accessMethod: "manual_upload",
    evidence: [],
    sourceEvidence: {
      sourceId: "manual-academic-source",
      sourceName: "Manual academic source",
      sourceType: "curated_internal",
      dataGroups: ["financial_statement", "company_profile"],
      homepageUrl: null,
      documentationUrl: null,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
      allowsPersonalUse: true,
      allowsAcademicUse: true,
      allowsCommercialUse: false,
      allowsRuntimeDisplay: false,
      allowsCaching: "unknown",
      allowsRedistribution: false,
      allowsDerivedData: "unknown",
      requiresAttribution: "unknown",
      attributionText: null,
      accessMethod: "manual_upload",
      evidenceStatus: "partially_verified",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "Academic/local verification only until rights are reviewed.",
      notes: "Manual academic source is not public-product approved.",
      risks: ["license_unclear", "redistribution_not_allowed"],
      blockedReason: null,
    },
    notes: "Academic/local verification source only. Not production-approved.",
  }),
  "official-disclosure-placeholder": normalizeSourcePolicyEntry({
    id: "official-disclosure-placeholder",
    name: "Official disclosure placeholder",
    sourceType: "company_disclosure",
    supportedDataGroups: ["financial_statement", "company_profile"],
    usageStatus: "needs_legal_review",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: "unknown",
    cachingAllowed: "unknown",
    accessMethod: "public_file",
    evidence: [],
    notes: "Placeholder for future official filing adapters after source review.",
  }),
  "official-disclosure-financials-pilot": normalizeSourcePolicyEntry({
    id: "official-disclosure-financials-pilot",
    name: "Official disclosure financials pilot candidate",
    sourceType: "company_disclosure",
    supportedDataGroups: ["financial_statement", "company_profile"],
    usageStatus: "needs_legal_review",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: "unknown",
    cachingAllowed: "unknown",
    accessMethod: "public_file",
    evidence: [],
    sourceEvidence: {
      sourceId: "official-disclosure-financials-pilot",
      sourceName: "Official disclosure financials pilot candidate",
      sourceType: "company_disclosure",
      dataGroups: ["financial_statement", "company_profile"],
      homepageUrl: null,
      documentationUrl: null,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
      allowsPersonalUse: "unknown",
      allowsAcademicUse: "unknown",
      allowsCommercialUse: "unknown",
      allowsRuntimeDisplay: "unknown",
      allowsCaching: "unknown",
      allowsRedistribution: "unknown",
      allowsDerivedData: "unknown",
      requiresAttribution: "unknown",
      attributionText: null,
      accessMethod: "public_file",
      evidenceStatus: "missing",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "Phase 30B candidate record only. Exact source, license, and Terms are pending review.",
      notes: "Official company filing/disclosure source class selected for adapter pilot design. Not production-approved.",
      risks: ["license_missing", "tos_missing", "runtime_rights_unknown", "caching_unknown"],
      blockedReason: null,
    },
    notes: "Phase 30B source candidate. Exact source and legal rights are not approved yet.",
  }),
  "private-undocumented-placeholder": normalizeSourcePolicyEntry({
    id: "private-undocumented-placeholder",
    name: "Private undocumented placeholder",
    sourceType: "unknown",
    supportedDataGroups: ["market", "financial_statement", "macro"],
    usageStatus: "blocked",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: "unknown",
    cachingAllowed: "unknown",
    accessMethod: "undocumented_api",
    evidence: [],
    sourceEvidence: {
      sourceId: "private-undocumented-placeholder",
      sourceName: "Private undocumented placeholder",
      sourceType: "unknown",
      dataGroups: ["market", "financial_statement", "macro"],
      homepageUrl: null,
      documentationUrl: null,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
      allowsPersonalUse: "unknown",
      allowsAcademicUse: "unknown",
      allowsCommercialUse: "unknown",
      allowsRuntimeDisplay: "unknown",
      allowsCaching: "unknown",
      allowsRedistribution: "unknown",
      allowsDerivedData: "unknown",
      requiresAttribution: "unknown",
      attributionText: null,
      accessMethod: "private_or_undocumented_api",
      evidenceStatus: "missing",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "Blocked placeholder for policy tests.",
      notes: "Private or undocumented APIs are blocked until legal and technical risk review.",
      risks: ["private_api", "tos_unknown", "redistribution_unknown"],
      blockedReason: "Private or undocumented API.",
    },
    notes: "Private or undocumented APIs are blocked until legal and technical risk review.",
  }),
  "undocumented-market-api": normalizeSourcePolicyEntry({
    id: "undocumented-market-api",
    name: "Undocumented market API",
    sourceType: "unknown",
    supportedDataGroups: ["market"],
    usageStatus: "blocked",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: "unknown",
    cachingAllowed: "unknown",
    accessMethod: "private_or_undocumented_api",
    evidence: [],
    sourceEvidence: {
      sourceId: "undocumented-market-api",
      sourceName: "Undocumented market API",
      sourceType: "unknown",
      dataGroups: ["market"],
      homepageUrl: null,
      documentationUrl: null,
      licenseName: null,
      licenseUrl: null,
      termsUrl: null,
      allowsPersonalUse: "unknown",
      allowsAcademicUse: "unknown",
      allowsCommercialUse: "unknown",
      allowsRuntimeDisplay: "unknown",
      allowsCaching: "unknown",
      allowsRedistribution: "unknown",
      allowsDerivedData: "unknown",
      requiresAttribution: "unknown",
      attributionText: null,
      accessMethod: "private_or_undocumented_api",
      evidenceStatus: "missing",
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "Blocked sample source for policy hardening tests.",
      notes: "Blocked sample source. Do not use for runtime.",
      risks: ["private_api", "license_missing", "tos_missing"],
      blockedReason: "Undocumented access method.",
    },
    notes: "Blocked sample source. Do not use for runtime.",
  }),
};

export const getSourcePolicy = (sourceId: string): SourceRegistryEntry => (
  SOURCE_POLICY_REGISTRY[sourceId] ?? {
    id: sourceId,
    name: sourceId,
    sourceType: "unknown",
    supportedDataGroups: [],
    usageStatus: "unknown",
    licenseStatus: "not_checked",
    tosStatus: "not_checked",
    redistributionAllowed: "unknown",
    cachingAllowed: "unknown",
    accessMethod: "unknown",
    evidence: [],
    notes: "Source is not registered.",
  }
);

export const isSourceUsableForProductRuntime = (
  entry: SourceRegistryEntry,
): boolean => {
  const normalized = normalizeSourcePolicyEntry(entry);
  if (normalized.sourceEvidence) {
    return evaluateSourceEvidence(normalized.sourceEvidence, normalized.usageStatus).productionUsable;
  }

  return (
    normalized.usageStatus === "approved" &&
    normalized.licenseStatus === "approved" &&
    normalized.tosStatus === "approved" &&
    normalized.redistributionAllowed === true &&
    normalized.cachingAllowed === true &&
    normalized.evidence.length > 0
  );
};

export const assertAdapterSourcePolicy = (adapter: SourceAdapter): SourceRegistryEntry => {
  const policy = getSourcePolicy(adapter.id);
  return normalizeSourcePolicyEntry({
    ...policy,
    sourceType: adapter.sourceType,
    supportedDataGroups: adapter.supportedDataGroups,
    usageStatus: adapter.legalStatus,
    licenseStatus: adapter.licenseStatus,
  });
};
