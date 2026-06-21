import {
  buildMacroIndustryDataBoundary,
  validateMacroIndustryBoundaryInput,
  type MacroIndustryDomain,
} from "./macro-industry-data-boundary";

export type MacroIndustryReadinessUiModel = {
  domain: MacroIndustryDomain;
  moduleKey: "macro" | "industry";
  title: string;
  summary: string;
  statusCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  requiredFields: string[];
  futureGates: string[];
  boundaryBadges: string[];
  forbiddenCapabilities: {
    importUploadApi: false;
    dbWrite: false;
    parserOrFilesystemRead: false;
    recommendationOrScoring: false;
  };
};

const safeFieldLabels: Record<MacroIndustryDomain, Record<string, string>> = {
  macro: {
    creditGrowth: "Credit growth",
    exchangeRate: "Exchange rate",
    gdpGrowth: "GDP growth",
    inflation: "Inflation",
    moneySupplyGrowth: "Money supply growth",
    pmi: "PMI",
    policyRate: "Policy rate",
    unemploymentRate: "Unemployment rate",
  },
  industry: {
    exportValue: "Export value",
    grossMargin: "Gross margin",
    importValue: "Import value",
    industryCode: "Industry code",
    industryName: "Industry name",
    inventoryGrowth: "Inventory growth",
    profitGrowth: "Profit growth",
    revenueGrowth: "Revenue growth",
    sectorIndexChange: "Sector index change",
    sectorIndexLevel: "Sector index level",
  },
};

const gateLabels: Record<string, string> = {
  parser_or_adapter_design_required: "Parser/adapter design gate",
  production_ingestion_blocked_by_default: "Production ingestion gate",
  schema_design_required: "Schema design gate",
  source_approval_workflow_required: "Source approval workflow gate",
  ui_readiness_review_required: "UI readiness review gate",
  unit_metadata_persistence_required: "Unit metadata persistence gate",
};

export function buildMacroIndustryReadinessUiModel(
  domain: MacroIndustryDomain,
): MacroIndustryReadinessUiModel {
  const boundary = buildMacroIndustryDataBoundary();
  const validation = validateMacroIndustryBoundaryInput({
    asOf: null,
    dataMode: "sample",
    domain,
    fieldId: domain === "macro" ? "inflation" : "revenueGrowth",
    period: null,
    productionApproved: false,
    sourceEvidence: null,
    unit: null,
    value: null,
  });

  const fields = domain === "macro" ? boundary.macroSupportedFields : boundary.industrySupportedFields;
  const moduleKey = domain === "macro" ? "macro" : "industry";
  const title =
    domain === "macro"
      ? "Macro data readiness boundary"
      : "Industry data readiness boundary";
  const vietnameseSubject = domain === "macro" ? "vi mo" : "nganh";

  return {
    domain,
    moduleKey,
    title,
    summary: `Du lieu ${vietnameseSubject}: chua ket noi nguon san xuat; dang o trang thai boundary skeleton.`,
    statusCards: [
      {
        label: "Source/evidence status",
        value: validation.evidenceStatus,
        detail: "Thieu hoac mot phan; can source label, owner, document reference va review notes.",
      },
      {
        label: "Unit metadata",
        value: validation.unit,
        detail: "Don vi du lieu can khai bao ro; khong doan don vi tu do lon so.",
      },
      {
        label: "Production approval",
        value: "productionApproved:false",
        detail: "Local/research/manual/sample context chua duoc phe duyet nguon.",
      },
      {
        label: "Readiness",
        value: validation.readiness,
        detail: "Chua du co so de dung cho phan tich tiep theo.",
      },
    ],
    requiredFields: fields.map((field) => safeFieldLabels[domain][field.id] ?? field.id),
    futureGates: boundary.futurePhaseGates.map((gate) => gateLabels[gate] ?? gate),
    boundaryBadges: ["missingSourceEvidence", "explicitUnitRequired", "productionApproved:false"],
    forbiddenCapabilities: {
      dbWrite: false,
      importUploadApi: false,
      parserOrFilesystemRead: false,
      recommendationOrScoring: false,
    },
  };
}
