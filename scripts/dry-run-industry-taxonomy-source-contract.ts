import { prisma } from "../src/lib/database/client.js";

const SUPPORTED_TICKERS = ["FPT", "MWG", "VNM", "HPG", "MSN", "VCB"] as const;

type SupportedTicker = (typeof SUPPORTED_TICKERS)[number];

type CandidateIndustryRow = {
  industryCode: string | null;
  industryName: string;
  displayNameVi: string;
  sectorCode: string | null;
  sectorName: string | null;
  classificationSystem: string | null;
  description: string | null;
  dataMode: "research_only";
  productionApproved: false;
  needsReview: true;
  sourceUrl: string | null;
  evidenceNote: string | null;
  eligible: boolean;
  blockedReasons: string[];
};

type CandidateCompanyIndustryRow = {
  ticker: SupportedTicker;
  companyFound: boolean;
  industryContextFound: boolean;
  industryCode: string | null;
  industryName: string | null;
  roleType: "primary" | "secondary" | "ambiguous" | "missing";
  segmentDescription: string | null;
  mappingConfidence: "low" | "medium" | "high" | "missing";
  sourceLabel: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  warningCodes: string[];
  dataMode: "research_only" | "missing";
  productionApproved: false;
  needsReview: true;
  eligible: boolean;
  blockedReasons: string[];
};

type CandidatePeerGroupRow = {
  industryCode: string | null;
  industryName: string;
  peerTicker: SupportedTicker;
  peerRole: string;
  inclusionReason: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  warningCodes: string[];
  dataMode: "research_only";
  productionApproved: false;
  needsReview: true;
  eligible: boolean;
  blockedReasons: string[];
};

const MULTI_INDUSTRY_REVIEW_RULES: Record<SupportedTicker, string[]> = {
  FPT: ["technology services", "telecom", "education"],
  MWG: ["retail", "consumer electronics", "grocery or other retail subsegments"],
  VNM: ["dairy", "consumer staples"],
  HPG: ["steel/materials", "possible supplemental agriculture or real estate exposure"],
  MSN: ["consumer", "retail", "food", "possible supplemental materials/mining exposure"],
  VCB: ["banking/financials"],
};

const REQUIRED_MODEL_RECOMMENDATIONS = [
  "Industry",
  "CompanyIndustry",
  "IndustryPeerGroup",
  "IndustryClassificationProvenance or embedded source fields on mapping rows",
];

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const isRealUrl = (value: string | null): boolean =>
  Boolean(value && /^https?:\/\/[^\s]+$/i.test(value) && !/(example|placeholder|mock|sample|todo|tbd)/i.test(value));

const validateSourceBackedMapping = (input: {
  sourceUrl: string | null;
  sourceType: string | null;
  publicationDate: string | null;
  retrievedAt: string | null;
  reviewNote: string | null;
  extractedQuote: string | null;
  productionApproved: false;
  needsReview: true;
}): string[] =>
  [
    isRealUrl(input.sourceUrl) ? null : "MISSING_REAL_SOURCE_URL",
    input.sourceType ? null : "MISSING_SOURCE_TYPE",
    input.publicationDate || input.retrievedAt ? null : "MISSING_PUBLICATION_OR_RETRIEVED_DATE",
    input.reviewNote || input.extractedQuote ? null : "MISSING_REVIEW_NOTE_OR_EXTRACTED_QUOTE",
    input.productionApproved === false ? null : "PRODUCTION_APPROVED_TRUE_BLOCKED",
    input.needsReview === true ? null : "NEEDS_REVIEW_FALSE_BLOCKED",
  ].filter((reason): reason is string => Boolean(reason));

const normalizeTicker = (ticker: string): SupportedTicker | null => {
  const normalized = ticker.trim().toUpperCase();
  return SUPPORTED_TICKERS.find((candidate) => candidate === normalized) ?? null;
};

