import { buildFinancialsDataSourceTransparency } from "@/features/financials/lib/financials-data-source-transparency";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildMacroIndustryReadinessUiModel } from "@/features/macro/lib/macro-industry-readiness-ui";
import { buildValuationFinancialsRuntimeReadiness } from "@/features/valuation/lib/valuation-financials-runtime-readiness";

export type OverviewModuleReadinessStatus = "partial" | "blocked" | "boundary_only";
export type OverviewModuleDataMode = "sample" | "research_only" | "local_research" | "manual" | "db_backed" | "unknown";
export type OverviewModuleSourceStatus = "available" | "partial" | "missing" | "not_approved";
export type OverviewModuleUnitStatus = "explicit" | "partial" | "unknown" | "invalid" | "not_applicable";

export type OverviewModuleReadinessItem = {
  moduleKey: "financials" | "valuation" | "technical" | "macro" | "industry";
  label: string;
  status: OverviewModuleReadinessStatus;
  dataMode: OverviewModuleDataMode;
  productionApproved: false;
  sourceStatus: OverviewModuleSourceStatus;
  unitStatus: OverviewModuleUnitStatus;
  summary: string;
  blockedReasons: string[];
  nextChecks: string[];
};

export type OverviewCrossModuleReadinessSummary = {
  title: string;
  description: string;
  productionApprovedLabel: "productionApproved:false";
  items: OverviewModuleReadinessItem[];
  safeNotes: string[];
};

const unique = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const normalizeDataMode = (mode: string | null | undefined): OverviewModuleDataMode => {
  if (
    mode === "sample" ||
    mode === "research_only" ||
    mode === "local_research" ||
    mode === "manual" ||
    mode === "db_backed"
  ) {
    return mode;
  }
  return "unknown";
};

const statusFromBlockedReasons = (blockedReasons: string[], fallback: OverviewModuleReadinessStatus) =>
  blockedReasons.length > 0 ? "blocked" : fallback;

const financialsItem = (financialsRuntimeData?: FinancialsRuntimeData | null): OverviewModuleReadinessItem => {
  if (!financialsRuntimeData) {
    return {
      moduleKey: "financials",
      label: "Financials",
      status: "partial",
      dataMode: "unknown",
      productionApproved: false,
      sourceStatus: "partial",
      unitStatus: "unknown",
      summary: "Financials co transparency/readiness rieng, nhung Overview chua nhan du snapshot runtime trong lan render nay.",
      blockedReasons: ["financials_runtime_snapshot_missing", "productionApproved:false"],
      nextChecks: ["Mo Financials de xem data mode, source/evidence, missing fields va unit metadata."],
    };
  }

  const transparency = buildFinancialsDataSourceTransparency(financialsRuntimeData);

  return {
    moduleKey: "financials",
    label: "Financials",
    status: statusFromBlockedReasons(transparency.blockedReasons, transparency.missingFields.length > 0 ? "partial" : "partial"),
    dataMode: transparency.dataMode,
    productionApproved: false,
    sourceStatus: transparency.sourceEvidenceStatus,
    unitStatus: transparency.unitMetadataStatus,
    summary: "Financials da co transparency/readiness state; local, manual, research hoac sample data van khong duoc phe duyet lam nguon san xuat.",
    blockedReasons: unique([
      ...transparency.missingFields.map((field) => `${field}_missing`),
      ...transparency.blockedReasons,
      "productionApproved:false",
      "missing_values_stay_null_not_zero",
    ]),
    nextChecks: [
      "Kiem tra source/evidence, data mode va missing fields trong Financials.",
      "Kiem tra unit metadata truoc khi dung cho buoc tiep theo.",
    ],
  };
};

const valuationItem = (financialsRuntimeData?: FinancialsRuntimeData | null): OverviewModuleReadinessItem => {
  const readiness = buildValuationFinancialsRuntimeReadiness({ financialsRuntimeData });

  return {
    moduleKey: "valuation",
    label: "Valuation",
    status: "blocked",
    dataMode: normalizeDataMode(readiness.dataMode),
    productionApproved: false,
    sourceStatus: readiness.sourceLabel ? "not_approved" : "partial",
    unitStatus: "partial",
    summary: "Valuation van la boundary rieng; Financials hoac PVT co data khong lam Valuation thanh fully DB-backed.",
    blockedReasons: unique([
      ...readiness.blockedReasons,
      "canClaimValuationDbBacked:false",
      "productionApproved:false",
      "missing_values_stay_null_not_zero",
    ]),
    nextChecks: [
      "Kiem tra EPS, equity/BVPS, market price, shares va unit metadata.",
      "Giu canClaimValuationDbBacked:false cho den khi du boundary rieng.",
    ],
  };
};

const technicalItem = (): OverviewModuleReadinessItem => ({
  moduleKey: "technical",
  label: "Technical/PVT",
  status: "partial",
  dataMode: "sample",
  productionApproved: false,
  sourceStatus: "not_approved",
  unitStatus: "unknown",
  summary: "Technical/PVT hien co source transparency cho gia/volume va issuer metadata, nhung sample/local research khong phai nguon san xuat.",
  blockedReasons: [
    "market_source_not_approved",
    "issuer_metadata_not_verified",
    "unit_metadata_may_be_unknown",
    "productionApproved:false",
  ],
  nextChecks: [
    "Kiem tra price/volume source va issuer metadata trong Technical/PVT.",
    "Kiem tra market unit metadata truoc khi dua sang Valuation.",
  ],
});

const macroIndustryItem = (domain: "macro" | "industry"): OverviewModuleReadinessItem => {
  const readiness = buildMacroIndustryReadinessUiModel(domain);
  const subject = domain === "macro" ? "Macro" : "Industry";

  return {
    moduleKey: domain,
    label: subject,
    status: "boundary_only",
    dataMode: "sample",
    productionApproved: false,
    sourceStatus: "missing",
    unitStatus: "unknown",
    summary: `${subject} dang o trang thai readiness/boundary, chi cho biet dieu kien can co; chua phai du lieu san xuat.`,
    blockedReasons: unique([
      ...readiness.boundaryBadges,
      "source_evidence_missing",
      "explicit_unit_required",
      "missing_values_stay_null_not_zero",
    ]),
    nextChecks: readiness.futureGates.map((gate) => gate.label),
  };
};

export const forbiddenOverviewReadinessPhrases = [
  "recommendation",
  "target price",
  "fair value",
  "risk scoring",
  "upside",
  "downside",
  "production-ready",
  "production-approved",
  "import",
  "upload",
  "api",
  "parser",
  "write",
];

export const buildOverviewCrossModuleReadinessSummary = (
  financialsRuntimeData?: FinancialsRuntimeData | null,
): OverviewCrossModuleReadinessSummary => ({
  title: "Tong quan trang thai du lieu",
  description:
    "Mot so module dang o trang thai kiem tra luong du lieu hoac chuan bi ket noi nguon. Chua duoc duyet lam nguon san xuat.",
  productionApprovedLabel: "productionApproved:false",
  items: [
    financialsItem(financialsRuntimeData),
    valuationItem(financialsRuntimeData),
    technicalItem(),
    macroIndustryItem("macro"),
    macroIndustryItem("industry"),
  ],
  safeNotes: [
    "Thieu nguon, don vi hoac truong du lieu can thiet thi module se o trang thai partial, blocked hoac boundary-only.",
    "Du lieu thieu giu la null/unavailable, khong thay bang 0.",
    "Overview chi tong hop readiness; khong thay the module nguon.",
  ],
});
