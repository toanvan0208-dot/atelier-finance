import type { MarketPvtNumericField } from "./market-pvt-unit-metadata-contract";

export type MarketPvtUnitMetadataStorageOptionId =
  | "direct_market_price_columns"
  | "sidecar_table_per_field"
  | "json_metadata_column";

export type MarketPvtUnitMetadataStorageOption = {
  id: MarketPvtUnitMetadataStorageOptionId;
  label: string;
  design: string;
  pros: string[];
  cons: string[];
  migrationRisk: string;
  backwardCompatibility: string;
};

export type MarketPvtUnitMetadataStorageRecommendationContext = {
  marketPriceModelName: string;
  primaryKey: "String" | "Int" | "unknown" | string;
  hasMarketPriceValues: boolean;
  hasMarketCap: boolean;
  hasMetadataJsonField: boolean;
  hasUnitMetadataRelation: boolean;
  relationAndIndexCanBeAddedSafely: boolean;
  needsFieldLevelAudit: boolean;
};

export type MarketPvtSidecarFieldPlan = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  notes: string;
};

export type MarketPvtUnitMetadataStorageRecommendation = {
  recommendedOption: MarketPvtUnitMetadataStorageOption;
  rejectedOptionIds: MarketPvtUnitMetadataStorageOptionId[];
  rationale: string;
  sidecarModelName: "MarketPriceUnitMetadata";
  parentModelName: "MarketPrice";
  unitFields: MarketPvtNumericField[];
  sidecarFields: MarketPvtSidecarFieldPlan[];
  uniqueConstraints: string[];
  indexes: string[];
  migrationImplemented: false;
  schemaChangeImplemented: false;
  dbWriteRequired: false;
  productionApproved: false;
  nextPhaseGate: string;
};

export type MarketPvtUnitMetadataMigrationSafetyChecklistItem = {
  id:
    | "additive_only"
    | "no_schema_change_this_phase"
    | "no_db_write"
    | "no_db_reset"
    | "no_db_seed"
    | "no_drop_delete_update_old_data"
    | "no_backfill_guessing"
    | "relation_optional_for_old_rows"
    | "old_rows_unknown_unit"
    | "invalid_metadata_not_valid"
    | "production_approved_false"
    | "financials_ownership_blocked"
    | "no_new_metrics"
    | "validation_commands_required"
    | "relation_and_unique_index_required"
    | "app_layer_validation_required";
  required: true;
  passed: boolean;
  description: string;
};

export const MARKET_PVT_UNIT_METADATA_STORAGE_OPTIONS: MarketPvtUnitMetadataStorageOption[] = [
  {
    id: "direct_market_price_columns",
    label: "Direct unit columns on MarketPrice",
    design:
      "Add nullable unit/source metadata columns directly to the MarketPrice row for each Market/PVT field.",
    pros: [
      "Simple single-row reads.",
      "No join is needed when rendering a MarketPrice row.",
      "Null columns can preserve old-row compatibility.",
    ],
    cons: [
      "Adds many sparse columns to a market value row.",
      "Field-level status and warnings are less explicit.",
      "It diverges from the existing FinancialStatementUnitMetadata sidecar pattern.",
    ],
    migrationRisk:
      "Additive if only nullable columns are added, but weaker audit quality and future field additions require more table changes.",
    backwardCompatibility: "Old rows can leave columns null and read as unknown_unit.",
  },
  {
    id: "sidecar_table_per_field",
    label: "Sidecar table per MarketPrice field",
    design:
      "Add MarketPriceUnitMetadata keyed by marketPriceId and field, with unit/status/source fields and unique parent-field protection.",
    pros: [
      "Field-level metadata is explicit, queryable, and auditable.",
      "It mirrors the existing FinancialStatementUnitMetadata pattern.",
      "Old MarketPrice rows remain valid without sidecar rows.",
      "Future metadata fields can be added without widening the MarketPrice value table.",
    ],
    cons: [
      "Requires repository joins or a separate read-back query.",
      "Partial sidecar reads must fail closed.",
      "A future implementation phase must add relation and mapping tests.",
    ],
    migrationRisk:
      "Additive CREATE TABLE plus indexes/unique constraints only when implemented in a later phase.",
    backwardCompatibility: "Old rows without sidecars read as unknown_unit for present values.",
  },
  {
    id: "json_metadata_column",
    label: "JSON metadata column on MarketPrice",
    design:
      "Add one nullable unitMetadata JSON payload on the MarketPrice row and validate shape in application code.",
    pros: [
      "Single-row read-back can carry the whole metadata map.",
      "The migration can be small if provider behavior is accepted.",
      "It matches the runtime sidecar shape more closely than direct columns.",
    ],
    cons: [
      "Field-level queryability and constraints are weaker.",
      "Shape validation is entirely application-level.",
      "The current MarketPrice schema does not already use JSON metadata fields.",
    ],
    migrationRisk:
      "Additive as a nullable field, but provider behavior, invalid nested payloads, and queryability must be reviewed.",
    backwardCompatibility: "Old rows can keep null JSON and read as unknown_unit.",
  },
];

