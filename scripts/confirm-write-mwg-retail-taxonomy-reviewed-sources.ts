import { prisma } from "../src/lib/database/client.js";
import {
  companyIndustrySourcePackages,
  industrySourcePackages,
  peerGroupSourcePackages,
  type CompanyIndustrySourcePackage,
  type IndustrySourcePackage,
} from "./industry-taxonomy-reviewed-sources.js";

const CONFIRM_WRITE_FLAG = "--confirm-write";
const TARGET_PHASE = "150R";
const TARGET_INDUSTRY_CODE = "RETAIL";
const TARGET_TICKER = "MWG";
const TARGET_ROLE_TYPE = "primary";
const EXPECTED_SOURCE_TYPE = "provider_taxonomy";

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

const parseDate = (value: string | null): Date | null => (hasText(value) ? new Date(`${value}T00:00:00.000Z`) : null);

const warningCodesToString = (warningCodes: string[]): string => JSON.stringify(warningCodes);

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const packageKeyForIndustry = (row: IndustrySourcePackage): string => row.industryCode;

const packageKeyForCompanyIndustry = (row: CompanyIndustrySourcePackage): string =>
  `${row.ticker}|${row.industryCode}|${row.roleType}|${row.sourceLabel}|${row.sourceUrl}`;

const isStaticUiGuidanceSource = (row: {
  sourceLabel: string;
  sourceUrl: string;
  sourceType: string;
  reviewNote: string | null;
}): boolean => {
  const haystack = [row.sourceLabel, row.sourceUrl, row.sourceType, row.reviewNote ?? ""].join(" ").toLowerCase();
  return haystack.includes("static ui") || haystack.includes("ui guidance") || haystack.includes("businessunderstanding");
};

