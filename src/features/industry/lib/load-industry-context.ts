import { prisma } from "../../../lib/database/client";
import { isReviewedMappedTicker } from "./reviewed-industry-coverage";

type IndustryContextRow = NonNullable<Awaited<ReturnType<typeof prisma.industryContext.findFirst>>>;
type IndustryContextProvenanceRow = NonNullable<
  Awaited<ReturnType<typeof prisma.industryContextProvenance.findFirst>>
>;

type IndustryContextProvenanceSummary = {
  rowsFound: number;
  sourceLabels: string[];
  sourceUrls: string[];
  sourceTypes: string[];
  productionApprovedTrueCount: number;
  needsReviewTrueCount: number;
  warningCodes: string[];
  sidecarReadStatus: "available" | "missing_or_not_applied";
};

export type IndustryMetricRuntimeRow = {
  industryCode: string;
  metricCode: string;
  metricName: string;
  metricLabelVi: string;
  metricGroup: string;
  value: number;
  unit: string;
  periodType: string;
  periodLabel: string;
  observationDate: string;
  sourceLabel: string;
  sourceKey: string;
  dataMode: "research_only";
  productionApproved: false;
  needsReview: true;
  qualityStatus: "needs_review";
  provenanceCount: number;
  caveats: string[];
  warningCodes: string[];
};

export type IndustryMetricRuntimeSummary = {
  status: "available" | "missing";
  industryCode: string | null;
  rowsFound: number;
  metrics: IndustryMetricRuntimeRow[];
  missingReason: string | null;
  productionApprovedTrueCount: number;
  needsReviewTrueCount: number;
  rowsWithoutProvenance: number;
  dataMode: "research_only" | null;
  readyForUiDisplay: boolean;
  readyForAssistantUse: false;
  usedAsAutoComparison: false;
  usedAsInvestmentConclusion: false;
  warningCodes: string[];
  caveats: string[];
};

const peerGroupWarnings = [
  "PEER_GROUP_RESEARCH_ONLY",
  "PEER_GROUP_NEEDS_REVIEW",
  "PEER_GROUP_NOT_VALUATION_BENCHMARK",
  "PEER_GROUP_NOT_RISK_BENCHMARK",
];

const taxonomyWarnings = [
  "TAXONOMY_RESEARCH_ONLY",
  "TAXONOMY_NEEDS_REVIEW",
  "TAXONOMY_NOT_INVESTMENT_ADVICE",
  "TAXONOMY_NOT_VALUATION_BENCHMARK",
  "TAXONOMY_NOT_RISK_BENCHMARK",
];

type IndustryTaxonomyMapping = {
  ticker: string;
  industryCode: string;
  industryName: string;
  displayNameVi: string;
  sectorCode: string | null;
  sectorName: string | null;
  classificationSystem: string;
  roleType: string;
  segmentDescription: string | null;
  mappingConfidence: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType: string;
  dataMode: string;
  productionApproved: false;
  needsReview: true;
  warningCodes: string[];
  caveats: string[];
};

type IndustryTaxonomySummary = {
  status: "available" | "missing";
  ticker: string;
  industryCode: string | null;
  industryName: string | null;
  displayNameVi: string | null;
  roleType: string | null;
  mappingConfidence: string | null;
  dataMode: "research_only" | null;
  productionApproved: false;
  needsReview: true | null;
  sourceType: string | null;
  sourceUrl: string | null;
  warnings: string[];
};

export type IndustryPeerGroupRuntimeSummary = {
  ticker: string;
  status: "available" | "missing";
  industryCode: string | null;
  anchorTicker: string;
  peers: {
    ticker: string;
    peerRole: string;
    dataMode: string;
    productionApproved: false;
    needsReview: true;
    sourceType: string;
    sourceLabel: string;
    sourceUrl: string;
    publicationDate: string | null;
    retrievedAt: string | null;
    reviewNote: string | null;
    warningCodes: string[];
    caveats: string[];
  }[];
  missingReason: string | null;
  warnings: string[];
  peerGroupUsedAsValuationBenchmark: false;
  peerGroupUsedAsRiskBenchmark: false;
  peerGroupInferred: false;
};

