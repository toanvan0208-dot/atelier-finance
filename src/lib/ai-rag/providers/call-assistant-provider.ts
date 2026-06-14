import type {
  AssistantProvider,
  AssistantProviderRequest,
  AssistantProviderResponse,
} from "./types";

export const callAssistantProvider = async (
  provider: AssistantProvider | null | undefined,
  request: AssistantProviderRequest,
): Promise<AssistantProviderResponse> => {
  if (!provider) {
    return {
      ok: false,
      status: "not_configured",
      answer: null,
      error: "No assistant provider is configured.",
    };
  }

  try {
    return await provider.call(request);
  } catch (error) {
    return {
      ok: false,
      status: "provider_error",
      answer: null,
      providerId: provider.id,
      error: error instanceof Error ? error.message : "Assistant provider failed.",
    };
  }
};
