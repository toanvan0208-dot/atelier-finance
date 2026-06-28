import { loadLatestMacroObservations } from "./macro-observation-read-path";
import { macroCompassData } from "../data/macroCompass.data";
import type { MacroCompassData, MacroCompassMetric } from "../types";
import { MACRO_INDICATOR_UNIVERSE } from "./macro-indicator-registry";
import { evaluateMacroObservationFreshness } from "./macro-stale-policy";

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
      latestObservation: null as any,
      freshness: evaluateMacroObservationFreshness({
        observationDate: dbObs ? dbObs.observationDate : null,
        expectedFrequency: registryItem.expectedFrequency
      })
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
  const dbGdp = dbResult.observations?.find(o => o.indicatorCode === "GDP_GROWTH");
  const dbCpi = dbResult.observations?.find(o => o.indicatorCode === "CPI_YOY");
  
  const gdpReg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === "GDP_GROWTH");
  const cpiReg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === "CPI_YOY");

  function patchMetric(id: string, dbObs: any, registryMatch: any, list: MacroCompassMetric[]) {
    const idx = list.findIndex(m => m.id === id);
    if (idx !== -1) {
      const metric = list[idx];
      metric.supportStatus = registryMatch?.supportStatus;
      
      const freshness = evaluateMacroObservationFreshness({
        observationDate: dbObs ? dbObs.observationDate : null,
        expectedFrequency: registryMatch?.expectedFrequency
      });
      metric.freshness = freshness;

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
        
        if (freshness.staleStatus === "stale") {
          metric.status = "stale";
          metric.statusLabel = "Dữ liệu có thể đã cũ";
        } else {
          metric.status = "available";
          metric.statusLabel = "Dữ liệu hệ thống";
        }
        
        metric.confidence = "Dữ liệu candidate, cần rà soát";
        
        const newWarnings = [];
        if (!dbObs.productionApproved) {
          newWarnings.push("Dữ liệu candidate từ hệ thống, chưa được phê duyệt production.");
        }
        if (freshness.staleStatus === "stale") {
          newWarnings.push(freshness.reason);
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

  patchMetric("gdp", dbGdp, gdpReg, cloned.vietnamMetrics);
  patchMetric("cpi", dbCpi, cpiReg, cloned.vietnamMetrics);

  // Clear fake data from all other non-db-backed legacy metrics
  const nonDbBackedIds = ["usd-vnd", "fed-rate", "dxy", "commodities", "global-flow", "pmi", "exports", "domestic-rate", "foreign-flow", "credit-growth", "public-investment", "market-liquidity"];
  
  // Also patch the non DB backed metrics to match registry
  const legacyMap: Record<string, string> = {
    "usd-vnd": "USD_VND",
    "fed-rate": "FED_FUNDS_RATE",
    "dxy": "DXY",
    "commodities": "BRENT_OIL_PRICE",
    "global-flow": "GLOBAL_FLOW",
    "pmi": "PMI_MANUFACTURING",
    "exports": "EXPORT_GROWTH",
    "domestic-rate": "INTERBANK_RATE_OVERNIGHT",
    "foreign-flow": "FOREIGN_NET_FLOW",
    "credit-growth": "CREDIT_GROWTH",
    "public-investment": "PUBLIC_INVESTMENT",
    "market-liquidity": "MARKET_TRADING_VALUE"
  };

  for (const vMetric of cloned.vietnamMetrics) {
    if (nonDbBackedIds.includes(vMetric.id)) {
      const code = legacyMap[vMetric.id];
      const reg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === code);
      patchMetric(vMetric.id, null, reg, cloned.vietnamMetrics);
    }
  }
  
  for (const wMetric of cloned.worldMetrics) {
    if (nonDbBackedIds.includes(wMetric.id)) {
      const code = legacyMap[wMetric.id];
      const reg = MACRO_INDICATOR_UNIVERSE.find(r => r.indicatorCode === code);
      patchMetric(wMetric.id, null, reg, cloned.worldMetrics);
    }
  }

  return cloned;
}
