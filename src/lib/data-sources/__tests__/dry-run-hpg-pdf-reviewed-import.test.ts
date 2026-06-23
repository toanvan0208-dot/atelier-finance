import { describe, expect, it, vi } from "vitest";
import { normalizeBillionVnd, buildDryRunImport, type RawPreviewData } from "../../../../scripts/dry-run-hpg-pdf-reviewed-import";

vi.mock("../../../../src/lib/database/client", () => ({
  prisma: {
    financialStatement: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

describe("dry-run-hpg-pdf-reviewed-import", () => {
  it("normalizes VND to billion_vnd correctly", () => {
    const result = normalizeBillionVnd(92174151302217, "VND");
    expect(result.value).toBe(92174.151302217);
    expect(result.unit).toBe("billion_vnd");
    expect(result.conversionRule).toBe("divide by 1,000,000,000");
  });

  it("leaves other units untouched", () => {
    const result = normalizeBillionVnd(100, "shares");
    expect(result.value).toBe(100);
    expect(result.unit).toBe("shares");
  });

  it("handles null values gracefully", () => {
    const result = normalizeBillionVnd(null, "VND");
    expect(result.value).toBeNull();
    expect(result.unit).toBeNull();
  });

  it("builds correct import row for HPG", () => {
    const raw: RawPreviewData[] = [
      { ticker: "HPG", field: "eps", value: 1973, unit: "vnd_per_share", status: "preview", notes: "" },
      { ticker: "HPG", field: "sharesOutstanding", value: 7675465855, unit: "shares", status: "preview", notes: "" },
      { ticker: "HPG", field: "totalDebt", value: 92174151302217, unit: "VND", status: "derived_preview", notes: "" },
    ];

    const rows = buildDryRunImport(raw);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    
    expect(row.ticker).toBe("HPG");
    expect(row.eps).toBe(1973);
    expect(row.epsUnit).toBe("vnd_per_share");
    
    expect(row.sharesOutstanding).toBe(7675465855);
    expect(row.sharesOutstandingUnit).toBe("shares");
    
    expect(row.totalDebt).toBe(92174.151302217);
    expect(row.totalDebtUnit).toBe("billion_vnd");
    expect(row.status).toBe("derived_preview_import_candidate");
    expect(row.productionApproved).toBe(false);
  });

  it("blocks other tickers from being processed", () => {
    const raw: RawPreviewData[] = [
      { ticker: "FPT", field: "eps", value: 1000, unit: "vnd_per_share", status: "preview", notes: "" },
      { ticker: "MWG", field: "eps", value: 2000, unit: "vnd_per_share", status: "preview", notes: "" },
    ];
    
    const rows = buildDryRunImport(raw);
    expect(rows).toHaveLength(0);
  });

  it("missing values are not converted to 0", () => {
    const raw: RawPreviewData[] = [
      { ticker: "HPG", field: "totalDebt", value: null, unit: null, status: "needs_review", notes: "" },
    ];
    
    const rows = buildDryRunImport(raw);
    expect(rows[0].totalDebt).toBeNull();
  });
});
