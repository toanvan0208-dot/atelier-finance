import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const PHASE = "160A";

const PYTHON_CANDIDATES = [
  "C:\\Users\\ADMIN\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
  "python",
] as const;

type IndustryCode = "STEEL_MATERIALS" | "RETAIL" | "CONSUMER_STAPLES_DAIRY";

type PdfSource = {
  industryCode: IndustryCode;
  tickerExample: string;
  sourceKey: string;
  sourceLabel: string;
  filePath: string;
  reportDate: string;
  industryKeywords: string[];
};

type ExtractedPage = {
  pageNumber: number;
  text: string;
};

type ExtractedPdf = {
  filePath: string;
  pageCount: number;
  metadata: Record<string, string | null>;
  pages: ExtractedPage[];
};

type RagChunk = {
  chunkId: string;
  industryCode: IndustryCode;
  sourceKey: string;
  sourceLabel: string;
  filePath: string;
  pageNumber: number;
  text: string;
  normalizedText: string;
  riskyForEndUserAnswer: boolean;
};

type RetrievalCase = {
  industryCode: IndustryCode;
  question: string;
  topK: number;
};

type RetrievedChunk = {
  chunkId: string;
  sourceLabel: string;
  pageNumber: number;
  score: number;
  snippet: string;
};

const PDF_SOURCES: PdfSource[] = [
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    sourceKey: "local_pdf_steel_q1_2026",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    filePath: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    reportDate: "2026-05-05",
    industryKeywords: [
      "thep",
      "san luong",
      "tieu thu",
      "gia thep",
      "quang sat",
      "than",
      "ton kho",
      "bien loi nhuan",
    ],
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    sourceKey: "local_pdf_retail_2026",
    sourceLabel: "Local PDF - Retail sector",
    filePath: "D:\\nganh_ban_le.pdf",
    reportDate: "2026-04-30",
    industryKeywords: [
      "ban le",
      "tong muc ban le",
      "doanh thu",
      "suc mua",
      "thuong mai dien tu",
      "ton kho",
      "bien gop",
      "chi phi",
    ],
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    tickerExample: "VNM",
    sourceKey: "local_pdf_consumer_staples_2026",
    sourceLabel: "Local PDF - Consumer staples outlook 2026",
    filePath: "D:\\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf",
    reportDate: "2025-12-08",
    industryKeywords: [
      "sua",
      "hang tieu dung",
      "fmcg",
      "suc mua",
      "thu nhap",
      "kenh ban hang",
      "nguyen lieu",
      "bien loi nhuan",
    ],
  },
];

const RETRIEVAL_CASES: RetrievalCase[] = [
  {
    industryCode: "STEEL_MATERIALS",
    question: "Nganh thep can doc nhung driver nao ve san luong, gia ban, nguyen lieu va ton kho?",
    topK: 3,
  },
  {
    industryCode: "RETAIL",
    question: "Nganh ban le can theo doi suc mua, doanh thu, kenh online va ton kho nhu the nao?",
    topK: 3,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    question: "Nhom sua va hang tieu dung can doc suc mua, thu nhap, kenh ban hang va chi phi dau vao ra sao?",
    topK: 3,
  },
];

const PDF_EXTRACT_SCRIPT = String.raw`
import json
import sys
import pdfplumber

output = []
for path in sys.argv[1:]:
    with pdfplumber.open(path) as pdf:
        output.append({
            "filePath": path,
            "pageCount": len(pdf.pages),
            "metadata": {str(k): (None if v is None else str(v)) for k, v in (pdf.metadata or {}).items()},
            "pages": [
                {"pageNumber": index + 1, "text": page.extract_text() or ""}
                for index, page in enumerate(pdf.pages)
            ],
        })

print(json.dumps(output, ensure_ascii=False))
`;

const normalizeForSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const compactText = (value: string): string => value.replace(/\s+/g, " ").trim();

const chunkText = (value: string, maxLength = 950, overlap = 140): string[] => {
  const compact = compactText(value);
  if (!compact) return [];
  if (compact.length <= maxLength) return [compact];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < compact.length) {
    const hardEnd = Math.min(cursor + maxLength, compact.length);
    const sentenceEnd = compact.lastIndexOf(".", hardEnd);
    const end = sentenceEnd > cursor + maxLength * 0.6 ? sentenceEnd + 1 : hardEnd;
    chunks.push(compact.slice(cursor, end).trim());
    if (end >= compact.length) break;
    cursor = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean);
};

