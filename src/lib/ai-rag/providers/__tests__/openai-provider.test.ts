import { describe, expect, it, vi } from "vitest";
import { runAssistant } from "../../assistant";
import { buildAssistantRuntime } from "../../runtime";
import { callAssistantProvider, OpenAiAssistantProvider } from "../index";
import type { AssistantProviderRequest } from "../types";

const buildRequest = (): AssistantProviderRequest => {
  const runtime = buildAssistantRuntime({
    question: "Giai thich giup toi",
    activeModule: "general",
  });

  return {
    messages: runtime.prompt.messages,
    promptText: runtime.prompt.promptText,
    runtime,
  };
};

const mockFetchResponse = (body: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
    },
  });

describe("OpenAiAssistantProvider", () => {
  it("does not call network when API key is missing", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = new OpenAiAssistantProvider({ fetcher });
    const response = await callAssistantProvider(provider, buildRequest());

    expect(response.ok).toBe(false);
    expect(response.status).toBe("not_configured");
    expect(response.answer).toBeNull();
    expect(response.error).toContain("OPENAI_API_KEY");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("passes safe mocked OpenAI answer through assistant validator", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      mockFetchResponse({
        id: "chatcmpl-safe",
        model: "test-model",
        choices: [
          {
            message: {
              content:
                "Khong the khuyen nghi mua ban. Toi chi co the giai thich du lieu hien co va cac rui ro can kiem tra them.",
            },
          },
        ],
      }),
    );
    const result = await runAssistant({
      question: "Co nen mua co phieu nay khong?",
      activeModule: "general",
      provider: new OpenAiAssistantProvider({
        apiKey: "test-key",
        model: "test-model",
        fetcher,
      }),
    });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.validation?.isValid).toBe(true);
    expect(result.answer).toContain("Khong the");
  });

  it("blocks unsafe mocked OpenAI answer with output guardrails", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      mockFetchResponse({
        choices: [
          {
            message: {
              content: "Nen mua co phieu nay vi P/E thap.",
            },
          },
        ],
      }),
    );
    const result = await runAssistant({
      question: "Co nen mua khong?",
      activeModule: "valuation",
      provider: new OpenAiAssistantProvider({
        apiKey: "test-key",
        fetcher,
      }),
    });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result.ok).toBe(false);
    expect(result.answer).toBeNull();
    expect(result.llmStatus).toBe("blocked_by_guardrails");
    expect(result.violations.map((violation) => violation.code)).toContain(
      "BUY_SELL_HOLD_RECOMMENDATION",
    );
  });

  it("returns safe provider_error on mocked OpenAI API error", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      mockFetchResponse(
        {
          error: {
            message: "Bad request",
          },
        },
        { status: 400 },
      ),
    );
    const provider = new OpenAiAssistantProvider({
      apiKey: "test-key",
      fetcher,
    });
    const response = await callAssistantProvider(provider, buildRequest());

    expect(fetcher).toHaveBeenCalledOnce();
    expect(response.ok).toBe(false);
    expect(response.status).toBe("provider_error");
    expect(response.answer).toBeNull();
    expect(response.error).toBe("Bad request");
  });
});
