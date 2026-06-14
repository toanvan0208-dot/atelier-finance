import type { RagDocumentChunk, SelectRetrievedChunksInput, SelectRetrievedChunksResult } from "./types";
import { buildRagCorpus } from "./build-rag-corpus";

const PREFERRED_SECTION_TYPES = new Set([
  "concept",
  "safe_template",
  "core_principle",
  "missing_data",
  "interpretation_boundary",
  "purpose",
]);

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

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D")
    .toLowerCase();

const extractKeywords = (value: string): string[] => {
  const normalized = normalizeText(value);
  const words = normalized.match(/[a-z0-9/]+/g) ?? [];

  return Array.from(
    new Set(words.filter((word) => word.length >= 3 && !STOP_WORDS.has(word))),
  );
};

const chunkIsUnsafeForPositiveContext = (chunk: RagDocumentChunk): boolean =>
  chunk.isForbiddenExample || chunk.isNegativeExample || chunk.isTestCase;

const scoreChunk = (chunk: RagDocumentChunk, keywords: string[]): { score: number; reasons: string[] } => {
  const haystack = normalizeText(`${chunk.sectionPath.join(" ")}\n${chunk.text}`);
  let score = 10;
  const reasons = ["selected document"];

  if (PREFERRED_SECTION_TYPES.has(chunk.sectionType)) {
    score += 8;
    reasons.push(`preferred sectionType=${chunk.sectionType}`);
  }

  const matches = keywords.filter((keyword) => haystack.includes(keyword));
  if (matches.length > 0) {
    score += matches.length * 4;
    reasons.push(`keyword matches=${matches.join(",")}`);
  }

  if (chunk.charLength > 240 && chunk.charLength < 4000) {
    score += 2;
    reasons.push("usable chunk length");
  }

  return { score, reasons };
};

export const selectRetrievedChunks = (
  input: SelectRetrievedChunksInput,
): SelectRetrievedChunksResult => {
  const maxChunks = input.maxChunks ?? 4;
  const includeMaintainerDocs = input.includeMaintainerDocs ?? input.intent === "maintainer";
  const corpus = buildRagCorpus({
    documents: input.selectedDocuments,
    safetyLevel: input.safetyLevel,
  });
  const keywords = extractKeywords(`${input.question} ${input.activeModule ?? ""} ${input.intent}`);
  const excludedChunks: RagDocumentChunk[] = [];
  const candidates: Array<{ chunk: RagDocumentChunk; score: number; reasons: string[] }> = [];

  for (const chunk of corpus.chunks) {
    if (chunk.isMaintainerOnly && !includeMaintainerDocs) {
      excludedChunks.push(chunk);
      continue;
    }

    if (chunkIsUnsafeForPositiveContext(chunk)) {
      excludedChunks.push(chunk);
      continue;
    }

    const scored = scoreChunk(chunk, keywords);
    candidates.push({ chunk, ...scored });
  }

  const selected = candidates
    .sort((left, right) => right.score - left.score)
    .slice(0, maxChunks)
    .map(({ chunk, score }) => ({ ...chunk, score }));

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
      scoring: candidates
        .sort((left, right) => right.score - left.score)
        .slice(0, 12)
        .map(({ chunk, score, reasons }) => ({
          chunkId: chunk.chunkId,
          score,
          reasons,
        })),
    },
  };
};
