export type AssistantPromptRole = "system" | "user";

export type AssistantPromptMessage = {
  role: AssistantPromptRole;
  content: string;
};

export type AssistantModuleKey =
  | "overview"
  | "business"
  | "financials"
  | "valuation"
  | "technical"
  | "risk"
  | "checklist"
  | "learning"
  | "general"
  | string;

export type AssistantUserIntent =
  | "definition"
  | "data_explanation"
  | "financial_statement_reading"
  | "valuation_explanation"
  | "risk_explanation"
  | "pvt_observation"
  | "checklist_review"
  | "maintainer_rag_document"
  | "advice_request"
  | "price_prediction_request"
  | "unknown";

export type AssistantDataQuality = {
  overallStatus?: "good" | "usable_with_caution" | "partial" | "missing" | "stale" | "mock" | string;
  isMockData?: boolean;
  missingFields?: string[];
  staleFields?: string[];
  lowConfidenceFields?: string[];
  invalidFields?: string[];
  sourceIssues?: string[];
  periodIssues?: string[];
};

export type AssistantModuleContext = {
  moduleKey?: AssistantModuleKey;
  moduleName?: string;
  ticker?: string | null;
  companyName?: string | null;
  companyType?: string | null;
  industry?: string | null;
  period?: string | null;
  isMockData?: boolean;
  metrics?: Record<string, unknown>;
  missingFields?: string[];
  warnings?: string[];
  [key: string]: unknown;
};

export type RetrievedPromptChunk = {
  chunkId: string;
  documentId?: string;
  filePath: string;
  title?: string;
  sectionPath?: string[];
  text: string;
  score?: number;
  sectionType?: string;
};

export type BuildAssistantPromptInput = {
  userQuestion: string;
  activeModule: AssistantModuleKey;
  ticker?: string | null;
  companyName?: string | null;
  userIntent?: AssistantUserIntent;
  moduleContext?: AssistantModuleContext;
  dataQuality?: AssistantDataQuality;
  retrievedChunks?: RetrievedPromptChunk[];
};

export type BuildAssistantPromptResult = {
  messages: AssistantPromptMessage[];
  promptText: string;
  usedChunkIds: string[];
  hasRagContext: boolean;
  guardrailReminders: string[];
};
