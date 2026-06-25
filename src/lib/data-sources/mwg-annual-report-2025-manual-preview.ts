export const mwgAnnualReport2025ManualPreview = {
  ticker: "MWG",
  source: "annual_report_2025_pdf_reviewed_preview",
  sourceFile: "docs/product/evidence/source-pdfs/MWG_Annual_Report_2025.pdf",
  manualVisualAudit: true,
  dataMode: "research_only" as const,
  productionApproved: false,
  entityStatus: "verified (Công ty Cổ phần Đầu tư Thế Giới Di Động)",
  documentTypeStatus: "verified (Báo cáo thường niên 2025)",
  consolidatedScopeStatus: "consolidated_group_level",
  auditStatus: "audited",
  importReadiness: "ready_for_future_controlled_import",
  financials: {
    EPS: { value: 4774, unit: "vnd_per_share", provenance: "Page 85, Lãi cơ bản trên cổ phiếu, text extraction", confidence: "high", status: "verified" },
    sharesOutstanding: { value: 1468456763, unit: "shares", provenance: "Page 40, Số lượng cổ phiếu có quyền biểu quyết đang lưu hành, ordinary_shares_outstanding, text extraction", confidence: "high", status: "verified" },
    totalDebt: { value: 29930.943, unit: "billion_vnd", provenance: "Page 81, Vay ngắn hạn, text extraction", conversion: "29.930.942.961.668 VND / 1,000,000,000", confidence: "high", status: "verified" },
  },
};
