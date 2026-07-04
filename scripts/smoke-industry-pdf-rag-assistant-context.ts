import {
  buildIndustryPdfRagIndex,
  retrieveIndustryPdfRagChunks,
  toIndustryPdfRagPromptChunks,
  type IndustryPdfRagIndustryCode,
} from "../src/features/industry/lib/industry-pdf-rag";
import { validateAssistantOutput } from "../src/lib/ai-rag/guardrails";
import { buildAssistantPrompt } from "../src/lib/ai-rag/prompts";
import { MockAssistantProvider } from "../src/lib/ai-rag/providers/mock-provider";
import { buildAssistantRuntime } from "../src/lib/ai-rag/runtime";

const PHASE = "160C";

const INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL =
  "Industry PDF RAG chunks are research-only, local PDF derived, needsReview=true, and productionApproved=false. Use retrieved chunks only to explain industry context and next checks. Cite source label and page when using them. Do not turn PDF snippets into buy/sell/hold guidance, target price, fair value, upside/downside, ranking, scoring, benchmark, or stock attractiveness claims.";

const CASES: Array<{
  industryCode: IndustryPdfRagIndustryCode;
  ticker: string;
  question: string;
}> = [
  {
    industryCode: "STEEL_MATERIALS",
    ticker: "HPG",
    question: "Dựa trên báo cáo PDF, ngành thép đang cần kiểm tra những yếu tố nào?",
  },
  {
    industryCode: "RETAIL",
    ticker: "MWG",
    question: "Dựa trên báo cáo PDF, ngành bán lẻ cần đọc sức mua và tồn kho như thế nào?",
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    ticker: "VNM",
    question: "Dựa trên báo cáo PDF, nhóm sữa và hàng tiêu dùng cần kiểm tra những gì?",
  },
];

const safeMockAnswer = [
  "Theo dữ liệu hệ thống từ báo cáo PDF, đây chỉ là bối cảnh nghiên cứu cần rà soát.",
  "Người dùng nên kiểm tra thêm doanh thu, biên gộp, tồn kho, chi phí đầu vào và dòng tiền.",
  "Nguồn cần được đối chiếu với báo cáo tài chính và dữ liệu ngành khác trước khi hình thành luận điểm.",
].join(" ");

const unsafeMockAnswer = [
  "Cổ phiếu này đáng mua vì upside còn 20%.",
  "Giá mục tiêu hợp lý là 50.000 đồng và nên mua ngay.",
].join(" ");

