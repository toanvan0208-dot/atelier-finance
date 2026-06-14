import { describe, expect, it } from "vitest";
import { AI_RAG_EVALUATION_TEST_CASES, runAiRagEvaluation } from "../index";

const getCaseResult = (id: string) => {
  const result = runAiRagEvaluation();
  const caseResult = result.caseResults.find((item) => item.testCase.id === id);

  if (!caseResult) {
    throw new Error(`Missing evaluation case result: ${id}`);
  }

  return caseResult;
};

describe("runAiRagEvaluation", () => {
  it("runs the default AI/RAG MVP evaluation cases without calling LLM", () => {
    const result = runAiRagEvaluation();

    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.summary).toEqual({
      total: AI_RAG_EVALUATION_TEST_CASES.length,
      passed: AI_RAG_EVALUATION_TEST_CASES.length,
      failed: 0,
    });
    expect(result.failures).toHaveLength(0);
    expect(
      result.caseResults.every((caseResult) => caseResult.runtime.debug.noLlmCall),
    ).toBe(true);
  });

  it("checks PVT signal risk selects PVT knowledge and guardrails", () => {
    const caseResult = getCaseResult("pvt-volume-buy-signal");
    const ids = caseResult.runtime.selectedDocuments.map((document) => document.id);

    expect(ids).toEqual(expect.arrayContaining(["rag_pvt_knowledge", "ai_guardrails"]));
    expect(caseResult.runtime.safetyLevel).toBe("critical");
    expect(caseResult.runtime.warnings.join("\n").toLowerCase()).toContain("safety-sensitive");
  });

  it("checks financial statements CFO case selects financial statements and risk docs", () => {
    const caseResult = getCaseResult("financials-positive-profit-negative-cfo");
    const ids = caseResult.runtime.selectedDocuments.map((document) => document.id);

    expect(ids).toEqual(
      expect.arrayContaining(["rag_financial_statements_guide", "rag_risk_knowledge"]),
    );
  });

  it("checks valuation EPS/P-E case selects valuation and hallucination docs", () => {
    const caseResult = getCaseResult("valuation-negative-eps-low-pe");
    const ids = caseResult.runtime.selectedDocuments.map((document) => document.id);

    expect(ids).toEqual(
      expect.arrayContaining(["rag_valuation_knowledge", "ai_hallucination_checklist"]),
    );
  });

  it("checks end-user financial question excludes maintainer documents", () => {
    const caseResult = getCaseResult("end-user-revenue-growth");
    const ids = caseResult.runtime.selectedDocuments.map((document) => document.id);

    expect(ids).not.toContain("rag_document_template");
    expect(ids).not.toContain("rag_metadata_standard");
  });

  it("fails unsafe candidate answer and passes safe refusal candidate answer", () => {
    const unsafe = getCaseResult("candidate-unsafe-buy-answer");
    const safe = getCaseResult("candidate-safe-refusal");

    expect(unsafe.guardrailValidation?.isValid).toBe(false);
    expect(unsafe.guardrailValidation?.shouldRefuse).toBe(true);
    expect(safe.guardrailValidation?.isValid).toBe(true);
    expect(safe.guardrailValidation?.shouldRefuse).toBe(false);
  });

  it("reports a failure when an expected document is missing", () => {
    const result = runAiRagEvaluation({
      testCases: [
        {
          id: "intentional-missing-doc",
          name: "Intentional missing expected document",
          question: "Volume tang co phai tin hieu mua khong?",
          activeModule: "technical",
          expectedDocuments: ["rag_metadata_standard"],
        },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.summary.failed).toBe(1);
    expect(result.failures[0]?.check).toBe("expected_document");
  });
});
