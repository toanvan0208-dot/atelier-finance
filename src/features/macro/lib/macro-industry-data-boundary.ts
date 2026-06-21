export type MacroIndustryDomain = "macro" | "industry";

export type MacroIndustryUnit = "percent" | "basis_points" | "vnd_per_usd" | "index_points" | "ratio";

export type MacroIndustryDataMode =
  | "local_db_research"
  | "research_only"
  | "manual"
  | "sample"
  | "synthetic"
  | "future_db_backed";

export type MacroIndustryReadinessState = "ready_for_boundary_review" | "partial" | "blocked";

export type MacroIndustryEvidenceStatus = "complete_for_boundary" | "partial" | "missing" | "not_approved";

export type MacroIndustryBlockedReason =
  | "unknown_field"
  | "missing_value"
  | "explicit_unit_required"
  | "invalid_unit"
  | "magnitude_guessing_forbidden"
  | "missing_period"
  | "missing_as_of"
  | "missing_source_label"
  | "missing_source_owner"
  | "source_evidence_missing"
  | "source_evidence_partial"
  | "source_not_approved"
  | "production_approval_not_allowed_for_data_mode"
  | "future_db_backed_not_source_approved";

export type MacroIndustryFieldDefinition = {
  id: string;
  label: string;
  domain: MacroIndustryDomain;
  unitSensitive: boolean;
  acceptedUnits: readonly MacroIndustryUnit[];
};

export type MacroIndustrySourceEvidence = {
  sourceLabel?: string | null;
  sourceOwner?: string | null;
  documentReference?: string | null;
  termsReviewed?: boolean;
  runtimeDisplayApproved?: boolean;
  storageApproved?: boolean;
  reviewNotes?: string | null;
};

export type MacroIndustryBoundaryInput = {
  domain: MacroIndustryDomain;
  fieldId: string;
  value: number | string | null;
  unit?: MacroIndustryUnit | "unknown_unit" | string | null;
  period?: string | null;
  asOf?: string | null;
  dataMode: MacroIndustryDataMode;
  productionApproved: boolean;
  sourceEvidence?: MacroIndustrySourceEvidence | null;
  allowMagnitudeGuessing?: boolean;
};

export type MacroIndustryValidationResult = {
  domain: MacroIndustryDomain;
  fieldId: string;
  value: number | string | null;
  unit: MacroIndustryUnit | "unknown_unit" | "not_unit_sensitive";
  readiness: MacroIndustryReadinessState;
  evidenceStatus: MacroIndustryEvidenceStatus;
  productionApproved: false;
  blockedReasons: MacroIndustryBlockedReason[];
  warnings: string[];
};

export type MacroIndustryReadinessChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  defaultState: "blocked_until_future_phase" | "required_for_boundary_review";
};

const acceptedUnits = ["percent", "basis_points", "vnd_per_usd", "index_points", "ratio"] as const;

const macroSupportedFields = [
  { id: "gdpGrowth", label: "GDP growth", domain: "macro", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "inflation", label: "Inflation", domain: "macro", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "policyRate", label: "Policy rate", domain: "macro", unitSensitive: true, acceptedUnits: ["percent", "basis_points"] },
  { id: "exchangeRate", label: "Exchange rate", domain: "macro", unitSensitive: true, acceptedUnits: ["vnd_per_usd"] },
  { id: "creditGrowth", label: "Credit growth", domain: "macro", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "moneySupplyGrowth", label: "Money supply growth", domain: "macro", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "unemploymentRate", label: "Unemployment rate", domain: "macro", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "pmi", label: "PMI", domain: "macro", unitSensitive: true, acceptedUnits: ["index_points"] },
] as const satisfies readonly MacroIndustryFieldDefinition[];

