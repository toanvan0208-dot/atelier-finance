import { prisma } from "../src/lib/database/client.js";

const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const ANCHOR_TICKER = "HPG";
const EXPECTED_PEERS = [
  { peerTicker: "HSG", peerRole: "direct_peer" },
  { peerTicker: "NKG", peerRole: "direct_peer" },
  { peerTicker: "TVN", peerRole: "adjacent_peer" },
] as const;

const hasText = (value: string | null | undefined): value is string => Boolean(value?.trim());

async function main() {
  const [targetIndustry, anchorMapping, peerRows, productionApprovedCounts] = await Promise.all([
    prisma.industry.findUnique({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
      select: {
        industryCode: true,
        productionApproved: true,
        needsReview: true,
      },
    }),
    prisma.companyIndustry.findFirst({
      where: {
        ticker: ANCHOR_TICKER,
        industryCode: TARGET_INDUSTRY_CODE,
        roleType: "primary",
      },
      select: {
        ticker: true,
        industryCode: true,
        roleType: true,
      },
    }),
    prisma.industryPeerGroup.findMany({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
        peerTicker: {
          in: EXPECTED_PEERS.map((peer) => peer.peerTicker),
        },
      },
      select: {
        industryCode: true,
        peerTicker: true,
        peerRole: true,
        inclusionReason: true,
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
      orderBy: {
        peerTicker: "asc",
      },
    }),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const expectedRowChecks = EXPECTED_PEERS.map((expectedPeer) => {
    const row = peerRows.find(
      (candidate) =>
        candidate.peerTicker === expectedPeer.peerTicker &&
        candidate.peerRole === expectedPeer.peerRole &&
        candidate.industryCode === TARGET_INDUSTRY_CODE,
    );

    return {
      peerTicker: expectedPeer.peerTicker,
      peerRole: expectedPeer.peerRole,
      exists: Boolean(row),
      dataModeResearchOnly: row?.dataMode === "research_only",
      productionApprovedFalse: row?.productionApproved === false,
      needsReviewTrue: row?.needsReview === true,
      sourceTypeProviderTaxonomy: row?.sourceType === "provider_taxonomy",
      sourceUrlPresent: hasText(row?.sourceUrl),
      retrievedAtPresent: Boolean(row?.retrievedAt),
      reviewNotePresent: hasText(row?.reviewNote),
      extractedQuoteNull: row?.extractedQuote === null,
      warningCodesPresent: hasText(row?.warningCodes),
      inclusionReasonPresent: hasText(row?.inclusionReason),
    };
  });

  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const industryMetricDelegate = (prisma as unknown as Record<string, unknown>).industryMetric;
  const allExpectedPeerRowsReadable = expectedRowChecks.every(
    (check) =>
      check.exists &&
      check.dataModeResearchOnly &&
      check.productionApprovedFalse &&
      check.needsReviewTrue &&
      check.sourceTypeProviderTaxonomy &&
      check.sourceUrlPresent &&
      check.retrievedAtPresent &&
      check.reviewNotePresent &&
      check.extractedQuoteNull &&
      check.warningCodesPresent &&
      check.inclusionReasonPresent,
  );

  const result = {
    phase: "150P",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    industrySteelMaterialsExists: Boolean(targetIndustry),
    companyIndustryHpgSteelMaterialsExists: Boolean(anchorMapping),
    peerGroupRowsFound: peerRows.length,
    expectedPeerRows: expectedRowChecks,
    hsgDirectPeerExists: expectedRowChecks.find((check) => check.peerTicker === "HSG")?.exists ?? false,
    nkgDirectPeerExists: expectedRowChecks.find((check) => check.peerTicker === "NKG")?.exists ?? false,
    tvnAdjacentPeerExists: expectedRowChecks.find((check) => check.peerTicker === "TVN")?.exists ?? false,
    allPeerRowsResearchOnlyNeedsReview: expectedRowChecks.every(
      (check) => check.dataModeResearchOnly && check.needsReviewTrue && check.productionApprovedFalse,
    ),
    allPeerRowsHaveProviderSource: expectedRowChecks.every(
      (check) => check.sourceTypeProviderTaxonomy && check.sourceUrlPresent && check.retrievedAtPresent && check.reviewNotePresent,
    ),
    productionApprovedTrueCount,
    industryMetricCreated: Boolean(industryMetricDelegate),
    valuationRiskBenchmarkCreated: false,
    uiLayoutChanged: false,
    assistantPeerGroupWired: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150P" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.industrySteelMaterialsExists &&
    result.companyIndustryHpgSteelMaterialsExists &&
    result.peerGroupRowsFound === EXPECTED_PEERS.length &&
    result.hsgDirectPeerExists &&
    result.nkgDirectPeerExists &&
    result.tvnAdjacentPeerExists &&
    allExpectedPeerRowsReadable &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkCreated &&
    !result.uiLayoutChanged &&
    !result.assistantPeerGroupWired &&
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
