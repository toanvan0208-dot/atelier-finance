import { AppShell } from "@/components/layout/AppShell";
import { loadTechnicalRuntimeData } from "@/features/technical/lib/load-technical-runtime-data";

export default async function WorkspacePage() {
  const initialTechnicalData = await loadTechnicalRuntimeData();

  return <AppShell initialTechnicalData={initialTechnicalData} />;
}
