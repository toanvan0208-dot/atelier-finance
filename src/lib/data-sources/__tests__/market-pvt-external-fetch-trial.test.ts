import { describe, expect, it } from "vitest";
import {
  runMarketPvtExternalFetchTrial,
  type ExternalMarketCandidateRow,
} from "../market-pvt-external-fetch-trial";

const mockFetcher = async (ticker: string): Promise<ExternalMarketCandidateRow[]> => {
  return [
    {
      symbol: ticker,
      timestamp: "2026-06-21",
      close_price: 100000,
      volume_shares: 500000,
    },
    {
      symbol: ticker,
      timestamp: "2026-06-20",
      close_price: 98000,
      volume_shares: 400000,
    },
    // Add a duplicate to test duplicate skipping
    {
      symbol: ticker,
      timestamp: "2026-06-20",
      close_price: 98000,
      volume_shares: 400000,
    },
  ];
};

const mockInvalidUnitFetcher = async (ticker: string): Promise<ExternalMarketCandidateRow[]> => {
  return [
    {
      symbol: ticker,
      timestamp: "2026-06-19",
      close_price: 95000,
      volume_shares: 300000,
    },
  ];
};

describe("MarketPvtExternalFetchTrial", () => {
  it("normalizes fetched candidate response into import-compatible rows and runs dry-run audit", async () => {
    const result = await runMarketPvtExternalFetchTrial({
      ticker: "FPT",
      fetcher: mockFetcher,
      sourceLabel: "explicit_test_source",
    });

    // Validates it goes through the dry-run path correctly
    expect(result.dryRun).toBe(true);
    expect(result.status).toBe("preview_ready");
    expect(result.productionApproved).toBe(false);

    // Validates normalization and audit result
    expect(result.summary.totalRows).toBe(1);
    expect(result.summary.validRows).toBe(1);
    expect(result.summary.invalidRows).toBe(0);
    expect(result.summary.skippedRows).toBe(2); // Both instances of the ambiguous duplicate key are safely discarded
    expect(result.summary.writtenRows).toBe(0); // STRICTLY zero DB writes

    expect(result.acceptedRows.length).toBe(1);
    
    // Check first normalized row
    const firstRow = result.acceptedRows[0];
    expect(firstRow.ticker).toBe("FPT");
    expect(firstRow.period).toBe("2026-06-21");
    expect(firstRow.closePrice).toBe(100000);
    expect(firstRow.volume).toBe(500000);
    expect(firstRow.sourceLabel).toBe("explicit_test_source");
    expect(firstRow.productionApproved).toBe(false);
    expect(firstRow.currency).toBe("VND");
    
    // Check unit metadata was preserved
    expect(firstRow.marketUnitMetadata.marketPrice?.unit).toBe("vnd_per_share");
    expect(firstRow.marketUnitMetadata.volume?.unit).toBe("shares");
  });

  it("fails closed on missing/invalid explicit unit", async () => {
    const result = await runMarketPvtExternalFetchTrial({
      ticker: "FPT",
      fetcher: mockInvalidUnitFetcher,
      priceUnit: "unknown_unit", // Invalid unit
    });

    expect(result.dryRun).toBe(true);
    expect(result.summary.validRows).toBe(0);
    expect(result.summary.invalidRows).toBe(1);
    expect(result.summary.writtenRows).toBe(0);
    
    const invalidRow = result.invalidRows[0];
    expect(invalidRow.errors).toContain("marketPrice_unit_invalid");
  });

  it("does not expose or allow confirmed write", async () => {
    const result = await runMarketPvtExternalFetchTrial({
      ticker: "FPT",
      fetcher: mockFetcher,
    });
    
    // The fetch trial API intentionally does not accept a confirmWrite boolean
    // It hardcodes confirmWrite: false internally.
    expect(result.dryRun).toBe(true);
    expect(result.summary.writtenRows).toBe(0);
    expect(result.audit.confirmWrite).toBe(false);
  });

  it("does not introduce forbidden advisory/production wording", async () => {
    const result = await runMarketPvtExternalFetchTrial({
      ticker: "FPT",
      fetcher: mockFetcher,
    });

    const outputJson = JSON.stringify(result).toLowerCase();

    const forbidden = [
      "nên mua", "nên bán", "nên nắm giữ", "tín hiệu mua", "tín hiệu bán", "điểm mua",
      "cổ phiếu an toàn", "chắc chắn rẻ", "chắc chắn xấu", "định giá hấp dẫn",
      "đang rẻ", "đáng mua", "rẻ", "đắt", "hấp dẫn", "giá mục tiêu", "mục tiêu giá",
      "upside", "downside", "fair value", "target price", "recommendation",
      "production-ready", "dữ liệu chính thức", "dữ liệu thời gian thực"
    ];

    for (const phrase of forbidden) {
      expect(outputJson).not.toContain(phrase);
    }
  });
});
