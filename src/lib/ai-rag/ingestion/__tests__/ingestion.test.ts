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
});
