import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client.js";

const PHASE = "158B";
const PYTHON_BUNDLED_PATH =
  "C:\\Users\\ADMIN\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";

const TARGET_PDFS = [
  {
    industryCode: "STEEL_MATERIALS",
    ticker: "HPG",
    filePath: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    sourceLabel: "Local PDF - Bao cao thi truong thep Quy I 2026",
    reportDate: "2026-05-05",
    expectedTerms: ["thép", "sản xuất", "tiêu thụ", "giá", "nguyên liệu"],
    allowedBusinessSignals: [
      "World and Vietnam steel production and consumption",
      "Steel price movement and raw-material pressure",
      "Domestic demand, exports, inventory, and margin pressure",
    ],
    contextLimitations: [
      "The report is useful for steel market context, not ticker valuation.",
      "Any ticker mentions in the PDF remain excluded from automated conclusions.",
    ],
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    ticker: "VNM",
    filePath: "D:\\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf",
    sourceLabel: "Local PDF - Bao cao nganh hang tieu dung trien vong 2026",
    reportDate: "2025-12-04",
    expectedTerms: ["tiêu dùng", "thu nhập", "hộ gia đình", "sức mua", "bán lẻ"],
    allowedBusinessSignals: [
      "Household income and purchasing-power conditions",
      "Consumer confidence, channel change, and policy support",
      "Broad consumer-staples demand backdrop",
    ],
    contextLimitations: [
      "The report is broad consumer-sector context, not dairy-only context.",
      "The dry run can support macro demand framing for dairy, but needs manual review before replacing dairy-specific source text.",
    ],
  },
  {
    industryCode: "RETAIL",
    ticker: "MWG",
    filePath: "D:\\nganh_ban_le.pdf",
    sourceLabel: "Local PDF - Nganh ban le",
    reportDate: "2026-04-30",
    expectedTerms: ["bán lẻ", "doanh thu", "sức mua", "thương mại điện tử", "chuỗi"],
    allowedBusinessSignals: [
      "Retail sales growth and purchasing-power backdrop",
      "Modern retail chains, rural expansion, and e-commerce channel change",
      "Profit optimization, inventory, costs, and consumer confidence",
    ],
    contextLimitations: [
      "The report contains ticker discussion; this dry run only keeps industry-level context.",
      "Any stock-specific discussion section is excluded from automated Layer 4 context.",
    ],
  },
] as const;

type PrismaClientLike = typeof PrismaClientInstance;
type TargetPdf = (typeof TARGET_PDFS)[number];

type PdfExtraction = {
  pageCount: number;
  pages: string[];
};

type CandidatePdfSource = {
  industryCode: TargetPdf["industryCode"];
  ticker: TargetPdf["ticker"];
  sourceLabel: string;
  filePath: string;
  fileExists: boolean;
  pageCount: number;
  textCharCount: number;
  extractionStatus: "available" | "missing_file" | "extract_failed" | "insufficient_text";
  reportDate: string;
  expectedTermsFound: string[];
  expectedTermsMissing: string[];
  evidencePages: number[];
  allowedBusinessSignals: readonly string[];
  contextLimitations: readonly string[];
  wouldCreateOrUpdateIndustryContext: false;
  wouldCreateOrUpdateIndustryContextProvenance: false;
  dataMode: "research_only";
  needsReview: true;
  productionApproved: false;
};

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

const normalizeText = (value: string): string => value.toLocaleLowerCase("vi-VN");

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const matchingPagesForTerms = (pages: string[], terms: readonly string[]): number[] =>
  unique(
    pages.flatMap((page, pageIndex) => {
      const normalizedPage = normalizeText(page);
      return terms.some((term) => normalizedPage.includes(normalizeText(term))) ? [pageIndex + 1] : [];
    }),
  ).slice(0, 8);

