import { describe, expect, it } from "vitest";
import { packRetrievalContext, selectRagDocuments } from "../index";
import type { RetrievalDocumentId } from "../types";

const ids = (question: string, activeModule?: string): RetrievalDocumentId[] =>
  selectRagDocuments({ userQuestion: question, activeModule }).selectedDocuments.map(
    (document) => document.id,
  );

describe("selectRagDocuments", () => {
  it("selects PVT and guardrails for volume-as-buy-signal question", () => {
    const selected = selectRagDocuments({
      userQuestion: "Volume tang manh co phai tin hieu mua khong?",
      activeModule: "technical",
    });

    expect(selected.intent).toBe("pvt");
    expect(selected.safetyLevel).toBe("critical");
    expect(selected.selectedDocuments.map((document) => document.id)).toEqual(
      expect.arrayContaining(["rag_pvt_knowledge", "ai_guardrails", "ai_rag_system_prompt"]),
    );
  });

  it("selects financial statements and risk for positive profit with negative CFO", () => {
    expect(ids("Loi nhuan duong nhung CFO am nghia la gi?", "financials")).toEqual(
      expect.arrayContaining([
        "rag_financial_statements_guide",
        "rag_financial_terms",
        "rag_risk_knowledge",
      ]),
    );
  });

  it("selects valuation and hallucination/guardrails for EPS negative and low P/E", () => {
    expect(ids("EPS am nhung P/E thap thi co re khong?", "valuation")).toEqual(
      expect.arrayContaining([
        "rag_valuation_knowledge",
        "ai_hallucination_checklist",
        "ai_guardrails",
      ]),
    );
  });

  it("selects risk and guardrails when risk score is treated as safe conclusion", () => {
    expect(ids("Risk thap thi co phieu nay an toan khong?", "risk")).toEqual(
      expect.arrayContaining(["rag_risk_knowledge", "ai_guardrails"]),
    );
  });

  it("selects checklist and guardrails when checklist becomes a recommendation", () => {
    expect(ids("Checklist tot thi co nen mua khong?", "checklist")).toEqual(
      expect.arrayContaining(["rag_checklist_knowledge", "ai_guardrails"]),
    );
  });

  it("selects maintainer template and metadata standard for creating a new RAG document", () => {
    const selected = selectRagDocuments({
      userQuestion: "Tao RAG document moi theo metadata va template chuan",
      activeModule: "general",
    });

    expect(selected.intent).toBe("maintainer");
    expect(selected.selectedDocuments.map((document) => document.id)).toEqual([
      "rag_document_template",
      "rag_metadata_standard",
    ]);
    expect(selected.excludedDocuments).toHaveLength(0);
  });

  it("does not select maintainer docs for end-user revenue question", () => {
    const selected = selectRagDocuments({
      userQuestion: "Doanh thu tang thi cong ty tot hon dung khong?",
      activeModule: "financials",
    });
    const selectedIds = selected.selectedDocuments.map((document) => document.id);
    const excludedIds = selected.excludedDocuments.map((document) => document.id);

    expect(selectedIds).toContain("rag_financial_statements_guide");
    expect(selectedIds).not.toContain("rag_document_template");
    expect(selectedIds).not.toContain("rag_metadata_standard");
    expect(excludedIds).toEqual(expect.arrayContaining(["rag_document_template", "rag_metadata_standard"]));
  });

  it("falls back to knowledge base and guardrails when intent is unclear", () => {
    const selected = selectRagDocuments({
      userQuestion: "Ban co the giai thich giup toi khong?",
      activeModule: "general",
    });

    expect(selected.intent).toBe("unknown");
    expect(selected.selectedDocuments.map((document) => document.id)).toEqual(
      expect.arrayContaining(["rag_knowledge_base", "ai_guardrails"]),
    );
    expect(selected.warnings.length).toBeGreaterThan(0);
  });

  it("packs retrieval context with selected source paths and warnings", () => {
    const selected = selectRagDocuments({
      userQuestion: "Volume tang manh co phai tin hieu mua khong?",
      activeModule: "technical",
    });
    const packed = packRetrievalContext(selected);

    expect(packed.selectedDocumentIds).toContain("rag_pvt_knowledge");
    expect(packed.contextText).toContain("docs/rag/RAG_PVT_KNOWLEDGE.md");
    expect(packed.contextText).toContain("Safety level: critical");
  });
});
