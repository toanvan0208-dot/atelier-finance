import { prisma } from "../src/lib/database/client.js";
import { peerGroupSourcePackages, type IndustryPeerGroupSourcePackage } from "./industry-taxonomy-reviewed-sources.js";

const CONFIRM_WRITE_FLAG = "--confirm-write";
const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const ANCHOR_TICKER = "HPG";
const ALLOWED_PEER_CANDIDATES = ["HSG", "NKG", "TVN"] as const;

type AllowedPeerTicker = (typeof ALLOWED_PEER_CANDIDATES)[number];

type ValidationResult = {
  row: IndustryPeerGroupSourcePackage;
  key: string;
  reasons: string[];
};

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

const parseDate = (value: string | null): Date | null => (hasText(value) ? new Date(`${value}T00:00:00.000Z`) : null);

const warningCodesToString = (warningCodes: string[]): string => JSON.stringify(warningCodes);

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const isAllowedPeerTicker = (ticker: string): ticker is AllowedPeerTicker =>
  ALLOWED_PEER_CANDIDATES.includes(ticker.trim().toUpperCase() as AllowedPeerTicker);

const packageKeyFor = (row: IndustryPeerGroupSourcePackage): string =>
  `${row.industryCode}|${row.peerTicker.trim().toUpperCase()}|${row.peerRole}|${row.sourceLabel}|${row.sourceUrl}`;

const validatePeerPackage = (
  row: IndustryPeerGroupSourcePackage,
  targetIndustryFound: boolean,
  anchorCompanyIndustryMappingFound: boolean,
  duplicateKeys: Set<string>,
): ValidationResult => {
  const reasons: string[] = [];
  const peerTicker = row.peerTicker.trim().toUpperCase();
  const key = packageKeyFor(row);

  if (!targetIndustryFound) reasons.push("MISSING_TARGET_INDUSTRY");
  if (!anchorCompanyIndustryMappingFound) reasons.push("MISSING_HPG_ANCHOR_MAPPING");
  if (row.industryCode !== TARGET_INDUSTRY_CODE) reasons.push("OUT_OF_SCOPE_INDUSTRY_CODE");
  if (!isAllowedPeerTicker(peerTicker)) reasons.push("OUT_OF_SCOPE_PEER_TICKER");
  if (!hasText(row.peerRole)) reasons.push("MISSING_PEER_ROLE");
  if (!hasText(row.inclusionReason)) reasons.push("MISSING_INCLUSION_REASON");
  if (!hasText(row.sourceLabel)) reasons.push("MISSING_SOURCE_LABEL");
  if (!hasRealSourceUrl(row.sourceUrl)) reasons.push("MISSING_REAL_SOURCE_URL");
  if (!hasText(row.sourceType)) reasons.push("MISSING_SOURCE_TYPE");
  if (row.sourceType !== "provider_taxonomy") reasons.push("INVALID_SOURCE_TYPE");
  if (!hasText(row.retrievedAt)) reasons.push("MISSING_RETRIEVED_AT");
  if (row.publicationDate !== null) reasons.push("PUBLICATION_DATE_NOT_ALLOWED_FOR_REVIEWED_PROFILE_PACKAGE");
  if (!hasText(row.reviewNote)) reasons.push("MISSING_REVIEW_NOTE");
  if (row.extractedQuote !== null) reasons.push("UNSAFE_EXTRACTED_QUOTE_NOT_ALLOWED");
  if (row.warningCodes.length === 0) reasons.push("MISSING_WARNING_CODES");
  for (const code of ["RESEARCH_ONLY", "NEEDS_REVIEW", "PROVIDER_TAXONOMY", "PEER_GROUP_NEEDS_REVIEW"]) {
    if (!row.warningCodes.includes(code)) reasons.push(`MISSING_WARNING_CODE_${code}`);
  }
  if (row.dataMode !== "research_only") reasons.push("INVALID_DATA_MODE");
  if (row.productionApproved) reasons.push("PRODUCTION_APPROVED_NOT_ALLOWED");
  if (!row.needsReview) reasons.push("NEEDS_REVIEW_REQUIRED");
  if (row.sourceType.toLowerCase().includes("annual_report")) {
    reasons.push("COMPANY_ANNUAL_REPORT_NOT_ALLOWED_AS_PRIMARY_PEER_SOURCE");
  }
  if (duplicateKeys.has(key)) reasons.push("DUPLICATE_PEER_GROUP_PACKAGE_KEY");

  return {
    row,
    key,
    reasons,
  };
};