const buildCandidate = (source: TargetPdf): CandidatePdfSource => {
  if (!existsSync(source.filePath)) {
    return {
      ...source,
      fileExists: false,
      pageCount: 0,
      textCharCount: 0,
      extractionStatus: "missing_file",
      expectedTermsFound: [],
      expectedTermsMissing: [...source.expectedTerms],
      evidencePages: [],
      wouldCreateOrUpdateIndustryContext: false,
      wouldCreateOrUpdateIndustryContextProvenance: false,
      dataMode: "research_only",
      needsReview: true,
      productionApproved: false,
    };
  }

  try {
    const extraction = extractPdfText(source.filePath);
    const text = extraction.pages.join("\n");
    const normalizedText = normalizeText(text);
    const expectedTermsFound = source.expectedTerms.filter((term) =>
      normalizedText.includes(normalizeText(term)),
    );
    const expectedTermsMissing = source.expectedTerms.filter(
      (term) => !expectedTermsFound.includes(term),
    );
    const textCharCount = text.length;

    return {
      ...source,
      fileExists: true,
      pageCount: extraction.pageCount,
      textCharCount,
      extractionStatus: textCharCount >= 1_000 ? "available" : "insufficient_text",
      expectedTermsFound,
      expectedTermsMissing,
      evidencePages: matchingPagesForTerms(extraction.pages, source.expectedTerms),
      wouldCreateOrUpdateIndustryContext: false,
      wouldCreateOrUpdateIndustryContextProvenance: false,
      dataMode: "research_only",
      needsReview: true,
      productionApproved: false,
    };
  } catch {
    return {
      ...source,
      fileExists: true,
      pageCount: 0,
      textCharCount: 0,
      extractionStatus: "extract_failed",
      expectedTermsFound: [],
      expectedTermsMissing: [...source.expectedTerms],
      evidencePages: [],
      wouldCreateOrUpdateIndustryContext: false,
      wouldCreateOrUpdateIndustryContextProvenance: false,
      dataMode: "research_only",
      needsReview: true,
      productionApproved: false,
    };
  }
};

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
  /khuyến\s+nghị\s+(mua|bán)/i,
  /giá\s+mục\s+tiêu/i,
  /giá\s+trị\s+hợp\s+lý/i,
  /nắm\s+giữ/i,
  /đáng\s+mua/i,
  /hấp\s+dẫn\s+đầu\s+tư/i,
] as const;

const RANKING_SCORING_PATTERNS = [
  /\branking\b/i,
  /\bscoring\b/i,
  /\bbenchmark\s+score\b/i,
  /xếp\s+hạng\s+cổ\s+phiếu/i,
  /chấm\s+điểm\s+cổ\s+phiếu/i,
] as const;

const textForCandidate = (candidate: CandidatePdfSource): string =>
  [
    candidate.industryCode,
    candidate.ticker,
    candidate.sourceLabel,
    candidate.reportDate,
    ...candidate.expectedTermsFound,
    ...candidate.allowedBusinessSignals,
    ...candidate.contextLimitations,
    candidate.dataMode,
  ].join("\n");

const hasPattern = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

const runDryRun = async () => {
  loadEnvFile(".env");
  const { prisma } = (await import("../src/lib/database/client.js")) as {
    prisma: PrismaClientLike;
  };

  const candidates = TARGET_PDFS.map(buildCandidate);
  const candidateText = candidates.map(textForCandidate).join("\n");
  const forbiddenAdviceDetected = hasPattern(FORBIDDEN_ADVICE_PATTERNS, candidateText);
  const benchmarkRankingScoringDetected = hasPattern(RANKING_SCORING_PATTERNS, candidateText);
  const allPdfReadable = candidates.every((candidate) => candidate.extractionStatus === "available");
  const allExpectedSignalsFound = candidates.every(
    (candidate) => candidate.expectedTermsFound.length >= 3,
  );

  const [industryContextRowsBefore, industryContextProvenanceRowsBefore, productionApprovedTrueCount] =
    await Promise.all([
      prisma.industryContext.count(),
      prisma.industryContextProvenance.count(),
      prisma.industryContext.count({ where: { productionApproved: true } }),
    ]);

  const result = {
    phase: PHASE,
    mode: "dry_run_only",
    sourceType: "local_pdf_reports",
    targetPdfCount: TARGET_PDFS.length,
    candidates,
    allPdfReadable,
    allExpectedSignalsFound,
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    sourceFilesCommitted: false,
    rawPdfTextCommitted: false,
    wouldWriteIndustryContextRows: 0,
    wouldWriteIndustryContextProvenanceRows: 0,
    industryContextRowsBefore,
    industryContextProvenanceRowsBefore,
    productionApprovedTrueCount,
    forbiddenAdviceDetected,
    benchmarkRankingScoringDetected,
    buySellHoldDetected: forbiddenAdviceDetected,
    targetPriceFairValueUpsideDownsideDetected: forbiddenAdviceDetected,
    stockAttractivenessDetected: forbiddenAdviceDetected,
    industryMetricIntroduced: false,
    layer5MetricComparisonIntroduced: false,
    readyForManualReview:
      allPdfReadable &&
      allExpectedSignalsFound &&
      !forbiddenAdviceDetected &&
      !benchmarkRankingScoringDetected &&
      productionApprovedTrueCount === 0,
    recommendedNextPhase: "Phase 158C - Industry PDF Layer 4 Source Package Manual Review",
  };

  const dryRunPassed =
    result.phase === PHASE &&
    result.mode === "dry_run_only" &&
    result.targetPdfCount === 3 &&
    result.allPdfReadable &&
    result.allExpectedSignalsFound &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    !result.sourceFilesCommitted &&
    !result.rawPdfTextCommitted &&
    result.wouldWriteIndustryContextRows === 0 &&
    result.wouldWriteIndustryContextProvenanceRows === 0 &&
    result.productionApprovedTrueCount === 0 &&
    !result.forbiddenAdviceDetected &&
    !result.benchmarkRankingScoringDetected &&
    !result.industryMetricIntroduced &&
    !result.layer5MetricComparisonIntroduced &&
    result.readyForManualReview;

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
