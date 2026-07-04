import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "158C";
const PYTHON_BUNDLED_PATH =
  "C:\\Users\\ADMIN\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";

type PrismaClientLike = typeof PrismaClientInstance;

type IndustryCode = "STEEL_MATERIALS" | "RETAIL" | "CONSUMER_STAPLES_DAIRY";

type PdfBackedLayer4Package = {
  industryCode: IndustryCode;
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

type PdfExtraction = {
  pageCount: number;
  pages: string[];
};

const candidatePackages: PdfBackedLayer4Package[] = [
  {
    industryCode: "STEEL_MATERIALS",
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
      "The PDF supports a steel-market Layer 4 package through its discussion of production, consumption, prices, raw-material pressure, trade barriers, exports, inventory, and domestic demand. Ticker-specific discussion remains excluded from automated conclusions.",
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
      "The PDF supports a broad consumer-demand overlay for the dairy lane through household income, purchasing power, policy support, input-cost effects, and consumer category trends. Because it is not dairy-only, the package remains needs-review and should not replace dairy-specific source context without manual approval.",
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
      "The PDF supports retail Layer 4 context through sales recovery, purchasing power, modern retail-chain expansion, rural reach, e-commerce, and profit-optimization themes. Stock-specific discussion sections remain excluded from automated Layer 4 context.",
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

const pythonExecutable = (): string => {
  if (process.env.PYTHON_PATH && existsSync(process.env.PYTHON_PATH)) return process.env.PYTHON_PATH;
  if (existsSync(PYTHON_BUNDLED_PATH)) return PYTHON_BUNDLED_PATH;
  return "python";
};

const extractPdfText = (filePath: string): PdfExtraction => {
  const pythonCode = [
    "import json, sys",
    "from pypdf import PdfReader",
    "reader = PdfReader(sys.argv[1])",
    "pages = []",
    "for page in reader.pages:",
    "    pages.append(page.extract_text() or '')",
    "print(json.dumps({'pageCount': len(reader.pages), 'pages': pages}, ensure_ascii=False))",
  ].join("\n");

  const output = spawnSync(pythonExecutable(), ["-c", pythonCode, filePath], {
    encoding: "utf-8",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    maxBuffer: 20 * 1024 * 1024,
  });

  if (output.status !== 0 || !output.stdout.trim()) {
    throw new Error(output.stderr.trim() || `Failed to extract PDF text: ${filePath}`);
  }

  return JSON.parse(output.stdout) as PdfExtraction;
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];

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

const textForPackage = (sourcePackage: PdfBackedLayer4Package): string =>
  [
    sourcePackage.industryCode,
    sourcePackage.ticker,
    sourcePackage.sourceLabel,
    sourcePackage.publicationDate,
    sourcePackage.contextLanguage,
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

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

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

const hasEvidencePagesForAllFields = (sourcePackage: PdfBackedLayer4Package): boolean =>
  [
    "overview",
    "howIndustryMakesMoney",
    "keyDrivers",
    "keyRisks",
    "macroSensitivity",
    "nextChecks",
    "commonMisread",
  ].every((field) => (sourcePackage.evidencePagesByField[field] ?? []).length > 0);

const validatePackage = (sourcePackage: PdfBackedLayer4Package) => {
  const packageText = textForPackage(sourcePackage);
  const forbiddenAdviceDetected = hasPattern(FORBIDDEN_ADVICE_PATTERNS, packageText);
  const layer5OrScoringLanguageDetected = hasPattern(LAYER5_OR_SCORING_PATTERNS, packageText);
  const fullLayer4FieldsPresent = hasFullLayer4Fields(sourcePackage);
  const evidencePagesPresent = hasEvidencePagesForAllFields(sourcePackage);
  const pdfExists = existsSync(sourcePackage.localPdfPath);
  const extraction = pdfExists ? extractPdfText(sourcePackage.localPdfPath) : null;
  const pdfTextCharCount = extraction?.pages.join("\n").length ?? 0;
  const pageCount = extraction?.pageCount ?? 0;
  const evidencePages = unique(Object.values(sourcePackage.evidencePagesByField).flat()).sort(
    (left, right) => left - right,
  );
  const evidencePagesWithinPdf = evidencePages.every((page) => page >= 1 && page <= pageCount);

  const blockedReasons = [
    pdfExists ? null : "PDF_FILE_MISSING",
    pageCount > 0 ? null : "PDF_PAGE_COUNT_MISSING",
    pdfTextCharCount >= 1_000 ? null : "PDF_TEXT_INSUFFICIENT",
    fullLayer4FieldsPresent ? null : "LAYER4_FIELDS_INCOMPLETE",
    evidencePagesPresent ? null : "EVIDENCE_PAGES_MISSING",
    evidencePagesWithinPdf ? null : "EVIDENCE_PAGE_OUT_OF_RANGE",
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
    localPdfPath: sourcePackage.localPdfPath,
    publicationDate: sourcePackage.publicationDate,
    pdfExists,
    pageCount,
    pdfTextCharCount,
    fullLayer4FieldsPresent,
    evidencePagesPresent,
    evidencePages,
    evidencePagesWithinPdf,
    warningCodes: sourcePackage.warningCodes,
    forbiddenAdviceDetected,
    layer5OrScoringLanguageDetected,
    eligibleForManualReview: blockedReasons.length === 0,
    blockedReasons,
  };
};

const countIndustryMetricModelPresent = (db: PrismaClientLike): boolean =>
  Boolean((db as unknown as Record<string, unknown>).industryMetric);

const runDryRun = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: PrismaClientLike;
  };

  const validations = candidatePackages.map(validatePackage);
  const eligiblePackages = validations.filter((validation) => validation.eligibleForManualReview);
  const blockedPackages = validations.filter((validation) => !validation.eligibleForManualReview);
  const productionApprovedTrueCountInPackages = candidatePackages.filter(
    (sourcePackage) => sourcePackage.productionApproved,
  ).length;

  const [
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    productionApprovedTrueContextRowsBefore,
    productionApprovedTrueProvenanceRowsBefore,
  ] = await Promise.all([
    prisma.industryContext.count(),
    prisma.industryContextProvenance.count(),
    prisma.industryContext.count({ where: { productionApproved: true } }),
    prisma.industryContextProvenance.count({ where: { productionApproved: true } }),
  ]);

  const result = {
    phase: PHASE,
    mode: "dry_run_only",
    sourceType: "local_pdf_layer4_candidate_packages",
    candidatePackageCount: candidatePackages.length,
    eligiblePackageCount: eligiblePackages.length,
    blockedPackageCount: blockedPackages.length,
    candidatePackages: candidatePackages.map((sourcePackage) => ({
      industryCode: sourcePackage.industryCode,
      ticker: sourcePackage.ticker,
      sourceLabel: sourcePackage.sourceLabel,
      localPdfPath: sourcePackage.localPdfPath,
      publicationDate: sourcePackage.publicationDate,
      overview: sourcePackage.overview,
      howIndustryMakesMoney: sourcePackage.howIndustryMakesMoney,
      keyDrivers: sourcePackage.keyDrivers,
      keyRisks: sourcePackage.keyRisks,
      macroSensitivity: sourcePackage.macroSensitivity,
      nextChecks: sourcePackage.nextChecks,
      commonMisread: sourcePackage.commonMisread,
      evidencePagesByField: sourcePackage.evidencePagesByField,
      reviewNote: sourcePackage.reviewNote,
      warningCodes: sourcePackage.warningCodes,
      dataMode: sourcePackage.dataMode,
      needsReview: sourcePackage.needsReview,
      productionApproved: sourcePackage.productionApproved,
    })),
    validations,
    blockedReasons: unique(blockedPackages.flatMap((validation) => validation.blockedReasons)).sort(),
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    sourceFilesCommitted: false,
    rawPdfTextCommitted: false,
    wouldWriteIndustryContextRows: 0,
    wouldWriteIndustryContextProvenanceRows: 0,
    wouldPrepareIndustryContextRows: candidatePackages.length,
    wouldPrepareIndustryContextProvenanceRows: candidatePackages.length,
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    productionApprovedTrueCount:
      productionApprovedTrueCountInPackages +
      productionApprovedTrueContextRowsBefore +
      productionApprovedTrueProvenanceRowsBefore,
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
    readyForConfirmWriteDryRun:
      candidatePackages.length === 3 &&
      eligiblePackages.length === 3 &&
      blockedPackages.length === 0 &&
      productionApprovedTrueCountInPackages === 0,
    recommendedNextPhase: "Phase 158D - Industry PDF Layer 4 Confirm-Write Dry Run",
  };

  const dryRunPassed =
    result.phase === PHASE &&
    result.mode === "dry_run_only" &&
    result.candidatePackageCount === 3 &&
    result.eligiblePackageCount === 3 &&
    result.blockedPackageCount === 0 &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    !result.sourceFilesCommitted &&
    !result.rawPdfTextCommitted &&
    result.wouldWriteIndustryContextRows === 0 &&
    result.wouldWriteIndustryContextProvenanceRows === 0 &&
    result.wouldPrepareIndustryContextRows === 3 &&
    result.wouldPrepareIndustryContextProvenanceRows === 3 &&
    result.productionApprovedTrueCount === 0 &&
    !result.forbiddenAdviceDetected &&
    !result.benchmarkRankingScoringDetected &&
    !result.industryMetricIntroduced &&
    !result.industryMetricModelPresent &&
    !result.layer5MetricComparisonIntroduced &&
    result.readyForConfirmWriteDryRun;

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
