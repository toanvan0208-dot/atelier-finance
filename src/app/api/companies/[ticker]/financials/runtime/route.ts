import { apiDataReadError, apiError, apiSuccess } from "@/lib/api/response";
import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";

type FinancialsRuntimeRouteContext = {
  params: Promise<{ ticker: string }> | { ticker: string };
};

const resolveTicker = async (context: FinancialsRuntimeRouteContext): Promise<string> => {
  const params = await context.params;
  return params.ticker.trim().toUpperCase();
};

export const GET = async (
  _request: Request,
  context: FinancialsRuntimeRouteContext,
): Promise<Response> => {
  try {
    const ticker = await resolveTicker(context);
    if (!ticker) {
      return apiError("INVALID_TICKER", "Ticker is required.", { status: 400 });
    }

    const runtimeData = await loadFinancialsRuntimeData({
      ticker,
      allowFallback: false,
    });

    return apiSuccess(runtimeData, {
      meta: {
        ticker,
        source: "financials_runtime",
        fallback: runtimeData.source.fallbackUsed,
      },
    });
  } catch (error) {
    return apiDataReadError(error);
  }
};
