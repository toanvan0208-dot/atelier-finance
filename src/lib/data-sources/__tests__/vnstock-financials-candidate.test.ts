import { describe, expect, it } from "vitest";

import {
  normalizeVnstockFinancialsCandidate,
  type RawVnstockFinancialField,
} from "../index";
import { runVnstockFinancialsPreview } from "../vnstock-financials-probe";

const raw = (
  rawKey: string,
  value: unknown,
  patch: Partial<RawVnstockFinancialField> = {},
): RawVnstockFinancialField => ({
  provider: "VCI",
  method: "income_statement",
  rawKey,
  value,
  period: "2025",
  unit: null,
  ...patch,
});

describe("VNStock financials candidate normalizer", () => {
  it("maps an explicit EPS field with direct provenance", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "fpt",
      fields: [raw("eps_basic_vnd", 5216, { unit: "vnd_per_share" })],
    });

    expect(rows.find((row) => row.field === "eps")).toMatchObject({
      ticker: "FPT",
      fiscalYear: 2025,
      value: 5216,
      unit: "vnd_per_share",
      status: "candidate",
      rawPath: "VCI.income_statement.eps_basic_vnd",
      sourceLabel: "vnstock_financials_candidate",
      dataMode: "research_only",
      productionApproved: false,
    });
  });

  it("maps only an explicitly named total-debt-like field", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "HPG",
      fields: [
        raw("total_borrowings", "92,174,151,302,217", {
          method: "balance_sheet",
          unit: "VND",
        }),
      ],
    });

    expect(rows.find((row) => row.field === "totalDebt")).toMatchObject({
      value: 92174151302217,
      unit: "VND",
      status: "candidate",
      rawPath: "VCI.balance_sheet.total_borrowings",
      productionApproved: false,
    });
  });

  it("never maps total liabilities to total debt", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "FPT",
      fields: [
        raw("total_liabilities", 44_393_950_887_086, {
          method: "balance_sheet",
          unit: "VND",
        }),
      ],
    });

    expect(rows.find((row) => row.field === "totalDebt")).toMatchObject({
      value: null,
      status: "ambiguous",
      rawPath: "VCI.balance_sheet.total_liabilities",
    });
  });

  it("keeps an explicit debt value in review when its unit is unknown", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "HPG",
      fields: [raw("total_debt", 123, { method: "balance_sheet" })],
    });

    expect(rows.find((row) => row.field === "totalDebt")).toMatchObject({
      value: 123,
      unit: "unknown",
      status: "needs_review",
      productionApproved: false,
    });
  });

  it("keeps borrowing components null pending coverage and unit review", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "MSN",
      fields: [
        raw("short_term_borrowings", 24_330_984_000_000, {
          method: "balance_sheet",
        }),
        raw("long_term_borrowings", 40_546_194_000_000, {
          method: "balance_sheet",
        }),
      ],
    });

    expect(rows.find((row) => row.field === "totalDebt")).toMatchObject({
      value: null,
      unit: "unknown",
      status: "needs_review",
    });
  });

  it("keeps missing fields null rather than zero", () => {
    const rows = normalizeVnstockFinancialsCandidate({ ticker: "MWG", fields: [] });

    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.value).toBeNull();
      expect(row.status).toBe("missing");
      expect(row.productionApproved).toBe(false);
    }
  });

  it.each([undefined, null, "", Number.NaN, Number.POSITIVE_INFINITY])(
    "keeps invalid or absent explicit values null (%s)",
    (value) => {
      const rows = normalizeVnstockFinancialsCandidate({
        ticker: "VNM",
        fields: [raw("eps_basic_vnd", value, { unit: "vnd_per_share" })],
      });

      expect(rows.find((row) => row.field === "eps")).toMatchObject({
        value: null,
        status: "needs_review",
        productionApproved: false,
      });
    },
  );

  it("maps explicit outstanding shares and never infers from share capital", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "FPT",
      fields: [
        raw("charter_capital", 17_035_071_210_000, {
          provider: "KBS",
          method: "overview",
          unit: "VND",
        }),
        raw("outstanding_shares", 1_703_507_121, {
          provider: "KBS",
          method: "overview",
          asOf: "2025-12-31T00:00:00",
          period: "2025",
          unit: "shares",
        }),
      ],
    });

    expect(rows.find((row) => row.field === "sharesOutstanding")).toMatchObject({
      value: 1_703_507_121,
      unit: "shares",
      status: "candidate",
      rawPath: "KBS.overview.outstanding_shares",
    });
  });

  it("adds the VCB banking caveat and does not auto-map debt", () => {
    const rows = normalizeVnstockFinancialsCandidate({
      ticker: "VCB",
      fields: [
        raw("total_debt", 123, { method: "balance_sheet", unit: "VND" }),
      ],
    });
    const debt = rows.find((row) => row.field === "totalDebt");

    expect(debt).toMatchObject({
      value: null,
      status: "needs_review",
      productionApproved: false,
    });
    expect(debt?.caveat).toContain("VCB is a bank");
  });

  it("requires explicit network opt-in and keeps the preview write-free", async () => {
    await expect(
      runVnstockFinancialsPreview({
        tickers: ["FPT"],
        fiscalYear: 2025,
        allowNetwork: false,
        fetchProbe: async () => ({ packageVersion: "test", fiscalYear: 2025, tickers: [] }),
      }),
    ).rejects.toThrow("vnstock_financials_network_not_enabled");

    const report = await runVnstockFinancialsPreview({
      tickers: ["FPT"],
      fiscalYear: 2025,
      allowNetwork: true,
      fetchProbe: async () => ({
        packageVersion: "4.0.4",
        fiscalYear: 2025,
        tickers: [{ ticker: "FPT", apiShape: [], fields: [], errors: [] }],
      }),
    });

    expect(report).toMatchObject({
      mode: "preview_only",
      sourceLabel: "vnstock_financials_candidate",
      dataMode: "research_only",
      productionApproved: false,
      databaseWriteAttempted: false,
    });
    expect(report.tickers[0].candidates.every((row) => !row.productionApproved)).toBe(true);
  });
});
