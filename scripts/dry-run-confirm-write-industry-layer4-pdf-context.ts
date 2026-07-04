import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "158D";
const SOURCE_LABEL_PREFIX = "Phase 158D PDF Layer 4 - ";

type PrismaClientLike = typeof PrismaClientInstance;
type IndustryCode = "STEEL_MATERIALS" | "RETAIL" | "CONSUMER_STAPLES_DAIRY";

export type PdfBackedLayer4Package = {
  industryCode: IndustryCode;
  industryName: "Steel and Materials" | "Retail" | "Consumer Staples - Dairy";
  ticker: "HPG" | "MWG" | "VNM";
  sourceLabel: string;
  localPdfPath: string;
  publicationDate: string;
  contextLanguage: "en";
  overview: string;
  howIndustryMakesMoney: string;
  keyDrivers: string[];
  keyRisks: string[];
  macroSensitivity: string[];
  nextChecks: string[];
  commonMisread: string;
  evidencePagesByField: Record<string, number[]>;
  reviewNote: string;
  warningCodes: string[];
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

type SimulatedWriteResult = {
  industryCode: IndustryCode;
  ticker: string;
  contextAction: "create" | "update";
  provenanceAction: "create" | "update";
  existingIndustryContextId: string | null;
  simulatedSourceLabel: string;
  simulatedSourceUrl: string;
  fullQualitativeFieldsPresent: boolean;
  wouldWriteIndustryContext: true;
  wouldWriteIndustryContextProvenance: true;
};

export const candidatePackages: PdfBackedLayer4Package[] = [
  {
    industryCode: "STEEL_MATERIALS",
    industryName: "Steel and Materials",
    ticker: "HPG",
    sourceLabel: "Local PDF - Bao cao thi truong thep Quy I 2026",
    localPdfPath: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    publicationDate: "2026-05-05",
    contextLanguage: "en",
    overview:
      "Steel and construction-material businesses are exposed to global and domestic steel supply, finished-steel consumption, trade flows, product prices, raw-material costs, and inventory cycles.",
    howIndustryMakesMoney:
      "Revenue is driven by shipped volume, selling price, product mix, utilization, export/domestic mix, and the spread between steel prices and input, energy, and logistics costs.",
    keyDrivers: [
      "Domestic construction and infrastructure demand",
      "Finished-steel consumption and export demand",
      "Raw-material, energy, and logistics cost movement",
      "Inventory discipline during fast price changes",
      "Trade barriers and import/export disruption",
    ],
    keyRisks: [
      "Weak property or construction demand can reduce volume and utilization.",
      "Input-cost pressure can compress margin when selling prices lag.",
      "Trade-defense measures can affect export outlets.",
      "High inventory can hurt cash flow when steel prices reverse.",
    ],
    macroSensitivity: [
      "Infrastructure and construction cycle",
      "Property-cycle and credit conditions",
      "Iron ore, coal, energy, and logistics prices",
      "Exchange-rate movement for imported inputs and export sales",
      "Global trade-policy friction",
    ],
    nextChecks: [
      "Check revenue volume, gross margin, inventory, operating cash flow, and debt trend.",
      "Separate domestic demand signals from export-market signals.",
      "Check whether price increases are demand-led or cost-push.",
    ],
    commonMisread:
      "A steel-market report gives context for demand, cost, trade, and inventory pressure; it does not decide ticker quality or any market action.",
    evidencePagesByField: {
      overview: [1, 2, 3, 4],
      howIndustryMakesMoney: [3, 4, 8],
      keyDrivers: [3, 4, 6, 8],
      keyRisks: [3, 4, 7, 8],
      macroSensitivity: [3, 4, 7, 8],
      nextChecks: [3, 4, 8],
      commonMisread: [3, 4],
    },
    reviewNote:
      "PDF-backed dry run. Source supports steel-market context for production, consumption, prices, raw-material pressure, trade barriers, exports, inventory, and domestic demand. Ticker-specific discussion remains excluded.",
    warningCodes: [
      "PDF_SOURCE_LOCAL_REVIEW_ONLY",
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "NOT_INVESTMENT_ADVICE",
      "NOT_LAYER5_METRIC_COMPARISON",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    industryName: "Consumer Staples - Dairy",
    ticker: "VNM",
    sourceLabel: "Local PDF - Bao cao nganh hang tieu dung trien vong 2026",
    localPdfPath: "D:\\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf",
    publicationDate: "2025-12-04",
    contextLanguage: "en",
    overview:
      "Consumer-staples and dairy demand should be read through household income, purchasing power, consumer confidence, food and input costs, distribution channels, and the shift toward professional retail formats.",
    howIndustryMakesMoney:
      "Revenue depends on repeat household consumption, product mix, pricing, brand reach, distribution coverage, and control of milk, packaging, logistics, and selling costs.",
    keyDrivers: [
      "Household disposable income and purchasing power",
      "Consumer confidence and spending normalization",
      "Food, packaging, logistics, and agricultural input costs",
      "Modern retail and professional distribution channels",
      "Product mix across essential and discretionary consumer categories",
    ],
    keyRisks: [
      "Input-cost pressure can reduce margin if pricing cannot adjust.",
      "Weak household spending can slow volume growth.",
      "Imported food or ingredient competition can pressure local producers.",
      "Promotion and distribution costs can weigh on profitability.",
    ],
    macroSensitivity: [
      "GDP and household-income growth",
      "Food inflation and fuel/logistics costs",
      "Fiscal and monetary policy support for consumption",
      "Exchange-rate movement for imported ingredients or packaging inputs",
    ],
    nextChecks: [
      "Check revenue growth, gross margin, selling expense, working capital, operating cash flow, and debt if present.",
      "Use the consumer report as broad demand context; keep dairy-specific supply and product checks separate.",
      "Confirm whether growth is coming from volume, pricing, or product mix.",
    ],
    commonMisread:
      "A broad consumer-sector report can support demand and cost context for dairy, but it is not a dairy-only conclusion and does not decide ticker quality or any market action.",
    evidencePagesByField: {
      overview: [2, 4, 7, 8],
      howIndustryMakesMoney: [2, 6, 7, 8],
      keyDrivers: [2, 4, 6, 7, 8],
      keyRisks: [6, 7, 8],
      macroSensitivity: [4, 6, 7, 8],
      nextChecks: [2, 6, 7, 8],
      commonMisread: [2, 3],
    },
    reviewNote:
      "PDF-backed dry run. Source supports broad consumer-demand context for the dairy lane through household income, purchasing power, policy support, input-cost effects, and consumer category trends. This is not dairy-only context.",
    warningCodes: [
      "PDF_SOURCE_LOCAL_REVIEW_ONLY",
      "BROAD_CONSUMER_CONTEXT_NOT_DAIRY_ONLY",
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "NOT_INVESTMENT_ADVICE",
      "NOT_LAYER5_METRIC_COMPARISON",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
  {
    industryCode: "RETAIL",
    industryName: "Retail",
    ticker: "MWG",
    sourceLabel: "Local PDF - Nganh ban le",
    localPdfPath: "D:\\nganh_ban_le.pdf",
    publicationDate: "2026-04-30",
    contextLanguage: "en",
    overview:
      "Retail businesses should be read through consumer spending, store and online traffic, modern-chain expansion, rural reach, product assortment, inventory, and operating-cost control.",
    howIndustryMakesMoney:
      "Revenue depends on traffic, conversion, order value, store productivity, online-channel scale, supplier terms, inventory turns, and commercial and logistics cost control.",
    keyDrivers: [
      "Household purchasing power and consumer confidence",
      "Modern retail-chain expansion",
      "Rural and suburban store reach",
      "E-commerce and omnichannel execution",
      "Inventory turnover and assortment discipline",
    ],
    keyRisks: [
      "Demand slowdown can reduce traffic and basket size.",
      "Inventory mismatch can pressure margin and cash flow.",
      "Price competition can reduce gross margin.",
      "Rent, labor, logistics, and finance costs can pressure profit.",
    ],
    macroSensitivity: [
      "GDP and income growth",
      "Inflation and consumer price pressure",
      "Tax or policy support for consumption",
      "Consumer-credit and employment conditions",
      "Imported-goods cost and exchange-rate movement",
    ],
    nextChecks: [
      "Check revenue quality, gross margin, inventory, selling expense, finance cost, and operating cash flow.",
      "Separate same-store demand from expansion-driven growth.",
      "Check whether online growth improves profit or only increases scale.",
    ],
    commonMisread:
      "A retail-industry report provides context for demand, channels, inventory, and costs; ticker-specific sections must not be converted into automated conclusions.",
    evidencePagesByField: {
      overview: [2, 3, 4, 6],
      howIndustryMakesMoney: [2, 3, 4, 6],
      keyDrivers: [2, 3, 4, 6],
      keyRisks: [4, 6],
      macroSensitivity: [4, 6],
      nextChecks: [2, 3, 4, 6],
      commonMisread: [2],
    },
    reviewNote:
      "PDF-backed dry run. Source supports retail Layer 4 context for sales recovery, purchasing power, modern retail-chain expansion, rural reach, e-commerce, and profit-optimization themes. Stock-specific discussion sections remain excluded.",
    warningCodes: [
      "PDF_SOURCE_LOCAL_REVIEW_ONLY",
      "QUALITATIVE_CONTEXT_RESEARCH_ONLY",
      "QUALITATIVE_CONTEXT_NEEDS_REVIEW",
      "TICKER_SPECIFIC_DISCUSSION_EXCLUDED",
      "NOT_INVESTMENT_ADVICE",
      "NOT_LAYER5_METRIC_COMPARISON",
    ],
    dataMode: "research_only",
    needsReview: true,
    productionApproved: false,
  },
];

const read = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of read(filePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const parseDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const jsonList = (values: string[]): string => JSON.stringify(values);
const jsonObject = (value: unknown): string => JSON.stringify(value);
const localPdfSourceUrl = (filePath: string): string => `local-pdf://${basename(filePath)}`;
const contextSourceLabel = (sourceLabel: string): string => `${SOURCE_LABEL_PREFIX}${sourceLabel}`;

const FORBIDDEN_ADVICE_PATTERNS = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\bworth\s+buying\b/i,
  /\battractive\s+investment\b/i,
  /\binvestment\s+(recommendation|signal|call)\b/i,
  /\btrading\s+signal\b/i,
  /\bshould\s+(buy|sell|hold)\b/i,
  /\bkhuyen\s+nghi\s+(mua|ban)\b/i,
  /\bnam\s+giu\b/i,
  /\bdang\s+mua\b/i,
  /\bhap\s+dan\b/i,
] as const;

const LAYER5_OR_SCORING_PATTERNS = [
  /\bvaluation\s+(multiple|range|comparison)\b/i,
  /\brisk\s+(score|ranking)\b/i,
  /\bpeer\s+(valuation|risk)\b/i,
  /\btarget\s+multiple\b/i,
  /\branking\b/i,
  /\bscoring\b/i,
  /\bbenchmark\s+score\b/i,
] as const;

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

const textForPackage = (sourcePackage: PdfBackedLayer4Package): string =>
  [
    sourcePackage.industryCode,
    sourcePackage.industryName,
    sourcePackage.ticker,
    sourcePackage.sourceLabel,
    sourcePackage.publicationDate,
    sourcePackage.overview,
    sourcePackage.howIndustryMakesMoney,
    ...sourcePackage.keyDrivers,
    ...sourcePackage.keyRisks,
    ...sourcePackage.macroSensitivity,
    ...sourcePackage.nextChecks,
    sourcePackage.commonMisread,
    sourcePackage.reviewNote,
    ...sourcePackage.warningCodes,
    sourcePackage.dataMode,
  ].join("\n");

const hasFullLayer4Fields = (sourcePackage: PdfBackedLayer4Package): boolean =>
  Boolean(
    sourcePackage.overview &&
      sourcePackage.howIndustryMakesMoney &&
      sourcePackage.keyDrivers.length > 0 &&
      sourcePackage.keyRisks.length > 0 &&
      sourcePackage.macroSensitivity.length > 0 &&
      sourcePackage.nextChecks.length > 0 &&
      sourcePackage.commonMisread,
  );

export const buildWriteInput = (sourcePackage: PdfBackedLayer4Package) => {
  const asOfDate = parseDate(sourcePackage.publicationDate);
  const sourceLabel = contextSourceLabel(sourcePackage.sourceLabel);
  const sourceUrl = localPdfSourceUrl(sourcePackage.localPdfPath);

  return {
    ticker: sourcePackage.ticker,
    contextWhere: {
      industryName_asOfDate_sourceLabel_contextLanguage: {
        industryName: sourcePackage.industryName,
        asOfDate,
        sourceLabel,
        contextLanguage: sourcePackage.contextLanguage,
      },
    },
    contextData: {
      industryCode: sourcePackage.industryCode,
      industryName: sourcePackage.industryName,
      contextLanguage: sourcePackage.contextLanguage,
      industryOverview: sourcePackage.overview,
      howIndustryMakesMoney: sourcePackage.howIndustryMakesMoney,
      keyDrivers: jsonList(sourcePackage.keyDrivers),
      industryRisks: jsonList(sourcePackage.keyRisks),
      macroSensitivity: jsonList(sourcePackage.macroSensitivity),
      nextChecks: jsonList(sourcePackage.nextChecks),
      commonMisread: sourcePackage.commonMisread,
      relatedTickers: [sourcePackage.ticker],
      asOfDate,
      sourceLabel,
      dataMode: sourcePackage.dataMode,
      productionApproved: false,
      needsReview: true,
    },
    provenanceData: {
      ticker: sourcePackage.ticker,
      industryName: sourcePackage.industryName,
      sourceLabel: sourcePackage.sourceLabel,
      sourceUrl,
      sourceType: "reviewed_manual_note",
      dataMode: sourcePackage.dataMode,
      productionApproved: false,
      needsReview: true,
      publicationDate: parseDate(sourcePackage.publicationDate),
      retrievedAt: parseDate("2026-07-04"),
      extractedQuote: null,
      reviewNote: `${sourcePackage.reviewNote} Evidence pages: ${jsonObject(sourcePackage.evidencePagesByField)}.`,
      warningCodes: jsonList(sourcePackage.warningCodes),
    },
  };
};

export const validatePackage = (sourcePackage: PdfBackedLayer4Package) => {
  const text = textForPackage(sourcePackage);
  const forbiddenAdviceDetected = hasPattern(FORBIDDEN_ADVICE_PATTERNS, text);
  const layer5OrScoringLanguageDetected = hasPattern(LAYER5_OR_SCORING_PATTERNS, text);
  const fullLayer4FieldsPresent = hasFullLayer4Fields(sourcePackage);
  const pdfExists = existsSync(sourcePackage.localPdfPath);

  const blockedReasons = [
    pdfExists ? null : "PDF_FILE_MISSING",
    fullLayer4FieldsPresent ? null : "LAYER4_FIELDS_INCOMPLETE",
    sourcePackage.dataMode === "research_only" ? null : "DATA_MODE_NOT_RESEARCH_ONLY",
    sourcePackage.needsReview ? null : "NEEDS_REVIEW_FALSE_BLOCKED",
    !sourcePackage.productionApproved ? null : "PRODUCTION_APPROVED_TRUE_BLOCKED",
    forbiddenAdviceDetected ? "FORBIDDEN_ADVICE_LANGUAGE_DETECTED" : null,
    layer5OrScoringLanguageDetected ? "LAYER5_OR_SCORING_LANGUAGE_DETECTED" : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    industryCode: sourcePackage.industryCode,
    ticker: sourcePackage.ticker,
    sourceLabel: sourcePackage.sourceLabel,
    pdfExists,
    fullLayer4FieldsPresent,
    forbiddenAdviceDetected,
    layer5OrScoringLanguageDetected,
    eligible: blockedReasons.length === 0,
    blockedReasons,
  };
};

const simulatePackageWrite = async (
  db: PrismaClientLike,
  sourcePackage: PdfBackedLayer4Package,
): Promise<SimulatedWriteResult> => {
  const writeInput = buildWriteInput(sourcePackage);
  const existingContext = await db.industryContext.findUnique({
    where: writeInput.contextWhere,
  });
  const provenanceAction = existingContext
    ? (await db.industryContextProvenance.findUnique({
        where: {
          industryContextId_ticker_sourceLabel_sourceUrl: {
            industryContextId: existingContext.id,
            ticker: writeInput.ticker,
            sourceLabel: writeInput.provenanceData.sourceLabel,
            sourceUrl: writeInput.provenanceData.sourceUrl,
          },
        },
      }))
      ? "update"
      : "create"
    : "create";

  return {
    industryCode: sourcePackage.industryCode,
    ticker: sourcePackage.ticker,
    contextAction: existingContext ? "update" : "create",
    provenanceAction,
    existingIndustryContextId: existingContext?.id ?? null,
    simulatedSourceLabel: writeInput.contextData.sourceLabel,
    simulatedSourceUrl: writeInput.provenanceData.sourceUrl,
    fullQualitativeFieldsPresent: hasFullLayer4Fields(sourcePackage),
    wouldWriteIndustryContext: true,
    wouldWriteIndustryContextProvenance: true,
  };
};

const countProductionApprovedTrue = async (db: PrismaClientLike): Promise<number> => {
  const [contextCount, provenanceCount] = await Promise.all([
    db.industryContext.count({ where: { productionApproved: true } }),
    db.industryContextProvenance.count({ where: { productionApproved: true } }),
  ]);

  return contextCount + provenanceCount;
};

const countIndustryMetricModelPresent = (db: PrismaClientLike): boolean =>
  Boolean((db as unknown as Record<string, unknown>).industryMetric);

const runDryRun = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: PrismaClientLike;
  };

  const validations = candidatePackages.map(validatePackage);
  const blocked = validations.filter((validation) => !validation.eligible);
  const writeInputs = candidatePackages.map(buildWriteInput);
  const simulatedWrites =
    blocked.length === 0
      ? await Promise.all(candidatePackages.map((sourcePackage) => simulatePackageWrite(prisma, sourcePackage)))
      : [];

  const [
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    productionApprovedTrueCount,
  ] = await Promise.all([
    prisma.industryContext.count(),
    prisma.industryContextProvenance.count(),
    countProductionApprovedTrue(prisma),
  ]);

  const contextRowsToCreate = simulatedWrites.filter((row) => row.contextAction === "create").length;
  const provenanceRowsToCreate = simulatedWrites.filter((row) => row.provenanceAction === "create").length;

  const result = {
    phase: PHASE,
    mode: "confirm_write_dry_run_only",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    sourceFilesCommitted: false,
    rawPdfTextCommitted: false,
    candidateContextPackages: candidatePackages.length,
    eligibleContextPackages: validations.filter((validation) => validation.eligible).length,
    blockedContextPackages: blocked.length,
    blockedReasons: [...new Set(blocked.flatMap((validation) => validation.blockedReasons))].sort(),
    simulatedWrites,
    contextRowsWouldCreate: contextRowsToCreate,
    contextRowsWouldUpdate: simulatedWrites.filter((row) => row.contextAction === "update").length,
    provenanceRowsWouldCreate: provenanceRowsToCreate,
    provenanceRowsWouldUpdate: simulatedWrites.filter((row) => row.provenanceAction === "update").length,
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    projectedIndustryContextRowsAfter: industryContextRowsBefore + contextRowsToCreate,
    projectedIndustryContextProvenanceRowsAfter:
      industryContextProvenanceRowsBefore + provenanceRowsToCreate,
    writePayloadPreview: writeInputs.map((writeInput) => ({
      ticker: writeInput.ticker,
      contextWhere: writeInput.contextWhere,
      contextData: writeInput.contextData,
      provenanceData: writeInput.provenanceData,
    })),
    productionApprovedTrueCount,
    forbiddenAdviceDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    buySellHoldDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    targetPriceFairValueUpsideDownsideDetected: validations.some(
      (validation) => validation.forbiddenAdviceDetected,
    ),
    stockAttractivenessDetected: validations.some((validation) => validation.forbiddenAdviceDetected),
    benchmarkRankingScoringDetected: validations.some(
      (validation) => validation.layer5OrScoringLanguageDetected,
    ),
    industryMetricIntroduced: false,
    industryMetricModelPresent: countIndustryMetricModelPresent(prisma),
    layer5MetricComparisonIntroduced: false,
    missingDataZeroFilled: false,
    fakeMockFallbackAsRealDetected: false,
    readyForConfirmWrite:
      candidatePackages.length === 3 &&
      blocked.length === 0 &&
      simulatedWrites.length === 3 &&
      simulatedWrites.every((row) => row.fullQualitativeFieldsPresent) &&
      productionApprovedTrueCount === 0,
    recommendedNextPhase: "Phase 158E - Industry PDF Layer 4 Confirm Write",
  };

  const dryRunPassed =
    result.phase === PHASE &&
    result.mode === "confirm_write_dry_run_only" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    !result.sourceFilesCommitted &&
    !result.rawPdfTextCommitted &&
    result.candidateContextPackages === 3 &&
    result.eligibleContextPackages === 3 &&
    result.blockedContextPackages === 0 &&
    result.simulatedWrites.length === 3 &&
    result.contextRowsWouldCreate + result.contextRowsWouldUpdate === 3 &&
    result.provenanceRowsWouldCreate + result.provenanceRowsWouldUpdate === 3 &&
    result.productionApprovedTrueCount === 0 &&
    !result.forbiddenAdviceDetected &&
    !result.benchmarkRankingScoringDetected &&
    !result.industryMetricIntroduced &&
    !result.industryMetricModelPresent &&
    !result.layer5MetricComparisonIntroduced &&
    !result.missingDataZeroFilled &&
    !result.fakeMockFallbackAsRealDetected &&
    result.readyForConfirmWrite;

  console.log(JSON.stringify({ ...result, dryRunPassed }, null, 2));

  if (!dryRunPassed) {
    process.exitCode = 1;
  }
};

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isDirectRun) {
  let db: PrismaClientLike | null = null;
  runDryRun()
    .then(async () => {
      const databaseModule = (await import("../src/lib/database/client.js")) as {
        prisma: PrismaClientLike;
      };
      db = databaseModule.prisma;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db?.$disconnect();
    });
}
