import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { persistManualImport, type PersistManualImportInput } from "@/lib/database";
import type { RawSourceRecord } from "@/lib/data-sources/types";

type ManualImportRequestBody = {
  kind?: unknown;
  csvText?: unknown;
  rows?: unknown;
  batch?: unknown;
  userId?: unknown;
  sourceLabel?: unknown;
  targetTicker?: unknown;
  targetPeriod?: unknown;
  fileName?: unknown;
  dataMode?: unknown;
  sourceType?: unknown;
  productionApproved?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonBody = async (request: Request): Promise<ManualImportRequestBody | null> => {
  try {
    const body = (await request.json()) as unknown;
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const rowsOrNull = (value: unknown): RawSourceRecord[] | null =>
  Array.isArray(value) && value.every(isRecord) ? (value as RawSourceRecord[]) : null;

const batchOrUndefined = (value: unknown): PersistManualImportInput["batch"] | undefined =>
  isRecord(value) ? value : undefined;

const hasUnsupportedSourceClaim = (body: ManualImportRequestBody): boolean => {
  const dataMode = stringOrNull(body.dataMode);
  const sourceType = stringOrNull(body.sourceType);
  const productionApproved = body.productionApproved;
  return Boolean(
    (dataMode && dataMode !== "user_input") ||
      (sourceType && sourceType !== "user_input") ||
      productionApproved === true ||
      productionApproved === "true",
  );
};

const toPersistInput = (body: ManualImportRequestBody): PersistManualImportInput | null => {
  const common = {
    batch: batchOrUndefined(body.batch),
    userId: stringOrNull(body.userId),
    sourceLabel: stringOrNull(body.sourceLabel),
    targetTicker: stringOrNull(body.targetTicker),
    targetPeriod: stringOrNull(body.targetPeriod),
    fileName: stringOrNull(body.fileName),
  };

  if (body.kind === "csv") {
    const csvText = stringOrNull(body.csvText);
    return csvText ? { kind: "csv", csvText, ...common } : null;
  }

  if (body.kind === "rows") {
    const rows = rowsOrNull(body.rows);
    return rows ? { kind: "rows", rows, ...common } : null;
  }

  return null;
};

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await parseJsonBody(request);
    if (!body) {
      return apiError("INVALID_JSON", "Request body must be a JSON object.", { status: 400 });
    }

    if (hasUnsupportedSourceClaim(body)) {
      return apiError("MANUAL_IMPORT_SOURCE_MODE_NOT_ALLOWED", "Manual import payloads must remain user input.", {
        status: 400,
      });
    }

    const input = toPersistInput(body);
    if (!input) {
      return apiError("INVALID_MANUAL_IMPORT_PAYLOAD", "Manual import payload must include csv text or row objects.", {
        status: 400,
      });
    }

    const result = await persistManualImport(input);

    return apiSuccess(result, {
      status: 201,
      meta: {
        source: "database",
        fallback: false,
      },
    });
  } catch {
    return apiInternalError();
  }
};
