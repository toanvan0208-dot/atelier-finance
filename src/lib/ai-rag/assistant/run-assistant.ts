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
  "Lưu ý: dữ liệu màn hình chưa đủ, nên phần dưới chỉ là gợi ý kiểm tra tiếp.";

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const normalizeVietnameseText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase();

const normalizeAssistantDisplayAnswer = (answer: string): string =>
  answer
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .trim();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getMarketPriceContext = (
  input: AssistantRuntimeInput,
): Record<string, unknown> | null => {
  const packetModuleContext = input.contextPacket?.moduleContext;
  const moduleContext = input.moduleContext ?? (isRecord(packetModuleContext) ? packetModuleContext : undefined);
  const marketPriceContext = moduleContext?.marketPriceContext;

  return isRecord(marketPriceContext) ? marketPriceContext : null;
};

const getLatestMarketPrice = (
  input: AssistantRuntimeInput,
): Record<string, unknown> | null => {
  const marketPriceContext = getMarketPriceContext(input);
  if (!marketPriceContext || marketPriceContext.available !== true) return null;

  const latestMarketPrice = marketPriceContext.latestMarketPrice;

  return isRecord(latestMarketPrice) ? latestMarketPrice : null;
};

const asksForCurrentMarketPrice = (question: string): boolean => {
  const normalized = normalizeVietnameseText(question);
  const mentionsPrice =
    normalized.includes("gia") ||
    normalized.includes("price");
  const mentionsCurrent =
    normalized.includes("hien tai") ||
    normalized.includes("dong cua") ||
    normalized.includes("gan nhat") ||
    normalized.includes("market") ||
    normalized.includes("current") ||
    normalized.includes("latest");

  return mentionsPrice && mentionsCurrent;
};

const asksForDcfFormula = (question: string): boolean => {
  const normalized = normalizeVietnameseText(question);

  return normalized.includes("dcf") && (
    normalized.includes("cong thuc") ||
    normalized.includes("formula") ||
    normalized.includes("tinh") ||
    normalized.includes("la gi")
  );
};

const formatDisplayNumber = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!text || text === "null") return null;

  const numericValue = Number(text);
  if (!Number.isFinite(numericValue)) return text;

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 4,
  }).format(numericValue);
};

const buildMarketPriceDirectAnswer = (input: AssistantRuntimeInput): string | null => {
  if (!asksForCurrentMarketPrice(input.question)) return null;

  const latestMarketPrice = getLatestMarketPrice(input);
  if (!latestMarketPrice) return null;

  const closePrice = formatDisplayNumber(latestMarketPrice.closePrice);
  if (!closePrice) return null;

  const ticker =
    input.contextPacket?.ticker ??
    input.ticker ??
    (typeof getMarketPriceContext(input)?.ticker === "string"
      ? String(getMarketPriceContext(input)?.ticker)
      : "mã này");
  const marketDate =
    typeof latestMarketPrice.marketDate === "string"
      ? latestMarketPrice.marketDate.slice(0, 10)
      : "ngày gần nhất";
  const needsReview =
    latestMarketPrice.productionApproved !== true ||
    getMarketPriceContext(input)?.provenance !== undefined;

  return [
    `Giá đóng cửa gần nhất của ${ticker} trong dữ liệu hệ thống là ${closePrice} (${marketDate}).`,
    needsReview
      ? "Dữ liệu này đang ở trạng thái cần rà soát, nên chỉ dùng như dữ liệu tham khảo."
      : "Dữ liệu này là dữ liệu hệ thống hiện có.",
    "Đây chỉ là giá thị trường gần nhất trong hệ thống, không phải kết luận định giá.",
  ].join("\n");
};

const buildDcfFormulaDirectAnswer = (input: AssistantRuntimeInput): string | null => {
  if (!asksForDcfFormula(input.question)) return null;

  return [
    "DCF là cách quy đổi dòng tiền tương lai về hiện tại.",
    "Công thức đơn giản: giá trị doanh nghiệp = tổng FCF từng năm đã chiết khấu + giá trị cuối kỳ đã chiết khấu.",
    "Muốn dùng được cần có FCF, tốc độ tăng trưởng, tỷ lệ chiết khấu, nợ vay và tiền mặt. Công thức này chỉ để học cách đọc định giá, không tự tạo kết luận đầu tư.",
  ].join("\n");
};

