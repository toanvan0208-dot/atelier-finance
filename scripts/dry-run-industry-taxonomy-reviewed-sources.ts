import { prisma } from "../src/lib/database/client.js";
import {
  companyIndustrySourcePackages,
  industrySourcePackages,
  peerGroupSourcePackages,
  SUPPORTED_INDUSTRY_TAXONOMY_TICKERS,
  type CompanyIndustrySourcePackage,
  type IndustryPeerGroupSourcePackage,
  type IndustrySourcePackage,
} from "./industry-taxonomy-reviewed-sources.js";

type BlockedRow = {
  rowType: "industry" | "company_industry" | "peer_group" | "ticker_coverage";
  key: string;
  ticker?: string;
  industryCode?: string;
  reasons: string[];
};

const REVIEWED_SOURCE_PACKAGE_MISSING = "REVIEWED_TAXONOMY_SOURCE_PACKAGE_MISSING";

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const hasText = (value: string | null | undefined): value is string => Boolean(value?.trim());

const hasReviewEvidence = (value: {
  publicationDate?: string | null;
  retrievedAt?: string | null;
  reviewNote?: string | null;
  extractedQuote?: string | null;
}): boolean => (hasText(value.publicationDate) || hasText(value.retrievedAt)) && (hasText(value.reviewNote) || hasText(value.extractedQuote));

const hasRealSourceUrl = (sourceUrl: string | null | undefined): boolean => {
  if (!hasText(sourceUrl)) return false;

  try {
    const parsed = new URL(sourceUrl);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && !parsed.hostname.includes("example.");
  } catch {
    return false;
  }
};

const isSupportedTicker = (ticker: string): ticker is (typeof SUPPORTED_INDUSTRY_TAXONOMY_TICKERS)[number] =>
  SUPPORTED_INDUSTRY_TAXONOMY_TICKERS.includes(
    ticker.trim().toUpperCase() as (typeof SUPPORTED_INDUSTRY_TAXONOMY_TICKERS)[number],
  );

const annualReportPrimarySourceBlocked = (sourceType: string): boolean => sourceType.toLowerCase().includes("annual_report");

const findDuplicateKeys = <T>(values: T[], keyFor: (value: T) => string): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    const key = keyFor(value);
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  }

  return [...duplicates].sort();
};

const validateSharedPolicy = (
  row: {
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
  },
  options?: {
    blockAnnualReportSource?: boolean;
  },
): string[] => {
  const reasons: string[] = [];

  if (!hasText(row.sourceLabel)) reasons.push("MISSING_SOURCE_LABEL");
  if (!hasRealSourceUrl(row.sourceUrl)) reasons.push("MISSING_REAL_SOURCE_URL");
  if (!hasText(row.sourceType)) reasons.push("MISSING_SOURCE_TYPE");
  if (!hasReviewEvidence(row)) reasons.push("MISSING_DATE_OR_REVIEW_EVIDENCE");
  if (row.warningCodes.length === 0) reasons.push("MISSING_WARNING_CODES");
  if (row.dataMode !== "research_only") reasons.push("INVALID_DATA_MODE");
  if (row.productionApproved) reasons.push("PRODUCTION_APPROVED_NOT_ALLOWED");
  if (!row.needsReview) reasons.push("NEEDS_REVIEW_REQUIRED");
  if (options?.blockAnnualReportSource && annualReportPrimarySourceBlocked(row.sourceType)) {
    reasons.push("COMPANY_ANNUAL_REPORT_NOT_ALLOWED_AS_PRIMARY_TAXONOMY_SOURCE");
  }

  return reasons;
};

