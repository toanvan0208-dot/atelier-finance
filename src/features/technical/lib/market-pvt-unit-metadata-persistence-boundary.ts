import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  buildMarketPvtUnitMetadata,
  isMarketPvtUnitAccepted,
  marketPvtUnitContracts,
  type MarketPvtFieldUnitMetadata,
  type MarketPvtNumericField,
  type MarketPvtUnitMetadataMap,
  type MarketPvtUnitMetadataSource,
  type MarketPvtUnitMetadataStatus,
} from "./market-pvt-unit-metadata-contract";

export type MarketPvtUnitMetadataPersistencePayload = {
  schemaVersion: 1;
  productionApproved: false;
  unitMetadata: Partial<
    Record<
      MarketPvtNumericField,
      Pick<MarketPvtFieldUnitMetadata, "status" | "unit"> & {
        source?: MarketPvtUnitMetadataSource | null;
        warningCodes?: string[];
      }
    >
  >;
};

export type MarketPvtUnitMetadataPersistenceReadStatus =
  | "available"
  | "missing_metadata"
  | "invalid_metadata";

export type MarketPvtUnitMetadataPersistenceReadResult = {
  status: MarketPvtUnitMetadataPersistenceReadStatus;
  productionApproved: false;
  marketUnitMetadata: MarketPvtUnitMetadataMap;
  warnings: string[];
};

export type ReadMarketPvtUnitMetadataPersistencePayloadOptions = {
  payload?: unknown;
  values?: Partial<Record<MarketPvtNumericField, number | null>>;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: string | null;
};

export type StoredMarketPvtUnitMetadataSidecarRow = {
  field: string;
  unit: string | null;
  status: string;
  source?: string | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: Date | string | null;
  warningCodes?: string | null;
  productionApproved?: boolean | null;
};

export type PersistMarketPvtUnitMetadataInput = {
  marketPriceId: string;
  marketUnitMetadata: Partial<Record<MarketPvtNumericField, MarketPvtFieldUnitMetadata>>;
  sourceLabel?: string | null;
  dataMode?: string | null;
  asOf?: Date | string | null;
};

export type PersistMarketPvtUnitMetadataResult = {
  upsertedCount: number;
  rejectedCount: number;
  productionApproved: false;
  warnings: string[];
};

