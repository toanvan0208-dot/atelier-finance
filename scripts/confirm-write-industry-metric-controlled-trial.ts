import { existsSync, readFileSync } from "node:fs";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "159H";

type PrismaClientLike = typeof PrismaClientInstance;

type EligibleMetricRow = {
  id: string;
  provenanceId: string;
  industryCode: string;
  metricCode: string;
  metricName: string;
  metricLabelVi: string;
  metricGroup: "volume" | "growth" | "demand";
  value: number;
  unit: string;
  periodType: "month" | "ytd";
  periodLabel: string;
  observationDate: string;
  sourceLabel: string;
  sourceKey: string;
  sourceType: "local_pdf_reviewed_mapping";
  publicationDate: string;
  pageNumber: number;
  evidenceNotes: string;
};

const eligibleMetricRows: EligibleMetricRow[] = [
  {
    id: "phase159h_metric_steel_global_crude_production_202603",
    provenanceId: "phase159h_prov_steel_global_crude_production_202603",
    industryCode: "STEEL_MATERIALS",
    metricCode: "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION",
    metricName: "Global crude steel production",
    metricLabelVi: "San luong thep tho toan cau",
    metricGroup: "volume",
    value: 159.9,
    unit: "million_tonnes",
    periodType: "month",
    periodLabel: "2026-03",
    observationDate: "2026-03-31",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    sourceKey: "local_pdf_steel_q1_2026:p3:global_crude_steel_mar_2026",
    sourceType: "local_pdf_reviewed_mapping",
    publicationDate: "2026-05-04",
    pageNumber: 3,
    evidenceNotes: "Reviewed Phase 159G mapping. Source page states March 2026 global crude steel output.",
  },
  {
    id: "phase159h_metric_steel_global_crude_yoy_202603",
    provenanceId: "phase159h_prov_steel_global_crude_yoy_202603",
    industryCode: "STEEL_MATERIALS",
    metricCode: "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY",
    metricName: "Global crude steel production YoY growth",
    metricLabelVi: "Tang truong san luong thep tho toan cau YoY",
    metricGroup: "growth",
    value: -4.2,
    unit: "percent",
    periodType: "month",
    periodLabel: "2026-03",
    observationDate: "2026-03-31",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    sourceKey: "local_pdf_steel_q1_2026:p3:global_crude_steel_yoy_mar_2026",
    sourceType: "local_pdf_reviewed_mapping",
    publicationDate: "2026-05-04",
    pageNumber: 3,
    evidenceNotes: "Reviewed Phase 159G mapping. Source page states March 2026 YoY change.",
  },
  {
    id: "phase159h_metric_retail_sales_value_202604_ytd",
    provenanceId: "phase159h_prov_retail_sales_value_202604_ytd",
    industryCode: "RETAIL",
    metricCode: "RETAIL_SALES_VALUE_CURRENT_PRICE",
    metricName: "Retail goods and services sales at current prices",
    metricLabelVi: "Doanh thu ban le hang hoa va dich vu theo gia hien hanh",
    metricGroup: "demand",
    value: 2546,
    unit: "vnd_trillion",
    periodType: "ytd",
    periodLabel: "2026-04 YTD",
    observationDate: "2026-04-30",
    sourceLabel: "Local PDF - Retail sector",
    sourceKey: "local_pdf_retail_2026:p2:retail_sales_value_4m2026",
    sourceType: "local_pdf_reviewed_mapping",
    publicationDate: "2026-06-09",
    pageNumber: 2,
    evidenceNotes: "Reviewed Phase 159G mapping. Source page states 4M2026 retail sales value.",
  },
  {
    id: "phase159h_metric_retail_sales_yoy_202604_ytd",
    provenanceId: "phase159h_prov_retail_sales_yoy_202604_ytd",
    industryCode: "RETAIL",
    metricCode: "RETAIL_SALES_VALUE_YOY_CURRENT_PRICE",
    metricName: "Retail goods and services sales YoY growth at current prices",
    metricLabelVi: "Tang truong doanh thu ban le hang hoa va dich vu YoY",
    metricGroup: "growth",
    value: 11.1,
    unit: "percent",
    periodType: "ytd",
    periodLabel: "2026-04 YTD",
    observationDate: "2026-04-30",
    sourceLabel: "Local PDF - Retail sector",
    sourceKey: "local_pdf_retail_2026:p2:retail_sales_yoy_4m2026",
    sourceType: "local_pdf_reviewed_mapping",
    publicationDate: "2026-06-09",
    pageNumber: 2,
    evidenceNotes: "Reviewed Phase 159G mapping. Source page states 4M2026 YoY retail sales growth.",
  },
  {
    id: "phase159h_metric_retail_sales_real_growth_202604_ytd",
    provenanceId: "phase159h_prov_retail_sales_real_growth_202604_ytd",
    industryCode: "RETAIL",
    metricCode: "RETAIL_SALES_REAL_GROWTH",
    metricName: "Retail sales real growth excluding price effects",
    metricLabelVi: "Tang truong thuc doanh thu ban le sau loai tru yeu to gia",
    metricGroup: "growth",
    value: 6.3,
    unit: "percent",
    periodType: "ytd",
    periodLabel: "2026-04 YTD",
    observationDate: "2026-04-30",
    sourceLabel: "Local PDF - Retail sector",
    sourceKey: "local_pdf_retail_2026:p2:retail_sales_real_growth_4m2026",
    sourceType: "local_pdf_reviewed_mapping",
    publicationDate: "2026-06-09",
    pageNumber: 2,
    evidenceNotes: "Reviewed Phase 159G mapping. Source page states 4M2026 real growth excluding price effects.",
  },
];

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

