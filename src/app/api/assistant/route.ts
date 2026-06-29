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

    // Import loadMacroRuntimeData
    const { loadMacroRuntimeData } = await import("../../../features/macro/lib/load-macro-runtime-data");
    const runtimeData = await loadMacroRuntimeData();
    
    // Evaluate stale or missing based on the runtime structure
    const staleIndicators = runtimeData.indicatorUniverse?.filter((i: any) => i.freshness?.staleStatus === "stale").map((i: any) => i.indicatorCode) || [];
    const missingObservationIndicators = runtimeData.indicatorUniverse?.filter((i: any) => i.inCurrentFrontend && i.freshness?.staleStatus === "unknown" && !i.latestObservation).map((i: any) => i.indicatorCode) || [];
    const frontendLockedIndicators = runtimeData.indicatorUniverse?.filter((i: any) => i.inCurrentFrontend).map((i: any) => i.indicatorCode) || [];
    const notInFrontendIndicators = runtimeData.indicatorUniverse?.filter((i: any) => !i.inCurrentFrontend).map((i: any) => i.indicatorCode) || [];

    const macroContext = {
      observations: runtimeData.indicatorUniverse?.filter((i: any) => i.latestObservation).map((i: any) => i.latestObservation),
      frontendLockedIndicators,
      dbBackedIndicators: runtimeData.dbBackedIndicators,
      missingObservationIndicators,
      staleIndicators,
      sourceAssessmentNeededIndicators: runtimeData.sourceAssessmentNeededIndicators,
      notInFrontendIndicators,
      guardrail: "Do not fabricate data for indicators outside dbBackedIndicators. If user asks about missingObservationIndicators, say the system does not yet have an observation. If asked about notInFrontendIndicators, say the system currently does not support this metric in the Macro module. If asked about staleIndicators, warn that the data might be out of date. Do not make definitive macro-to-industry conclusions or give investment advice. For POLICY_RATE, explicitly state: 'Hiện hệ thống chưa có dữ liệu lãi suất điều hành đã kiểm duyệt, nên không kết luận tác động đến ngành hoặc cổ phiếu từ chỉ số này.' For MARKET_TRADING_VALUE and FOREIGN_NET_FLOW, explicitly state: 'Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho thanh khoản thị trường hoặc giao dịch khối ngoại, nên không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số này.' For FED_FUNDS_RATE, DXY, and BRENT_OIL_PRICE, explicitly state: 'Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho lãi suất Fed, chỉ số USD hoặc giá dầu Brent, nên không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số này.' Do not invent market data or create trading signals, and do not turn foreign flow or liquidity into investment advice. Do not use words like mua/bán/nắm giữ/tín hiệu/đáng mua/hấp dẫn/target price/fair value/upside/downside/giải ngân/đứng ngoài."
    };
    
    runtimeInput.moduleContext = {
      ...runtimeInput.moduleContext,
      macroContext,
    };

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
