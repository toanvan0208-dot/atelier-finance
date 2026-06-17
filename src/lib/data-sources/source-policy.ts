import type {
  SourceAccessMethod,
  SourceAdapter,
  SourceRegistryEntry,
} from "./types";

const riskyAccessMethods: SourceAccessMethod[] = [
  "private_api",
  "undocumented_api",
  "scraping",
];

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
    notes: "Tiny inline test fixture only. It is not a production data source.",
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
    notes: "Private or undocumented APIs are blocked until legal and technical risk review.",
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

