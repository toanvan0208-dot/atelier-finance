import { prisma } from "../../../lib/database/client";

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

export type IndustryContextRuntimePayload = {
  ticker: string;
  status: "available" | "missing";
  context: {
    industryCode: string | null;
    industryName: string;
    industryOverview: string | null;
    keyDrivers: string | null;
    industryRisks: string | null;
    relatedTickers: string[];
    asOfDate: string;
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
    needsReview: true;
    numericIndustryMetricsAvailable: false;
    valuationRiskBenchmarksAvailable: false;
    caveats: string[];
    warningCodes: string[];
    provenanceLimitations: string[];
    provenanceSummary: IndustryContextProvenanceSummary;
  } | null;
  missingReason: string | null;
};

const allowedIndustryDataModes = new Set(["research_only"]);

const isLegacyMockLabeledText = (value: string | null): boolean =>
  typeof value === "string" && /\bmock\b/i.test(value);

const suppressLegacyMockText = (value: string | null): string | null =>
  isLegacyMockLabeledText(value) ? null : value;

const buildIndustryContextPayload = (
  ticker: string,
  industryContext: IndustryContextRow | null,
  provenanceRows: IndustryContextProvenanceRow[] = [],
  provenanceSidecarReadStatus: IndustryContextProvenanceSummary["sidecarReadStatus"] = "available",
): IndustryContextRuntimePayload => {
  const normalizedTicker = ticker.trim().toUpperCase();

  if (!industryContext) {
    return {
      ticker: normalizedTicker,
      status: "missing",
      context: null,
      missingReason:
        "No eligible IndustryContext row found for this ticker. Missing data must remain unavailable and must not be filled from static or mock content.",
    };
  }

  const caveats = [
    "IndustryContext is qualitative research-only data, not production-approved data.",
    "Numeric industry metrics are not available yet.",
    "Valuation and risk industry benchmarks are not available yet.",
    "Do not use this context to make deterministic macro-to-industry conclusions.",
  ];
  const warningCodes = [
    "INDUSTRY_CONTEXT_RESEARCH_ONLY",
    "INDUSTRY_CONTEXT_NEEDS_REVIEW",
    "INDUSTRY_NUMERIC_METRICS_MISSING",
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

  return {
    ticker: normalizedTicker,
    status: "available",
    context: {
      industryCode: industryContext.industryCode,
      industryName: industryContext.industryName,
      industryOverview: suppressLegacyMockText(industryContext.industryOverview),
      keyDrivers: suppressLegacyMockText(industryContext.keyDrivers),
      industryRisks: suppressLegacyMockText(industryContext.industryRisks),
      relatedTickers: industryContext.relatedTickers,
      asOfDate: industryContext.asOfDate.toISOString(),
      sourceLabel: industryContext.sourceLabel,
      dataMode: industryContext.dataMode,
      productionApproved: false,
      needsReview: true,
      numericIndustryMetricsAvailable: false,
      valuationRiskBenchmarksAvailable: false,
      caveats,
      warningCodes,
      provenanceLimitations,
      provenanceSummary,
    },
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

  const industries = await prisma.industryContext.findMany({
    where: {
      productionApproved: false,
      needsReview: true,
      contextLanguage: "vi",
      relatedTickers: {
        has: normalizedTicker
      }
    },
    orderBy: {
      createdAt: "desc"
    }
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
  const context = await loadIndustryContextByTicker(ticker);
  const provenance = await loadIndustryContextProvenanceRows(context, ticker);
  return buildIndustryContextPayload(ticker, context, provenance.rows, provenance.sidecarReadStatus);
}
