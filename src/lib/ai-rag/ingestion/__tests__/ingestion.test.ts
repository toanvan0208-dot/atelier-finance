import { describe, expect, it } from "vitest";
import { RAG_DOCUMENTS } from "../../retrieval/document-map";
import { buildRagCorpus, chunkMarkdownDocument, loadMarkdownDocument, selectRetrievedChunks } from "../index";

describe("RAG Markdown ingestion", () => {
  it("loads allowed Markdown documents from document map", () => {
    const loaded = loadMarkdownDocument(RAG_DOCUMENTS.rag_pvt_knowledge);

    expect(loaded.warnings).toHaveLength(0);
    expect(loaded.content).toContain("# RAG_PVT_KNOWLEDGE.md");
  });

  it("returns a warning instead of crashing when a document is missing", () => {
    const loaded = loadMarkdownDocument({
      ...RAG_DOCUMENTS.rag_pvt_knowledge,
      filePath: "docs/rag/DOES_NOT_EXIST.md",
    });

    expect(loaded.content).toBeNull();
    expect(loaded.warnings[0]).toContain("not found");
  });

  it("chunks Markdown by heading and marks unsafe example sections", () => {
    const chunks = chunkMarkdownDocument(
      RAG_DOCUMENTS.ai_hallucination_checklist,
      [
        "# Title",
        "Intro",
        "## Safe concept",
        "Use only provided context.",
        "## Negative examples",
        "[NEGATIVE EXAMPLE - DO NOT USE]",
        "P/E thap nen mua.",
      ].join("\n"),
    );

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.some((chunk) => chunk.sectionPath.includes("Safe concept"))).toBe(true);
    expect(
      chunks.some((chunk) => chunk.sectionPath.includes("Negative examples") && chunk.isNegativeExample),
    ).toBe(true);
  });

  it("builds a corpus only from explicit document-map documents", () => {
    const corpus = buildRagCorpus({
      documents: [RAG_DOCUMENTS.rag_pvt_knowledge, RAG_DOCUMENTS.ai_guardrails],
      safetyLevel: "critical",
    });

    expect(corpus.debug.documentCount).toBe(2);
    expect(corpus.chunks.length).toBeGreaterThan(0);
    expect(corpus.chunks.every((chunk) => chunk.filePath.startsWith("docs/"))).toBe(true);
  });

  it("selects PVT chunks and excludes forbidden/negative/test chunks by default", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [RAG_DOCUMENTS.rag_pvt_knowledge, RAG_DOCUMENTS.ai_guardrails],
      question: "Volume tang manh co phai tin hieu mua khong?",
      activeModule: "technical",
      intent: "pvt",
      safetyLevel: "critical",
      maxChunks: 4,
    });

    expect(result.retrievedChunks.length).toBeGreaterThan(0);
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).toContain("rag_pvt_knowledge");
    expect(
      result.retrievedChunks.every(
        (chunk) => !chunk.isForbiddenExample && !chunk.isNegativeExample && !chunk.isTestCase,
      ),
    ).toBe(true);
    expect(result.debug.scoring[0]?.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("prioritizes PVT boundary or safe-template chunks for signal questions", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [RAG_DOCUMENTS.rag_pvt_knowledge, RAG_DOCUMENTS.ai_guardrails],
      question: "Volume tang manh co phai tin hieu mua khong?",
      activeModule: "technical",
      intent: "pvt",
      safetyLevel: "critical",
      maxChunks: 3,
      maxTotalChars: 5000,
    });

    const topChunks = result.retrievedChunks.slice(0, 2);

    expect(
      topChunks.some((chunk) =>
        ["interpretation_boundary", "core_principle", "safe_template"].includes(
          chunk.sectionType,
        ),
      ),
    ).toBe(true);
    expect(result.debug.scoring[0]?.reasons.join(" ")).toMatch(/heading|sectionType|intent/);
  });

  it("prioritizes invalid EPS/P-E valuation chunks", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [
        RAG_DOCUMENTS.rag_valuation_knowledge,
        RAG_DOCUMENTS.ai_hallucination_checklist,
        RAG_DOCUMENTS.ai_guardrails,
      ],
      question: "EPS am ma P/E thap thi co re khong?",
      activeModule: "valuation",
      intent: "valuation",
      maxChunks: 3,
    });
    const combinedContext = result.retrievedChunks
      .map((chunk) => `${chunk.sectionPath.join(" ")} ${chunk.text}`)
      .join("\n")
      .toLowerCase();

    expect(combinedContext).toMatch(/eps|p\/e|pe/);
    expect(combinedContext).toMatch(/không nên dùng|khong nen dung|âm|am|negative|thông thường|thong thuong/);
  });

  it("prioritizes CFO/profit versus cash-flow chunks", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [
        RAG_DOCUMENTS.rag_financial_statements_guide,
        RAG_DOCUMENTS.rag_financial_terms,
        RAG_DOCUMENTS.rag_risk_knowledge,
      ],
      question: "Loi nhuan duong nhung CFO am nghia la gi?",
      activeModule: "financials",
      intent: "financial_statements",
      maxChunks: 3,
    });
    const combinedContext = result.retrievedChunks
      .map((chunk) => `${chunk.sectionPath.join(" ")} ${chunk.text}`)
      .join("\n")
      .toLowerCase();

    expect(combinedContext).toMatch(/cfo|operating cash flow|cash flow/);
    expect(combinedContext).toMatch(/profit|loi nhuan|net profit/);
  });

  it("prioritizes risk-score boundary chunks for safe-stock overreach", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [RAG_DOCUMENTS.rag_risk_knowledge, RAG_DOCUMENTS.ai_guardrails],
      question: "Risk score thap thi co phieu nay an toan dung khong?",
      activeModule: "risk",
      intent: "risk",
      maxChunks: 3,
    });
    const combinedContext = result.retrievedChunks
      .map((chunk) => `${chunk.sectionPath.join(" ")} ${chunk.text}`)
      .join("\n")
      .toLowerCase();

    expect(combinedContext).toContain("risk score");
    expect(combinedContext).toMatch(/an toàn|an toan|safe|không có nghĩa|khong co nghia/);
  });

  it("excludes maintainer chunks for end-user financial intent", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [
        RAG_DOCUMENTS.rag_financial_statements_guide,
        RAG_DOCUMENTS.rag_document_template,
        RAG_DOCUMENTS.rag_metadata_standard,
      ],
      question: "Doanh thu tang co nghia la cong ty tot hon khong?",
      activeModule: "financials",
      intent: "financial_statements",
      maxChunks: 6,
    });

    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).not.toContain(
      "rag_document_template",
    );
    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).not.toContain(
      "rag_metadata_standard",
    );
    expect(result.excludedChunks.some((chunk) => chunk.isMaintainerOnly)).toBe(true);
  });

  it("allows maintainer chunks for maintainer intent", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [RAG_DOCUMENTS.rag_document_template, RAG_DOCUMENTS.rag_metadata_standard],
      question: "Tao file RAG moi thi dung template nao?",
      activeModule: "general",
      intent: "maintainer",
      maxChunks: 4,
    });

    expect(result.retrievedChunks.map((chunk) => chunk.documentId)).toEqual(
      expect.arrayContaining(["rag_document_template", "rag_metadata_standard"]),
    );
  });

  it("applies max chunk and total character budgets", () => {
    const result = selectRetrievedChunks({
      selectedDocuments: [RAG_DOCUMENTS.rag_pvt_knowledge, RAG_DOCUMENTS.ai_guardrails],
      question: "Volume va thanh khoan co y nghia gi?",
      activeModule: "technical",
      intent: "pvt",
      maxChunks: 2,
      maxTotalChars: 1800,
    });
    const totalChars = result.retrievedChunks.reduce((sum, chunk) => sum + chunk.charLength, 0);

    expect(result.retrievedChunks.length).toBeLessThanOrEqual(2);
    expect(totalChars).toBeLessThanOrEqual(1800);
  });
});
