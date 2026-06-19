export const VNSTOCK_RESEARCH_SOURCE_POLICY = {
  sourceCandidateId: "vnstock-academic-research-connector",
  provider: "vnstock",
  sourceType: "third_party_tool",
  usageScope: "academic_non_commercial",
  reviewStatus: "research_connector_candidate",
  legalStatus: "needs_review",
  productionApproved: false,
  attributionRequired: true,
  runtimeUse: "not_configured",
  implementationStatus: "skeleton_only",
  originalDataRights: "upstream_providers_may_apply",
} as const;

export type VnstockResearchConnectorMode =
  | "disabled"
  | "metadata_only"
  | "local_research";

export type VnstockResearchConnectorConfig = {
  enabled?: boolean;
  allowNetwork?: boolean;
  mode?: VnstockResearchConnectorMode;
};

export type VnstockResearchConnectorStatus =
  | "disabled"
  | "not_configured"
  | "network_not_allowed";

export type VnstockResearchConnectorResult = {
  ok: false;
  status: VnstockResearchConnectorStatus;
  data: null;
  metadata: typeof VNSTOCK_RESEARCH_SOURCE_POLICY;
  warnings: string[];
};

export const DEFAULT_VNSTOCK_RESEARCH_CONNECTOR_CONFIG = {
  enabled: false,
  allowNetwork: false,
  mode: "disabled",
} as const satisfies Required<VnstockResearchConnectorConfig>;

const baseWarnings = [
  "Vnstock is an academic/local research connector candidate only.",
  "Vnstock research connector is not production-approved.",
  "No network or data fetch is enabled in Phase 31B.",
  "Original data rights may belong to upstream providers.",
] as const;

const buildResult = (
  status: VnstockResearchConnectorStatus,
  warnings: string[] = [],
): VnstockResearchConnectorResult => ({
  ok: false,
  status,
  data: null,
  metadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
  warnings: [...baseWarnings, ...warnings],
});

export const getVnstockResearchConnectorStatus = (
  config: VnstockResearchConnectorConfig = {},
): VnstockResearchConnectorResult => {
  const resolved = {
    ...DEFAULT_VNSTOCK_RESEARCH_CONNECTOR_CONFIG,
    ...config,
  };

  if (!resolved.enabled || resolved.mode === "disabled") {
    return buildResult("disabled");
  }

  if (resolved.mode === "local_research" && !resolved.allowNetwork) {
    return buildResult("network_not_allowed", [
      "Local research mode requested, but network access is disabled by policy.",
    ]);
  }

  return buildResult("not_configured", [
    "Vnstock connector remains metadata-only until a later approved phase.",
  ]);
};

export const createVnstockResearchConnector = getVnstockResearchConnectorStatus;

export const isVnstockResearchConnectorProductionApproved = (): false =>
  VNSTOCK_RESEARCH_SOURCE_POLICY.productionApproved;
