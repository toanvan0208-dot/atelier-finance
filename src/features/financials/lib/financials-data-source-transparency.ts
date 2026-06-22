import type { FinancialsRuntimeData } from "./financials-runtime-types";
import {
  financialsUnitContracts,
  type FinancialsFieldUnitMetadata,
  type FinancialsNumericField,
  type FinancialsUnitMetadataMap,
} from "./financials-unit-metadata-contract";

export type FinancialsTransparencyDataMode =
  | "sample"
  | "research_only"
  | "local_research"
  | "manual"
  | "db_backed"
  | "unknown";

export type FinancialsSourceEvidenceStatus = "available" | "partial" | "missing" | "not_approved";
export type FinancialsUnitMetadataReadinessStatus = "explicit" | "partial" | "unknown" | "invalid";
export type FinancialsValuationHandoffStatus =
  | "ready_with_explicit_units"
  | "partial"
  | "blocked"
  | "not_applicable";

export type FinancialsDataSourceTransparency = {
  dataMode: FinancialsTransparencyDataMode;
  productionApproved: boolean;
  sourceLabel: string | null;
  sourceOwner: string | null;
  sourceEvidenceStatus: FinancialsSourceEvidenceStatus;
  unitMetadataStatus: FinancialsUnitMetadataReadinessStatus;
  missingFields: string[];
  blockedReasons: string[];
  valuationHandoffStatus: FinancialsValuationHandoffStatus;
  canClaimFinancialsDbBacked: boolean;
  canClaimValuationDbBacked: boolean;
  uiWarnings: string[];
};

const importantFields = Object.keys(financialsUnitContracts) as FinancialsNumericField[];
const valuationHandoffFields: FinancialsNumericField[] = ["revenue", "netIncome", "equity", "eps", "sharesOutstanding"];

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

const normalizeSourceLabel = (sourceLabel: string | null | undefined): string | null =>
  sourceLabel && sourceLabel.trim().length > 0 ? sourceLabel : null;

const snapshotValue = (runtimeData: FinancialsRuntimeData, field: FinancialsNumericField): number | null => {
  const snapshot = runtimeData.statementSnapshot;
  if (!snapshot) return null;
  if (field === "equity") return snapshot.totalEquity ?? null;
  if (field === "netIncome") return snapshot.netProfit ?? null;
  return snapshot[field] ?? null;
};

const resolveDataMode = (runtimeData: FinancialsRuntimeData): FinancialsTransparencyDataMode => {
  if (runtimeData.runtimeStatus === "db_backed" && runtimeData.source.readPath === "local_db") return "db_backed";
  if (runtimeData.source.readPath === "sample_static" || runtimeData.source.dataMode === "sample") return "sample";
  if (runtimeData.source.dataMode === "manual" || runtimeData.source.dataMode === "user_input") return "manual";
  if (runtimeData.source.readPath === "local_db") return "local_research";
  if (runtimeData.source.dataMode === "research_only") return "research_only";
  return "unknown";
};

const sourceEvidenceStatus = (runtimeData: FinancialsRuntimeData): FinancialsSourceEvidenceStatus => {
  const sourceLabel = normalizeSourceLabel(runtimeData.source.sourceLabel);
  if (!sourceLabel) return "missing";
  if (!runtimeData.source.asOf || !runtimeData.source.fiscalYear || !runtimeData.source.periodType) {
    return "partial";
  }
  if (runtimeData.source.productionApproved === false) return "not_approved";
  return "available";
};

const fieldHasExplicitValidUnit = (metadata: FinancialsFieldUnitMetadata | undefined): boolean =>
  metadata?.status === "explicit" && metadata.unit !== "unknown";

const unitMetadataStatus = (runtimeData: FinancialsRuntimeData): FinancialsUnitMetadataReadinessStatus => {
  const fieldsWithValues = importantFields.filter((field) => snapshotValue(runtimeData, field) !== null);
  if (fieldsWithValues.length === 0) return "unknown";

  const metadataForValues = fieldsWithValues.map((field) => runtimeData.unitMetadata[field]);
  if (metadataForValues.some((metadata) => metadata?.status === "invalid_unit")) return "invalid";
  if (metadataForValues.every(fieldHasExplicitValidUnit)) return "explicit";
  if (metadataForValues.some(fieldHasExplicitValidUnit)) return "partial";
  return "unknown";
};

const missingImportantFields = (runtimeData: FinancialsRuntimeData): string[] => {
  const fromQuality = runtimeData.dataQuality.missingFields;
  const fromSnapshot = importantFields.filter((field) => snapshotValue(runtimeData, field) === null);
  return unique([...fromQuality, ...fromSnapshot]).sort();
};

