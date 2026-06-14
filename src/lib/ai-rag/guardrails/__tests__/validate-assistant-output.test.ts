import { describe, expect, it } from "vitest";
import { validateAssistantOutput } from "../validate-assistant-output";

describe("validateAssistantOutput", () => {
  it("blocks direct buy/sell/hold recommendations", () => {
    const result = validateAssistantOutput("Ma nay nen mua ngay vi P/E thap.");

    expect(result.isValid).toBe(false);
    expect(result.shouldRefuse).toBe(true);
    expect(result.severity).toBe("critical");
    expect(result.violations.map((violation) => violation.code)).toContain(
      "BUY_SELL_HOLD_RECOMMENDATION",
    );
  });

  it("does not block safe negated recommendation language", () => {
    const result = validateAssistantOutput(
      "Day khong phai khuyen nghi mua ban. Nen kiem tra them dong tien va rui ro.",
    );

    expect(result.isValid).toBe(true);
    expect(result.shouldRefuse).toBe(false);
  });

  it("blocks PVT signal wording", () => {
    const result = validateAssistantOutput("Gia vuot dinh la tin hieu mua va diem mua tot.", {
      module: "technical",
    });

    expect(result.isValid).toBe(false);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "PVT_SIGNAL_WORDING",
    );
  });

  it("blocks price prediction certainty", () => {
    const result = validateAssistantOutput("Co phieu nay chac chan tang trong phien toi.");

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain("PRICE_PREDICTION");
  });

  it("blocks missing data treated as zero", () => {
    const result = validateAssistantOutput("EPS missing co the xem la 0 de tinh P/E.");

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "MISSING_DATA_AS_ZERO",
    );
  });

  it("blocks fake fair value or target price when not present in context", () => {
    const result = validateAssistantOutput("Gia tri hop ly cua co phieu nay la 42000 dong.", {
      hasFairValueInContext: false,
    });

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "FAKE_FAIR_VALUE_OR_TARGET_PRICE",
    );
  });

  it("blocks cheap P/E interpretation when EPS is negative", () => {
    const result = validateAssistantOutput("P/E thap cho thay co phieu re va hap dan.", {
      eps: -1200,
    });

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "INVALID_PE_INTERPRETATION",
    );
  });

  it("blocks normal ROE/PB interpretation when equity is negative", () => {
    const result = validateAssistantOutput("ROE cao la tot va P/B re.", {
      totalEquity: -500,
    });

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "INVALID_EQUITY_RATIO_INTERPRETATION",
    );
  });

  it("blocks risk score as a safe stock conclusion", () => {
    const result = validateAssistantOutput("Risk thap nen co phieu an toan.");

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "RISK_SCORE_OVERREACH",
    );
  });

  it("blocks checklist as an investment recommendation", () => {
    const result = validateAssistantOutput("Checklist dat nhieu muc nen mua.");

    expect(result.shouldRefuse).toBe(true);
    expect(result.violations.map((violation) => violation.code)).toContain(
      "CHECKLIST_RECOMMENDATION",
    );
  });

  it("warns when numeric values are not present in allowed context", () => {
    const result = validateAssistantOutput("Doanh thu tang 25% va P/E la 8.5.", {
      allowedNumericValues: ["25%"],
    });

    expect(result.isValid).toBe(false);
    expect(result.shouldRefuse).toBe(false);
    expect(result.severity).toBe("warning");
    expect(result.violations.map((violation) => violation.code)).toContain(
      "FABRICATED_NUMERIC_DATA",
    );
  });

  it("returns valid output for safe educational answer", () => {
    const result = validateAssistantOutput(
      "PVT chi la quan sat thi truong. Can kiem tra them thanh khoan, tai chinh va rui ro truoc khi tu hinh thanh luan diem.",
      { allowedNumericValues: [] },
    );

    expect(result.isValid).toBe(true);
    expect(result.severity).toBe("none");
    expect(result.shouldRefuse).toBe(false);
    expect(result.violations).toHaveLength(0);
  });
});
