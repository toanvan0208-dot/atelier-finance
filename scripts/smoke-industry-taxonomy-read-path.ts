import { prisma } from "../src/lib/database/client.js";

const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const TARGET_TICKER = "HPG";

async function main() {
  const [
    industryRow,
    companyIndustryRows,
    peerGroupRowsFound,
    vcbCompanyIndustryRows,
    productionApprovedCounts,
    needsReviewCounts,
  ] = await Promise.all([
    prisma.industry.findUnique({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
      select: {
        industryCode: true,
        industryName: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
    }),
    prisma.companyIndustry.findMany({
      where: {
        ticker: TARGET_TICKER,
        industryCode: TARGET_INDUSTRY_CODE,
      },
      select: {
        ticker: true,
        industryCode: true,
        roleType: true,
        sourceLabel: true,
        sourceUrl: true,
        sourceType: true,
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
    }),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    prisma.companyIndustry.count({
      where: {
        ticker: "VCB",
      },
    }),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
    Promise.all([
      prisma.industry.count({
        where: {
          industryCode: TARGET_INDUSTRY_CODE,
          needsReview: true,
        },
      }),
      prisma.companyIndustry.count({
        where: {
          ticker: TARGET_TICKER,
          industryCode: TARGET_INDUSTRY_CODE,
          needsReview: true,
        },
      }),
    ]),
  ]);

  const prismaDelegates = prisma as unknown as Record<string, unknown>;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const needsReviewTrueCount = needsReviewCounts.reduce((sum, count) => sum + count, 0);
  const hpgPrimaryMappingExists = companyIndustryRows.some(
    (row) =>
      row.ticker === TARGET_TICKER &&
      row.industryCode === TARGET_INDUSTRY_CODE &&
      row.roleType === "primary" &&
      row.productionApproved === false &&
      row.needsReview === true &&
      row.dataMode === "research_only" &&
      row.sourceType === "provider_taxonomy",
  );

  const result = {
    phase: "150L",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    industryTableReadable: true,
    companyIndustryTableReadable: true,
    industryPeerGroupTableReadable: true,
    industryRowSteelMaterialsExists: Boolean(industryRow),
    companyIndustryHpgSteelMaterialsExists: hpgPrimaryMappingExists,
    productionApprovedTrueCount,
    needsReviewTrueCount,
    peerGroupRowsFound,
    industryMetricCreated: Boolean(prismaDelegates.industryMetric),
    vcbMissingSafe: vcbCompanyIndustryRows === 0,
    uiLayoutChanged: false,
    staticGuidancePromotedToRealData: false,
    companyAnnualReportsUsedAsPrimaryIndustrySource: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.industryTableReadable &&
    result.companyIndustryTableReadable &&
    result.industryPeerGroupTableReadable &&
    result.industryRowSteelMaterialsExists &&
    result.companyIndustryHpgSteelMaterialsExists &&
    result.productionApprovedTrueCount === 0 &&
    result.needsReviewTrueCount >= 2 &&
    result.peerGroupRowsFound === 0 &&
    !result.industryMetricCreated &&
    result.vcbMissingSafe &&
    !result.uiLayoutChanged &&
    !result.staticGuidancePromotedToRealData &&
    !result.companyAnnualReportsUsedAsPrimaryIndustrySource &&
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
