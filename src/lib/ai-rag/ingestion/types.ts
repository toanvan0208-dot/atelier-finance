import type { RetrievedPromptChunk } from "../prompts";
import type {
  RetrievalDocument,
  RetrievalDocumentId,
  RetrievalIntent,
  RetrievalSafetyLevel,
} from "../retrieval";

export type RagSectionType =
  | "purpose"
  | "core_principle"
  | "concept"
  | "missing_data"
  | "interpretation_boundary"
  | "safe_template"
  | "test_case"
  | "forbidden_example"
  | "reference"
  | "unknown";

export type LoadedMarkdownDocument = {
  document: RetrievalDocument;
  content: string | null;
  warnings: string[];
};

export type RagDocumentChunk = RetrievedPromptChunk & {
  documentId: RetrievalDocumentId;
  title: string;
  sectionPath: string[];
  text: string;
  charLength: number;
  tokenEstimate: number;
  sectionType: RagSectionType;
  isForbiddenExample: boolean;
  isNegativeExample: boolean;
  isTestCase: boolean;
  isMaintainerOnly: boolean;
  safetyLevel?: RetrievalSafetyLevel;
};

export type RagCorpus = {
  chunks: RagDocumentChunk[];
  warnings: string[];
  debug: {
    documentCount: number;
    loadedDocumentCount: number;
    chunkCount: number;
  };
};

export type BuildRagCorpusInput = {
  documents: RetrievalDocument[];
  safetyLevel?: RetrievalSafetyLevel;
};

export type SelectRetrievedChunksInput = {
  selectedDocuments: RetrievalDocument[];
  question: string;
  activeModule?: string;
  intent: RetrievalIntent;
  maxChunks?: number;
  maxTotalChars?: number;
  maxTotalTokenEstimate?: number;
  includeMaintainerDocs?: boolean;
  safetyLevel?: RetrievalSafetyLevel;
};

export type SelectRetrievedChunksResult = {
  retrievedChunks: RagDocumentChunk[];
  excludedChunks: RagDocumentChunk[];
  warnings: string[];
  debug: {
    corpusChunkCount: number;
    candidateChunkCount: number;
    excludedChunkCount: number;
    selectedChunkCount: number;
    scoring: Array<{
      chunkId: string;
      documentId: RetrievalDocumentId;
      sectionPath: string[];
      score: number;
      matchedKeywords: string[];
      reasons: string[];
    }>;
  };
};