async function main() {
  const companies = await prisma.company.findMany({
    where: {
      ticker: {
        in: [...SUPPORTED_TICKERS],
      },
    },
    select: {
      ticker: true,
      companyName: true,
      industryCode: true,
      industryName: true,
      dataMode: true,
      profileAsOf: true,
      profileSourceId: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  const contextsByTicker = new Map<SupportedTicker, typeof industryContexts>();
  for (const ticker of SUPPORTED_TICKERS) {
    contextsByTicker.set(
      ticker,
      industryContexts.filter((context) => context.relatedTickers.includes(ticker)),
    );
  }

  const companiesByTicker = new Map(
    companies
      .map((company) => {
        const ticker = normalizeTicker(company.ticker);
        return ticker ? [ticker, company] as const : null;
      })
      .filter((entry): entry is readonly [SupportedTicker, (typeof companies)[number]] => Boolean(entry)),
  );

  const industryIdentityKeys = unique(
    [
      ...industryContexts.map((context) => `${context.industryCode ?? "NO_CODE"}|${context.industryName}`),
      ...companies
        .filter((company) => company.industryName)
        .map((company) => `${company.industryCode ?? "NO_CODE"}|${company.industryName}`),
    ].sort(),
  );

  const candidateIndustryRows: CandidateIndustryRow[] = industryIdentityKeys.map((key) => {
    const [industryCodeValue, industryName] = key.split("|");
    const sourceBackedReasons = validateSourceBackedMapping({
      sourceUrl: null,
      sourceType: null,
      publicationDate: null,
      retrievedAt: null,
      reviewNote: null,
      extractedQuote: null,
      productionApproved: false,
      needsReview: true,
    });
    const blockedReasons = unique([
      industryCodeValue === "NO_CODE" ? "MISSING_INDUSTRY_CODE" : null,
      "MISSING_CLASSIFICATION_SYSTEM",
      "MISSING_SECTOR_CODE",
      "MISSING_SECTOR_NAME",
      ...sourceBackedReasons,
    ].filter((reason): reason is string => Boolean(reason))).sort();

    return {
      industryCode: industryCodeValue === "NO_CODE" ? null : industryCodeValue,
      industryName,
      displayNameVi: industryName,
      sectorCode: null,
      sectorName: null,
      classificationSystem: null,
      description: null,
      dataMode: "research_only",
      productionApproved: false,
      needsReview: true,
      sourceUrl: null,
      evidenceNote: null,
      eligible: false,
      blockedReasons,
    };
  });

  const candidateCompanyIndustryRows: CandidateCompanyIndustryRow[] = SUPPORTED_TICKERS.map((ticker) => {
    const company = companiesByTicker.get(ticker);
    const contexts = contextsByTicker.get(ticker) ?? [];
    const preferredContext = contexts[0] ?? null;
    const roleReviewNeeded = MULTI_INDUSTRY_REVIEW_RULES[ticker].length > 1;
    const sourceBackedReasons = validateSourceBackedMapping({
      sourceUrl: null,
      sourceType: null,
      publicationDate: null,
      retrievedAt: null,
      reviewNote: null,
      extractedQuote: null,
      productionApproved: false,
      needsReview: true,
    });
    const blockedReasons = unique([
      company || preferredContext ? null : "MISSING_COMPANY_AND_INDUSTRY_CONTEXT",
      preferredContext ? null : "MISSING_INDUSTRY_CONTEXT",
      company?.industryCode || preferredContext?.industryCode ? null : "MISSING_INDUSTRY_CODE",
      company?.industryName || preferredContext?.industryName ? null : "MISSING_INDUSTRY_NAME",
      roleReviewNeeded ? "MULTI_INDUSTRY_REVIEW_REQUIRED" : null,
      ...sourceBackedReasons,
    ].filter((reason): reason is string => Boolean(reason))).sort();

    return {
      ticker,
      companyFound: Boolean(company),
      industryContextFound: Boolean(preferredContext),
      industryCode: company?.industryCode ?? preferredContext?.industryCode ?? null,
      industryName: company?.industryName ?? preferredContext?.industryName ?? null,
      roleType: preferredContext ? (roleReviewNeeded ? "ambiguous" : "primary") : "missing",
      segmentDescription: null,
      mappingConfidence: preferredContext ? "low" : "missing",
      sourceLabel: preferredContext?.sourceLabel ?? null,
      sourceUrl: null,
      sourceType: null,
      publicationDate: null,
      retrievedAt: null,
      reviewNote: null,
      extractedQuote: null,
      warningCodes: [
        "TAXONOMY_CONTRACT_DRY_RUN_ONLY",
        "REVIEWED_CLASSIFICATION_SOURCE_REQUIRED",
        ...(roleReviewNeeded ? ["MULTI_INDUSTRY_REVIEW_REQUIRED"] : []),
      ],
      dataMode: preferredContext || company ? "research_only" : "missing",
      productionApproved: false,
      needsReview: true,
      eligible: false,
      blockedReasons,
    };
  });

  const candidatePeerGroupRows: CandidatePeerGroupRow[] = industryContexts.flatMap((context) =>
    context.relatedTickers
      .map(normalizeTicker)
      .filter((ticker): ticker is SupportedTicker => Boolean(ticker))
      .map((ticker) => {
        const sourceBackedReasons = validateSourceBackedMapping({
          sourceUrl: null,
          sourceType: null,
          publicationDate: null,
          retrievedAt: null,
          reviewNote: null,
          extractedQuote: null,
          productionApproved: false,
          needsReview: true,
        });
        const blockedReasons = unique([
          context.industryCode ? null : "MISSING_INDUSTRY_CODE",
          "PEER_GROUP_SOURCE_REQUIRED",
          ...sourceBackedReasons,
        ].filter((reason): reason is string => Boolean(reason))).sort();

        return {
          industryCode: context.industryCode,
          industryName: context.industryName,
          peerTicker: ticker,
          peerRole: "related_ticker_from_research_context",
          inclusionReason:
            "Existing IndustryContext relatedTickers can suggest a future peer-group candidate, but cannot be treated as reviewed peer membership without source provenance.",
          sourceLabel: context.sourceLabel,
          sourceUrl: null,
          sourceType: null,
          publicationDate: null,
          retrievedAt: null,
          reviewNote: null,
          extractedQuote: null,
          warningCodes: ["PEER_GROUP_DRY_RUN_ONLY", "REVIEWED_PEER_SOURCE_REQUIRED"],
          dataMode: "research_only",
          productionApproved: false,
          needsReview: true,
          eligible: false,
          blockedReasons,
        };
      }),
  );

  const blockedRows = [
    ...candidateIndustryRows.filter((row) => !row.eligible).map((row) => ({
      rowType: "Industry",
      key: row.industryName,
      blockedReasons: row.blockedReasons,
    })),
    ...candidateCompanyIndustryRows.filter((row) => !row.eligible).map((row) => ({
      rowType: "CompanyIndustry",
      key: row.ticker,
      blockedReasons: row.blockedReasons,
    })),
    ...candidatePeerGroupRows.filter((row) => !row.eligible).map((row) => ({
      rowType: "IndustryPeerGroup",
      key: `${row.industryName}:${row.peerTicker}`,
      blockedReasons: row.blockedReasons,
    })),
  ];

  const ambiguousTickerMappings = candidateCompanyIndustryRows
    .filter((row) => row.blockedReasons.includes("MULTI_INDUSTRY_REVIEW_REQUIRED"))
    .map((row) => ({
      ticker: row.ticker,
      possibleExposures: MULTI_INDUSTRY_REVIEW_RULES[row.ticker],
    }));

  const missingSafeTickers = candidateCompanyIndustryRows
    .filter((row) => row.blockedReasons.includes("MISSING_INDUSTRY_CONTEXT"))
    .map((row) => row.ticker);

  const productionApprovedTrueCount = [
    ...candidateIndustryRows,
    ...candidateCompanyIndustryRows,
    ...candidatePeerGroupRows,
  ].filter((row) => row.productionApproved).length;

  const result = {
    phase: "150H",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    providerFetchAttempted: false,
    csvImportAttempted: false,
    schemaChanged: false,
    supportedTickersChecked: SUPPORTED_TICKERS,
    currentIndustryContextRowsFound: industryContexts.length,
    companyRowsFound: companies.length,
    candidateIndustryRowsGenerated: candidateIndustryRows.length,
    candidateCompanyIndustryRowsGenerated: candidateCompanyIndustryRows.length,
    candidatePeerGroupRowsGenerated: candidatePeerGroupRows.length,
    eligibleReviewedMappings: 0,
    blockedRows: blockedRows.length,
    blockedReasons: unique(blockedRows.flatMap((row) => row.blockedReasons)).sort(),
    ambiguousTickerMappings,
    multiIndustryTickersDetected: ambiguousTickerMappings.map((row) => row.ticker),
    missingSafeTickers,
    recommendedModels: REQUIRED_MODEL_RECOMMENDATIONS,
    currentSchemaCanSupportTaxonomyWithoutMigration: false,
    industryMetricCreated: false,
    valuationRiskBenchmarksInvented: false,
    staticGuidancePromotedToRealData: false,
    companyAnnualReportsUsedAsPrimaryIndustrySource: false,
    productionApprovedTrueCount,
    missingDataZeroFilled: false,
    investmentAdviceAdded: false,
    candidateIndustryRows,
    candidateCompanyIndustryRows,
    candidatePeerGroupRows,
  };

  const smokePassed =
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.providerFetchAttempted &&
    !result.csvImportAttempted &&
    !result.schemaChanged &&
    result.supportedTickersChecked.length === SUPPORTED_TICKERS.length &&
    result.candidateCompanyIndustryRowsGenerated === SUPPORTED_TICKERS.length &&
    result.eligibleReviewedMappings === 0 &&
    result.blockedRows > 0 &&
    result.missingSafeTickers.includes("VCB") &&
    result.recommendedModels.includes("Industry") &&
    result.recommendedModels.includes("CompanyIndustry") &&
    !result.currentSchemaCanSupportTaxonomyWithoutMigration &&
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
