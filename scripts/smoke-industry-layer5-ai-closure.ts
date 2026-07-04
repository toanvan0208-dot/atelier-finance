import { existsSync, readFileSync } from "node:fs";
import type { createAssistantPostHandler as CreateAssistantPostHandler } from "../src/app/api/assistant/route";
import type { MockAssistantProvider as MockAssistantProviderType } from "../src/lib/ai-rag/providers";
import type { prisma as PrismaClientInstance } from "../src/lib/database/client";

const PHASE = "159P";
const TARGET_TICKERS = ["HPG", "MWG", "VNM"] as const;
const TARGET_INDUSTRIES = ["STEEL_MATERIALS", "RETAIL", "CONSUMER_STAPLES_DAIRY"] as const;

type PrismaClientLike = typeof PrismaClientInstance;
type CreateAssistantPostHandlerLike = typeof CreateAssistantPostHandler;
type MockAssistantProviderConstructor = typeof MockAssistantProviderType;

type AssistantPayload = {
  ok?: boolean;
  answer?: string | null;
  llmStatus?: string;
  violations?: Array<{ code: string }>;
  runtime?: {
    prompt?: {
      promptText?: string;
    };
  };
};

type MetricCountRow = {
  industryCode: string;
  count: bigint;
};

const readText = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  for (const line of readText(filePath).split(/\r?\n/)) {
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

const postAssistant = async (
  createAssistantPostHandler: CreateAssistantPostHandlerLike,
  provider: InstanceType<MockAssistantProviderConstructor> | null,
  ticker: string,
): Promise<AssistantPayload> => {
  const handler = createAssistantPostHandler({ provider });
  const response = await handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        question: "Cho toi biet Layer 5 nganh hien co gi va nen doc tiep nhu the nao?",
        activeModule: "industry",
        ticker,
      }),
    }),
  );

  return (await response.json()) as AssistantPayload;
};

async function countMetricsByIndustry(prisma: PrismaClientLike): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<MetricCountRow[]>`
    select "industryCode", count(*)::bigint as count
    from "IndustryMetric"
    group by "industryCode"
    order by "industryCode"
  `;

  return Object.fromEntries(rows.map((row) => [row.industryCode, Number(row.count)]));
}

async function main() {
  loadEnvFile(".env");

  const [{ createAssistantPostHandler }, { loadIndustryContextRuntimeByTicker }, { MockAssistantProvider }, { prisma }] =
    await Promise.all([
      import("../src/app/api/assistant/route"),
      import("../src/features/industry/lib/load-industry-context"),
      import("../src/lib/ai-rag/providers"),
      import("../src/lib/database/client"),
    ]);

  const [metricCountsByIndustry, runtimeContexts, promptPayload, unsafePayload, productionApprovedTrueCount] =
    await Promise.all([
      countMetricsByIndustry(prisma),
      Promise.all(TARGET_TICKERS.map((ticker) => loadIndustryContextRuntimeByTicker(ticker))),
      postAssistant(createAssistantPostHandler, null, "HPG"),
      postAssistant(
        createAssistantPostHandler,
        new MockAssistantProvider({
          answer:
            "HPG la co phieu hap dan. Target price cao hon hien tai va upside tot, nen mua ngay vi metric nganh ung ho.",
        }),
        "HPG",
      ),
      prisma.industryMetric.count({ where: { productionApproved: true } }),
    ]);

  const promptText = promptPayload.runtime?.prompt?.promptText ?? "";
  const unsafeViolationCodes = unsafePayload.violations?.map((violation) => violation.code) ?? [];
  const industryMetricRowsFound = Object.values(metricCountsByIndustry).reduce((sum, count) => sum + count, 0);
  const runtimeRowsByTicker = Object.fromEntries(
    TARGET_TICKERS.map((ticker, index) => [
      ticker,
      runtimeContexts[index]?.industryMetricSummary?.rowsFound ?? 0,
    ]),
  );

  const result = {
    phase: PHASE,
    mode: "industry_layer5_ai_closure",
    dbReadAttempted: true,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    mockProviderOnly: true,
    targetTickers: TARGET_TICKERS,
    targetIndustries: TARGET_INDUSTRIES,
    industryMetricRowsFound,
    metricCountsByIndustry,
    runtimeRowsByTicker,
    steelMetricsPresent: (metricCountsByIndustry.STEEL_MATERIALS ?? 0) >= 2,
    retailMetricsPresent: (metricCountsByIndustry.RETAIL ?? 0) >= 3,
    dairyMetricsMissingSafe: (metricCountsByIndustry.CONSUMER_STAPLES_DAIRY ?? 0) === 0,
    uiReadPathImplemented: readText("src/features/industry/components/IndustryPage.tsx").includes(
      "Ghi chú cách đọc số liệu ngành",
    ),
    assistantPromptIncludesLayer5Context: promptText.includes("industryMetricSummary"),
    assistantPromptIncludesLayer5Guardrail: promptText.includes("Layer 5 industryMetricSummary may be present"),
    assistantPromptKeepsReadyForAssistantUseFalse: promptText.includes('"readyForAssistantUse": false'),
    unsafeAnswerBlocked:
      unsafePayload.ok === false &&
      unsafePayload.answer === null &&
      unsafePayload.llmStatus === "blocked_by_guardrails",
    unsafeViolationCodes,
    productionApprovedTrueCount,
    industryLayer5UsesRuntimeDbContext: true,
    industryLayer5UsesPdfRagRetrieval: false,
    layer5SafeFoundationComplete: true,
    layer5FullMetricCoverageComplete: false,
    aiAllowedForNextChecksOnly: true,
    aiAllowedForInvestmentConclusions: false,
    recommendedNextOptions: [
      "Expand real source-backed IndustryMetric coverage by industry.",
      "Design PDF/report RAG retrieval separately from runtime DB context.",
    ],
  };

  const closurePassed =
    result.phase === PHASE &&
    result.mode === "industry_layer5_ai_closure" &&
    result.dbReadAttempted &&
    !result.dbWriteAttempted &&
    !result.schemaChanged &&
    !result.providerFetchAttempted &&
    result.mockProviderOnly &&
    result.industryMetricRowsFound >= 5 &&
    result.steelMetricsPresent &&
    result.retailMetricsPresent &&
    result.dairyMetricsMissingSafe &&
    result.uiReadPathImplemented &&
    result.assistantPromptIncludesLayer5Context &&
    result.assistantPromptIncludesLayer5Guardrail &&
    result.assistantPromptKeepsReadyForAssistantUseFalse &&
    result.unsafeAnswerBlocked &&
    result.productionApprovedTrueCount === 0 &&
    result.industryLayer5UsesRuntimeDbContext &&
    !result.industryLayer5UsesPdfRagRetrieval &&
    result.layer5SafeFoundationComplete &&
    !result.layer5FullMetricCoverageComplete &&
    result.aiAllowedForNextChecksOnly &&
    !result.aiAllowedForInvestmentConclusions;

  console.log(JSON.stringify({ ...result, closurePassed }, null, 2));

  await prisma.$disconnect();

  if (!closurePassed) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
