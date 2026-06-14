import { buildAssistantPrompt } from "../prompts";
import type { AssistantUserIntent } from "../prompts";
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

const buildMissingContext = (input: AssistantRuntimeInput): string[] => {
  const missing: string[] = ["retrievedChunks"];

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
  const missingContext = buildMissingContext(input);
  const warnings = [
    ...selection.warnings,
    "No actual retrieved chunks are provided in Phase 4 runtime; selected documents are references for the future retrieval layer.",
  ];

  const prompt = buildAssistantPrompt({
    userQuestion: input.question,
    activeModule: input.activeModule,
    ticker: input.ticker,
    companyName: input.companyName,
    userIntent: mapRetrievalIntentToPromptIntent(selection.intent),
    moduleContext: enrichModuleContext(input),
    dataQuality: input.dataQuality,
    retrievedChunks: [],
  });

  return {
    selectedDocuments: selection.selectedDocuments,
    detectedIntent: selection.intent,
    activeModule: input.activeModule,
    packedContext,
    prompt,
    warnings,
    safetyLevel: selection.safetyLevel,
    missingContext,
    debug: {
      pipeline: ["select_rag_documents", "pack_retrieval_context", "build_assistant_prompt"],
      noLlmCall: true,
      noApiCall: true,
      selectedDocumentCount: selection.selectedDocuments.length,
      hasActualRetrievedChunks: false,
      allowedNumericValuesCount: input.allowedNumericValues?.length ?? 0,
      source: input.source ?? null,
      timestamp: input.timestamp ?? null,
    },
  };
};
