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
  badgeLabel: string;
  statusCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  requiredFields: string[];
  futureGates: Array<{
    label: string;
    detail: string;
  }>;
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
  parser_or_adapter_design_required: "Thiet ke cach nhan du lieu",
  production_ingestion_blocked_by_default: "Mo ket noi du lieu that",
  schema_design_required: "Thiet ke noi luu tru",
  source_approval_workflow_required: "Kiem tra va duyet nguon",
  ui_readiness_review_required: "Kiem tra hien thi readiness",
  unit_metadata_persistence_required: "Luu metadata don vi",
};

const gateDetails: Record<string, string> = {
  parser_or_adapter_design_required: "Chua co cach nhan du lieu duoc phe duyet.",
  production_ingestion_blocked_by_default: "Mac dinh van dong cho den khi co phase rieng duoc kiem chung.",
  schema_design_required: "Chua co noi luu tru du lieu duoc phe duyet.",
  source_approval_workflow_required: "Can source label, owner, document reference, terms review va review notes.",
  ui_readiness_review_required: "Can review rieng truoc khi dua vao cac module phan tich tiep theo.",
  unit_metadata_persistence_required: "Can khai bao va luu ro don vi truoc khi dung so lieu.",
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
      ? "Trang thai san sang du lieu vi mo"
      : "Trang thai san sang du lieu nganh";
  const vietnameseSubject = domain === "macro" ? "vi mo" : "nganh";

  return {
    domain,
    moduleKey,
    title,
    summary: `Du lieu ${vietnameseSubject} hien o trang thai chuan bi ket noi. Man hinh nay chi cho biet dieu kien can co, chua phai du lieu san xuat.`,
    badgeLabel: "Dang chuan bi",
    statusCards: [
      {
        label: "Nguon va bang chung",
        value: validation.evidenceStatus === "missing" ? "Thieu bang chung" : validation.evidenceStatus,
        detail: "Can nhan nguon, chu so huu, tai lieu tham chieu va ghi chu review truoc khi dung tiep.",
      },
      {
        label: "Don vi du lieu",
        value: validation.unit === "unknown_unit" ? "Can khai bao ro" : validation.unit,
        detail: "Khong doan don vi tu do lon so; thieu don vi thi gia tri se bi chan.",
      },
      {
        label: "Phe duyet nguon",
        value: "productionApproved:false",
        detail: "Nguon mau, thu cong hoac nghien cuu chua duoc duyet lam nguon san xuat.",
      },
      {
        label: "San sang su dung",
        value: validation.readiness === "blocked" ? "Chua san sang" : validation.readiness,
        detail: "Chua du co so de dung cho phan tich tiep theo; du lieu thieu khong duoc thay bang 0.",
      },
    ],
    requiredFields: fields.map((field) => safeFieldLabels[domain][field.id] ?? field.id),
    futureGates: boundary.futurePhaseGates.map((gate) => ({
      label: gateLabels[gate] ?? gate,
      detail: gateDetails[gate] ?? "Can phase rieng truoc khi mo.",
    })),
    boundaryBadges: ["Thieu bang chung nguon", "Can don vi ro", "productionApproved:false"],
    forbiddenCapabilities: {
      dbWrite: false,
      importUploadApi: false,
      parserOrFilesystemRead: false,
      recommendationOrScoring: false,
    },
  };
}
