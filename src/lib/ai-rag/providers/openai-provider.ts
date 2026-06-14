import type {
  AssistantProvider,
  AssistantProviderRequest,
  AssistantProviderResponse,
} from "./types";

export type OpenAiAssistantProviderOptions = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  fetcher?: typeof fetch;
};

type OpenAiChatCompletionResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export class OpenAiAssistantProvider implements AssistantProvider {
  readonly id = "openai-chat-completions";

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;

  constructor(options: OpenAiAssistantProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_OPENAI_MODEL;
    this.endpoint = options.endpoint ?? DEFAULT_OPENAI_ENDPOINT;
    this.fetcher = options.fetcher ?? fetch;
  }

  async call(request: AssistantProviderRequest): Promise<AssistantProviderResponse> {
    if (!this.apiKey) {
      return {
        ok: false,
        status: "not_configured",
        answer: null,
        providerId: this.id,
        model: this.model,
        error: "OPENAI_API_KEY is not configured. No OpenAI request was made.",
      };
    }

    try {
      const response = await this.fetcher(this.endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          temperature: 0.2,
        }),
      });
      const payload = (await response.json()) as OpenAiChatCompletionResponse;

      if (!response.ok) {
        return {
          ok: false,
          status: "provider_error",
          answer: null,
          providerId: this.id,
          model: this.model,
          raw: payload,
          error: payload.error?.message ?? `OpenAI request failed with status ${response.status}.`,
        };
      }

      const answer = payload.choices?.[0]?.message?.content?.trim() ?? null;

      if (!answer) {
        return {
          ok: false,
          status: "provider_error",
          answer: null,
          providerId: this.id,
          model: payload.model ?? this.model,
          raw: payload,
          error: "OpenAI response did not include assistant content.",
        };
      }

      return {
        ok: true,
        status: "completed",
        answer,
        providerId: this.id,
        model: payload.model ?? this.model,
        raw: {
          id: payload.id,
        },
      };
    } catch (error) {
      return {
        ok: false,
        status: "provider_error",
        answer: null,
        providerId: this.id,
        model: this.model,
        error: error instanceof Error ? error.message : "OpenAI request failed.",
      };
    }
  }
}
