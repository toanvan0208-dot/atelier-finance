import { DataMode } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import {
  getFinancialStatementsByTicker,
  getLatestFinancialStatement,
} from "@/lib/database";

type FinancialsRouteContext = {
  params: Promise<{ ticker: string }> | { ticker: string };
};

const dataModes = new Set(Object.values(DataMode));

const resolveTicker = async (context: FinancialsRouteContext): Promise<string> => {
  const params = await context.params;
  return params.ticker.trim().toUpperCase();
};

const parseDataMode = (url: URL): DataMode | undefined => {
  const value = url.searchParams.get("dataMode");
  if (!value) return undefined;
  return dataModes.has(value as DataMode) ? (value as DataMode) : undefined;
};

const parseLimit = (url: URL): number | undefined => {
  const value = url.searchParams.get("limit");
  if (!value) return undefined;
  const limit = Number(value);
  return Number.isInteger(limit) && limit > 0 ? limit : undefined;
};

const parseLatest = (url: URL): boolean =>
  url.searchParams.get("latest") === "true";

export const GET = async (
  request: Request,
  context: FinancialsRouteContext,
): Promise<Response> => {
  try {
    const ticker = await resolveTicker(context);
    if (!ticker) {
      return apiError("INVALID_TICKER", "Ticker is required.", { status: 400 });
    }

    const url = new URL(request.url);
    const requestedDataMode = url.searchParams.get("dataMode");
    const dataMode = parseDataMode(url);
    if (requestedDataMode && !dataMode) {
      return apiError("INVALID_DATA_MODE", "Requested data mode is not supported.", {
        status: 400,
      });
    }

    if (parseLatest(url)) {
      const statement = await getLatestFinancialStatement(ticker, { dataMode });
      if (!statement) {
        return apiError("FINANCIALS_NOT_FOUND", "Financial statements were not found.", {
          status: 404,
          reason: "No persisted financial statement matched the requested ticker.",
        });
      }

      return apiSuccess(statement, {
        meta: {
          ticker,
          latest: true,
          source: "database",
          fallback: false,
        },
      });
    }

    const statements = await getFinancialStatementsByTicker(ticker, {
      dataMode,
      limit: parseLimit(url),
    });

    return apiSuccess(statements, {
      meta: {
        ticker,
        count: statements.length,
        source: "database",
        fallback: false,
        reason: statements.length === 0 ? "No persisted financial statements matched the requested ticker." : undefined,
      },
    });
  } catch {
    return apiInternalError();
  }
};