export type MarketPvtUnitMetadataPersistenceDb = {
  marketPriceUnitMetadata: {
    upsert: (args: unknown) => Promise<unknown>;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parsePayload = (payload: unknown): unknown => {
  if (typeof payload !== "string") return payload;
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return null;
  }
};

const unitFromPayload = (value: unknown): ValuationUnit | null =>
  typeof value === "string" ? (value as ValuationUnit) : null;

const sourceFromPayload = (value: unknown): MarketPvtUnitMetadataSource =>
  value === "market_pvt" ||
  value === "persisted_market_bridge" ||
  value === "sample_fallback" ||
  value === "local_research"
    ? value
    : "unknown";

const parseStringArray = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const dateOnly = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const isReadableStatus = (value: unknown): value is MarketPvtUnitMetadataStatus =>
  value === "ready" ||
  value === "missing" ||
  value === "unknown_unit" ||
  value === "invalid_unit" ||
  value === "invalid_value";

const payloadFromUnitMetadata = (
  marketUnitMetadata: MarketPvtUnitMetadataMap,
): MarketPvtUnitMetadataPersistencePayload => ({
  productionApproved: false,
  schemaVersion: 1,
  unitMetadata: Object.fromEntries(
    Object.keys(marketPvtUnitContracts).map((field) => {
      const key = field as MarketPvtNumericField;
      return [
        key,
        {
          source: marketUnitMetadata[key].source,
          status: marketUnitMetadata[key].status,
          unit: marketUnitMetadata[key].unit,
          warningCodes: marketUnitMetadata[key].warnings,
        },
      ];
    }),
  ) as MarketPvtUnitMetadataPersistencePayload["unitMetadata"],
});

export const buildMarketPvtUnitMetadataPersistencePayload = payloadFromUnitMetadata;

export const unitMetadataPayloadFromMarketPriceSidecar = (
  rows: StoredMarketPvtUnitMetadataSidecarRow[] | null | undefined,
): MarketPvtUnitMetadataPersistencePayload | undefined => {
  if (!rows?.length) return undefined;
  const unitMetadata: MarketPvtUnitMetadataPersistencePayload["unitMetadata"] = {};

  for (const row of rows) {
    if (!(row.field in marketPvtUnitContracts)) continue;
    const field = row.field as MarketPvtNumericField;
    unitMetadata[field] = {
      source: sourceFromPayload(row.source),
      status: row.status as MarketPvtUnitMetadataStatus,
      unit: (row.unit ?? "unknown") as ValuationUnit,
      warningCodes: parseStringArray(row.warningCodes),
    };
  }

  return {
    productionApproved: false,
    schemaVersion: 1,
    unitMetadata,
  };
};

export const readMarketPvtUnitMetadataFromPersistencePayload = ({
  asOf,
  dataMode,
  payload,
  sourceLabel,
  values = {},
}: ReadMarketPvtUnitMetadataPersistencePayloadOptions): MarketPvtUnitMetadataPersistenceReadResult => {
  const parsed = parsePayload(payload);
  const warnings: string[] = [];
  const units: Partial<Record<MarketPvtNumericField, ValuationUnit | null>> = {};

  if (!isRecord(parsed)) {
    return {
      marketUnitMetadata: buildMarketPvtUnitMetadata({
        asOf,
        dataMode,
        source: "persisted_market_bridge",
        sourceLabel,
        values,
      }),
      productionApproved: false,
      status: "missing_metadata",
      warnings: ["market_pvt_unit_metadata_persistence_payload_missing"],
    };
  }

  if (parsed.productionApproved === true) warnings.push("market_pvt_unit_metadata_production_approval_ignored");
  if (parsed.schemaVersion !== 1) warnings.push("market_pvt_unit_metadata_persistence_schema_version_invalid");

  const rawMetadata = isRecord(parsed.unitMetadata) ? parsed.unitMetadata : null;
  if (!rawMetadata) warnings.push("market_pvt_unit_metadata_map_missing");

  for (const field of Object.keys(marketPvtUnitContracts) as MarketPvtNumericField[]) {
    const rawField = rawMetadata?.[field];
    if (!isRecord(rawField)) continue;

    const unit = unitFromPayload(rawField.unit);
    const status = rawField.status;
    if (!isReadableStatus(status)) {
      warnings.push(`${field}_persisted_market_pvt_status_invalid`);
      continue;
    }
    if (status !== "ready") continue;
    if (!unit || unit === "unknown" || !isMarketPvtUnitAccepted(field, unit)) {
      warnings.push(`${field}_persisted_market_pvt_unit_metadata_invalid`);
      continue;
    }
    units[field] = unit;
  }

  return {
    marketUnitMetadata: buildMarketPvtUnitMetadata({
      asOf,
      dataMode,
      source: "persisted_market_bridge",
      sourceLabel,
      units,
      values,
    }),
    productionApproved: false,
    status: warnings.some((warning) => warning.includes("invalid")) ? "invalid_metadata" : "available",
    warnings,
  };
};

export const persistMarketPvtUnitMetadataForMarketPrice = async (
  input: PersistMarketPvtUnitMetadataInput,
  db: MarketPvtUnitMetadataPersistenceDb,
): Promise<PersistMarketPvtUnitMetadataResult> => {
  const marketPriceId = input.marketPriceId.trim();
  const warnings: string[] = [];

  if (!marketPriceId) {
    return {
      productionApproved: false,
      rejectedCount: Object.keys(input.marketUnitMetadata).length,
      upsertedCount: 0,
      warnings: ["market_price_id_required_for_market_pvt_unit_metadata"],
    };
  }

  let upsertedCount = 0;
  let rejectedCount = 0;

  for (const field of Object.keys(marketPvtUnitContracts) as MarketPvtNumericField[]) {
    const metadata = input.marketUnitMetadata[field];
    if (!metadata) continue;

    if (metadata.status !== "ready" || !isMarketPvtUnitAccepted(field, metadata.unit)) {
      rejectedCount += 1;
      warnings.push(`${field}_market_pvt_unit_metadata_not_persisted_invalid_or_missing`);
      continue;
    }

    const row = {
      asOf: input.asOf ? new Date(input.asOf) : metadata.asOf ? new Date(metadata.asOf) : null,
      dataMode: metadata.dataMode ?? input.dataMode ?? null,
      field,
      productionApproved: false,
      source: metadata.source,
      sourceLabel: metadata.sourceLabel ?? input.sourceLabel ?? null,
      status: metadata.status,
      unit: metadata.unit,
      warningCodes: JSON.stringify(metadata.warnings),
    };

    await db.marketPriceUnitMetadata.upsert({
      where: {
        marketPriceId_field: {
          field,
          marketPriceId,
        },
      },
      update: row,
      create: {
        marketPriceId,
        ...row,
      },
    });
    upsertedCount += 1;
  }

  return {
    productionApproved: false,
    rejectedCount,
    upsertedCount,
    warnings,
  };
};

export const dateOnlyFromMarketPvtMetadataPersistence = dateOnly;
