import { MockAssistantProvider } from "./mock-provider";
import { OpenAiAssistantProvider } from "./openai-provider";
import type { AssistantProvider } from "./types";

export type AssistantProviderMode = "none" | "mock" | "openai";

export type AssistantProviderEnv = {
  AI_ASSISTANT_PROVIDER?: string;
  AI_ASSISTANT_MOCK_ANSWER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

const normalizeMode = (value: string | undefined): AssistantProviderMode => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "mock" || normalized === "openai" || normalized === "none") {
    return normalized;
  }

  return "none";
};

const assistantProviderEnvFromProcess = (): AssistantProviderEnv => ({
  AI_ASSISTANT_PROVIDER: process.env.AI_ASSISTANT_PROVIDER,
  AI_ASSISTANT_MOCK_ANSWER: process.env.AI_ASSISTANT_MOCK_ANSWER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
});

export const resolveAssistantProvider = (
  env: AssistantProviderEnv = assistantProviderEnvFromProcess(),
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
      return new OpenAiAssistantProvider({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
      });
    case "none":
    default:
      return null;
  }
};
