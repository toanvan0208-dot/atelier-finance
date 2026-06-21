export type FinancialsUnitMetadataStorageOptionId =
  | "json_field"
  | "sidecar_table"
  | "deferred_payload_only";

export type FinancialsUnitMetadataStorageOption = {
  id: FinancialsUnitMetadataStorageOptionId;
  label: string;
  design: string;
  pros: string[];
  cons: string[];
  risks: string[];
};

export type FinancialsUnitMetadataStorageRecommendationContext = {
  provider: "sqlite" | "postgresql" | "mysql" | "unknown" | string;
  jsonStorageSupported?: boolean;
  metadataFieldPatternAccepted?: boolean;
  needsFieldLevelTrace?: boolean;
  relationAndIndexCanBeAddedSafely?: boolean;
  schemaContextSufficient?: boolean;
};

export type FinancialsUnitMetadataStorageRecommendation = {
  recommendedOption: FinancialsUnitMetadataStorageOption;
  rationale: string;
  rejectedOptionIds: FinancialsUnitMetadataStorageOptionId[];
  migrationApplied: false;
  dbWriteRequired: false;
  productionApproved: false;
  nextPhaseGate: string;
};

export type FinancialsUnitMetadataMigrationSafetyChecklistItem = {
  id:
    | "additive_only"
    | "backward_compatible_old_rows"
    | "no_destructive_change"
    | "no_db_reset"
    | "no_db_seed"
    | "nullable_or_optional_storage"
    | "old_rows_unknown_unit"
    | "invalid_metadata_not_valid"
    | "production_approved_false"
    | "no_metric_ready_without_explicit_units"
    | "rollback_plan_documented"
    | "validation_commands_listed"
    | "relation_and_unique_index_required"
    | "app_layer_validation_required"
    | "no_persistence_implemented";
  required: true;
  passed: boolean;
  description: string;
};

const optionById = (id: FinancialsUnitMetadataStorageOptionId): FinancialsUnitMetadataStorageOption =>
  FINANCIALS_UNIT_METADATA_STORAGE_OPTIONS.find((option) => option.id === id) ??
  FINANCIALS_UNIT_METADATA_STORAGE_OPTIONS[2];

export const FINANCIALS_UNIT_METADATA_STORAGE_OPTIONS: FinancialsUnitMetadataStorageOption[] = [
  {
    id: "json_field",
    label: "JSON field on financial statement row",
    design: "Add one optional metadata field on the statement row and validate the shape in application code.",
    pros: [
      "Single-row read-back is simple.",
      "The change can be additive when provider support and repository patterns are already clear.",
      "It keeps import payload mapping close to the existing statement record.",
    ],
    cons: [
      "Field-level query and constraint behavior is weaker than a related table.",
      "Shape validation stays in application code.",
      "It is less aligned with a schema that currently stores array-like diagnostics as strings.",
    ],
    risks: [
      "Provider or migration behavior must be checked before implementation.",
      "Invalid nested metadata must never unlock derived calculations.",
    ],
  },
  {
    id: "sidecar_table",
    label: "Sidecar table for statement field units",
    design:
      "Add a related table keyed by statement id and financial field, with explicit unit, status, source, and warning fields.",
    pros: [
      "Field-level records are explicit and queryable.",
      "Relation, unique key, and indexes can protect one unit row per field.",
      "String fields can avoid relying on provider-specific JSON behavior.",
    ],
    cons: [
      "It requires more repository mapping than a row-level field.",
      "It adds relation and index migration work.",
      "It is heavier than the current runtime sidecar handoff.",
    ],
    risks: [
      "Repository reads must avoid partial sidecar joins being treated as valid.",
      "The migration must stay additive and preserve old statement rows.",
    ],
  },
  {
    id: "deferred_payload_only",
    label: "Deferred payload-only boundary",
    design:
      "Keep unit metadata in import/runtime payloads until schema context or approval is sufficient for a later migration.",
    pros: [
      "No schema risk in the current phase.",
      "No database write path is required.",
      "Existing rows keep conservative unknown-unit behavior.",
    ],
    cons: [
      "Metadata does not survive a database write/read-back path.",
      "DB-backed runtime can still have unknown units for scale-sensitive fields.",
      "The pipeline remains short of durable field-level metadata.",
    ],
    risks: [
      "End-to-end persistence remains blocked until a later phase.",
      "Runtime callers must keep treating missing sidecars conservatively.",
    ],
  },
];

