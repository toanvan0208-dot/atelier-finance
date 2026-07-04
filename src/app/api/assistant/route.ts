import { runAssistant } from "../../../lib/ai-rag/assistant";
import { resolveAssistantProvider } from "../../../lib/ai-rag/providers";
import type { AssistantProvider } from "../../../lib/ai-rag/providers";
import type { AssistantRuntimeInput } from "../../../lib/ai-rag/runtime";
import type { AssistantDataQuality, AssistantModuleContext } from "../../../lib/ai-rag/prompts";
import { parseAssistantContextPacket } from "../../../lib/ai-rag/context";
import { loadAssistantMarketPriceContext } from "../../../features/assistant/lib/assistant-market-price-context";
import { loadIndustryContextRuntimeByTicker } from "../../../features/industry/lib/load-industry-context";
import {
  buildIndustryPdfRagIndex,
  retrieveIndustryPdfRagChunks,
  toIndustryPdfRagPromptChunks,
  type IndustryPdfRagIndustryCode,
} from "../../../features/industry/lib/industry-pdf-rag";
import {
  REVIEWED_INDUSTRY_CODES,
  REVIEWED_MAPPED_TICKERS,
  REVIEWED_UNSUPPORTED_TICKERS,
  UNSUPPORTED_TICKER_POLICY,
} from "../../../features/industry/lib/reviewed-industry-coverage";

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

const INDUSTRY_METRIC_ASSISTANT_GUARDRAIL =
  "Layer 5 industryMetricSummary may be present in moduleContext as research-only, needsReview, productionApproved=false data. readyForAssistantUse=false means the assistant may mention these metrics only as context for what to check next, not as an automated conclusion. Do not use IndustryMetric rows as benchmarks, rankings, scores, automatic comparisons, valuation inputs, risk benchmarks, trade-action guidance, or stock attractiveness claims. If a metric is missing, say the system has no eligible metric row. Future metric checklists are user education only and must not be treated as DB data.";

const INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL =
  "Industry PDF RAG chunks may be present as research-only, local PDF derived, needsReview=true, productionApproved=false context. Use retrieved PDF chunks only to explain industry context and next checks. Cite source label/page only when the user asks for sources/evidence or when using a specific number/date from retrieved chunks. Do not turn PDF snippets into buy/sell/hold guidance, target price, fair value, upside/downside, ranking, scoring, benchmark, or stock attractiveness claims.";

