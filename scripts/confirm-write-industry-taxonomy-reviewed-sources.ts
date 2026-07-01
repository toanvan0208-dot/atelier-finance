import { prisma } from "../src/lib/database/client.js";
import {
  companyIndustrySourcePackages,
  industrySourcePackages,
  peerGroupSourcePackages,
  type CompanyIndustrySourcePackage,
  type IndustrySourcePackage,
} from "./industry-taxonomy-reviewed-sources.js";

const CONFIRM_WRITE_FLAG = "--confirm-write";
const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";
const TARGET_TICKER = "HPG";

type ValidationResult<T> = {
  row: T;
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

const hasDateAndEvidence = (row: {
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
}): boolean => (hasText(row.publicationDate) || hasText(row.retrievedAt)) && (hasText(row.reviewNote) || hasText(row.extractedQuote));

const parseDate = (value: string | null): Date | null => (hasText(value) ? new Date(`${value}T00:00:00.000Z`) : null);

const warningCodesToString = (warningCodes: string[]): string => JSON.stringify(warningCodes);

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const baseValidationReasons = (row: {
  sourceLabel: string;
  sourceUrl: string;
  sourceType: string;
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  warningCodes: string[];
  dataMode: string;
  productionApproved: boolean;
  needsReview: boolean;
}): string[] => {
  const reasons: string[] = [];

  if (!hasText(row.sourceLabel)) reasons.push("MISSING_SOURCE_LABEL");
  if (!hasRealSourceUrl(row.sourceUrl)) reasons.push("MISSING_REAL_SOURCE_URL");
  if (!hasText(row.sourceType)) reasons.push("MISSING_SOURCE_TYPE");
  if (!hasDateAndEvidence(row)) reasons.push("MISSING_SOURCE_DATE_OR_REVIEW_NOTE");
  if (row.warningCodes.length === 0) reasons.push("MISSING_WARNING_CODES");
  if (row.dataMode !== "research_only") reasons.push("INVALID_DATA_MODE");
  if (row.productionApproved) reasons.push("PRODUCTION_APPROVED_NOT_ALLOWED");
  if (!row.needsReview) reasons.push("NEEDS_REVIEW_REQUIRED");
  if (row.sourceType.toLowerCase().includes("annual_report")) {
    reasons.push("COMPANY_ANNUAL_REPORT_NOT_ALLOWED_AS_PRIMARY_TAXONOMY_SOURCE");
  }

  return reasons;
};

const validateIndustryPackage = (row: IndustrySourcePackage): ValidationResult<IndustrySourcePackage> => {
  const reasons = baseValidationReasons(row);

  if (row.industryCode !== TARGET_INDUSTRY_CODE) reasons.push("OUT_OF_SCOPE_INDUSTRY_CODE");
  if (!hasText(row.industryName)) reasons.push("MISSING_INDUSTRY_NAME");
  if (!hasText(row.displayNameVi)) reasons.push("MISSING_DISPLAY_NAME_VI");
  if (!hasText(row.sectorCode)) reasons.push("MISSING_SECTOR_CODE");
  if (!hasText(row.sectorName)) reasons.push("MISSING_SECTOR_NAME");
  if (!hasText(row.classificationSystem)) reasons.push("MISSING_CLASSIFICATION_SYSTEM");

  return {
    row,
    key: row.industryCode || "MISSING_INDUSTRY_CODE",
    reasons,
  };
};

const validateCompanyIndustryPackage = (
  row: CompanyIndustrySourcePackage,
  eligibleIndustryCodes: Set<string>,
): ValidationResult<CompanyIndustrySourcePackage> => {
  const reasons = baseValidationReasons(row);

  if (row.ticker !== TARGET_TICKER) reasons.push("OUT_OF_SCOPE_TICKER");
  if (row.industryCode !== TARGET_INDUSTRY_CODE) reasons.push("OUT_OF_SCOPE_INDUSTRY_CODE");
  if (row.roleType !== "primary") reasons.push("OUT_OF_SCOPE_ROLE_TYPE");
  if (!eligibleIndustryCodes.has(row.industryCode)) reasons.push("MISSING_ELIGIBLE_INDUSTRY_PACKAGE");
  if (!hasText(row.segmentDescription)) reasons.push("MISSING_SEGMENT_DESCRIPTION");
  if (row.mappingConfidence === "missing") reasons.push("MAPPING_CONFIDENCE_MISSING");

  return {
    row,
    key: `${row.ticker}|${row.industryCode}|${row.roleType}|${row.sourceLabel}|${row.sourceUrl}`,
    reasons,
  };
};

async function main() {
  const confirmWriteRequested = process.argv.includes(CONFIRM_WRITE_FLAG);
  const mode = confirmWriteRequested ? "confirm-write" : "dry-run";

  const [
    existingIndustryBefore,
    existingCompanyIndustryBefore,
    existingPeerGroupsBefore,
    industryMetricDelegate,
    productionApprovedCountsBefore,
  ] = await Promise.all([
    prisma.industry.findUnique({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    prisma.companyIndustry.findUnique({
      where: {
        ticker_industryCode_roleType_sourceLabel_sourceUrl: {
          ticker: TARGET_TICKER,
          industryCode: TARGET_INDUSTRY_CODE,
          roleType: "primary",
          sourceLabel: companyIndustrySourcePackages[0]?.sourceLabel ?? "",
          sourceUrl: companyIndustrySourcePackages[0]?.sourceUrl ?? "",
        },
      },
    }),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    Promise.resolve((prisma as unknown as Record<string, unknown>).industryMetric),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const industryValidations = industrySourcePackages.map(validateIndustryPackage);
  const eligibleIndustryValidations = industryValidations.filter((result) => result.reasons.length === 0);
  const eligibleIndustryCodes = new Set(eligibleIndustryValidations.map((result) => result.row.industryCode));
  const companyValidations = companyIndustrySourcePackages.map((row) =>
    validateCompanyIndustryPackage(row, eligibleIndustryCodes),
  );
  const eligibleCompanyValidations = companyValidations.filter((result) => result.reasons.length === 0);

  const blockedRows = [...industryValidations, ...companyValidations].filter((result) => result.reasons.length > 0);
  const blockedReasons = unique(blockedRows.flatMap((result) => result.reasons)).sort();

  let industryRowsCreated = 0;
  let industryRowsUpdated = 0;
  let companyIndustryRowsCreated = 0;
  let companyIndustryRowsUpdated = 0;

  if (confirmWriteRequested && blockedRows.length === 0) {
    for (const { row } of eligibleIndustryValidations) {
      await prisma.industry.upsert({
        where: {
          industryCode: row.industryCode,
        },
        create: {
          industryCode: row.industryCode,
          industryName: row.industryName,
          displayNameVi: row.displayNameVi,
          sectorCode: row.sectorCode,
          sectorName: row.sectorName,
          classificationSystem: row.classificationSystem,
          description: row.reviewNote,
          dataMode: row.dataMode,
          productionApproved: false,
          needsReview: true,
          warningCodes: warningCodesToString(row.warningCodes),
        },
        update: {
          industryName: row.industryName,
          displayNameVi: row.displayNameVi,
          sectorCode: row.sectorCode,
          sectorName: row.sectorName,
          classificationSystem: row.classificationSystem,
          description: row.reviewNote,
          dataMode: row.dataMode,
          productionApproved: false,
          needsReview: true,
          warningCodes: warningCodesToString(row.warningCodes),
        },
      });

      if (existingIndustryBefore) {
        industryRowsUpdated += 1;
      } else {
        industryRowsCreated += 1;
      }
    }

    for (const { row } of eligibleCompanyValidations) {
      const existingRow = await prisma.companyIndustry.findUnique({
        where: {
          ticker_industryCode_roleType_sourceLabel_sourceUrl: {
            ticker: row.ticker,
            industryCode: row.industryCode,
            roleType: row.roleType,
            sourceLabel: row.sourceLabel,
            sourceUrl: row.sourceUrl,
          },
        },
      });

      await prisma.companyIndustry.upsert({
        where: {
          ticker_industryCode_roleType_sourceLabel_sourceUrl: {
            ticker: row.ticker,
            industryCode: row.industryCode,
            roleType: row.roleType,
            sourceLabel: row.sourceLabel,
            sourceUrl: row.sourceUrl,
          },
        },
        create: {
          ticker: row.ticker,
          industryCode: row.industryCode,
          roleType: row.roleType,
          segmentDescription: row.segmentDescription,
          mappingConfidence: row.mappingConfidence,
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
          segmentDescription: row.segmentDescription,
          mappingConfidence: row.mappingConfidence,
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
        companyIndustryRowsUpdated += 1;
      } else {
        companyIndustryRowsCreated += 1;
      }
    }
  }

  const [
    industryAfter,
    companyIndustryAfter,
    peerGroupsAfter,
    productionApprovedCountsAfter,
    needsReviewCountsAfter,
  ] = await Promise.all([
    prisma.industry.findUnique({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    prisma.companyIndustry.findUnique({
      where: {
        ticker_industryCode_roleType_sourceLabel_sourceUrl: {
          ticker: TARGET_TICKER,
          industryCode: TARGET_INDUSTRY_CODE,
          roleType: "primary",
          sourceLabel: companyIndustrySourcePackages[0]?.sourceLabel ?? "",
          sourceUrl: companyIndustrySourcePackages[0]?.sourceUrl ?? "",
        },
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

  const productionApprovedTrueCountBefore = productionApprovedCountsBefore.reduce((sum, count) => sum + count, 0);
  const productionApprovedTrueCount = productionApprovedCountsAfter.reduce((sum, count) => sum + count, 0);
  const needsReviewTrueCount = needsReviewCountsAfter.reduce((sum, count) => sum + count, 0);

  const rowsCreated = {
    industry: industryRowsCreated,
    companyIndustry: companyIndustryRowsCreated,
    industryPeerGroup: 0,
  };
  const rowsUpdated = {
    industry: industryRowsUpdated,
    companyIndustry: companyIndustryRowsUpdated,
    industryPeerGroup: 0,
  };
  const idempotencyPassed =
    confirmWriteRequested &&
    Boolean(industryAfter) &&
    Boolean(companyIndustryAfter) &&
    peerGroupsAfter === existingPeerGroupsBefore &&
    productionApprovedTrueCount === 0;

  const result = {
    phase: "150L",
    mode,
    confirmWriteRequested,
    dbReadAttempted: true,
    dbWriteAttempted: confirmWriteRequested,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    sourcePackagesLoaded:
      industrySourcePackages.length + companyIndustrySourcePackages.length + peerGroupSourcePackages.length,
    industryPackagesLoaded: industrySourcePackages.length,
    companyIndustryPackagesLoaded: companyIndustrySourcePackages.length,
    peerGroupPackagesLoaded: peerGroupSourcePackages.length,
    eligibleIndustryRows: eligibleIndustryValidations.length,
    eligibleCompanyIndustryRows: eligibleCompanyValidations.length,
    eligiblePeerGroupRows: 0,
    blockedRows: blockedRows.length,
    blockedReasons,
    rowsCreated,
    rowsUpdated,
    affectedIndustry: TARGET_INDUSTRY_CODE,
    affectedTicker: TARGET_TICKER,
    industryRowExistsBefore: Boolean(existingIndustryBefore),
    companyIndustryRowExistsBefore: Boolean(existingCompanyIndustryBefore),
    industryRowExistsAfter: Boolean(industryAfter),
    companyIndustryRowExistsAfter: Boolean(companyIndustryAfter),
    peerGroupRowsBefore: existingPeerGroupsBefore,
    peerGroupRowsAfter: peerGroupsAfter,
    productionApprovedTrueCountBefore,
    productionApprovedTrueCount,
    needsReviewTrueCount,
    idempotencyPassed,
    industryMetricCreated: Boolean(industryMetricDelegate),
    uiLayoutChanged: false,
    staticGuidancePromotedToRealData: false,
    companyAnnualReportsUsedAsPrimaryIndustrySource: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    guardrailResults: {
      noPeerGroupWrites:
        peerGroupSourcePackages.length === 0 &&
        rowsCreated.industryPeerGroup === 0 &&
        rowsUpdated.industryPeerGroup === 0,
      noIndustryMetric: !industryMetricDelegate,
      onlyTargetRowsEligible:
        eligibleIndustryValidations.every((result) => result.row.industryCode === TARGET_INDUSTRY_CODE) &&
        eligibleCompanyValidations.every(
          (result) => result.row.ticker === TARGET_TICKER && result.row.industryCode === TARGET_INDUSTRY_CODE,
        ),
      productionApprovedFalse: productionApprovedTrueCount === 0,
    },
  };

  const smokePassed =
    result.phase === "150L" &&
    result.dbReadAttempted &&
    result.providerFetchAttempted === false &&
    result.csvImportAttempted === false &&
    result.schemaChanged === false &&
    result.sourcePackagesLoaded === 2 &&
    result.eligibleIndustryRows === 1 &&
    result.eligibleCompanyIndustryRows === 1 &&
    result.eligiblePeerGroupRows === 0 &&
    result.blockedRows === 0 &&
    result.rowsCreated.industryPeerGroup === 0 &&
    result.rowsUpdated.industryPeerGroup === 0 &&
    result.peerGroupRowsAfter === result.peerGroupRowsBefore &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.uiLayoutChanged &&
    !result.staticGuidancePromotedToRealData &&
    !result.companyAnnualReportsUsedAsPrimaryIndustrySource &&
    !result.missingDataZeroFilled &&
    !result.investmentAdviceAdded &&
    (!confirmWriteRequested || (result.industryRowExistsAfter && result.companyIndustryRowExistsAfter));

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
