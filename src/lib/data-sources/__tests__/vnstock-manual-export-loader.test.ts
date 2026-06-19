import { describe, expect, it } from "vitest";

import {
  parseVnstockManualExportCsv,
  parseVnstockManualExportJson,
} from "../vnstock-manual-export-loader";

describe("vnstock manual export loader", () => {
  it("parses CSV headers and fake rows into raw contract records", () => {
    const result = parseVnstockManualExportCsv([
      "ticker,date,open,high,low,close,volume,tradingValue,extra",
      "FPT,2025-01-02,100000,101000,99000,100500,1234567,123000000000,ignored",
    ].join("\n"));

    expect(result.errors).toEqual([]);
    expect(result.warnings.join(" ")).toContain("ignored unknown column");
    expect(result.records).toEqual([
      {
        ticker: "FPT",
        date: "2025-01-02",
        open: "100000",
        high: "101000",
        low: "99000",
        close: "100500",
        volume: "1234567",
        tradingValue: "123000000000",
      },
    ]);
  });

  it("turns empty numeric CSV cells into null", () => {
    const result = parseVnstockManualExportCsv([
      "ticker,date,open,high,low,close,volume,tradingValue",
      "FPT,2025-01-03,,,abc,100000,,",
    ].join("\n"));

    expect(result.errors).toEqual([]);
    expect(result.records[0]).toMatchObject({
      open: null,
      high: null,
      low: "abc",
      close: "100000",
      volume: null,
      tradingValue: null,
    });
  });

  it("rejects CSV missing required columns", () => {
    const result = parseVnstockManualExportCsv("ticker,close\nFPT,100000");

    expect(result.records).toEqual([]);
    expect(result.errors.join(" ")).toContain("date");
  });

  it("parses JSON arrays and ignores unknown fields safely", () => {
    const result = parseVnstockManualExportJson(JSON.stringify([
      {
        ticker: " FPT ",
        date: "2025-01-02",
        close: 100500,
        recommendation: "ignored",
      },
    ]));

    expect(result.errors).toEqual([]);
    expect(result.warnings.join(" ")).toContain("ignored unknown field");
    expect(result.records).toEqual([
      expect.objectContaining({
        ticker: "FPT",
        date: "2025-01-02",
        close: 100500,
      }),
    ]);
    expect(result.records[0]).not.toHaveProperty("recommendation");
  });

  it("fails invalid JSON safely", () => {
    const result = parseVnstockManualExportJson("{");

    expect(result.records).toEqual([]);
    expect(result.errors.join(" ")).toContain("could not be parsed");
  });
});
