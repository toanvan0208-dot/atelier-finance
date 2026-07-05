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

  it("normalizes raw markdown markers before returning provider answers", async () => {
    const result = await runAssistant({
      question: "Rui ro chinh can doc la gi?",
      activeModule: "risk",
      provider: new MockAssistantProvider({
        answer:
          "### Rui ro can kiem tra\n\n**Dong tien:** Can doc CFO, no vay va von luu dong.",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.answer).toBe("Rui ro can kiem tra\n\nDong tien: Can doc CFO, no vay va von luu dong.");
  });

  it("does not block answers when numeric guardrails only produce non-critical warnings", async () => {
    const result = await runAssistant({
      question: "PVT dung de lam gi?",
      activeModule: "technical",
      contextPacket: {
        ticker: "HPG",
        activeModule: "technical",
        moduleContext: { moduleKey: "technical", ticker: "HPG" },
        dataQuality: {
          dataMode: "research_only",
          productionApproved: false,
          sourceName: null,
          sourceLabel: null,
          asOf: null,
          period: null,
          warnings: [],
        },
        missingFields: [],
        allowedNumericValues: [],
        visibleFacts: ["Active module: technical", "Ticker: HPG"],
        constraints: ["Do not infer missing values."],
      },
      provider: new MockAssistantProvider({
        answer: "PVT gom 3 diem doc: gia, khoi luong va thoi gian.",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.validation?.severity).toBe("warning");
    expect(result.violations).toEqual([]);
  });

  it("answers current market price directly from grounded market price context", async () => {
    const result = await runAssistant({
      question: "giá cổ phiếu hiện tại hpg",
      activeModule: "valuation",
      ticker: "HPG",
      moduleContext: {
        moduleKey: "valuation",
        ticker: "HPG",
        marketPriceContext: {
          available: true,
          ticker: "HPG",
          latestMarketPrice: {
            marketDate: "2026-07-04T00:00:00.000Z",
            closePrice: "23.5",
            sourceLabel: "Local market price",
            dataMode: "research_only",
            productionApproved: false,
          },
          provenance: {
            available: true,
            productionApproved: false,
            needsReview: true,
          },
        },
      },
      provider: new MockAssistantProvider({
        throwError: true,
        error: "Provider should not be called for grounded market price lookups.",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.providerResponse).toBeNull();
    expect(result.answer).toContain("Giá đóng cửa gần nhất của HPG");
    expect(result.answer).toContain("23,5");
    expect(result.answer).toContain("không phải kết luận định giá");
    expect(result.violations).toEqual([]);
  });

  it("answers DCF formula questions directly as safe education", async () => {
    const result = await runAssistant({
      question: "công thức dcf",
      activeModule: "valuation",
      ticker: "HPG",
      provider: new MockAssistantProvider({
        throwError: true,
        error: "Provider should not be called for deterministic DCF formula education.",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.providerResponse).toBeNull();
    expect(result.answer).toContain("DCF là cách quy đổi dòng tiền tương lai về hiện tại");
    expect(result.answer).toContain("FCF");
    expect(result.answer).toContain("không tự tạo kết luận đầu tư");
    expect(result.violations).toEqual([]);
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

  it("blocks target price even when legacy validation context claims it exists", async () => {
    const result = await runAssistant({
      question: "Gia muc tieu la bao nhieu?",
      activeModule: "valuation",
      provider: new MockAssistantProvider({
        answer: "Gia muc tieu cua co phieu nay la 42000 dong.",
      }),
      validationContext: {
        hasTargetPriceInContext: true,
      },
    });

    expect(result.llmStatus).toBe("blocked_by_guardrails");
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

  it("adds missing-data disclosure when provider output only misses that caveat", async () => {
    const contextPacket = {
      ticker: "FPT",
      activeModule: "risk",
      moduleContext: null,
      dataQuality: {
        dataMode: "unavailable",
        productionApproved: false,
        sourceName: null,
        sourceLabel: null,
        asOf: null,
        period: null,
        warnings: ["Screen context is unavailable."],
      },
      missingFields: ["moduleContext", "source", "asOf", "period"],
      allowedNumericValues: [],
      visibleFacts: ["Ticker in workspace URL: FPT"],
      constraints: ["Do not infer missing values."],
    } as const;
    const disclosed = await runAssistant({
      question: "Giai thich du lieu hien tai",
      activeModule: "risk",
      contextPacket: {
        ...contextPacket,
        missingFields: [...contextPacket.missingFields],
        allowedNumericValues: [],
        visibleFacts: [...contextPacket.visibleFacts],
        constraints: [...contextPacket.constraints],
        dataQuality: {
          ...contextPacket.dataQuality,
          warnings: [...contextPacket.dataQuality.warnings],
        },
      },
      provider: new MockAssistantProvider({ answer: "Doanh thu dang tang." }),
    });
    const safe = await runAssistant({
      question: "Giai thich du lieu hien tai",
      activeModule: "risk",
      contextPacket: {
        ...contextPacket,
        missingFields: [...contextPacket.missingFields],
        allowedNumericValues: [],
        visibleFacts: [...contextPacket.visibleFacts],
        constraints: [...contextPacket.constraints],
        dataQuality: {
          ...contextPacket.dataQuality,
          warnings: [...contextPacket.dataQuality.warnings],
        },
      },
      provider: new MockAssistantProvider({
        answer: "Chua du du lieu de ket luan; can kiem tra them source, asOf va period.",
      }),
    });

    expect(disclosed.llmStatus).toBe("completed");
    expect(disclosed.answer).toContain("dữ liệu màn hình chưa đủ");
    expect(disclosed.answer).toContain("Doanh thu dang tang.");
    expect(disclosed.violations).toEqual([]);
    expect(safe.llmStatus).toBe("completed");
  });

  it("replaces recoverable valuation-conclusion wording with a safe screening explanation", async () => {
    const result = await runAssistant({
      question: "Tieu chi loc co phai thesis khong?",
      activeModule: "screening",
      contextPacket: {
        ticker: null,
        activeModule: "screening",
        moduleContext: { moduleKey: "screening" },
        dataQuality: {
          dataMode: "research_only",
          productionApproved: false,
          sourceName: null,
          sourceLabel: null,
          asOf: null,
          period: null,
          warnings: [],
        },
        missingFields: [],
        allowedNumericValues: [],
        visibleFacts: ["Bước 3 - Lọc theo mức độ đủ dữ liệu"],
        constraints: ["Screening is not a ranking."],
      },
      provider: new MockAssistantProvider({
        answer: "P/E thap co the lam co phieu hap dan hon.",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.llmStatus).toBe("completed");
    expect(result.message).toContain("safe educational fallback");
    expect(result.answer).toContain("Tiêu chí lọc không phải là thesis");
    expect(result.answer).toContain("đủ/thiếu dữ liệu");
    expect(result.violations).toEqual([]);
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
