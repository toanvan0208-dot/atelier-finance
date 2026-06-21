import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runFinancialStatementSafeImportMvp = vi.fn();
const runMarketPvtSafeImportMvp = vi.fn();

vi.mock("@/lib/data-sources", () => ({
  runFinancialStatementSafeImportMvp,
  runMarketPvtSafeImportMvp,
}));

const mockIsLocalImportsEnabled = vi.fn<() => boolean>();

vi.mock("@/lib/config/local-imports-access", () => ({
  isLocalImportsEnabled: () => mockIsLocalImportsEnabled(),
}));

const { POST } = await import("../route");

const headers = {
  "content-type": "application/json",
  "x-atelier-local-import": "preview-confirm-local",
};

const postJson = (body: unknown, overrideHeaders: Record<string, string> = headers): Promise<Response> =>
  POST(
    new Request("http://localhost/api/local-imports/preview-confirm", {
      body: JSON.stringify(body),
      headers: overrideHeaders,
      method: "POST",
    }),
  );

const readJson = async <T>(response: Response): Promise<T> => (await response.json()) as T;

const importResult = (patch: Record<string, unknown> = {}) => ({
  audit: {
    confirmWrite: false,
    dryRun: true,
    importJobId: "job-1",
    importType: "financial_statement",
    productionApproved: false,
    status: "dry_run_completed",
    totalRows: 1,
    validRows: 1,
    invalidRows: 0,
    writtenRows: 0,
    skippedRows: 0,
    duplicateSkippedRows: 0,
    warnings: [],
    errors: [],
    safetyFlags: {
      invalidRowsNotWritten: true,
      localDataProductionApprovedFalse: true,
      missingUnitFailsClosed: true,
      noOverwrite: true,
      noZeroFillForMissing: true,
    },
  },
  productionApproved: false,
  summary: {
    dryRun: true,
    errors: [],
    invalidRows: 0,
    skippedRows: 0,
    totalRows: 1,
    validRows: 1,
    warnings: [],
    writtenRows: 0,
  },
  ...patch,
});

