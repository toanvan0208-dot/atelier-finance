import { describe, expect, it } from "vitest";
import { MockAssistantProvider } from "../../../../lib/ai-rag/providers";
import { createAssistantPostHandler, POST } from "../route";

const postJson = (body: unknown, handler = POST): Promise<Response> =>
  handler(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    }),
  );

const readJson = async <T>(response: Response): Promise<T> => (await response.json()) as T;

type AssistantApiResponse = {
  ok: boolean;
  runtime: {
    selectedDocuments: Array<{ id: string; filePath: string }>;
    detectedIntent: string;
    prompt: { messages: Array<{ role: string; content: string }>; promptText: string };
  } | null;
  answer: string | null;
  llmStatus: string;
  message: string;
  validation?: { isValid: boolean } | null;
  violations?: Array<{ code: string }>;
  refusal?: string | null;
};

describe("POST /api/assistant", () => {
  it("returns ok true for a valid request", async () => {
    const response = await postJson({
      question: "Doanh thu tang thi cong ty tot hon dung khong?",
      activeModule: "financials",
    });
    const json = await readJson<AssistantApiResponse>(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.runtime?.prompt.messages.length).toBe(2);
    expect(json.answer).toBeNull();
    expect(json.llmStatus).toBe("not_configured");
  });

  it("returns 400 when question is missing", async () => {
    const response = await postJson({ activeModule: "financials" });
    const json = await readJson<AssistantApiResponse>(response);

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.runtime).toBeNull();
    expect(json.answer).toBeNull();
    expect(json.llmStatus).toBe("not_configured");
  });

  it("selects PVT and guardrails for a PVT signal question", async () => {
    const response = await postJson({
      question: "Volume tang manh co phai tin hieu mua khong?",
      activeModule: "technical",
    });
    const json = await readJson<AssistantApiResponse>(response);
    const selectedIds = json.runtime?.selectedDocuments.map((document) => document.id);

    expect(response.status).toBe(200);
    expect(selectedIds).toEqual(expect.arrayContaining(["rag_pvt_knowledge", "ai_guardrails"]));
    expect(json.runtime?.prompt.promptText).toContain("PVT is market observation, not a trading signal.");
  });

  it("selects financial statements and risk for negative CFO question", async () => {
    const response = await postJson({
      question: "Loi nhuan duong nhung CFO am nghia la gi?",
      activeModule: "financials",
    });
    const json = await readJson<AssistantApiResponse>(response);
    const selectedIds = json.runtime?.selectedDocuments.map((document) => document.id);

    expect(response.status).toBe(200);
    expect(selectedIds).toEqual(
      expect.arrayContaining(["rag_financial_statements_guide", "rag_risk_knowledge"]),
    );
  });

  it("always returns answer null and llmStatus not_configured", async () => {
    const response = await postJson({
      question: "Risk thap thi co phieu nay an toan khong?",
      activeModule: "risk",
    });
    const json = await readJson<AssistantApiResponse>(response);

    expect(json.answer).toBeNull();
    expect(json.llmStatus).toBe("not_configured");
    expect(json.message).toContain("no LLM provider is configured");
  });

  it("can use an injected mock provider and return a validated safe answer", async () => {
    const handler = createAssistantPostHandler({
      provider: new MockAssistantProvider({
        answer:
          "PVT chi la quan sat thi truong. Khong the khuyen nghi mua ban; can kiem tra them thanh khoan, tai chinh va rui ro.",
      }),
    });
    const response = await postJson(
      {
        question: "Volume tang co phai tin hieu mua khong?",
        activeModule: "technical",
      },
      handler,
    );
    const json = await readJson<AssistantApiResponse>(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.llmStatus).toBe("completed");
    expect(json.answer).toContain("PVT");
    expect(json.validation?.isValid).toBe(true);
  });

  it("blocks unsafe injected mock provider output with guardrails", async () => {
    const handler = createAssistantPostHandler({
      provider: new MockAssistantProvider({
        answer: "Nen mua co phieu nay vi P/E thap.",
      }),
    });
    const response = await postJson(
      {
        question: "Co nen mua co phieu nay khong?",
        activeModule: "valuation",
      },
      handler,
    );
    const json = await readJson<AssistantApiResponse>(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(false);
    expect(json.answer).toBeNull();
    expect(json.llmStatus).toBe("blocked_by_guardrails");
    expect(json.refusal).toContain("vi pham guardrails");
    expect(json.violations?.map((violation) => violation.code)).toContain(
      "BUY_SELL_HOLD_RECOMMENDATION",
    );
  });
});