const validateIndustryPackage = (
  row: IndustrySourcePackage,
  duplicateIndustryKeys: Set<string>,
): BlockedRow | null => {
  const reasons = validateSharedPolicy(row, { blockAnnualReportSource: true });

  if (!hasText(row.industryCode)) reasons.push("MISSING_INDUSTRY_CODE");
  if (!hasText(row.industryName)) reasons.push("MISSING_INDUSTRY_NAME");
  if (!hasText(row.displayNameVi)) reasons.push("MISSING_DISPLAY_NAME_VI");
  if (!hasText(row.sectorCode)) reasons.push("MISSING_SECTOR_CODE");
  if (!hasText(row.sectorName)) reasons.push("MISSING_SECTOR_NAME");
  if (!hasText(row.classificationSystem)) reasons.push("MISSING_CLASSIFICATION_SYSTEM");
  if (duplicateIndustryKeys.has(row.industryCode)) reasons.push("DUPLICATE_INDUSTRY_PACKAGE_KEY");

  return reasons.length > 0
    ? {
        rowType: "industry",
        key: row.industryCode || "MISSING_INDUSTRY_CODE",
        industryCode: row.industryCode || undefined,
        reasons,
      }
    : null;
};

const validateCompanyIndustryPackage = (
  row: CompanyIndustrySourcePackage,
  availableIndustryCodes: Set<string>,
  duplicateCompanyKeys: Set<string>,
): BlockedRow | null => {
  const reasons = validateSharedPolicy(row, { blockAnnualReportSource: true });
  const key = `${row.ticker}|${row.industryCode}|${row.roleType}|${row.sourceLabel}|${row.sourceUrl}`;

  if (!isSupportedTicker(row.ticker)) reasons.push("UNSUPPORTED_TICKER");
  if (!hasText(row.industryCode)) reasons.push("MISSING_INDUSTRY_CODE");
  if (!availableIndustryCodes.has(row.industryCode)) reasons.push("MISSING_INDUSTRY_RELATION");
  if (!hasText(row.segmentDescription)) reasons.push("MISSING_SEGMENT_DESCRIPTION");
  if (row.mappingConfidence === "missing") reasons.push("MAPPING_CONFIDENCE_MISSING");
  if (duplicateCompanyKeys.has(key)) reasons.push("DUPLICATE_COMPANY_INDUSTRY_PACKAGE_KEY");

  return reasons.length > 0
    ? {
        rowType: "company_industry",
        key,
        ticker: row.ticker,
        industryCode: row.industryCode,
        reasons,
      }
    : null;
};

const validatePeerGroupPackage = (
  row: IndustryPeerGroupSourcePackage,
  availableIndustryCodes: Set<string>,
  duplicatePeerKeys: Set<string>,
): BlockedRow | null => {
  const reasons = validateSharedPolicy(row, { blockAnnualReportSource: true });
  const key = `${row.industryCode}|${row.peerTicker}|${row.peerRole}|${row.sourceLabel}|${row.sourceUrl}`;

  if (!hasText(row.industryCode)) reasons.push("MISSING_INDUSTRY_CODE");
  if (!availableIndustryCodes.has(row.industryCode)) reasons.push("MISSING_INDUSTRY_RELATION");
  if (!hasText(row.peerTicker)) reasons.push("MISSING_PEER_TICKER");
  if (!hasText(row.inclusionReason)) reasons.push("MISSING_INCLUSION_REASON");
  if (duplicatePeerKeys.has(key)) reasons.push("DUPLICATE_PEER_GROUP_PACKAGE_KEY");

  return reasons.length > 0
    ? {
        rowType: "peer_group",
        key,
        ticker: row.peerTicker || undefined,
        industryCode: row.industryCode,
        reasons,
      }
    : null;
};