const getMarketPriceAllowedNumericValues = (input: AssistantRuntimeInput): Array<number | string> => {
  const latestMarketPrice = getLatestMarketPrice(input);
  const closePrice = latestMarketPrice?.closePrice;
  const displayPrice = formatDisplayNumber(closePrice);

  return [
    ...(typeof closePrice === "string" || typeof closePrice === "number" ? [closePrice] : []),
    ...(displayPrice ? [displayPrice] : []),
  ];
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
    allowedNumericValues: [
      ...(input.allowedNumericValues ?? packet?.allowedNumericValues ?? []),
      ...getMarketPriceAllowedNumericValues(input),
    ],
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

const hasOnlyRecoverableEducationalViolation = (
  validation: ReturnType<typeof validateAssistantOutput>,
): boolean =>
  validation.violations.length > 0 &&
  validation.violations.every((violation) =>
    violation.code === "VALUATION_CONCLUSION" ||
    violation.code === "MISSING_DATA_NOT_DISCLOSED"
  );

const buildSafeEducationalFallback = (input: RunAssistantInput): string => {
  const activeModule = input.contextPacket?.activeModule ?? input.activeModule;
  const ticker = input.contextPacket?.ticker ?? input.ticker;

  if (activeModule === "screening") {
    return [
      MISSING_DATA_DISCLOSURE_PREFIX,
      "",
      "Tiêu chí lọc không phải là thesis đầu tư.",
      "",
      "- Bộ lọc chỉ kiểm tra mã nào có đủ dữ liệu để đọc tiếp.",
      "- Thesis là giả thuyết phân tích cần được kiểm chứng bằng ngành, mô hình kinh doanh, BCTC, rủi ro và định giá.",
      `- ${ticker ? `Với ${ticker}, ` : "Khi chưa chọn mã cụ thể, "}kết quả lọc chỉ nên hiểu là trạng thái đủ/thiếu dữ liệu.`,
      "- Bước tiếp theo là đọc module doanh nghiệp và BCTC để kiểm chứng, không biến kết quả lọc thành kết luận đầu tư.",
    ].join("\n");
  }

  return [
    MISSING_DATA_DISCLOSURE_PREFIX,
    "",
    "Mình sẽ trả lời theo hướng an toàn vì câu trả lời trước vượt quá giới hạn diễn giải.",
    "",
    "- Dữ liệu hiện có chỉ dùng để đặt câu hỏi kiểm tra tiếp.",
    "- Không biến một chỉ số riêng lẻ thành kết luận đầu tư.",
    "- Cần đối chiếu thêm ngành, BCTC, rủi ro và định giá trước khi tự hình thành thesis.",
  ].join("\n");
};

export const runAssistant = async (input: RunAssistantInput): Promise<RunAssistantOutput> => {
  const runtime = buildAssistantRuntime(input);
  const marketPriceDirectAnswer = buildMarketPriceDirectAnswer(input);
  const educationalDirectAnswer = marketPriceDirectAnswer ?? buildDcfFormulaDirectAnswer(input);

  if (educationalDirectAnswer) {
    const validation = validateAssistantOutput(
      educationalDirectAnswer,
      buildValidationContext(input, input.validationContext),
    );

    return {
      ok: !validation.shouldRefuse,
      runtime,
      answer: validation.shouldRefuse ? null : educationalDirectAnswer,
      llmStatus: validation.shouldRefuse ? "blocked_by_guardrails" : "completed",
      message: validation.shouldRefuse
        ? SAFE_REFUSAL
        : "Assistant answered directly with a safe deterministic educational response.",
      providerResponse: null,
      validation,
      violations: validation.shouldRefuse ? validation.violations : [],
      refusal: validation.shouldRefuse ? SAFE_REFUSAL : null,
    };
  }

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

  const candidateAnswer = normalizeAssistantDisplayAnswer(providerResponse.answer ?? "");
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

  if (!candidateAnswer || validation.shouldRefuse) {
    if (candidateAnswer && hasOnlyRecoverableEducationalViolation(validation)) {
      const fallbackAnswer = buildSafeEducationalFallback(input);
      const fallbackValidation = validateAssistantOutput(
        fallbackAnswer,
        buildValidationContext(input, input.validationContext),
      );

      if (fallbackValidation.isValid) {
        return {
          ok: true,
          runtime,
          answer: fallbackAnswer,
          llmStatus: "completed",
          message: "Assistant provider response was replaced with a safe educational fallback.",
          providerResponse,
          validation: fallbackValidation,
          violations: [],
          refusal: null,
        };
      }
    }

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
    message: validation.isValid
      ? "Assistant provider response passed output guardrail validation."
      : "Assistant provider response passed without critical guardrail violations; warnings remain available in validation.",
    providerResponse,
    validation,
    violations: [],
    refusal: null,
  };
};
