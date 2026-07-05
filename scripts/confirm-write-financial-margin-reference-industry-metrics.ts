import "dotenv/config";

import { buildFinancialMarginReferenceMetrics } from "../src/features/industry/lib/financial-margin-reference-metrics";
import { LONG_SAFE_FINANCIALS_SOURCE_LABEL } from "../src/features/financials/lib/long-safe-financials-csv-import";

type Ticker = "HPG" | "MWG" | "VNM";

const tickers = ["HPG", "MWG", "VNM"] as const;
const fiscalYear = 2024;
const mode = process.argv.includes("--confirm-write") ? "confirm_write" : "dry_run";
const requiredFlags = [
  "--confirm-local-research-only",
  "--confirm-single-company-reference",
  "--confirm-not-industry-benchmark",
] as const;

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
  const statements = await prisma.financialStatement.findMany({
    where: {
      dataMode: "research_only",
      fiscalYear,
      sourceLabel: LONG_SAFE_FINANCIALS_SOURCE_LABEL,
      ticker: { in: [...tickers] },
    },
    select: {
      fiscalYear: true,
      grossProfit: true,
      netIncome: true,
      revenue: true,
      sourceLabel: true,
      ticker: true,
    },
  });

  const metrics = statements.flatMap((statement) => {
    if (
      !tickers.includes(statement.ticker as Ticker) ||
      statement.fiscalYear === null ||
      statement.revenue === null ||
      statement.grossProfit === null ||
      statement.netIncome === null
    ) {
      return [];
    }

    return buildFinancialMarginReferenceMetrics({
      fiscalYear: statement.fiscalYear,
      grossProfit: Number(statement.grossProfit.toString()),
      netIncome: Number(statement.netIncome.toString()),
      revenue: Number(statement.revenue.toString()),
      sourceLabel: statement.sourceLabel,
      ticker: statement.ticker as Ticker,
    });
  });

  const missingTickers = tickers.filter((ticker) => !statements.some((statement) => statement.ticker === ticker));
  const industryRows = await prisma.industry.findMany({
    where: {
      industryCode: { in: [...new Set(metrics.map((metric) => metric.industryCode))] },
    },
    select: { industryCode: true },
  });
  const industryCodesInDb = new Set(industryRows.map((row) => row.industryCode));
  const missingIndustryCodes = [...new Set(metrics.map((metric) => metric.industryCode))].filter(
    (industryCode) => !industryCodesInDb.has(industryCode),
  );
  const eligible = missingTickers.length === 0 && missingIndustryCodes.length === 0;

  const summary = {
    eligible,
    fiscalYear,
    metricsPrepared: metrics.length,
    missingIndustryCodes,
    missingTickers,
    mode,
    sourceLabel: LONG_SAFE_FINANCIALS_SOURCE_LABEL,
    tickers,
  };

  if (mode === "dry_run") {
    console.log(JSON.stringify({ ...summary, metrics, writeAttempted: false }, null, 2));
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

  for (const metric of metrics) {
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
        sourceUrl: "D:\\financials_hpg_vnm_mwg_long_safe.csv",
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
        sourceUrl: "D:\\financials_hpg_vnm_mwg_long_safe.csv",
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
        sourceUrl: "D:\\financials_hpg_vnm_mwg_long_safe.csv",
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
        sourceUrl: "D:\\financials_hpg_vnm_mwg_long_safe.csv",
        warningCodes: warningCodes(metric.warningCodes),
      },
    });
    provenanceRowsWritten += 1;
  }

  console.log(JSON.stringify({ ...summary, metricRowsWritten, provenanceRowsWritten, writeAttempted: true }, null, 2));
  await prisma.$disconnect();
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown margin reference metric write failure");
  process.exit(1);
});

