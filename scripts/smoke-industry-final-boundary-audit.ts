import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_MAPPED_TICKERS,
  REVIEWED_PEER_GROUPS,
  REVIEWED_UNSUPPORTED_TICKERS,
} from "../src/features/industry/lib/reviewed-industry-coverage.js";
import { prisma } from "../src/lib/database/client.js";
import { industryQualitativeContextSourcePackages } from "./industry-qualitative-context-reviewed-sources.js";

const EXPECTED_REVIEWED_INDUSTRIES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const;
const EXPECTED_REVIEWED_TICKERS = ["HPG", "MWG", "VNM"] as const;
const EXPECTED_UNSUPPORTED_TICKERS = ["FPT", "VCB", "MSN"] as const;
const EXPECTED_TICKER_INDUSTRY = {
  HPG: "STEEL_MATERIALS",
  MWG: "RETAIL",
  VNM: "CONSUMER_STAPLES_DAIRY",
} as const;
const EXPECTED_STEEL_PEERS = [
  { ticker: "HSG", peerRole: "direct_peer" },
  { ticker: "NKG", peerRole: "direct_peer" },
  { ticker: "TVN", peerRole: "adjacent_peer" },
] as const;

type IndustryRuntime = Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>>;

type CompanyApiPayload = {
  data?: {
    industryContext?: IndustryRuntime;
  };
  industryContext?: IndustryRuntime;
};

const sourcePackageByIndustry = Object.fromEntries(
  industryQualitativeContextSourcePackages.map((sourcePackage) => [
    sourcePackage.industryCode,
    sourcePackage,
  ]),
) as Record<
  (typeof EXPECTED_REVIEWED_INDUSTRIES)[number],
  (typeof industryQualitativeContextSourcePackages)[number]
>;

const arraysEqual = <T extends string>(actual: readonly T[], expected: readonly T[]): boolean =>
  actual.length === expected.length && actual.every((item, index) => item === expected[index]);

const parseList = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [value];
  } catch {
    return [value];
  }
};

const sameList = (actual: string[], expected: string[]): boolean =>
  JSON.stringify(actual) === JSON.stringify(expected);

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

