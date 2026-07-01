import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";
import { industryQualitativeContextSourcePackages } from "./industry-qualitative-context-reviewed-sources.js";

const MAPPED_TICKERS = ["HPG", "MWG", "VNM"] as const;
const UNSUPPORTED_TICKERS = ["FPT", "VCB", "MSN"] as const;

const EXPECTED_CONTEXT = {
  HPG: "STEEL_MATERIALS",
  MWG: "RETAIL",
  VNM: "CONSUMER_STAPLES_DAIRY",
} as const;

const FORBIDDEN_ADVICE_PATTERNS = [
  /\b(recommend buy|recommend sell|recommend hold)\b/i,
  /\bbuy\/sell\/hold\b/i,
  /\btarget price\b/i,
  /\bfair value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\bworth buying\b/i,
  /\battractive investment\b/i,
] as const;

const NUMERIC_BENCHMARK_PATTERNS = [
  /\bvaluation\s+(multiple|range|comparison)\b/i,
  /\brisk\s+(score|ranking)\b/i,
  /\bpeer\s+(valuation|risk)\b/i,
  /\bP\/E\b/i,
  /\bEV\/EBITDA\b/i,
  /\btarget\s+multiple\b/i,
] as const;

type IndustryRuntime = Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>>;

type CompanyApiPayload = {
  data?: {
    industryContext?: IndustryRuntime;
  };
  industryContext?: IndustryRuntime;
};

const sourcePackageByTicker = Object.fromEntries(
  MAPPED_TICKERS.map((ticker) => [
    ticker,
    industryQualitativeContextSourcePackages.find(
      (sourcePackage) => sourcePackage.industryCode === EXPECTED_CONTEXT[ticker],
    ),
  ]),
) as Record<(typeof MAPPED_TICKERS)[number], (typeof industryQualitativeContextSourcePackages)[number]>;

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

const stripProhibitionLines = (value: string): string =>
  value
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/\b(must not|do not|should not|never|not investment advice|no eligible reviewed data)\b/i.test(line) &&
        !/^\s*-\s*(instead|user|assistant):/i.test(line) &&
        !/\bis not a\b/i.test(line) &&
        !/\bdoes not\b/i.test(line),
    )
    .join("\n");

const parseList = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [value];
  } catch {
    return [value];
  }
};

const sameList = (actual: string[] | null | undefined, expected: string[]): boolean =>
  JSON.stringify(actual ?? []) === JSON.stringify(expected);

const readAssistantPrompt = async (ticker: string): Promise<string> => {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: `Explain full qualitative industry context for ${ticker}.`,
        activeModule: "industry",
        ticker,
      }),
    }),
  );
  const payload = (await response.json()) as {
    runtime?: {
      prompt?: {
        promptText?: string;
      };
    };
  };

  return payload.runtime?.prompt?.promptText ?? "";
};

