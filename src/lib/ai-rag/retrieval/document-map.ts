import type { RetrievalDocument, RetrievalDocumentId } from "./types";

export const RAG_DOCUMENTS: Record<RetrievalDocumentId, RetrievalDocument> = {
  rag_knowledge_base: {
    id: "rag_knowledge_base",
    filePath: "docs/rag/RAG_KNOWLEDGE_BASE.md",
    title: "RAG Knowledge Base",
    audience: "end_user",
    purpose: "Overview map of RAG knowledge documents and governance boundaries.",
  },
  rag_financial_terms: {
    id: "rag_financial_terms",
    filePath: "docs/rag/RAG_FINANCIAL_TERMS.md",
    title: "Financial Terms",
    audience: "end_user",
    purpose: "Metric-specific definitions and financial term explanations.",
  },
  rag_valuation_knowledge: {
    id: "rag_valuation_knowledge",
    filePath: "docs/rag/RAG_VALUATION_KNOWLEDGE.md",
    title: "Valuation Knowledge",
    audience: "end_user",
    purpose: "Valuation concepts, metric limits, and valuation interpretation boundaries.",
  },
  rag_risk_knowledge: {
    id: "rag_risk_knowledge",
    filePath: "docs/rag/RAG_RISK_KNOWLEDGE.md",
    title: "Risk Knowledge",
    audience: "end_user",
    purpose: "Risk factors, leverage, cash-flow quality, and risk score limitations.",
  },
  rag_checklist_knowledge: {
    id: "rag_checklist_knowledge",
    filePath: "docs/rag/RAG_CHECKLIST_KNOWLEDGE.md",
    title: "Checklist Knowledge",
    audience: "end_user",
    purpose: "Critical-thinking checklist guidance and missing-evidence discipline.",
  },
  rag_pvt_knowledge: {
    id: "rag_pvt_knowledge",
    filePath: "docs/rag/RAG_PVT_KNOWLEDGE.md",
    title: "Price Volume Time Knowledge",
    audience: "end_user",
    purpose: "Price, volume, trading value, liquidity, and liquidity risk as market observation.",
  },
  rag_financial_statements_guide: {
    id: "rag_financial_statements_guide",
    filePath: "docs/rag/RAG_FINANCIAL_STATEMENTS_GUIDE.md",
    title: "Financial Statements Guide",
    audience: "end_user",
    purpose: "How to read income statement, balance sheet, and cash flow together.",
  },
  rag_document_template: {
    id: "rag_document_template",
    filePath: "docs/rag/RAG_DOCUMENT_TEMPLATE.md",
    title: "RAG Document Template",
    audience: "maintainer",
    purpose: "Maintainer template for creating future RAG documents.",
  },
  rag_metadata_standard: {
    id: "rag_metadata_standard",
    filePath: "docs/rag/RAG_METADATA_STANDARD.md",
    title: "RAG Metadata Standard",
    audience: "maintainer",
    purpose: "Maintainer metadata fields for indexing, retrieval, and document governance.",
  },
  ai_guardrails: {
    id: "ai_guardrails",
    filePath: "docs/ai/AI_GUARDRAILS.md",
    title: "AI Guardrails",
    audience: "internal_safety",
    purpose: "Safety boundaries: no recommendation, no hallucination, no unsafe financial conclusions.",
  },
  ai_rag_system_prompt: {
    id: "ai_rag_system_prompt",
    filePath: "docs/rag/AI_RAG_SYSTEM_PROMPT.md",
    title: "AI RAG System Prompt",
    audience: "internal_safety",
    purpose: "System prompt rules for using RAG context safely.",
  },
  ai_hallucination_checklist: {
    id: "ai_hallucination_checklist",
    filePath: "docs/rag/AI_HALLUCINATION_CHECKLIST.md",
    title: "AI Hallucination Checklist",
    audience: "internal_safety",
    purpose: "Checks against fabricated data, fake valuation, and missing-data errors.",
  },
};

export const MAINTAINER_DOCUMENT_IDS: RetrievalDocumentId[] = [
  "rag_document_template",
  "rag_metadata_standard",
];

export const getRetrievalDocument = (id: RetrievalDocumentId): RetrievalDocument => RAG_DOCUMENTS[id];
