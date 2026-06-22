import { describe, expect, it } from "vitest";
import {
  buildAssistantApiPayload,
  collectAllowedNumericValues,
  createAssistantContextPacket,
  parseAssistantContextPacket,
} from "../assistant-context-packet";

describe("AssistantContextPacket", () => {
  it("normalizes grounded UI context into the API payload", () => {
    const packet = createAssistantContextPacket({
      ticker: "fpt",
      activeModule: "risk",
      moduleContext: { metrics: { revenue: 125, eps: null } },
      dataQuality: {
        dataMode: "research_only",
        productionApproved: false,
        sourceName: "Reviewed local record",
        asOf: "2026-06-22",
        period: "2025",
      },
      missingFields: ["EPS", "source"],
      allowedNumericValues: [125],
      visibleFacts: ["Ticker in workspace URL: FPT"],
      constraints: ["Do not infer missing values."],
    });
    const payload = buildAssistantApiPayload(" Explain this screen. ", packet);

    expect(payload.question).toBe("Explain this screen.");
    expect(payload.activeModule).toBe("risk");
    expect(payload.ticker).toBe("FPT");
    expect(payload.contextPacket.missingFields).toEqual(["EPS", "source"]);
    expect(payload.contextPacket.dataQuality.productionApproved).toBe(false);
  });

  it("rejects malformed packets and removes non-finite numeric values", () => {
    expect(parseAssistantContextPacket({ ticker: "FPT" })).toBeNull();

    const packet = parseAssistantContextPacket({
      activeModule: "financials",
      allowedNumericValues: [10, Number.NaN, Number.POSITIVE_INFINITY, "20"],
    });

    expect(packet?.allowedNumericValues).toEqual([10]);
  });

  it("collects only finite numeric values that exist in grounded context", () => {
    expect(
      collectAllowedNumericValues({ revenue: 125, eps: null, period: "2025", note: "FPT" }),
    ).toEqual([125, 2025]);
  });
});