const readAssistantPrompt = async (ticker: string): Promise<string> => {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: `Audit final Industry boundary for ${ticker}.`,
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

const hasFullQualitativeContext = (
  runtime: IndustryRuntime,
  ticker: keyof typeof EXPECTED_TICKER_INDUSTRY,
): boolean => {
  const expectedIndustry = EXPECTED_TICKER_INDUSTRY[ticker];
  const sourcePackage = sourcePackageByIndustry[expectedIndustry];
  const context = runtime.context;

  return (
    runtime.status === "available" &&
    context !== null &&
    context.industryCode === expectedIndustry &&
    context.reviewedQualitativeContextAvailable === true &&
    context.fullQualitativeContextAvailable === true &&
    context.qualitativeContextSourceStatus === "source_backed" &&
    context.staticGuidanceUsedAsReviewedContext === false &&
    context.dataMode === "research_only" &&
    context.productionApproved === false &&
    context.needsReview === true &&
    context.industryOverview === sourcePackage.overview &&
    context.howIndustryMakesMoney === sourcePackage.howIndustryMakesMoney &&
    sameList(parseList(context.keyDrivers), sourcePackage.keyDrivers) &&
    sameList(parseList(context.industryRisks), sourcePackage.keyRisks) &&
    sameList(parseList(context.macroSensitivity), sourcePackage.macroSensitivity) &&
    sameList(parseList(context.nextChecks), sourcePackage.nextChecks) &&
    context.commonMisread === sourcePackage.commonMisread &&
    context.provenanceSummary.rowsFound > 0 &&
    context.provenanceSummary.sourceUrls.includes(sourcePackage.sourceUrl) &&
    context.caveats.some((caveat) => caveat.includes("research_only")) &&
    context.caveats.some((caveat) => caveat.includes("needsReview")) &&
    context.caveats.some((caveat) => caveat.includes("not investment advice")) &&
    context.caveats.some((caveat) => caveat.includes("not a valuation/risk benchmark")) &&
    context.caveats.some((caveat) => caveat.includes("not a peer benchmark"))
  );
};

const missingSafe = (runtime: IndustryRuntime): boolean =>
  runtime.status === "missing" &&
  runtime.context === null &&
  runtime.taxonomy.status === "missing" &&
  runtime.taxonomy.mappings.length === 0 &&
  runtime.taxonomy.peerGroupInferred === false &&
  runtime.taxonomy.industryMetricCreated === false &&
  runtime.taxonomy.valuationRiskBenchmarkInvented === false &&
  runtime.peerGroupSummary.status === "missing" &&
  runtime.peerGroupSummary.peers.length === 0 &&
  runtime.peerGroupSummary.peerGroupInferred === false;

const assistantIncludesBoundary = (prompt: string, ticker: string): boolean =>
  prompt.includes(`"ticker": "${ticker}"`) &&
  prompt.includes("Reviewed Industry coverage is currently limited") &&
  prompt.includes("not investment advice") &&
  prompt.includes("not valuation benchmarks") &&
  prompt.includes("not risk benchmarks") &&
  prompt.includes("not peer benchmarks");

const assistantIncludesFullContext = (
  prompt: string,
  ticker: keyof typeof EXPECTED_TICKER_INDUSTRY,
): boolean =>
  assistantIncludesBoundary(prompt, ticker) &&
  prompt.includes('"fullQualitativeContextAvailable": true') &&
  prompt.includes("howIndustryMakesMoney") &&
  prompt.includes("macroSensitivity") &&
  prompt.includes("nextChecks") &&
  prompt.includes("commonMisread");

const assistantKeepsMissingSafe = (prompt: string, ticker: string): boolean =>
  assistantIncludesBoundary(prompt, ticker) &&
  prompt.includes('"status": "missing"') &&
  prompt.includes("no eligible reviewed data") &&
  !prompt.includes('"fullQualitativeContextAvailable": true');

async function main() {
  const mappedTickers = Object.keys(EXPECTED_TICKER_INDUSTRY) as Array<keyof typeof EXPECTED_TICKER_INDUSTRY>;
  const [
    runtimeEntries,
    unsupportedRuntimeEntries,
    apiEntries,
    unsupportedApiEntries,
    assistantEntries,
    unsupportedAssistantEntries,
    productionApprovedTrueCount,
  ] = await Promise.all([
    Promise.all(mappedTickers.map(async (ticker) => [ticker, await loadIndustryContextRuntimeByTicker(ticker)] as const)),
    Promise.all(
      EXPECTED_UNSUPPORTED_TICKERS.map(
        async (ticker) => [ticker, await loadIndustryContextRuntimeByTicker(ticker)] as const,
      ),
    ),
    Promise.all(mappedTickers.map(async (ticker) => [ticker, await readCompanyIndustryContext(ticker)] as const)),
    Promise.all(
      EXPECTED_UNSUPPORTED_TICKERS.map(async (ticker) => [ticker, await readCompanyIndustryContext(ticker)] as const),
    ),
    Promise.all(mappedTickers.map(async (ticker) => [ticker, await readAssistantPrompt(ticker)] as const)),
    Promise.all(
      EXPECTED_UNSUPPORTED_TICKERS.map(async (ticker) => [ticker, await readAssistantPrompt(ticker)] as const),
    ),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
      prisma.industryContext.count({ where: { productionApproved: true } }),
      prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
    ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),
  ]);

  const hpgRuntime = runtimeEntries.find(([ticker]) => ticker === "HPG")?.[1];
  const mwgRuntime = runtimeEntries.find(([ticker]) => ticker === "MWG")?.[1];
  const vnmRuntime = runtimeEntries.find(([ticker]) => ticker === "VNM")?.[1];
  const hpgPeers = hpgRuntime?.peerGroupSummary.peers ?? [];
  const hpgSteelPeerGroupExactly =
    hpgRuntime?.peerGroupSummary.status === "available" &&
    hpgRuntime.peerGroupSummary.industryCode === "STEEL_MATERIALS" &&
    hpgPeers.length === EXPECTED_STEEL_PEERS.length &&
    EXPECTED_STEEL_PEERS.every((expectedPeer) =>
      hpgPeers.some((peer) => peer.ticker === expectedPeer.ticker && peer.peerRole === expectedPeer.peerRole),
    ) &&
    REVIEWED_PEER_GROUPS.STEEL_MATERIALS.length === EXPECTED_STEEL_PEERS.length &&
    EXPECTED_STEEL_PEERS.every((expectedPeer) =>
      REVIEWED_PEER_GROUPS.STEEL_MATERIALS.some(
        (peer) => peer.ticker === expectedPeer.ticker && peer.peerRole === expectedPeer.peerRole,
      ),
    ) &&
    hpgRuntime.peerGroupSummary.peerGroupUsedAsValuationBenchmark === false &&
    hpgRuntime.peerGroupSummary.peerGroupUsedAsRiskBenchmark === false;

  const mappedBoundaryChecks = runtimeEntries.map(([ticker, runtime]) => ({
    ticker,
    industryCode: runtime.context?.industryCode ?? runtime.taxonomy.taxonomySummary.industryCode,
    taxonomyAvailable: runtime.taxonomy.status === "available",
    peerGroupStatus: runtime.peerGroupSummary.status,
    fullQualitativeContextReadable: hasFullQualitativeContext(runtime, ticker),
  }));
  const unsupportedBoundaryChecks = unsupportedRuntimeEntries.map(([ticker, runtime]) => ({
    ticker,
    missingSafe: missingSafe(runtime),
  }));
  const apiBoundaryChecks = apiEntries.map(([ticker, runtime]) => ({
    ticker,
    fullQualitativeContextReadable: runtime !== null && hasFullQualitativeContext(runtime, ticker),
  }));
  const unsupportedApiBoundaryChecks = unsupportedApiEntries.map(([ticker, runtime]) => ({
    ticker,
    missingSafe: runtime === null || missingSafe(runtime),
  }));
  const assistantBoundaryChecks = assistantEntries.map(([ticker, prompt]) => ({
    ticker,
    fullContextIncluded: assistantIncludesFullContext(prompt, ticker),
  }));
  const unsupportedAssistantBoundaryChecks = unsupportedAssistantEntries.map(([ticker, prompt]) => ({
    ticker,
    missingSafeIncluded: assistantKeepsMissingSafe(prompt, ticker),
  }));

  const result = {
    phase: "151C",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    reviewedIndustryCount: REVIEWED_INDUSTRY_CODES.length,
    reviewedIndustryCodes: REVIEWED_INDUSTRY_CODES,
    reviewedIndustryCodesExactly: arraysEqual(REVIEWED_INDUSTRY_CODES, EXPECTED_REVIEWED_INDUSTRIES),
    mappedReviewedTickers: REVIEWED_MAPPED_TICKERS,
    mappedReviewedTickersExactly: arraysEqual(REVIEWED_MAPPED_TICKERS, EXPECTED_REVIEWED_TICKERS),
    unsupportedTickers: REVIEWED_UNSUPPORTED_TICKERS,
    unsupportedTickersExactly: arraysEqual(REVIEWED_UNSUPPORTED_TICKERS, EXPECTED_UNSUPPORTED_TICKERS),
    mappedBoundaryChecks,
    hpgSteelPeerGroupExactly,
    hpgPeerGroup: hpgPeers.map((peer) => ({
      ticker: peer.ticker,
      peerRole: peer.peerRole,
    })),
    mwgPeerGroupMissingSafe: mwgRuntime?.peerGroupSummary.status === "missing" && mwgRuntime.peerGroupSummary.peers.length === 0,
    vnmPeerGroupMissingSafe: vnmRuntime?.peerGroupSummary.status === "missing" && vnmRuntime.peerGroupSummary.peers.length === 0,
    unsupportedBoundaryChecks,
    apiBoundaryChecks,
    unsupportedApiBoundaryChecks,
    assistantBoundaryChecks,
    unsupportedAssistantBoundaryChecks,
    staticGuidanceTreatedAsReviewedQualitativeContext: runtimeEntries.some(
      ([, runtime]) => runtime.context?.staticGuidanceUsedAsReviewedContext !== false,
    ),
    unsupportedTickerInference: unsupportedBoundaryChecks.some((check) => !check.missingSafe),
    productionApprovedTrueCount,
    industryMetricCreated: Boolean((prisma as unknown as Record<string, unknown>).industryMetric),
    benchmarkCreated: false,
    valuationRiskBenchmarkInvented:
      runtimeEntries.some(([, runtime]) => runtime.taxonomy.valuationRiskBenchmarkInvented) ||
      hpgRuntime?.peerGroupSummary.peerGroupUsedAsValuationBenchmark !== false ||
      hpgRuntime.peerGroupSummary.peerGroupUsedAsRiskBenchmark !== false,
    retailPeerGroupCreated: mwgRuntime?.peerGroupSummary.peers.length !== 0,
    vnmPeerGroupCreated: vnmRuntime?.peerGroupSummary.peers.length !== 0,
  };

  const smokePassed =
    result.phase === "151C" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.reviewedIndustryCount === 3 &&
    result.reviewedIndustryCodesExactly &&
    result.mappedReviewedTickersExactly &&
    result.unsupportedTickersExactly &&
    result.mappedBoundaryChecks.every((check) => check.fullQualitativeContextReadable) &&
    result.hpgSteelPeerGroupExactly &&
    result.mwgPeerGroupMissingSafe &&
    result.vnmPeerGroupMissingSafe &&
    result.unsupportedBoundaryChecks.every((check) => check.missingSafe) &&
    result.apiBoundaryChecks.every((check) => check.fullQualitativeContextReadable) &&
    result.unsupportedApiBoundaryChecks.every((check) => check.missingSafe) &&
    result.assistantBoundaryChecks.every((check) => check.fullContextIncluded) &&
    result.unsupportedAssistantBoundaryChecks.every((check) => check.missingSafeIncluded) &&
    !result.staticGuidanceTreatedAsReviewedQualitativeContext &&
    !result.unsupportedTickerInference &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.benchmarkCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.retailPeerGroupCreated &&
    !result.vnmPeerGroupCreated;

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
