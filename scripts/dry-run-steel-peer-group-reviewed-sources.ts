import { prisma } from "../src/lib/database/client.js";
import { peerGroupSourcePackages, type IndustryPeerGroupSourcePackage } from "./industry-taxonomy-reviewed-sources.js";

const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const ANCHOR_TICKER = "HPG";
const ALLOWED_PEER_CANDIDATES = ["HSG", "NKG", "TVN"] as const;

type AllowedPeerTicker = (typeof ALLOWED_PEER_CANDIDATES)[number];

type BlockedPeerGroupRow = {
  peerTicker: AllowedPeerTicker | string;
  industryCode: string;
  reasons: string[];
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const hasText = (value: string | null | undefined): value is string => Boolean(value?.trim());

const hasRealSourceUrl = (sourceUrl: string | null | undefined): boolean => {
  if (!hasText(sourceUrl)) return false;

  try {
    const parsed = new URL(sourceUrl);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && !parsed.hostname.includes("example.");
  } catch {
    return false;
  }
};

const hasDateAndEvidence = (row: {
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
}): boolean =>
  (hasText(row.publicationDate) || hasText(row.retrievedAt)) &&
  (hasText(row.reviewNote) || hasText(row.extractedQuote));

const isAllowedPeerTicker = (ticker: string): ticker is AllowedPeerTicker =>
  ALLOWED_PEER_CANDIDATES.includes(ticker.trim().toUpperCase() as AllowedPeerTicker);

const annualReportPrimarySourceBlocked = (sourceType: string): boolean => sourceType.toLowerCase().includes("annual_report");

const validatePeerPackage = (
  row: IndustryPeerGroupSourcePackage,
  existingIndustryCodes: Set<string>,
  existingPackageKeys: Set<string>,
): BlockedPeerGroupRow | null => {
  const reasons: string[] = [];
  const peerTicker = row.peerTicker.trim().toUpperCase();
  const packageKey = `${row.industryCode}|${peerTicker}|${row.peerRole}|${row.sourceLabel}|${row.sourceUrl}`;

  if (row.industryCode !== TARGET_INDUSTRY_CODE) reasons.push("OUT_OF_SCOPE_INDUSTRY_CODE");
  if (!isAllowedPeerTicker(peerTicker)) reasons.push("OUT_OF_SCOPE_PEER_TICKER");
  if (!existingIndustryCodes.has(row.industryCode)) reasons.push("MISSING_TARGET_INDUSTRY_ROW");
  if (!hasText(row.inclusionReason)) reasons.push("MISSING_INCLUSION_REASON");
  if (!hasText(row.sourceLabel)) reasons.push("MISSING_SOURCE_LABEL");
  if (!hasRealSourceUrl(row.sourceUrl)) reasons.push("MISSING_REAL_SOURCE_URL");
  if (!hasText(row.sourceType)) reasons.push("MISSING_SOURCE_TYPE");
  if (annualReportPrimarySourceBlocked(row.sourceType)) {
    reasons.push("COMPANY_ANNUAL_REPORT_NOT_ALLOWED_AS_PRIMARY_PEER_SOURCE");
  }
  if (!hasDateAndEvidence(row)) reasons.push("MISSING_DATE_OR_REVIEW_EVIDENCE");
  if (row.warningCodes.length === 0) reasons.push("MISSING_WARNING_CODES");
  if (row.dataMode !== "research_only") reasons.push("INVALID_DATA_MODE");
  if (row.productionApproved) reasons.push("PRODUCTION_APPROVED_NOT_ALLOWED");
  if (!row.needsReview) reasons.push("NEEDS_REVIEW_REQUIRED");
  if (existingPackageKeys.has(packageKey)) reasons.push("DUPLICATE_PEER_GROUP_SOURCE_PACKAGE");

  return reasons.length > 0
    ? {
        peerTicker,
        industryCode: row.industryCode,
        reasons,
      }
    : null;
};

async function main() {
  const [
    targetIndustry,
    hpgMapping,
    existingPeerRows,
    productionApprovedCounts,
    needsReviewPeerRows,
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
        dataMode: true,
        productionApproved: true,
        needsReview: true,
      },
    }),
    prisma.industryPeerGroup.findMany({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
      select: {
        industryCode: true,
        peerTicker: true,
        peerRole: true,
        sourceLabel: true,
        sourceUrl: true,
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
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
        needsReview: true,
      },
    }),
  ]);

  const existingIndustryCodes = new Set<string>(targetIndustry ? [targetIndustry.industryCode] : []);
  const packageKeys = peerGroupSourcePackages.map(
    (row) =>
      `${row.industryCode}|${row.peerTicker.trim().toUpperCase()}|${row.peerRole}|${row.sourceLabel}|${row.sourceUrl}`,
  );
  const duplicatePackageKeys = packageKeys.filter((key, index) => packageKeys.indexOf(key) !== index);
  const duplicatePackageKeySet = new Set(duplicatePackageKeys);

  const scopedPeerPackages = peerGroupSourcePackages.filter(
    (row) => row.industryCode === TARGET_INDUSTRY_CODE || isAllowedPeerTicker(row.peerTicker),
  );
  const outOfScopePeerPackages = peerGroupSourcePackages.filter(
    (row) => row.industryCode !== TARGET_INDUSTRY_CODE && !isAllowedPeerTicker(row.peerTicker),
  );

  const validationBlocks = scopedPeerPackages
    .map((row) => validatePeerPackage(row, existingIndustryCodes, duplicatePackageKeySet))
    .filter((row): row is BlockedPeerGroupRow => Boolean(row));

  const packagePeerTickers = new Set(scopedPeerPackages.map((row) => row.peerTicker.trim().toUpperCase()));
  const missingPackageBlocks: BlockedPeerGroupRow[] = ALLOWED_PEER_CANDIDATES.filter(
    (ticker) => !packagePeerTickers.has(ticker),
  ).map((ticker) => ({
    peerTicker: ticker,
    industryCode: TARGET_INDUSTRY_CODE,
    reasons: ["REVIEWED_PEER_GROUP_SOURCE_PACKAGE_MISSING"],
  }));

  const targetBlocks: BlockedPeerGroupRow[] = [
    ...validationBlocks,
    ...missingPackageBlocks,
    ...outOfScopePeerPackages.map((row) => ({
      peerTicker: row.peerTicker,
      industryCode: row.industryCode,
      reasons: ["OUT_OF_SCOPE_PEER_PACKAGE_IGNORED"],
    })),
  ];

  const eligiblePeerGroupRows = scopedPeerPackages.length - validationBlocks.length;
  const acceptedTickers = unique(
    scopedPeerPackages
      .filter((row) => !validationBlocks.some((blocked) => blocked.peerTicker === row.peerTicker.trim().toUpperCase()))
      .map((row) => row.peerTicker.trim().toUpperCase()),
  ).sort();
  const blockedTickers = unique(targetBlocks.map((row) => row.peerTicker.toUpperCase())).sort();
  const blockedReasons = unique(targetBlocks.flatMap((row) => row.reasons)).sort();
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);
  const sourcePackagesLoaded = peerGroupSourcePackages.length;
  const readyForConfirmWrite = eligiblePeerGroupRows > 0 && targetBlocks.length === 0;

  const result = {
    phase: "150N",
    targetIndustry: TARGET_INDUSTRY_CODE,
    anchorTicker: ANCHOR_TICKER,
    allowedPeerCandidates: [...ALLOWED_PEER_CANDIDATES],
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    sourcePackagesLoaded,
    scopedPeerPackagesLoaded: scopedPeerPackages.length,
    existingTargetIndustryFound: Boolean(targetIndustry),
    anchorCompanyIndustryMappingFound: Boolean(hpgMapping),
    existingPeerGroupRows: existingPeerRows.length,
    eligiblePeerGroupRows,
    blockedPeerGroupRows: targetBlocks.length,
    candidatesByTicker: Object.fromEntries(
      ALLOWED_PEER_CANDIDATES.map((ticker) => [
        ticker,
        {
          sourcePackageFound: packagePeerTickers.has(ticker),
          eligible: acceptedTickers.includes(ticker),
          blockedReasons: targetBlocks
            .filter((row) => row.peerTicker.toUpperCase() === ticker)
            .flatMap((row) => row.reasons),
        },
      ]),
    ),
    acceptedTickers,
    blockedTickers,
    blockedReasons,
    duplicatePeerPackageKeys: unique(duplicatePackageKeys).sort(),
    productionApprovedTrueCount,
    needsReviewTrueCount: needsReviewPeerRows,
    fakePeerGroupsCreated: false,
    peerInferenceUsed: false,
    industryMetricCreated: false,
    valuationRiskBenchmarkInvented: false,
    staticGuidancePromotedToRealData: false,
    companyAnnualReportsUsedAsPrimaryPeerSource: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    readyForConfirmWrite,
  };

  const smokePassed =
    result.phase === "150N" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.existingTargetIndustryFound &&
    result.anchorCompanyIndustryMappingFound &&
    result.sourcePackagesLoaded === peerGroupSourcePackages.length &&
    result.blockedPeerGroupRows >= ALLOWED_PEER_CANDIDATES.length - result.eligiblePeerGroupRows &&
    result.productionApprovedTrueCount === 0 &&
    !result.fakePeerGroupsCreated &&
    !result.peerInferenceUsed &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.companyAnnualReportsUsedAsPrimaryPeerSource &&
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
