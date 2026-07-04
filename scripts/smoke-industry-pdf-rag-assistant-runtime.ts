import { existsSync, readFileSync } from "node:fs";
import type { createAssistantPostHandler as CreateAssistantPostHandler } from "../src/app/api/assistant/route";
import type { MockAssistantProvider as MockAssistantProviderClass } from "../src/lib/ai-rag/providers";

const PHASE = "160D";

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

type AssistantRuntimeSmokeResponse = {
  ok: boolean;
  runtime: {
    prompt: {
      promptText: string;
      usedChunkIds: string[];
      hasRagContext: boolean;
    };
    supplementalRetrievedChunks: Array<{
      chunkId: string;
      documentId?: string;
      title?: string;
      filePath: string;
      sectionPath?: string[];
      text: string;
    }>;
    debug: {
      supplementalRetrievedChunkCount: number;
    };
  } | null;
  answer: string | null;
  llmStatus: string;
  violations?: Array<{ code: string }>;
};

const postJson = async (
  body: unknown,
  providerAnswer: string,
  createAssistantPostHandler: typeof CreateAssistantPostHandler,
  MockAssistantProvider: typeof MockAssistantProviderClass,
): Promise<AssistantRuntimeSmokeResponse> => {
  const handler = createAssistantPostHandler({
    provider: new MockAssistantProvider({ answer: providerAnswer }),
  });
  const response = await handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    }),
  );

  return (await response.json()) as AssistantRuntimeSmokeResponse;
};

const safeAnswer = [
  "Theo dữ liệu hệ thống, đây là bối cảnh nghiên cứu từ PDF ngành và chưa được phê duyệt sản xuất.",
  "Có thể kiểm tra thêm sản lượng, tiêu thụ, giá nguyên liệu, tồn kho và biên gộp trước khi hình thành luận điểm.",
  "Không nên dùng riêng các đoạn PDF này để kết luận về cổ phiếu.",
].join(" ");

const unsafeAnswer = [
  "Nên mua cổ phiếu này vì upside còn 20%.",
  "Giá mục tiêu hợp lý là 50.000 đồng.",
].join(" ");

const runSmoke = async () => {
  loadEnvFile(".env");
  const [{ createAssistantPostHandler }, { MockAssistantProvider }] = await Promise.all([
    import("../src/app/api/assistant/route"),
    import("../src/lib/ai-rag/providers"),
  ]);

  const safeResponse = await postJson(
    {
      question: "Dựa trên báo cáo PDF, ngành thép đang cần kiểm tra những yếu tố nào?",
      activeModule: "industry",
      ticker: "HPG",
    },
    safeAnswer,
    createAssistantPostHandler,
    MockAssistantProvider,
  );

  const unsafeResponse = await postJson(
    {
      question: "Dựa trên PDF ngành, HPG có đáng mua không?",
      activeModule: "industry",
      ticker: "HPG",
    },
    unsafeAnswer,
    createAssistantPostHandler,
    MockAssistantProvider,
  );

  const safePrompt = safeResponse.runtime?.prompt.promptText ?? "";
  const supplementalChunks = safeResponse.runtime?.supplementalRetrievedChunks ?? [];

  const result = {
    phase: PHASE,
    mode: "industry_pdf_rag_assistant_runtime_integration",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    mockProviderOnly: true,
    uiChanged: false,
    sourcePdfCommitted: false,
    rawPdfTextCommitted: false,
    vectorDbIntroduced: false,
    dbIndexWriteAttempted: false,
    industryMetricWriteAttempted: false,
    benchmarkRankingScoringIntroduced: false,
    buySellHoldIntroduced: false,
    targetPriceFairValueUpsideDownsideIntroduced: false,
    stockAttractivenessIntroduced: false,
    activeModuleIndustryOnly: true,
    safeStatus: safeResponse.llmStatus,
    safeAnswerReturned: safeResponse.answer !== null,
    safeSupplementalChunkCount: safeResponse.runtime?.debug.supplementalRetrievedChunkCount ?? 0,
    safePromptHasRagContext: safeResponse.runtime?.prompt.hasRagContext ?? false,
    safePromptIncludesPdfRagGuardrail: safePrompt.includes("Industry PDF RAG chunks may be present"),
    safePromptIncludesSourceLabel: safePrompt.includes("Local PDF - Steel market Q1 2026"),
    safePromptIncludesPageMetadata: safePrompt.includes("Page:"),
    safePromptIncludesProductionApprovedFalse: safePrompt.includes('"productionApproved": false'),
    safeSupplementalChunksHavePageMetadata: supplementalChunks.every((chunk) =>
      (chunk.sectionPath ?? []).some((section) => section.startsWith("page:")),
    ),
    safeSupplementalChunksHaveSourceLabel: supplementalChunks.every((chunk) =>
      Boolean(chunk.title),
    ),
    unsafeStatus: unsafeResponse.llmStatus,
    unsafeAnswerBlocked: unsafeResponse.answer === null,
    unsafeViolationCodes: unsafeResponse.violations?.map((violation) => violation.code) ?? [],
    recommendedNextPhase: "Phase 160E - Industry PDF RAG UI Source Disclosure",
  };

  const smokePassed =
    result.phase === PHASE &&
    result.mode === "industry_pdf_rag_assistant_runtime_integration" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    result.mockProviderOnly &&
    !result.uiChanged &&
    !result.sourcePdfCommitted &&
    !result.rawPdfTextCommitted &&
    !result.vectorDbIntroduced &&
    !result.dbIndexWriteAttempted &&
    !result.industryMetricWriteAttempted &&
    !result.benchmarkRankingScoringIntroduced &&
    !result.buySellHoldIntroduced &&
    !result.targetPriceFairValueUpsideDownsideIntroduced &&
    !result.stockAttractivenessIntroduced &&
    result.activeModuleIndustryOnly &&
    result.safeStatus === "completed" &&
    result.safeAnswerReturned &&
    result.safeSupplementalChunkCount >= 2 &&
    result.safePromptHasRagContext &&
    result.safePromptIncludesPdfRagGuardrail &&
    result.safePromptIncludesSourceLabel &&
    result.safePromptIncludesPageMetadata &&
    result.safePromptIncludesProductionApprovedFalse &&
    result.safeSupplementalChunksHavePageMetadata &&
    result.safeSupplementalChunksHaveSourceLabel &&
    result.unsafeStatus === "blocked_by_guardrails" &&
    result.unsafeAnswerBlocked &&
    result.unsafeViolationCodes.length > 0;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
};

runSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
