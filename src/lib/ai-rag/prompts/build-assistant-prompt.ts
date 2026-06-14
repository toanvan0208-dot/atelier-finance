import { getModulePromptConfig } from "./module-prompt-map";
import type {
  AssistantDataQuality,
  AssistantModuleContext,
  BuildAssistantPromptInput,
  BuildAssistantPromptResult,
  RetrievedPromptChunk,
} from "./types";

const GLOBAL_GUARDRAIL_REMINDERS = [
  "Never recommend buy/sell/hold or tell the user what trade action to take.",
  "Never predict price direction.",
  "Never fabricate data outside the provided context.",
  "Missing data must be represented as null/not_available/insufficient_data; never replace missing data with zero.",
  "Do not divide by zero or interpret ratios when denominators are missing, zero, or invalid.",
  "PVT is market observation, not a trading signal.",
  "Risk score is not a final safe/bad stock conclusion.",
  "Checklist is not an investment recommendation.",
  "RAG_DOCUMENT_TEMPLATE.md and RAG_METADATA_STANDARD.md are maintainer-intent only; do not use them for end-user financial answers.",
];

const formatList = (title: string, values: string[]): string => {
  if (values.length === 0) return `${title}: none`;

  return `${title}:\n${values.map((value) => `- ${value}`).join("\n")}`;
};

const formatJsonBlock = (title: string, value: unknown): string =>
  `${title}:\n${JSON.stringify(value ?? null, null, 2)}`;

