import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "157B";

const TARGET_INDUSTRY_CODES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const;

const TARGET_COMPANY_MAPPINGS = [
  { ticker: "HPG", industryCode: "STEEL_MATERIALS" },
  { ticker: "VNM", industryCode: "CONSUMER_STAPLES_DAIRY" },
  { ticker: "MWG", industryCode: "RETAIL" },
] as const;

const AUDIT_FILES = [
  "prisma/schema.prisma",
  "src/features/industry",
  "src/app/api",
  "src/app/workspace",
  "src/features/assistant",
  "src/lib/ai-rag",
  "src/components/layout",
] as const;

const FILES_TO_SCAN = [
  "src/features/industry/types.ts",
  "src/features/industry/index.ts",
  "src/features/industry/lib/load-industry-context.ts",
  "src/features/industry/lib/reviewed-industry-coverage.ts",
  "src/features/industry/data/industry.data.ts",
  "src/features/industry/data/industryCompass.data.ts",
  "src/features/industry/components/IndustryPage.tsx",
  "src/features/industry/components/IndustryBlocks.tsx",
  "src/features/industry/components/IndustryCompassSections.tsx",
  "src/app/workspace/page.tsx",
  "src/app/api/assistant/route.ts",
  "src/components/layout/AppShell.tsx",
  "src/components/layout/RightAssistantPanel.tsx",
  "src/components/layout/assistant-screen-context.ts",
] as const;

const forbiddenAdvicePatterns = [
  /nắm giữ/i,
  /nên mua/i,
  /nên bán/i,
  /khuyến nghị mua/i,
  /khuyến nghị bán/i,
  /target price/i,
  /giá mục tiêu/i,
  /fair value/i,
  /giá trị hợp lý/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /hấp dẫn/i,
  /đáng mua/i,
  /ngành tốt nhất/i,
  /cổ phiếu tốt nhất/i,
  /mạnh hơn/i,
  /yếu hơn/i,
];

const buySellHoldPatterns = [
  /nên mua/i,
  /nên bán/i,
  /nắm giữ/i,
  /buy recommendation/i,
  /sell recommendation/i,
  /hold recommendation/i,
];

const targetPricePatterns = [
  /target price/i,
  /giá mục tiêu/i,
  /fair value/i,
  /giá trị hợp lý/i,
  /\bupside\b/i,
  /\bdownside\b/i,
];

const stockAttractivenessPatterns = [
  /hấp dẫn/i,
  /đáng mua/i,
  /worth buying/i,
  /attractive/i,
  /promising/i,
  /cổ phiếu tốt nhất/i,
];

const benchmarkRankingScoringPatterns = [
  /\branking\b/i,
  /\bscoring\b/i,
  /benchmark score/i,
  /xếp hạng/i,
  /chấm điểm/i,
  /mạnh hơn.*(cổ phiếu|đầu tư|xếp hạng|ranking)/i,
  /yếu hơn.*(cổ phiếu|đầu tư|xếp hạng|ranking)/i,
  /score:\s*[0-9]/i,
];

const demoMockFallbackPatterns = [
  /\bmock\b/i,
  /\bdemo\b/i,
  /\bfallback\b/i,
];

const read = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of read(filePath).split(/\r?\n/)) {
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

const hasModel = (schema: string, modelName: string): boolean =>
  modelBlock(schema, modelName).length > 0;

const hasFields = (model: string, fields: string[]): boolean =>
  fields.every((field) => new RegExp(`\\b${field}\\b`).test(model));

const detect = (text: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

const listDetectedPatterns = (text: string, patterns: RegExp[]): string[] =>
  patterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source)
    .sort();

const asRecord = <T extends object>(entries: Iterable<readonly [string, T]>) =>
  Object.fromEntries(entries) as Record<string, T>;

type PrismaClientLike = typeof PrismaClientInstance;

const countProductionApprovedTrue = async (db: PrismaClientLike, tableNames: string[]) => {
  const counts = await Promise.all(
    tableNames.map(async (tableName) => {
      try {
        const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
          `select count(*)::bigint as count from "${tableName}" where "productionApproved" = true`,
        );
        return Number(result[0]?.count ?? 0);
      } catch {
        return 0;
      }
    }),
  );

  return counts.reduce((total, count) => total + count, 0);
};