const industrySupportedFields = [
  { id: "industryCode", label: "Industry code", domain: "industry", unitSensitive: false, acceptedUnits: [] },
  { id: "industryName", label: "Industry name", domain: "industry", unitSensitive: false, acceptedUnits: [] },
  { id: "revenueGrowth", label: "Revenue growth", domain: "industry", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "profitGrowth", label: "Profit growth", domain: "industry", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "grossMargin", label: "Gross margin", domain: "industry", unitSensitive: true, acceptedUnits: ["percent", "ratio"] },
  { id: "inventoryGrowth", label: "Inventory growth", domain: "industry", unitSensitive: true, acceptedUnits: ["percent"] },
  { id: "exportValue", label: "Export value", domain: "industry", unitSensitive: true, acceptedUnits: ["ratio"] },
  { id: "importValue", label: "Import value", domain: "industry", unitSensitive: true, acceptedUnits: ["ratio"] },
  { id: "sectorIndexLevel", label: "Sector index level", domain: "industry", unitSensitive: true, acceptedUnits: ["index_points"] },
  { id: "sectorIndexChange", label: "Sector index change", domain: "industry", unitSensitive: true, acceptedUnits: ["percent"] },
] as const satisfies readonly MacroIndustryFieldDefinition[];

const localOrResearchModes = new Set<MacroIndustryDataMode>([
  "local_db_research",
  "research_only",
  "manual",
  "sample",
  "synthetic",
  "future_db_backed",
]);

const futurePhaseGates = [
  "source_approval_workflow_required",
  "schema_design_required",
  "parser_or_adapter_design_required",
  "unit_metadata_persistence_required",
  "ui_readiness_review_required",
  "production_ingestion_blocked_by_default",
] as const;

export function getMacroSupportedFields(): readonly MacroIndustryFieldDefinition[] {
  return macroSupportedFields;
}

export function getIndustrySupportedFields(): readonly MacroIndustryFieldDefinition[] {
  return industrySupportedFields;
}

export function getMacroIndustryBlockedReasons(input: MacroIndustryBoundaryInput): MacroIndustryBlockedReason[] {
  return validateMacroIndustryBoundaryInput(input).blockedReasons;
}

export function buildMacroIndustryReadinessChecklist(): readonly MacroIndustryReadinessChecklistItem[] {
  return [
    {
      id: "explicit_units",
      label: "Explicit unit metadata is required for unit-sensitive Macro/Industry fields.",
      required: true,
      defaultState: "required_for_boundary_review",
    },
    {
      id: "source_evidence",
      label: "Source label, source owner, document reference, and review metadata must be present.",
      required: true,
      defaultState: "required_for_boundary_review",
    },
    {
      id: "missing_values",
      label: "Missing values remain null/unavailable and must never be converted to zero.",
      required: true,
      defaultState: "required_for_boundary_review",
    },
    {
      id: "future_ingestion",
      label: "Real import, parser, API, DB write, schema, and browser UI integration remain blocked by default.",
      required: true,
      defaultState: "blocked_until_future_phase",
    },
  ];
}

export function buildMacroIndustryDataBoundary() {
  return {
    macroSupportedFields,
    industrySupportedFields,
    acceptedUnits,
    requiredSourceEvidence: [
      "sourceLabel",
      "sourceOwner",
      "documentReference",
      "termsReviewed",
      "runtimeDisplayApproved",
      "storageApproved",
      "reviewNotes",
    ] as const,
    readinessStates: ["ready_for_boundary_review", "partial", "blocked"] as const,
    futurePhaseGates,
    checklist: buildMacroIndustryReadinessChecklist(),
    forbiddenCapabilitiesExposed: false,
    ioCapabilities: {
      readsFiles: false,
      writesFiles: false,
      writesDatabase: false,
      callsApis: false,
      fetchesData: false,
      importsRealData: false,
      exposesUploadEndpoint: false,
    },
  };
}

