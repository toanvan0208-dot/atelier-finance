import { prisma } from "../../../lib/database/client";

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
  industryContext: Awaited<ReturnType<typeof loadIndustryContextByTicker>>,
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
    "IndustryContext currently stores sourceLabel but no sourceUrl/native provenance field.",
    "sourceLabel must not be treated as a reviewed source URL.",
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
    },
    missingReason: null,
  };
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

  const validIndustries = industries.filter(i => allowedIndustryDataModes.has(i.dataMode));

  if (validIndustries.length === 0) return null;

  return validIndustries[0];
}

export async function loadIndustryContextRuntimeByTicker(
  ticker: string,
): Promise<IndustryContextRuntimePayload> {
  const context = await loadIndustryContextByTicker(ticker);
  return buildIndustryContextPayload(ticker, context);
}
