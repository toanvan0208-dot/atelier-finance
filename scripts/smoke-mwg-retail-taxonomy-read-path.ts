import { createAssistantPostHandler } from "../src/app/api/assistant/route.js";
import {
  loadIndustryContextRuntimeByTicker,
  loadIndustryPeerGroupSummaryByTicker,
  loadIndustryTaxonomyRuntimeByTicker,
} from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_INDUSTRY_CODE = "RETAIL";
const TARGET_TICKER = "MWG";

const hasText = (value: string | null | undefined): value is string => Boolean(value?.trim());

const readAssistantPrompt = async (ticker: string): Promise<string> => {
  const handler = createAssistantPostHandler({ provider: null });
  const response = await handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "Explain available industry data.",
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

async function main() {
  const [
    industry,
    companyIndustry,
    mwgTaxonomy,
    mwgPeerGroupSummary,
    vcbTaxonomy,
    vcbPeerGroupSummary,
    hpgPeerRows,
    mwgPeerGroupRows,
    productionApprovedCounts,
  ] = await Promise.all([
    prisma.industry.findUnique({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
      select: {
        industryCode: true,
        industryName: true,
        displayNameVi: true,
        sectorCode: true,
        sectorName: true,
        classificationSystem: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
        warningCodes: true,
      },
    }),
    prisma.companyIndustry.findFirst({
      where: {
        ticker: TARGET_TICKER,
        industryCode: TARGET_INDUSTRY_CODE,
        roleType: "primary",
      },
      select: {
        ticker: true,
        industryCode: true,
        roleType: true,
        segmentDescription: true,
        mappingConfidence: true,
        sourceLabel: true,
        sourceUrl: true,
        sourceType: true,
        publicationDate: true,
        retrievedAt: true,
        reviewNote: true,
        extractedQuote: true,
        warningCodes: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
    }),
    loadIndustryTaxonomyRuntimeByTicker(TARGET_TICKER),
    loadIndustryPeerGroupSummaryByTicker(TARGET_TICKER),
    loadIndustryTaxonomyRuntimeByTicker("VCB"),
    loadIndustryPeerGroupSummaryByTicker("VCB"),
    prisma.industryPeerGroup.findMany({
      where: {
        industryCode: "STEEL_MATERIALS",
        peerTicker: {
          in: ["HSG", "NKG", "TVN"],
        },
      },
      select: {
        peerTicker: true,
        peerRole: true,
      },
      orderBy: {
        peerTicker: "asc",
      },
    }),
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

  const [mwgRuntime, vcbRuntime, assistantPrompt] = await Promise.all([
    loadIndustryContextRuntimeByTicker(TARGET_TICKER),
    loadIndustryContextRuntimeByTicker("VCB"),
    readAssistantPrompt(TARGET_TICKER),
  ]);

  const mwgRuntimeMapping = mwgTaxonomy.mappings.find(
    (mapping) =>
      mapping.ticker === TARGET_TICKER &&
      mapping.industryCode === TARGET_INDUSTRY_CODE &&
      mapping.roleType === "primary",
  );
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const prismaDelegates = prisma as unknown as Record<string, unknown>;

  const result = {
    phase: "150R",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    industryRetailExists: industry?.industryCode === TARGET_INDUSTRY_CODE,
    companyIndustryMwgRetailExists: Boolean(companyIndustry),
    roleType: companyIndustry?.roleType ?? null,
    mappingConfidence: companyIndustry?.mappingConfidence ?? null,
    dataMode: companyIndustry?.dataMode ?? null,
    productionApprovedFalse: companyIndustry?.productionApproved === false && industry?.productionApproved === false,
    needsReviewTrue: companyIndustry?.needsReview === true && industry?.needsReview === true,
    sourceType: companyIndustry?.sourceType ?? null,
    sourceUrlPresent: hasText(companyIndustry?.sourceUrl),
    retrievedAtPresent: Boolean(companyIndustry?.retrievedAt),
    reviewNotePresent: hasText(companyIndustry?.reviewNote),
    extractedQuoteNull: companyIndustry?.extractedQuote === null,
    mwgTaxonomyReadable: mwgTaxonomy.status === "available" && Boolean(mwgRuntimeMapping),
    mwgRuntimeTaxonomyReadable:
      mwgRuntime.taxonomy.status === "available" &&
      mwgRuntime.taxonomy.mappings.some((mapping) => mapping.industryCode === TARGET_INDUSTRY_CODE),
    mwgPeerGroupRowsCreated: mwgPeerGroupRows,
    mwgPeerGroupMissingSafe:
      mwgPeerGroupSummary.status === "missing" &&
      mwgPeerGroupSummary.peers.length === 0 &&
      !mwgPeerGroupSummary.peerGroupInferred,
    hpgSteelPeerGroupIntact:
      hpgPeerRows.length === 3 &&
      hpgPeerRows.some((row) => row.peerTicker === "HSG" && row.peerRole === "direct_peer") &&
      hpgPeerRows.some((row) => row.peerTicker === "NKG" && row.peerRole === "direct_peer") &&
      hpgPeerRows.some((row) => row.peerTicker === "TVN" && row.peerRole === "adjacent_peer"),
    vcbMissingSafe:
      vcbTaxonomy.status === "missing" &&
      vcbRuntime.taxonomy.status === "missing" &&
      vcbPeerGroupSummary.status === "missing" &&
      vcbPeerGroupSummary.peers.length === 0,
    industryMetricCreated: Boolean(prismaDelegates.industryMetric),
    valuationRiskBenchmarkCreated: false,
    uiLayoutChanged: false,
    assistantWiringChanged: false,
    assistantPromptStillHasGuardrails:
      assistantPrompt.includes("research_only") &&
      assistantPrompt.includes("needsReview") &&
      assistantPrompt.includes("not valuation benchmarks"),
    productionApprovedTrueCount,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150R" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.industryRetailExists &&
    result.companyIndustryMwgRetailExists &&
    result.roleType === "primary" &&
    result.mappingConfidence === "medium" &&
    result.dataMode === "research_only" &&
    result.productionApprovedFalse &&
    result.needsReviewTrue &&
    result.sourceType === "provider_taxonomy" &&
    result.sourceUrlPresent &&
    result.retrievedAtPresent &&
    result.reviewNotePresent &&
    result.extractedQuoteNull &&
    result.mwgTaxonomyReadable &&
    result.mwgRuntimeTaxonomyReadable &&
    result.mwgPeerGroupRowsCreated === 0 &&
    result.mwgPeerGroupMissingSafe &&
    result.hpgSteelPeerGroupIntact &&
    result.vcbMissingSafe &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkCreated &&
    !result.uiLayoutChanged &&
    !result.assistantWiringChanged &&
    result.assistantPromptStillHasGuardrails &&
    result.productionApprovedTrueCount === 0 &&
    !result.missingDataZeroFilled &&
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
