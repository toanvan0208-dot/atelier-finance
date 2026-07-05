import { getModulePromptConfig } from "./module-prompt-map";
import type {
  AssistantDataQuality,
  AssistantModuleContext,
  BuildAssistantPromptInput,
  BuildAssistantPromptResult,
  RetrievedPromptChunk,
} from "./types";

const GLOBAL_GUARDRAIL_REMINDERS = [
  "Answer in Vietnamese by default and explain concepts very simply and briefly for beginner investors. Do not use overly academic jargon.",
  "Never recommend buy/sell/hold or tell the user what trade action to take.",
  "CRITICAL: Do NOT use the exact words 'mua' or 'bán' anywhere in your response, even when explaining that you cannot give advice. Instead of saying 'Tôi không khuyên mua bán', say 'Tôi không thể cung cấp tư vấn đầu tư'.",
  "Never provide trading signals.",
  "Never predict price direction.",
  "Never provide fair value, target price, upside, or downside, even if the user asks.",
  "Never provide subjective valuation conclusions like cheap, expensive, good, bad, attractive, promising, potential, or worth buying.",
  "Instead, follow this example format for valuation:",
  "User: Is the P/E of this stock cheap?",
  "Assistant: The P/E ratio tells you how much the market is paying for each unit of earnings. It requires EPS to calculate. Check the Financials, Risk, and Industry context before forming an investment thesis.",
  "Never fabricate data outside the provided context.",
  "Use only allowed numeric values for numeric claims; do not calculate or infer an unprovided number.",
  "Missing data must be represented as null/not_available/insufficient_data; never replace missing data with zero. Do not make up facts to fill the gap.",
  "Do not divide by zero or interpret ratios when denominators are missing, zero, or invalid.",
  "PVT is market observation, not a trading signal.",
  "Risk score is not a final safe/bad stock conclusion.",
  "Checklist is a tool to help you think critically and verify evidence, it is not an investment recommendation or a signal to buy.",
  "Screening is a readiness table to help find candidates, it does not rank stocks as 'worth buying'.",
  "Simulation is an educational illustration of a scenario, it does not predict future profit.",
  "When asking about VCB or bank data, explicitly state that banks have unique accounting (e.g., they don't use totalDebt like normal corporations).",
  "When productionApproved is false or the source is local/research/manual, briefly say the data still needs review if it matters to the answer. Do not mention source labels, page numbers, RAG, PDF, or report names unless the user asks for sources/evidence.",
  "If marketPriceContext is available, explicitly use the phrase 'dữ liệu hệ thống' or 'dữ liệu hiện có' when referring to it.",
  "If marketPriceContext shows productionApproved=false or needsReview=true, explicitly warn the user that the data is not production-approved or needs review.",
  "CRITICAL: If marketPriceContext has warningCodes, you MUST explicitly use the word 'cảnh báo' or 'thiếu' to state that the data needs review because the source metadata has warnings (e.g. missing currency, exchange, price/volume units, or adjustment evidence).",
  "Encourage checking Financials, Valuation, Risk, Industry, and Macro before forming a conclusion.",
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
    "- For simple concept questions, answer in at most 3 short bullets and keep the whole answer under about 650 characters.",
    "- Prefer short hyphen bullets. Do not use numbered lists unless the numbers are provided in grounded context.",
    "- Do not use markdown headings like ### or bold markers like **text**; the app displays plain text in a narrow panel.",
    "- Use simple Vietnamese. Avoid long paragraphs and academic wording.",
    "- Do not mention source labels, page numbers, RAG, PDF, or report names unless the user asks about sources/evidence or the answer uses a specific number/date from retrieved context.",
    "- Separate data, interpretation, limitations, and next checks.",
    "- If the user asks a conceptual or workflow question, answer the concept/workflow directly first, then mention missing data only as a limitation for stock-specific conclusions.",
    "- If context is insufficient for a specific ticker/company conclusion, say so explicitly without saying the whole question cannot be answered.",
    "- Do not say the active module is missing when the prompt includes Active module, Packet active module, or Module context moduleKey.",
    "- If no ticker is provided, say there is no specific ticker selected; do not say there is no module context.",
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
    `Data mode: ${dataQuality.dataMode ?? "not_available"}`,
    `Production approved: ${dataQuality.productionApproved === true ? "yes" : "no"}`,
    `Source name: ${dataQuality.sourceName ?? "not_available"}`,
    `Source label: ${dataQuality.sourceLabel ?? "not_available"}`,
    `As of: ${dataQuality.asOf ?? "not_available"}`,
    `Period: ${dataQuality.period ?? "not_available"}`,
    formatList("Missing fields", dataQuality.missingFields ?? []),
    formatList("Stale fields", dataQuality.staleFields ?? []),
    formatList("Low confidence fields", dataQuality.lowConfidenceFields ?? []),
    formatList("Invalid fields", dataQuality.invalidFields ?? []),
    formatList("Source issues", dataQuality.sourceIssues ?? []),
    formatList("Period issues", dataQuality.periodIssues ?? []),
    formatList("Data quality warnings", dataQuality.warnings ?? []),
  ].join("\n");
};

const formatContextPacket = (input: BuildAssistantPromptInput): string => {
  const packet = input.contextPacket;
  if (!packet) {
    return [
      "Screen context packet: not_available",
      "The assistant does not have grounded screen facts. State that screen data is insufficient and do not infer missing values.",
    ].join("\n");
  }

  return [
    "Screen context packet: available",
    `Packet ticker: ${packet.ticker ?? "not_available"}`,
    `Packet active module: ${packet.activeModule}`,
    formatList("Packet missing fields", packet.missingFields),
    formatList(
      "Allowed numeric values from grounded context",
      packet.allowedNumericValues.map(String),
    ),
    formatList("Visible screen facts", packet.visibleFacts),
    formatList("Packet constraints", packet.constraints),
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
    formatJsonBlock("Module metrics/context payload", moduleContext),
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
    "Grounded screen context:",
    formatContextPacket(input),
    "",
    "Retrieved RAG chunks:",
    formatRetrievedChunks(input.retrievedChunks),
    "",
    "Answering instruction:",
    "Use only the provided module context and eligible retrieved chunks. If retrieved chunks are missing, say context is insufficient instead of citing RAG knowledge. Return a safe educational analysis, not an investment decision. Do not mention source labels/page numbers unless the user asks for sources or you use a specific number/date from retrieved context.",
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
