import { validateAssistantOutput } from "../guardrails";
import { buildAssistantRuntime } from "../runtime";
import type { RetrievalDocumentId } from "../retrieval";
import { AI_RAG_EVALUATION_TEST_CASES } from "./ai-rag-test-cases";
import type {
  AiRagEvaluationCaseResult,
  AiRagEvaluationFailure,
  AiRagEvaluationResult,
  AiRagEvaluationTestCase,
  RunAiRagEvaluationInput,
} from "./types";

const REQUIRED_PROMPT_GUARDRAILS = [
  "Never recommend buy/sell/hold",
  "Never predict price direction.",
  "Never fabricate data outside the provided context.",
  "null/not_available/insufficient_data",
  "PVT is market observation, not a trading signal.",
  "Risk score is not a final safe/bad stock conclusion.",
  "Checklist is not an investment recommendation.",
  "RAG_DOCUMENT_TEMPLATE.md and RAG_METADATA_STANDARD.md are maintainer-intent only",
];

const selectedDocumentIds = (
  runtime: ReturnType<typeof buildAssistantRuntime>,
): RetrievalDocumentId[] => runtime.selectedDocuments.map((document) => document.id);

const includesCaseInsensitive = (value: string, expected: string): boolean =>
  value.toLowerCase().includes(expected.toLowerCase());

const addFailure = (
  failures: AiRagEvaluationFailure[],
  testCase: AiRagEvaluationTestCase,
  check: string,
  message: string,
): void => {
  failures.push({
    testCaseId: testCase.id,
    check,
    message,
  });
};

const evaluateCase = (testCase: AiRagEvaluationTestCase): AiRagEvaluationCaseResult => {
  const runtime = buildAssistantRuntime({
    question: testCase.question,
    activeModule: testCase.activeModule,
    ticker: testCase.ticker,
  });
  const failures: AiRagEvaluationFailure[] = [];
  const ids = selectedDocumentIds(runtime);

  if (testCase.expectedIntent && runtime.detectedIntent !== testCase.expectedIntent) {
    addFailure(
      failures,
      testCase,
      "expected_intent",
      `Expected intent ${testCase.expectedIntent}, got ${runtime.detectedIntent}.`,
    );
  }

  for (const expectedDocument of testCase.expectedDocuments ?? []) {
    if (!ids.includes(expectedDocument)) {
      addFailure(
        failures,
        testCase,
        "expected_document",
        `Expected selected document ${expectedDocument}, got ${ids.join(", ")}.`,
      );
    }
  }

  for (const forbiddenDocument of testCase.forbiddenDocuments ?? []) {
    if (ids.includes(forbiddenDocument)) {
      addFailure(
        failures,
        testCase,
        "forbidden_document",
        `Forbidden document ${forbiddenDocument} was selected.`,
      );
    }
  }

  if (
    testCase.expectedSafetyLevel &&
    runtime.safetyLevel !== testCase.expectedSafetyLevel
  ) {
    addFailure(
      failures,
      testCase,
      "expected_safety_level",
      `Expected safety level ${testCase.expectedSafetyLevel}, got ${runtime.safetyLevel}.`,
    );
  }

  const warningsText = runtime.warnings.join("\n");
  for (const expectedWarning of testCase.expectedWarningIncludes ?? []) {
    if (!includesCaseInsensitive(warningsText, expectedWarning)) {
      addFailure(
        failures,
        testCase,
        "expected_warning",
        `Expected warning containing "${expectedWarning}", got "${warningsText}".`,
      );
    }
  }

  const promptText = runtime.prompt.promptText;
  for (const requiredGuardrail of REQUIRED_PROMPT_GUARDRAILS) {
    if (!promptText.includes(requiredGuardrail)) {
      addFailure(
        failures,
        testCase,
        "required_prompt_guardrail",
        `Prompt is missing required guardrail: ${requiredGuardrail}.`,
      );
    }
  }

  const guardrailValidation = testCase.candidateAnswer
    ? validateAssistantOutput(testCase.candidateAnswer, testCase.candidateContext ?? {})
    : undefined;

  if (
    guardrailValidation &&
    testCase.expectedCandidateValid !== undefined &&
    guardrailValidation.isValid !== testCase.expectedCandidateValid
  ) {
    addFailure(
      failures,
      testCase,
      "candidate_validity",
      `Expected candidate validity ${testCase.expectedCandidateValid}, got ${guardrailValidation.isValid}.`,
    );
  }

  if (
    guardrailValidation &&
    testCase.expectedCandidateShouldRefuse !== undefined &&
    guardrailValidation.shouldRefuse !== testCase.expectedCandidateShouldRefuse
  ) {
    addFailure(
      failures,
      testCase,
      "candidate_refusal",
      `Expected candidate shouldRefuse ${testCase.expectedCandidateShouldRefuse}, got ${guardrailValidation.shouldRefuse}.`,
    );
  }

  return {
    testCase,
    runtime,
    guardrailValidation,
    passed: failures.length === 0,
    failures,
  };
};

export const runAiRagEvaluation = (
  input: RunAiRagEvaluationInput = {},
): AiRagEvaluationResult => {
  const testCases = input.testCases ?? AI_RAG_EVALUATION_TEST_CASES;
  const caseResults = testCases.map((testCase) =>
    evaluateCase({
      ...testCase,
      activeModule: input.runtimeOverrides?.activeModule ?? testCase.activeModule,
      ticker: input.runtimeOverrides?.ticker ?? testCase.ticker,
    }),
  );
  const failures = caseResults.flatMap((result) => result.failures);
  const passedCount = caseResults.filter((result) => result.passed).length;

  return {
    passed: failures.length === 0,
    summary: {
      total: caseResults.length,
      passed: passedCount,
      failed: caseResults.length - passedCount,
    },
    caseResults,
    failures,
  };
};