const countTable = async (db: PrismaClientLike, tableName: string): Promise<number> => {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `select count(*)::bigint as count from "${tableName}"`,
  );
  return Number(rows[0]?.count ?? 0);
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

const countEligibleRows = async (db: PrismaClientLike, tableName: string, sourceKeys: string[]): Promise<number> => {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `select count(*)::bigint as count from "${tableName}" where "sourceKey" = any($1)`,
    sourceKeys,
  );
  return Number(rows[0]?.count ?? 0);
};

const assertIndustryRowsExist = async (db: PrismaClientLike) => {
  const industryCodes = [...new Set(eligibleMetricRows.map((row) => row.industryCode))];
  const rows = await db.$queryRawUnsafe<Array<{ industryCode: string }>>(
    `select "industryCode" from "Industry" where "industryCode" = any($1)`,
    industryCodes,
  );
  const foundCodes = new Set(rows.map((row) => row.industryCode));
  return industryCodes.filter((industryCode) => !foundCodes.has(industryCode));
};

const writeMetricRow = async (db: PrismaClientLike, row: EligibleMetricRow) => {
  await db.$executeRaw`
    insert into "IndustryMetric" (
      "id",
      "industryCode",
      "metricCode",
      "metricName",
      "metricLabelVi",
      "metricGroup",
      "value",
      "unit",
      "periodType",
      "periodLabel",
      "observationDate",
      "sourceLabel",
      "sourceUrl",
      "sourceKey",
      "dataMode",
      "productionApproved",
      "needsReview",
      "qualityStatus",
      "missingReason",
      "warningCodes",
      "createdAt",
      "updatedAt"
    )
    values (
      ${row.id},
      ${row.industryCode},
      ${row.metricCode},
      ${row.metricName},
      ${row.metricLabelVi},
      ${row.metricGroup},
      ${row.value},
      ${row.unit},
      ${row.periodType},
      ${row.periodLabel},
      ${new Date(row.observationDate)},
      ${row.sourceLabel},
      ${null},
      ${row.sourceKey},
      ${"research_only"},
      ${false},
      ${true},
      ${"needs_review"},
      ${null},
      ${JSON.stringify(["phase159h_write_trial", "needs_review"])},
      now(),
      now()
    )
    on conflict ("industryCode", "metricCode", "observationDate", "sourceKey")
    do update set
      "metricName" = excluded."metricName",
      "metricLabelVi" = excluded."metricLabelVi",
      "metricGroup" = excluded."metricGroup",
      "value" = excluded."value",
      "unit" = excluded."unit",
      "periodType" = excluded."periodType",
      "periodLabel" = excluded."periodLabel",
      "sourceLabel" = excluded."sourceLabel",
      "dataMode" = 'research_only',
      "productionApproved" = false,
      "needsReview" = true,
      "qualityStatus" = 'needs_review',
      "warningCodes" = excluded."warningCodes",
      "updatedAt" = now()
  `;
};