export const recommendFinancialsUnitMetadataStorageOption = (
  context: FinancialsUnitMetadataStorageRecommendationContext,
): FinancialsUnitMetadataStorageRecommendation => {
  const schemaContextSufficient = context.schemaContextSufficient === true;
  const jsonStorageSupported = context.jsonStorageSupported === true;
  const metadataFieldPatternAccepted = context.metadataFieldPatternAccepted === true;
  const needsFieldLevelTrace = context.needsFieldLevelTrace === true;
  const relationAndIndexCanBeAddedSafely = context.relationAndIndexCanBeAddedSafely === true;

  let recommendedOptionId: FinancialsUnitMetadataStorageOptionId = "deferred_payload_only";
  let rationale =
    "Defer persistence when schema context is insufficient or neither a safe field nor a safe relation is confirmed.";

  if (schemaContextSufficient && jsonStorageSupported && metadataFieldPatternAccepted && !needsFieldLevelTrace) {
    recommendedOptionId = "json_field";
    rationale =
      "Use a JSON field only when provider behavior is confirmed and the repository already accepts row-level metadata fields.";
  } else if (schemaContextSufficient && relationAndIndexCanBeAddedSafely) {
    recommendedOptionId = "sidecar_table";
    rationale =
      "Use a sidecar table when field-level trace is required or row-level JSON storage is not a clear repository pattern.";
  }

  return {
    dbWriteRequired: false,
    migrationApplied: false,
    nextPhaseGate: "Human approval plus additive migration review before Phase 68 implementation.",
    productionApproved: false,
    rationale,
    recommendedOption: optionById(recommendedOptionId),
    rejectedOptionIds: FINANCIALS_UNIT_METADATA_STORAGE_OPTIONS.map((option) => option.id).filter(
      (id) => id !== recommendedOptionId,
    ),
  };
};

export const buildFinancialsUnitMetadataMigrationSafetyChecklist = (
  optionId: FinancialsUnitMetadataStorageOptionId,
): FinancialsUnitMetadataMigrationSafetyChecklistItem[] => {
  const baseChecklist: FinancialsUnitMetadataMigrationSafetyChecklistItem[] = [
    {
      description: "Any future schema change must add storage without changing or deleting existing statement data.",
      id: "additive_only",
      passed: true,
      required: true,
    },
    {
      description: "Existing statement rows without unit metadata must remain readable.",
      id: "backward_compatible_old_rows",
      passed: true,
      required: true,
    },
    {
      description: "The reviewed plan does not drop tables, drop columns, or rewrite historical values.",
      id: "no_destructive_change",
      passed: true,
      required: true,
    },
    {
      description: "A database reset is not part of the storage plan.",
      id: "no_db_reset",
      passed: true,
      required: true,
    },
    {
      description: "A seed step is not required for old or new statement rows.",
      id: "no_db_seed",
      passed: true,
      required: true,
    },
    {
      description: "New storage must be nullable, optional, or relation-optional for old rows.",
      id: "nullable_or_optional_storage",
      passed: true,
      required: true,
    },
    {
      description: "Old rows without explicit persisted units read as unknown_unit for present scale-sensitive values.",
      id: "old_rows_unknown_unit",
      passed: true,
      required: true,
    },
    {
      description: "Invalid persisted metadata is ignored and surfaced as invalid metadata, not treated as valid input.",
      id: "invalid_metadata_not_valid",
      passed: true,
      required: true,
    },
    {
      description: "Local and research-only rows keep productionApproved:false.",
      id: "production_approved_false",
      passed: true,
      required: true,
    },
    {
      description: "No derived metric becomes ready unless explicit units and required market inputs are present.",
      id: "no_metric_ready_without_explicit_units",
      passed: true,
      required: true,
    },
    {
      description: "Rollback notes must be documented before any migration is applied.",
      id: "rollback_plan_documented",
      passed: true,
      required: true,
    },
    {
      description: "Type-check, Prisma validation, lint, and unit tests must be listed and run before commit.",
      id: "validation_commands_listed",
      passed: true,
      required: true,
    },
  ];

  if (optionId === "sidecar_table") {
    return [
      ...baseChecklist,
      {
        description: "The sidecar table requires a statement relation plus unique statement-field protection.",
        id: "relation_and_unique_index_required",
        passed: true,
        required: true,
      },
    ];
  }

  if (optionId === "json_field") {
    return [
      ...baseChecklist,
      {
        description: "A JSON field requires application-level shape validation before read-back use.",
        id: "app_layer_validation_required",
        passed: true,
        required: true,
      },
    ];
  }

  return [
    ...baseChecklist,
    {
      description: "The deferred option records no durable persistence implementation in this phase.",
      id: "no_persistence_implemented",
      passed: true,
      required: true,
    },
  ];
};
