import { describe, expect, it, vi } from "vitest";
import {
  buildManualImportSavePayload,
  ManualImportSaveError,
  saveManualImportSession,
} from "../manual-import-api-client";

const successBody = {
  ok: true,
  status: "success",
  data: {
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
    warningCodes: [],
    errorCodes: [],
    missingFields: [],
    sourceType: "user_input",
    dataMode: "user_input",
    productionApproved: false,
  },
};

describe("manual import API client", () => {
  it("builds a controlled user-input payload", () => {
    const payload = buildManualImportSavePayload({
      csvText: "ticker,period\nFPTLAB,2025Q4",
      targetTicker: " FPTLAB ",
      targetPeriod: " 2025Q4 ",
    });

    expect(payload).toEqual({
      kind: "csv",
      csvText: "ticker,period\nFPTLAB,2025Q4",
      sourceLabel: "manual_upload",
      fileName: "manual-import.csv",
      targetTicker: "FPTLAB",
      targetPeriod: "2025Q4",
    });
    expect(payload).not.toHaveProperty("productionApproved");
    expect(payload).not.toHaveProperty("sourceType");
    expect(payload).not.toHaveProperty("dataMode");
  });

  it("posts to the manual import endpoint and returns the session summary", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(successBody), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await saveManualImportSession(
      {
        csvText: "ticker,period\nFPTLAB,2025Q4",
        fileName: "local-sample.csv",
      },
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "/api/manual-imports",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );
    const requestBody = JSON.parse(fetcher.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(requestBody).toMatchObject({
      kind: "csv",
      sourceLabel: "manual_upload",
      fileName: "local-sample.csv",
    });
    expect(requestBody).not.toHaveProperty("productionApproved");
    expect(requestBody).not.toHaveProperty("sourceType");
    expect(requestBody).not.toHaveProperty("dataMode");
    expect(result.sessionId).toBe("manual-session-1");
    expect(result.sourceType).toBe("user_input");
    expect(result.dataMode).toBe("user_input");
    expect(result.productionApproved).toBe(false);
  });

  it("throws a safe error when the API rejects the save", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          status: "error",
          error: {
            code: "INVALID_MANUAL_IMPORT_PAYLOAD",
            message: "Manual import payload must include csv text or row objects.",
          },
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await expect(saveManualImportSession({ csvText: "" }, fetcher)).rejects.toMatchObject({
      name: "ManualImportSaveError",
      code: "INVALID_MANUAL_IMPORT_PAYLOAD",
      message: "Manual import payload must include csv text or row objects.",
    } satisfies Partial<ManualImportSaveError>);
  });
});
