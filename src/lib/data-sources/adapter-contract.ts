import type {
  DataPeriod,
  DataSourceMetadata,
  ReadinessStatus,
  SourceType,
} from "../data-contract";
import type { AdapterError, AdapterWarning, DataGroup } from "./types";
import { parseAsOfDate } from "./normalization";
import { checkStaleByDataGroup } from "./stale-thresholds";

export const combineReadiness = (
  statuses: ReadinessStatus[],
): ReadinessStatus => {
  if (statuses.includes("not_ready")) return "not_ready";
  if (statuses.includes("insufficient_data")) return "insufficient_data";
  if (statuses.includes("needs_review")) return "needs_review";
  if (statuses.includes("unknown")) return "unknown";
  return "ready";
};

export const buildAdapterMetadata = ({
  source,
  sourceType,
  asOf,
  dataGroup,
  period,
  collectedAt,
  isDemoData,
  missingFields,
  warnings,
  now,
}: {
  source: string | null;
  sourceType: SourceType;
  asOf: unknown;
  dataGroup: DataGroup;
  period: DataPeriod | null;
  collectedAt?: string | null;
  isDemoData: boolean;
  missingFields: string[];
  warnings: AdapterWarning[];
  now?: Date;
}): {
  metadata: DataSourceMetadata | null;
  readiness: ReadinessStatus;
  warnings: AdapterWarning[];
  errors: AdapterError[];
} => {
  const asOfResult = parseAsOfDate(asOf);
  const stale = checkStaleByDataGroup(asOfResult.value, dataGroup, now);
  const metadataWarnings = [...warnings];

  if (stale.isStale) {
    metadataWarnings.push({
      code: "STALE_DATA",
      message: stale.reason ?? "Data is stale for its group threshold.",
    });
  }

  if (!source) {
    metadataWarnings.push({
      code: "SOURCE_MISSING",
      message: "Source is required before product runtime use.",
      field: "source",
    });
  }

  const metadata: DataSourceMetadata | null = asOfResult.value
    ? {
        source,
        sourceType,
        asOf: asOfResult.value,
        period,
        collectedAt: collectedAt ?? null,
        isDemoData,
        isStale: stale.isStale,
        missingFields,
        warnings: metadataWarnings
          .filter((warning) => ["STALE_DATA", "SOURCE_MISSING", "MISSING_DATA", "DEMO_DATA"].includes(warning.code))
          .map((warning) => ({
            code: warning.code as DataSourceMetadata["warnings"][number]["code"],
            message: warning.message,
            field: warning.field,
          })),
      }
    : null;

  return {
    metadata,
    readiness: combineReadiness([
      asOfResult.readiness,
      stale.isStale ? "needs_review" : "ready",
      source ? "ready" : "insufficient_data",
    ]),
    warnings: metadataWarnings,
    errors: asOfResult.errors,
  };
};

