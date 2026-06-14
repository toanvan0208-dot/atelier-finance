import { buildAssistantPrompt } from "../prompts";
import type { AssistantUserIntent } from "../prompts";
import { selectRetrievedChunks } from "../ingestion";
import { packRetrievalContext, selectRagDocuments } from "../retrieval";
import type { RetrievalIntent } from "../retrieval";
import type { AssistantRuntimeInput, AssistantRuntimeOutput } from "./types";

const mapRetrievalIntentToPromptIntent = (intent: RetrievalIntent): AssistantUserIntent => {
  switch (intent) {
    case "pvt":
      return "pvt_observation";
    case "financial_statements":
      return "financial_statement_reading";
    case "valuation":
      return "valuation_explanation";
    case "risk":
      return "risk_explanation";
    case "checklist":
      return "checklist_review";
    case "maintainer":
      return "maintainer_rag_document";
    case "unknown":
    default:
      return "unknown";
  }
};

const buildMissingContext = (input: AssistantRuntimeInput, hasRetrievedChunks: boolean): string[] => {
  const missing: string[] = [];

  if (!hasRetrievedChunks) missing.push("retrievedChunks");

  if (!input.moduleContext) missing.push("moduleContext");
  if (!input.dataQuality) missing.push("dataQuality");
  if (!input.source) missing.push("source");
  if (!input.timestamp) missing.push("timestamp");

  return missing;
};

const enrichModuleContext = (input: AssistantRuntimeInput): AssistantRuntimeInput["moduleContext"] => {
  const existingContext = input.moduleContext ?? {};

  return {
    ...existingContext,
    moduleKey: existingContext.moduleKey ?? input.activeModule,
    ticker: existingContext.ticker ?? input.ticker ?? null,
    companyName: existingContext.companyName ?? input.companyName ?? null,
    source: input.source ?? existingContext.source ?? null,
    timestamp: input.timestamp ?? existingContext.timestamp ?? null,
    allowedNumericValues: input.allowedNumericValues ?? existingContext.allowedNumericValues ?? [],
  };
};

export const buildAssistantRuntime = (input: AssistantRuntimeInput): AssistantRuntimeOutput => {
  const selection = selectRagDocuments({
    userQuestion: input.question,
    activeModule: input.activeModule,
  });
  const packedContext = packRetrievalContext(selection);
  const retrieval = selectRetrievedChunks({
    selectedDocuments: selection.selectedDocuments,
    question: input.question,
    activeModule: input.activeModule,
    intent: selection.intent,
    safetyLevel: selection.safetyLevel,
    maxChunks: 4,
  });
  const missingContext = buildMissingContext(input, retrieval.retrievedChunks.length > 0);
  const warnings = [
    ...selection.warnings,
    ...retrieval.warnings,
  ];

  const prompt = buildAssistantPrompt({
    userQuestion: input.question,
    activeModule: input.activeModule,
    ticker: input.ticker,
    companyName: input.companyName,
    userIntent: mapRetrievalIntentToPromptIntent(selection.intent),
    moduleContext: enrichModuleContext(input),
    dataQuality: input.dataQuality,
    retrievedChunks: retrieval.retrievedChunks,
  });

  return {
    selectedDocuments: selection.selectedDocuments,
    retrievedChunks: retrieval.retrievedChunks,
    retrieval,
    detectedIntent: selection.intent,
    activeModule: input.activeModule,
    packedContext,
    prompt,
    warnings,
    safetyLevel: selection.safetyLevel,
    missingContext,
    debug: {
      pipeline: [
        "select_rag_documents",
        "pack_retrieval_context",
        "select_retrieved_chunks",
        "build_assistant_prompt",
      ],
      noLlmCall: true,
      noApiCall: true,
      selectedDocumentCount: selection.selectedDocuments.length,
      hasActualRetrievedChunks: retrieval.retrievedChunks.length > 0,
      retrievedChunkCount: retrieval.retrievedChunks.length,
      excludedChunkCount: retrieval.excludedChunks.length,
      allowedNumericValuesCount: input.allowedNumericValues?.length ?? 0,
      source: input.source ?? null,
      timestamp: input.timestamp ?? null,
    },
  };
};
