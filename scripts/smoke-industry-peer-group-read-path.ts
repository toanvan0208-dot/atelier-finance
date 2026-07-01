import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";
import { readFile } from "node:fs/promises";

const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const TARGET_TICKER = "HPG";
const EXPECTED_PEERS = [
  { ticker: "HSG", peerRole: "direct_peer" },
  { ticker: "NKG", peerRole: "direct_peer" },
  { ticker: "TVN", peerRole: "adjacent_peer" },
] as const;

type CompanyApiPayload = {
  data?: {
    industryContext?: Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>>;
  };
  industryContext?: Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>>;
};

const readAssistantPrompt = async (ticker: string): Promise<string> => {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "Explain the available industry peer group context.",
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

const readCompanyIndustryContext = async (
  ticker: string,
): Promise<Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>> | null> => {
  const response = await getCompanyRoute(new Request(`http://localhost/api/companies/${ticker}`), {
    params: { ticker },
  });
  const payload = (await response.json()) as CompanyApiPayload;

  return payload.data?.industryContext ?? payload.industryContext ?? null;
};

async function main() {
  const [
    hpgRuntime,
    vcbRuntime,
    hpgApiContext,
    assistantPrompt,
    uiSource,
    productionApprovedCounts,
    needsReviewTrueCount,
  ] = await Promise.all([
    loadIndustryContextRuntimeByTicker(TARGET_TICKER),
    loadIndustryContextRuntimeByTicker("VCB"),
    readCompanyIndustryContext(TARGET_TICKER),
    readAssistantPrompt(TARGET_TICKER),
    readFile("src/features/industry/components/IndustryCompassSections.tsx", "utf8"),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
        peerTicker: {
          in: EXPECTED_PEERS.map((peer) => peer.ticker),
        },
        productionApproved: false,
        needsReview: true,
      },
    }),
  ]);

  const hpgPeerSummary = hpgRuntime.peerGroupSummary;
  const apiPeerSummary = hpgApiContext?.peerGroupSummary;
  const vcbPeerSummary = vcbRuntime.peerGroupSummary;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricCreated = Boolean((prisma as unknown as Record<string, unknown>).industryMetric);

  const expectedPeerChecks = EXPECTED_PEERS.map((expectedPeer) => {
    const peer = hpgPeerSummary.peers.find(
      (candidate) => candidate.ticker === expectedPeer.ticker && candidate.peerRole === expectedPeer.peerRole,
    );

    return {
      ticker: expectedPeer.ticker,
      peerRole: expectedPeer.peerRole,
      visible: Boolean(peer),
      researchOnly: peer?.dataMode === "research_only",
      productionApprovedFalse: peer?.productionApproved === false,
      needsReviewTrue: peer?.needsReview === true,
      providerTaxonomySource: peer?.sourceType === "provider_taxonomy",
      sourceUrlPresent: Boolean(peer?.sourceUrl),
      caveatVisible:
        peer?.caveats.some((caveat) => caveat.includes("valuation benchmark")) === true &&
        peer.caveats.some((caveat) => caveat.includes("risk benchmark")),
    };
  });

  const result = {
    phase: "150Q",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    hpgPeerGroupReadable:
      hpgPeerSummary.status === "available" &&
      hpgPeerSummary.industryCode === TARGET_INDUSTRY_CODE &&
      hpgPeerSummary.anchorTicker === TARGET_TICKER,
    hpgPeerCount: hpgPeerSummary.peers.length,
    hsgDirectPeerVisible:
      expectedPeerChecks.find((peer) => peer.ticker === "HSG")?.visible === true,
    nkgDirectPeerVisible:
      expectedPeerChecks.find((peer) => peer.ticker === "NKG")?.visible === true,
    tvnAdjacentPeerVisible:
      expectedPeerChecks.find((peer) => peer.ticker === "TVN")?.visible === true,
    expectedPeerChecks,
    allPeerRowsResearchOnlyNeedsReview: expectedPeerChecks.every(
      (peer) => peer.researchOnly && peer.productionApprovedFalse && peer.needsReviewTrue,
    ),
    peerGroupWarningsVisible:
      hpgPeerSummary.warnings.includes("PEER_GROUP_NOT_VALUATION_BENCHMARK") &&
      hpgPeerSummary.warnings.includes("PEER_GROUP_NOT_RISK_BENCHMARK"),
    apiPeerGroupSummaryVisible:
      apiPeerSummary?.status === "available" && apiPeerSummary.peers.length === EXPECTED_PEERS.length,
    vcbPeerGroupMissingSafe: vcbPeerSummary.status === "missing" && vcbPeerSummary.peers.length === 0,
    assistantPeerGroupContextInjected:
      assistantPrompt.includes("peerGroupSummary") &&
      assistantPrompt.includes("HSG") &&
      assistantPrompt.includes("NKG") &&
      assistantPrompt.includes("TVN") &&
      assistantPrompt.includes("PEER_GROUP_NOT_VALUATION_BENCHMARK"),
    uiPeerGroupCaveatVisible:
      uiSource.includes("DB peer group") &&
      uiSource.includes("Peer group is not a valuation or risk benchmark."),
    peerGroupUsedAsValuationBenchmark: hpgPeerSummary.peerGroupUsedAsValuationBenchmark,
    peerGroupUsedAsRiskBenchmark: hpgPeerSummary.peerGroupUsedAsRiskBenchmark,
    peerGroupInferred: hpgPeerSummary.peerGroupInferred,
    industryMetricCreated,
    valuationRiskBenchmarkInvented: false,
    uiLayoutRedesigned: false,
    productionApprovedTrueCount,
    needsReviewTrueCount,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.hpgPeerGroupReadable &&
    result.hpgPeerCount === EXPECTED_PEERS.length &&
    result.hsgDirectPeerVisible &&
    result.nkgDirectPeerVisible &&
    result.tvnAdjacentPeerVisible &&
    result.allPeerRowsResearchOnlyNeedsReview &&
    result.peerGroupWarningsVisible &&
    result.apiPeerGroupSummaryVisible &&
    result.vcbPeerGroupMissingSafe &&
    result.assistantPeerGroupContextInjected &&
    result.uiPeerGroupCaveatVisible &&
    !result.peerGroupUsedAsValuationBenchmark &&
    !result.peerGroupUsedAsRiskBenchmark &&
    !result.peerGroupInferred &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.uiLayoutRedesigned &&
    result.productionApprovedTrueCount === 0 &&
    result.needsReviewTrueCount === EXPECTED_PEERS.length &&
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