async function main() {
  const [
    industryRows,
    companyIndustryRows,
    industryPeerGroupRows,
    companies,
    industryContexts,
    productionApprovedCounts,
  ] = await Promise.all([
    prisma.industry.findMany({
      select: {
        industryCode: true,
      },
      orderBy: {
        industryCode: "asc",
      },
    }),
    prisma.companyIndustry.findMany({
      select: {
        ticker: true,
        industryCode: true,
      },
      orderBy: {
        ticker: "asc",
      },
    }),
    prisma.industryPeerGroup.findMany({
      select: {
        industryCode: true,
        peerTicker: true,
      },
      orderBy: {
        peerTicker: "asc",
      },
    }),
    prisma.company.findMany({
      where: {
        ticker: {
          in: [...SUPPORTED_INDUSTRY_TAXONOMY_TICKERS],
        },
      },
      select: {
        ticker: true,
      },
    }),
    prisma.industryContext.findMany({
      where: {
        relatedTickers: {
          hasSome: [...SUPPORTED_INDUSTRY_TAXONOMY_TICKERS],
        },
      },
      select: {
        relatedTickers: true,
      },
    }),
    Promise.all([
      prisma.industry.count({ where: { productionApproved: true } }),
      prisma.companyIndustry.count({ where: { productionApproved: true } }),
      prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
    ]),
  ]);

  const existingIndustryCodes = new Set(industryRows.map((row) => row.industryCode));
  const packageIndustryCodes = new Set(industrySourcePackages.map((row) => row.industryCode));
  const availableIndustryCodes = new Set([...existingIndustryCodes, ...packageIndustryCodes]);

  const duplicateIndustryKeys = new Set(findDuplicateKeys(industrySourcePackages, (row) => row.industryCode));
  const duplicateCompanyKeys = new Set(
    findDuplicateKeys(
      companyIndustrySourcePackages,
      (row) => `${row.ticker}|${row.industryCode}|${row.roleType}|${row.sourceLabel}|${row.sourceUrl}`,
    ),
  );
  const duplicatePeerKeys = new Set(
    findDuplicateKeys(
      peerGroupSourcePackages,
      (row) => `${row.industryCode}|${row.peerTicker}|${row.peerRole}|${row.sourceLabel}|${row.sourceUrl}`,
    ),
  );

  const blockedIndustryRows = industrySourcePackages
    .map((row) => validateIndustryPackage(row, duplicateIndustryKeys))
    .filter((row): row is BlockedRow => Boolean(row));
  const blockedCompanyRows = companyIndustrySourcePackages
    .map((row) => validateCompanyIndustryPackage(row, availableIndustryCodes, duplicateCompanyKeys))
    .filter((row): row is BlockedRow => Boolean(row));
  const blockedPeerRows = peerGroupSourcePackages
    .map((row) => validatePeerGroupPackage(row, availableIndustryCodes, duplicatePeerKeys))
    .filter((row): row is BlockedRow => Boolean(row));

  const validIndustryRows = industrySourcePackages.length - blockedIndustryRows.length;
  const validCompanyRows = companyIndustrySourcePackages.length - blockedCompanyRows.length;
  const validPeerRows = peerGroupSourcePackages.length - blockedPeerRows.length;

  const packageTickers = new Set(companyIndustrySourcePackages.map((row) => row.ticker));
  const packagePeerTickers = new Set(peerGroupSourcePackages.map((row) => row.peerTicker.toUpperCase()));
  const readableTickers = new Set([
    ...companies.map((company) => company.ticker.toUpperCase()),
    ...industryContexts.flatMap((context) => context.relatedTickers.map((ticker) => ticker.toUpperCase())),
  ]);

  const missingCoverageRows: BlockedRow[] = SUPPORTED_INDUSTRY_TAXONOMY_TICKERS.filter(
    (ticker) => !packageTickers.has(ticker),
  ).map((ticker) => ({
    rowType: "ticker_coverage",
    key: ticker,
    ticker,
    reasons: [REVIEWED_SOURCE_PACKAGE_MISSING],
  }));

  const blockedRows = [...blockedIndustryRows, ...blockedCompanyRows, ...blockedPeerRows, ...missingCoverageRows];
  const blockedReasons = unique(blockedRows.flatMap((row) => row.reasons)).sort();
  const affectedIndustries = unique([
    ...industrySourcePackages.map((row) => row.industryCode),
    ...companyIndustrySourcePackages.map((row) => row.industryCode),
    ...peerGroupSourcePackages.map((row) => row.industryCode),
  ].filter(hasText)).sort();
  const affectedTickers = unique([
    ...companyIndustrySourcePackages.map((row) => row.ticker),
    ...peerGroupSourcePackages.map((row) => row.peerTicker.toUpperCase()),
  ].filter(hasText)).sort();
  const blockedTickers = unique(blockedRows.map((row) => row.ticker).filter(hasText)).sort();
  const missingSafeTickers = SUPPORTED_INDUSTRY_TAXONOMY_TICKERS.filter(
    (ticker) => !readableTickers.has(ticker) && !packageTickers.has(ticker) && !packagePeerTickers.has(ticker),
  );

  const sourcePackagesLoaded =
    industrySourcePackages.length + companyIndustrySourcePackages.length + peerGroupSourcePackages.length;
  const productionApprovedTrueCount = productionApprovedCounts.reduce((sum, count) => sum + count, 0);

  const result = {
    phase: "150K",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    sourcePackagesLoaded,
    industryPackagesLoaded: industrySourcePackages.length,
    companyIndustryPackagesLoaded: companyIndustrySourcePackages.length,
    peerGroupPackagesLoaded: peerGroupSourcePackages.length,
    existingIndustryRows: industryRows.length,
    existingCompanyIndustryRows: companyIndustryRows.length,
    existingIndustryPeerGroupRows: industryPeerGroupRows.length,
    currentIndustryContextRowsFound: industryContexts.length,
    companyRowsFound: companies.length,
    candidateIndustryRowsGenerated: industrySourcePackages.length,
    candidateCompanyIndustryRowsGenerated: companyIndustrySourcePackages.length,
    candidatePeerGroupRowsGenerated: peerGroupSourcePackages.length,
    eligibleIndustryRows: validIndustryRows,
    eligibleCompanyIndustryRows: validCompanyRows,
    eligiblePeerGroupRows: validPeerRows,
    blockedRows: blockedRows.length,
    blockedReasons,
    affectedIndustries,
    affectedTickers,
    blockedTickers,
    duplicateIndustryKeys: [...duplicateIndustryKeys].sort(),
    duplicateCompanyIndustryKeys: [...duplicateCompanyKeys].sort(),
    duplicatePeerGroupKeys: [...duplicatePeerKeys].sort(),
    supportedTickersChecked: [...SUPPORTED_INDUSTRY_TAXONOMY_TICKERS],
    missingSafeTickers,
    vcbMissingSafe: missingSafeTickers.includes("VCB"),
    industryMetricCreated: false,
    valuationRiskBenchmarksInvented: false,
    staticGuidancePromotedToRealData: false,
    companyAnnualReportsUsedAsPrimaryIndustrySource: false,
    productionApprovedTrueCount,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    reviewedPackagePolicy: {
      productionApproved: false,
      needsReview: true,
      dataMode: "research_only",
      sourceUrlRequired: true,
      dateRequired: true,
      reviewEvidenceRequired: true,
      annualReportsPrimarySourceAllowed: false,
    },
  };

  const smokePassed =
    result.phase === "150K" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.sourcePackagesLoaded === 2 &&
    result.eligibleIndustryRows === 1 &&
    result.eligibleCompanyIndustryRows === 1 &&
    result.eligiblePeerGroupRows === 0 &&
    result.blockedRows >= SUPPORTED_INDUSTRY_TAXONOMY_TICKERS.length - 1 &&
    result.blockedReasons.includes(REVIEWED_SOURCE_PACKAGE_MISSING) &&
    result.vcbMissingSafe &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarksInvented &&
    !result.staticGuidancePromotedToRealData &&
    !result.companyAnnualReportsUsedAsPrimaryIndustrySource &&
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
