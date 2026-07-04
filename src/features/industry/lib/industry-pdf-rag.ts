import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import type { RetrievedPromptChunk } from "../../../lib/ai-rag/prompts";

export type IndustryPdfRagIndustryCode =
  | "STEEL_MATERIALS"
  | "RETAIL"
  | "CONSUMER_STAPLES_DAIRY";

export type IndustryPdfRagSource = {
  industryCode: IndustryPdfRagIndustryCode;
  tickerExample: string;
  sourceKey: string;
  sourceLabel: string;
  filePath: string;
  reportDate: string;
  industryKeywords: string[];
};

export type IndustryPdfRagChunk = {
  chunkId: string;
  industryCode: IndustryPdfRagIndustryCode;
  sourceKey: string;
  sourceLabel: string;
  filePath: string;
  reportDate: string;
  pageNumber: number;
  text: string;
  normalizedText: string;
  riskyForEndUserAnswer: boolean;
};

export type IndustryPdfRagIndex = {
  sources: IndustryPdfRagSource[];
  sourceFilesMissing: string[];
  extractedPdfSummaries: Array<{
    filePath: string;
    pageCount: number;
    title: string | null;
    charCount: number;
  }>;
  chunks: IndustryPdfRagChunk[];
};

export type IndustryPdfRagRetrievalInput = {
  industryCode: IndustryPdfRagIndustryCode;
  question: string;
  topK?: number;
  includeRiskyChunks?: boolean;
};

export type IndustryPdfRagRetrievedChunk = {
  chunkId: string;
  industryCode: IndustryPdfRagIndustryCode;
  sourceKey: string;
  sourceLabel: string;
  filePath: string;
  reportDate: string;
  pageNumber: number;
  score: number;
  snippet: string;
  riskyForEndUserAnswer: boolean;
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

const PYTHON_CANDIDATES = [
  "C:\\Users\\ADMIN\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
  "python",
] as const;

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

const DEFAULT_SOURCES: IndustryPdfRagSource[] = [
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

const RISKY_ANSWER_PATTERNS = [
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

export const getIndustryPdfRagSources = (): IndustryPdfRagSource[] =>
  DEFAULT_SOURCES.map((source) => ({
    ...source,
    industryKeywords: [...source.industryKeywords],
  }));

export const normalizeIndustryPdfRagText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const compactText = (value: string): string => value.replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const hasRiskyIndustryPdfRagAnswerPattern = (value: string): boolean => {
  const normalized = normalizeIndustryPdfRagText(value);
  return RISKY_ANSWER_PATTERNS.some((pattern) => normalized.includes(pattern));
};

export const chunkIndustryPdfRagText = (
  value: string,
  maxLength = 950,
  overlap = 140,
): string[] => {
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

export const buildIndustryPdfRagIndex = (
  sources = getIndustryPdfRagSources(),
): IndustryPdfRagIndex => {
  const sourceFilesMissing = sources
    .filter((source) => !existsSync(source.filePath))
    .map((source) => source.filePath);
  const extractedPdfs =
    sourceFilesMissing.length === 0 ? extractPdfs(sources.map((source) => source.filePath)) : [];
  const byPath = new Map(extractedPdfs.map((pdf) => [pdf.filePath.toLowerCase(), pdf]));

  const chunks = sources.flatMap((source) => {
    const pdf = byPath.get(source.filePath.toLowerCase());
    if (!pdf) return [];

    return pdf.pages.flatMap((page) =>
      chunkIndustryPdfRagText(page.text).map((chunk, index) => ({
        chunkId: `${source.sourceKey}:p${page.pageNumber}:c${index + 1}`,
        industryCode: source.industryCode,
        sourceKey: source.sourceKey,
        sourceLabel: source.sourceLabel,
        filePath: source.filePath,
        reportDate: source.reportDate,
        pageNumber: page.pageNumber,
        text: chunk,
        normalizedText: normalizeIndustryPdfRagText(chunk),
        riskyForEndUserAnswer: hasRiskyIndustryPdfRagAnswerPattern(chunk),
      })),
    );
  });

  return {
    sources,
    sourceFilesMissing,
    extractedPdfSummaries: extractedPdfs.map((pdf) => ({
      filePath: pdf.filePath,
      pageCount: pdf.pageCount,
      title: pdf.metadata.Title ?? null,
      charCount: pdf.pages.reduce((sum, page) => sum + page.text.length, 0),
    })),
    chunks,
  };
};

const termsForQuestion = (
  question: string,
  source: IndustryPdfRagSource,
): string[] => {
  const normalizedQuestion = normalizeIndustryPdfRagText(question);
  const words = normalizedQuestion
    .split(/[^a-z0-9]+/g)
    .filter((word) => word.length >= 4);

  return [...new Set([...words, ...source.industryKeywords.map(normalizeIndustryPdfRagText)])];
};

const scoreChunk = (chunk: IndustryPdfRagChunk, terms: string[]): number =>
  terms.reduce((score, term) => {
    if (!term) return score;
    const matches = chunk.normalizedText.match(new RegExp(escapeRegExp(term), "g"));
    return score + (matches?.length ?? 0);
  }, 0);

const snippetForQuestion = (chunk: IndustryPdfRagChunk, terms: string[]): string => {
  const firstHit = terms.find((term) => chunk.normalizedText.includes(term));
  if (!firstHit) return `${chunk.text.slice(0, 340)}${chunk.text.length > 340 ? "..." : ""}`;

  const index = chunk.normalizedText.indexOf(firstHit);
  const start = Math.max(0, index - 120);
  const snippet = chunk.text.slice(start, start + 420).trim();
  return `${start > 0 ? "..." : ""}${snippet}${start + 420 < chunk.text.length ? "..." : ""}`;
};

export const retrieveIndustryPdfRagChunks = (
  index: IndustryPdfRagIndex,
  input: IndustryPdfRagRetrievalInput,
): IndustryPdfRagRetrievedChunk[] => {
  const source = index.sources.find((candidate) => candidate.industryCode === input.industryCode);
  if (!source) return [];

  const topK = input.topK ?? 3;
  const terms = termsForQuestion(input.question, source);

  return index.chunks
    .filter((chunk) => chunk.industryCode === input.industryCode)
    .filter((chunk) => input.includeRiskyChunks || !chunk.riskyForEndUserAnswer)
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, terms),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.pageNumber - b.chunk.pageNumber)
    .slice(0, topK)
    .map(({ chunk, score }) => ({
      chunkId: chunk.chunkId,
      industryCode: chunk.industryCode,
      sourceKey: chunk.sourceKey,
      sourceLabel: chunk.sourceLabel,
      filePath: chunk.filePath,
      reportDate: chunk.reportDate,
      pageNumber: chunk.pageNumber,
      score,
      snippet: snippetForQuestion(chunk, terms),
      riskyForEndUserAnswer: chunk.riskyForEndUserAnswer,
    }));
};

export const toIndustryPdfRagPromptChunks = (
  chunks: IndustryPdfRagRetrievedChunk[],
): RetrievedPromptChunk[] =>
  chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    documentId: chunk.sourceKey,
    filePath: chunk.filePath,
    title: chunk.sourceLabel,
    sectionPath: [
      chunk.industryCode,
      `reportDate:${chunk.reportDate}`,
      `page:${chunk.pageNumber}`,
    ],
    sectionType: "industry_pdf_report_page",
    score: chunk.score,
    text: [
      `Source: ${chunk.sourceLabel}`,
      `Report date: ${chunk.reportDate}`,
      `Page: ${chunk.pageNumber}`,
      "",
      chunk.snippet,
    ].join("\n"),
  }));