export function validateMacroIndustryBoundaryInput(
  input: MacroIndustryBoundaryInput,
): MacroIndustryValidationResult {
  const field = findField(input.domain, input.fieldId);
  const blockedReasons: MacroIndustryBlockedReason[] = [];

  if (!field) blockedReasons.push("unknown_field");
  if (input.value === null) blockedReasons.push("missing_value");
  if (!input.period) blockedReasons.push("missing_period");
  if (!input.asOf) blockedReasons.push("missing_as_of");
  if (input.allowMagnitudeGuessing) blockedReasons.push("magnitude_guessing_forbidden");

  const unit = resolveUnit(field, input.unit, blockedReasons);
  const evidenceStatus = resolveEvidenceStatus(input, blockedReasons);

  if (localOrResearchModes.has(input.dataMode) && input.productionApproved) {
    blockedReasons.push("production_approval_not_allowed_for_data_mode");
  }

  if (input.dataMode === "future_db_backed") {
    blockedReasons.push("future_db_backed_not_source_approved");
  }

  const readiness = resolveReadiness(blockedReasons, evidenceStatus);
  const warnings = buildWarnings(blockedReasons, input.dataMode);

  return {
    domain: input.domain,
    fieldId: input.fieldId,
    value: input.value,
    unit,
    readiness,
    evidenceStatus,
    productionApproved: false,
    blockedReasons,
    warnings,
  };
}

function findField(domain: MacroIndustryDomain, fieldId: string) {
  const fields = domain === "macro" ? macroSupportedFields : industrySupportedFields;
  return fields.find((field) => field.id === fieldId);
}

function resolveUnit(
  field: MacroIndustryFieldDefinition | undefined,
  unit: MacroIndustryBoundaryInput["unit"],
  blockedReasons: MacroIndustryBlockedReason[],
): MacroIndustryValidationResult["unit"] {
  if (!field) return "unknown_unit";
  if (!field.unitSensitive) return "not_unit_sensitive";
  if (!unit) {
    blockedReasons.push("explicit_unit_required");
    return "unknown_unit";
  }
  if (!field.acceptedUnits.includes(unit as MacroIndustryUnit)) {
    blockedReasons.push("invalid_unit");
    return "unknown_unit";
  }
  return unit as MacroIndustryUnit;
}

function resolveEvidenceStatus(
  input: MacroIndustryBoundaryInput,
  blockedReasons: MacroIndustryBlockedReason[],
): MacroIndustryEvidenceStatus {
  const evidence = input.sourceEvidence;
  if (!evidence) {
    blockedReasons.push("source_evidence_missing");
    return "missing";
  }

  if (!evidence.sourceLabel) blockedReasons.push("missing_source_label");
  if (!evidence.sourceOwner) blockedReasons.push("missing_source_owner");

  const hasRequiredReview =
    Boolean(evidence.documentReference) &&
    evidence.termsReviewed === true &&
    evidence.runtimeDisplayApproved === true &&
    evidence.storageApproved === true &&
    Boolean(evidence.reviewNotes);

  if (!hasRequiredReview) {
    blockedReasons.push("source_evidence_partial");
    return "partial";
  }

  if (!input.productionApproved) {
    blockedReasons.push("source_not_approved");
    return "not_approved";
  }

  return "complete_for_boundary";
}

function resolveReadiness(
  blockedReasons: MacroIndustryBlockedReason[],
  evidenceStatus: MacroIndustryEvidenceStatus,
): MacroIndustryReadinessState {
  const hardBlocks = blockedReasons.filter((reason) => reason !== "source_not_approved");
  if (hardBlocks.length > 0) return "blocked";
  if (evidenceStatus !== "complete_for_boundary") return "partial";
  return "ready_for_boundary_review";
}

function buildWarnings(blockedReasons: MacroIndustryBlockedReason[], dataMode: MacroIndustryDataMode): string[] {
  const warnings = blockedReasons.map((reason) => `macro_industry_boundary:${reason}`);
  if (localOrResearchModes.has(dataMode)) {
    warnings.push("productionApproved:false");
  }
  return warnings;
}
