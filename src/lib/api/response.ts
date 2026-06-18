export type ApiSuccessBody<T> = {
  ok: true;
  status: "success";
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorBody = {
  ok: false;
  status: "error";
  error: {
    code: string;
    message: string;
    reason?: string;
  };
};

const jsonHeaders = {
  "content-type": "application/json",
};

export const apiSuccess = <T>(
  data: T,
  init: {
    status?: number;
    meta?: Record<string, unknown>;
  } = {},
): Response =>
  new Response(
    JSON.stringify({
      ok: true,
      status: "success",
      data,
      ...(init.meta ? { meta: init.meta } : {}),
    } satisfies ApiSuccessBody<T>),
    {
      status: init.status ?? 200,
      headers: jsonHeaders,
    },
  );

export const apiError = (
  code: string,
  message: string,
  init: {
    status?: number;
    reason?: string;
  } = {},
): Response =>
  new Response(
    JSON.stringify({
      ok: false,
      status: "error",
      error: {
        code,
        message,
        ...(init.reason ? { reason: init.reason } : {}),
      },
    } satisfies ApiErrorBody),
    {
      status: init.status ?? 500,
      headers: jsonHeaders,
    },
  );

export const apiInternalError = (): Response =>
  apiError("INTERNAL_ERROR", "Unable to complete the request.", { status: 500 });