export type IndustryTaxonomyRuntimePayload = {
  ticker: string;
  status: "available" | "missing";
  taxonomySummary: IndustryTaxonomySummary;
  mappings: IndustryTaxonomyMapping[];
  missingReason: string | null;
  peerGroupsAvailable: false;
  numericIndustryMetricsAvailable: false;
  valuationRiskBenchmarksAvailable: false;
  peerGroupInferred: false;
  industryMetricCreated: false;
  valuationRiskBenchmarkInvented: false;
  warningCodes: string[];
};

export type IndustryContextRuntimePayload = {
  ticker: string;
  status: "available" | "missing";
  context: {
    industryCode: string | null;
    industryName: string;
    industryOverview: string | null;
    howIndustryMakesMoney: string | null;
    keyDrivers: string | null;
    industryRisks: string | null;
    macroSensitivity: string | null;
    nextChecks: string | null;
    commonMisread: string | null;
    relatedTickers: string[];
    asOfDate: string;
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
    needsReview: true;
    numericIndustryMetricsAvailable: boolean;
    valuationRiskBenchmarksAvailable: false;
    caveats: string[];
    warningCodes: string[];
    provenanceLimitations: string[];
    provenanceSummary: IndustryContextProvenanceSummary;
    reviewedQualitativeContextAvailable: boolean;
    fullQualitativeContextAvailable: boolean;
    qualitativeContextSourceStatus: "source_backed" | "missing_provenance" | "legacy_or_static";
    staticGuidanceUsedAsReviewedContext: false;
  } | null;
  taxonomy: IndustryTaxonomyRuntimePayload;
  peerGroupSummary: IndustryPeerGroupRuntimeSummary;
  industryMetricSummary?: IndustryMetricRuntimeSummary;
  missingReason: string | null;
};

const allowedIndustryDataModes = new Set(["research_only"]);

const getCompanyIndustryDelegate = ():
  | typeof prisma.companyIndustry
  | null =>
  (prisma as { companyIndustry?: typeof prisma.companyIndustry }).companyIndustry ?? null;

const getIndustryPeerGroupDelegate = ():
  | typeof prisma.industryPeerGroup
  | null =>
  (prisma as { industryPeerGroup?: typeof prisma.industryPeerGroup }).industryPeerGroup ?? null;

const isLegacyMockLabeledText = (value: string | null): boolean =>
  typeof value === "string" && /\bmock\b/i.test(value);

const suppressLegacyMockText = (value: string | null): string | null =>
  isLegacyMockLabeledText(value) ? null : value;