const uniqueStrings = (values: Array<string | undefined | null>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const collectMissingFields = (
  moduleContext?: AssistantModuleContext,
  dataQuality?: AssistantDataQuality,
): string[] =>
  uniqueStrings([
    ...(moduleContext?.missingFields ?? []),
    ...(dataQuality?.missingFields ?? []),
  ]);

const buildSystemMessage = (input: BuildAssistantPromptInput): string => {
  const moduleConfig = getModulePromptConfig(input.activeModule);
  const guardrails = uniqueStrings([
    ...GLOBAL_GUARDRAIL_REMINDERS,
    ...moduleConfig.guardrails,
  ]);

  return [
    "You are the Atelier Finance AI assistant.",
    "Role: explain provided financial context, data quality, missing inputs, risk, valuation, PVT, and checklist discipline for a beginner-friendly analysis workflow.",
    "",
    formatList("Mandatory guardrails", guardrails),
    "",
    `Active module: ${moduleConfig.label}`,
    `Module goal: ${moduleConfig.goal}`,
    formatList("Module focus", moduleConfig.focus),
    "",
    "Response style:",
    "- Be concise and structured for a sidebar/panel.",
    "- Separate data, interpretation, limitations, and next checks.",
    "- If context is insufficient, say so explicitly.",
    "- Do not use negative examples or forbidden outputs as valid answer content.",
  ].join("\n");
};

const formatDataQuality = (dataQuality?: AssistantDataQuality): string => {
  if (!dataQuality) {
    return "Data quality: not provided";
  }

  return [
    `Data quality status: ${dataQuality.overallStatus ?? "unknown"}`,
    `Mock/sample data: ${dataQuality.isMockData ? "yes" : "no"}`,
    formatList("Missing fields", dataQuality.missingFields ?? []),
    formatList("Stale fields", dataQuality.staleFields ?? []),
    formatList("Low confidence fields", dataQuality.lowConfidenceFields ?? []),
    formatList("Invalid fields", dataQuality.invalidFields ?? []),
    formatList("Source issues", dataQuality.sourceIssues ?? []),
    formatList("Period issues", dataQuality.periodIssues ?? []),
  ].join("\n");
};

const formatModuleContext = (moduleContext?: AssistantModuleContext): string => {
  if (!moduleContext) {
    return "Module context: not provided";
  }

  return [
    `Module context moduleKey: ${moduleContext.moduleKey ?? "unknown"}`,
    `Module context moduleName: ${moduleContext.moduleName ?? "unknown"}`,
    `Context ticker: ${moduleContext.ticker ?? "not_available"}`,
    `Context companyName: ${moduleContext.companyName ?? "not_available"}`,
    `Context companyType: ${moduleContext.companyType ?? "unknown"}`,
    `Context industry: ${moduleContext.industry ?? "not_available"}`,
    `Context period: ${moduleContext.period ?? "not_available"}`,
    `Context mock/sample data: ${moduleContext.isMockData ? "yes" : "no"}`,
    formatList("Module missing fields", moduleContext.missingFields ?? []),
    formatList("Module warnings", moduleContext.warnings ?? []),
    formatJsonBlock("Module metrics/context payload", moduleContext.metrics ?? moduleContext),
  ].join("\n");
};

const formatRetrievedChunks = (chunks: RetrievedPromptChunk[] = []): string => {
  if (chunks.length === 0) {
    return [
      "RAG context: not_available",
      "No retrieved chunks were provided. Do not pretend RAG context exists. Answer only from module context and general safety rules, or say context is insufficient.",
    ].join("\n");
  }

  const formattedChunks = chunks.map((chunk, index) => {
    const sourcePath = chunk.sectionPath?.length ? chunk.sectionPath.join(" > ") : "unknown section";

    return [
      `[Chunk ${index + 1}]`,
      `chunkId: ${chunk.chunkId}`,
      `documentId: ${chunk.documentId ?? "not_available"}`,
      `filePath: ${chunk.filePath}`,
      `title: ${chunk.title ?? "untitled"}`,
      `sectionPath: ${sourcePath}`,
      `sectionType: ${chunk.sectionType ?? "unknown"}`,
      `score: ${chunk.score ?? "not_available"}`,
      "text:",
      chunk.text,
    ].join("\n");
  });

  return ["RAG context: available", ...formattedChunks].join("\n\n");
};

const buildUserMessage = (input: BuildAssistantPromptInput): string => {
  const missingFields = collectMissingFields(input.moduleContext, input.dataQuality);

  return [
    "Assistant request:",
    `User question: ${input.userQuestion}`,
    `Active module: ${input.activeModule}`,
    `Ticker: ${input.ticker ?? input.moduleContext?.ticker ?? "not_available"}`,
    `Company: ${input.companyName ?? input.moduleContext?.companyName ?? "not_available"}`,
    `User intent: ${input.userIntent ?? "unknown"}`,
    "",
    "Data quality summary:",
    formatDataQuality(input.dataQuality),
    "",
    "Missing data summary:",
    formatList("Fields that must remain missing unless provided", missingFields),
    "If a required field is missing, do not infer it and do not fill it with zero.",
    "",
    "Module context:",
    formatModuleContext(input.moduleContext),
    "",
    "Retrieved RAG chunks:",
    formatRetrievedChunks(input.retrievedChunks),
    "",
    "Answering instruction:",
    "Use only the provided module context and eligible retrieved chunks. If retrieved chunks are missing, say RAG context is not available instead of citing RAG knowledge. Return a safe educational analysis, not an investment decision.",
  ].join("\n");
};

export const buildAssistantPrompt = (
  input: BuildAssistantPromptInput,
): BuildAssistantPromptResult => {
  const systemMessage = buildSystemMessage(input);
  const userMessage = buildUserMessage(input);
  const messages = [
    { role: "system" as const, content: systemMessage },
    { role: "user" as const, content: userMessage },
  ];
  const usedChunkIds = (input.retrievedChunks ?? []).map((chunk) => chunk.chunkId);
  const moduleConfig = getModulePromptConfig(input.activeModule);
  const guardrailReminders = uniqueStrings([
    ...GLOBAL_GUARDRAIL_REMINDERS,
    ...moduleConfig.guardrails,
  ]);

  return {
    messages,
    promptText: messages.map((message) => `[${message.role}]\n${message.content}`).join("\n\n"),
    usedChunkIds,
    hasRagContext: usedChunkIds.length > 0,
    guardrailReminders,
  };
};
