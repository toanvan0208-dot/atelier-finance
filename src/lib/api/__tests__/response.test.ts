import { describe, expect, it } from "vitest";
import { apiError, apiInternalError, apiSuccess } from "../response";

describe("API response helpers", () => {
  it("builds success responses with ok and status", async () => {
    const response = apiSuccess([{ ticker: "FPT" }], {
      meta: { count: 1 },
    });

    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "success",
      data: [{ ticker: "FPT" }],
      meta: { count: 1 },
    });
    expect(response.status).toBe(200);
  });

  it("builds safe error responses without stack details", async () => {
    const response = apiError("NOT_FOUND", "Data was not found.", {
      status: 404,
      reason: "No persisted record matched the request.",
    });

    await expect(response.json()).resolves.toEqual({
      ok: false,
      status: "error",
      error: {
        code: "NOT_FOUND",
        message: "Data was not found.",
        reason: "No persisted record matched the request.",
      },
    });
    expect(response.status).toBe(404);
  });

  it("hides internal error details", async () => {
    const response = apiInternalError();

    await expect(response.json()).resolves.toEqual({
      ok: false,
      status: "error",
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to complete the request.",
      },
    });
  });
});
