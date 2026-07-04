import { existsSync, readFileSync } from "node:fs";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "159I";

type PrismaClientLike = typeof PrismaClientInstance;

type IndustryMetricReadRow = {
  id: string;
  industryCode: string;
  metricCode: string;
  metricName: string;
  metricLabelVi: string;
  metricGroup: string;
  value: string | number;
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
};

const TARGET_INDUSTRY_CODES = ["STEEL_MATERIALS", "RETAIL", "CONSUMER_STAPLES_DAIRY"] as const;
const EXPECTED_SOURCE_KEYS = [
  "local_pdf_steel_q1_2026:p3:global_crude_steel_mar_2026",
  "local_pdf_steel_q1_2026:p3:global_crude_steel_yoy_mar_2026",
  "local_pdf_retail_2026:p2:retail_sales_value_4m2026",
  "local_pdf_retail_2026:p2:retail_sales_yoy_4m2026",
  "local_pdf_retail_2026:p2:retail_sales_real_growth_4m2026",
] as const;

const readText = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of readText(filePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const countProductionApprovedTrue = async (db: PrismaClientLike): Promise<number> => {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    select (
      (select count(*) from "IndustryMetric" where "productionApproved" = true) +
      (select count(*) from "IndustryMetricProvenance" where "productionApproved" = true)
    )::bigint as count
  `;
  return Number(rows[0]?.count ?? 0);
};

const loadMetricRows = async (db: PrismaClientLike): Promise<IndustryMetricReadRow[]> =>
  db.$queryRaw<IndustryMetricReadRow[]>`
    select
      m."id",
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
    where m."sourceKey" = any(${EXPECTED_SOURCE_KEYS})
    group by m."id"
    order by m."industryCode", m."metricCode"
  `;

const toNumber = (value: string | number): number => (typeof value === "number" ? value : Number(value));

async function main() {
  loadEnvFile(".env");
  const { prisma } = await import("../src/lib/database/client.js");

  const rows = await loadMetricRows(prisma);
  const groupedByIndustry = TARGET_INDUSTRY_CODES.map((industryCode) => {
    const industryRows = rows.filter((row) => row.industryCode === industryCode);

    return {
      industryCode,
      metricCount: industryRows.length,
      metrics: industryRows.map((row) => ({
        metricCode: row.metricCode,
        metricLabelVi: row.metricLabelVi,
        value: toNumber(row.value),
        unit: row.unit,
        periodLabel: row.periodLabel,
        observationDate: row.observationDate.toISOString().slice(0, 10),
        sourceLabel: row.sourceLabel,
        sourceKey: row.sourceKey,
        dataMode: row.dataMode,
        productionApproved: row.productionApproved,
        needsReview: row.needsReview,
        qualityStatus: row.qualityStatus,
        provenanceCount: Number(row.provenanceCount),
        userFacingCaveat:
          "Research-only industry metric. Needs review and must not be used as a benchmark, score, or investment conclusion.",
      })),
    };
  });

  const missingSourceKeys = EXPECTED_SOURCE_KEYS.filter(
    (sourceKey) => !rows.some((row) => row.sourceKey === sourceKey),
  );
  const rowsWithoutProvenance = rows.filter((row) => Number(row.provenanceCount) === 0).length;
  const rowsNotResearchOnly = rows.filter((row) => row.dataMode !== "research_only").length;
  const rowsProductionApproved = rows.filter((row) => row.productionApproved).length;
  const rowsNotNeedsReview = rows.filter((row) => !row.needsReview).length;
  const rowsWithoutNeedsReviewQuality = rows.filter((row) => row.qualityStatus !== "needs_review").length;
  const productionApprovedTrueCount = await countProductionApprovedTrue(prisma);

  const result = {
    phase: PHASE,
    mode: "industry_metric_read_path_dry_run",
    dbWriteAttempted: false,
    schemaChanged: false,
    migrationCreated: false,
    providerFetchAttempted: false,
    rawSourceImportAttempted: false,
    industryMetricWriteAttempted: false,
    industryMetricProvenanceWriteAttempted: false,
    targetIndustryCodes: TARGET_INDUSTRY_CODES,
    expectedSourceKeyCount: EXPECTED_SOURCE_KEYS.length,
    metricRowsRead: rows.length,
    missingSourceKeys,
    rowsWithoutProvenance,
    rowsNotResearchOnly,
    rowsProductionApproved,
    rowsNotNeedsReview,
    rowsWithoutNeedsReviewQuality,
    productionApprovedTrueCount,
    groupedByIndustry,
    safeReadPathPayloadAvailable: rows.length === EXPECTED_SOURCE_KEYS.length && rowsWithoutProvenance === 0,
    uiChangeIntroduced: false,
    assistantPromptChangeIntroduced: false,
    benchmarkRankingScoringIntroduced: false,
    tradingOrValuationOutputIntroduced: false,
    stockAttractivenessIntroduced: false,
    readyForUiWiring: false,
    readyForAssistantUse: false,
    recommendedNextPhase: "Phase 159J - IndustryMetric UI Read Path Wiring",
  };

  const auditPassed =
    result.mode === "industry_metric_read_path_dry_run" &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.migrationCreated &&
    !result.providerFetchAttempted &&
    !result.rawSourceImportAttempted &&
    !result.industryMetricWriteAttempted &&
    !result.industryMetricProvenanceWriteAttempted &&
    result.metricRowsRead === result.expectedSourceKeyCount &&
    result.missingSourceKeys.length === 0 &&
    result.rowsWithoutProvenance === 0 &&
    result.rowsNotResearchOnly === 0 &&
    result.rowsProductionApproved === 0 &&
    result.rowsNotNeedsReview === 0 &&
    result.rowsWithoutNeedsReviewQuality === 0 &&
    result.productionApprovedTrueCount === 0 &&
    result.safeReadPathPayloadAvailable &&
    !result.uiChangeIntroduced &&
    !result.assistantPromptChangeIntroduced &&
    !result.readyForUiWiring &&
    !result.readyForAssistantUse;

  console.log(JSON.stringify({ ...result, auditPassed }, null, 2));

  await prisma.$disconnect();

  if (!auditPassed) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