const riskyAnswerPatterns = [
  "khuyen nghi mua",
  "khuyen nghi ban",
  "nen mua",
  "nen ban",
  "dang mua",
  "gia muc tieu",
  "gia tri hop ly",
  "target price",
  "fair value",
  "upside",
  "downside",
  "buy rating",
  "sell rating",
  "hold rating",
  "investment recommendation",
  "trading signal",
] as const;

const hasRiskyAnswerPattern = (value: string): boolean => {
  const normalized = normalizeForSearch(value);
  return riskyAnswerPatterns.some((pattern) => normalized.includes(pattern));
};

const findPython = (): string => {
  const found = PYTHON_CANDIDATES.find((candidate) => candidate === "python" || existsSync(candidate));
  if (!found) {
    throw new Error("No Python executable available for PDF extraction.");
  }
  return found;
};

const extractPdfs = (filePaths: string[]): ExtractedPdf[] => {
  const output = execFileSync(findPython(), ["-c", PDF_EXTRACT_SCRIPT, ...filePaths], {
    encoding: "utf-8",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    maxBuffer: 96 * 1024 * 1024,
  });

  return JSON.parse(output) as ExtractedPdf[];
};

const buildChunks = (sources: PdfSource[], extractedPdfs: ExtractedPdf[]): RagChunk[] => {
  const byPath = new Map(extractedPdfs.map((pdf) => [pdf.filePath.toLowerCase(), pdf]));

  return sources.flatMap((source) => {
    const pdf = byPath.get(source.filePath.toLowerCase());
    if (!pdf) return [];

    return pdf.pages.flatMap((page) =>
      chunkText(page.text).map((chunk, index) => ({
        chunkId: `${source.sourceKey}:p${page.pageNumber}:c${index + 1}`,
        industryCode: source.industryCode,
        sourceKey: source.sourceKey,
        sourceLabel: source.sourceLabel,
        filePath: source.filePath,
        pageNumber: page.pageNumber,
        text: chunk,
        normalizedText: normalizeForSearch(chunk),
        riskyForEndUserAnswer: hasRiskyAnswerPattern(chunk),
      })),
    );
  });
};

const termsForQuestion = (question: string, source: PdfSource): string[] => {
  const normalizedQuestion = normalizeForSearch(question);
  const words = normalizedQuestion
    .split(/[^a-z0-9]+/g)
    .filter((word) => word.length >= 4);

  return [...new Set([...words, ...source.industryKeywords.map(normalizeForSearch)])];
};

const scoreChunk = (chunk: RagChunk, terms: string[]): number =>
  terms.reduce((score, term) => {
    if (!term) return score;
    const matches = chunk.normalizedText.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
    return score + (matches?.length ?? 0);
  }, 0);

const snippetForQuestion = (chunk: RagChunk, terms: string[]): string => {
  const firstHit = terms.find((term) => chunk.normalizedText.includes(term));
  if (!firstHit) return `${chunk.text.slice(0, 340)}${chunk.text.length > 340 ? "..." : ""}`;

  const index = chunk.normalizedText.indexOf(firstHit);
  const start = Math.max(0, index - 120);
  const snippet = chunk.text.slice(start, start + 420).trim();
  return `${start > 0 ? "..." : ""}${snippet}${start + 420 < chunk.text.length ? "..." : ""}`;
};

const retrieve = (testCase: RetrievalCase, sources: PdfSource[], chunks: RagChunk[]): RetrievedChunk[] => {
  const source = sources.find((candidate) => candidate.industryCode === testCase.industryCode);
  if (!source) return [];

  const terms = termsForQuestion(testCase.question, source);

  return chunks
    .filter((chunk) => chunk.industryCode === testCase.industryCode && !chunk.riskyForEndUserAnswer)
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, terms),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.pageNumber - b.chunk.pageNumber)
    .slice(0, testCase.topK)
    .map(({ chunk, score }) => ({
      chunkId: chunk.chunkId,
      sourceLabel: chunk.sourceLabel,
      pageNumber: chunk.pageNumber,
      score,
      snippet: snippetForQuestion(chunk, terms),
    }));
};