const buildIndustryContextPayload = (
  ticker: string,
  industryContext: IndustryContextRow | null,
  taxonomy: IndustryTaxonomyRuntimePayload,
  peerGroupSummary: IndustryPeerGroupRuntimeSummary,
  industryMetricSummary: IndustryMetricRuntimeSummary,
  provenanceRows: IndustryContextProvenanceRow[] = [],
  provenanceSidecarReadStatus: IndustryContextProvenanceSummary["sidecarReadStatus"] = "available",
): IndustryContextRuntimePayload => {
  const normalizedTicker = ticker.trim().toUpperCase();

  if (!industryContext) {
    return {
      ticker: normalizedTicker,
      status: "missing",
      context: null,
      taxonomy,
      peerGroupSummary,
      industryMetricSummary,
      missingReason:
        "No eligible IndustryContext row found for this ticker. Missing data must remain unavailable and must not be filled from static or mock content.",
    };
  }

  const caveats = [
    "IndustryContext is qualitative research-only data, not production-approved data.",
    industryMetricSummary.status === "available"
      ? "Numeric industry metrics are available separately as research-only, needs-review Layer 5 data."
      : "Numeric industry metrics are not available yet.",
    "Valuation and risk industry benchmarks are not available yet.",
    "Qualitative industry context is not a peer benchmark.",
    "Do not use this context to make deterministic macro-to-industry conclusions.",
  ];
  const warningCodes = [
    "INDUSTRY_CONTEXT_RESEARCH_ONLY",
    "INDUSTRY_CONTEXT_NEEDS_REVIEW",
    industryMetricSummary.status === "available"
      ? "INDUSTRY_NUMERIC_METRICS_RESEARCH_ONLY"
      : "INDUSTRY_NUMERIC_METRICS_MISSING",
    "INDUSTRY_BENCHMARKS_MISSING",
  ];
  const provenanceLimitations = [
    "IndustryContextProvenance sidecar rows are required before this context can be treated as reviewed-source data.",
    "sourceLabel alone must not be treated as a reviewed source URL.",
  ];

  if (industryContext.sourceLabel.includes("staging")) {
    warningCodes.push("LEGACY_STAGING_RESEARCH_SEED");
    caveats.push("Legacy staging research seed context requires review before stronger user-facing claims.");
  }
  if (
    isLegacyMockLabeledText(industryContext.industryOverview) ||
    isLegacyMockLabeledText(industryContext.keyDrivers) ||
    isLegacyMockLabeledText(industryContext.industryRisks)
  ) {
    warningCodes.push("LEGACY_MOCK_LABELED_FIELD_SUPPRESSED");
    caveats.push("Legacy mock-labeled text was suppressed from the runtime payload.");
  }
  if (provenanceRows.length === 0) {
    warningCodes.push("INDUSTRY_CONTEXT_PROVENANCE_MISSING");
    provenanceLimitations.push("No IndustryContextProvenance rows are currently attached to this IndustryContext row.");
  }
  if (provenanceSidecarReadStatus === "missing_or_not_applied") {
    warningCodes.push("INDUSTRY_CONTEXT_PROVENANCE_SIDECAR_NOT_READABLE");
    provenanceLimitations.push("IndustryContextProvenance table/model was not readable in the current database snapshot.");
  }

  const provenanceSummary: IndustryContextProvenanceSummary = {
    rowsFound: provenanceRows.length,
    sourceLabels: [...new Set(provenanceRows.map((row) => row.sourceLabel).filter(Boolean))],
    sourceUrls: [...new Set(provenanceRows.map((row) => row.sourceUrl).filter(Boolean))],
    sourceTypes: [...new Set(provenanceRows.map((row) => row.sourceType).filter(Boolean))],
    productionApprovedTrueCount: provenanceRows.filter((row) => row.productionApproved).length,
    needsReviewTrueCount: provenanceRows.filter((row) => row.needsReview).length,
    warningCodes: [
      ...new Set(
        provenanceRows
          .flatMap((row) => parseWarningCodes(row.warningCodes))
          .filter((code) => code.length > 0),
      ),
    ],
    sidecarReadStatus: provenanceSidecarReadStatus,
  };
  const sourceBackedQualitativeContext =
    provenanceSummary.rowsFound > 0 &&
    provenanceSummary.sourceUrls.length > 0 &&
    provenanceSummary.productionApprovedTrueCount === 0;
  const fullQualitativeContextAvailable =
    sourceBackedQualitativeContext &&
    Boolean(
      industryContext.howIndustryMakesMoney &&
        industryContext.macroSensitivity &&
        industryContext.nextChecks &&
        industryContext.commonMisread,
    );

  if (sourceBackedQualitativeContext) {
    warningCodes.push("INDUSTRY_QUALITATIVE_CONTEXT_SOURCE_BACKED");
    caveats.push("Qualitative industry context has source provenance rows, but remains research_only and needsReview.");
    caveats.push("Qualitative industry context is not investment advice, not a valuation/risk benchmark, and not a peer benchmark.");
    caveats.push("Static compass guidance is educational only and is not treated as reviewed qualitative context.");
  }

  return {
    ticker: normalizedTicker,
    status: "available",
    context: {
      industryCode: industryContext.industryCode,
      industryName: industryContext.industryName,
      industryOverview: suppressLegacyMockText(industryContext.industryOverview),
      howIndustryMakesMoney: sourceBackedQualitativeContext
        ? suppressLegacyMockText(industryContext.howIndustryMakesMoney)
        : null,
      keyDrivers: suppressLegacyMockText(industryContext.keyDrivers),
      industryRisks: suppressLegacyMockText(industryContext.industryRisks),
      macroSensitivity: sourceBackedQualitativeContext
        ? suppressLegacyMockText(industryContext.macroSensitivity)
        : null,
      nextChecks: sourceBackedQualitativeContext
        ? suppressLegacyMockText(industryContext.nextChecks)
        : null,
      commonMisread: sourceBackedQualitativeContext
        ? suppressLegacyMockText(industryContext.commonMisread)
        : null,
      relatedTickers: industryContext.relatedTickers,
      asOfDate: industryContext.asOfDate.toISOString(),
      sourceLabel: industryContext.sourceLabel,
      dataMode: industryContext.dataMode,
      productionApproved: false,
      needsReview: true,
      numericIndustryMetricsAvailable: industryMetricSummary.status === "available",
      valuationRiskBenchmarksAvailable: false,
      caveats,
      warningCodes,
      provenanceLimitations,
      provenanceSummary,
      reviewedQualitativeContextAvailable: sourceBackedQualitativeContext,
      fullQualitativeContextAvailable,
      qualitativeContextSourceStatus: sourceBackedQualitativeContext
        ? "source_backed"
        : provenanceRows.length === 0
          ? "missing_provenance"
          : "legacy_or_static",
      staticGuidanceUsedAsReviewedContext: false,
    },
    taxonomy,
    peerGroupSummary,
    industryMetricSummary,
    missingReason: null,
  };
};

