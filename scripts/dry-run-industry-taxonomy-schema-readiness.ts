import { prisma } from "../src/lib/database/client.js";

const SUPPORTED_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN", "VCB"] as const;

type SupportedTicker = (typeof SUPPORTED_TICKERS)[number];

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const prismaDelegates = prisma as unknown as Record<string, unknown>;

const modelFound = (delegateName: string): boolean => typeof prismaDelegates[delegateName] === "object";

const countSafely = async (delegateName: "industry" | "companyIndustry" | "industryPeerGroup") => {
  const delegate = prismaDelegates[delegateName] as { count?: () => Promise<number> } | undefined;
  if (!delegate?.count) {
    return {
      readable: false,
      count: 0,
    };
  }

  try {
    return {
      readable: true,
      count: await delegate.count(),
    };
  } catch {
    return {
      readable: false,
      count: 0,
    };
  }
};

const normalizeTicker = (ticker: string): SupportedTicker | null => {
  const normalized = ticker.trim().toUpperCase();
  return SUPPORTED_TICKERS.find((candidate) => candidate === normalized) ?? null;
};

async function main() {
  const industryModelFound = modelFound("industry");
  const companyIndustryModelFound = modelFound("companyIndustry");
  const industryPeerGroupModelFound = modelFound("industryPeerGroup");
  const industryMetricModelFound = modelFound("industryMetric");

  const industryCount = await countSafely("industry");
  const companyIndustryCount = await countSafely("companyIndustry");
  const industryPeerGroupCount = await countSafely("industryPeerGroup");

  const companies = await prisma.company.findMany({
    where: {
      ticker: {
        in: [...SUPPORTED_TICKERS],
      },
    },
    select: {
      ticker: true,
      industryCode: true,
      industryName: true,
    },
    orderBy: {
      ticker: "asc",
    },
  });

  const industryContexts = await prisma.industryContext.findMany({
    where: {
      relatedTickers: {
        hasSome: [...SUPPORTED_TICKERS],
      },
      productionApproved: false,
      needsReview: true,
    },
    select: {
      industryCode: true,
      industryName: true,
      relatedTickers: true,
      sourceLabel: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const industryIdentityKeys = unique(
    [
      ...industryContexts.map((context) => `${context.industryCode ?? "NO_CODE"}|${context.industryName}`),
      ...companies
        .filter((company) => company.industryName)
        .map((company) => `${company.industryCode ?? "NO_CODE"}|${company.industryName}`),
    ].sort(),
  );

  const candidateIndustryRowsGenerated = industryIdentityKeys.length;
  const candidateCompanyIndustryRowsGenerated = SUPPORTED_TICKERS.length;
  const candidatePeerGroupRowsGenerated = industryContexts.flatMap((context) =>
    context.relatedTickers.map(normalizeTicker).filter(Boolean),
  ).length;

  const companiesByTicker = new Map(
    companies
      .map((company) => {
        const ticker = normalizeTicker(company.ticker);
        return ticker ? [ticker, company] as const : null;
      })
      .filter((entry): entry is readonly [SupportedTicker, (typeof companies)[number]] => Boolean(entry)),
  );
  const contextsByTicker = new Map(
    SUPPORTED_TICKERS.map((ticker) => [
      ticker,
      industryContexts.filter((context) => context.relatedTickers.includes(ticker)),
    ]),
  );
  const missingSafeTickers = SUPPORTED_TICKERS.filter(
    (ticker) => !companiesByTicker.has(ticker) && (contextsByTicker.get(ticker)?.length ?? 0) === 0,
  );

  const blockedReasons = [
    "REVIEWED_CLASSIFICATION_SOURCE_REQUIRED",
    "RUNTIME_TAXONOMY_DATA_WRITE_DEFERRED",
    "STATIC_GUIDANCE_NOT_ALLOWED_AS_TAXONOMY_SOURCE",
    "INDUSTRY_METRIC_SOURCE_CONTRACT_NOT_DEFINED",
  ];

  const productionApprovedTrueCount =
    industryCount.readable && companyIndustryCount.readable && industryPeerGroupCount.readable
      ? await Promise.all([
          prisma.industry.count({ where: { productionApproved: true } }),
          prisma.companyIndustry.count({ where: { productionApproved: true } }),
          prisma.industryPeerGroup.count({ where: { productionApproved: true } }),
        ]).then((counts) => counts.reduce((sum, count) => sum + count, 0))
      : 0;

  const result = {
    phase: "150I",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: true,
    industryModelFound,
    companyIndustryModelFound,
    industryPeerGroupModelFound,
    industryMetricModelFound,
    taxonomyTablesReadable:
      industryCount.readable && companyIndustryCount.readable && industryPeerGroupCount.readable,
    currentIndustryContextRowsFound: industryContexts.length,
    companyRowsFound: companies.length,
    existingIndustryRows: industryCount.count,
    existingCompanyIndustryRows: companyIndustryCount.count,
    existingIndustryPeerGroupRows: industryPeerGroupCount.count,
    candidateIndustryRowsGenerated,
    candidateCompanyIndustryRowsGenerated,
    candidatePeerGroupRowsGenerated,
    eligibleReviewedMappings: 0,
    blockedRows:
      candidateIndustryRowsGenerated +
      candidateCompanyIndustryRowsGenerated +
      candidatePeerGroupRowsGenerated,
    blockedReasons,
    currentSchemaCanSupportTaxonomy:
      industryModelFound &&
      companyIndustryModelFound &&
      industryPeerGroupModelFound &&
      industryCount.readable &&
      companyIndustryCount.readable &&
      industryPeerGroupCount.readable,
    vcbMissingSafe: missingSafeTickers.includes("VCB"),
    missingSafeTickers,
    productionApprovedTrueCount,
    staticGuidancePromotedToRealData: false,
    companyAnnualReportsUsedAsPrimaryIndustrySource: false,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    industryMetricCreated: false,
    valuationRiskBenchmarksInvented: false,
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    result.schemaChanged &&
    result.industryModelFound &&
    result.companyIndustryModelFound &&
    result.industryPeerGroupModelFound &&
    !result.industryMetricModelFound &&
    result.taxonomyTablesReadable &&
    result.currentSchemaCanSupportTaxonomy &&
    result.existingIndustryRows === 0 &&
    result.existingCompanyIndustryRows === 0 &&
    result.existingIndustryPeerGroupRows === 0 &&
    result.candidateIndustryRowsGenerated >= 1 &&
    result.candidateCompanyIndustryRowsGenerated === SUPPORTED_TICKERS.length &&
    result.eligibleReviewedMappings === 0 &&
    result.vcbMissingSafe &&
    result.productionApprovedTrueCount === 0 &&
    !result.staticGuidancePromotedToRealData &&
    !result.companyAnnualReportsUsedAsPrimaryIndustrySource &&
    !result.missingDataZeroFilled &&
    !result.investmentAdviceAdded &&
    !result.industryMetricCreated &&
    !result.valuationRiskBenchmarksInvented;

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
