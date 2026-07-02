import { prisma } from "@/lib/database/client";

export type ScreeningCandidateMetricPayload = {
  metricCode: string;
  value: number | null;
  unit: string | null;
  period: string | null;
  periodType: string | null;
  providerPeriod: string | null;
  snapshotDate: string | null;
  fiscalYearEnd: string | null;
  statementScope: string | null;
  sourceType: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  warningCodes: string[];
  dataMode: string;
  needsReview: boolean;
  productionApproved: boolean;
  provenanceSummary: {
    sourceType: string;
    sourceLabel: string;
    retrievedAt: string | null;
    publicationDate: string | null;
    warningCodes: string[];
  }[];
};

export type ScreeningCandidatePayload = {
  ticker: string;
  companyName: string | null;
  industryCode: string | null;
  peerRole: string | null;
  coverageLevel: string;
  screeningEligible: boolean;
  analysisEligible: boolean;
  needsReview: boolean;
  dataMode: string;
  researchOnly: boolean;
  productionApproved: boolean;
  warningCodes: string[];
  caveats: string[];
  metrics: ScreeningCandidateMetricPayload[];
  isValuationRiskBenchmarkEligible: boolean;
  isFullAnalysisEligible: boolean;
  fullAnalysisEnabled: boolean;
};

const allowedTickers = ["HSG", "NKG", "FPT", "HPG", "VNM", "MSN", "MWG", "VCB"] as const;
const blockedTickers = ["TVN"] as const;

const parseJsonList = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const decimalToNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber() as number;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const dateToIsoDate = (value: Date | null): string | null => value?.toISOString().slice(0, 10) ?? null;

export async function loadScreeningCandidatePayload(): Promise<ScreeningCandidatePayload[]> {
  const candidates = await prisma.screeningCandidate.findMany({
    where: {
      ticker: { in: [...allowedTickers] },
      screeningEligible: true,
      productionApproved: false,
    },
    include: {
      metrics: {
        include: {
          provenanceRows: true,
        },
        orderBy: { metricCode: "asc" },
      },
    },
    orderBy: { ticker: "asc" },
  });

  return candidates
    .filter((candidate) => !blockedTickers.includes(candidate.ticker as (typeof blockedTickers)[number]))
    .map((candidate) => ({
      ticker: candidate.ticker,
      companyName: candidate.companyName,
      industryCode: candidate.industryCode,
      peerRole: candidate.peerRole,
      coverageLevel: candidate.coverageLevel,
      screeningEligible: candidate.screeningEligible,
      analysisEligible: candidate.analysisEligible,
      needsReview: candidate.needsReview,
      dataMode: candidate.dataMode,
      researchOnly: candidate.dataMode === "research_only",
      productionApproved: candidate.productionApproved,
      warningCodes: parseJsonList(candidate.warningCodes),
      caveats: parseJsonList(candidate.caveats),
      metrics: candidate.metrics.map((metric) => ({
        metricCode: metric.metricCode,
        value: decimalToNumber(metric.value),
        unit: metric.unit,
        period: metric.period,
        periodType: metric.periodType,
        providerPeriod: metric.providerPeriod,
        snapshotDate: dateToIsoDate(metric.snapshotDate),
        fiscalYearEnd: dateToIsoDate(metric.fiscalYearEnd),
        statementScope: metric.statementScope,
        sourceType: metric.sourceType,
        sourceLabel: metric.sourceLabel,
        sourceUrl: metric.sourceUrl,
        warningCodes: parseJsonList(metric.warningCodes),
        dataMode: metric.dataMode,
        needsReview: metric.needsReview,
        productionApproved: metric.productionApproved,
        provenanceSummary: metric.provenanceRows.map((row) => ({
          sourceType: row.sourceType,
          sourceLabel: row.sourceLabel,
          retrievedAt: dateToIsoDate(row.retrievedAt),
          publicationDate: dateToIsoDate(row.publicationDate),
          warningCodes: parseJsonList(row.warningCodes),
        })),
      })),
      isValuationRiskBenchmarkEligible: false,
      isFullAnalysisEligible: candidate.analysisEligible,
      fullAnalysisEnabled: candidate.analysisEligible,
    }));
}
