import { loadLatestMacroObservations } from "./macro-observation-read-path";
import { macroCompassData } from "../data/macroCompass.data";
import type { MacroCompassData, MacroCompassMetric } from "../types";
import { MACRO_INDICATOR_UNIVERSE } from "./macro-indicator-registry";

export async function loadMacroRuntimeData(): Promise<MacroCompassData> {
  // Extract all indicator codes from the registry
  const indicatorCodes = MACRO_INDICATOR_UNIVERSE.map(item => item.indicatorCode);

  const dbResult = await loadLatestMacroObservations({
    indicatorCodes
  });

  const cloned = JSON.parse(JSON.stringify(macroCompassData)) as MacroCompassData;

  const indicatorUniverse = [];
  const dbBackedIndicators: string[] = [];
  const plannedIndicators: string[] = [];
  const sourceAssessmentNeededIndicators: string[] = [];
  const unsupportedIndicators: string[] = [];
  const indicatorsByCategory: Record<string, any[]> = {
    growth: [],
    inflation: [],
    rates: [],
    fx: [],
    market: []
  };

  // Build the new universe payload
  for (const registryItem of MACRO_INDICATOR_UNIVERSE) {
    const dbObs = dbResult.observations?.find(o => o.indicatorCode === registryItem.indicatorCode);

    let finalItem = {
      ...registryItem,
      latestObservation: null as any
    };

    if (registryItem.supportStatus === "db_backed" && dbObs) {
      dbBackedIndicators.push(registryItem.indicatorCode);
      finalItem.latestObservation = dbObs;
    } else if (registryItem.supportStatus === "planned" || registryItem.supportStatus === "candidate_source_identified") {
      plannedIndicators.push(registryItem.indicatorCode);
    } else if (registryItem.supportStatus === "source_assessment_needed") {
      sourceAssessmentNeededIndicators.push(registryItem.indicatorCode);
    } else {
      unsupportedIndicators.push(registryItem.indicatorCode);
    }

    indicatorUniverse.push(finalItem);
    indicatorsByCategory[registryItem.category]?.push(finalItem);
  }

  cloned.indicatorUniverse = indicatorUniverse;
  cloned.indicatorsByCategory = indicatorsByCategory;
  cloned.dbBackedIndicators = dbBackedIndicators;
  cloned.plannedIndicators = plannedIndicators;
  cloned.sourceAssessmentNeededIndicators = sourceAssessmentNeededIndicators;
  cloned.unsupportedIndicators = unsupportedIndicators;

  // Backward compatibility with legacy worldMetrics and vietnamMetrics
  if (!dbResult.available) {
    return cloned;
  }

  const dbGdp = dbResult.observations?.find(o => o.indicatorCode === "GDP_GROWTH");
  const dbCpi = dbResult.observations?.find(o => o.indicatorCode === "CPI_YOY");

  function patchMetric(id: string, dbObs: any, registryMatch: any) {
    const idx = cloned.vietnamMetrics.findIndex(m => m.id === id);
    if (idx !== -1) {
      const metric = cloned.vietnamMetrics[idx];
      if (dbObs) {
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
      } else {
        // Force the missing metric data structure but update the reason
        metric.value = null;
        metric.unit = null;
        metric.period = null;
        metric.asOf = null;
        metric.sourceName = null;
        metric.sourceLabel = null;
        metric.sourceRef = null;
        metric.dataMode = "unavailable";
        metric.productionApproved = false;
        metric.status = "missing";
        
        if (registryMatch?.supportStatus === "planned" || registryMatch?.supportStatus === "candidate_source_identified") {
          metric.statusLabel = "Dự kiến hỗ trợ";
        } else if (registryMatch?.supportStatus === "source_assessment_needed") {
          metric.statusLabel = "Cần đánh giá nguồn";
        } else {
          metric.statusLabel = "Chưa có dữ liệu hệ thống";
        }
        metric.confidence = "Chưa có dữ liệu hệ thống";
        metric.whatToCheckNext = "Đang chờ tích hợp nguồn dữ liệu.";
      }
    }
  }

  const gdpReg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === "GDP_GROWTH");
  const cpiReg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === "CPI_YOY");

  patchMetric("gdp", dbGdp, gdpReg);
  patchMetric("cpi", dbCpi, cpiReg);

  // Clear fake data from all other non-db-backed legacy metrics
  const nonDbBackedIds = ["usd-vnd", "fed-rate", "dxy", "commodities", "global-flow", "pmi", "exports", "domestic-rate", "foreign-flow", "credit-growth", "public-investment", "market-liquidity"];
  
  for (const vMetric of cloned.vietnamMetrics) {
    if (nonDbBackedIds.includes(vMetric.id)) {
      vMetric.value = null;
      vMetric.status = "missing";
      vMetric.statusLabel = "Chưa có dữ liệu hệ thống";
      vMetric.warnings = ["Hệ thống hiện chưa cung cấp dữ liệu thật cho chỉ số này."];
    }
  }
  
  for (const wMetric of cloned.worldMetrics) {
    if (nonDbBackedIds.includes(wMetric.id)) {
      wMetric.value = null;
      wMetric.status = "missing";
      wMetric.statusLabel = "Chưa có dữ liệu hệ thống";
      wMetric.warnings = ["Hệ thống hiện chưa cung cấp dữ liệu thật cho chỉ số này."];
    }
  }

  return cloned;
}
