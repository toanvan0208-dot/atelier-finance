import { beforeEach, describe, expect, it, vi } from "vitest";

const persistManualImport = vi.fn();

vi.mock("@/lib/database", () => ({
  persistManualImport,
}));

const { POST } = await import("../route");

const postJson = (body: unknown): Promise<Response> =>
  POST(
    new Request("http://localhost/api/manual-imports", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    }),
  );

const readJson = async <T>(response: Response): Promise<T> => (await response.json()) as T;

type ManualImportApiResponse = {
  ok: boolean;
  status: "success" | "error";
  data?: {
    sessionId: string;
    status: string;
    readiness: string;
    counts: {
      totalRows: number;
      validRows: number;
      warningRows: number;
      errorRows: number;
    };
    dataMode: string;
    sourceType: string;
    productionApproved: false;
  };
  error?: {
    code: string;
    message: string;
  };
};

describe("POST /api/manual-imports", () => {
  beforeEach(() => {
    persistManualImport.mockReset();
    persistManualImport.mockResolvedValue({
      sessionId: "manual-session-1",
      dataQualityReportId: "quality-report-1",
      status: "needs_review",
      readiness: "needs_review",
      counts: {
        totalRows: 1,
        validRows: 1,
        warningRows: 1,
        errorRows: 0,
      },
      warningCodes: ["DEMO_DATA"],
      errorCodes: [],
      missingFields: [],
      topIssues: [],
      sourceType: "user_input",
      dataMode: "user_input",
      productionApproved: false,
    });
  });

  it("persists a valid CSV payload through the service layer", async () => {
    const response = await postJson({
      kind: "csv",
      csvText: "ticker,period,asOf,netIncome,totalAssets,equity\nFPTLAB,2025Q4,2026-01-15,100,1000,500",
      sourceLabel: "manual_upload",
      fileName: "local-sample.csv",
    });
    const json = await readJson<ManualImportApiResponse>(response);

    expect(response.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.data?.sessionId).toBe("manual-session-1");
    expect(json.data?.dataMode).toBe("user_input");
    expect(json.data?.sourceType).toBe("user_input");
    expect(json.data?.productionApproved).toBe(false);
    expect(persistManualImport).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "csv",
        sourceLabel: "manual_upload",
        fileName: "local-sample.csv",
      }),
    );
  });

  it("rejects non user-input source claims", async () => {
    const response = await postJson({
      kind: "rows",
      rows: [{ ticker: "FPTLAB", period: "2025Q4", asOf: "2026-01-15" }],
      dataMode: "production_approved",
    });
    const json = await readJson<ManualImportApiResponse>(response);

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("MANUAL_IMPORT_SOURCE_MODE_NOT_ALLOWED");
    expect(persistManualImport).not.toHaveBeenCalled();
  });

  it("rejects production approval claims", async () => {
    const response = await postJson({
      kind: "rows",
      rows: [{ ticker: "FPTLAB", period: "2025Q4", asOf: "2026-01-15" }],
      productionApproved: true,
    });
    const json = await readJson<ManualImportApiResponse>(response);

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("MANUAL_IMPORT_SOURCE_MODE_NOT_ALLOWED");
    expect(persistManualImport).not.toHaveBeenCalled();
  });

  it("rejects malformed request bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/manual-imports", {
        method: "POST",
        body: "{",
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const json = await readJson<ManualImportApiResponse>(response);

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("INVALID_JSON");
    expect(persistManualImport).not.toHaveBeenCalled();
  });

  it("returns a safe error response when persistence fails", async () => {
    persistManualImport.mockRejectedValue(new Error("database url details"));

    const response = await postJson({
      kind: "rows",
      rows: [{ ticker: "FPTLAB", period: "2025Q4", asOf: "2026-01-15" }],
    });
    const json = await readJson<ManualImportApiResponse>(response);

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(json)).not.toContain("database url details");
  });
});
