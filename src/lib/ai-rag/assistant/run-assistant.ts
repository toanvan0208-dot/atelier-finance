import type { GuardrailValidationContext } from "../guardrails";
import { validateAssistantOutput } from "../guardrails";
import { callAssistantProvider } from "../providers";
import { buildAssistantRuntime } from "../runtime";
import type { AssistantRuntimeInput } from "../runtime";
import type { AssistantModuleContext } from "../prompts";
import type { RunAssistantInput, RunAssistantOutput } from "./types";

const SAFE_REFUSAL =
  "Cau tra loi cua provider bi chan vi vi pham guardrails. AI Atelier Finance khong dua khuyen nghi mua/ban/nam giu, khong du doan gia va khong tu tao du lieu ngoai context.";

const MISSING_DATA_DISCLOSURE_PREFIX =
  "Luu y: du lieu man hinh hoac nguon/asOf/period chua du, nen cau tra loi chi la huong dan doc tiep dua tren ngu canh hien co.";

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const buildValidationContext = (
  input: AssistantRuntimeInput,
  override?: GuardrailValidationContext,
): GuardrailValidationContext => {
  const packet = input.contextPacket;
  const packetModuleContext = packet?.moduleContext as AssistantModuleContext | null | undefined;
  const moduleContext = input.moduleContext ?? packetModuleContext ?? undefined;
  const metrics: Record<string, unknown> =
    moduleContext?.metrics && typeof moduleContext.metrics === "object"
      ? (moduleContext.metrics as Record<string, unknown>)
      : {};

  return {
    module: packet?.activeModule ?? input.activeModule,
    missingFields: [
      ...(moduleContext?.missingFields ?? []),
      ...(input.dataQuality?.missingFields ?? []),
      ...(packet?.missingFields ?? []),
    ],
    isMockData:
      moduleContext?.isMockData ??
      input.dataQuality?.isMockData ??
      (packet?.dataQuality.dataMode === "sample" ||
        packet?.dataQuality.dataMode === "mock"),
    eps: asNumberOrNull(metrics.eps),
    totalEquity: asNumberOrNull(metrics.totalEquity),
    bvps: asNumberOrNull(metrics.bvps),
    allowedNumericValues: input.allowedNumericValues ?? packet?.allowedNumericValues,
    hasFairValueInContext: Boolean(metrics.fairValue),
    hasTargetPriceInContext: Boolean(metrics.targetPrice),
    ...override,
  };
};

const hasOnlyMissingDataDisclosureViolation = (
  validation: ReturnType<typeof validateAssistantOutput>,
): boolean =>
  validation.violations.length > 0 &&
  validation.violations.every((violation) => violation.code === "MISSING_DATA_NOT_DISCLOSED");

export const runAssistant = async (input: RunAssistantInput): Promise<RunAssistantOutput> => {
  const runtime = buildAssistantRuntime(input);
  const providerResponse = await callAssistantProvider(input.provider, {
    messages: runtime.prompt.messages,
    promptText: runtime.prompt.promptText,
    runtime,
    metadata: {
      question: input.question,
      activeModule: input.contextPacket?.activeModule ?? input.activeModule,
      ticker: input.contextPacket?.ticker ?? input.ticker,
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

  if (candidateAnswer && hasOnlyMissingDataDisclosureViolation(validation)) {
    const disclosedAnswer = `${MISSING_DATA_DISCLOSURE_PREFIX}\n\n${candidateAnswer}`;
    const disclosedValidation = validateAssistantOutput(
      disclosedAnswer,
      buildValidationContext(input, input.validationContext),
    );

    if (disclosedValidation.isValid) {
      return {
        ok: true,
        runtime,
        answer: disclosedAnswer,
        llmStatus: "completed",
        message: "Assistant provider response passed after adding missing-data disclosure.",
        providerResponse,
        validation: disclosedValidation,
        violations: [],
        refusal: null,
      };
    }
  }

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