const writeProvenanceRow = async (db: PrismaClientLike, row: EligibleMetricRow) => {
  await db.$executeRaw`
    insert into "IndustryMetricProvenance" (
      "id",
      "industryMetricId",
      "industryCode",
      "metricCode",
      "observationDate",
      "sourceLabel",
      "sourceUrl",
      "sourceKey",
      "sourceType",
      "publicationDate",
      "retrievedAt",
      "dataMode",
      "productionApproved",
      "needsReview",
      "payloadChecksum",
      "evidenceNotes",
      "warningCodes",
      "createdAt",
      "updatedAt"
    )
    values (
      ${row.provenanceId},
      ${row.id},
      ${row.industryCode},
      ${row.metricCode},
      ${new Date(row.observationDate)},
      ${row.sourceLabel},
      ${null},
      ${row.sourceKey},
      ${row.sourceType},
      ${new Date(row.publicationDate)},
      ${new Date()},
      ${"research_only"},
      ${false},
      ${true},
      ${null},
      ${`${row.evidenceNotes} Page ${row.pageNumber}.`},
      ${JSON.stringify(["phase159h_write_trial", "local_pdf_reviewed_mapping"])},
      now(),
      now()
    )
    on conflict ("industryMetricId", "sourceKey")
    do update set
      "sourceLabel" = excluded."sourceLabel",
      "sourceType" = excluded."sourceType",
      "publicationDate" = excluded."publicationDate",
      "retrievedAt" = excluded."retrievedAt",
      "dataMode" = 'research_only',
      "productionApproved" = false,
      "needsReview" = true,
      "evidenceNotes" = excluded."evidenceNotes",
      "warningCodes" = excluded."warningCodes",
      "updatedAt" = now()
  `;
};

async function main() {
  loadEnvFile(".env");
  const { prisma } = await import("../src/lib/database/client.js");

  const missingIndustryCodes = await assertIndustryRowsExist(prisma);
  if (missingIndustryCodes.length > 0) {
    console.log(
      JSON.stringify(
        {
          phase: PHASE,
          mode: "industry_metric_controlled_write_trial",
          auditPassed: false,
          blocked: true,
          missingIndustryCodes,
        },
        null,
        2,
      ),
    );
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  const sourceKeys = eligibleMetricRows.map((row) => row.sourceKey);
  const before = {
    industryMetricRows: await countTable(prisma, "IndustryMetric"),
    industryMetricProvenanceRows: await countTable(prisma, "IndustryMetricProvenance"),
    eligibleIndustryMetricRows: await countEligibleRows(prisma, "IndustryMetric", sourceKeys),
    eligibleIndustryMetricProvenanceRows: await countEligibleRows(
      prisma,
      "IndustryMetricProvenance",
      sourceKeys,
    ),
    productionApprovedTrueCount: await countProductionApprovedTrue(prisma),
  };

  for (const row of eligibleMetricRows) {
    await writeMetricRow(prisma, row);
    await writeProvenanceRow(prisma, row);
  }

  const after = {
    industryMetricRows: await countTable(prisma, "IndustryMetric"),
    industryMetricProvenanceRows: await countTable(prisma, "IndustryMetricProvenance"),
    eligibleIndustryMetricRows: await countEligibleRows(prisma, "IndustryMetric", sourceKeys),
    eligibleIndustryMetricProvenanceRows: await countEligibleRows(
      prisma,
      "IndustryMetricProvenance",
      sourceKeys,
    ),
    productionApprovedTrueCount: await countProductionApprovedTrue(prisma),
  };

  const result = {
    phase: PHASE,
    mode: "industry_metric_controlled_write_trial",
    dbWriteAttempted: true,
    schemaChanged: false,
    migrationCreated: false,
    providerFetchAttempted: false,
    rawSourceImportAttempted: false,
    industryMetricWriteAttempted: true,
    industryMetricProvenanceWriteAttempted: true,
    controlledRowsPlanned: eligibleMetricRows.length,
    before,
    after,
    writtenSourceKeys: sourceKeys,
    dataMode: "research_only",
    productionApproved: false,
    needsReview: true,
    benchmarkRankingScoringIntroduced: false,
    tradingOrValuationOutputIntroduced: false,
    stockAttractivenessIntroduced: false,
    readyForRealMetricImport: false,
    recommendedNextPhase: "Phase 159I - IndustryMetric Read Path Dry Run",
  };

  const auditPassed =
    result.dbWriteAttempted &&
    result.industryMetricWriteAttempted &&
    result.industryMetricProvenanceWriteAttempted &&
    !result.schemaChanged &&
    !result.migrationCreated &&
    !result.providerFetchAttempted &&
    !result.rawSourceImportAttempted &&
    result.after.eligibleIndustryMetricRows === result.controlledRowsPlanned &&
    result.after.eligibleIndustryMetricProvenanceRows === result.controlledRowsPlanned &&
    result.after.productionApprovedTrueCount === 0 &&
    !result.readyForRealMetricImport;

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
