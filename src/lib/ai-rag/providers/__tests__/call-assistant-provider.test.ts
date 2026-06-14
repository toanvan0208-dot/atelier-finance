import { describe, expect, it } from "vitest";
import { buildAssistantRuntime } from "../../runtime";
import { callAssistantProvider, MockAssistantProvider } from "../index";
import type { AssistantProviderRequest } from "../types";

const buildRequest = (): AssistantProviderRequest => {
  const runtime = buildAssistantRuntime({
    question: "Giai thich giup toi man hinh nay",
    activeModule: "general",
  });

  return {
    messages: runtime.prompt.messages,
    promptText: runtime.prompt.promptText,
    runtime,
  };
};

describe("callAssistantProvider", () => {
  it("returns not_configured when no provider is supplied", async () => {
    const response = await callAssistantProvider(null, buildRequest());

    expect(response.ok).toBe(false);
    expect(response.status).toBe("not_configured");
    expect(response.answer).toBeNull();
  });

  it("calls mock provider deterministically", async () => {
    const provider = new MockAssistantProvider({
      answer: "Safe educational answer.",
    });
    const response = await callAssistantProvider(provider, buildRequest());

    expect(response.ok).toBe(true);
    expect(response.status).toBe("completed");
    expect(response.answer).toBe("Safe educational answer.");
    expect(response.providerId).toBe("mock-assistant-provider");
  });

  it("converts provider exceptions into safe provider_error responses", async () => {
    const provider = new MockAssistantProvider({
      throwError: true,
      error: "Network failed",
    });
    const response = await callAssistantProvider(provider, buildRequest());

    expect(response.ok).toBe(false);
    expect(response.status).toBe("provider_error");
    expect(response.answer).toBeNull();
    expect(response.error).toBe("Network failed");
  });
});