const countTableRows = async (db: PrismaClientLike, tableName: string) => {
  try {
    const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
      `select count(*)::bigint as count from "${tableName}"`,
    );
    return Number(result[0]?.count ?? 0);
  } catch {
    return 0;
  }
};

const runAudit = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: typeof PrismaClientInstance;
  };

  const schema = read("prisma/schema.prisma");
  const industryModel = modelBlock(schema, "Industry");
  const companyIndustryModel = modelBlock(schema, "CompanyIndustry");
  const industryContextModel = modelBlock(schema, "IndustryContext");
  const industryProvenanceModel = modelBlock(schema, "IndustryContextProvenance");
  const industryMetricModel = modelBlock(schema, "IndustryMetric");
  const dataSourceModel = modelBlock(schema, "DataSource");

  const industryTaxonomyStorageExists =
    hasModel(schema, "Industry") &&
    hasFields(industryModel, ["industryCode", "industryName", "displayNameVi"]);
  const companyIndustryMappingStorageExists =
    hasModel(schema, "CompanyIndustry") &&
    hasFields(companyIndustryModel, ["ticker", "industryCode", "sourceLabel", "sourceUrl"]);
  const industryContextStorageExists =
    hasModel(schema, "IndustryContext") &&
    hasFields(industryContextModel, [
      "industryOverview",
      "howIndustryMakesMoney",
      "keyDrivers",
      "industryRisks",
      "macroSensitivity",
      "nextChecks",
      "commonMisread",
    ]) &&
    hasModel(schema, "IndustryContextProvenance") &&
    hasFields(industryProvenanceModel, ["sourceLabel", "sourceUrl", "extractedQuote"]);
  const industryMetricStorageExists = hasModel(schema, "IndustryMetric") && industryMetricModel.length > 0;
  const qualitativeContextSchemaMissing = !hasModel(schema, "IndustryQualitativeContext");
  const dataSourceIndustryRelationExists =
    /industry/i.test(dataSourceModel) || /sourceId\s+String/.test(industryContextModel);

  const [
    industryRows,
    companyIndustryRows,
    targetIndustryRows,
    targetCompanyIndustryRows,
    industryContextRows,
    industryContextProvenanceRows,
    industryMetricRows,
    productionApprovedTrueCount,
  ] = await Promise.all([
    countTableRows(prisma, "Industry"),
    countTableRows(prisma, "CompanyIndustry"),
    prisma.industry.findMany({
      where: { industryCode: { in: [...TARGET_INDUSTRY_CODES] } },
      select: {
        industryCode: true,
        industryName: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
      orderBy: { industryCode: "asc" },
    }),
    prisma.companyIndustry.findMany({
      where: {
        OR: TARGET_COMPANY_MAPPINGS.map((mapping) => ({
          ticker: mapping.ticker,
          industryCode: mapping.industryCode,
        })),
      },
      select: {
        ticker: true,
        industryCode: true,
        roleType: true,
        sourceLabel: true,
        sourceUrl: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
      orderBy: [{ ticker: "asc" }, { industryCode: "asc" }],
    }),
    countTableRows(prisma, "IndustryContext"),
    countTableRows(prisma, "IndustryContextProvenance"),
    industryMetricStorageExists ? countTableRows(prisma, "IndustryMetric") : Promise.resolve(0),
    countProductionApprovedTrue(prisma, [
      "Industry",
      "CompanyIndustry",
      "IndustryPeerGroup",
      "IndustryContext",
      "IndustryContextProvenance",
    ]),
  ]);

  const targetIndustryRowsFound = asRecord(
    TARGET_INDUSTRY_CODES.map((code) => [
      code,
      {
        found: targetIndustryRows.some((row) => row.industryCode === code),
        row: targetIndustryRows.find((row) => row.industryCode === code) ?? null,
      },
    ]),
  );

  const targetCompanyIndustryMappingsFound = asRecord(
    TARGET_COMPANY_MAPPINGS.map((mapping) => {
      const key = `${mapping.ticker}->${mapping.industryCode}`;
      const rows = targetCompanyIndustryRows.filter(
        (row) => row.ticker === mapping.ticker && row.industryCode === mapping.industryCode,
      );
      return [key, { found: rows.length > 0, rows }];
    }),
  );

  const sourceText = FILES_TO_SCAN.map((filePath) => read(filePath)).join("\n");
  const industryPageText = read("src/features/industry/components/IndustryPage.tsx");
  const industryPageRenderBody = industryPageText.slice(industryPageText.indexOf("return ("));
  const workspaceText = read("src/app/workspace/page.tsx");
  const appShellText = read("src/components/layout/AppShell.tsx");
  const assistantRouteText = read("src/app/api/assistant/route.ts");
  const assistantScreenContextText = read("src/components/layout/assistant-screen-context.ts");
  const loadIndustryContextText = read("src/features/industry/lib/load-industry-context.ts");
  const industryStaticDataText = [
    read("src/features/industry/data/industry.data.ts"),
    read("src/features/industry/data/industryCompass.data.ts"),
  ].join("\n");

  const industryUiExists =
    existsSync(join(process.cwd(), "src/features/industry/components/IndustryPage.tsx")) &&
    appShellText.includes("<IndustryPage");
  const industryApiExists =
    assistantRouteText.includes("industry") ||
    workspaceText.includes("loadIndustryContextRuntimeByTicker");
  const industryReadPathExists =
    loadIndustryContextText.includes("prisma.industryContext") &&
    loadIndustryContextText.includes("prisma.companyIndustry") &&
    workspaceText.includes("loadIndustryContextRuntimeByTicker");
  const assistantIndustryContextExists =
    assistantRouteText.includes("loadIndustryContextRuntimeByTicker") ||
    assistantRouteText.includes("industryContext") ||
    assistantScreenContextText.includes("industry");
  const industryPageReadsInitialRuntime =
    industryPageText.includes("initialIndustryContexts") &&
    /initialIndustryContexts[\s\S]{0,200}(context|taxonomy|mapping|selected)/i.test(
      industryPageRenderBody,
    );
  const industryPageUsesStaticCompass =
    industryPageText.includes("industryCompassData") && industryStaticDataText.includes("sourceUrl: null");
  const industryPageReadsCompanyMapping =
    industryPageText.includes("taxonomy") || industryPageText.includes("CompanyIndustry");
  const showsOnlyTaxonomyLabels =
    industryUiExists &&
    !industryPageReadsInitialRuntime &&
    industryPageUsesStaticCompass &&
    !industryPageReadsCompanyMapping;

  const demoMockFallbackIndustryContentDetected = detect(
    industryStaticDataText,
    demoMockFallbackPatterns,
  );
  const benchmarkRankingScoringDetected = detect(sourceText, benchmarkRankingScoringPatterns);
  const forbiddenAdviceDetected = detect(sourceText, forbiddenAdvicePatterns);
  const buySellHoldDetected = detect(sourceText, buySellHoldPatterns);
  const targetPriceFairValueUpsideDownsideDetected = detect(sourceText, targetPricePatterns);
  const stockAttractivenessDetected = detect(sourceText, stockAttractivenessPatterns);

  const layer1Complete =
    industryTaxonomyStorageExists &&
    TARGET_INDUSTRY_CODES.every((code) => targetIndustryRowsFound[code]?.found);
  const layer2Complete =
    layer1Complete &&
    TARGET_COMPANY_MAPPINGS.every(
      (mapping) => targetCompanyIndustryMappingsFound[`${mapping.ticker}->${mapping.industryCode}`]?.found,
    );
  const layer3Complete =
    layer2Complete &&
    industryReadPathExists &&
    industryUiExists &&
    industryPageReadsInitialRuntime &&
    !showsOnlyTaxonomyLabels;
  const layer4Complete =
    layer3Complete &&
    industryContextStorageExists &&
    industryContextRows >= TARGET_INDUSTRY_CODES.length &&
    industryContextProvenanceRows >= TARGET_INDUSTRY_CODES.length &&
    targetIndustryRows.every((row) => row.dataMode === "research_only") &&
    productionApprovedTrueCount === 0;

  const currentIndustryLayer = layer4Complete
    ? 4
    : layer3Complete
      ? 3
      : layer2Complete
        ? 2
        : layer1Complete
          ? 1
          : 0;

  const blockersToLayer4 = [
    layer1Complete ? null : "Target Industry taxonomy rows are incomplete.",
    layer2Complete ? null : "Target CompanyIndustry mappings are incomplete.",
    industryReadPathExists ? null : "Industry DB read path is missing.",
    industryUiExists ? null : "Industry UI route/page is missing.",
    industryPageReadsInitialRuntime
      ? null
      : "Industry UI receives runtime payload but does not consume it; it renders static compass data instead.",
    assistantIndustryContextExists ? null : "Assistant context does not expose Industry read-path data.",
    industryContextRows >= TARGET_INDUSTRY_CODES.length
      ? null
      : "IndustryContext qualitative rows are below target coverage.",
    industryContextProvenanceRows >= TARGET_INDUSTRY_CODES.length
      ? null
      : "IndustryContextProvenance source rows are below target coverage.",
    industryContextStorageExists ? null : "Industry qualitative context/provenance storage is incomplete.",
    productionApprovedTrueCount === 0 ? null : "Industry productionApproved rows must remain zero for this phase.",
  ].filter((reason): reason is string => Boolean(reason));

  const auditPassed =
    industryTaxonomyStorageExists &&
    companyIndustryMappingStorageExists &&
    industryContextStorageExists &&
    !industryMetricStorageExists &&
    layer1Complete &&
    layer2Complete &&
    productionApprovedTrueCount === 0;

  const result = {
    phase: PHASE,
    mode: "audit_only",
    auditedFiles: AUDIT_FILES,
    industryTaxonomyStorageExists,
    companyIndustryMappingStorageExists,
    industryContextStorageExists,
    industryMetricStorageExists,
    qualitativeContextSchemaMissing,
    dataSourceIndustryRelationExists,
    dbCounts: {
      industryRows,
      companyIndustryRows,
      industryContextRows,
      industryContextProvenanceRows,
      industryMetricRows,
    },
    targetIndustryRowsFound,
    targetCompanyIndustryMappingsFound,
    industryUiExists,
    industryApiExists,
    industryReadPathExists,
    assistantIndustryContextExists,
    industryPageReadsInitialRuntime,
    industryPageReadsCompanyIndustryMapping: industryPageReadsCompanyMapping,
    showsOnlyTaxonomyLabels,
    demoMockFallbackIndustryContentDetected,
    benchmarkRankingScoringDetected,
    forbiddenAdviceDetected,
    buySellHoldDetected,
    targetPriceFairValueUpsideDownsideDetected,
    stockAttractivenessDetected,
    detectedGuardrailPatterns: {
      forbiddenAdvice: listDetectedPatterns(sourceText, forbiddenAdvicePatterns),
      buySellHold: listDetectedPatterns(sourceText, buySellHoldPatterns),
      targetPriceFairValueUpsideDownside: listDetectedPatterns(sourceText, targetPricePatterns),
      stockAttractiveness: listDetectedPatterns(sourceText, stockAttractivenessPatterns),
      benchmarkRankingScoring: listDetectedPatterns(sourceText, benchmarkRankingScoringPatterns),
      demoMockFallbackIndustryContent: listDetectedPatterns(
        industryStaticDataText,
        demoMockFallbackPatterns,
      ),
    },
    productionApprovedTrueCount,
    layer1Complete,
    layer2Complete,
    layer3Complete,
    layer4Complete,
    currentIndustryLayer,
    blockersToLayer4,
    recommendedNextPhase:
      currentIndustryLayer <= 2
        ? "Phase 157C - Industry Read-Path And UI Wiring Audit/Fix"
        : currentIndustryLayer === 3
          ? "Phase 157C - Industry Layer 4 Qualitative Context Dry Run"
          : "Phase 157C - IndustryContext Schema Design Dry Run",
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    auditPassed,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!auditPassed) {
    process.exitCode = 1;
  }

  return result;
};

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  let db: PrismaClientLike | null = null;
  runAudit()
    .then(async () => {
      const databaseModule = (await import("../src/lib/database/client.js")) as {
        prisma: PrismaClientLike;
      };
      db = databaseModule.prisma;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db?.$disconnect();
    });
}

export { runAudit };
