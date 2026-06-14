import type {
  AssistantProvider,
  AssistantProviderRequest,
  AssistantProviderResponse,
} from "./types";

export type MockAssistantProviderOptions = {
  id?: string;
  answer?: string | null;
  model?: string;
  error?: string;
  throwError?: boolean;
};

export class MockAssistantProvider implements AssistantProvider {
  readonly id: string;

  private readonly answer: string | null;
  private readonly model: string;
  private readonly error?: string;
  private readonly throwError: boolean;

  constructor(options: MockAssistantProviderOptions = {}) {
    this.id = options.id ?? "mock-assistant-provider";
    this.answer = options.answer ?? null;
    this.model = options.model ?? "mock-model";
    this.error = options.error;
    this.throwError = options.throwError ?? false;
  }

  async call(request: AssistantProviderRequest): Promise<AssistantProviderResponse> {
    if (this.throwError) {
      throw new Error(this.error ?? "Mock provider error");
    }

    if (this.error) {
      return {
        ok: false,
        status: "provider_error",
        answer: null,
        providerId: this.id,
        model: this.model,
        error: this.error,
      };
    }

    return {
      ok: true,
      status: "completed",
      answer: this.answer,
      providerId: this.id,
      model: this.model,
      raw: {
        messageCount: request.messages.length,
      },
    };
  }
}