export const MARKET_PVT_UNIT_METADATA_FIELDS: MarketPvtNumericField[] = [
  "marketPrice",
  "marketCap",
  "volume",
  "tradingValue",
  "averageTradingValue20d",
];

export const MARKET_PVT_UNIT_METADATA_SIDECAR_FIELDS: MarketPvtSidecarFieldPlan[] = [
  {
    name: "id",
    type: "String @id @default(cuid())",
    required: true,
    notes: "Matches the repo's current string id convention.",
  },
  {
    name: "marketPriceId",
    type: "String",
    required: true,
    notes: "Foreign key to MarketPrice.id.",
  },
  {
    name: "field",
    type: "String",
    required: true,
    notes: "One of the five Market/PVT metadata fields.",
  },
  {
    name: "unit",
    type: "String",
    required: true,
    notes: "Persist only explicit accepted units; missing units need no valid row.",
  },
  {
    name: "status",
    type: "String",
    required: true,
    defaultValue: "ready",
    notes: "Read-back must treat non-ready or incompatible values as fail-closed metadata.",
  },
  {
    name: "source",
    type: "String",
    required: true,
    defaultValue: "market_pvt",
    notes: "Allowed values mirror Market/PVT metadata sources.",
  },
  {
    name: "sourceLabel",
    type: "String?",
    required: false,
    notes: "Carries local/research/source label provenance.",
  },
  {
    name: "dataMode",
    type: "String?",
    required: false,
    notes: "Carries runtime data mode without granting approval.",
  },
  {
    name: "asOf",
    type: "DateTime?",
    required: false,
    notes: "Uses the MarketPrice asOf/trading date context when supplied.",
  },
  {
    name: "warningCodes",
    type: "String @default(\"[]\")",
    required: true,
    defaultValue: "[]",
    notes: "Matches the repo's string-serialized diagnostic pattern.",
  },
  {
    name: "productionApproved",
    type: "Boolean @default(false)",
    required: true,
    defaultValue: "false",
    notes: "Unit metadata never approves local/research/sample data.",
  },
  {
    name: "createdAt",
    type: "DateTime @default(now())",
    required: true,
    notes: "Audit timestamp.",
  },
  {
    name: "updatedAt",
    type: "DateTime @updatedAt",
    required: true,
    notes: "Audit timestamp.",
  },
];

const optionById = (id: MarketPvtUnitMetadataStorageOptionId): MarketPvtUnitMetadataStorageOption =>
  MARKET_PVT_UNIT_METADATA_STORAGE_OPTIONS.find((option) => option.id === id) ??
  MARKET_PVT_UNIT_METADATA_STORAGE_OPTIONS[1];

