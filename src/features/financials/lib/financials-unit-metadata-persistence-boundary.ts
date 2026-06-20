import type { ValuationUnit } from "@/features/valuation/lib/valuation-input-unit-provenance";
import {
  buildFinancialsUnitMetadata,
  financialsUnitContracts,
  type FinancialsFieldUnitMetadata,
  type FinancialsNumericField,
  type FinancialsUnitMetadataMap,
  isFinancialsUnitAccepted,
} from "./financials-unit-metadata-contract";
import type { FinancialsStatementSnapshot } from "./map-financials-to-logic-input";

export type FinancialsUnitMetadataPersistencePayload = {
  schemaVersion: 1;
  productionApproved: false;
  unitMetadata: Partial<Record<FinancialsNumericField, Pick<FinancialsFieldUnitMetadata, "status" | "unit">>>;
};

export type FinancialsUnitMetadataPersistenceReadStatus = "available" | "missing_metadata" | "invalid_metadata";

export type FinancialsUnitMetadataPersistenceReadResult = {
  status: FinancialsUnitMetadataPersistenceReadStatus;
  productionApproved: false;
  unitMetadata: FinancialsUnitMetadataMap;
  warnings: string[];
};

export type ReadFinancialsUnitMetadataPersistencePayloadOptions = {
  payload?: unknown;
  snapshot?: FinancialsStatementSnapshot | null;
  sourceLabel?: string | null;
  dataMode?: string | null;
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

export const buildFinancialsUnitMetadataPersistencePayload = (
  unitMetadata: FinancialsUnitMetadataMap,
): FinancialsUnitMetadataPersistencePayload => ({
  productionApproved: false,
  schemaVersion: 1,
  unitMetadata: Object.fromEntries(
    Object.keys(financialsUnitContracts).map((field) => {
      const key = field as FinancialsNumericField;
      return [
        key,
        {
          status: unitMetadata[key].status,
          unit: unitMetadata[key].unit,
        },
      ];
    }),
  ) as FinancialsUnitMetadataPersistencePayload["unitMetadata"],
});

export const readFinancialsUnitMetadataFromPersistencePayload = ({
  dataMode,
  payload,
  snapshot = null,
  sourceLabel,
}: ReadFinancialsUnitMetadataPersistencePayloadOptions): FinancialsUnitMetadataPersistenceReadResult => {
  const parsed = parsePayload(payload);
  const warnings: string[] = [];
  const explicitUnits: Partial<Record<FinancialsNumericField, ValuationUnit | null>> = {};

  if (!isRecord(parsed)) {
    return {
      productionApproved: false,
      status: "missing_metadata",
      unitMetadata: buildFinancialsUnitMetadata({ dataMode, snapshot, sourceLabel }),
      warnings: ["financials_unit_metadata_persistence_payload_missing"],
    };
  }

  if (parsed.productionApproved === true) warnings.push("financials_unit_metadata_production_approval_ignored");
  if (parsed.schemaVersion !== 1) warnings.push("financials_unit_metadata_persistence_schema_version_invalid");

  const rawMetadata = isRecord(parsed.unitMetadata) ? parsed.unitMetadata : null;
  if (!rawMetadata) warnings.push("financials_unit_metadata_map_missing");

  for (const field of Object.keys(financialsUnitContracts) as FinancialsNumericField[]) {
    const rawField = rawMetadata?.[field];
    if (!isRecord(rawField)) continue;

    const unit = unitFromPayload(rawField.unit);
    const status = typeof rawField.status === "string" ? rawField.status : null;
    if (status !== "explicit") continue;
    if (!unit || unit === "unknown" || !isFinancialsUnitAccepted(field, unit)) {
      warnings.push(`${field}_persisted_unit_metadata_invalid`);
      continue;
    }
    explicitUnits[field] = unit;
  }

  return {
    productionApproved: false,
    status: warnings.some((warning) => warning.includes("invalid")) ? "invalid_metadata" : "available",
    unitMetadata: buildFinancialsUnitMetadata({ dataMode, explicitUnits, snapshot, sourceLabel }),
    warnings,
  };
};
