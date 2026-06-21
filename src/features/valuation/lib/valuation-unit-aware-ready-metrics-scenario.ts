import type { DataQualityBannerProps } from "@/components/shared/DataQualityBanner";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import type { FinancialsStatementSnapshot } from "@/features/financials/lib/map-financials-to-logic-input";
import { buildMarketPvtUnitMetadata } from "@/features/technical/lib/market-pvt-unit-metadata-contract";
import type { ValuationApiInputs } from "@/lib/data-sources/valuation-api-client";
import type { ControlledValuationPersistedInputs } from "./controlled-valuation-integration-boundary";

export const valuationUnitAwareReadyMetricsScenarioId = "phase71-explicit-units" as const;

export type ValuationUnitAwareReadyMetricsScenarioId = typeof valuationUnitAwareReadyMetricsScenarioId;

export type ValuationUnitAwareReadyMetricsScenario = {
  id: ValuationUnitAwareReadyMetricsScenarioId;
  ticker: "UNIT71";
  financialsRuntimeData: FinancialsRuntimeData;
  persistedValuationInputs: ControlledValuationPersistedInputs;
  valuationApiInputs: ValuationApiInputs;
};

const scenarioTicker = "UNIT71" as const;
const scenarioAsOf = "2026-06-21";
const financialsSourceLabel = "phase71_synthetic_unit_valuation_check";
const marketSourceLabel = "phase71_synthetic_market_unit_check";
const dataMode = "research_only";

const buildDataQuality = (): DataQualityBannerProps => ({
  asOf: scenarioAsOf,
  isDemoData: false,
  isStale: false,
  missingFields: [],
  source: `${financialsSourceLabel} + ${marketSourceLabel}`,
});

export const buildValuationUnitAwareReadyMetricsScenario = (): ValuationUnitAwareReadyMetricsScenario => {
  const financialsSnapshot: FinancialsStatementSnapshot = {
    ticker: scenarioTicker,
    companyType: "non_financial",
    period: "2026-phase71-synthetic",
    periodType: "ttm",
    sourceName: financialsSourceLabel,
    collectedAt: scenarioAsOf,
    revenue: 1_000,
    netProfit: 500,
    totalEquity: 500,
    eps: 5_000,
    sharesOutstanding: 0.1,
  };
  const unitMetadata = buildFinancialsUnitMetadata({
    dataMode,
    explicitUnits: {
      equity: "million_vnd",
      eps: "vnd_per_share",
      netIncome: "million_vnd",
      revenue: "million_vnd",
      sharesOutstanding: "million_shares",
    },
    snapshot: financialsSnapshot,
    sourceLabel: financialsSourceLabel,
  });
  const marketUnitMetadata = buildMarketPvtUnitMetadata({
    asOf: scenarioAsOf,
    dataMode,
    sourceLabel: marketSourceLabel,
    units: {
      marketCap: "billion_vnd",
      marketPrice: "vnd_per_share",
    },
    values: {
      marketCap: 5,
      marketPrice: 50_000,
    },
  });
  const dataQuality = buildDataQuality();
  const valuationSnapshot = {
    ticker: scenarioTicker,
    companyType: "non_financial" as const,
    period: "2026-phase71-synthetic",
    periodType: "ttm" as const,
    sourceName: dataQuality.source,
    collectedAt: scenarioAsOf,
    revenue: financialsSnapshot.revenue,
    netProfit: financialsSnapshot.netProfit,
    totalEquity: financialsSnapshot.totalEquity,
    sharesOutstanding: financialsSnapshot.sharesOutstanding,
    eps: financialsSnapshot.eps,
    closePrice: 50_000,
  };

  return {
    id: valuationUnitAwareReadyMetricsScenarioId,
    ticker: scenarioTicker,
    financialsRuntimeData: {
      dataQuality: {
        errors: [],
        missingFields: [],
        status: "available",
        warnings: ["phase71_synthetic_local_unit_verification_only"],
      },
      readResult: null,
      runtimeStatus: "sample_fallback",
      source: {
        asOf: scenarioAsOf,
        dataMode,
        fallbackUsed: false,
        fiscalYear: null,
        periodType: "ttm",
        productionApproved: false,
        readPath: "sample_static",
        sourceLabel: financialsSourceLabel,
        ticker: scenarioTicker,
      },
      statementSnapshot: financialsSnapshot,
      unitMetadata,
    },
    persistedValuationInputs: {
      dataMode,
      marketCap: 5,
      marketPrice: 50_000,
      marketUnitMetadata,
      productionApproved: false,
      sourceLabel: marketSourceLabel,
    },
    valuationApiInputs: {
      dataQuality,
      metadata: {
        dataMode,
        errorCodes: [],
        fallback: false,
        financials: {
          dataMode,
          fallback: false,
          qualityStatus: "usable_with_caution",
          readiness: "ready",
          sourceType: "synthetic_local",
        },
        marketPrice: {
          dataMode,
          fallback: false,
          qualityStatus: "usable_with_caution",
          readiness: "ready",
          sourceType: "synthetic_local",
        },
        qualityStatus: "usable_with_caution",
        readiness: "ready",
        sourceType: "synthetic_local + synthetic_local",
        ticker: scenarioTicker,
        warningCodes: ["PHASE71_SYNTHETIC_LOCAL_UNIT_VERIFICATION_ONLY"],
      },
      missingReasons: [],
      snapshot: valuationSnapshot,
      status: "ready",
      ticker: scenarioTicker,
    },
  };
};

export const resolveValuationUnitAwareReadyMetricsScenarioId = (
  value: string | string[] | undefined,
): ValuationUnitAwareReadyMetricsScenarioId | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === valuationUnitAwareReadyMetricsScenarioId ? candidate : null;
};
