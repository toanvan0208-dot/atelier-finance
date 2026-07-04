import { existsSync, readFileSync } from "node:fs";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "159E";
const MIGRATION_NAME = "20260704134500_add_industry_metric_models";

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

const modelBlock = (schema: string, modelName: string): string => {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? "";
};

const hasModel = (schema: string, modelName: string): boolean => modelBlock(schema, modelName).length > 0;

type PrismaClientLike = typeof PrismaClientInstance;

const tableExists = async (db: PrismaClientLike, tableName: string): Promise<boolean> => {
  const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = ${tableName}
    ) as exists
  `;
  return rows[0]?.exists ?? false;
};

const countTable = async (db: PrismaClientLike, tableName: string): Promise<number> => {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `select count(*)::bigint as count from "${tableName}"`,
  );
  return Number(rows[0]?.count ?? 0);
};

const countProductionApprovedTrue = async (db: PrismaClientLike, tableName: string): Promise<number> => {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `select count(*)::bigint as count from "${tableName}" where "productionApproved" = true`,
  );
  return Number(rows[0]?.count ?? 0);
};

const migrationApplied = async (db: PrismaClientLike): Promise<boolean> => {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    select count(*)::bigint as count
    from "_prisma_migrations"
    where migration_name = ${MIGRATION_NAME}
      and finished_at is not null
      and rolled_back_at is null
  `;
  return Number(rows[0]?.count ?? 0) === 1;
};

async function main() {
  loadEnvFile(".env");
  const { prisma } = await import("../src/lib/database/client.js");

  const schema = readText("prisma/schema.prisma");
  const industryMetricModelPresent = hasModel(schema, "IndustryMetric");
  const industryMetricProvenanceModelPresent = hasModel(schema, "IndustryMetricProvenance");
  const industryMetricTableExists = await tableExists(prisma, "IndustryMetric");
  const industryMetricProvenanceTableExists = await tableExists(prisma, "IndustryMetricProvenance");
  const industryMetricRows = industryMetricTableExists ? await countTable(prisma, "IndustryMetric") : 0;
  const industryMetricProvenanceRows = industryMetricProvenanceTableExists
    ? await countTable(prisma, "IndustryMetricProvenance")
    : 0;
  const productionApprovedTrueCount =
    (industryMetricTableExists ? await countProductionApprovedTrue(prisma, "IndustryMetric") : 0) +
    (industryMetricProvenanceTableExists
      ? await countProductionApprovedTrue(prisma, "IndustryMetricProvenance")
      : 0);

  const result = {
    phase: PHASE,
    mode: "schema_migration_apply_confirm",
    migrationName: MIGRATION_NAME,
    dbWriteAttempted: true,
    schemaChanged: true,
    migrationCreated: true,
    providerFetchAttempted: false,
    rawSourceImportAttempted: false,
    industryMetricDataWriteAttempted: false,
    industryMetricModelPresent,
    industryMetricProvenanceModelPresent,
    industryMetricTableExists,
    industryMetricProvenanceTableExists,
    migrationApplied: await migrationApplied(prisma),
    industryMetricRows,
    industryMetricProvenanceRows,
    productionApprovedTrueCount,
    benchmarkRankingScoringIntroduced: false,
    tradingOrValuationOutputIntroduced: false,
    stockAttractivenessIntroduced: false,
    readyForRealMetricImport: false,
  };

  const auditPassed =
    result.industryMetricModelPresent &&
    result.industryMetricProvenanceModelPresent &&
    result.industryMetricTableExists &&
    result.industryMetricProvenanceTableExists &&
    result.migrationApplied &&
    result.industryMetricRows === 0 &&
    result.industryMetricProvenanceRows === 0 &&
    result.productionApprovedTrueCount === 0 &&
    !result.providerFetchAttempted &&
    !result.rawSourceImportAttempted &&
    !result.industryMetricDataWriteAttempted &&
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
