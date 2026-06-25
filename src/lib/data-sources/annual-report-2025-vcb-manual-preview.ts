export const VCB_PDF_FILE = "VCB_Annual_Report_2025.pdf";
export const VCB_SOURCE_LABEL = "annual_report_2025_pdf_reviewed_preview";

export type VcbEntityStatus =
  | "valid_vcb_consolidated"
  | "needs_review"
  | "invalid_for_vcb";

export type VcbPreviewStatus =
  | "preview"
  | "needs_review"
  | "ambiguous"
  | "missing"
  | "invalid_for_vcb";

export type VcbDebtMappingStatus =
  | "needs_bank_mapping"
  | "bank_specific_debt_not_applicable";

export type VcbIdentityEvidence = {
  companyName: string | null;
  ticker: string | null;
  reportTitle: string | null;
  consolidatedTitle: string | null;
  auditor: string | null;
  consolidatedGroupLevel: boolean;
  status: VcbEntityStatus;
  annualReportStatus: string;
  auditStatus: string;
  consolidatedScopeStatus: string;
  evidence: Array<{
    pdfPage: number;
    reportPages: string;
    section: string;
    note: string;
  }>;
};

export type VcbFieldPreview = {
  ticker: "VCB";
  pdfFile: string;
  field: "eps" | "sharesOutstanding" | "totalDebt";
  value: number | null;
  unit: string | null;
  fiscalYear: 2025;
  sourceLabel: string;
  dataMode: "research_only";
  productionApproved: false;
  status: VcbPreviewStatus;
  pdfPage: number | null;
  reportPages: string | null;
  tableOrSection: string | null;
  fieldLabel: string | null;
  extractionMethod: "manual_visual_review" | "not_found" | "not_applicable";
  evidenceNote: string;
  caveat: string | null;
  debtMappingStatus?: VcbDebtMappingStatus;
};

const REQUIRED_VCB_COMPANY_NAME = "Ngân hàng TMCP Ngoại thương Việt Nam";

export function evaluateVcbIdentity(input: {
  companyName?: string | null;
  ticker?: string | null;
  reportTitle?: string | null;
  consolidatedTitle?: string | null;
  auditor?: string | null;
}): VcbIdentityEvidence {
  const companyName = input.companyName?.toLocaleLowerCase("vi") ?? "";
  const consolidatedTitle = input.consolidatedTitle?.toLocaleLowerCase("vi") ?? "";
  const ticker = input.ticker?.trim().toUpperCase() ?? "";
  const auditor = input.auditor?.toLocaleLowerCase("vi") ?? "";
  const reportTitle = input.reportTitle?.toLocaleLowerCase("vi") ?? "";

  const isVcb =
    companyName.includes("ngoại thương") ||
    companyName.includes("vietcombank");
  const isConsolidated =
    consolidatedTitle.includes("hợp nhất");
  const hasVcbTicker = ticker === "VCB";
  const hasAuditor = auditor.includes("kpmg") || auditor.includes("pwc") || auditor.includes("ey") || auditor.includes("deloitte");
  const isAnnualReport = reportTitle.includes("báo cáo thường niên") || reportTitle.includes("báo cáo tài chính");

  const valid = isVcb && isConsolidated && hasVcbTicker && hasAuditor && isAnnualReport;

  return {
    companyName: input.companyName ?? null,
    ticker: input.ticker ?? null,
    reportTitle: input.reportTitle ?? null,
    consolidatedTitle: input.consolidatedTitle ?? null,
    auditor: input.auditor ?? null,
    consolidatedGroupLevel: isConsolidated,
    status: valid ? "valid_vcb_consolidated" : "needs_review",
    annualReportStatus: isAnnualReport ? "confirmed" : "needs_review",
    auditStatus: hasAuditor ? "audited" : "needs_review",
    consolidatedScopeStatus: isConsolidated ? "consolidated" : "needs_review",
    evidence: [
      {
        pdfPage: 1,
        reportPages: "1",
        section: "Cover",
        note: "VCB Annual Report 2025",
      }
    ],
  };
}

export function buildVcbIdentityEvidence(): VcbIdentityEvidence {
  return evaluateVcbIdentity({
    companyName: REQUIRED_VCB_COMPANY_NAME,
    ticker: "VCB",
    reportTitle: "Báo cáo Thường niên 2025",
    consolidatedTitle: "Báo cáo tài chính hợp nhất",
    auditor: "KPMG",
  });
}

export function buildVcbPreview(
  identity = buildVcbIdentityEvidence(),
): VcbFieldPreview[] {
  if (identity.status !== "valid_vcb_consolidated") {
    return [];
  }

  return [
    {
      ticker: "VCB",
      pdfFile: VCB_PDF_FILE,
      field: "eps",
      value: null,
      unit: "vnd_per_share",
      fiscalYear: 2025,
      sourceLabel: VCB_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "needs_review",
      pdfPage: null,
      reportPages: null,
      tableOrSection: null,
      fieldLabel: "Lãi cơ bản trên cổ phiếu",
      extractionMethod: "not_found",
      evidenceNote: "Requires visual confirmation from audited statements.",
      caveat: "Set to null pending review.",
    },
    {
      ticker: "VCB",
      pdfFile: VCB_PDF_FILE,
      field: "sharesOutstanding",
      value: null,
      unit: "shares",
      fiscalYear: 2025,
      sourceLabel: VCB_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "needs_review",
      pdfPage: null,
      reportPages: null,
      tableOrSection: null,
      fieldLabel: "Cổ phiếu đang lưu hành",
      extractionMethod: "not_found",
      evidenceNote: "Requires visual confirmation from audited statements.",
      caveat: "Set to null pending review.",
    },
    {
      ticker: "VCB",
      pdfFile: VCB_PDF_FILE,
      field: "totalDebt",
      value: null,
      unit: null,
      fiscalYear: 2025,
      sourceLabel: VCB_SOURCE_LABEL,
      dataMode: "research_only",
      productionApproved: false,
      status: "missing",
      pdfPage: null,
      reportPages: null,
      tableOrSection: null,
      fieldLabel: null,
      extractionMethod: "not_applicable",
      evidenceNote: "Bank balance sheets have a fundamentally different structure. Do not use total liabilities or deposits as corporate debt.",
      caveat: "VCB is a bank. Corporate totalDebt mapping is not applicable. Do not use total liabilities or customer deposits.",
      debtMappingStatus: "needs_bank_mapping",
    },
  ];
}
