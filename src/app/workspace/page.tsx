import { AppShell } from "@/components/layout/AppShell";
import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { loadTechnicalRuntimeData } from "@/features/technical/lib/load-technical-runtime-data";
import { resolveValuationUnitAwareReadyMetricsScenarioId } from "@/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario";
import { loadPortfolioReadiness } from "@/features/watchlist/lib/load-portfolio-readiness";
import { loadChecklistRuntimeData } from "@/features/checklist/lib/load-checklist-runtime-data";
import { loadScreeningRuntimeData } from "@/features/screening/lib/load-screening-runtime-data";
import { loadLearningRuntimeData } from "@/features/learning";
import { loadMacroRuntimeData } from "@/features/macro/lib/load-macro-runtime-data";
import { loadIndustryContextRuntimeByTicker } from "@/features/industry/lib/load-industry-context";
import { loadRiskDisclosureReview } from "@/features/risk/lib/load-risk-disclosure-review";
import { loadUserWatchlistItems } from "@/features/watchlist/lib/load-user-watchlist-items";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const boolParam = (value: string | string[] | undefined): boolean | undefined => {
  const resolved = firstParam(value);
  if (resolved === "true") return true;
  if (resolved === "false") return false;
  return undefined;
};

const safeLoad = async <T,>(label: string, loader: Promise<T> | T, fallback: T): Promise<T> => {
  try {
    return await loader;
  } catch (error) {
    console.error(`[workspace] ${label} runtime load failed`, error);
    return fallback;
  }
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const params = (await searchParams) ?? {};
  const initialModule = firstParam(params.module);
  const ticker = firstParam(params.ticker);
  const technicalTicker = firstParam(params.technicalTicker) ?? ticker;
  const technicalFrom = firstParam(params.technicalFrom);
  const technicalTo = firstParam(params.technicalTo);
  const technicalSourceLabel = firstParam(params.technicalSourceLabel);
  const technicalPreferDb = boolParam(params.technicalPreferDb);
  const valuationScenario = resolveValuationUnitAwareReadyMetricsScenarioId(params.valuationScenario);
  
  const [
    currentUser,
    initialTechnicalData,
    initialFinancialsRuntimeData,
    initialPortfolioReadiness,
    initialChecklistData,
    initialScreeningData,
    initialLearningData,
    initialMacroData,
    initialIndustryContexts,
    initialRiskDisclosureReview,
    initialWatchlistItems,
  ] = await Promise.all([
    safeLoad("auth", getCurrentUser(), null),
    safeLoad(
      "technical",
      loadTechnicalRuntimeData({
        ticker: technicalTicker,
        from: technicalFrom,
        to: technicalTo,
        sourceLabel: technicalSourceLabel,
        preferDb: technicalPreferDb,
      }),
      undefined,
    ),
    safeLoad("financials", loadFinancialsRuntimeData({ ticker, allowFallback: false }), undefined),
    safeLoad("portfolio readiness", loadPortfolioReadiness(), undefined),
    safeLoad("checklist", loadChecklistRuntimeData({ ticker, allowFinancialsFallback: false }), undefined),
    safeLoad("screening", loadScreeningRuntimeData({ allowFinancialsFallback: false }), undefined),
    safeLoad("learning", loadLearningRuntimeData(), undefined),
    safeLoad("macro", loadMacroRuntimeData(), undefined),
    safeLoad(
      "industry contexts",
      Promise.all(["FPT", "MWG", "VNM", "HPG", "VCB", "MSN"].map(loadIndustryContextRuntimeByTicker)).then(
        (contexts) => Object.fromEntries(contexts.map((context) => [context.ticker, context])),
      ),
      {},
    ),
    safeLoad("risk disclosure", loadRiskDisclosureReview(ticker), undefined),
    safeLoad("watchlist", loadUserWatchlistItems(), []),
  ]);

  return (
    <AppShell
      currentUser={currentUser}
      initialChecklistData={initialChecklistData}
      initialFinancialsRuntimeData={initialFinancialsRuntimeData}
      initialLearningData={initialLearningData}
      initialMacroData={initialMacroData}
      initialIndustryContexts={initialIndustryContexts}
      initialModule={initialModule}
      initialPortfolioReadiness={initialPortfolioReadiness}
      initialRiskDisclosureReview={initialRiskDisclosureReview}
      initialScreeningData={initialScreeningData}
      initialTechnicalData={initialTechnicalData}
      initialValuationScenario={valuationScenario}
      initialWatchlistItems={initialWatchlistItems}
    />
  );
}
