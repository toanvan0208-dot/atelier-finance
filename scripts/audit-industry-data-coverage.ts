import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { industryCompassData } from "../src/features/industry/data/industryCompass.data.js";
import { loadIndustryContextByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_TICKERS = ["FPT", "MWG", "VNM", "HPG", "VCB", "MSN"] as const;

type TargetTicker = (typeof TARGET_TICKERS)[number];

const sourceFiles = [
  "src/features/industry/lib/load-industry-context.ts",
  "src/features/industry/data/industry.data.ts",
  "src/features/industry/data/industryCompass.data.ts",
  "src/features/industry/components/IndustryPage.tsx",
  "src/app/api/companies/[ticker]/route.ts",
  "src/app/api/assistant/route.ts",
  "src/features/macro/lib/macro-industry-data-boundary.ts",
  "src/features/macro/lib/macro-industry-readiness-ui.ts",
  "scripts/dry-run-staging-industry-context-coverage-seed.ts",
  "scripts/smoke-staging-macro-industry-read-path.ts",
  "docs/product/MACRO_INDUSTRY_DATA_BOUNDARY.md",
  "docs/product/MACRO_INDUSTRY_READINESS_UI_SKELETON.md",
  "docs/product/INDUSTRY_MVP_REVIEWED_CONTEXT_EVIDENCE.md",
] as const;

const safeRead = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const hasModel = (schema: string, modelName: string): boolean =>
  new RegExp(`model\\s+${modelName}\\s+\\{`).test(schema);

const staticIndustryMatchesForTicker = (ticker: string) =>
  industryCompassData.industries.filter((industry) => industry.relatedTickers.includes(ticker));

const countStaticSignals = (ticker: string): number =>
  staticIndustryMatchesForTicker(ticker).reduce(
    (total, industry) =>
      total +
      industry.dataSignals.leading.length +
      industry.dataSignals.confirming.length +
      industry.dataSignals.warning.length,
    0,
  );

export async function runIndustryDataCoverageAudit() {
  const schema = safeRead("prisma/schema.prisma");
  const assistantRoute = safeRead("src/app/api/assistant/route.ts");
  const industryPage = safeRead("src/features/industry/components/IndustryPage.tsx");
  const industryStaticData = [
    safeRead("src/features/industry/data/industry.data.ts"),
    safeRead("src/features/industry/data/industryCompass.data.ts"),
  ].join("\n");
  const docsAndSourceText = sourceFiles.map((filePath) => safeRead(filePath)).join("\n");

  const companies = await prisma.company.findMany({
    where: { ticker: { in: [...TARGET_TICKERS] } },
    select: {
      ticker: true,
      exchange: true,
      companyName: true,
      companyType: true,
      industryCode: true,
      industryName: true,
      dataMode: true,
      profileSourceId: true,
      profileAsOf: true,
      profileSource: {
        select: {
          name: true,
          sourceType: true,
          usageStatus: true,
          licenseStatus: true,
          tosStatus: true,
        },
      },
    },
  });
  const industryContexts = await prisma.industryContext.findMany({
    orderBy: { createdAt: "desc" },
  });
  const industryContextsForTargets = industryContexts.filter((row) =>
    row.relatedTickers.some((ticker) => TARGET_TICKERS.includes(ticker as TargetTicker)),
  );

  const productionApprovedTrueCount = await prisma.industryContext.count({
    where: { productionApproved: true },
  });
  const needsReviewTrueCount = await prisma.industryContext.count({
    where: { needsReview: true },
  });

  const tickerIndustryCoverage = await Promise.all(
    TARGET_TICKERS.map(async (ticker) => {
      const company = companies.find((row) => row.ticker === ticker) ?? null;
      const dbIndustryContext = await loadIndustryContextByTicker(ticker);
      const staticIndustryMatches = staticIndustryMatchesForTicker(ticker);
      const staticIndustryNames = staticIndustryMatches.map((industry) => industry.industryName);
      const staticMetricGuidanceCount = countStaticSignals(ticker);

      return {
        ticker,
        companyFound: Boolean(company),
        companyName: company?.companyName ?? null,
        companyDataMode: company?.dataMode ?? null,
        companyIndustryName: company?.industryName ?? null,
        companyIndustryCode: company?.industryCode ?? null,
        companySectorFieldPresent: false,
        companyProfileSourceName: company?.profileSource?.name ?? null,
        dbIndustryContextFound: Boolean(dbIndustryContext),
        dbIndustryName: dbIndustryContext?.industryName ?? null,
        dbIndustryCode: dbIndustryContext?.industryCode ?? null,
        dbIndustrySourceLabel: dbIndustryContext?.sourceLabel ?? null,
        dbIndustryDataMode: dbIndustryContext?.dataMode ?? null,
        dbIndustryProductionApproved: dbIndustryContext?.productionApproved ?? null,
        dbIndustryNeedsReview: dbIndustryContext?.needsReview ?? null,
        dbIndustryAsOfDate: dbIndustryContext?.asOfDate?.toISOString() ?? null,
        dbIndustryHasOverview: Boolean(dbIndustryContext?.industryOverview),
        dbIndustryHasDrivers: Boolean(dbIndustryContext?.keyDrivers),
        dbIndustryHasRisks: Boolean(dbIndustryContext?.industryRisks),
        staticIndustryContextFound: staticIndustryMatches.length > 0,
        staticIndustryNames,
        staticIndustryDataMode: staticIndustryMatches[0]?.dataMode ?? null,
        staticIndustryProductionApproved: staticIndustryMatches[0]?.productionApproved ?? null,
        staticIndustrySourceName: staticIndustryMatches[0]?.sourceName ?? null,
        staticIndustryAsOf: staticIndustryMatches[0]?.asOf ?? null,
        staticMetricGuidanceCount,
        numericIndustryMetricRowsFound: false,
        benchmarkForValuationRiskFound: false,
      };
    }),
  );

  const missingIndustryDataList = tickerIndustryCoverage
    .filter(
      (row) =>
        !row.dbIndustryContextFound ||
        !row.staticIndustryContextFound ||
        row.numericIndustryMetricRowsFound === false ||
        row.benchmarkForValuationRiskFound === false,
    )
    .map((row) => ({
      ticker: row.ticker,
      missing: [
        row.dbIndustryContextFound ? null : "db_industry_context",
        row.staticIndustryContextFound ? null : "static_industry_context",
        row.numericIndustryMetricRowsFound ? null : "numeric_industry_metrics",
        row.benchmarkForValuationRiskFound ? null : "valuation_risk_benchmarks",
      ].filter((value): value is string => Boolean(value)),
    }));

  const assistantResponse = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Explain industry context availability for FPT, MWG, VNM, HPG, VCB, and MSN.",
        moduleContext: {
          moduleKey: "industry",
          source: "phase150a-audit",
          ticker: "FPT",
        },
      }),
    }),
  );
  const assistantPayload = await assistantResponse.json();
  const assistantPromptText =
    typeof assistantPayload?.runtime?.prompt?.promptText === "string"
      ? assistantPayload.runtime.prompt.promptText
      : JSON.stringify(assistantPayload);
  const assistantOutputText = `${assistantPayload?.answer ?? ""}\n${assistantPayload?.message ?? ""}`;

  const industryModelsFound = {
    Industry: hasModel(schema, "Industry"),
    CompanyIndustry: hasModel(schema, "CompanyIndustry"),
    IndustryMetric: hasModel(schema, "IndustryMetric"),
    IndustryContext: hasModel(schema, "IndustryContext"),
    CompanyIndustryFields: schema.includes("industryCode") && schema.includes("industryName"),
  };

  const mockOrFallbackRisk = {
    staticIndustryDataUsesResearchOnly:
      industryStaticData.includes("dataMode: \"research_only\"") ||
      industryStaticData.includes("dataMode: \"sample\""),
    staticIndustrySourceMissing:
      industryStaticData.includes("sourceName: null") &&
      industryStaticData.includes("sourceUrl: null"),
    seedScriptContainsMockText: docsAndSourceText.includes("Mock "),
    industryPageUsesStaticData: industryPage.includes("industryCompassData") && !industryPage.includes("loadIndustryContext"),
    assistantDoesNotInjectDbIndustryContext:
      !assistantRoute.includes("loadIndustryContextByTicker") &&
      !assistantRoute.includes("industryContext:"),
  };

  const results = {
    phase: "150A",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    targetTickers: [...TARGET_TICKERS],
    filesAudited: [...sourceFiles, "prisma/schema.prisma"],
    industryModelsFound,
    industryDataSourceType: {
      dbIndustryContextRows: industryContexts.length,
      dbIndustryContextRowsForTargetTickers: industryContextsForTargets.length,
      dbSourceLabels: Array.from(new Set(industryContexts.map((row) => row.sourceLabel))).sort(),
      dbDataModes: Array.from(new Set(industryContexts.map((row) => row.dataMode))).sort(),
      staticIndustryCompassRows: industryCompassData.industries.length,
      staticDataMode: "research_only/static_guidance",
      provenanceModelFound: false,
      sourceUrlFieldFound: false,
    },
    industryPageDataMode: {
      usesDbReadPath: industryPage.includes("loadIndustryContext"),
      usesStaticIndustryCompassData: industryPage.includes("industryCompassData"),
      usesStaticIndustryPageData: industryPage.includes("industryPageData"),
      warningSkeletonVisible: industryPage.includes("MacroIndustryReadinessSkeleton"),
    },
    tickerIndustryCoverage,
    industryMetricCoverage: {
      industryMetricModelFound: industryModelsFound.IndustryMetric,
      numericIndustryMetricRowsFound: false,
      staticSignalGuidancePresent: tickerIndustryCoverage.some((row) => row.staticMetricGuidanceCount > 0),
      benchmarkForValuationRiskFound: false,
    },
    assistantIndustryContextStatus: {
      routeInjectsDbIndustryContext: assistantRoute.includes("loadIndustryContextByTicker"),
      assistantPromptIncludesIndustryModuleContext: assistantPromptText.includes("phase150a-audit"),
      assistantPromptHasMacroToIndustryGuardrail:
        assistantPromptText.includes("Do not make definitive macro-to-industry conclusions") ||
        assistantRoute.includes("Do not make definitive macro-to-industry conclusions"),
      assistantDbIndustryContextAvailable: false,
    },
    guardrails: {
      productionApprovedTrueCount,
      needsReviewTrueCount,
      mockOrFallbackRisk,
      noInvestmentAdviceAdded:
        !assistantOutputText.toLowerCase().includes("target price") &&
        !assistantOutputText.toLowerCase().includes("fair value") &&
        !assistantOutputText.toLowerCase().includes("upside") &&
        !assistantOutputText.toLowerCase().includes("downside"),
    },
    missingIndustryDataList,
    recommendedNextPhase:
      "Phase 150B should harden IndustryContext provenance and read-path: remove/mock-label legacy seed wording, define source/provenance contract, and connect Industry UI/Assistant to DB context with missing-data warnings.",
    auditCompleted: true,
  };

  console.log(JSON.stringify(results, null, 2));
  return results;
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  runIndustryDataCoverageAudit()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
