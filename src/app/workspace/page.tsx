import { AppShell } from "@/components/layout/AppShell";
import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { loadTechnicalRuntimeData } from "@/features/technical/lib/load-technical-runtime-data";
import { resolveValuationUnitAwareReadyMetricsScenarioId } from "@/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario";

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
  const ticker = firstParam(params.ticker);
  const technicalTicker = firstParam(params.technicalTicker) ?? ticker;
  const technicalFrom = firstParam(params.technicalFrom);
  const technicalTo = firstParam(params.technicalTo);
  const technicalSourceLabel = firstParam(params.technicalSourceLabel);
  const technicalPreferDb = boolParam(params.technicalPreferDb);
  const valuationScenario = resolveValuationUnitAwareReadyMetricsScenarioId(params.valuationScenario);
  const [initialTechnicalData, initialFinancialsRuntimeData] = await Promise.all([
    loadTechnicalRuntimeData({
      ticker: technicalTicker,
      from: technicalFrom,
      to: technicalTo,
      sourceLabel: technicalSourceLabel,
      preferDb: technicalPreferDb,
    }),
    loadFinancialsRuntimeData({ ticker }),
  ]);

  return (
    <AppShell
      initialFinancialsRuntimeData={initialFinancialsRuntimeData}
      initialTechnicalData={initialTechnicalData}
      initialValuationScenario={valuationScenario}
    />
  );
}