const parseWarningCodes = (warningCodes: string): string[] => {
  try {
    const parsed = JSON.parse(warningCodes);
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string") : [];
  } catch {
    return warningCodes
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);
  }
};

const buildMissingTaxonomyPayload = (
  ticker: string,
  reason = "No eligible CompanyIndustry taxonomy mapping found for this ticker. Missing taxonomy data must remain unavailable and must not be filled from static guidance.",
): IndustryTaxonomyRuntimePayload => {
  const normalizedTicker = ticker.trim().toUpperCase();

  return {
    ticker: normalizedTicker,
    status: "missing",
    taxonomySummary: {
      status: "missing",
      ticker: normalizedTicker,
      industryCode: null,
      industryName: null,
      displayNameVi: null,
      roleType: null,
      mappingConfidence: null,
      dataMode: null,
      productionApproved: false,
      needsReview: null,
      sourceType: null,
      sourceUrl: null,
      warnings: [
        "INDUSTRY_TAXONOMY_MAPPING_MISSING",
        "NO_PEER_GROUP_INFERENCE",
        ...taxonomyWarnings,
      ],
    },
    mappings: [],
    missingReason: reason,
    peerGroupsAvailable: false,
    numericIndustryMetricsAvailable: false,
    valuationRiskBenchmarksAvailable: false,
    peerGroupInferred: false,
    industryMetricCreated: false,
    valuationRiskBenchmarkInvented: false,
    warningCodes: [
      "INDUSTRY_TAXONOMY_MAPPING_MISSING",
      "NO_PEER_GROUP_INFERENCE",
      ...taxonomyWarnings,
      "INDUSTRY_METRICS_MISSING",
      "INDUSTRY_BENCHMARKS_MISSING",
    ],
  };
};

