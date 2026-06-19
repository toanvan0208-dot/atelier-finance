import { describe, expect, it, vi } from "vitest";

import {
  runVnstockMarketPriceImportCommand,
  VNSTOCK_RESEARCH_SOURCE_POLICY,
  type VnstockResearchMarketPriceRecord,
} from "../index";

const enabledEnv = {
  VNSTOCK_RESEARCH_CONNECTOR_ENABLED: "true",
  VNSTOCK_RESEARCH_ALLOW_NETWORK: "true",
  VNSTOCK_RESEARCH_MODE: "local_research",
  VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK: "true",
};

const argv = ["--ticker", "FPT", "--from", "2025-01-01", "--to", "2025-12-31"];

const normalizedRecord = (
  patch: Partial<VnstockResearchMarketPriceRecord> = {},
): VnstockResearchMarketPriceRecord => ({
  ticker: "FPT",
  date: "2025-01-02",
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  volume: 1000,
  tradingValue: 105000,
  sourceProvider: "vnstock",
  sourceTool: "vnstock",
  sourceType: "third_party_tool",
  usageScope: "academic_non_commercial",
  productionApproved: false,
  asOf: "2025-01-02",
  retrievedAt: "2026-06-19T00:00:00.000Z",
  attribution: "Data access supported by Vnstock for academic/local research validation.",
  warnings: [],
  ...patch,
});

