import { describe, expect, it } from "vitest";
import { buildAssistantRuntime } from "../build-assistant-runtime";

const selectedIds = (result: ReturnType<typeof buildAssistantRuntime>): string[] =>
  result.selectedDocuments.map((document) => document.id);

describe("buildAssistantRuntime", () => {
  it("selects PVT and guardrails for signal-risk question and keeps PVT boundary in prompt", () => {
    const result = buildAssistantRuntime({
      question: "Volume tang manh co phai tin hieu mua khong?",
      activeModule: "technical",
      ticker: "MWG",
    });

    expect(result.detectedIntent).toBe("pvt");
    expect(result.safetyLevel).toBe("critical");
    expect(selectedIds(result)).toEqual(
      expect.arrayContaining(["rag_pvt_knowledge", "ai_guardrails"]),
    );
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).toContain("rag_pvt_knowledge");
    expect(result.prompt.hasRagContext).toBe(true);
    expect(result.prompt.usedChunkIds.length).toBeGreaterThan(0);
    expect(result.prompt.promptText).toContain("docs/rag/RAG_PVT_KNOWLEDGE.md");
    expect(result.prompt.promptText).toContain("PVT is market observation, not a trading signal.");
  });

  it("selects financial statements and risk for negative CFO question and includes missing data rules", () => {
    const result = buildAssistantRuntime({
      question: "Loi nhuan duong nhung CFO am nghia la gi?",
      activeModule: "financials",
      moduleContext: {
        moduleKey: "financials",
        moduleName: "Financial statements",
        metrics: { netProfit: 100, operatingCashFlow: -20 },
        missingFields: ["receivables", "inventory"],
      },
      dataQuality: {
        overallStatus: "partial",
        isMockData: false,
        missingFields: ["receivables", "inventory"],
      },
    });

    expect(selectedIds(result)).toEqual(
      expect.arrayContaining(["rag_financial_statements_guide", "rag_risk_knowledge"]),
    );
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).toContain(
      "rag_financial_statements_guide",
    );
    expect(result.prompt.promptText).toContain("Missing data must be represented as null/not_available/insufficient_data");
    expect(result.prompt.promptText).toContain("receivables");
  });

  it("selects valuation plus hallucination and guardrails for EPS negative P/E question", () => {
    const result = buildAssistantRuntime({
      question: "EPS am nhung P/E thap thi co re khong?",
      activeModule: "valuation",
    });

    expect(result.detectedIntent).toBe("valuation");
    expect(selectedIds(result)).toEqual(
      expect.arrayContaining([
        "rag_valuation_knowledge",
        "ai_hallucination_checklist",
        "ai_guardrails",
      ]),
    );
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).toEqual(
      expect.arrayContaining(["rag_valuation_knowledge"]),
    );
  });

  it("selects template and metadata standard for maintainer RAG document question", () => {
    const result = buildAssistantRuntime({
      question: "Tao RAG document moi theo template va metadata standard",
      activeModule: "general",
    });

    expect(result.detectedIntent).toBe("maintainer");
    expect(selectedIds(result)).toEqual(["rag_document_template", "rag_metadata_standard"]);
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).toEqual(
      expect.arrayContaining(["rag_document_template", "rag_metadata_standard"]),
    );
  });

  it("does not include maintainer docs for end-user financial question", () => {
    const result = buildAssistantRuntime({
      question: "Doanh thu tang thi cong ty tot hon dung khong?",
      activeModule: "financials",
    });

    expect(selectedIds(result)).toContain("rag_financial_statements_guide");
    expect(selectedIds(result)).not.toContain("rag_document_template");
    expect(selectedIds(result)).not.toContain("rag_metadata_standard");
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).not.toContain(
      "rag_document_template",
    );
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).not.toContain(
      "rag_metadata_standard",
    );
    expect(result.packedContext.contextText).toContain("rag_document_template");
    expect(result.packedContext.contextText).toContain("Excluded documents");
  });

  it("provides actual RAG chunks when selected documents can be loaded", () => {
    const result = buildAssistantRuntime({
      question: "Giai thich giup toi man hinh nay",
      activeModule: "general",
    });

    expect(result.prompt.hasRagContext).toBe(true);
    expect(result.prompt.usedChunkIds.length).toBeGreaterThan(0);
    expect(result.prompt.promptText).toContain("RAG context: available");
    expect(result.missingContext).not.toContain("retrievedChunks");
  });

  it("returns selectedDocuments, intent, packedContext, prompt and messages", () => {
    const result = buildAssistantRuntime({
      question: "Risk thap thi co phieu nay an toan khong?",
      activeModule: "risk",
      ticker: "VCB",
      source: "mock-source",
      timestamp: "2026-06-14T00:00:00Z",
    });

    expect(result.selectedDocuments.length).toBeGreaterThan(0);
    expect(result.detectedIntent).toBe("risk");
    expect(result.packedContext.contextText).toContain("Selected documents:");
    expect(result.prompt.messages).toHaveLength(2);
    expect(result.prompt.promptText).toContain("Risk score is not a final safe/bad stock conclusion.");
    expect(result.retrievedChunks.length).toBeGreaterThan(0);
  });

  it("does not perform LLM or API calls", () => {
    const result = buildAssistantRuntime({
      question: "Checklist tot thi co nen mua khong?",
      activeModule: "checklist",
    });

    expect(result.debug.noLlmCall).toBe(true);
    expect(result.debug.noApiCall).toBe(true);
    expect(result.debug.hasActualRetrievedChunks).toBe(true);
    expect(result.debug.pipeline).toEqual([
      "select_rag_documents",
      "pack_retrieval_context",
      "select_retrieved_chunks",
      "build_assistant_prompt",
    ]);
  });

  it("does not pass forbidden, negative, or test chunks into prompt context", () => {
    const result = buildAssistantRuntime({
      question: "EPS am nhung P/E thap thi co re khong?",
      activeModule: "valuation",
    });

    expect(
      result.retrievedChunks.every(
        (chunk) => !chunk.isForbiddenExample && !chunk.isNegativeExample && !chunk.isTestCase,
      ),
    ).toBe(true);
    expect(result.retrieval.excludedChunks.length).toBeGreaterThan(0);
  });
});