async function main() {
  const confirmWriteRequested = process.argv.includes(CONFIRM_WRITE_FLAG);
  const mode = confirmWriteRequested ? "confirm-write" : "dry-run";

  const [targetIndustry, anchorMapping, existingPeerRowsBefore, productionApprovedCountsBefore] = await Promise.all([
    prisma.industry.findUnique({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
      select: {
        industryCode: true,
      },
    }),
    prisma.companyIndustry.findFirst({
      where: {
        ticker: ANCHOR_TICKER,
        industryCode: TARGET_INDUSTRY_CODE,
        roleType: "primary",
      },
      select: {
        id: true,
      },
    }),
    prisma.industryPeerGroup.findMany({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
        peerTicker: {
          in: [...ALLOWED_PEER_CANDIDATES],
        },
      },
      select: {
        industryCode: true,
        peerTicker: true,
        peerRole: true,
        sourceLabel: true,
        sourceUrl: true,
      },
    }),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const packageKeys = peerGroupSourcePackages.map(packageKeyFor);
  const duplicateKeys = new Set(packageKeys.filter((key, index) => packageKeys.indexOf(key) !== index));
  const scopedPackages = peerGroupSourcePackages.filter(
    (row) => row.industryCode === TARGET_INDUSTRY_CODE && isAllowedPeerTicker(row.peerTicker),
  );
  const outOfScopePackages = peerGroupSourcePackages.filter(
    (row) => row.industryCode !== TARGET_INDUSTRY_CODE || !isAllowedPeerTicker(row.peerTicker),
  );

  const validations = scopedPackages.map((row) =>
    validatePeerPackage(row, Boolean(targetIndustry), Boolean(anchorMapping), duplicateKeys),
  );
  const outOfScopeValidations: ValidationResult[] = outOfScopePackages.map((row) => ({
    row,
    key: packageKeyFor(row),
    reasons: ["OUT_OF_SCOPE_PEER_PACKAGE_IGNORED"],
  }));
  const eligibleValidations = validations.filter((result) => result.reasons.length === 0);
  const blockedValidations = [...validations, ...outOfScopeValidations].filter((result) => result.reasons.length > 0);
  const missingAllowedTickers = ALLOWED_PEER_CANDIDATES.filter(
    (ticker) => !scopedPackages.some((row) => row.peerTicker.trim().toUpperCase() === ticker),
  );
  const missingTickerBlocks: ValidationResult[] = missingAllowedTickers.map((ticker) => ({
    row: {
      industryCode: TARGET_INDUSTRY_CODE,
      peerTicker: ticker,
      peerRole: "ambiguous",
      inclusionReason: "",
      sourceLabel: "",
      sourceUrl: "",
      sourceType: "reviewed_manual_note",
      publicationDate: null,
      retrievedAt: null,
      reviewNote: null,
      extractedQuote: null,
      warningCodes: [],
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true,
    },
    key: `${TARGET_INDUSTRY_CODE}|${ticker}`,
    reasons: ["REVIEWED_PEER_GROUP_SOURCE_PACKAGE_MISSING"],
  }));
  const blockedRows = [...blockedValidations, ...missingTickerBlocks];
  const blockedReasons = unique(blockedRows.flatMap((result) => result.reasons)).sort();

  let rowsCreated = 0;
  let rowsUpdated = 0;

  if (confirmWriteRequested && blockedRows.length === 0 && eligibleValidations.length === ALLOWED_PEER_CANDIDATES.length) {
    for (const { row } of eligibleValidations) {
      const peerTicker = row.peerTicker.trim().toUpperCase();
      const existingRow = await prisma.industryPeerGroup.findUnique({
        where: {
          industryCode_peerTicker_peerRole_sourceLabel_sourceUrl: {
            industryCode: row.industryCode,
            peerTicker,
            peerRole: row.peerRole,
            sourceLabel: row.sourceLabel,
            sourceUrl: row.sourceUrl,
          },
        },
      });

      await prisma.industryPeerGroup.upsert({
        where: {
          industryCode_peerTicker_peerRole_sourceLabel_sourceUrl: {
            industryCode: row.industryCode,
            peerTicker,
            peerRole: row.peerRole,
            sourceLabel: row.sourceLabel,
            sourceUrl: row.sourceUrl,
          },
        },
        create: {
          industryCode: row.industryCode,
          peerTicker,
          peerRole: row.peerRole,
          inclusionReason: row.inclusionReason,
          sourceLabel: row.sourceLabel,
          sourceUrl: row.sourceUrl,
          sourceType: row.sourceType,
          publicationDate: parseDate(row.publicationDate),
          retrievedAt: parseDate(row.retrievedAt),
          reviewNote: row.reviewNote,
          extractedQuote: row.extractedQuote,
          warningCodes: warningCodesToString(row.warningCodes),
          dataMode: row.dataMode,
          productionApproved: false,
          needsReview: true,
        },
        update: {
          inclusionReason: row.inclusionReason,
          sourceType: row.sourceType,
          publicationDate: parseDate(row.publicationDate),
          retrievedAt: parseDate(row.retrievedAt),
          reviewNote: row.reviewNote,
          extractedQuote: row.extractedQuote,
          warningCodes: warningCodesToString(row.warningCodes),
          dataMode: row.dataMode,
          productionApproved: false,
          needsReview: true,
        },
      });

      if (existingRow) {
        rowsUpdated += 1;
      } else {
        rowsCreated += 1;
      }
    }
  }

  const [existingPeerRowsAfter, productionApprovedCountsAfter, needsReviewCountAfter] = await Promise.all([
    prisma.industryPeerGroup.findMany({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
        peerTicker: {
          in: [...ALLOWED_PEER_CANDIDATES],
        },
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
        peerTicker: {
          in: [...ALLOWED_PEER_CANDIDATES],
        },
        needsReview: true,
      },
    }),
  ]);

  const acceptedTickers = eligibleValidations.map((result) => result.row.peerTicker.trim().toUpperCase()).sort();
  const blockedTickers = unique(blockedRows.map((result) => result.row.peerTicker.trim().toUpperCase()).filter(hasText)).sort();
  const productionApprovedTrueCountBefore = productionApprovedCountsBefore.reduce((sum, count) => sum + count, 0);
  const productionApprovedTrueCount = productionApprovedCountsAfter.reduce((sum, count) => sum + count, 0);
  const existingPeerGroupRowsBefore = existingPeerRowsBefore.length;
  const existingPeerGroupRowsAfter = existingPeerRowsAfter.length;
  const industryMetricDelegate = (prisma as unknown as Record<string, unknown>).industryMetric;
  const idempotencyPassed =
    confirmWriteRequested &&
    rowsCreated === 0 &&
    rowsUpdated === ALLOWED_PEER_CANDIDATES.length &&
    existingPeerGroupRowsAfter === ALLOWED_PEER_CANDIDATES.length &&
    productionApprovedTrueCount === 0;
  const readyForConfirmWrite =
    !confirmWriteRequested &&
    eligibleValidations.length === ALLOWED_PEER_CANDIDATES.length &&
    blockedRows.length === 0;

  const result = {
    phase: "150P",
    mode,
    confirmWriteRequested,
    dbReadAttempted: true,
    dbWriteAttempted: confirmWriteRequested,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    targetIndustryFound: Boolean(targetIndustry),
    anchorCompanyIndustryMappingFound: Boolean(anchorMapping),
    existingPeerGroupRowsBefore,
    existingPeerGroupRowsAfter,
    sourcePackagesLoaded: peerGroupSourcePackages.length,
    scopedPeerPackagesLoaded: scopedPackages.length,
    eligiblePeerGroupRows: eligibleValidations.length,
    blockedPeerGroupRows: blockedRows.length,
    blockedReasons,
    rowsCreated,
    rowsUpdated,
    acceptedTickers,
    blockedTickers,
    rolesByTicker: Object.fromEntries(
      eligibleValidations.map((validation) => [validation.row.peerTicker.trim().toUpperCase(), validation.row.peerRole]),
    ),
    productionApprovedTrueCountBefore,
    productionApprovedTrueCount,
    needsReviewTrueCount: needsReviewCountAfter,
    readyForConfirmWrite,
    idempotencyPassed,
    fakePeerGroupsCreated: false,
    industryMetricCreated: Boolean(industryMetricDelegate),
    valuationRiskBenchmarkInvented: false,
    staticGuidancePromotedToRealData: false,
    uiLayoutChanged: false,
    assistantPeerGroupWired: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150P" &&
    result.dbReadAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.targetIndustryFound &&
    result.anchorCompanyIndustryMappingFound &&
    result.sourcePackagesLoaded === ALLOWED_PEER_CANDIDATES.length &&
    result.eligiblePeerGroupRows === ALLOWED_PEER_CANDIDATES.length &&
    result.blockedPeerGroupRows === 0 &&
    result.acceptedTickers.join(",") === "HSG,NKG,TVN" &&
    result.productionApprovedTrueCount === 0 &&
    !result.fakePeerGroupsCreated &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.uiLayoutChanged &&
    !result.assistantPeerGroupWired &&
    !result.missingDataZeroFilled &&
    !result.investmentAdviceAdded &&
    (!confirmWriteRequested || result.existingPeerGroupRowsAfter === ALLOWED_PEER_CANDIDATES.length) &&
    (confirmWriteRequested || result.readyForConfirmWrite);

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