export const recommendMarketPvtUnitMetadataStorageOption = (
  context: MarketPvtUnitMetadataStorageRecommendationContext,
): MarketPvtUnitMetadataStorageRecommendation => {
  const supportsSidecar =
    context.marketPriceModelName === "MarketPrice" &&
    context.primaryKey === "String" &&
    context.hasMarketPriceValues &&
    context.hasMarketCap &&
    !context.hasUnitMetadataRelation &&
    context.relationAndIndexCanBeAddedSafely;
  const recommendedOptionId: MarketPvtUnitMetadataStorageOptionId =
    supportsSidecar && context.needsFieldLevelAudit ? "sidecar_table_per_field" : "json_metadata_column";

  return {
    dbWriteRequired: false,
    indexes: [
      "@@index([marketPriceId])",
      "@@index([field])",
      "@@index([dataMode])",
    ],
    migrationImplemented: false,
    nextPhaseGate: "Phase 75 must review and apply an additive migration before any Market/PVT metadata DB write.",
    parentModelName: "MarketPrice",
    productionApproved: false,
    rationale:
      recommendedOptionId === "sidecar_table_per_field"
        ? "Use a sidecar table because MarketPrice has no metadata storage today, field-level audit is required, and this mirrors FinancialStatementUnitMetadata."
        : "Use JSON only if sidecar relation safety is not available and a nullable payload field is explicitly approved later.",
    recommendedOption: optionById(recommendedOptionId),
    rejectedOptionIds: MARKET_PVT_UNIT_METADATA_STORAGE_OPTIONS.map((option) => option.id).filter(
      (id) => id !== recommendedOptionId,
    ),
    schemaChangeImplemented: false,
    sidecarFields: MARKET_PVT_UNIT_METADATA_SIDECAR_FIELDS,
    sidecarModelName: "MarketPriceUnitMetadata",
    uniqueConstraints: ["@@unique([marketPriceId, field])"],
    unitFields: MARKET_PVT_UNIT_METADATA_FIELDS,
  };
};

export const buildMarketPvtUnitMetadataMigrationSafetyChecklist = (
  optionId: MarketPvtUnitMetadataStorageOptionId,
): MarketPvtUnitMetadataMigrationSafetyChecklistItem[] => {
  const baseChecklist: MarketPvtUnitMetadataMigrationSafetyChecklistItem[] = [
    {
      description: "Phase 74 is a design review; any future migration must be additive only.",
      id: "additive_only",
      passed: true,
      required: true,
    },
    {
      description: "No schema.prisma change or migration file is created in Phase 74.",
      id: "no_schema_change_this_phase",
      passed: true,
      required: true,
    },
    {
      description: "No DB write is required for the storage design.",
      id: "no_db_write",
      passed: true,
      required: true,
    },
    {
      description: "A database reset is forbidden.",
      id: "no_db_reset",
      passed: true,
      required: true,
    },
    {
      description: "A seed step is forbidden.",
      id: "no_db_seed",
      passed: true,
      required: true,
    },
    {
      description: "The future migration must not drop, delete, or update existing MarketPrice rows.",
      id: "no_drop_delete_update_old_data",
      passed: true,
      required: true,
    },
    {
      description: "No old-row backfill may guess units from numeric magnitude.",
      id: "no_backfill_guessing",
      passed: true,
      required: true,
    },
    {
      description: "New storage must be optional for old MarketPrice rows.",
      id: "relation_optional_for_old_rows",
      passed: true,
      required: true,
    },
    {
      description: "Old rows without sidecar metadata read as unknown_unit for present values.",
      id: "old_rows_unknown_unit",
      passed: true,
      required: true,
    },
    {
      description: "Invalid stored metadata is not treated as valid unit evidence.",
      id: "invalid_metadata_not_valid",
      passed: true,
      required: true,
    },
    {
      description: "Unit metadata keeps productionApproved:false for local/research/sample data.",
      id: "production_approved_false",
      passed: true,
      required: true,
    },
    {
      description: "marketPrice and marketCap remain Market/PVT or persisted-market-bridge owned, not Financials-owned.",
      id: "financials_ownership_blocked",
      passed: true,
      required: true,
    },
    {
      description: "The design adds no valuation metric, target price, fair value, recommendation, or Risk scoring.",
      id: "no_new_metrics",
      passed: true,
      required: true,
    },
    {
      description: "Type-check, Prisma validation, lint, and tests are required before commit.",
      id: "validation_commands_required",
      passed: true,
      required: true,
    },
  ];

  if (optionId === "sidecar_table_per_field") {
    return [
      ...baseChecklist,
      {
        description: "A future sidecar implementation requires MarketPrice relation plus unique marketPrice-field protection.",
        id: "relation_and_unique_index_required",
        passed: true,
        required: true,
      },
    ];
  }

  if (optionId === "json_metadata_column") {
    return [
      ...baseChecklist,
      {
        description: "A JSON payload option requires strict application-level shape validation.",
        id: "app_layer_validation_required",
        passed: true,
        required: true,
      },
    ];
  }

  return baseChecklist;
};
