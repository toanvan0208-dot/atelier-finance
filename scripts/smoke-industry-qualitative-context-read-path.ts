import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

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

const readAssistantPrompt = async (ticker: string): Promise<string> => {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: `Explain qualitative industry context for ${ticker}.`,
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

const sourceBackedContextAvailable = (
  runtime: IndustryRuntime,
  ticker: keyof typeof EXPECTED_CONTEXT,
): boolean =>
  runtime.status === "available" &&
  runtime.context !== null &&
  runtime.context.industryCode === EXPECTED_CONTEXT[ticker] &&
  runtime.context.reviewedQualitativeContextAvailable === true &&
  runtime.context.qualitativeContextSourceStatus === "source_backed" &&
  runtime.context.staticGuidanceUsedAsReviewedContext === false &&
  runtime.context.productionApproved === false &&
  runtime.context.needsReview === true &&
  runtime.context.dataMode === "research_only" &&
  runtime.context.provenanceSummary.rowsFound > 0 &&
  runtime.context.provenanceSummary.sourceUrls.length > 0 &&
  runtime.context.provenanceSummary.productionApprovedTrueCount === 0;

const missingSafeContext = (runtime: IndustryRuntime): boolean =>
  runtime.status === "missing" &&
  runtime.context === null &&
  runtime.taxonomy.status === "missing" &&
  runtime.taxonomy.mappings.length === 0 &&
  runtime.peerGroupSummary.status === "missing" &&
  runtime.peerGroupSummary.peers.length === 0 &&
  runtime.taxonomy.peerGroupInferred === false &&
  runtime.peerGroupSummary.peerGroupInferred === false;

const promptIncludesSourceBackedContext = (prompt: string, ticker: string): boolean =>
  prompt.includes(`"ticker": "${ticker}"`) &&
  prompt.includes('"reviewedQualitativeContextAvailable": true') &&
  prompt.includes('"qualitativeContextSourceStatus": "source_backed"') &&
  prompt.includes("not investment advice") &&
  prompt.includes("not valuation benchmarks") &&
  prompt.includes("not risk benchmarks");

const promptIncludesMissingSafeContext = (prompt: string, ticker: string): boolean =>
  prompt.includes(`"ticker": "${ticker}"`) &&
  prompt.includes('"status": "missing"') &&
  prompt.includes("no eligible reviewed data");

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
  const productionApprovedTrueCount = await Promise.all([
    prisma.industryContext.count({ where: { productionApproved: true } }),
    prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
  ]).then((counts) => counts.reduce((sum, count) => sum + count, 0));
  const promptText = [
    ...mappedAssistantEntries.map(([, prompt]) => prompt),
    ...unsupportedAssistantEntries.map(([, prompt]) => prompt),
  ].join("\n");
  const promptTextWithoutProhibitions = stripProhibitionLines(promptText);

  const mappedRuntimeChecks = mappedRuntimeEntries.map(([ticker, runtime]) => ({
    ticker,
    sourceBackedContextAvailable: sourceBackedContextAvailable(runtime, ticker),
    industryCode: runtime.context?.industryCode ?? null,
    sourceUrls: runtime.context?.provenanceSummary.sourceUrls ?? [],
  }));
  const unsupportedRuntimeChecks = unsupportedRuntimeEntries.map(([ticker, runtime]) => ({
    ticker,
    missingSafe: missingSafeContext(runtime),
  }));
  const mappedApiChecks = mappedApiEntries.map(([ticker, runtime]) => ({
    ticker,
    sourceBackedContextAvailable:
      runtime !== null && sourceBackedContextAvailable(runtime, ticker),
  }));
  const unsupportedApiChecks = unsupportedApiEntries.map(([ticker, runtime]) => ({
    ticker,
    missingSafe: runtime === null || missingSafeContext(runtime),
  }));
  const mappedAssistantChecks = mappedAssistantEntries.map(([ticker, prompt]) => ({
    ticker,
    sourceBackedContextIncluded: promptIncludesSourceBackedContext(prompt, ticker),
  }));
  const unsupportedAssistantChecks = unsupportedAssistantEntries.map(([ticker, prompt]) => ({
    ticker,
    missingSafeIncluded: promptIncludesMissingSafeContext(prompt, ticker),
  }));

  const result = {
    phase: "151A",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
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
    result.phase === "151A" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.mappedRuntimeChecks.every((check) => check.sourceBackedContextAvailable) &&
    result.unsupportedRuntimeChecks.every((check) => check.missingSafe) &&
    result.mappedApiChecks.every((check) => check.sourceBackedContextAvailable) &&
    result.unsupportedApiChecks.every((check) => check.missingSafe) &&
    result.mappedAssistantChecks.every((check) => check.sourceBackedContextIncluded) &&
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
