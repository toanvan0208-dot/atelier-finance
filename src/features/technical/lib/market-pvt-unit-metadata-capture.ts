import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  buildMarketPvtUnitMetadata,
  type BuildMarketPvtUnitMetadataOptions,
  type MarketPvtFieldUnitMetadata,
  type MarketPvtNumericField,
  type MarketPvtUnitMetadataMap,
  type MarketPvtUnitMetadataSource,
} from "./market-pvt-unit-metadata-contract";

export type MarketPvtUnitMetadataCaptureValues = Partial<Record<MarketPvtNumericField, number | null>>;

export type MarketPvtUnitMetadataCaptureUnits = Partial<Record<MarketPvtNumericField, ValuationUnit | null>>;

export type MarketPvtUnitMetadataCaptureInput = {
  values?: MarketPvtUnitMetadataCaptureValues;
  units?: MarketPvtUnitMetadataCaptureUnits;
  source?: MarketPvtUnitMetadataSource;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: string | null;
};

export type MarketPvtUnitMetadataCaptureResult = {
  marketUnitMetadata: MarketPvtUnitMetadataMap;
  source: MarketPvtUnitMetadataSource;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: string | null;
  productionApproved: false;
  warnings: string[];
};

export type MarketPvtMetadataAttachable = {
  marketUnitMetadata?: MarketPvtUnitMetadataMap;
  warnings?: string[];
};

const warningsFromMetadata = (metadata: MarketPvtUnitMetadataMap): string[] =>
  Object.values(metadata).flatMap((field) => field.warnings);

export const captureMarketPvtUnitMetadata = ({
  asOf,
  dataMode,
  source = "local_research",
  sourceLabel,
  units,
  values,
}: MarketPvtUnitMetadataCaptureInput = {}): MarketPvtUnitMetadataCaptureResult => {
  const options: BuildMarketPvtUnitMetadataOptions = {
    asOf,
    dataMode,
    source,
    sourceLabel,
    units,
    values,
  };
  const marketUnitMetadata = buildMarketPvtUnitMetadata(options);

  return {
    asOf,
    dataMode,
    marketUnitMetadata,
    productionApproved: false,
    source,
    sourceLabel,
    warnings: warningsFromMetadata(marketUnitMetadata),
  };
};

export const buildUnknownMarketPvtUnitMetadata = (
  values: MarketPvtUnitMetadataCaptureValues = {},
  options: Omit<MarketPvtUnitMetadataCaptureInput, "units" | "values"> = {},
): MarketPvtUnitMetadataMap =>
  captureMarketPvtUnitMetadata({
    ...options,
    values,
  }).marketUnitMetadata;

export const attachMarketPvtUnitMetadata = <T extends MarketPvtMetadataAttachable>(
  target: T,
  capture: MarketPvtUnitMetadataCaptureInput,
): T & { marketUnitMetadata: MarketPvtUnitMetadataMap; warnings: string[] } => {
  const captured = captureMarketPvtUnitMetadata(capture);
  return {
    ...target,
    marketUnitMetadata: captured.marketUnitMetadata,
    warnings: [...(target.warnings ?? []), ...captured.warnings],
  };
};

export const normalizeMarketPvtUnitMetadataForValuation = (
  metadata: MarketPvtUnitMetadataMap | null | undefined,
): Partial<Record<"marketPrice" | "marketCap", MarketPvtFieldUnitMetadata>> => ({
  marketCap: metadata?.marketCap,
  marketPrice: metadata?.marketPrice,
});
