import { describe, expect, it } from "vitest";

import { aiTutorConfig } from "../aiTutor.config";
import { shellConfig } from "../shell.config";
import { baseWatchlistPageData } from "../../features/watchlist/data/watchlist.data";

const collectStrings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
  }
  return [];
};

const userFacingText = [
  ...collectStrings(aiTutorConfig),
  ...collectStrings(shellConfig),
  ...collectStrings(baseWatchlistPageData),
].join("\n").toLowerCase();

describe("global user-facing copy leakage guardrails", () => {
  it("does not expose trading or position-like wording in shared config and watchlist copy", () => {
    const forbidden = [
      "vị thế",
      "trading",
      "trading game",
      "paper trading",
      "giao dịch giả lập",
      "mua giả lập",
      "bán giả lập",
      "lãi/lỗ",
      "lời/lỗ",
      "p/l",
      "profit",
      "loss",
      "take profit",
      "stop loss",
      "cắt lỗ",
      "chốt lời",
      "backtest",
      "mô phỏng lợi nhuận",
    ];

    for (const term of forbidden) {
      expect(userFacingText).not.toContain(term);
    }
  });

  it("does not expose raw source/debug flags in shared config and watchlist copy", () => {
    const rawTerms = [
      "productionapproved:false",
      "productionapproved:true",
      "productionapproved",
      "research_only",
      "researchonly",
      "datamode",
      "sourcetype",
      "sourcelabel",
      "local_db_manual_import",
      "vnstock_research_candidate",
    ];

    for (const term of rawTerms) {
      expect(userFacingText).not.toContain(term);
    }
  });
});
