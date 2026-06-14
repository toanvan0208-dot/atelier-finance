import { describe, expect, it } from "vitest";
import { POST } from "../../../../app/api/assistant/route";
import { MockAssistantProvider } from "../../providers";
import { runAssistant } from "../index";

const postJson = (body: unknown): Promise<Response> =>
  POST(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    }),
  );

describe("runAssistant", () => {
  it("returns a valid answer when mock provider output passes guardrails", async () => {
    const result = await runAssistant({
      question: "Volume tang co y nghia gi?",
      activeModule: "technical",
      provider: new MockAssistantProvider({
        answer:
          "PVT chi la quan sat thi truong. Co the xem volume va thanh khoan nhu du lieu bo sung, khong phai khuyen nghi mua ban.",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.answer).toContain("PVT");
    expect(result.validation?.isValid).toBe(true);
  });

  it("blocks unsafe buy recommendation from mock provider", async () => {
    const result = await runAssistant({
      question: "Co nen mua co phieu nay khong?",
      activeModule: "valuation",
      provider: new MockAssistantProvider({
        answer: "Nen mua co phieu nay vi P/E thap.",
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.llmStatus).toBe("blocked_by_guardrails");
    expect(result.answer).toBeNull();
    expect(result.refusal).toContain("vi pham guardrails");
    expect(result.violations.map((violation) => violation.code)).toContain(
      "BUY_SELL_HOLD_RECOMMENDATION",
    );
  });

  it("blocks fake fair value or target price when context does not allow it", async () => {
    const result = await runAssistant({
      question: "Fair value la bao nhieu?",
      activeModule: "valuation",
      provider: new MockAssistantProvider({
        answer: "Fair value cua co phieu nay la 42000 dong.",
      }),
      validationContext: {
        hasFairValueInContext: false,
        hasTargetPriceInContext: false,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.llmStatus).toBe("blocked_by_guardrails");
    expect(result.answer).toBeNull();
    expect(result.violations.map((violation) => violation.code)).toContain(
      "FAKE_FAIR_VALUE_OR_TARGET_PRICE",
    );
  });

  it("returns safe provider_error output when provider fails", async () => {
    const result = await runAssistant({
      question: "Giai thich giup toi",
      activeModule: "general",
      provider: new MockAssistantProvider({
        error: "Provider unavailable",
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.llmStatus).toBe("provider_error");
    expect(result.answer).toBeNull();
    expect(result.message).toBe("Provider unavailable");
  });

  it("keeps not_configured status when no provider is configured", async () => {
    const result = await runAssistant({
      question: "Giai thich giup toi",
      activeModule: "general",
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("not_configured");
    expect(result.answer).toBeNull();
    expect(result.validation).toBeNull();
  });

  it("API route still does not generate a fake answer", async () => {
    const response = await postJson({
      question: "Volume tang co phai tin hieu mua khong?",
      activeModule: "technical",
    });
    const json = (await response.json()) as {
      ok: boolean;
      answer: string | null;
      llmStatus: string;
      message: string;
    };

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.answer).toBeNull();
    expect(json.llmStatus).toBe("not_configured");
    expect(json.message).toContain("no LLM provider is configured");
  });
});
