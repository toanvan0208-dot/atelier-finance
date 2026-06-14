import type { RagDocumentChunk, SelectRetrievedChunksInput, SelectRetrievedChunksResult } from "./types";
import type { RetrievalIntent } from "../retrieval";
import { buildRagCorpus } from "./build-rag-corpus";

const SECTION_TYPE_WEIGHTS: Record<string, number> = {
  core_principle: 14,
  interpretation_boundary: 13,
  missing_data: 12,
  concept: 10,
  safe_template: 9,
  purpose: 4,
  reference: 1,
  unknown: 0,
};

const STOP_WORDS = new Set([
  "co",
  "la",
  "thi",
  "nay",
  "nhu",
  "nao",
  "gi",
  "khong",
  "dung",
  "the",
  "va",
  "hay",
  "can",
  "mot",
  "this",
  "the",
  "and",
  "or",
  "is",
  "are",
]);

const KEYWORD_ALIASES: Record<string, string[]> = {
  volume: ["khoi luong", "khoiluong", "trading volume"],
  "khoi luong": ["volume", "khoiluong", "trading volume"],
  liquidity: ["thanh khoan", "thanhkhoan"],
  "thanh khoan": ["liquidity", "thanhkhoan"],
  signal: ["tin hieu", "tinhieu", "entry", "exit"],
  "tin hieu": ["signal", "entry", "exit"],
  buy: ["mua", "nen mua"],
  sell: ["ban", "nen ban"],
  eps: ["earnings per share"],
  "p/e": ["pe", "price earnings", "price to earnings"],
  pe: ["p/e", "price earnings", "price to earnings"],
  cfo: ["operating cash flow", "cash flow from operations", "dong tien kinh doanh"],
  profit: ["loi nhuan", "net profit"],
  "loi nhuan": ["profit", "net profit"],
  "cash flow": ["dong tien", "cfo", "operating cash flow"],
  "dong tien": ["cash flow", "cfo", "operating cash flow"],
  risk: ["rui ro", "risk score"],
  "risk score": ["diem rui ro", "rui ro"],
  safe: ["an toan"],
  "an toan": ["safe"],
  checklist: ["bang kiem", "kiem tra"],
  template: ["mau", "document template"],
  metadata: ["frontmatter", "indexing"],
};

const INTENT_HEADING_TERMS: Record<RetrievalIntent, string[]> = {
  pvt: [
    "core principle",
    "must not",
    "interpretation boundaries",
    "safe response templates",
    "preferred answer structure",
    "volume",
    "liquidity",
    "trading value",
  ],
  financial_statements: [
    "core principle",
    "financial statement reading flow",
    "operating cash flow",
    "cash flow statement",
    "net profit",
    "profit",
    "cash flow",
  ],
  valuation: [
    "p/e",
    "pe",
    "eps",
    "khong nen dung p/e",
    "khi nao khong nen dung p/e",
    "diem de hieu sai",
    "valuation warning",
  ],
  risk: [
    "risk score",
    "diem rui ro",
    "diem de hieu sai",
    "ai duoc phep noi",
    "safe",
    "an toan",
  ],
  checklist: [
    "checklist",
    "khuyen nghi",
    "critical-thinking",
    "counter",
    "evidence",
  ],
  maintainer: ["template", "metadata", "document", "governance", "frontmatter"],
  unknown: ["purpose", "core principle", "overview"],
};

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D")
    .toLowerCase();

const extractKeywords = (value: string): string[] => {
  const normalized = normalizeText(value);
  const phrases = [
    "risk score",
    "operating cash flow",
    "cash flow",
    "dong tien",
    "loi nhuan",
    "khoi luong",
    "thanh khoan",
    "tin hieu",
    "p/e",
    "fair value",
  ].filter((phrase) => normalized.includes(phrase));
  const words = normalized.match(/[a-z0-9/]+/g) ?? [];
  const baseKeywords = [...phrases, ...words].filter(
    (word) => word.length >= 3 && !STOP_WORDS.has(word),
  );
  const expanded = baseKeywords.flatMap((keyword) => [
    keyword,
    ...(KEYWORD_ALIASES[keyword] ?? []),
  ]);

  return Array.from(new Set(expanded.map(normalizeText)));
};

const chunkIsUnsafeForPositiveContext = (chunk: RagDocumentChunk): boolean =>
  chunk.isForbiddenExample || chunk.isNegativeExample || chunk.isTestCase;

const findMatches = (value: string, keywords: string[]): string[] =>
  keywords.filter((keyword) => value.includes(keyword));

