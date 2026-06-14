import type { GuardrailValidationContext, GuardrailValidationResult } from "../guardrails";
import type { AssistantRuntimeInput, AssistantRuntimeOutput } from "../runtime";
import type { RetrievalDocumentId, RetrievalIntent, RetrievalSafetyLevel } from "../retrieval";

export type AiRagEvaluationTestCase = {
  id: string;
  name: string;
  question: string;
  activeModule: string;
  ticker?: string | null;
  expectedIntent?: RetrievalIntent;
  expectedDocuments?: RetrievalDocumentId[];
  forbiddenDocuments?: RetrievalDocumentId[];
  expectedSafetyLevel?: RetrievalSafetyLevel;
  expectedWarningIncludes?: string[];
  candidateAnswer?: string;
  candidateContext?: GuardrailValidationContext;
  expectedCandidateValid?: boolean;
  expectedCandidateShouldRefuse?: boolean;
};

export type AiRagEvaluationFailure = {
  testCaseId: string;
  check: string;
  message: string;
};

export type AiRagEvaluationCaseResult = {
  testCase: AiRagEvaluationTestCase;
  runtime: AssistantRuntimeOutput;
  guardrailValidation?: GuardrailValidationResult;
  passed: boolean;
  failures: AiRagEvaluationFailure[];
};

export type AiRagEvaluationSummary = {
  total: number;
  passed: number;
  failed: number;
};

export type AiRagEvaluationResult = {
  passed: boolean;
  summary: AiRagEvaluationSummary;
  caseResults: AiRagEvaluationCaseResult[];
  failures: AiRagEvaluationFailure[];
};

export type RunAiRagEvaluationInput = {
  testCases?: AiRagEvaluationTestCase[];
  runtimeOverrides?: Partial<AssistantRuntimeInput>;
};
