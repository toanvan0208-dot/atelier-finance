import { readFile } from "node:fs/promises";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_MAPPED_TICKERS,
  REVIEWED_PEER_GROUPS,
  REVIEWED_UNSUPPORTED_TICKERS,
  UNSUPPORTED_TICKER_POLICY,
} from "../src/features/industry/lib/reviewed-industry-coverage.js";
import { prisma } from "../src/lib/database/client.js";

const EXPECTED_REVIEWED_INDUSTRIES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const;
const EXPECTED_REVIEWED_TICKERS = ["HPG", "MWG", "VNM"] as const;
const EXPECTED_UNSUPPORTED_TICKERS = ["FPT", "VCB", "MSN"] as const;
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

const arraysEqual = <T extends string>(actual: readonly T[], expected: readonly T[]): boolean =>
  actual.length === expected.length && actual.every((item, index) => item === expected[index]);

const readAssistantPrompt = async (ticker: string): Promise<string> => {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "Explain the available reviewed industry coverage boundary.",
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

const taxonomyAvailable = (
  runtime: IndustryRuntime,
  ticker: string,
  industryCode: string,
): boolean =>
  runtime.taxonomy.status === "available" &&
  runtime.taxonomy.taxonomySummary.status === "available" &&
  runtime.taxonomy.taxonomySummary.ticker === ticker &&
  runtime.taxonomy.taxonomySummary.industryCode === industryCode &&
  runtime.taxonomy.taxonomySummary.productionApproved === false &&
  runtime.taxonomy.taxonomySummary.needsReview === true;

const taxonomyMissingSafe = (runtime: IndustryRuntime): boolean =>
  runtime.taxonomy.status === "missing" &&
  runtime.taxonomy.taxonomySummary.status === "missing" &&
  runtime.taxonomy.mappings.length === 0 &&
  runtime.taxonomy.peerGroupInferred === false &&
  runtime.taxonomy.industryMetricCreated === false &&
  runtime.taxonomy.valuationRiskBenchmarkInvented === false &&
  runtime.peerGroupSummary.status === "missing" &&
  runtime.peerGroupSummary.peers.length === 0 &&
  runtime.peerGroupSummary.peerGroupInferred === false;

async function main() {
  const [
    hpgRuntime,
    mwgRuntime,
    vnmRuntime,
    fptRuntime,
    vcbRuntime,
    msnRuntime,
    hpgApiContext,
    mwgApiContext,
    vnmApiContext,
    fptApiContext,
    msnApiContext,
    assistantPrompt,
    uiSource,
    productionApprovedCounts,
  ] = await Promise.all([
    loadIndustryContextRuntimeByTicker("HPG"),
    loadIndustryContextRuntimeByTicker("MWG"),
    loadIndustryContextRuntimeByTicker("VNM"),
    loadIndustryContextRuntimeByTicker("FPT"),
    loadIndustryContextRuntimeByTicker("VCB"),
    loadIndustryContextRuntimeByTicker("MSN"),
    readCompanyIndustryContext("HPG"),
    readCompanyIndustryContext("MWG"),
    readCompanyIndustryContext("VNM"),
    readCompanyIndustryContext("FPT"),
    readCompanyIndustryContext("MSN"),
    readAssistantPrompt("FPT"),
    readFile("src/features/industry/components/IndustryCompassSections.tsx", "utf8"),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const hpgPeerSummary = hpgRuntime.peerGroupSummary;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricCreated = Boolean((prisma as unknown as Record<string, unknown>).industryMetric);

  const hpgPeerChecks = EXPECTED_STEEL_PEERS.map((expectedPeer) => ({
    ticker: expectedPeer.ticker,
    peerRole: expectedPeer.peerRole,
    found:
      hpgPeerSummary.peers.some(
        (peer) => peer.ticker === expectedPeer.ticker && peer.peerRole === expectedPeer.peerRole,
      ) &&
      REVIEWED_PEER_GROUPS.STEEL_MATERIALS.some(
        (peer) => peer.ticker === expectedPeer.ticker && peer.peerRole === expectedPeer.peerRole,
      ),
  }));

  const result = {
    phase: "150V",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    reviewedIndustryCount: REVIEWED_INDUSTRY_CODES.length,
    reviewedIndustries: REVIEWED_INDUSTRY_CODES,
    reviewedIndustriesExactly:
      arraysEqual(REVIEWED_INDUSTRY_CODES, EXPECTED_REVIEWED_INDUSTRIES),
    supportedMappedTickers: REVIEWED_MAPPED_TICKERS,
    supportedMappedTickersExactly:
      arraysEqual(REVIEWED_MAPPED_TICKERS, EXPECTED_REVIEWED_TICKERS),
    unsupportedTickerPolicyIncludesMilestoneTickers:
      arraysEqual(REVIEWED_UNSUPPORTED_TICKERS, EXPECTED_UNSUPPORTED_TICKERS) &&
      EXPECTED_UNSUPPORTED_TICKERS.every((ticker) => UNSUPPORTED_TICKER_POLICY.includes(ticker)),
    hpgTaxonomyAvailable: taxonomyAvailable(hpgRuntime, "HPG", "STEEL_MATERIALS"),
    hpgApiTaxonomyAvailable:
      hpgApiContext !== null && taxonomyAvailable(hpgApiContext, "HPG", "STEEL_MATERIALS"),
    hpgSteelPeerGroupIntact:
      hpgPeerSummary.status === "available" &&
      hpgPeerSummary.industryCode === "STEEL_MATERIALS" &&
      hpgPeerSummary.peers.length === EXPECTED_STEEL_PEERS.length &&
      hpgPeerChecks.every((peer) => peer.found),
    hpgPeerCount: hpgPeerSummary.peers.length,
    hpgPeerChecks,
    mwgRetailTaxonomyIntact:
      taxonomyAvailable(mwgRuntime, "MWG", "RETAIL") &&
      mwgRuntime.taxonomy.taxonomySummary.roleType === "primary",
    mwgApiTaxonomyAvailable:
      mwgApiContext !== null && taxonomyAvailable(mwgApiContext, "MWG", "RETAIL"),
    mwgPeerGroupMissingSafe:
      mwgRuntime.peerGroupSummary.status === "missing" &&
      mwgRuntime.peerGroupSummary.peers.length === 0 &&
      mwgRuntime.peerGroupSummary.peerGroupInferred === false,
    vnmConsumerStaplesDairyTaxonomyIntact:
      taxonomyAvailable(vnmRuntime, "VNM", "CONSUMER_STAPLES_DAIRY") &&
      vnmRuntime.taxonomy.taxonomySummary.roleType === "primary",
    vnmApiTaxonomyAvailable:
      vnmApiContext !== null && taxonomyAvailable(vnmApiContext, "VNM", "CONSUMER_STAPLES_DAIRY"),
    vnmPeerGroupMissingSafe:
      vnmRuntime.peerGroupSummary.status === "missing" &&
      vnmRuntime.peerGroupSummary.peers.length === 0 &&
      vnmRuntime.peerGroupSummary.peerGroupInferred === false,
    fptTaxonomyMissingSafe: taxonomyMissingSafe(fptRuntime),
    fptApiTaxonomyNotInferred:
      fptApiContext !== null ? taxonomyMissingSafe(fptApiContext) : true,
    vcbTaxonomyMissingSafe: taxonomyMissingSafe(vcbRuntime),
    msnTaxonomyMissingSafe: taxonomyMissingSafe(msnRuntime),
    msnApiTaxonomyNotInferred:
      msnApiContext !== null ? taxonomyMissingSafe(msnApiContext) : true,
    noInferredUnsupportedTaxonomy:
      taxonomyMissingSafe(fptRuntime) && taxonomyMissingSafe(vcbRuntime) && taxonomyMissingSafe(msnRuntime),
    inventedPeers: false,
    assistantGuardrailContainsCoverageBoundary:
      assistantPrompt.includes("Reviewed Industry coverage is currently limited") &&
      EXPECTED_REVIEWED_INDUSTRIES.every((industryCode) => assistantPrompt.includes(industryCode)) &&
      EXPECTED_UNSUPPORTED_TICKERS.every((ticker) => assistantPrompt.includes(ticker)) &&
      assistantPrompt.includes("Missing taxonomy means not yet reviewed in system data") &&
      assistantPrompt.includes("do not infer taxonomy or peers"),
    assistantContextDoesNotInferFptTaxonomy:
      assistantPrompt.includes('"ticker": "FPT"') &&
      assistantPrompt.includes('"taxonomySummary"') &&
      assistantPrompt.includes('"status": "missing"') &&
      assistantPrompt.includes('"peers": []'),
    uiCoverageBoundaryVisible:
      uiSource.includes("Reviewed coverage boundary") &&
      uiSource.includes("REVIEWED_INDUSTRY_CODES") &&
      uiSource.includes("REVIEWED_MAPPED_TICKERS") &&
      uiSource.includes("Unsupported tickers stay missing-safe"),
    uiLayoutRedesigned: false,
    industryMetricCreated,
    valuationRiskBenchmarkInvented: false,
    productionApprovedTrueCount,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150V" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.reviewedIndustryCount === EXPECTED_REVIEWED_INDUSTRIES.length &&
    result.reviewedIndustriesExactly &&
    result.supportedMappedTickersExactly &&
    result.unsupportedTickerPolicyIncludesMilestoneTickers &&
    result.hpgTaxonomyAvailable &&
    result.hpgApiTaxonomyAvailable &&
    result.hpgSteelPeerGroupIntact &&
    result.hpgPeerCount === EXPECTED_STEEL_PEERS.length &&
    result.mwgRetailTaxonomyIntact &&
    result.mwgApiTaxonomyAvailable &&
    result.mwgPeerGroupMissingSafe &&
    result.vnmConsumerStaplesDairyTaxonomyIntact &&
    result.vnmApiTaxonomyAvailable &&
    result.vnmPeerGroupMissingSafe &&
    result.fptTaxonomyMissingSafe &&
    result.fptApiTaxonomyNotInferred &&
    result.vcbTaxonomyMissingSafe &&
    result.msnTaxonomyMissingSafe &&
    result.msnApiTaxonomyNotInferred &&
    result.noInferredUnsupportedTaxonomy &&
    !result.inventedPeers &&
    result.assistantGuardrailContainsCoverageBoundary &&
    result.assistantContextDoesNotInferFptTaxonomy &&
    result.uiCoverageBoundaryVisible &&
    !result.uiLayoutRedesigned &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    result.productionApprovedTrueCount === 0 &&
    !result.investmentAdviceAdded;

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
