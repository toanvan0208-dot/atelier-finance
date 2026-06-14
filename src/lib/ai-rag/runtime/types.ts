import type {
  AssistantDataQuality,
  AssistantModuleContext,
  BuildAssistantPromptResult,
} from "../prompts";
import type {
  PackedRetrievalContext,
  RetrievalDocument,
  RetrievalIntent,
  RetrievalSafetyLevel,
} from "../retrieval";
import type { RagDocumentChunk, SelectRetrievedChunksResult } from "../ingestion";

export type AssistantRuntimeInput = {
  question: string;
  activeModule: string;
  ticker?: string | null;
  companyName?: string | null;
  moduleContext?: AssistantModuleContext;
  dataQuality?: AssistantDataQuality;
  allowedNumericValues?: Array<number | string>;
  source?: string | null;
  timestamp?: string | null;
};

export type AssistantRuntimeDebugInfo = {
  pipeline: Array<
    | "select_rag_documents"
    | "pack_retrieval_context"
    | "select_retrieved_chunks"
    | "build_assistant_prompt"
  >;
  noLlmCall: true;
  noApiCall: true;
  selectedDocumentCount: number;
  hasActualRetrievedChunks: boolean;
  retrievedChunkCount: number;
  excludedChunkCount: number;
  allowedNumericValuesCount: number;
  source?: string | null;
  timestamp?: string | null;
};

export type AssistantRuntimeOutput = {
  selectedDocuments: RetrievalDocument[];
  retrievedChunks: RagDocumentChunk[];
  retrieval: SelectRetrievedChunksResult;
  detectedIntent: RetrievalIntent;
  activeModule: string;
  packedContext: PackedRetrievalContext;
  prompt: BuildAssistantPromptResult;
  warnings: string[];
  safetyLevel: RetrievalSafetyLevel;
  missingContext: string[];
  debug: AssistantRuntimeDebugInfo;
};
