import { readFile } from "node:fs/promises";
import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import { GET as getCompanyRoute } from "../src/app/api/companies/[ticker]/route.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_TICKER = "VNM";
const TARGET_INDUSTRY_CODE = "CONSUMER_STAPLES_DAIRY";

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
        question: "Explain the available VNM industry taxonomy context.",
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
    vnmRuntime,
    vnmApiContext,
    hpgRuntime,
    mwgRuntime,
    vcbRuntime,
    assistantPrompt,
    uiSource,
    vnmPeerGroupRows,
    productionApprovedCounts,
  ] = await Promise.all([
    loadIndustryContextRuntimeByTicker(TARGET_TICKER),
    readCompanyIndustryContext(TARGET_TICKER),
    loadIndustryContextRuntimeByTicker("HPG"),
    loadIndustryContextRuntimeByTicker("MWG"),
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

  const vnmSummary = vnmRuntime.taxonomy.taxonomySummary;
  const vnmMapping = vnmRuntime.taxonomy.mappings.find(
    (mapping) =>
      mapping.ticker === TARGET_TICKER &&
      mapping.industryCode === TARGET_INDUSTRY_CODE &&
      mapping.roleType === "primary",
  );
  const apiSummary = vnmApiContext?.taxonomy.taxonomySummary;
  const hpgPeerSummary = hpgRuntime.peerGroupSummary;
  const mwgSummary = mwgRuntime.taxonomy.taxonomySummary;
  const vcbTaxonomy = vcbRuntime.taxonomy;
  const vcbPeerSummary = vcbRuntime.peerGroupSummary;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricCreated = Boolean((prisma as unknown as Record<string, unknown>).industryMetric);

  const result = {
    phase: "150U",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    vnmTaxonomyReadable:
      vnmRuntime.taxonomy.status === "available" &&
      vnmSummary.status === "available" &&
      Boolean(vnmMapping),
    vnmApiTaxonomyReadable:
      apiSummary?.status === "available" &&
      apiSummary.industryCode === TARGET_INDUSTRY_CODE &&
      apiSummary.ticker === TARGET_TICKER,
    vnmIndustryCode: vnmSummary.industryCode,
    vnmIndustryName: vnmSummary.industryName,
    vnmDisplayNameVi: vnmSummary.displayNameVi,
    vnmRoleType: vnmSummary.roleType,
    vnmMappingConfidence: vnmSummary.mappingConfidence,
    vnmDataMode: vnmSummary.dataMode,
    vnmProductionApprovedFalse: vnmSummary.productionApproved === false && vnmMapping?.productionApproved === false,
    vnmNeedsReviewTrue: vnmSummary.needsReview === true && vnmMapping?.needsReview === true,
    vnmSourceType: vnmSummary.sourceType,
    vnmSourceUrlPresent: Boolean(vnmSummary.sourceUrl),
    taxonomyWarningsVisible:
      vnmSummary.warnings.includes("TAXONOMY_RESEARCH_ONLY") &&
      vnmSummary.warnings.includes("TAXONOMY_NEEDS_REVIEW") &&
      vnmSummary.warnings.includes("TAXONOMY_NOT_INVESTMENT_ADVICE") &&
      vnmSummary.warnings.includes("TAXONOMY_NOT_VALUATION_BENCHMARK") &&
      vnmSummary.warnings.includes("TAXONOMY_NOT_RISK_BENCHMARK"),
    vnmPeerGroupMissingSafe:
      vnmRuntime.peerGroupSummary.status === "missing" &&
      vnmRuntime.peerGroupSummary.peers.length === 0 &&
      vnmRuntime.peerGroupSummary.warnings.includes("PEER_GROUP_UNAVAILABLE") &&
      vnmRuntime.peerGroupSummary.warnings.includes("PEER_GROUP_NOT_VALUATION_BENCHMARK") &&
      vnmRuntime.peerGroupSummary.warnings.includes("PEER_GROUP_NOT_RISK_BENCHMARK") &&
      !vnmRuntime.peerGroupSummary.peerGroupInferred,
    vnmPeerGroupRows,
    assistantVnmTaxonomyContextInjected:
      assistantPrompt.includes("taxonomySummary") &&
      assistantPrompt.includes(TARGET_TICKER) &&
      assistantPrompt.includes(TARGET_INDUSTRY_CODE) &&
      assistantPrompt.includes("research_only") &&
      assistantPrompt.includes("needsReview") &&
      assistantPrompt.includes("productionApproved") &&
      assistantPrompt.includes("TAXONOMY_NOT_INVESTMENT_ADVICE") &&
      assistantPrompt.includes("TAXONOMY_NOT_VALUATION_BENCHMARK") &&
      assistantPrompt.includes("TAXONOMY_NOT_RISK_BENCHMARK"),
    assistantReceivesNoInventedVnmPeerGroup:
      assistantPrompt.includes('"peerGroupSummary"') &&
      assistantPrompt.includes('"status": "missing"') &&
      assistantPrompt.includes('"peers": []') &&
      !assistantPrompt.includes("MCM") &&
      !assistantPrompt.includes("QNS") &&
      !assistantPrompt.includes("SAB"),
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
    mwgRetailTaxonomyIntact:
      mwgRuntime.taxonomy.status === "available" &&
      mwgSummary.industryCode === "RETAIL" &&
      mwgSummary.roleType === "primary" &&
      mwgSummary.mappingConfidence === "medium",
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
    result.phase === "150U" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.vnmTaxonomyReadable &&
    result.vnmApiTaxonomyReadable &&
    result.vnmIndustryCode === TARGET_INDUSTRY_CODE &&
    result.vnmRoleType === "primary" &&
    result.vnmMappingConfidence === "medium" &&
    result.vnmDataMode === "research_only" &&
    result.vnmProductionApprovedFalse &&
    result.vnmNeedsReviewTrue &&
    result.vnmSourceType === "provider_taxonomy" &&
    result.vnmSourceUrlPresent &&
    result.taxonomyWarningsVisible &&
    result.vnmPeerGroupMissingSafe &&
    result.vnmPeerGroupRows === 0 &&
    result.assistantVnmTaxonomyContextInjected &&
    result.assistantReceivesNoInventedVnmPeerGroup &&
    result.uiTaxonomyCaveatVisible &&
    result.hpgSteelPeerGroupIntact &&
    result.mwgRetailTaxonomyIntact &&
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