const countByIndustry = (chunks: RagChunk[]): Record<IndustryCode, number> => ({
  STEEL_MATERIALS: chunks.filter((chunk) => chunk.industryCode === "STEEL_MATERIALS").length,
  RETAIL: chunks.filter((chunk) => chunk.industryCode === "RETAIL").length,
  CONSUMER_STAPLES_DAIRY: chunks.filter((chunk) => chunk.industryCode === "CONSUMER_STAPLES_DAIRY").length,
});

const sourceFilesMissing = PDF_SOURCES.filter((source) => !existsSync(source.filePath)).map(
  (source) => source.filePath,
);

const extractedPdfs =
  sourceFilesMissing.length === 0 ? extractPdfs(PDF_SOURCES.map((source) => source.filePath)) : [];
const chunks = buildChunks(PDF_SOURCES, extractedPdfs);
const retrievalResults = RETRIEVAL_CASES.map((testCase) => ({
  ...testCase,
  retrievedChunks: retrieve(testCase, PDF_SOURCES, chunks),
}));

const result = {
  phase: PHASE,
  mode: "industry_pdf_rag_dry_run_only",
  sourceType: "local_pdf_reports",
  dbReadAttempted: false,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  assistantPromptChanged: false,
  uiChanged: false,
  sourcePdfCommitted: false,
  rawPdfTextCommitted: false,
  vectorDbIntroduced: false,
  dbIndexWriteAttempted: false,
  industryMetricWriteAttempted: false,
  benchmarkRankingScoringIntroduced: false,
  buySellHoldIntroduced: false,
  targetPriceFairValueUpsideDownsideIntroduced: false,
  stockAttractivenessIntroduced: false,
  pdfSourcesChecked: PDF_SOURCES.map((source) => ({
    industryCode: source.industryCode,
    tickerExample: source.tickerExample,
    sourceKey: source.sourceKey,
    sourceLabel: source.sourceLabel,
    filePath: source.filePath,
    fileExists: existsSync(source.filePath),
    reportDate: source.reportDate,
  })),
  sourceFilesMissing,
  extractedPdfSummaries: extractedPdfs.map((pdf) => ({
    filePath: pdf.filePath,
    pageCount: pdf.pageCount,
    title: pdf.metadata.Title ?? null,
    charCount: pdf.pages.reduce((sum, page) => sum + page.text.length, 0),
  })),
  totalChunksBuilt: chunks.length,
  chunkCountsByIndustry: countByIndustry(chunks),
  riskyChunksExcludedFromRetrieval: chunks.filter((chunk) => chunk.riskyForEndUserAnswer).length,
  retrievalResults,
  retrievalCasesPassed: retrievalResults.every((item) => item.retrievedChunks.length >= 2),
  ragRuntimeIntegrated: false,
  assistantRagAnswerGenerated: false,
  readyForRagPrototype:
    sourceFilesMissing.length === 0 &&
    chunks.length > 0 &&
    retrievalResults.every((item) => item.retrievedChunks.length >= 2),
  recommendedNextPhase: "Phase 160B - Industry PDF RAG Prototype Read Path",
};

const dryRunPassed =
  result.phase === PHASE &&
  result.mode === "industry_pdf_rag_dry_run_only" &&
  result.sourceFilesMissing.length === 0 &&
  result.totalChunksBuilt > 0 &&
  result.retrievalCasesPassed &&
  !result.dbReadAttempted &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.providerFetchAttempted &&
  !result.assistantPromptChanged &&
  !result.uiChanged &&
  !result.sourcePdfCommitted &&
  !result.rawPdfTextCommitted &&
  !result.vectorDbIntroduced &&
  !result.dbIndexWriteAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.benchmarkRankingScoringIntroduced &&
  !result.buySellHoldIntroduced &&
  !result.targetPriceFairValueUpsideDownsideIntroduced &&
  !result.stockAttractivenessIntroduced &&
  !result.ragRuntimeIntegrated &&
  !result.assistantRagAnswerGenerated &&
  result.readyForRagPrototype;

console.log(JSON.stringify({ ...result, dryRunPassed }, null, 2));

if (!dryRunPassed) {
  process.exitCode = 1;
}
