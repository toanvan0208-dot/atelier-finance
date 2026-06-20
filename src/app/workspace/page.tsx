import { AppShell } from "@/components/layout/AppShell";
import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { loadTechnicalRuntimeData } from "@/features/technical/lib/load-technical-runtime-data";

type WorkspacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const params = (await searchParams) ?? {};
  const ticker = firstParam(params.ticker);
  const [initialTechnicalData, initialFinancialsRuntimeData] = await Promise.all([
    loadTechnicalRuntimeData(),
    loadFinancialsRuntimeData({ ticker }),
  ]);

  return (
    <AppShell
      initialFinancialsRuntimeData={initialFinancialsRuntimeData}
      initialTechnicalData={initialTechnicalData}
    />
  );
}