type RouteResponse = {
  ok: boolean;
  data?: {
    audit: {
      status: string;
      productionApproved: false;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

describe("POST /api/local-imports/preview-confirm", () => {
  beforeEach(() => {
    runFinancialStatementSafeImportMvp.mockReset();
    runMarketPvtSafeImportMvp.mockReset();
    runFinancialStatementSafeImportMvp.mockResolvedValue(importResult());
    runMarketPvtSafeImportMvp.mockResolvedValue(
      importResult({
        audit: { ...importResult().audit, importType: "market_pvt" },
      }),
    );
    mockIsLocalImportsEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    mockIsLocalImportsEnabled.mockReset();
  });

  // --- Phase 99: Kill switch guard tests ---

  describe("kill switch guard (Phase 99)", () => {
    it("blocks preview when local imports are disabled", async () => {
      mockIsLocalImportsEnabled.mockReturnValue(false);
      const response = await postJson({
        action: "preview",
        csvText: "ticker,period\nFPT,2024",
        importType: "financial_statement",
      });
      const json = await readJson<RouteResponse>(response);

      expect(response.status).toBe(403);
      expect(json.error?.code).toBe("LOCAL_IMPORTS_DISABLED");
      expect(runFinancialStatementSafeImportMvp).not.toHaveBeenCalled();
      expect(runMarketPvtSafeImportMvp).not.toHaveBeenCalled();
    });

    it("blocks confirm when local imports are disabled", async () => {
      mockIsLocalImportsEnabled.mockReturnValue(false);
      const response = await postJson({
        action: "confirm",
        csvText: "ticker,period\nFPT,2024",
        importType: "financial_statement",
      });
      const json = await readJson<RouteResponse>(response);

      expect(response.status).toBe(403);
      expect(json.error?.code).toBe("LOCAL_IMPORTS_DISABLED");
      expect(runFinancialStatementSafeImportMvp).not.toHaveBeenCalled();
    });

    it("does not call any import service when disabled", async () => {
      mockIsLocalImportsEnabled.mockReturnValue(false);
      await postJson({
        action: "preview",
        csvText: "ticker,tradingDate,closePrice\nFPT,2026-06-19,100",
        importType: "market_pvt",
      });

      expect(runFinancialStatementSafeImportMvp).not.toHaveBeenCalled();
      expect(runMarketPvtSafeImportMvp).not.toHaveBeenCalled();
    });

    it("still requires valid header when local imports are enabled", async () => {
      mockIsLocalImportsEnabled.mockReturnValue(true);
      const response = await postJson(
        {
          action: "preview",
          csvText: "ticker,period\nFPT,2024",
          importType: "financial_statement",
        },
        { "content-type": "application/json" },
      );
      const json = await readJson<RouteResponse>(response);

      expect(response.status).toBe(403);
      expect(json.error?.code).toBe("LOCAL_IMPORT_INTERNAL_HEADER_REQUIRED");
      expect(runFinancialStatementSafeImportMvp).not.toHaveBeenCalled();
    });

    it("still rejects wrong header value when enabled", async () => {
      mockIsLocalImportsEnabled.mockReturnValue(true);
      const response = await postJson(
        {
          action: "preview",
          csvText: "ticker,period\nFPT,2024",
          importType: "financial_statement",
        },
        { "content-type": "application/json", "x-atelier-local-import": "wrong-value" },
      );
      const json = await readJson<RouteResponse>(response);

      expect(response.status).toBe(403);
      expect(json.error?.code).toBe("LOCAL_IMPORT_INTERNAL_HEADER_REQUIRED");
    });
  });

  // --- Phase 98: Existing behavior tests (with enabled kill switch) ---

  it("runs Financial Statement preview as dry-run without confirmed write", async () => {
    const response = await postJson({
      action: "preview",
      csvText: "ticker,period\nFPT,2024",
      importType: "financial_statement",
    });
    const json = await readJson<RouteResponse>(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data?.audit.status).toBe("dry_run_completed");
    expect(json.data?.audit.productionApproved).toBe(false);
    expect(runFinancialStatementSafeImportMvp).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmWrite: false,
        dryRun: true,
      }),
    );
  });

  it("runs Market/PVT preview as dry-run", async () => {
    await postJson({
      action: "preview",
      csvText: "ticker,tradingDate,closePrice\nFPT,2026-06-19,100",
      importType: "market_pvt",
    });

    expect(runMarketPvtSafeImportMvp).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmWrite: false,
        dryRun: true,
      }),
    );
  });

  it("runs confirmed import only when action is confirm", async () => {
    await postJson({
      action: "confirm",
      csvText: "ticker,tradingDate,closePrice\nFPT,2026-06-19,100",
      importType: "market_pvt",
    });

    expect(runMarketPvtSafeImportMvp).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmWrite: true,
        dryRun: false,
      }),
    );
  });

  it("rejects missing internal header and production approval claims", async () => {
    const missingHeader = await postJson(
      {
        action: "preview",
        csvText: "ticker,period\nFPT,2024",
        importType: "financial_statement",
      },
      { "content-type": "application/json" },
    );
    const productionClaim = await postJson({
      action: "preview",
      csvText: "ticker,period\nFPT,2024",
      importType: "financial_statement",
      productionApproved: true,
    });
    const missingHeaderJson = await readJson<RouteResponse>(missingHeader);
    const productionClaimJson = await readJson<RouteResponse>(productionClaim);

    expect(missingHeader.status).toBe(403);
    expect(missingHeaderJson.error?.code).toBe("LOCAL_IMPORT_INTERNAL_HEADER_REQUIRED");
    expect(productionClaim.status).toBe(400);
    expect(productionClaimJson.error?.code).toBe("LOCAL_IMPORT_PRODUCTION_APPROVAL_NOT_ALLOWED");
    expect(runFinancialStatementSafeImportMvp).not.toHaveBeenCalled();
  });
});
