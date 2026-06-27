import { AppShell } from "@/components/layout/AppShell";
import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { loadTechnicalRuntimeData } from "@/features/technical/lib/load-technical-runtime-data";
import { resolveValuationUnitAwareReadyMetricsScenarioId } from "@/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario";
import { loadPortfolioReadiness } from "@/features/watchlist/lib/load-portfolio-readiness";
import { loadChecklistRuntimeData } from "@/features/checklist/lib/load-checklist-runtime-data";
import { loadScreeningRuntimeData } from "@/features/screening/lib/load-screening-runtime-data";
import { loadLearningRuntimeData } from "@/features/learning";
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
  const [initialTechnicalData, initialFinancialsRuntimeData, initialPortfolioReadiness, initialChecklistData, initialScreeningData, initialLearningData] = await Promise.all([
    loadTechnicalRuntimeData({
      ticker: technicalTicker,
      from: technicalFrom,
      to: technicalTo,
      sourceLabel: technicalSourceLabel,
      preferDb: technicalPreferDb,
    }),
    loadFinancialsRuntimeData({ ticker }),
    loadPortfolioReadiness(),
    loadChecklistRuntimeData({ ticker }),
    loadScreeningRuntimeData(),
    loadLearningRuntimeData(),
  ]);

  return (
    <AppShell
      initialChecklistData={initialChecklistData}
      initialFinancialsRuntimeData={initialFinancialsRuntimeData}
      initialLearningData={initialLearningData}
      initialModule={initialModule}
      initialPortfolioReadiness={initialPortfolioReadiness}
      initialScreeningData={initialScreeningData}
      initialTechnicalData={initialTechnicalData}
      initialValuationScenario={valuationScenario}
    />
  );
}
