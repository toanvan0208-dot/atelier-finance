import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { getCompanyByTicker } from "@/lib/database";
import { loadCompanyBusinessProfile } from "@/features/business/lib/load-company-business-profile";
import { loadMacroContext } from "@/features/macro/lib/load-macro-context";
import { loadIndustryContextByTicker } from "@/features/industry/lib/load-industry-context";

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

    const businessProfile = await loadCompanyBusinessProfile(ticker);
    const macroContext = await loadMacroContext();
    const industryContext = await loadIndustryContextByTicker(ticker);

    return apiSuccess({
      ...company,
      businessProfile: businessProfile || undefined,
      macroContext: macroContext ? {
        sourceLabel: macroContext.sourceLabel,
        dataMode: macroContext.dataMode,
        productionApproved: macroContext.productionApproved,
        needsReview: macroContext.needsReview,
      } : undefined,
      industryContext: industryContext ? {
        industryName: industryContext.industryName,
        sourceLabel: industryContext.sourceLabel,
        dataMode: industryContext.dataMode,
        productionApproved: industryContext.productionApproved,
        needsReview: industryContext.needsReview,
      } : undefined,
    }, {
      meta: {
        source: "database",
        fallback: false,
      },
    });
  } catch {
    return apiInternalError();
  }
};
