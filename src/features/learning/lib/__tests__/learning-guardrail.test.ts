import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Learning MVP audit guardrails", () => {
  it("does not contain forbidden advisory or non-neutral terms in learning.data.ts", () => {
    const dataPath = join(__dirname, "../../data/learning.data.ts");
    const content = readFileSync(dataPath, "utf-8").toLowerCase();

    const forbidden = [
      "buy", "sell", "hold", "recommendation",
      "khuyến nghị", "nên mua", "nên bán", "nắm giữ",
      "tín hiệu mua", "tín hiệu bán", "điểm mua", "điểm bán",
      "vào lệnh", "thoát lệnh", "fair value", "target price",
      "upside", "downside", "đáng mua", "đáng bán",
      "hấp dẫn", "tiềm năng", "cơ hội đầu tư",
      "đáng chú ý", "đáng quan tâm", "cổ phiếu tốt",
      "cổ phiếu xấu", "an toàn để đầu tư", "top pick", "best stock"
    ];

    for (const term of forbidden) {
      expect(content).not.toContain(term.toLowerCase());
    }
  });
});
