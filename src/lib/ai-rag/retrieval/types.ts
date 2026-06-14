export type RetrievalIntent =
  | "pvt"
  | "financial_statements"
  | "valuation"
  | "risk"
  | "checklist"
  | "maintainer"
  | "unknown";

export type RetrievalSafetyLevel = "low" | "medium" | "high" | "critical";

export type RetrievalDocumentId =
  | "rag_knowledge_base"
  | "rag_financial_terms"
  | "rag_valuation_knowledge"
  | "rag_risk_knowledge"
  | "rag_checklist_knowledge"
  | "rag_pvt_knowledge"
  | "rag_financial_statements_guide"
  | "rag_document_template"
  | "rag_metadata_standard"
  | "ai_guardrails"
  | "ai_rag_system_prompt"
  | "ai_hallucination_checklist";

export type RetrievalDocument = {
  id: RetrievalDocumentId;
  filePath: string;
  title: string;
  audience: "end_user" | "maintainer" | "internal_safety";
  purpose: string;
};

export type DetectedUserIntent = {
  intent: RetrievalIntent;
  safetyLevel: RetrievalSafetyLevel;
  matchedSignals: string[];
  isMaintainerIntent: boolean;
  isEndUserFinancialQuestion: boolean;
  safetyRisks: string[];
};

export type SelectRagDocumentsInput = {
  userQuestion: string;
  activeModule?: string;
};

export type SelectRagDocumentsResult = {
  selectedDocuments: RetrievalDocument[];
  intent: RetrievalIntent;
  activeModule?: string;
  safetyLevel: RetrievalSafetyLevel;
  reasons: string[];
  excludedDocuments: RetrievalDocument[];
  warnings: string[];
};

export type PackedRetrievalContext = {
  contextText: string;
  selectedDocumentIds: RetrievalDocumentId[];
  warnings: string[];
};
