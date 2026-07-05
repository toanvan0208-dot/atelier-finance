import "dotenv/config";

import { buildFinancialMarginReferenceMetrics } from "../src/features/industry/lib/financial-margin-reference-metrics";

type SteelPeerPdfCandidate = {
  ticker: "HSG" | "NKG";
  fiscalYear: number;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  sourceLabel: string;
  sourceUrl: string;
  evidenceNote: string;
};

const mode = process.argv.includes("--confirm-write") ? "confirm_write" : "dry_run";
const requiredFlags = [
  "--confirm-local-research-only",
  "--confirm-reviewed-pdf-manual-extraction",
  "--confirm-single-company-reference",
  "--confirm-not-industry-benchmark",
] as const;

const candidates: SteelPeerPdfCandidate[] = [
  {
    ticker: "HSG",
    fiscalYear: 2025,
    revenue: 36537815078167,
    grossProfit: 4515834848959,
    netIncome: 731506659656,
    sourceLabel: "HSG FY2025 consolidated financial statements PDF",
    sourceUrl: "D:\\20251030-hsg-bctc-hop-nhat-quy-4-ndtc-2024-2025.pdf",
    evidenceNote:
      "Reviewed page 5: net revenue 36,537,815,078,167; gross profit 4,515,834,848,959; profit after tax 731,506,659,656.",
  },
  {
    ticker: "NKG",
    fiscalYear: 2025,
    revenue: 14808145017155,
    grossProfit: 785173587619,
    netIncome: 197096350389,
    sourceLabel: "NKG FY2025 audited annual report PDF",
    sourceUrl: "D:\\20260413 - NKG - Bao cao thuong nien 2025-w.pdf",
    evidenceNote:
      "Reviewed financial statement page 8 and notes page 41: net revenue 14,808,145,017,155; gross profit 785,173,587,619; profit after tax 197,096,350,389.",
  },
];

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const ensureConfirmFlags = () => {
  const missing = requiredFlags.filter((flag) => !hasFlag(flag));
  if (missing.length > 0) {
    throw new Error(`Confirm write requires explicit safety flags: ${missing.join(", ")}`);
  }
};

const warningCodes = (codes: string[]) => JSON.stringify(codes);

const run = async () => {
  const { prisma } = await import("../src/lib/database/client");
  const metricsWithSource = candidates.flatMap((candidate) =>
    buildFinancialMarginReferenceMetrics({
      fiscalYear: candidate.fiscalYear,
      grossProfit: candidate.grossProfit,
      netIncome: candidate.netIncome,
      revenue: candidate.revenue,
      sourceLabel: candidate.sourceLabel,
      sourceType: "local_pdf_reviewed_mapping",
      ticker: candidate.ticker,
    }).map((metric) => ({
      ...metric,
      evidenceNotes: `${metric.evidenceNotes} ${candidate.evidenceNote}`,
      sourceUrl: candidate.sourceUrl,
    })),
  );

  const industryRows = await prisma.industry.findMany({
    where: {
      industryCode: { in: [...new Set(metricsWithSource.map((metric) => metric.industryCode))] },
    },
    select: { industryCode: true },
  });
  const industryCodesInDb = new Set(industryRows.map((row) => row.industryCode));
  const missingIndustryCodes = [...new Set(metricsWithSource.map((metric) => metric.industryCode))].filter(
    (industryCode) => !industryCodesInDb.has(industryCode),
  );
  const eligible = missingIndustryCodes.length === 0;

  const summary = {
    eligible,
    metricsPrepared: metricsWithSource.length,
    missingIndustryCodes,
    mode,
    tickers: candidates.map((candidate) => candidate.ticker),
  };

  if (mode === "dry_run") {
    console.log(JSON.stringify({ ...summary, metrics: metricsWithSource, writeAttempted: false }, null, 2));
    await prisma.$disconnect();
    return;
  }

  ensureConfirmFlags();
  if (!eligible) {
    console.log(JSON.stringify({ ...summary, blocked: true, writeAttempted: false }, null, 2));
    await prisma.$disconnect();
    return;
  }

  let metricRowsWritten = 0;
  let provenanceRowsWritten = 0;

  for (const metric of metricsWithSource) {
    const row = await prisma.industryMetric.upsert({
      where: {
        industryCode_metricCode_observationDate_sourceKey: {
          industryCode: metric.industryCode,
          metricCode: metric.metricCode,
          observationDate: new Date(metric.observationDate),
          sourceKey: metric.sourceKey,
        },
      },
      create: {
        dataMode: "research_only",
        industryCode: metric.industryCode,
        metricCode: metric.metricCode,
        metricGroup: metric.metricGroup,
        metricLabelVi: metric.metricLabelVi,
        metricName: metric.metricName,
        needsReview: true,
        observationDate: new Date(metric.observationDate),
        periodLabel: metric.periodLabel,
        periodType: metric.periodType,
        productionApproved: false,
        qualityStatus: "needs_review",
        sourceKey: metric.sourceKey,
        sourceLabel: metric.sourceLabel,
        sourceUrl: metric.sourceUrl,
        unit: metric.unit,
        value: metric.value,
        warningCodes: warningCodes(metric.warningCodes),
      },
      update: {
        dataMode: "research_only",
        metricGroup: metric.metricGroup,
        metricLabelVi: metric.metricLabelVi,
        metricName: metric.metricName,
        needsReview: true,
        periodLabel: metric.periodLabel,
        periodType: metric.periodType,
        productionApproved: false,
        qualityStatus: "needs_review",
        sourceLabel: metric.sourceLabel,
        sourceUrl: metric.sourceUrl,
        unit: metric.unit,
        value: metric.value,
        warningCodes: warningCodes(metric.warningCodes),
      },
    });
    metricRowsWritten += 1;

    await prisma.industryMetricProvenance.upsert({
      where: {
        industryMetricId_sourceKey: {
          industryMetricId: row.id,
          sourceKey: metric.sourceKey,
        },
      },
      create: {
        dataMode: "research_only",
        evidenceNotes: metric.evidenceNotes,
        industryCode: metric.industryCode,
        industryMetricId: row.id,
        metricCode: metric.metricCode,
        needsReview: true,
        observationDate: new Date(metric.observationDate),
        productionApproved: false,
        retrievedAt: new Date(),
        sourceKey: metric.sourceKey,
        sourceLabel: metric.sourceLabel,
        sourceType: metric.sourceType,
        sourceUrl: metric.sourceUrl,
        warningCodes: warningCodes(metric.warningCodes),
      },
      update: {
        dataMode: "research_only",
        evidenceNotes: metric.evidenceNotes,
        needsReview: true,
        productionApproved: false,
        retrievedAt: new Date(),
        sourceLabel: metric.sourceLabel,
        sourceType: metric.sourceType,
        sourceUrl: metric.sourceUrl,
        warningCodes: warningCodes(metric.warningCodes),
      },
    });
    provenanceRowsWritten += 1;
  }

  console.log(JSON.stringify({ ...summary, metricRowsWritten, provenanceRowsWritten, writeAttempted: true }, null, 2));
  await prisma.$disconnect();
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown steel peer PDF margin reference write failure");
  process.exit(1);
});