const scoreChunk = (
  chunk: RagDocumentChunk,
  keywords: string[],
  intent: RetrievalIntent,
): { score: number; matchedKeywords: string[]; reasons: string[] } => {
  const headingText = normalizeText(chunk.sectionPath.join(" "));
  const bodyText = normalizeText(chunk.text);
  const haystack = `${headingText}\n${bodyText}`;
  let score = 10;
  const reasons = ["selected document"];
  const matchedKeywords = findMatches(haystack, keywords);

  const sectionWeight = SECTION_TYPE_WEIGHTS[chunk.sectionType] ?? 0;
  if (sectionWeight > 0) {
    score += sectionWeight;
    reasons.push(`sectionType=${chunk.sectionType}+${sectionWeight}`);
  }

  const headingMatches = findMatches(headingText, keywords);
  if (headingMatches.length > 0) {
    score += headingMatches.length * 9;
    reasons.push(`heading keyword matches=${headingMatches.join(",")}`);
  }

  const bodyOnlyMatches = matchedKeywords.filter((keyword) => !headingMatches.includes(keyword));
  if (bodyOnlyMatches.length > 0) {
    score += bodyOnlyMatches.length * 3;
    reasons.push(`body keyword matches=${bodyOnlyMatches.join(",")}`);
  }

  const intentHeadingMatches = findMatches(
    headingText,
    (INTENT_HEADING_TERMS[intent] ?? []).map(normalizeText),
  );
  if (intentHeadingMatches.length > 0) {
    score += intentHeadingMatches.length * 7;
    reasons.push(`intent heading matches=${intentHeadingMatches.join(",")}`);
  }

  if (chunk.charLength >= 240 && chunk.charLength <= 2200) {
    score += 5;
    reasons.push("ideal chunk length");
  } else if (chunk.charLength > 2200 && chunk.charLength <= 4200) {
    score -= 4;
    reasons.push("long chunk penalty");
  } else if (chunk.charLength > 4200) {
    score -= 14;
    reasons.push("very long chunk penalty");
  } else if (chunk.charLength < 80) {
    score -= 5;
    reasons.push("very short chunk penalty");
  }

  if (chunk.tokenEstimate > 900) {
    score -= 8;
    reasons.push("large token estimate penalty");
  }

  return { score, matchedKeywords, reasons };
};

const applyBudgets = (
  candidates: Array<{ chunk: RagDocumentChunk; score: number; matchedKeywords: string[]; reasons: string[] }>,
  maxChunks: number,
  maxTotalChars: number,
  maxTotalTokenEstimate: number,
): RagDocumentChunk[] => {
  const selected: RagDocumentChunk[] = [];
  let totalChars = 0;
  let totalTokenEstimate = 0;

  for (const candidate of candidates) {
    if (selected.length >= maxChunks) break;

    const nextChars = totalChars + candidate.chunk.charLength;
    const nextTokens = totalTokenEstimate + candidate.chunk.tokenEstimate;

    if (selected.length > 0 && (nextChars > maxTotalChars || nextTokens > maxTotalTokenEstimate)) {
      continue;
    }

    selected.push({ ...candidate.chunk, score: candidate.score });
    totalChars = nextChars;
    totalTokenEstimate = nextTokens;
  }

  return selected;
};

export const selectRetrievedChunks = (
  input: SelectRetrievedChunksInput,
): SelectRetrievedChunksResult => {
  const maxChunks = input.maxChunks ?? 4;
  const maxTotalChars = input.maxTotalChars ?? 7000;
  const maxTotalTokenEstimate = input.maxTotalTokenEstimate ?? 1800;
  const includeMaintainerDocs = input.includeMaintainerDocs ?? input.intent === "maintainer";
  const corpus = buildRagCorpus({
    documents: input.selectedDocuments,
    safetyLevel: input.safetyLevel,
  });
  const keywords = extractKeywords(`${input.question} ${input.activeModule ?? ""} ${input.intent}`);
  const excludedChunks: RagDocumentChunk[] = [];
  const candidates: Array<{ chunk: RagDocumentChunk; score: number; matchedKeywords: string[]; reasons: string[] }> = [];

  for (const chunk of corpus.chunks) {
    if (chunk.isMaintainerOnly && !includeMaintainerDocs) {
      excludedChunks.push(chunk);
      continue;
    }

    if (chunkIsUnsafeForPositiveContext(chunk)) {
      excludedChunks.push(chunk);
      continue;
    }

    const scored = scoreChunk(chunk, keywords, input.intent);
    candidates.push({ chunk, ...scored });
  }

  const sortedCandidates = candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.chunk.charLength - right.chunk.charLength;
  });
  const selected = applyBudgets(
    sortedCandidates,
    maxChunks,
    maxTotalChars,
    maxTotalTokenEstimate,
  );

  return {
    retrievedChunks: selected,
    excludedChunks,
    warnings: [
      ...corpus.warnings,
      ...(selected.length === 0
        ? ["No eligible RAG chunks were selected; prompt must not pretend RAG context exists."]
        : []),
    ],
    debug: {
      corpusChunkCount: corpus.debug.chunkCount,
      candidateChunkCount: candidates.length,
      excludedChunkCount: excludedChunks.length,
      selectedChunkCount: selected.length,
      scoring: sortedCandidates
        .slice(0, 12)
        .map(({ chunk, score, matchedKeywords, reasons }) => ({
          chunkId: chunk.chunkId,
          documentId: chunk.documentId,
          sectionPath: chunk.sectionPath,
          score,
          matchedKeywords,
          reasons,
        })),
    },
  };
};
