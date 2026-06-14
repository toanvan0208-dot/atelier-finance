import type {
  GuardrailValidationContext,
  GuardrailValidationResult,
  GuardrailViolation,
} from "../guardrails";
import type { AssistantProvider, AssistantProviderResponse } from "../providers";
import type { AssistantRuntimeInput, AssistantRuntimeOutput } from "../runtime";

export type AssistantLlmStatus =
  | "not_configured"
  | "completed"
  | "blocked_by_guardrails"
  | "provider_error";

export type RunAssistantInput = AssistantRuntimeInput & {
  provider?: AssistantProvider | null;
  validationContext?: GuardrailValidationContext;
};

export type RunAssistantOutput = {
  ok: boolean;
  runtime: AssistantRuntimeOutput;
  answer: string | null;
  llmStatus: AssistantLlmStatus;
  message: string;
  providerResponse: AssistantProviderResponse | null;
  validation: GuardrailValidationResult | null;
  violations: GuardrailViolation[];
  refusal: string | null;
};
