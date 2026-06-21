import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";

export type MarketPvtNumericField =
  | "marketPrice"
  | "marketCap"
  | "volume"
  | "tradingValue"
  | "averageTradingValue20d";

export type MarketPvtUnitMetadataStatus = "ready" | "missing" | "unknown_unit" | "invalid_unit" | "invalid_value";

export type MarketPvtUnitMetadataSource =
  | "market_pvt"
  | "persisted_market_bridge"
  | "sample_fallback"
  | "local_research"
  | "unknown";

export type MarketPvtUnitContract = {
  field: MarketPvtNumericField;
  acceptedUnits: ValuationUnit[];
  owner: "market_pvt";
  usedByValuation: boolean;
  notes: string;
};

export type MarketPvtFieldUnitMetadata = {
  field: MarketPvtNumericField;
  value: number | null;
  unit: ValuationUnit;
  status: MarketPvtUnitMetadataStatus;
  acceptedUnits: ValuationUnit[];
  owner: "market_pvt";
  source: MarketPvtUnitMetadataSource;
  usedByValuation: boolean;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: string | null;
  productionApproved: false;
  warnings: string[];
};

export type MarketPvtUnitMetadataMap = Record<MarketPvtNumericField, MarketPvtFieldUnitMetadata>;

export type BuildMarketPvtUnitMetadataOptions = {
  values?: Partial<Record<MarketPvtNumericField, number | null>>;
  units?: Partial<Record<MarketPvtNumericField, ValuationUnit | null>>;
  source?: MarketPvtUnitMetadataSource;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: string | null;
};

const vndScaleUnits: ValuationUnit[] = ["vnd", "thousand_vnd", "million_vnd", "billion_vnd"];
const shareUnits: ValuationUnit[] = ["shares", "thousand_shares", "million_shares"];

export const marketPvtUnitContracts: Record<MarketPvtNumericField, MarketPvtUnitContract> = {
  averageTradingValue20d: {
    acceptedUnits: vndScaleUnits,
    field: "averageTradingValue20d",
    notes: "Average trading value is a market/PVT-owned VND-scale liquidity input.",
    owner: "market_pvt",
    usedByValuation: false,
  },
  marketCap: {
    acceptedUnits: vndScaleUnits,
    field: "marketCap",
    notes: "Market cap is market/PVT or persisted-market-bridge owned, not Financials-owned.",
    owner: "market_pvt",
    usedByValuation: true,
  },
  marketPrice: {
    acceptedUnits: ["vnd_per_share"],
    field: "marketPrice",
    notes: "Market price is market/PVT or persisted-market-bridge owned and must be VND per share.",
    owner: "market_pvt",
    usedByValuation: true,
  },
  tradingValue: {
    acceptedUnits: vndScaleUnits,
    field: "tradingValue",
    notes: "Trading value is a market/PVT-owned VND-scale liquidity input.",
    owner: "market_pvt",
    usedByValuation: false,
  },
  volume: {
    acceptedUnits: shareUnits,
    field: "volume",
    notes: "Volume is a market/PVT-owned share-count input.",
    owner: "market_pvt",
    usedByValuation: false,
  },
};

export const isMarketPvtUnitAccepted = (field: MarketPvtNumericField, unit: ValuationUnit): boolean =>
  marketPvtUnitContracts[field].acceptedUnits.includes(unit);

const isPresentNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const metadataForField = ({
  asOf,
  dataMode,
  field,
  sourceLabel,
  source = "market_pvt",
  unit,
  value,
}: {
  field: MarketPvtNumericField;
  value?: number | null;
  unit?: ValuationUnit | null;
  source?: MarketPvtUnitMetadataSource;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: string | null;
}): MarketPvtFieldUnitMetadata => {
  const contract = marketPvtUnitContracts[field];
  const resolvedUnit = unit ?? "unknown";
  const base = {
    acceptedUnits: contract.acceptedUnits,
    asOf,
    dataMode,
    field,
    owner: contract.owner,
    productionApproved: false as const,
    source,
    sourceLabel,
    usedByValuation: contract.usedByValuation,
    value: isPresentNumber(value) ? value : null,
  };

  if (value === null || value === undefined) {
    return {
      ...base,
      status: "missing",
      unit: "unknown",
      warnings: [],
    };
  }

  if (!isPresentNumber(value)) {
    return {
      ...base,
      status: "invalid_value",
      unit: resolvedUnit,
      warnings: [`${field}_market_pvt_value_invalid`],
    };
  }

  if (value <= 0) {
    return {
      ...base,
      status: "invalid_value",
      unit: resolvedUnit,
      warnings: [`${field}_market_pvt_value_invalid`],
    };
  }

  if (resolvedUnit === "unknown") {
    return {
      ...base,
      status: "unknown_unit",
      unit: "unknown",
      warnings: [`${field}_market_pvt_unit_metadata_missing`],
    };
  }

  if (!isMarketPvtUnitAccepted(field, resolvedUnit)) {
    return {
      ...base,
      status: "invalid_unit",
      unit: resolvedUnit,
      warnings: [`${field}_market_pvt_unit_${resolvedUnit}_invalid_unit`],
    };
  }

  return {
    ...base,
    status: "ready",
    unit: resolvedUnit,
    warnings: [],
  };
};

export const buildMarketPvtUnitMetadata = ({
  asOf,
  dataMode,
  source,
  sourceLabel,
  units = {},
  values = {},
}: BuildMarketPvtUnitMetadataOptions = {}): MarketPvtUnitMetadataMap =>
  Object.fromEntries(
    Object.keys(marketPvtUnitContracts).map((field) => {
      const key = field as MarketPvtNumericField;
      return [
        key,
        metadataForField({
          asOf,
          dataMode,
          field: key,
          source,
          sourceLabel,
          unit: units[key],
          value: values[key],
        }),
      ];
    }),
  ) as MarketPvtUnitMetadataMap;
