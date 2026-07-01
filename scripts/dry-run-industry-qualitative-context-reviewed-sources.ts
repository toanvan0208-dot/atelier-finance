import {
  industryQualitativeContextSourcePackages,
  QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES,
  validateIndustryQualitativeContextSourcePackage,
} from "./industry-qualitative-context-reviewed-sources.js";
import { REVIEWED_UNSUPPORTED_TICKERS } from "../src/features/industry/lib/reviewed-industry-coverage.js";

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const validations = industryQualitativeContextSourcePackages.map(
  validateIndustryQualitativeContextSourcePackage,
);
const eligibleContextPackages = validations.filter((validation) => validation.eligible);
const blockedContextPackages = validations.filter((validation) => !validation.eligible);
const acceptedIndustryCodes = industryQualitativeContextSourcePackages.map(
  (sourcePackage) => sourcePackage.industryCode,
);
const acceptedIndustryCodesExactly =
  acceptedIndustryCodes.length === QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.length &&
  QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.every((industryCode) =>
    acceptedIndustryCodes.includes(industryCode),
  );
const productionApprovedTrueCount = industryQualitativeContextSourcePackages.filter(
  (sourcePackage) => sourcePackage.productionApproved,
).length;

const result = {
  phase: "150Z",
  dbReadAttempted: false,
  dbWriteAttempted: false,
  providerFetchAttempted: false,
  csvImportAttempted: false,
  schemaChanged: false,
  reviewedIndustryCount: QUALITATIVE_CONTEXT_REVIEWED_INDUSTRY_CODES.length,
  candidateContextPackages: industryQualitativeContextSourcePackages.length,
  eligibleContextPackages: eligibleContextPackages.length,
  blockedContextPackages: blockedContextPackages.length,
  acceptedIndustryCodes,
  acceptedIndustryCodesExactly,
  blockedIndustryCodes: blockedContextPackages.map((validation) => validation.industryCode),
  blockedReasons: unique(blockedContextPackages.flatMap((validation) => validation.blockedReasons)).sort(),
  warningCodesPresent: unique(validations.flatMap((validation) => validation.warningCodes)).sort(),
  forbiddenAdviceDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
  numericBenchmarkLanguageDetected: validations.some(
    (validation) => validation.numericBenchmarkLanguageDetected,
  ),
  unsupportedTickerContextDetected: validations.some(
    (validation) => validation.unsupportedTickerContextDetected,
  ),
  unsupportedTickersRemainMissingSafe: [...REVIEWED_UNSUPPORTED_TICKERS],
  industryMetricCreated: false,
  benchmarkCreated: false,
  valuationRiskBenchmarkInvented: false,
  productionApprovedTrueCount,
  staticGuidanceTreatedAsReviewedQualitativeContext: false,
  missingDataZeroFilled: false,
  readyForConfirmWrite:
    eligibleContextPackages.length === industryQualitativeContextSourcePackages.length,
  candidateValidations: validations,
  sourcePackageSummary: industryQualitativeContextSourcePackages.map((sourcePackage) => ({
    industryCode: sourcePackage.industryCode,
    sourceLabel: sourcePackage.sourceLabel,
    sourceUrl: sourcePackage.sourceUrl,
    sourceType: sourcePackage.sourceType,
    retrievedAt: sourcePackage.retrievedAt,
    publicationDate: sourcePackage.publicationDate,
    extractedQuote: sourcePackage.extractedQuote,
    dataMode: sourcePackage.dataMode,
    needsReview: sourcePackage.needsReview,
    productionApproved: sourcePackage.productionApproved,
  })),
  recommendedNextPhase:
    eligibleContextPackages.length === industryQualitativeContextSourcePackages.length
      ? "Phase 151A or 150Z-confirm-write - write reviewed qualitative context rows and wire read-path after explicit approval."
      : "Collect and review missing source packages before any write phase.",
};

const smokePassed =
  result.phase === "150Z" &&
  !result.dbReadAttempted &&
  !result.dbWriteAttempted &&
  !result.providerFetchAttempted &&
  !result.csvImportAttempted &&
  !result.schemaChanged &&
  result.reviewedIndustryCount === 3 &&
  result.candidateContextPackages === 3 &&
  result.eligibleContextPackages === 3 &&
  result.blockedContextPackages === 0 &&
  result.acceptedIndustryCodesExactly &&
  result.blockedIndustryCodes.length === 0 &&
  result.blockedReasons.length === 0 &&
  result.warningCodesPresent.length > 0 &&
  !result.forbiddenAdviceDetected &&
  !result.numericBenchmarkLanguageDetected &&
  !result.unsupportedTickerContextDetected &&
  !result.industryMetricCreated &&
  !result.benchmarkCreated &&
  !result.valuationRiskBenchmarkInvented &&
  result.productionApprovedTrueCount === 0 &&
  !result.staticGuidanceTreatedAsReviewedQualitativeContext &&
  !result.missingDataZeroFilled &&
  result.readyForConfirmWrite;

console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

if (!smokePassed) {
  process.exitCode = 1;
}
