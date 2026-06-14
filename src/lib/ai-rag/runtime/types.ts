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
  pipeline: Array<"select_rag_documents" | "pack_retrieval_context" | "build_assistant_prompt">;
  noLlmCall: true;
  noApiCall: true;
  selectedDocumentCount: number;
  hasActualRetrievedChunks: false;
  allowedNumericValuesCount: number;
  source?: string | null;
  timestamp?: string | null;
};

export type AssistantRuntimeOutput = {
  selectedDocuments: RetrievalDocument[];
  detectedIntent: RetrievalIntent;
  activeModule: string;
  packedContext: PackedRetrievalContext;
  prompt: BuildAssistantPromptResult;
  warnings: string[];
  safetyLevel: RetrievalSafetyLevel;
  missingContext: string[];
  debug: AssistantRuntimeDebugInfo;
};