const unitBlockedReasons = (
  runtimeData: FinancialsRuntimeData,
  metadata: FinancialsUnitMetadataMap,
): string[] =>
  importantFields.flatMap((field) => {
    if (snapshotValue(runtimeData, field) === null) return [];

    const fieldMetadata = metadata[field];
    if (fieldMetadata.status === "invalid_unit") return [`${field}_unit_invalid`];
    if (fieldMetadata.status === "unknown_unit") return [`${field}_unit_unknown`];
    return [];
  });

const valuationHandoffStatus = (
  runtimeData: FinancialsRuntimeData,
  metadataStatus: FinancialsUnitMetadataReadinessStatus,
): FinancialsValuationHandoffStatus => {
  const hasSnapshot = Boolean(runtimeData.statementSnapshot);
  if (!hasSnapshot) return "not_applicable";
  if (metadataStatus === "invalid" || metadataStatus === "unknown") return "blocked";

  const availableValuationFields = valuationHandoffFields.filter((field) => snapshotValue(runtimeData, field) !== null);
  if (availableValuationFields.length === 0) return "not_applicable";

  const allAvailableFieldsHaveExplicitUnits = availableValuationFields.every((field) =>
    fieldHasExplicitValidUnit(runtimeData.unitMetadata[field]),
  );

  if (allAvailableFieldsHaveExplicitUnits && runtimeData.dataQuality.status === "available") {
    return "ready_with_explicit_units";
  }

  return allAvailableFieldsHaveExplicitUnits ? "partial" : "blocked";
};

const valuationBlockedReasons = (
  runtimeData: FinancialsRuntimeData,
  handoffStatus: FinancialsValuationHandoffStatus,
): string[] => {
  if (handoffStatus === "ready_with_explicit_units" || handoffStatus === "not_applicable") return [];
  if (!runtimeData.statementSnapshot) return ["statement_snapshot_unavailable"];

  return valuationHandoffFields.flatMap((field) => {
    if (snapshotValue(runtimeData, field) === null) return [`${field}_missing_for_valuation_handoff`];
    if (!fieldHasExplicitValidUnit(runtimeData.unitMetadata[field])) return [`${field}_explicit_unit_required`];
    return [];
  });
};

export const forbiddenFinancialsTransparencyUiWarningPhrases = [
  "recommendation",
  "target price",
  "fair value",
  "dcf",
  "ev/ebitda",
  "trading signal",
  "risk scoring",
  "upside",
  "downside",
  "production-ready",
  "production-approved",
];

const buildUiWarnings = (transparency: Omit<FinancialsDataSourceTransparency, "uiWarnings">): string[] => {
  const warnings = [
    transparency.productionApproved
      ? "Nguon co co duyet rieng; van can kiem tra pham vi hien thi."
      : "productionApproved:false - chi xem la nguon nghien cuu, local, manual, hoac sample.",
    transparency.canClaimFinancialsDbBacked
      ? "Financials dang doc qua local DB boundary."
      : "Financials chua co local DB boundary kha dung.",
    "Valuation giu canClaimValuationDbBacked:false cho den khi co boundary rieng.",
    "Du lieu thieu giu la null/unavailable, khong thay bang 0.",
  ];

  return warnings.filter((warning) => {
    const lower = warning.toLowerCase();
    return forbiddenFinancialsTransparencyUiWarningPhrases.every((phrase) => !lower.includes(phrase));
  });
};

export const buildFinancialsDataSourceTransparency = (
  runtimeData: FinancialsRuntimeData,
): FinancialsDataSourceTransparency => {
  const dataMode = resolveDataMode(runtimeData);
  const sourceLabel = normalizeSourceLabel(runtimeData.source.sourceLabel);
  const unitStatus = unitMetadataStatus(runtimeData);
  const missingFields = missingImportantFields(runtimeData);
  const handoffStatus = valuationHandoffStatus(runtimeData, unitStatus);
  const canClaimFinancialsDbBacked = runtimeData.runtimeStatus === "db_backed" && runtimeData.source.readPath === "local_db";
  const base = {
    dataMode,
    productionApproved: runtimeData.source.productionApproved,
    sourceLabel,
    sourceOwner: runtimeData.source.readPath,
    sourceEvidenceStatus: sourceEvidenceStatus(runtimeData),
    unitMetadataStatus: unitStatus,
    missingFields,
    blockedReasons: unique([
      ...unitBlockedReasons(runtimeData, runtimeData.unitMetadata),
      ...valuationBlockedReasons(runtimeData, handoffStatus),
      ...(runtimeData.dataQuality.errors.length > 0 ? ["financials_runtime_read_error"] : []),
    ]).sort(),
    valuationHandoffStatus: handoffStatus,
    canClaimFinancialsDbBacked,
    canClaimValuationDbBacked: false,
  };

  return {
    ...base,
    uiWarnings: buildUiWarnings(base),
  };
};