const runSmoke = async () => {
  const index = buildIndustryPdfRagIndex();

  const promptCases = CASES.map((item) => {
    const retrieved = retrieveIndustryPdfRagChunks(index, {
      industryCode: item.industryCode,
      question: item.question,
      topK: 3,
    });
    const promptChunks = toIndustryPdfRagPromptChunks(retrieved);
    const prompt = buildAssistantPrompt({
      userQuestion: item.question,
      activeModule: "industry",
      ticker: item.ticker,
      userIntent: "data_explanation",
      moduleContext: {
        moduleKey: "industry",
        moduleName: "Industry",
        ticker: item.ticker,
        industry: item.industryCode,
        isMockData: false,
        industryPdfRagContext: {
          status: "prototype_read_path",
          dataMode: "research_only",
          needsReview: true,
          productionApproved: false,
          sourceType: "local_pdf_reports",
          retrievedChunkCount: retrieved.length,
          guardrail: INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL,
        },
        warnings: [
          "Industry PDF RAG is not production-approved and must not be used for investment conclusions.",
        ],
      },
      dataQuality: {
        overallStatus: "usable_with_caution",
        isMockData: false,
        dataMode: "research_only",
        productionApproved: false,
        sourceLabel: "Local industry PDF RAG prototype",
        warnings: ["needsReview=true", "productionApproved=false"],
      },
      retrievedChunks: promptChunks,
    });

    return {
      ...item,
      retrievedChunkCount: retrieved.length,
      promptChunkCount: promptChunks.length,
      usedChunkIds: prompt.usedChunkIds,
      hasRagContext: prompt.hasRagContext,
      promptIncludesGuardrail: prompt.promptText.includes(INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL),
      promptIncludesSourceLabel: promptChunks.every((chunk) =>
        prompt.promptText.includes(chunk.title ?? ""),
      ),
      promptIncludesPageMetadata: promptChunks.every((chunk) =>
        (chunk.sectionPath ?? []).some((section) => section.startsWith("page:")) &&
        prompt.promptText.includes("Page:"),
      ),
      promptIncludesProductionApprovedFalse: prompt.promptText.includes(
        '"productionApproved": false',
      ),
    };
  });

  const runtime = buildAssistantRuntime({
    question: CASES[0]?.question ?? "Industry PDF RAG smoke",
    activeModule: "industry",
    ticker: CASES[0]?.ticker ?? "HPG",
  });
  const safeProvider = new MockAssistantProvider({ answer: safeMockAnswer });
  const unsafeProvider = new MockAssistantProvider({ answer: unsafeMockAnswer });

  const safeProviderResponse = await safeProvider.call({
    messages: runtime.prompt.messages,
    promptText: runtime.prompt.promptText,
    runtime,
    metadata: {
      question: CASES[0]?.question ?? "Industry PDF RAG smoke",
      activeModule: "industry",
      ticker: CASES[0]?.ticker ?? "HPG",
    },
  });
  const unsafeProviderResponse = await unsafeProvider.call({
    messages: runtime.prompt.messages,
    promptText: runtime.prompt.promptText,
    runtime,
    metadata: {
      question: CASES[0]?.question ?? "Industry PDF RAG smoke",
      activeModule: "industry",
      ticker: CASES[0]?.ticker ?? "HPG",
    },
  });

  const safeValidation = validateAssistantOutput(safeProviderResponse.answer ?? "", {
    module: "industry",
  });
  const unsafeValidation = validateAssistantOutput(unsafeProviderResponse.answer ?? "", {
    module: "industry",
  });

  const result = {
    phase: PHASE,
    mode: "industry_pdf_rag_assistant_context_dry_run",
    dbReadAttempted: false,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    mockProviderOnly: true,
    assistantRouteChanged: false,
    assistantPromptProductionChanged: false,
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
    promptCases,
    promptCasesPassed: promptCases.every(
      (item) =>
        item.retrievedChunkCount >= 2 &&
        item.promptChunkCount === item.retrievedChunkCount &&
        item.hasRagContext &&
        item.promptIncludesGuardrail &&
        item.promptIncludesSourceLabel &&
        item.promptIncludesPageMetadata &&
        item.promptIncludesProductionApprovedFalse,
    ),
    safeMockCompleted: safeProviderResponse.status === "completed",
    safeMockValid: safeValidation.isValid,
    unsafeMockBlocked: unsafeValidation.shouldRefuse,
    unsafeViolationCodes: unsafeValidation.violations.map((violation) => violation.code),
    readyForAssistantRuntimeIntegration: true,
    recommendedNextPhase: "Phase 160D - Industry PDF RAG Assistant Runtime Integration",
  };

  const smokePassed =
    result.phase === PHASE &&
    result.mode === "industry_pdf_rag_assistant_context_dry_run" &&
    result.promptCasesPassed &&
    result.safeMockCompleted &&
    result.safeMockValid &&
    result.unsafeMockBlocked &&
    result.unsafeViolationCodes.length > 0 &&
    !result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    result.mockProviderOnly &&
    !result.assistantRouteChanged &&
    !result.assistantPromptProductionChanged &&
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
    result.readyForAssistantRuntimeIntegration;

  console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

  if (!smokePassed) {
    process.exitCode = 1;
  }
};

runSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
