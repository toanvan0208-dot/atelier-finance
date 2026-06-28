import { loadLatestMacroObservations } from "./macro-observation-read-path";
import { macroCompassData } from "../data/macroCompass.data";
import type { MacroCompassData } from "../types";

export async function loadMacroRuntimeData(): Promise<MacroCompassData> {
  const dbResult = await loadLatestMacroObservations({
    indicatorCodes: ["CPI_YOY", "GDP_GROWTH"]
  });

  const cloned = JSON.parse(JSON.stringify(macroCompassData)) as MacroCompassData;

  if (!dbResult.available) {
    return cloned;
  }

  const dbGdp = dbResult.observations.find(o => o.indicatorCode === "GDP_GROWTH");
  const dbCpi = dbResult.observations.find(o => o.indicatorCode === "CPI_YOY");

  function patchMetric(id: string, dbObs: any) {
    const idx = cloned.vietnamMetrics.findIndex(m => m.id === id);
    if (idx !== -1 && dbObs) {
      const metric = cloned.vietnamMetrics[idx];
      metric.value = dbObs.value;
      metric.unit = dbObs.unit || "% YoY";
      metric.period = dbObs.periodLabel || dbObs.observationDate.split("-")[0];
      metric.asOf = dbObs.observationDate.split("T")[0];
      metric.sourceName = dbObs.provenance?.providerType === "public_api_candidate" ? "World Bank (Candidate)" : "World Bank";
      metric.sourceLabel = dbObs.sourceLabel;
      metric.sourceRef = dbObs.provenance?.sourceUrl || null;
      metric.dataMode = dbObs.dataMode;
      metric.productionApproved = dbObs.productionApproved;
      metric.status = "available";
      metric.statusLabel = "Dữ liệu hệ thống";
      metric.confidence = "Dữ liệu candidate, cần rà soát";
      
      const newWarnings = [];
      if (!dbObs.productionApproved) {
        newWarnings.push("Dữ liệu candidate từ hệ thống, chưa được phê duyệt production.");
      }
      if (dbObs.provenance?.warningCodes?.length > 0) {
        newWarnings.push(...dbObs.provenance.warningCodes);
      }
      if (newWarnings.length > 0) {
        metric.warnings = newWarnings;
      }
    }
  }

  patchMetric("gdp", dbGdp);
  patchMetric("cpi", dbCpi);

  return cloned;
}
