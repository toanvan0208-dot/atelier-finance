export const mwgAnnualReport2025ManualPreview = {
  ticker: "MWG",
  source: "annual_report_2025_pdf_reviewed_preview",
  sourceFile: "docs/product/evidence/source-pdfs/MWG_Annual_Report_2025.pdf",
  dataMode: "research_only" as const,
  productionApproved: false,
  entityStatus: "verified (Công ty Cổ phần Đầu tư Thế Giới Di Động)",
  documentTypeStatus: "verified (Báo cáo thường niên 2025)",
  consolidatedScopeStatus: "needs_review",
  auditStatus: "needs_review (scanned images)",
  importReadiness: "needs_review",
  financials: {
    EPS: { value: null, unit: "vnd_per_share", provenance: "needs_review" },
    sharesOutstanding: { value: null, unit: "shares", provenance: "needs_review" },
    totalDebt: { value: null, unit: "billion_vnd", provenance: "needs_review" },
  },
};
