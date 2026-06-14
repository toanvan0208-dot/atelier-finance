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

  it("resolves openai mode to safe placeholder without network call", async () => {
    const provider = resolveAssistantProvider({ AI_ASSISTANT_PROVIDER: "openai" });
    const response = await callAssistantProvider(provider, request);

    expect(provider?.id).toBe("openai-placeholder");
    expect(response.ok).toBe(false);
    expect(response.status).toBe("provider_error");
    expect(response.answer).toBeNull();
    expect(response.error).toContain("not implemented");
  });
});