const isIndustryPdfRagIndustryCode = (
  value: string | null | undefined,
): value is IndustryPdfRagIndustryCode =>
  value === "STEEL_MATERIALS" ||
  value === "RETAIL" ||
  value === "CONSUMER_STAPLES_DAIRY";

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

      const industryContext = await loadIndustryContextRuntimeByTicker(runtimeInput.ticker);
      const activeModuleIsIndustry = runtimeInput.activeModule.toLowerCase() === "industry";
      let industryPdfRagContext: Record<string, unknown> | undefined;
      let industryPdfRagWarnings: string[] = [];

      if (
        activeModuleIsIndustry &&
        isIndustryPdfRagIndustryCode(industryContext.taxonomy.taxonomySummary.industryCode)
      ) {
        try {
          const industryPdfRagIndex = buildIndustryPdfRagIndex();
          const retrievedPdfChunks = retrieveIndustryPdfRagChunks(industryPdfRagIndex, {
            industryCode: industryContext.taxonomy.taxonomySummary.industryCode,
            question: runtimeInput.question,
            topK: 3,
          });

          runtimeInput.supplementalRetrievedChunks =
            toIndustryPdfRagPromptChunks(retrievedPdfChunks);
          industryPdfRagContext = {
            status: retrievedPdfChunks.length > 0 ? "available" : "missing",
            dataMode: "research_only",
            needsReview: true,
            productionApproved: false,
            sourceType: "local_pdf_reports",
            sourceFilesMissing: industryPdfRagIndex.sourceFilesMissing,
            retrievedChunkCount: retrievedPdfChunks.length,
            usedChunkIds: retrievedPdfChunks.map((chunk) => chunk.chunkId),
            sourcePages: retrievedPdfChunks.map((chunk) => ({
              sourceKey: chunk.sourceKey,
              sourceLabel: chunk.sourceLabel,
              reportDate: chunk.reportDate,
              pageNumber: chunk.pageNumber,
            })),
            guardrail: INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL,
          };
        } catch (error) {
          industryPdfRagWarnings = [
            "INDUSTRY_PDF_RAG_UNAVAILABLE",
            error instanceof Error ? error.message : "Unknown Industry PDF RAG error",
          ];
          industryPdfRagContext = {
            status: "unavailable",
            dataMode: "research_only",
            needsReview: true,
            productionApproved: false,
            sourceType: "local_pdf_reports",
            retrievedChunkCount: 0,
            guardrail: INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL,
            warnings: industryPdfRagWarnings,
          };
        }
      }

      runtimeInput.moduleContext = {
        ...runtimeInput.moduleContext,
        industryContext,
        ...(industryPdfRagContext ? { industryPdfRagContext } : {}),
        industryMetricAssistantGuardrail: INDUSTRY_METRIC_ASSISTANT_GUARDRAIL,
        industryPdfRagAssistantGuardrail: INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL,
        industryContextGuardrail:
          `IndustryContext, Industry taxonomy, and peer group data are qualitative research-only data with productionApproved=false and needsReview=true. Reviewed Industry coverage is currently limited to ${REVIEWED_INDUSTRY_CODES.join(", ")} for mapped tickers ${REVIEWED_MAPPED_TICKERS.join(", ")}. Source-backed full qualitative context may be used only when industryContext.context.reviewedQualitativeContextAvailable and industryContext.context.fullQualitativeContextAvailable are true for HPG, MWG, or VNM. Unsupported milestone tickers include ${REVIEWED_UNSUPPORTED_TICKERS.join(", ")}. ${UNSUPPORTED_TICKER_POLICY} Missing taxonomy or qualitative context means not yet reviewed in system data, not that the company has no industry. Taxonomy and qualitative context are not investment advice, not valuation benchmarks, not risk benchmarks, and not peer benchmarks. Peer groups are taxonomy/context comparison only, not valuation benchmarks or risk benchmarks. If taxonomy, peer group, or qualitative context status is missing, say the system has no eligible reviewed data for the ticker. Do not infer peers, invent industry metrics, create benchmarks, say one ticker is better/worse from taxonomy or peer membership, or make deterministic macro-to-industry conclusions. ${INDUSTRY_METRIC_ASSISTANT_GUARDRAIL} ${INDUSTRY_PDF_RAG_ASSISTANT_GUARDRAIL}`,
      };
    }

    // Import loadMacroRuntimeData
    const { loadMacroRuntimeData } = await import("../../../features/macro/lib/load-macro-runtime-data");
    const runtimeData = await loadMacroRuntimeData();
    
    type MacroRuntimeIndicator = {
      indicatorCode: string;
      inCurrentFrontend?: boolean;
      freshness?: { staleStatus?: string };
      latestObservation?: unknown;
      latestObservations?: unknown[];
    };
    const runtimeIndicators = (runtimeData.indicatorUniverse ?? []) as MacroRuntimeIndicator[];

    // Evaluate stale or missing based on the runtime structure
    const staleIndicators = runtimeIndicators.filter((i) => i.freshness?.staleStatus === "stale").map((i) => i.indicatorCode);
    const missingObservationIndicators = runtimeIndicators.filter((i) => i.inCurrentFrontend && i.freshness?.staleStatus === "unknown" && !i.latestObservation).map((i) => i.indicatorCode);
    const frontendLockedIndicators = runtimeIndicators.filter((i) => i.inCurrentFrontend).map((i) => i.indicatorCode);
    const notInFrontendIndicators = runtimeIndicators.filter((i) => !i.inCurrentFrontend).map((i) => i.indicatorCode);
    const macroObservations = runtimeIndicators.flatMap((indicator) =>
      indicator.latestObservations?.length
        ? indicator.latestObservations
        : indicator.latestObservation
          ? [indicator.latestObservation]
          : [],
    );

    const macroContext = {
      observations: macroObservations,
      caveats: {
        USD_VND: "Vietcombank commercial-bank transfer quote, not SBV central rate.",
        EXPORT_GROWTH: "Derived YoY from GSO export value CSV, not directly published growth.",
        CREDIT_GROWTH: "Manually aggregated from SBV/news/publication sources, not an official machine-readable SBV CSV; productionApproved=false and needsReview=true.",
        PUBLIC_INVESTMENT: "Unit disambiguates whether the row is value in billion_vnd or progress as percent_of_plan_ytd.",
        FOREIGN_NET_FLOW: "Manual aggregated HOSE-only foreign investor net flow; positive and negative values describe market-flow terminology, not investment advice; productionApproved=false and needsReview=true.",
        PMI_MANUFACTURING: "Manual/secondary-source PMI manufacturing candidate; unit is index; productionApproved=false and needsReview=true.",
        POLICY_RATE: "Monthly carry-forward snapshot of the SBV refinancing rate; not a machine-readable official SBV feed; productionApproved=false and needsReview=true.",
        MARKET_TRADING_VALUE: "Average daily/session trading value by month for HOSE, not total monthly trading value; productionApproved=false and needsReview=true.",
      },
      frontendLockedIndicators,
      dbBackedIndicators: runtimeData.dbBackedIndicators,
      missingObservationIndicators,
      staleIndicators,
      sourceAssessmentNeededIndicators: runtimeData.sourceAssessmentNeededIndicators,
      notInFrontendIndicators,
      guardrail: "Do not fabricate data for indicators outside dbBackedIndicators. If user asks about missingObservationIndicators, say the system does not yet have an observation. If asked about notInFrontendIndicators, say the system currently does not support this metric in the Macro module. If asked about staleIndicators, warn that the data might be out of date. Do not make definitive macro-to-industry conclusions or give investment advice. For POLICY_RATE, MARKET_TRADING_VALUE, FOREIGN_NET_FLOW, and PMI_MANUFACTURING, use the DB observation only when present in dbBackedIndicators and explicitly state it is candidate/manual data with productionApproved=false and needsReview=true; if absent, say the system does not yet have an observation. For FED_FUNDS_RATE, DXY, and BRENT_OIL_PRICE, explicitly state: 'Dữ liệu hệ thống hiện có cho lãi suất Fed, sức mạnh USD và giá dầu Brent là dữ liệu candidate/chưa kiểm duyệt production.' For USD_VND, EXPORT_GROWTH, CREDIT_GROWTH, and PUBLIC_INVESTMENT, explicitly state: 'Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho tỷ giá USD/VND, xuất khẩu, tăng trưởng tín dụng hoặc thực hiện vốn đầu tư công nếu các chỉ số này không có observation trong dữ liệu hệ thống; vì vậy không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số bị thiếu.' Do not invent market data, do not create action-oriented market calls, and do not turn foreign flow, liquidity, exchange rate, export, credit, or public investment gaps into investment advice. Avoid investment-action wording and valuation-outcome claims."
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
