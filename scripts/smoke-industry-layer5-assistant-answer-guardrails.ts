import { createAssistantPostHandler } from "../src/app/api/assistant/route";
import { MockAssistantProvider } from "../src/lib/ai-rag/providers";
import { prisma } from "../src/lib/database/client";

const TARGET_TICKER = "HPG";

type AssistantPayload = {
  ok?: boolean;
  answer?: string | null;
  llmStatus?: string;
  validation?: {
    isValid?: boolean;
  } | null;
  violations?: Array<{
    code: string;
  }>;
  runtime?: {
    prompt?: {
      promptText?: string;
    };
  };
};

const postAssistant = async (answer: string): Promise<AssistantPayload> => {
  const handler = createAssistantPostHandler({
    provider: new MockAssistantProvider({
      answer,
    }),
  });

  const response = await handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "HPG co so lieu nganh nao va nen doc tiep nhu the nao?",
        activeModule: "industry",
        ticker: TARGET_TICKER,
      }),
    }),
  );

  return (await response.json()) as AssistantPayload;
};

async function main() {
  const safeAnswer =
    "Dữ liệu hệ thống hiện có cho HPG gồm metric ngành thép ở trạng thái nghiên cứu, cần rà soát và chưa phê duyệt sản xuất. Có thể dùng các số này để đặt câu hỏi kiểm tra tiếp: sản lượng bán hàng, giá bán, biên gộp, tồn kho và dòng tiền vận hành. Không nên biến riêng các metric này thành kết luận đầu tư.";

  const unsafeAnswer =
    "HPG là cổ phiếu hấp dẫn. Target price cao hơn hiện tại và upside tốt, nên mua ngay vì số liệu ngành thép ủng hộ.";

  const [safePayload, unsafePayload, productionApprovedTrueCount] = await Promise.all([
    postAssistant(safeAnswer),
    postAssistant(unsafeAnswer),
    prisma.industryMetric.count({ where: { productionApproved: true } }),
  ]);

  const safePrompt = safePayload.runtime?.prompt?.promptText ?? "";
  const unsafeViolationCodes = unsafePayload.violations?.map((violation) => violation.code) ?? [];

  const result = {
    phase: "159O",
    mode: "assistant_answer_guardrail_smoke",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    mockProviderOnly: true,
    ticker: TARGET_TICKER,
    safeAnswerCompleted: safePayload.ok === true && safePayload.llmStatus === "completed",
    safeAnswerValid: safePayload.validation?.isValid === true,
    safeAnswerReturned: safePayload.answer === safeAnswer,
    safePromptIncludesIndustryMetricGuardrail: safePrompt.includes("Layer 5 industryMetricSummary may be present"),
    safePromptIncludesReadyForAssistantUseFalse: safePrompt.includes('"readyForAssistantUse": false'),
    unsafeAnswerBlocked:
      unsafePayload.ok === false &&
      unsafePayload.answer === null &&
      unsafePayload.llmStatus === "blocked_by_guardrails",
    unsafeViolationCodes,
    unsafeBlocksValuationOrAdvice:
      unsafeViolationCodes.includes("BUY_SELL_HOLD_RECOMMENDATION") ||
      unsafeViolationCodes.includes("FAKE_FAIR_VALUE_OR_TARGET_PRICE") ||
      unsafeViolationCodes.includes("VALUATION_ACTION_LANGUAGE") ||
      unsafeViolationCodes.includes("VALUATION_CONCLUSION"),
    productionApprovedTrueCount,
  };

  const smokePassed =
    result.phase === "159O" &&
    result.mode === "assistant_answer_guardrail_smoke" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    result.mockProviderOnly &&
    result.safeAnswerCompleted &&
    result.safeAnswerValid &&
    result.safeAnswerReturned &&
    result.safePromptIncludesIndustryMetricGuardrail &&
    result.safePromptIncludesReadyForAssistantUseFalse &&
    result.unsafeAnswerBlocked &&
    result.unsafeBlocksValuationOrAdvice &&
    result.productionApprovedTrueCount === 0;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