export async function loadIndustryTaxonomyRuntimeByTicker(
  ticker: string,
): Promise<IndustryTaxonomyRuntimePayload> {
  const normalizedTicker = ticker.trim().toUpperCase();
  if (!normalizedTicker) return buildMissingTaxonomyPayload(ticker, "Ticker is empty.");

  const companyIndustryDelegate = getCompanyIndustryDelegate();
  if (!companyIndustryDelegate) {
    return buildMissingTaxonomyPayload(
      normalizedTicker,
      "CompanyIndustry taxonomy model is not available in the current Prisma client. Missing taxonomy data must remain unavailable and must not be inferred.",
    );
  }

  const rows = await companyIndustryDelegate.findMany({
    where: {
      ticker: normalizedTicker,
      productionApproved: false,
      needsReview: true,
      dataMode: "research_only",
    },
    include: {
      industry: true,
    },
    orderBy: [
      {
        roleType: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  const validRows = rows.filter((row) => row.industry && row.industry.productionApproved === false);

  if (validRows.length === 0) {
    return buildMissingTaxonomyPayload(normalizedTicker);
  }

  const mappings = validRows.map((row): IndustryTaxonomyMapping => ({
    ticker: row.ticker,
    industryCode: row.industryCode,
    industryName: row.industry.industryName,
    displayNameVi: row.industry.displayNameVi,
    sectorCode: row.industry.sectorCode,
    sectorName: row.industry.sectorName,
    classificationSystem: row.industry.classificationSystem,
    roleType: row.roleType,
    segmentDescription: row.segmentDescription,
    mappingConfidence: row.mappingConfidence,
    sourceLabel: row.sourceLabel,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType,
    dataMode: row.dataMode,
    productionApproved: false,
    needsReview: true,
    warningCodes: [
      ...new Set([
        ...parseWarningCodes(row.warningCodes),
        ...parseWarningCodes(row.industry.warningCodes),
        "INDUSTRY_TAXONOMY_RESEARCH_ONLY",
        "INDUSTRY_TAXONOMY_NEEDS_REVIEW",
        ...taxonomyWarnings,
        "NO_PEER_GROUP_INFERENCE",
        "INDUSTRY_METRICS_MISSING",
        "INDUSTRY_BENCHMARKS_MISSING",
      ]),
    ],
    caveats: [
      "Industry taxonomy mapping is research-only and needs review.",
      "No peer group data is inferred from this mapping.",
      "Numeric industry metrics are not available yet.",
      "Valuation and risk industry benchmarks are not available yet.",
      "Taxonomy is not investment advice and must not be used to infer valuation, risk, or ticker quality.",
    ],
  }));

  const primaryMapping = mappings.find((mapping) => mapping.roleType === "primary") ?? mappings[0];

  return {
    ticker: normalizedTicker,
    status: "available",
    taxonomySummary: {
      status: "available",
      ticker: normalizedTicker,
      industryCode: primaryMapping.industryCode,
      industryName: primaryMapping.industryName,
      displayNameVi: primaryMapping.displayNameVi,
      roleType: primaryMapping.roleType,
      mappingConfidence: primaryMapping.mappingConfidence,
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true,
      sourceType: primaryMapping.sourceType,
      sourceUrl: primaryMapping.sourceUrl,
      warnings: [...new Set([...primaryMapping.warningCodes, ...taxonomyWarnings])],
    },
    mappings,
    missingReason: null,
    peerGroupsAvailable: false,
    numericIndustryMetricsAvailable: false,
    valuationRiskBenchmarksAvailable: false,
    peerGroupInferred: false,
    industryMetricCreated: false,
    valuationRiskBenchmarkInvented: false,
    warningCodes: [...new Set(mappings.flatMap((mapping) => mapping.warningCodes))],
  };
};

const buildMissingPeerGroupPayload = (
  ticker: string,
  reason = "No eligible source-backed IndustryPeerGroup rows found for this ticker. Missing peer group data must remain unavailable and must not be filled from static guidance.",
): IndustryPeerGroupRuntimeSummary => {
  const normalizedTicker = ticker.trim().toUpperCase();

  return {
    ticker: normalizedTicker,
    status: "missing",
    industryCode: null,
    anchorTicker: normalizedTicker,
    peers: [],
    missingReason: reason,
    warnings: [
      "PEER_GROUP_UNAVAILABLE",
      "PEER_GROUP_MISSING",
      "NO_PEER_GROUP_FALLBACK",
      ...peerGroupWarnings,
    ],
    peerGroupUsedAsValuationBenchmark: false,
    peerGroupUsedAsRiskBenchmark: false,
    peerGroupInferred: false,
  };
};

export async function loadIndustryPeerGroupSummaryByTicker(
  ticker: string,
): Promise<IndustryPeerGroupRuntimeSummary> {
  const normalizedTicker = ticker.trim().toUpperCase();
  if (!normalizedTicker) return buildMissingPeerGroupPayload(ticker, "Ticker is empty.");

  const companyIndustryDelegate = getCompanyIndustryDelegate();
  if (!companyIndustryDelegate) {
    return buildMissingPeerGroupPayload(
      normalizedTicker,
      "CompanyIndustry taxonomy model is not available in the current Prisma client. Missing peer group data must remain unavailable and must not be inferred.",
    );
  }

  const industryPeerGroupDelegate = getIndustryPeerGroupDelegate();
  if (!industryPeerGroupDelegate) {
    return buildMissingPeerGroupPayload(
      normalizedTicker,
      "IndustryPeerGroup model is not available in the current Prisma client. Missing peer group data must remain unavailable and must not be inferred.",
    );
  }

  const primaryMapping = await companyIndustryDelegate.findFirst({
    where: {
      ticker: normalizedTicker,
      roleType: "primary",
      productionApproved: false,
      needsReview: true,
      dataMode: "research_only",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!primaryMapping) {
    return buildMissingPeerGroupPayload(normalizedTicker);
  }

  const peerRows = await industryPeerGroupDelegate.findMany({
    where: {
      industryCode: primaryMapping.industryCode,
      productionApproved: false,
      needsReview: true,
      dataMode: "research_only",
    },
    orderBy: [
      {
        peerRole: "asc",
      },
      {
        peerTicker: "asc",
      },
    ],
  });

  const eligibleRows = peerRows.filter(
    (row) =>
      row.sourceUrl.trim().length > 0 &&
      row.sourceType.trim().length > 0 &&
      row.sourceLabel.trim().length > 0 &&
      (row.reviewNote?.trim().length ?? 0) > 0,
  );

  if (eligibleRows.length === 0) {
    return buildMissingPeerGroupPayload(
      normalizedTicker,
      `No eligible source-backed IndustryPeerGroup rows found for ${primaryMapping.industryCode}.`,
    );
  }

  return {
    ticker: normalizedTicker,
    status: "available",
    industryCode: primaryMapping.industryCode,
    anchorTicker: normalizedTicker,
    peers: eligibleRows.map((row) => ({
      ticker: row.peerTicker,
      peerRole: row.peerRole,
      dataMode: row.dataMode,
      productionApproved: false,
      needsReview: true,
      sourceType: row.sourceType,
      sourceLabel: row.sourceLabel,
      sourceUrl: row.sourceUrl,
      publicationDate: row.publicationDate?.toISOString() ?? null,
      retrievedAt: row.retrievedAt?.toISOString() ?? null,
      reviewNote: row.reviewNote,
      warningCodes: [
        ...new Set([
          ...parseWarningCodes(row.warningCodes),
          ...peerGroupWarnings,
        ]),
      ],
      caveats: [
        "Peer group is source-backed taxonomy context only.",
        "Peer group is research-only and needs review.",
        "Peer group must not be used as a valuation benchmark.",
        "Peer group must not be used as a risk benchmark.",
        "Do not infer that one ticker is better or worse from peer membership.",
      ],
    })),
    missingReason: null,
    warnings: peerGroupWarnings,
    peerGroupUsedAsValuationBenchmark: false,
    peerGroupUsedAsRiskBenchmark: false,
    peerGroupInferred: false,
  };
}

const buildMissingIndustryMetricSummary = (
  industryCode: string | null,
  reason = "No eligible research-only IndustryMetric rows found for this industry.",
): IndustryMetricRuntimeSummary => ({
  status: "missing",
  industryCode,
  rowsFound: 0,
  metrics: [],
  missingReason: reason,
  productionApprovedTrueCount: 0,
  needsReviewTrueCount: 0,
  rowsWithoutProvenance: 0,
  dataMode: null,
  readyForUiDisplay: false,
  readyForAssistantUse: false,
  usedAsAutoComparison: false,
  usedAsInvestmentConclusion: false,
  warningCodes: [
    "INDUSTRY_METRICS_MISSING",
    "INDUSTRY_METRICS_NO_FALLBACK",
    "INDUSTRY_METRICS_NOT_AUTO_COMPARISON",
    "INDUSTRY_METRICS_NOT_INVESTMENT_CONCLUSION",
  ],
  caveats: [
    "No eligible reviewed metric rows are available for this industry.",
    "Missing industry metric values must remain N/A.",
    "Do not infer metrics from taxonomy, peer group, or qualitative context.",
  ],
});

export async function loadIndustryMetricSummaryByIndustryCode(
  industryCode: string | null,
): Promise<IndustryMetricRuntimeSummary> {
  if (!industryCode) {
    return buildMissingIndustryMetricSummary(null, "No industry code is available for metric lookup.");
  }

  try {
    const rows = await prisma.$queryRaw<
      Array<{
        industryCode: string;
        metricCode: string;
        metricName: string;
        metricLabelVi: string;
        metricGroup: string;
        value: string | number | { toString(): string };
        unit: string;
        periodType: string;
        periodLabel: string;
        observationDate: Date;
        sourceLabel: string;
        sourceKey: string;
        dataMode: string;
        productionApproved: boolean;
        needsReview: boolean;
        qualityStatus: string;
        provenanceCount: bigint;
      }>
    >`
      select
        m."industryCode",
        m."metricCode",
        m."metricName",
        m."metricLabelVi",
        m."metricGroup",
        m."value",
        m."unit",
        m."periodType",
        m."periodLabel",
        m."observationDate",
        m."sourceLabel",
        m."sourceKey",
        m."dataMode",
        m."productionApproved",
        m."needsReview",
        m."qualityStatus",
        count(p."id")::bigint as "provenanceCount"
      from "IndustryMetric" m
      left join "IndustryMetricProvenance" p on p."industryMetricId" = m."id"
      where m."industryCode" = ${industryCode}
        and m."dataMode" = 'research_only'
        and m."productionApproved" = false
        and m."needsReview" = true
      group by m."id"
      order by m."metricGroup", m."metricCode"
    `;

    const validRows = rows.filter(
      (row) =>
        row.dataMode === "research_only" &&
        row.productionApproved === false &&
        row.needsReview === true &&
        row.qualityStatus === "needs_review",
    );

    if (validRows.length === 0) {
      return buildMissingIndustryMetricSummary(industryCode);
    }

    const metrics: IndustryMetricRuntimeRow[] = validRows.map((row) => ({
      industryCode: row.industryCode,
      metricCode: row.metricCode,
      metricName: row.metricName,
      metricLabelVi: row.metricLabelVi,
      metricGroup: row.metricGroup,
      value: typeof row.value === "number" ? row.value : Number(row.value.toString()),
      unit: row.unit,
      periodType: row.periodType,
      periodLabel: row.periodLabel,
      observationDate: row.observationDate.toISOString(),
      sourceLabel: row.sourceLabel,
      sourceKey: row.sourceKey,
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true,
      qualityStatus: "needs_review",
      provenanceCount: Number(row.provenanceCount),
      caveats: [
        "Industry metric is research-only and needs review.",
        "Industry metric is not an automatic comparison or investment conclusion.",
        "Use the metric as one source-backed data point only.",
      ],
      warningCodes: [
        "INDUSTRY_METRIC_RESEARCH_ONLY",
        "INDUSTRY_METRIC_NEEDS_REVIEW",
        "INDUSTRY_METRIC_NOT_AUTO_COMPARISON",
        "INDUSTRY_METRIC_NOT_INVESTMENT_CONCLUSION",
      ],
    }));

    const productionApprovedTrueCount = validRows.filter((row) => row.productionApproved).length;
    const rowsWithoutProvenance = validRows.filter((row) => Number(row.provenanceCount) === 0).length;

    return {
      status: "available",
      industryCode,
      rowsFound: metrics.length,
      metrics,
      missingReason: null,
      productionApprovedTrueCount,
      needsReviewTrueCount: validRows.filter((row) => row.needsReview).length,
      rowsWithoutProvenance,
      dataMode: "research_only",
      readyForUiDisplay: rowsWithoutProvenance === 0 && productionApprovedTrueCount === 0,
      readyForAssistantUse: false,
      usedAsAutoComparison: false,
      usedAsInvestmentConclusion: false,
      warningCodes: [
        "INDUSTRY_METRICS_RESEARCH_ONLY",
        "INDUSTRY_METRICS_NEEDS_REVIEW",
        "INDUSTRY_METRICS_NOT_AUTO_COMPARISON",
        "INDUSTRY_METRICS_NOT_INVESTMENT_CONCLUSION",
      ],
      caveats: [
        "Layer 5 metrics are available as research-only data.",
        "Metrics remain needsReview and productionApproved=false.",
        "Metrics must not be used as automatic comparisons or investment conclusions.",
      ],
    };
  } catch {
    return buildMissingIndustryMetricSummary(
      industryCode,
      "IndustryMetric table/model is not readable in the current database snapshot.",
    );
  }
}

const loadIndustryContextProvenanceRows = async (
  industryContext: IndustryContextRow | null,
  ticker: string,
): Promise<{
  rows: IndustryContextProvenanceRow[];
  sidecarReadStatus: IndustryContextProvenanceSummary["sidecarReadStatus"];
}> => {
  if (!industryContext) {
    return {
      rows: [],
      sidecarReadStatus: "available",
    };
  }

  try {
    const rows = await prisma.industryContextProvenance.findMany({
      where: {
        industryContextId: industryContext.id,
        ticker: ticker.trim().toUpperCase(),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      rows,
      sidecarReadStatus: "available",
    };
  } catch {
    return {
      rows: [],
      sidecarReadStatus: "missing_or_not_applied",
    };
  }
};

export async function loadIndustryContextByTicker(ticker: string) {
  const normalizedTicker = ticker.trim().toUpperCase();
  if (!normalizedTicker) return null;
  if (!isReviewedMappedTicker(normalizedTicker)) return null;

  const industries = await prisma.industryContext.findMany({
    where: {
      productionApproved: false,
      needsReview: true,
      contextLanguage: {
        in: ["en", "vi"],
      },
      relatedTickers: {
        has: normalizedTicker
      }
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        sourceLabel: "asc",
      },
    ],
  });

  const validIndustries = industries.filter((industry: IndustryContextRow) =>
    allowedIndustryDataModes.has(industry.dataMode),
  );

  if (validIndustries.length === 0) return null;

  return validIndustries[0];
}

export async function loadIndustryContextRuntimeByTicker(
  ticker: string,
): Promise<IndustryContextRuntimePayload> {
  const [context, taxonomy, peerGroupSummary] = await Promise.all([
    loadIndustryContextByTicker(ticker),
    loadIndustryTaxonomyRuntimeByTicker(ticker),
    loadIndustryPeerGroupSummaryByTicker(ticker),
  ]);
  const industryMetricSummary = await loadIndustryMetricSummaryByIndustryCode(
    taxonomy.taxonomySummary.industryCode,
  );
  const provenance = await loadIndustryContextProvenanceRows(context, ticker);
  return buildIndustryContextPayload(
    ticker,
    context,
    taxonomy,
    peerGroupSummary,
    industryMetricSummary,
    provenance.rows,
    provenance.sidecarReadStatus,
  );
}
