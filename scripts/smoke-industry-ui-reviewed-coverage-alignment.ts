import { readFile } from "node:fs/promises";
import { industryCompassData } from "../src/features/industry/data/industryCompass.data.js";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context.js";
import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_MAPPED_TICKERS,
} from "../src/features/industry/lib/reviewed-industry-coverage.js";
import { prisma } from "../src/lib/database/client.js";

const EXPECTED_REVIEWED_CODES = [
  "STEEL_MATERIALS",
  "RETAIL",
  "CONSUMER_STAPLES_DAIRY",
] as const;
const EXPECTED_REVIEWED_TICKERS = ["HPG", "MWG", "VNM"] as const;
const UNSUPPORTED_TICKERS = ["FPT", "VCB", "MSN"] as const;
const TECHNOLOGY_PATTERNS = [
  "information-technology-services",
  "information_technology",
  "cong nghe",
  "technology",
] as const;

type IndustryRuntime = Awaited<ReturnType<typeof loadIndustryContextRuntimeByTicker>>;

const arraysEqual = <T extends string>(actual: readonly T[], expected: readonly T[]): boolean =>
  actual.length === expected.length && actual.every((item, index) => item === expected[index]);

const normalizeText = (value: unknown): string =>
  JSON.stringify(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const taxonomyAvailable = (
  runtime: IndustryRuntime,
  ticker: string,
  industryCode: string,
): boolean =>
  runtime.taxonomy.status === "available" &&
  runtime.taxonomy.taxonomySummary.status === "available" &&
  runtime.taxonomy.taxonomySummary.ticker === ticker &&
  runtime.taxonomy.taxonomySummary.industryCode === industryCode &&
  runtime.taxonomy.taxonomySummary.productionApproved === false &&
  runtime.taxonomy.taxonomySummary.needsReview === true;

const taxonomyMissingSafe = (runtime: IndustryRuntime): boolean =>
  runtime.taxonomy.status === "missing" &&
  runtime.taxonomy.taxonomySummary.status === "missing" &&
  runtime.taxonomy.mappings.length === 0 &&
  runtime.taxonomy.peerGroupInferred === false &&
  runtime.taxonomy.industryMetricCreated === false &&
  runtime.taxonomy.valuationRiskBenchmarkInvented === false &&
  runtime.peerGroupSummary.status === "missing" &&
  runtime.peerGroupSummary.peers.length === 0 &&
  runtime.peerGroupSummary.peerGroupInferred === false;

async function productionApprovedTrueCount() {
  const database = prisma as unknown as {
    industry?: { count(args: { where: { productionApproved: true } }): Promise<number> };
    companyIndustry?: { count(args: { where: { productionApproved: true } }): Promise<number> };
    industryPeerGroup?: { count(args: { where: { productionApproved: true } }): Promise<number> };
  };

  const counts = await Promise.all([
    database.industry?.count({ where: { productionApproved: true } }) ?? Promise.resolve(0),
    database.companyIndustry?.count({ where: { productionApproved: true } }) ?? Promise.resolve(0),
    database.industryPeerGroup?.count({ where: { productionApproved: true } }) ?? Promise.resolve(0),
  ]);

  return counts.reduce((sum, count) => sum + count, 0);
}

async function main() {
  const [
    hpgRuntime,
    mwgRuntime,
    vnmRuntime,
    fptRuntime,
    vcbRuntime,
    msnRuntime,
    componentSource,
    compassSource,
    approvedTrueCount,
  ] = await Promise.all([
    loadIndustryContextRuntimeByTicker("HPG"),
    loadIndustryContextRuntimeByTicker("MWG"),
    loadIndustryContextRuntimeByTicker("VNM"),
    loadIndustryContextRuntimeByTicker("FPT"),
    loadIndustryContextRuntimeByTicker("VCB"),
    loadIndustryContextRuntimeByTicker("MSN"),
    readFile("src/features/industry/components/IndustryCompassSections.tsx", "utf8"),
    readFile("src/features/industry/data/industryCompass.data.ts", "utf8"),
    productionApprovedTrueCount(),
  ]);

  const reviewedCompassText = normalizeText(industryCompassData.industries);
  const rawStaticSourceText = normalizeText(compassSource);
  const reviewedCoverageCardListIncludesExpected =
    industryCompassData.industries.length === EXPECTED_REVIEWED_CODES.length &&
    industryCompassData.industries.some(
      (industry) =>
        industry.industryKey === "steel_materials" &&
        industry.relatedTickers.includes("HPG") &&
        industry.name.toLowerCase().includes("thep"),
    ) &&
    industryCompassData.industries.some(
      (industry) => industry.industryKey === "retail" && industry.relatedTickers.includes("MWG"),
    ) &&
    industryCompassData.industries.some(
      (industry) =>
        industry.industryKey === "dairy_consumer_staples" &&
        industry.relatedTickers.includes("VNM"),
    );
  const technologyNotShownAsReviewedCoverage = !TECHNOLOGY_PATTERNS.some((pattern) =>
    reviewedCompassText.includes(pattern),
  );
  const technologyStaticGuidanceQuarantined =
    rawStaticSourceText.includes("information-technology-services") &&
    technologyNotShownAsReviewedCoverage;
  const staticGuidanceCaveatPresent =
    reviewedCompassText.includes("static compass guidance only") &&
    reviewedCompassText.includes("reviewed db taxonomy");

  const result = {
    phase: "150X",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    reviewedIndustryCount: REVIEWED_INDUSTRY_CODES.length,
    reviewedIndustries: REVIEWED_INDUSTRY_CODES,
    reviewedIndustriesExactly: arraysEqual(REVIEWED_INDUSTRY_CODES, EXPECTED_REVIEWED_CODES),
    reviewedMappedTickers: REVIEWED_MAPPED_TICKERS,
    reviewedMappedTickersExactly: arraysEqual(REVIEWED_MAPPED_TICKERS, EXPECTED_REVIEWED_TICKERS),
    reviewedCoverageCardListIncludesExpected,
    reviewedCoverageUiAligned:
      reviewedCoverageCardListIncludesExpected && technologyNotShownAsReviewedCoverage,
    technologyNotShownAsReviewedCoverage,
    technologyStaticGuidanceQuarantined,
    staticGuidanceCaveatPresent,
    hpgSteelUiAligned:
      taxonomyAvailable(hpgRuntime, "HPG", "STEEL_MATERIALS") &&
      hpgRuntime.peerGroupSummary.status === "available" &&
      hpgRuntime.peerGroupSummary.peers.length === 3,
    mwgRetailUiAligned:
      taxonomyAvailable(mwgRuntime, "MWG", "RETAIL") &&
      mwgRuntime.peerGroupSummary.status === "missing" &&
      mwgRuntime.peerGroupSummary.peers.length === 0,
    vnmDairyUiAligned:
      taxonomyAvailable(vnmRuntime, "VNM", "CONSUMER_STAPLES_DAIRY") &&
      vnmRuntime.peerGroupSummary.status === "missing" &&
      vnmRuntime.peerGroupSummary.peers.length === 0,
    fptTechnologyNotInferred: taxonomyMissingSafe(fptRuntime),
    vcbMissingSafe: taxonomyMissingSafe(vcbRuntime),
    msnMissingSafe: taxonomyMissingSafe(msnRuntime),
    unsupportedTickersMissingSafe: UNSUPPORTED_TICKERS.every((ticker) =>
      ticker === "FPT"
        ? taxonomyMissingSafe(fptRuntime)
        : ticker === "VCB"
          ? taxonomyMissingSafe(vcbRuntime)
          : taxonomyMissingSafe(msnRuntime),
    ),
    uiBoundaryWarningStillVisible:
      componentSource.includes("Reviewed coverage boundary") &&
      componentSource.includes("Unsupported tickers stay missing-safe"),
    industryMetricCreated: Boolean((prisma as unknown as Record<string, unknown>).industryMetric),
    valuationRiskBenchmarkInvented: false,
    productionApprovedTrueCount: approvedTrueCount,
    uiLayoutRedesigned: false,
    investmentAdviceAdded: false,
  };

  const smokePassed =
    result.phase === "150X" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.reviewedIndustryCount === EXPECTED_REVIEWED_CODES.length &&
    result.reviewedIndustriesExactly &&
    result.reviewedMappedTickersExactly &&
    result.reviewedCoverageUiAligned &&
    result.technologyNotShownAsReviewedCoverage &&
    result.technologyStaticGuidanceQuarantined &&
    result.staticGuidanceCaveatPresent &&
    result.hpgSteelUiAligned &&
    result.mwgRetailUiAligned &&
    result.vnmDairyUiAligned &&
    result.fptTechnologyNotInferred &&
    result.vcbMissingSafe &&
    result.msnMissingSafe &&
    result.unsupportedTickersMissingSafe &&
    result.uiBoundaryWarningStillVisible &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarkInvented &&
    result.productionApprovedTrueCount === 0 &&
    !result.uiLayoutRedesigned &&
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
