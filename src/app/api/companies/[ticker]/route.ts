import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCompanyByTicker } from "@/lib/database";

type CompanyRouteContext = {
  params: Promise<{ ticker: string }> | { ticker: string };
};

const resolveTicker = async (context: CompanyRouteContext): Promise<string> => {
  const params = await context.params;
  return params.ticker.trim().toUpperCase();
};

export const GET = async (
  _request: Request,
  context: CompanyRouteContext,
): Promise<Response> => {
  try {
    const ticker = await resolveTicker(context);
    if (!ticker) {
      return apiError("INVALID_TICKER", "Ticker is required.", { status: 400 });
    }

    const company = await getCompanyByTicker(ticker);

    if (!company) {
      return apiError("COMPANY_NOT_FOUND", "Company was not found.", {
        status: 404,
        reason: "No persisted company record matched the requested ticker.",
      });
    }

    return apiSuccess(company, {
      meta: {
        source: "database",
        fallback: false,
      },
    });
  } catch {
    return apiInternalError();
  }
};
