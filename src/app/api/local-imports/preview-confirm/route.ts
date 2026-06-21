import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { isLocalImportsEnabled } from "@/lib/config/local-imports-access";
import {
  runFinancialStatementSafeImportMvp,
  runMarketPvtSafeImportMvp,
} from "@/lib/data-sources";

const INTERNAL_HEADER = "x-atelier-local-import";
const INTERNAL_HEADER_VALUE = "preview-confirm-local";

type LocalImportPreviewConfirmBody = {
  importType?: unknown;
  action?: unknown;
  csvText?: unknown;
  productionApproved?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonBody = async (request: Request): Promise<LocalImportPreviewConfirmBody | null> => {
  try {
    const parsed = (await request.json()) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const trimString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const isSupportedImportType = (value: string | null): value is "financial_statement" | "market_pvt" =>
  value === "financial_statement" || value === "market_pvt";

const isSupportedAction = (value: string | null): value is "preview" | "confirm" =>
  value === "preview" || value === "confirm";

export const POST = async (request: Request): Promise<Response> => {
  try {
    if (!isLocalImportsEnabled()) {
      return apiError(
        "LOCAL_IMPORTS_DISABLED",
        "Local imports are currently disabled. Set ATELIER_LOCAL_IMPORTS_ENABLED=true in the environment to enable.",
        { status: 403 },
      );
    }

    if (request.headers.get(INTERNAL_HEADER) !== INTERNAL_HEADER_VALUE) {
      return apiError("LOCAL_IMPORT_INTERNAL_HEADER_REQUIRED", "Local import preview requires an internal header.", {
        status: 403,
      });
    }

    const body = await parseJsonBody(request);
    if (!body) {
      return apiError("INVALID_JSON", "Request body must be a JSON object.", { status: 400 });
    }

    if (body.productionApproved === true || body.productionApproved === "true") {
      return apiError("LOCAL_IMPORT_PRODUCTION_APPROVAL_NOT_ALLOWED", "Local imports must remain productionApproved:false.", {
        status: 400,
      });
    }

    const importType = trimString(body.importType);
    const action = trimString(body.action);
    const csvText = trimString(body.csvText);

    if (!isSupportedImportType(importType)) {
      return apiError("LOCAL_IMPORT_TYPE_INVALID", "importType must be financial_statement or market_pvt.", {
        status: 400,
      });
    }

    if (!isSupportedAction(action)) {
      return apiError("LOCAL_IMPORT_ACTION_INVALID", "action must be preview or confirm.", { status: 400 });
    }

    if (!csvText) {
      return apiError("LOCAL_IMPORT_CSV_REQUIRED", "CSV text is required.", { status: 400 });
    }

    const isConfirm = action === "confirm";
    const result =
      importType === "financial_statement"
        ? await runFinancialStatementSafeImportMvp({
            confirmWrite: isConfirm,
            csvText,
            dryRun: !isConfirm,
          })
        : await runMarketPvtSafeImportMvp({
            confirmWrite: isConfirm,
            csvText,
            dryRun: !isConfirm,
          });

    return apiSuccess(result, {
      meta: {
        fallback: false,
        source: "local_import_service",
      },
    });
  } catch {
    return apiInternalError();
  }
};
