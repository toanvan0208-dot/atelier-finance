import { runAssistant } from "../../../lib/ai-rag/assistant";
import { resolveAssistantProvider } from "../../../lib/ai-rag/providers";
import type { AssistantProvider } from "../../../lib/ai-rag/providers";
import type { AssistantRuntimeInput } from "../../../lib/ai-rag/runtime";
import type { AssistantDataQuality, AssistantModuleContext } from "../../../lib/ai-rag/prompts";
import { parseAssistantContextPacket } from "../../../lib/ai-rag/context";
import { loadAssistantMarketPriceContext } from "../../../features/assistant/lib/assistant-market-price-context";
import { loadLatestMacroObservations } from "../../../features/macro/lib/macro-observation-read-path";

type AssistantApiRequestBody = {
  question?: unknown;
  activeModule?: unknown;
  ticker?: unknown;
  moduleContext?: unknown;
  dataQuality?: unknown;
  allowedNumericValues?: unknown;
  source?: unknown;
  timestamp?: unknown;
  contextPacket?: unknown;
};

type AssistantRouteOptions = {
  provider?: AssistantProvider | null;
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asOptionalString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumericArray = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item));
};

const buildRuntimeInput = (body: AssistantApiRequestBody): AssistantRuntimeInput | null => {
  if (typeof body.question !== "string" || body.question.trim().length === 0) {
    return null;
  }

  const contextPacket = parseAssistantContextPacket(body.contextPacket);
  const packetQuality = contextPacket?.dataQuality;
  const packetDataQuality: AssistantDataQuality | undefined = contextPacket
    ? {
        overallStatus: packetQuality?.status ?? "missing",
        isMockData:
          packetQuality?.dataMode === "sample" || packetQuality?.dataMode === "mock",
        missingFields: Array.from(
          new Set([
            ...contextPacket.missingFields,
            ...(packetQuality?.missingFields ?? []),
          ]),
        ),
        sourceIssues:
          packetQuality?.sourceName || packetQuality?.sourceLabel ? [] : ["source"],
        periodIssues: packetQuality?.period ? [] : ["period"],
        dataMode: packetQuality?.dataMode,
        productionApproved: packetQuality?.productionApproved,
        sourceName: packetQuality?.sourceName,
        sourceLabel: packetQuality?.sourceLabel,
        asOf: packetQuality?.asOf,
        period: packetQuality?.period,
        warnings: packetQuality?.warnings,
      }
    : undefined;

  return {
    question: body.question.trim(),
    activeModule:
      contextPacket?.activeModule ??
      (typeof body.activeModule === "string" && body.activeModule.trim().length > 0
        ? body.activeModule.trim()
        : "overview"),
    ticker: contextPacket?.ticker ?? asOptionalString(body.ticker),
    moduleContext: isRecord(body.moduleContext)
      ? (body.moduleContext as AssistantModuleContext)
      : (contextPacket?.moduleContext as AssistantModuleContext | null) ?? undefined,
    dataQuality: isRecord(body.dataQuality)
      ? (body.dataQuality as AssistantDataQuality)
      : packetDataQuality,
    allowedNumericValues:
      asNumericArray(body.allowedNumericValues) ?? contextPacket?.allowedNumericValues,
    source:
      asOptionalString(body.source) ??
      packetQuality?.sourceName ??
      packetQuality?.sourceLabel ??
      null,
    timestamp: asOptionalString(body.timestamp) ?? packetQuality?.asOf ?? null,
    contextPacket,
  };
};

export const createAssistantPostHandler =
  (options: AssistantRouteOptions = {}) =>
  async (request: Request): Promise<Response> => {
    let body: AssistantApiRequestBody;

    try {
      body = (await request.json()) as AssistantApiRequestBody;
    } catch {
      return jsonResponse(
        {
          ok: false,
          runtime: null,
          answer: null,
          llmStatus: "not_configured",
          message: "Invalid JSON body. This endpoint only builds the AI/RAG runtime prompt and does not call an LLM.",
        },
        400,
      );
    }

    const runtimeInput = buildRuntimeInput(body);

    if (!runtimeInput) {
      return jsonResponse(
        {
          ok: false,
          runtime: null,
          answer: null,
          llmStatus: "not_configured",
          message: "Missing required field: question. This endpoint only builds the AI/RAG runtime prompt and does not call an LLM.",
        },
        400,
      );
    }

    if (runtimeInput.ticker) {
      const marketPriceContext = await loadAssistantMarketPriceContext(runtimeInput.ticker);
      if (marketPriceContext.available) {
        runtimeInput.moduleContext = {
          ...runtimeInput.moduleContext,
          marketPriceContext,
        };
      }
    }

    const macroContext = await loadLatestMacroObservations({
      indicatorCodes: ["CPI_YOY", "GDP_GROWTH"]
    });
    if (macroContext && macroContext.available) {
      runtimeInput.moduleContext = {
        ...runtimeInput.moduleContext,
        macroContext,
      };
    }

    const assistantResult = await runAssistant({
      ...runtimeInput,
      provider:
        options.provider !== undefined ? options.provider : resolveAssistantProvider(),
    });

    return jsonResponse(
      assistantResult,
      assistantResult.llmStatus === "provider_error" ? 502 : 200,
    );
  };

export const POST = createAssistantPostHandler();
