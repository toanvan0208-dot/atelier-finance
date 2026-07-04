import { createAssistantPostHandler } from "../src/app/api/assistant/route";
import { loadIndustryContextRuntimeByTicker } from "../src/features/industry/lib/load-industry-context";
import { prisma } from "../src/lib/database/client";

const TARGET_TICKER = "HPG";
const TARGET_INDUSTRY_CODE = "STEEL_MATERIALS";

type AssistantPayload = {
  ok?: boolean;
  answer?: string | null;
  llmStatus?: string;
  runtime?: {
    prompt?: {
      promptText?: string;
    };
  };
};

const forbiddenOutputTerms = [
  "target price",
  "fair value",
  "upside",
  "downside",
  "stock attractiveness",
];

async function readAssistantPrompt(): Promise<AssistantPayload> {
  const response = await createAssistantPostHandler({ provider: null })(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "HPG co so lieu nganh nao va nen dung de kiem tra gi tiep?",
        activeModule: "industry",
        ticker: TARGET_TICKER,
      }),
    }),
  );

  return (await response.json()) as AssistantPayload;
}

async function main() {
  const [runtimeContext, assistantPayload, productionApprovedTrueCount] = await Promise.all([
    loadIndustryContextRuntimeByTicker(TARGET_TICKER),
    readAssistantPrompt(),
    prisma.industryMetric.count({ where: { productionApproved: true } }),
  ]);

  const promptText = assistantPayload.runtime?.prompt?.promptText ?? "";
  const answerText = assistantPayload.answer ?? "";
  const normalizedOutput = answerText.toLowerCase();
  const metricSummary = runtimeContext.industryMetricSummary;

  const result = {
    phase: "159N",
    mode: "assistant_context_dry_run",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    assistantRouteCalledWithProviderNull: true,
    ticker: TARGET_TICKER,
    targetIndustryCode: TARGET_INDUSTRY_CODE,
    runtimeIndustryMetricSummaryAvailable:
      metricSummary?.status === "available" &&
      metricSummary.industryCode === TARGET_INDUSTRY_CODE &&
      metricSummary.rowsFound >= 1,
    runtimeIndustryMetricRowsFound: metricSummary?.rowsFound ?? 0,
    runtimeReadyForAssistantUseFalse: metricSummary?.readyForAssistantUse === false,
    runtimeUsedAsAutoComparisonFalse: metricSummary?.usedAsAutoComparison === false,
    runtimeUsedAsInvestmentConclusionFalse: metricSummary?.usedAsInvestmentConclusion === false,
    promptIncludesIndustryMetricSummary: promptText.includes("industryMetricSummary"),
    promptIncludesSteelMetricCode: promptText.includes("STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION"),
    promptIncludesMetricGuardrail: promptText.includes("Layer 5 industryMetricSummary may be present"),
    promptIncludesFutureChecklistBoundary: promptText.includes("Future metric checklists are user education only"),
    promptIncludesNoBenchmarkBoundary:
      promptText.includes("not as an automated conclusion") &&
      promptText.includes("Do not use IndustryMetric rows as benchmarks"),
    llmStatus: assistantPayload.llmStatus,
    answerIsNull: assistantPayload.answer === null,
    forbiddenOutputDetected: forbiddenOutputTerms.some((term) => normalizedOutput.includes(term)),
    productionApprovedTrueCount,
  };

  const smokePassed =
    result.phase === "159N" &&
    result.mode === "assistant_context_dry_run" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    result.assistantRouteCalledWithProviderNull &&
    result.runtimeIndustryMetricSummaryAvailable &&
    result.runtimeIndustryMetricRowsFound >= 1 &&
    result.runtimeReadyForAssistantUseFalse &&
    result.runtimeUsedAsAutoComparisonFalse &&
    result.runtimeUsedAsInvestmentConclusionFalse &&
    result.promptIncludesIndustryMetricSummary &&
    result.promptIncludesSteelMetricCode &&
    result.promptIncludesMetricGuardrail &&
    result.promptIncludesFutureChecklistBoundary &&
    result.promptIncludesNoBenchmarkBoundary &&
    result.llmStatus === "not_configured" &&
    result.answerIsNull &&
    !result.forbiddenOutputDetected &&
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
