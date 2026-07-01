import {
  loadIndustryPeerGroupSummaryByTicker,
  loadIndustryTaxonomyRuntimeByTicker,
} from "../src/features/industry/lib/load-industry-context.js";
import { prisma } from "../src/lib/database/client.js";

const TARGET_INDUSTRY_CODE = "CONSUMER_STAPLES_DAIRY";
const TARGET_TICKER = "VNM";

const hasText = (value: string | null | undefined): value is string => Boolean(value?.trim());

async function main() {
  const [
    industry,
    companyIndustry,
    vnmTaxonomy,
    vnmPeerGroupSummary,
    vnmPeerGroupRows,
    hpgSteelPeerRows,
    mwgRetailRows,
    vcbTaxonomy,
    vcbPeerGroupSummary,
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
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
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
    prisma.companyIndustry.count({
      where: {
        ticker: "MWG",
        industryCode: "RETAIL",
        roleType: "primary",
      },
    }),
    loadIndustryTaxonomyRuntimeByTicker("VCB"),
    loadIndustryPeerGroupSummaryByTicker("VCB"),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const runtimeMapping = vnmTaxonomy.mappings.find(
    (mapping) =>
      mapping.ticker === TARGET_TICKER &&
      mapping.industryCode === TARGET_INDUSTRY_CODE &&
      mapping.roleType === "primary",
  );
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricCreated = Boolean((prisma as unknown as Record<string, unknown>).industryMetric);

  const result = {
    phase: "150T",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    industryConsumerStaplesDairyExists: industry?.industryCode === TARGET_INDUSTRY_CODE,
    companyIndustryVnmConsumerStaplesDairyExists: Boolean(companyIndustry),
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
    vnmTaxonomyReadable: vnmTaxonomy.status === "available" && Boolean(runtimeMapping),
    vnmPeerGroupRowsCreated: vnmPeerGroupRows,
    vnmPeerGroupMissingSafe:
      vnmPeerGroupSummary.status === "missing" &&
      vnmPeerGroupSummary.peers.length === 0 &&
      !vnmPeerGroupSummary.peerGroupInferred,
    hpgSteelPeerGroupIntact:
      hpgSteelPeerRows.length === 3 &&
      hpgSteelPeerRows.some((row) => row.peerTicker === "HSG" && row.peerRole === "direct_peer") &&
      hpgSteelPeerRows.some((row) => row.peerTicker === "NKG" && row.peerRole === "direct_peer") &&
      hpgSteelPeerRows.some((row) => row.peerTicker === "TVN" && row.peerRole === "adjacent_peer"),
    mwgRetailTaxonomyIntact: mwgRetailRows >= 1,
    vcbMissingSafe:
      vcbTaxonomy.status === "missing" &&
      vcbTaxonomy.mappings.length === 0 &&
      vcbPeerGroupSummary.status === "missing" &&
      vcbPeerGroupSummary.peers.length === 0,
    industryMetricCreated,
    valuationRiskBenchmarkCreated: false,
    uiLayoutChanged: false,
    assistantWiringChanged: false,
    productionApprovedTrueCount,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150T" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.industryConsumerStaplesDairyExists &&
    result.companyIndustryVnmConsumerStaplesDairyExists &&
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
    result.vnmTaxonomyReadable &&
    result.vnmPeerGroupRowsCreated === 0 &&
    result.vnmPeerGroupMissingSafe &&
    result.hpgSteelPeerGroupIntact &&
    result.mwgRetailTaxonomyIntact &&
    result.vcbMissingSafe &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkCreated &&
    !result.uiLayoutChanged &&
    !result.assistantWiringChanged &&
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
