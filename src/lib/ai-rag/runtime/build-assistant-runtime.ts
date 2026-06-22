import { buildAssistantPrompt } from "../prompts";
import type { AssistantUserIntent } from "../prompts";
import { selectRetrievedChunks } from "../ingestion";
import { packRetrievalContext, selectRagDocuments } from "../retrieval";
import type { RetrievalIntent } from "../retrieval";
import type { AssistantRuntimeInput, AssistantRuntimeOutput } from "./types";

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const resolveRuntimeInput = (input: AssistantRuntimeInput): AssistantRuntimeInput => {
  const packet = input.contextPacket;
  if (!packet) return input;

  const packetQuality = packet.dataQuality;
  const moduleContext = input.moduleContext ?? packet.moduleContext ?? undefined;
  const missingFields = uniqueStrings([
    ...(input.dataQuality?.missingFields ?? []),
    ...packet.missingFields,
  ]);

  return {
    ...input,
    activeModule: packet.activeModule || input.activeModule,
    ticker: input.ticker ?? packet.ticker,
    moduleContext: moduleContext
      ? {
          ...moduleContext,
          missingFields: uniqueStrings([
            ...((moduleContext.missingFields as string[] | undefined) ?? []),
            ...packet.missingFields,
          ]),
          visibleFacts: packet.visibleFacts,
          constraints: packet.constraints,
        }
      : undefined,
    dataQuality: {
      ...input.dataQuality,
      overallStatus: input.dataQuality?.overallStatus ?? packetQuality.status ?? "missing",
      isMockData:
        input.dataQuality?.isMockData ??
        (packetQuality.dataMode === "sample" || packetQuality.dataMode === "mock"),
      missingFields,
      dataMode: packetQuality.dataMode,
      productionApproved: packetQuality.productionApproved,
      sourceName: packetQuality.sourceName,
      sourceLabel: packetQuality.sourceLabel,
      asOf: packetQuality.asOf,
      period: packetQuality.period,
      warnings: packetQuality.warnings,
    },
    allowedNumericValues:
      input.allowedNumericValues ?? packet.allowedNumericValues,
    source:
      input.source ?? packetQuality.sourceName ?? packetQuality.sourceLabel ?? null,
    timestamp: input.timestamp ?? packetQuality.asOf ?? null,
  };
};

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
  const resolvedInput = resolveRuntimeInput(input);
  const selection = selectRagDocuments({
    userQuestion: resolvedInput.question,
    activeModule: resolvedInput.activeModule,
  });
  const packedContext = packRetrievalContext(selection);
  const retrieval = selectRetrievedChunks({
    selectedDocuments: selection.selectedDocuments,
    question: resolvedInput.question,
    activeModule: resolvedInput.activeModule,
    intent: selection.intent,
    safetyLevel: selection.safetyLevel,
    maxChunks: 4,
  });
  const missingContext = buildMissingContext(resolvedInput, retrieval.retrievedChunks.length > 0);
  const warnings = [
    ...selection.warnings,
    ...retrieval.warnings,
  ];

  const prompt = buildAssistantPrompt({
    userQuestion: resolvedInput.question,
    activeModule: resolvedInput.activeModule,
    ticker: resolvedInput.ticker,
    companyName: resolvedInput.companyName,
    userIntent: mapRetrievalIntentToPromptIntent(selection.intent),
    moduleContext: enrichModuleContext(resolvedInput),
    dataQuality: resolvedInput.dataQuality,
    retrievedChunks: retrieval.retrievedChunks,
    contextPacket: input.contextPacket ?? undefined,
  });

  return {
    selectedDocuments: selection.selectedDocuments,
    retrievedChunks: retrieval.retrievedChunks,
    retrieval,
    detectedIntent: selection.intent,
    activeModule: resolvedInput.activeModule,
    packedContext,
    prompt,
    warnings,
    safetyLevel: selection.safetyLevel,
    missingContext,
    contextPacket: input.contextPacket ?? null,
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
      allowedNumericValuesCount: resolvedInput.allowedNumericValues?.length ?? 0,
      source: resolvedInput.source ?? null,
      timestamp: resolvedInput.timestamp ?? null,
    },
  };
};