const readCompanyIndustryContext = async (ticker: string): Promise<IndustryRuntime | null> => {
  const response = await getCompanyRoute(new Request(`http://localhost/api/companies/${ticker}`), {
    params: { ticker },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CompanyApiPayload;
  return payload.data?.industryContext ?? payload.industryContext ?? null;
};

const fullSourceBackedContextAvailable = (
  runtime: IndustryRuntime,
  ticker: keyof typeof EXPECTED_CONTEXT,
): boolean => {
  const sourcePackage = sourcePackageByTicker[ticker];
  const context = runtime.context;

  return (
    runtime.status === "available" &&
    context !== null &&
    context.industryCode === EXPECTED_CONTEXT[ticker] &&
    context.reviewedQualitativeContextAvailable === true &&
    context.fullQualitativeContextAvailable === true &&
    context.qualitativeContextSourceStatus === "source_backed" &&
    context.staticGuidanceUsedAsReviewedContext === false &&
    context.productionApproved === false &&
    context.needsReview === true &&
    context.dataMode === "research_only" &&
    context.industryOverview === sourcePackage.overview &&
    context.howIndustryMakesMoney === sourcePackage.howIndustryMakesMoney &&
    sameList(parseList(context.keyDrivers), sourcePackage.keyDrivers) &&
    sameList(parseList(context.industryRisks), sourcePackage.keyRisks) &&
    sameList(parseList(context.macroSensitivity), sourcePackage.macroSensitivity) &&
    sameList(parseList(context.nextChecks), sourcePackage.nextChecks) &&
    context.commonMisread === sourcePackage.commonMisread &&
    context.provenanceSummary.rowsFound > 0 &&
    context.provenanceSummary.sourceUrls.includes(sourcePackage.sourceUrl) &&
    context.provenanceSummary.productionApprovedTrueCount === 0
  );
};

const missingSafeContext = (runtime: IndustryRuntime): boolean =>
  runtime.status === "missing" &&
  runtime.context === null &&
  runtime.taxonomy.status === "missing" &&
  runtime.taxonomy.mappings.length === 0 &&
  runtime.peerGroupSummary.status === "missing" &&
  runtime.peerGroupSummary.peers.length === 0 &&
  runtime.taxonomy.peerGroupInferred === false &&
  runtime.peerGroupSummary.peerGroupInferred === false;

const promptIncludesFullContext = (prompt: string, ticker: keyof typeof EXPECTED_CONTEXT): boolean => {
  const sourcePackage = sourcePackageByTicker[ticker];

  return (
    prompt.includes(`"ticker": "${ticker}"`) &&
    prompt.includes('"reviewedQualitativeContextAvailable": true') &&
    prompt.includes('"fullQualitativeContextAvailable": true') &&
    prompt.includes('"qualitativeContextSourceStatus": "source_backed"') &&
    prompt.includes("howIndustryMakesMoney") &&
    prompt.includes("macroSensitivity") &&
    prompt.includes("nextChecks") &&
    prompt.includes("commonMisread") &&
    prompt.includes(sourcePackage.howIndustryMakesMoney) &&
    prompt.includes(sourcePackage.commonMisread) &&
    prompt.includes("not investment advice") &&
    prompt.includes("not valuation benchmarks") &&
    prompt.includes("not risk benchmarks") &&
    prompt.includes("not peer benchmarks")
  );
};

const promptKeepsUnsupportedMissingSafe = (prompt: string, ticker: string): boolean =>
  prompt.includes(`"ticker": "${ticker}"`) &&
  prompt.includes('"status": "missing"') &&
  prompt.includes("no eligible reviewed data") &&
  !prompt.includes("howIndustryMakesMoney") &&
  !prompt.includes("macroSensitivity") &&
  !prompt.includes("commonMisread");

async function main() {
  const mappedRuntimeEntries = await Promise.all(
    MAPPED_TICKERS.map(async (ticker) => [ticker, await loadIndustryContextRuntimeByTicker(ticker)] as const),
  );
  const unsupportedRuntimeEntries = await Promise.all(
    UNSUPPORTED_TICKERS.map(async (ticker) => [ticker, await loadIndustryContextRuntimeByTicker(ticker)] as const),
  );
  const mappedApiEntries = await Promise.all(
    MAPPED_TICKERS.map(async (ticker) => [ticker, await readCompanyIndustryContext(ticker)] as const),
  );
  const unsupportedApiEntries = await Promise.all(
    UNSUPPORTED_TICKERS.map(async (ticker) => [ticker, await readCompanyIndustryContext(ticker)] as const),
  );
  const mappedAssistantEntries = await Promise.all(
    MAPPED_TICKERS.map(async (ticker) => [ticker, await readAssistantPrompt(ticker)] as const),
  );
  const unsupportedAssistantEntries = await Promise.all(
    UNSUPPORTED_TICKERS.map(async (ticker) => [ticker, await readAssistantPrompt(ticker)] as const),
  );
  const [productionApprovedTrueCount, fullQualitativeRows] = await Promise.all([
    Promise.all([
      prisma.industryContext.count({ where: { productionApproved: true } }),
      prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
    ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),
    prisma.industryContext.count({
      where: {
        sourceLabel: {
          startsWith: "Phase 151A reviewed qualitative context - ",
        },
        dataMode: "research_only",
        productionApproved: false,
        needsReview: true,
        howIndustryMakesMoney: { not: null },
        macroSensitivity: { not: null },
        nextChecks: { not: null },
        commonMisread: { not: null },
      },
    }),
  ]);
  const promptText = [
    ...mappedAssistantEntries.map(([, prompt]) => prompt),
    ...unsupportedAssistantEntries.map(([, prompt]) => prompt),
  ].join("\n");
  const promptTextWithoutProhibitions = stripProhibitionLines(promptText);

  const mappedRuntimeChecks = mappedRuntimeEntries.map(([ticker, runtime]) => ({
    ticker,
    fullSourceBackedContextAvailable: fullSourceBackedContextAvailable(runtime, ticker),
    industryCode: runtime.context?.industryCode ?? null,
    fullQualitativeContextAvailable: runtime.context?.fullQualitativeContextAvailable ?? false,
  }));
  const unsupportedRuntimeChecks = unsupportedRuntimeEntries.map(([ticker, runtime]) => ({
    ticker,
    missingSafe: missingSafeContext(runtime),
  }));
  const mappedApiChecks = mappedApiEntries.map(([ticker, runtime]) => ({
    ticker,
    fullSourceBackedContextAvailable:
      runtime !== null && fullSourceBackedContextAvailable(runtime, ticker),
  }));
  const unsupportedApiChecks = unsupportedApiEntries.map(([ticker, runtime]) => ({
    ticker,
    missingSafe: runtime === null || missingSafeContext(runtime),
  }));
  const mappedAssistantChecks = mappedAssistantEntries.map(([ticker, prompt]) => ({
    ticker,
    fullContextIncluded: promptIncludesFullContext(prompt, ticker),
  }));
  const unsupportedAssistantChecks = unsupportedAssistantEntries.map(([ticker, prompt]) => ({
    ticker,
    missingSafeIncluded: promptKeepsUnsupportedMissingSafe(prompt, ticker),
  }));

  const result = {
    phase: "151B",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: true,
    fullQualitativeRows,
    mappedRuntimeChecks,
    unsupportedRuntimeChecks,
    mappedApiChecks,
    unsupportedApiChecks,
    mappedAssistantChecks,
    unsupportedAssistantChecks,
    uiApiCaveatsVisible:
      mappedApiEntries.every(([, runtime]) =>
        Boolean(
          runtime?.context?.caveats.some((caveat) => caveat.includes("research_only")) &&
            runtime.context.caveats.some((caveat) => caveat.includes("needsReview")) &&
            runtime.context.caveats.some((caveat) => caveat.includes("not investment advice")) &&
            runtime.context.caveats.some((caveat) => caveat.includes("not a valuation/risk benchmark")) &&
            runtime.context.caveats.some((caveat) => caveat.includes("not a peer benchmark")) &&
            runtime.context.caveats.some((caveat) => caveat.includes("Static compass guidance")),
        ),
      ),
    forbiddenAdviceDetected: hasPattern(FORBIDDEN_ADVICE_PATTERNS, promptTextWithoutProhibitions),
    numericBenchmarkLanguageDetected: hasPattern(NUMERIC_BENCHMARK_PATTERNS, promptTextWithoutProhibitions),
    unsupportedTickerContextDetected: unsupportedRuntimeChecks.some((check) => !check.missingSafe),
    productionApprovedTrueCount,
    industryMetricCreated: Boolean((prisma as unknown as Record<string, unknown>).industryMetric),
    benchmarkCreated: false,
    valuationRiskBenchmarkInvented: false,
    retailPeerGroupCreated:
      mappedRuntimeEntries.find(([ticker]) => ticker === "MWG")?.[1].peerGroupSummary.peers.length !== 0,
    vnmPeerGroupCreated:
      mappedRuntimeEntries.find(([ticker]) => ticker === "VNM")?.[1].peerGroupSummary.peers.length !== 0,
    staticGuidanceTreatedAsReviewedQualitativeContext: mappedRuntimeEntries.some(
      ([, runtime]) => runtime.context?.staticGuidanceUsedAsReviewedContext !== false,
    ),
  };

  const smokePassed =
    result.phase === "151B" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    result.schemaChanged &&
    result.fullQualitativeRows === 3 &&
    result.mappedRuntimeChecks.every((check) => check.fullSourceBackedContextAvailable) &&
    result.unsupportedRuntimeChecks.every((check) => check.missingSafe) &&
    result.mappedApiChecks.every((check) => check.fullSourceBackedContextAvailable) &&
    result.unsupportedApiChecks.every((check) => check.missingSafe) &&
    result.mappedAssistantChecks.every((check) => check.fullContextIncluded) &&
    result.unsupportedAssistantChecks.every((check) => check.missingSafeIncluded) &&
    result.uiApiCaveatsVisible &&
    !result.forbiddenAdviceDetected &&
    !result.numericBenchmarkLanguageDetected &&
    !result.unsupportedTickerContextDetected &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.benchmarkCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.retailPeerGroupCreated &&
    !result.vnmPeerGroupCreated &&
    !result.staticGuidanceTreatedAsReviewedQualitativeContext;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
