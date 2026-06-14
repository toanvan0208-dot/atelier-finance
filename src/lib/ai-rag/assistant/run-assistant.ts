import type { GuardrailValidationContext } from "../guardrails";
import { validateAssistantOutput } from "../guardrails";
import { callAssistantProvider } from "../providers";
import { buildAssistantRuntime } from "../runtime";
import type { AssistantRuntimeInput } from "../runtime";
import type { RunAssistantInput, RunAssistantOutput } from "./types";

const SAFE_REFUSAL =
  "Cau tra loi cua provider bi chan vi vi pham guardrails. AI Atelier Finance khong dua khuyen nghi mua/ban/nam giu, khong du doan gia va khong tu tao du lieu ngoai context.";

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const buildValidationContext = (
  input: AssistantRuntimeInput,
  override?: GuardrailValidationContext,
): GuardrailValidationContext => {
  const metrics =
    input.moduleContext?.metrics && typeof input.moduleContext.metrics === "object"
      ? input.moduleContext.metrics
      : {};

  return {
    module: input.activeModule,
    missingFields: [
      ...(input.moduleContext?.missingFields ?? []),
      ...(input.dataQuality?.missingFields ?? []),
    ],
    isMockData: input.moduleContext?.isMockData ?? input.dataQuality?.isMockData,
    eps: asNumberOrNull(metrics.eps),
    totalEquity: asNumberOrNull(metrics.totalEquity),
    bvps: asNumberOrNull(metrics.bvps),
    allowedNumericValues: input.allowedNumericValues,
    hasFairValueInContext: Boolean(metrics.fairValue),
    hasTargetPriceInContext: Boolean(metrics.targetPrice),
    ...override,
  };
};

export const runAssistant = async (input: RunAssistantInput): Promise<RunAssistantOutput> => {
  const runtime = buildAssistantRuntime(input);
  const providerResponse = await callAssistantProvider(input.provider, {
    messages: runtime.prompt.messages,
    promptText: runtime.prompt.promptText,
    runtime,
    metadata: {
      question: input.question,
      activeModule: input.activeModule,
      ticker: input.ticker,
    },
  });

  if (providerResponse.status === "not_configured") {
    return {
      ok: true,
      runtime,
      answer: null,
      llmStatus: "not_configured",
      message: "Assistant runtime prompt is ready, but no LLM provider is configured.",
      providerResponse,
      validation: null,
      violations: [],
      refusal: null,
    };
  }

  if (!providerResponse.ok || providerResponse.status === "provider_error") {
    return {
      ok: false,
      runtime,
      answer: null,
      llmStatus: "provider_error",
      message: providerResponse.error ?? "Assistant provider failed safely.",
      providerResponse,
      validation: null,
      violations: [],
      refusal: null,
    };
  }

  const candidateAnswer = providerResponse.answer?.trim() ?? "";
  const validation = validateAssistantOutput(
    candidateAnswer,
    buildValidationContext(input, input.validationContext),
  );

  if (!candidateAnswer || !validation.isValid) {
    return {
      ok: false,
      runtime,
      answer: null,
      llmStatus: "blocked_by_guardrails",
      message: SAFE_REFUSAL,
      providerResponse,
      validation,
      violations: validation.violations,
      refusal: SAFE_REFUSAL,
    };
  }

  return {
    ok: true,
    runtime,
    answer: candidateAnswer,
    llmStatus: "completed",
    message: "Assistant provider response passed output guardrail validation.",
    providerResponse,
    validation,
    violations: [],
    refusal: null,
  };
};
