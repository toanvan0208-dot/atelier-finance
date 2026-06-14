import { getRetrievalDocument, MAINTAINER_DOCUMENT_IDS } from "./document-map";
import {
  detectUserIntent,
  hasFinancialRiskSignal,
  hasMetricDefinitionSignal,
  hasValuationSafetySignal,
} from "./detect-user-intent";
import type {
  RetrievalDocument,
  RetrievalDocumentId,
  SelectRagDocumentsInput,
  SelectRagDocumentsResult,
} from "./types";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const toDocuments = (ids: RetrievalDocumentId[]): RetrievalDocument[] =>
  unique(ids).map((id) => getRetrievalDocument(id));

export const selectRagDocuments = (
  input: SelectRagDocumentsInput,
): SelectRagDocumentsResult => {
  const detected = detectUserIntent(input.userQuestion, input.activeModule);
  const selectedIds: RetrievalDocumentId[] = [];
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (detected.isMaintainerIntent) {
    selectedIds.push("rag_document_template", "rag_metadata_standard");
    reasons.push("Maintainer intent detected: use document template and metadata standard.");
  } else {
    switch (detected.intent) {
      case "pvt":
        selectedIds.push("rag_pvt_knowledge");
        reasons.push("PVT intent detected: use PVT knowledge for price, volume, trading value, and liquidity.");
        break;
      case "financial_statements":
        selectedIds.push("rag_financial_statements_guide");
        reasons.push("Financial statements intent detected: read income statement, balance sheet, and cash flow together.");
        if (hasMetricDefinitionSignal(input.userQuestion)) {
          selectedIds.push("rag_financial_terms");
          reasons.push("Metric-specific term detected: include financial terms.");
        }
        if (hasFinancialRiskSignal(input.userQuestion)) {
          selectedIds.push("rag_risk_knowledge", "ai_hallucination_checklist");
          reasons.push("Financial risk or invalid-ratio signal detected: include risk knowledge and hallucination checklist.");
        }
        break;
      case "valuation":
        selectedIds.push("rag_valuation_knowledge");
        reasons.push("Valuation intent detected: include valuation knowledge.");
        if (hasValuationSafetySignal(input.userQuestion)) {
          selectedIds.push("ai_hallucination_checklist", "ai_guardrails");
          reasons.push("Valuation safety signal detected: include hallucination checklist and guardrails.");
        }
        break;
      case "risk":
        selectedIds.push("rag_risk_knowledge");
        reasons.push("Risk intent detected: include risk knowledge.");
        break;
      case "checklist":
        selectedIds.push("rag_checklist_knowledge");
        reasons.push("Checklist intent detected: include checklist knowledge.");
        break;
      case "unknown":
      default:
        selectedIds.push("rag_knowledge_base", "ai_guardrails");
        reasons.push("No clear intent detected: use knowledge base overview and guardrails as safe fallback.");
        warnings.push("Intent is unclear; answer should stay general and avoid data-specific claims.");
        break;
    }
  }

  if (!detected.isMaintainerIntent) {
    if (
      detected.safetyRisks.some((risk) =>
        [
          "advice_request",
          "pvt_signal_request",
          "price_prediction_request",
          "risk_score_overreach",
          "checklist_recommendation",
        ].includes(risk),
      )
    ) {
      selectedIds.push("ai_guardrails", "ai_rag_system_prompt");
      warnings.push("Safety-sensitive user intent detected; enforce refusal/redirection rules.");
    }

    if (detected.intent === "risk" && detected.safetyRisks.includes("risk_score_overreach")) {
      selectedIds.push("ai_guardrails");
      reasons.push("Risk score overreach detected: include guardrails.");
    }

    if (detected.intent === "checklist" && detected.safetyRisks.includes("checklist_recommendation")) {
      selectedIds.push("ai_guardrails");
      reasons.push("Checklist recommendation risk detected: include guardrails.");
    }
  }

  const selectedDocuments = toDocuments(selectedIds);
  const excludedDocuments = detected.isMaintainerIntent
    ? []
    : toDocuments(MAINTAINER_DOCUMENT_IDS.filter((id) => !selectedIds.includes(id)));

  if (!detected.isMaintainerIntent && excludedDocuments.length > 0) {
    reasons.push("Maintainer documents are excluded for end-user financial questions.");
  }

  return {
    selectedDocuments,
    intent: detected.intent,
    activeModule: input.activeModule,
    safetyLevel: detected.safetyLevel,
    reasons,
    excludedDocuments,
    warnings,
  };
};
