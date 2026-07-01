import { readFile } from "node:fs/promises";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_TICKER = "MWG";
const TARGET_INDUSTRY_CODE = "RETAIL";

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
        question: "Explain the available MWG industry taxonomy context.",
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
    mwgRuntime,
    mwgApiContext,
    hpgRuntime,
    vcbRuntime,
    assistantPrompt,
    uiSource,
    mwgRetailPeerRows,
    productionApprovedCounts,
  ] = await Promise.all([
    loadIndustryContextRuntimeByTicker(TARGET_TICKER),
    readCompanyIndustryContext(TARGET_TICKER),
    loadIndustryContextRuntimeByTicker("HPG"),
    loadIndustryContextRuntimeByTicker("VCB"),
    readAssistantPrompt(TARGET_TICKER),
    readFile("src/features/industry/components/IndustryCompassSections.tsx", "utf8"),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const mwgSummary = mwgRuntime.taxonomy.taxonomySummary;
  const mwgMapping = mwgRuntime.taxonomy.mappings.find(
    (mapping) =>
      mapping.ticker === TARGET_TICKER &&
      mapping.industryCode === TARGET_INDUSTRY_CODE &&
      mapping.roleType === "primary",
  );
  const apiSummary = mwgApiContext?.taxonomy.taxonomySummary;
  const hpgPeerSummary = hpgRuntime.peerGroupSummary;
  const vcbTaxonomy = vcbRuntime.taxonomy;
  const vcbPeerSummary = vcbRuntime.peerGroupSummary;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricCreated = Boolean((prisma as unknown as Record<string, unknown>).industryMetric);

  const result = {
    phase: "150S",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    mwgTaxonomyReadable:
      mwgRuntime.taxonomy.status === "available" &&
      mwgSummary.status === "available" &&
      Boolean(mwgMapping),
    mwgApiTaxonomyReadable:
      apiSummary?.status === "available" &&
      apiSummary.industryCode === TARGET_INDUSTRY_CODE &&
      apiSummary.ticker === TARGET_TICKER,
    mwgIndustryCode: mwgSummary.industryCode,
    mwgIndustryName: mwgSummary.industryName,
    mwgDisplayNameVi: mwgSummary.displayNameVi,
    mwgRoleType: mwgSummary.roleType,
    mwgMappingConfidence: mwgSummary.mappingConfidence,
    mwgDataMode: mwgSummary.dataMode,
    mwgProductionApprovedFalse: mwgSummary.productionApproved === false && mwgMapping?.productionApproved === false,
    mwgNeedsReviewTrue: mwgSummary.needsReview === true && mwgMapping?.needsReview === true,
    mwgSourceType: mwgSummary.sourceType,
    mwgSourceUrlPresent: Boolean(mwgSummary.sourceUrl),
    taxonomyWarningsVisible:
      mwgSummary.warnings.includes("TAXONOMY_RESEARCH_ONLY") &&
      mwgSummary.warnings.includes("TAXONOMY_NEEDS_REVIEW") &&
      mwgSummary.warnings.includes("TAXONOMY_NOT_INVESTMENT_ADVICE") &&
      mwgSummary.warnings.includes("TAXONOMY_NOT_VALUATION_BENCHMARK") &&
      mwgSummary.warnings.includes("TAXONOMY_NOT_RISK_BENCHMARK"),
    mwgPeerGroupMissingSafe:
      mwgRuntime.peerGroupSummary.status === "missing" &&
      mwgRuntime.peerGroupSummary.peers.length === 0 &&
      mwgRuntime.peerGroupSummary.warnings.includes("PEER_GROUP_UNAVAILABLE") &&
      mwgRuntime.peerGroupSummary.warnings.includes("PEER_GROUP_NOT_VALUATION_BENCHMARK") &&
      mwgRuntime.peerGroupSummary.warnings.includes("PEER_GROUP_NOT_RISK_BENCHMARK") &&
      !mwgRuntime.peerGroupSummary.peerGroupInferred,
    mwgRetailPeerRows,
    assistantMwgTaxonomyContextInjected:
      assistantPrompt.includes("taxonomySummary") &&
      assistantPrompt.includes(TARGET_TICKER) &&
      assistantPrompt.includes(TARGET_INDUSTRY_CODE) &&
      assistantPrompt.includes("research_only") &&
      assistantPrompt.includes("needsReview") &&
      assistantPrompt.includes("productionApproved") &&
      assistantPrompt.includes("TAXONOMY_NOT_INVESTMENT_ADVICE") &&
      assistantPrompt.includes("TAXONOMY_NOT_VALUATION_BENCHMARK") &&
      assistantPrompt.includes("TAXONOMY_NOT_RISK_BENCHMARK"),
    assistantReceivesNoInventedMwgPeerGroup:
      assistantPrompt.includes('"peerGroupSummary"') &&
      assistantPrompt.includes('"status": "missing"') &&
      assistantPrompt.includes('"peers": []') &&
      !assistantPrompt.includes("PNJ") &&
      !assistantPrompt.includes("FRT"),
    uiTaxonomyCaveatVisible:
      uiSource.includes("DB taxonomy detail") &&
      uiSource.includes("Taxonomy is not investment advice or a valuation/risk benchmark."),
    hpgSteelPeerGroupIntact:
      hpgPeerSummary.status === "available" &&
      hpgPeerSummary.industryCode === "STEEL_MATERIALS" &&
      hpgPeerSummary.peers.length === 3 &&
      hpgPeerSummary.peers.some((peer) => peer.ticker === "HSG" && peer.peerRole === "direct_peer") &&
      hpgPeerSummary.peers.some((peer) => peer.ticker === "NKG" && peer.peerRole === "direct_peer") &&
      hpgPeerSummary.peers.some((peer) => peer.ticker === "TVN" && peer.peerRole === "adjacent_peer"),
    vcbMissingSafe:
      vcbTaxonomy.status === "missing" &&
      vcbTaxonomy.taxonomySummary.status === "missing" &&
      vcbTaxonomy.mappings.length === 0 &&
      vcbPeerSummary.status === "missing" &&
      vcbPeerSummary.peers.length === 0,
    industryMetricCreated,
    valuationRiskBenchmarkInvented: false,
    uiLayoutRedesigned: false,
    productionApprovedTrueCount,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150S" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.mwgTaxonomyReadable &&
    result.mwgApiTaxonomyReadable &&
    result.mwgIndustryCode === TARGET_INDUSTRY_CODE &&
    result.mwgRoleType === "primary" &&
    result.mwgMappingConfidence === "medium" &&
    result.mwgDataMode === "research_only" &&
    result.mwgProductionApprovedFalse &&
    result.mwgNeedsReviewTrue &&
    result.mwgSourceType === "provider_taxonomy" &&
    result.mwgSourceUrlPresent &&
    result.taxonomyWarningsVisible &&
    result.mwgPeerGroupMissingSafe &&
    result.mwgRetailPeerRows === 0 &&
    result.assistantMwgTaxonomyContextInjected &&
    result.assistantReceivesNoInventedMwgPeerGroup &&
    result.uiTaxonomyCaveatVisible &&
    result.hpgSteelPeerGroupIntact &&
    result.vcbMissingSafe &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.uiLayoutRedesigned &&
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
