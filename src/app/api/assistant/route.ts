import { runAssistant } from "../../../lib/ai-rag/assistant";
import { resolveAssistantProvider } from "../../../lib/ai-rag/providers";
import type { AssistantProvider } from "../../../lib/ai-rag/providers";
import type { AssistantRuntimeInput } from "../../../lib/ai-rag/runtime";
import type { AssistantDataQuality, AssistantModuleContext } from "../../../lib/ai-rag/prompts";

type AssistantApiRequestBody = {
  question?: unknown;
  activeModule?: unknown;
  ticker?: unknown;
  moduleContext?: unknown;
  dataQuality?: unknown;
  allowedNumericValues?: unknown;
  source?: unknown;
  timestamp?: unknown;
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

  return {
    question: body.question.trim(),
    activeModule:
      typeof body.activeModule === "string" && body.activeModule.trim().length > 0
        ? body.activeModule.trim()
        : "overview",
    ticker: asOptionalString(body.ticker),
    moduleContext: isRecord(body.moduleContext)
      ? (body.moduleContext as AssistantModuleContext)
      : undefined,
    dataQuality: isRecord(body.dataQuality)
      ? (body.dataQuality as AssistantDataQuality)
      : undefined,
    allowedNumericValues: asNumericArray(body.allowedNumericValues),
    source: asOptionalString(body.source),
    timestamp: asOptionalString(body.timestamp),
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
