import type { AssistantPromptMessage } from "../prompts";
import type { AssistantRuntimeOutput } from "../runtime";

export type AssistantProviderStatus = "completed" | "not_configured" | "provider_error";

export type AssistantProviderRequest = {
  messages: AssistantPromptMessage[];
  promptText: string;
  runtime: AssistantRuntimeOutput;
  metadata?: {
    question: string;
    activeModule: string;
    ticker?: string | null;
  };
};

export type AssistantProviderResponse = {
  ok: boolean;
  status: AssistantProviderStatus;
  answer: string | null;
  providerId?: string;
  model?: string;
  raw?: unknown;
  error?: string;
};

export type AssistantProvider = {
  id: string;
  call(request: AssistantProviderRequest): Promise<AssistantProviderResponse>;
};
