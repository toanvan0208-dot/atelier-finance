import { MockAssistantProvider } from "./mock-provider";
import type { AssistantProvider, AssistantProviderResponse } from "./types";

export type AssistantProviderMode = "none" | "mock" | "openai";

export type AssistantProviderEnv = {
  AI_ASSISTANT_PROVIDER?: string;
  AI_ASSISTANT_MOCK_ANSWER?: string;
};

class OpenAiPlaceholderProvider implements AssistantProvider {
  readonly id = "openai-placeholder";

  async call(): Promise<AssistantProviderResponse> {
    return {
      ok: false,
      status: "provider_error",
      answer: null,
      providerId: this.id,
      error:
        "OpenAI assistant provider mode is configured but not implemented in this MVP. No network call was made.",
    };
  }
}

const normalizeMode = (value: string | undefined): AssistantProviderMode => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "mock" || normalized === "openai" || normalized === "none") {
    return normalized;
  }

  return "none";
};

export const resolveAssistantProvider = (
  env: AssistantProviderEnv = process.env,
): AssistantProvider | null => {
  const mode = normalizeMode(env.AI_ASSISTANT_PROVIDER);

  switch (mode) {
    case "mock":
      return new MockAssistantProvider({
        answer:
          env.AI_ASSISTANT_MOCK_ANSWER ??
          "Mock provider response. This is for local development and tests only.",
      });
    case "openai":
      return new OpenAiPlaceholderProvider();
    case "none":
    default:
      return null;
  }
};