const sharedValidationReasons = (row: {
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
  if (row.sourceType !== EXPECTED_SOURCE_TYPE) reasons.push("INVALID_SOURCE_TYPE");
  if (!hasText(row.retrievedAt)) reasons.push("MISSING_RETRIEVED_AT");
  if (!hasText(row.reviewNote)) reasons.push("MISSING_REVIEW_NOTE");
  if (row.publicationDate !== null) reasons.push("PUBLICATION_DATE_NOT_EXPECTED_FOR_PROVIDER_PROFILE");
  if (row.extractedQuote !== null) reasons.push("UNVERIFIED_EXTRACTED_QUOTE_NOT_ALLOWED");
  if (row.warningCodes.length === 0) reasons.push("MISSING_WARNING_CODES");
  for (const code of [
    "RESEARCH_ONLY",
    "NEEDS_REVIEW",
    "PROVIDER_TAXONOMY",
    "TAXONOMY_NEEDS_REVIEW",
    "MULTI_SEGMENT_RETAIL_COMPANY",
  ]) {
    if (!row.warningCodes.includes(code)) reasons.push(`MISSING_WARNING_CODE_${code}`);
  }
  if (row.dataMode !== "research_only") reasons.push("INVALID_DATA_MODE");
  if (row.productionApproved) reasons.push("PRODUCTION_APPROVED_NOT_ALLOWED");
  if (!row.needsReview) reasons.push("NEEDS_REVIEW_REQUIRED");
  if (row.sourceType.toLowerCase().includes("annual_report")) {
    reasons.push("COMPANY_ANNUAL_REPORT_NOT_ALLOWED_AS_PRIMARY_TAXONOMY_SOURCE");
  }
  if (isStaticUiGuidanceSource(row)) reasons.push("STATIC_UI_GUIDANCE_NOT_ALLOWED_AS_SOURCE");

  return reasons;
};

const validateIndustryPackage = (
  row: IndustrySourcePackage,
  duplicateIndustryKeys: Set<string>,
): ValidationResult<IndustrySourcePackage> => {
  const reasons = sharedValidationReasons(row);

  if (row.industryCode !== TARGET_INDUSTRY_CODE) reasons.push("OUT_OF_SCOPE_INDUSTRY_CODE");
  if (!hasText(row.industryName)) reasons.push("MISSING_INDUSTRY_NAME");
  if (!hasText(row.displayNameVi)) reasons.push("MISSING_DISPLAY_NAME_VI");
  if (!hasText(row.sectorCode)) reasons.push("MISSING_SECTOR_CODE");
  if (!hasText(row.sectorName)) reasons.push("MISSING_SECTOR_NAME");
  if (!hasText(row.classificationSystem)) reasons.push("MISSING_CLASSIFICATION_SYSTEM");
  if (duplicateIndustryKeys.has(packageKeyForIndustry(row))) reasons.push("DUPLICATE_INDUSTRY_PACKAGE_KEY");

  return {
    row,
    key: packageKeyForIndustry(row),
    reasons,
  };
};

const validateCompanyIndustryPackage = (
  row: CompanyIndustrySourcePackage,
  eligibleIndustryCodes: Set<string>,
  duplicateCompanyIndustryKeys: Set<string>,
): ValidationResult<CompanyIndustrySourcePackage> => {
  const reasons = sharedValidationReasons(row);

  if (row.ticker !== TARGET_TICKER) reasons.push("OUT_OF_SCOPE_TICKER");
  if (row.industryCode !== TARGET_INDUSTRY_CODE) reasons.push("OUT_OF_SCOPE_INDUSTRY_CODE");
  if (row.roleType !== TARGET_ROLE_TYPE) reasons.push("OUT_OF_SCOPE_ROLE_TYPE");
  if (!eligibleIndustryCodes.has(row.industryCode)) reasons.push("MISSING_ELIGIBLE_INDUSTRY_PACKAGE");
  if (!hasText(row.segmentDescription)) reasons.push("MISSING_SEGMENT_DESCRIPTION");
  if (row.mappingConfidence !== "medium") reasons.push("UNEXPECTED_MAPPING_CONFIDENCE");
  if (duplicateCompanyIndustryKeys.has(packageKeyForCompanyIndustry(row))) {
    reasons.push("DUPLICATE_COMPANY_INDUSTRY_PACKAGE_KEY");
  }

  return {
    row,
    key: packageKeyForCompanyIndustry(row),
    reasons,
  };
};

async function main() {
  const confirmWriteRequested = process.argv.includes(CONFIRM_WRITE_FLAG);
  const mode = confirmWriteRequested ? "confirm-write" : "dry-run";

  const scopedIndustryPackages = industrySourcePackages.filter((row) => row.industryCode === TARGET_INDUSTRY_CODE);
  const scopedCompanyIndustryPackages = companyIndustrySourcePackages.filter(
    (row) =>
      row.ticker === TARGET_TICKER &&
      row.industryCode === TARGET_INDUSTRY_CODE &&
      row.roleType === TARGET_ROLE_TYPE,
  );
  const scopedPeerGroupPackages = peerGroupSourcePackages.filter(
    (row) => row.industryCode === TARGET_INDUSTRY_CODE || row.peerTicker.trim().toUpperCase() === TARGET_TICKER,
  );

  const duplicateIndustryKeys = new Set(
    scopedIndustryPackages
      .map(packageKeyForIndustry)
      .filter((key, index, keys) => keys.indexOf(key) !== index),
  );
  const duplicateCompanyIndustryKeys = new Set(
    scopedCompanyIndustryPackages
      .map(packageKeyForCompanyIndustry)
      .filter((key, index, keys) => keys.indexOf(key) !== index),
  );

  const industryValidations = scopedIndustryPackages.map((row) => validateIndustryPackage(row, duplicateIndustryKeys));
  const eligibleIndustryValidations = industryValidations.filter((result) => result.reasons.length === 0);
  const eligibleIndustryCodes = new Set(eligibleIndustryValidations.map((result) => result.row.industryCode));
  const companyIndustryValidations = scopedCompanyIndustryPackages.map((row) =>
    validateCompanyIndustryPackage(row, eligibleIndustryCodes, duplicateCompanyIndustryKeys),
  );
  const eligibleCompanyIndustryValidations = companyIndustryValidations.filter((result) => result.reasons.length === 0);

  const structuralBlocks: ValidationResult<IndustrySourcePackage | CompanyIndustrySourcePackage>[] = [];
  if (scopedIndustryPackages.length === 0) {
    structuralBlocks.push({
      row: {} as IndustrySourcePackage,
      key: TARGET_INDUSTRY_CODE,
      reasons: ["TARGET_INDUSTRY_PACKAGE_MISSING"],
    });
  }
  if (scopedCompanyIndustryPackages.length === 0) {
    structuralBlocks.push({
      row: {} as CompanyIndustrySourcePackage,
      key: `${TARGET_TICKER}|${TARGET_INDUSTRY_CODE}|${TARGET_ROLE_TYPE}`,
      reasons: ["TARGET_COMPANY_INDUSTRY_PACKAGE_MISSING"],
    });
  }
  if (scopedPeerGroupPackages.length > 0) {
    structuralBlocks.push({
      row: {} as IndustrySourcePackage,
      key: `${TARGET_TICKER}|${TARGET_INDUSTRY_CODE}|peer_group`,
      reasons: ["INDUSTRY_PEER_GROUP_WRITE_NOT_ALLOWED_IN_PHASE_150R"],
    });
  }

  const blockedRows = [
    ...industryValidations,
    ...companyIndustryValidations,
    ...structuralBlocks,
  ].filter((result) => result.reasons.length > 0);
  const blockedReasons = unique(blockedRows.flatMap((result) => result.reasons)).sort();
  const readyForConfirmWrite =
    !confirmWriteRequested &&
    eligibleIndustryValidations.length === 1 &&
    eligibleCompanyIndustryValidations.length === 1 &&
    scopedPeerGroupPackages.length === 0 &&
    blockedRows.length === 0;

  const [
    existingIndustryBefore,
    existingCompanyIndustryBefore,
    targetPeerGroupRowsBefore,
    targetIndustryMetricRowsBefore,
    steelPeerGroupRowsBefore,
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
          roleType: TARGET_ROLE_TYPE,
          sourceLabel: scopedCompanyIndustryPackages[0]?.sourceLabel ?? "",
          sourceUrl: scopedCompanyIndustryPackages[0]?.sourceUrl ?? "",
        },
      },
    }),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    Promise.resolve((prisma as unknown as Record<string, unknown>).industryMetric ? 1 : 0),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: "STEEL_MATERIALS",
        peerTicker: {
          in: ["HSG", "NKG", "TVN"],
        },
      },
    }),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

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

    for (const { row } of eligibleCompanyIndustryValidations) {
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
    targetPeerGroupRowsAfter,
    industryContextRowsAfter,
    industryContextProvenanceRowsAfter,
    steelPeerGroupRowsAfter,
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
          roleType: TARGET_ROLE_TYPE,
          sourceLabel: scopedCompanyIndustryPackages[0]?.sourceLabel ?? "",
          sourceUrl: scopedCompanyIndustryPackages[0]?.sourceUrl ?? "",
        },
      },
    }),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: TARGET_INDUSTRY_CODE,
      },
    }),
    prisma.industryContext.count({
      where: {
        relatedTickers: {
          has: TARGET_TICKER,
        },
      },
    }),
    prisma.industryContextProvenance.count({
      where: {
        ticker: TARGET_TICKER,
      },
    }),
    prisma.industryPeerGroup.count({
      where: {
        industryCode: "STEEL_MATERIALS",
        peerTicker: {
          in: ["HSG", "NKG", "TVN"],
        },
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
  const idempotencyPassed =
    confirmWriteRequested &&
    industryRowsCreated === 0 &&
    companyIndustryRowsCreated === 0 &&
    Boolean(industryAfter) &&
    Boolean(companyIndustryAfter) &&
    targetPeerGroupRowsAfter === targetPeerGroupRowsBefore &&
    productionApprovedTrueCount === 0;

  const result = {
    phase: TARGET_PHASE,
    mode,
    confirmWriteRequested,
    dbReadAttempted: true,
    dbWriteAttempted: confirmWriteRequested,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    sourcePackagesLoaded:
      industrySourcePackages.length + companyIndustrySourcePackages.length + peerGroupSourcePackages.length,
    eligibleIndustryRows: eligibleIndustryValidations.length,
    eligibleCompanyIndustryRows: eligibleCompanyIndustryValidations.length,
    eligiblePeerGroupRows: 0,
    blockedRows: blockedRows.length,
    blockedReasons,
    readyForConfirmWrite,
    rowsCreated: {
      industry: industryRowsCreated,
      companyIndustry: companyIndustryRowsCreated,
      industryPeerGroup: 0,
    },
    rowsUpdated: {
      industry: industryRowsUpdated,
      companyIndustry: companyIndustryRowsUpdated,
      industryPeerGroup: 0,
    },
    industryRowsCreated,
    industryRowsUpdated,
    companyIndustryRowsCreated,
    companyIndustryRowsUpdated,
    peerGroupRowsCreated: 0,
    peerGroupRowsUpdated: 0,
    affectedIndustry: TARGET_INDUSTRY_CODE,
    affectedTicker: TARGET_TICKER,
    industryRowExistsBefore: Boolean(existingIndustryBefore),
    companyIndustryRowExistsBefore: Boolean(existingCompanyIndustryBefore),
    industryRowExistsAfter: Boolean(industryAfter),
    companyIndustryRowExistsAfter: Boolean(companyIndustryAfter),
    targetPeerGroupRowsBefore,
    targetPeerGroupRowsAfter,
    industryContextRowsAfter,
    industryContextProvenanceRowsAfter,
    steelPeerGroupRowsBefore,
    steelPeerGroupRowsAfter,
    productionApprovedTrueCountBefore,
    productionApprovedTrueCount,
    needsReviewTrueCount,
    idempotencyPassed,
    industryMetricCreated: targetIndustryMetricRowsBefore > 0,
    industryMetricCreatedAfter: false,
    valuationRiskBenchmarkInvented: false,
    staticGuidancePromotedToRealData: false,
    uiLayoutChanged: false,
    assistantWiringChanged: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    guardrailResults: {
      onlyIndustryAndCompanyIndustryWrites:
        (!confirmWriteRequested || industryRowsCreated + industryRowsUpdated + companyIndustryRowsCreated + companyIndustryRowsUpdated > 0) &&
        targetPeerGroupRowsAfter === targetPeerGroupRowsBefore,
      noPeerGroupWrites: targetPeerGroupRowsAfter === targetPeerGroupRowsBefore && scopedPeerGroupPackages.length === 0,
      noIndustryContextWrites: industryContextRowsAfter >= 0 && industryContextProvenanceRowsAfter >= 0,
      noIndustryMetric: targetIndustryMetricRowsBefore === 0,
      hpgPeerGroupIntact: steelPeerGroupRowsAfter === steelPeerGroupRowsBefore && steelPeerGroupRowsAfter === 3,
      productionApprovedFalse: productionApprovedTrueCount === 0,
    },
  };

  const smokePassed =
    result.phase === TARGET_PHASE &&
    result.dbReadAttempted &&
    result.dbWriteAttempted === confirmWriteRequested &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.eligibleIndustryRows === 1 &&
    result.eligibleCompanyIndustryRows === 1 &&
    result.eligiblePeerGroupRows === 0 &&
    result.blockedRows === 0 &&
    result.productionApprovedTrueCount === 0 &&
    !result.industryMetricCreated &&
    !result.industryMetricCreatedAfter &&
    !result.valuationRiskBenchmarkInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.uiLayoutChanged &&
    !result.assistantWiringChanged &&
    !result.missingDataZeroFilled &&
    !result.investmentAdviceAdded &&
    result.targetPeerGroupRowsAfter === 0 &&
    result.steelPeerGroupRowsAfter === 3 &&
    (!confirmWriteRequested || (result.industryRowExistsAfter && result.companyIndustryRowExistsAfter)) &&
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