describe("vnstock market price local import command runner", () => {
  it("fails closed when local import acknowledgement is missing", async () => {
    const fetchMarketPrices = vi.fn();
    const persistMarketPrices = vi.fn();

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv,
        env: {
          ...enabledEnv,
          VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK: undefined,
        },
      },
      { fetchMarketPrices, persistMarketPrices },
    );

    expect(report.status).toBe("local_import_ack_required");
    expect(report.productionApproved).toBe(false);
    expect(fetchMarketPrices).not.toHaveBeenCalled();
    expect(persistMarketPrices).not.toHaveBeenCalled();
    expect(report.errors.join(" ")).toContain("VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true");
  });

  it("fails usage validation when ticker or dates are missing", async () => {
    const fetchMarketPrices = vi.fn();
    const persistMarketPrices = vi.fn();

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: ["--ticker", "FPT"],
        env: enabledEnv,
      },
      { fetchMarketPrices, persistMarketPrices },
    );

    expect(report.status).toBe("usage_validation_failed");
    expect(fetchMarketPrices).not.toHaveBeenCalled();
    expect(persistMarketPrices).not.toHaveBeenCalled();
    expect(report.warnings.join(" ")).toContain("Usage:");
  });

  it("dry-runs with an injected fetcher without persisting", async () => {
    const fetchMarketPrices = vi.fn().mockResolvedValue([
      {
        ticker: "FPT",
        date: "2025-01-02",
        open: "100",
        high: "110",
        low: "95",
        close: "105",
        volume: "1000",
        tradingValue: "105000",
      },
    ]);
    const persistMarketPrices = vi.fn();

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--dry-run"],
        env: enabledEnv,
      },
      {
        fetchMarketPrices,
        persistMarketPrices,
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(report.status).toBe("dry_run_completed");
    expect(fetchMarketPrices).toHaveBeenCalledWith({
      ticker: "FPT",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
    expect(persistMarketPrices).not.toHaveBeenCalled();
    expect(report.normalizedCount).toBe(1);
    expect(report.productionApproved).toBe(false);
  });

  it("persists normalized records only when write mode is explicit", async () => {
    const fetchMarketPrices = vi.fn().mockResolvedValue([
      {
        ticker: "FPT",
        date: "2025-01-02",
        close: "105",
      },
    ]);
    const persistMarketPrices = vi.fn().mockResolvedValue({
      insertedCount: 1,
      updatedCount: 0,
      skippedCount: 0,
      rejectedCount: 0,
      warnings: [],
      sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      productionApproved: false,
    });

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--write"],
        env: enabledEnv,
      },
      {
        fetchMarketPrices,
        persistMarketPrices,
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(report.status).toBe("import_completed");
    expect(fetchMarketPrices).toHaveBeenCalledTimes(1);
    expect(persistMarketPrices).toHaveBeenCalledTimes(1);
    expect(persistMarketPrices).toHaveBeenCalledWith({
      records: [
        expect.objectContaining({
          ticker: "FPT",
          date: "2025-01-02",
          close: 105,
          productionApproved: false,
        }),
      ],
      sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
    });
    expect(report.insertedCount).toBe(1);
    expect(report.productionApproved).toBe(false);
  });

  it("fails closed when a fetcher is not configured", async () => {
    const persistMarketPrices = vi.fn();

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv,
        env: enabledEnv,
      },
      { persistMarketPrices },
    );

    expect(report.status).toBe("fetcher_not_configured");
    expect(persistMarketPrices).not.toHaveBeenCalled();
  });

  it("dry-runs a local CSV manual export file without persisting", async () => {
    const persistMarketPrices = vi.fn();
    const readFileText = vi.fn().mockResolvedValue([
      "ticker,date,open,high,low,close,volume,tradingValue,extra",
      "FPT,2025-01-02,100000,101000,99000,100500,1234567,123000000000,ignored",
      "FPT,2025-01-03,,,abc,100000,,",
    ].join("\n"));

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--file", "manual-export.csv", "--format", "csv"],
        env: enabledEnv,
      },
      {
        readFileText,
        persistMarketPrices,
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(report.status).toBe("dry_run_completed");
    expect(readFileText).toHaveBeenCalledWith("manual-export.csv");
    expect(persistMarketPrices).not.toHaveBeenCalled();
    expect(report.normalizedCount).toBe(2);
    expect(report.rejectedCount).toBeGreaterThan(0);
    expect(report.productionApproved).toBe(false);
    expect(report.warnings.join(" ")).toContain("ignored unknown column");
    expect(report.warnings.join(" ")).toContain("low could not be parsed as a number");
  });

  it("skips manual export records for a different ticker", async () => {
    const persistMarketPrices = vi.fn();
    const readFileText = vi.fn().mockResolvedValue([
      "ticker,date,close",
      "FPT,2025-01-02,100000",
      "HPG,2025-01-02,30000",
    ].join("\n"));

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--file", "manual-export.csv"],
        env: enabledEnv,
      },
      {
        readFileText,
        persistMarketPrices,
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );

    expect(report.status).toBe("dry_run_completed");
    expect(report.normalizedCount).toBe(1);
    expect(report.warnings.join(" ")).toContain("HPG");
    expect(report.warnings.join(" ")).toContain("--ticker is FPT");
    expect(persistMarketPrices).not.toHaveBeenCalled();
  });

  it("fails closed for unreadable or unknown-format manual export files", async () => {
    const persistMarketPrices = vi.fn();

    const unknownFormat = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--file", "manual-export.txt"],
        env: enabledEnv,
      },
      { persistMarketPrices },
    );

    expect(unknownFormat.status).toBe("file_validation_failed");
    expect(unknownFormat.errors.join(" ")).toContain("--format csv or --format json");
    expect(persistMarketPrices).not.toHaveBeenCalled();

    const unreadable = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--file", "missing.csv"],
        env: enabledEnv,
      },
      {
        readFileText: vi.fn().mockRejectedValue(new Error("missing")),
        persistMarketPrices,
      },
    );

    expect(unreadable.status).toBe("file_validation_failed");
    expect(unreadable.errors.join(" ")).toContain("could not be read");
    expect(persistMarketPrices).not.toHaveBeenCalled();
  });

  it("fails closed when network is disabled", async () => {
    const fetchMarketPrices = vi.fn();
    const persistMarketPrices = vi.fn();

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv,
        env: {
          ...enabledEnv,
          VNSTOCK_RESEARCH_ALLOW_NETWORK: "false",
        },
      },
      { fetchMarketPrices, persistMarketPrices },
    );

    expect(report.status).toBe("network_not_allowed");
    expect(fetchMarketPrices).not.toHaveBeenCalled();
    expect(persistMarketPrices).not.toHaveBeenCalled();
  });

  it("rejects unsafe production approval metadata before persistence", async () => {
    const fetchMarketPrices = vi.fn();
    const persistMarketPrices = vi.fn();

    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--write"],
        env: enabledEnv,
      },
      {
        fetchMarketPrices,
        persistMarketPrices,
        sourceMetadataOverride: {
          productionApproved: true,
        } as unknown as Partial<typeof VNSTOCK_RESEARCH_SOURCE_POLICY>,
      },
    );

    expect(report.status).toBe("unsafe_source_metadata");
    expect(fetchMarketPrices).not.toHaveBeenCalled();
    expect(persistMarketPrices).not.toHaveBeenCalled();
    expect(report.productionApproved).toBe(false);
  });

  it("does not include investment action wording in command output", async () => {
    const report = await runVnstockMarketPriceImportCommand(
      {
        argv: [...argv, "--dry-run"],
        env: enabledEnv,
      },
      {
        fetchMarketPrices: vi.fn().mockResolvedValue([normalizedRecord()]),
        now: new Date("2026-06-19T00:00:00.000Z"),
      },
    );
    const output = JSON.stringify(report).toLowerCase();
    const unsafeTerms = [
      `nÃªn ${"mua"}`,
      `nÃªn ${"bÃ¡n"}`,
      `tÃ­n hiá»‡u ${"mua"}`,
      `tÃ­n hiá»‡u ${"bÃ¡n"}`,
      `Ä‘iá»ƒm ${"mua"}`,
      `cá»• phiáº¿u ${"an toÃ n"}`,
    ];

    for (const term of unsafeTerms) {
      expect(output).not.toContain(term);
    }
  });
});
