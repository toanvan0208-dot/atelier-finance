import { describe, expect, it } from "vitest";
import { callAssistantProvider, resolveAssistantProvider } from "../index";
import type { AssistantProviderRequest } from "../types";

const request = {
  messages: [],
  promptText: "",
  runtime: {} as AssistantProviderRequest["runtime"],
} satisfies AssistantProviderRequest;

describe("resolveAssistantProvider", () => {
  it("defaults to no provider", () => {
    expect(resolveAssistantProvider({})).toBeNull();
  });

  it("falls back to no provider for invalid mode", () => {
    expect(resolveAssistantProvider({ AI_ASSISTANT_PROVIDER: "invalid" })).toBeNull();
  });

  it("resolves mock provider for test/dev mode", async () => {
    const provider = resolveAssistantProvider({
      AI_ASSISTANT_PROVIDER: "mock",
      AI_ASSISTANT_MOCK_ANSWER: "Safe mock answer.",
    });
    const response = await callAssistantProvider(provider, request);

    expect(provider?.id).toBe("mock-assistant-provider");
    expect(response.ok).toBe(true);
    expect(response.answer).toBe("Safe mock answer.");
  });

  it("defaults openai mode to a provider that is not configured without API key", async () => {
    const provider = resolveAssistantProvider({ AI_ASSISTANT_PROVIDER: "openai" });
    const response = await callAssistantProvider(provider, request);

    expect(provider?.id).toBe("openai-chat-completions");
    expect(response.ok).toBe(false);
    expect(response.status).toBe("not_configured");
    expect(response.answer).toBeNull();
    expect(response.error).toContain("OPENAI_API_KEY");
  });

  it("resolves openai mode with API key to OpenAI provider", () => {
    const provider = resolveAssistantProvider({
      AI_ASSISTANT_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "test-model",
    });

    expect(provider?.id).toBe("openai-chat-completions");
  });
});
