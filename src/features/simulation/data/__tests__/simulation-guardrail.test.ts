import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { simulationExperienceData } from "../simulation.data";

const collectStrings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
  }
  return [];
};

const collectQuotedStrings = (source: string): string[] =>
  Array.from(source.matchAll(/(?:"([^"]*)"|'([^']*)'|`([^`$]*)`)/g)).map(
    (match) => match[1] ?? match[2] ?? match[3] ?? "",
  ).filter((text) => !text.startsWith("@/") && !text.startsWith("../") && !text.startsWith("./"));

describe("Simulation Guardrails", () => {
  it("does not expose forbidden investment advisory terms in simulation data", () => {
    const dataString = JSON.stringify(simulationExperienceData).toLowerCase();

    // The raw keys might contain internal types like "buy" or "sell", but we ensure
    // no forbidden user-facing wording or recommendation labels.
    
    expect(dataString).not.toContain("khuyến nghị");
    expect(dataString).not.toContain("nên mua");
    expect(dataString).not.toContain("nên bán");
    expect(dataString).not.toContain("tín hiệu mua");
    expect(dataString).not.toContain("tín hiệu bán");
    expect(dataString).not.toContain("điểm mua");
    expect(dataString).not.toContain("điểm bán");
    expect(dataString).not.toContain("vào lệnh");
    expect(dataString).not.toContain("thoát lệnh");
    expect(dataString).not.toContain("fair value");
    expect(dataString).not.toContain("target price");
    expect(dataString).not.toContain("đáng mua");
    expect(dataString).not.toContain("đáng bán");
    expect(dataString).not.toContain("hấp dẫn");
    expect(dataString).not.toContain("tiềm năng");
    expect(dataString).not.toContain("cơ hội đầu tư");
    expect(dataString).not.toContain("đáng chú ý");
    expect(dataString).not.toContain("đáng quan tâm");
    expect(dataString).not.toContain("cổ phiếu tốt");
    expect(dataString).not.toContain("cổ phiếu xấu");
    expect(dataString).not.toContain("an toàn để đầu tư");
    expect(dataString).not.toContain("top pick");
    expect(dataString).not.toContain("best stock");
    expect(dataString).not.toContain("backtest");
    expect(dataString).not.toContain("lợi nhuận kỳ vọng");
    expect(dataString).not.toContain("dự báo giá");
    expect(dataString).not.toContain("dự đoán giá");
    expect(dataString).not.toContain("mô phỏng lợi nhuận");
  });

  it("does not expose trading-result wording in simulation user-facing strings", () => {
    const dataString = collectStrings(simulationExperienceData).join("\n").toLowerCase();
    const componentSource = [
      "src/features/simulation/components/ClosedPositionsTable.tsx",
      "src/features/simulation/components/ClosePositionDrawer.tsx",
      "src/features/simulation/components/OpenPositionsTable.tsx",
      "src/features/simulation/components/PossibleScenariosPanel.tsx",
      "src/features/simulation/components/ScenarioCard.tsx",
      "src/features/simulation/components/SimulationOrderTicket.tsx",
      "src/features/simulation/components/SimulationPage.tsx",
      "src/features/simulation/utils.ts",
    ]
      .flatMap((file) => collectQuotedStrings(readFileSync(join(process.cwd(), file), "utf8")))
      .join("\n")
      .toLowerCase();

    const forbiddenUserFacingTerms = [
      "stop-loss",
      "target giả lập",
      "cập nhật target",
      "p/l",
      "lãi/lỗ",
      "lời/lỗ",
      "giao dịch giả lập",
      "mua giả lập",
      "bán giả lập",
      "trading",
      "khuyến nghị",
      "hấp dẫn",
      "take profit",
      "stop loss",
      "cắt lỗ",
      "chốt lời",
    ];

    for (const term of forbiddenUserFacingTerms) {
      expect(dataString).not.toContain(term);
      expect(componentSource).not.toContain(term);
    }
  });

  it("does not leak raw metadata flags", () => {
    const dataString = JSON.stringify(simulationExperienceData);
    expect(dataString).not.toContain("productionApproved:false");
    expect(dataString).not.toContain("researchOnly");
    expect(dataString).not.toContain("dataMode");
    expect(dataString).not.toContain("local_db_manual_import");
    expect(dataString).not.toContain("vnstock_research_candidate");
    expect(dataString).not.toContain("phase116_reviewed_financial_missing_fields");
  });
});
