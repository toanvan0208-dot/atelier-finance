import fs from "fs";
import path from "path";

export type ExtractionPreview = {
  ticker: string;
  pdfFile: string;
  field: string;
  value: number | null;
  unit: string | null;
  fiscalYear: number;
  sourceLabel: string;
  dataMode: "research_only";
  productionApproved: boolean;
  status: "preview" | "derived_preview" | "needs_review" | "ambiguous" | "missing";
  page: string | null;
  tableOrSection: string | null;
  extractionMethod: "text_extract" | "manual_map" | "derived_from_lines" | "not_found";
  evidenceSnippet: string | null;
  notes: string;
};

const TICKER_PDF_MAP: Record<string, string> = {
  FPT: "FPT_Annual_Report_2025.pdf",
  HPG: "HPG_Annual_Report_2025.pdf",
  VCB: "VCB_Annual_Report_2025.pdf",
  VNM: "VNM_Annual_Report_2025.pdf",
  MWG: "MWG_Baocaothuongnien_2025.pdf",
  MSN: "MSN_Baocaothuongnien_2025.pdf",
};

const FIELDS_TO_EXTRACT = ["eps", "sharesOutstanding", "totalDebt", "totalAssets", "equity", "revenue", "netIncome"] as const;

export function buildManualPreviewMap(): ExtractionPreview[] {
  const previews: ExtractionPreview[] = [];

  for (const [ticker, pdfName] of Object.entries(TICKER_PDF_MAP)) {
    if (ticker === "HPG") {
      // HPG Specific Manual Provenance Map
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "eps",
        value: 1973,
        unit: "vnd_per_share",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "98, 139",
        tableOrSection: "Báo cáo kết quả hoạt động kinh doanh hợp nhất & Thuyết minh 38",
        extractionMethod: "manual_map",
        evidenceSnippet: "Lãi cơ bản trên cổ phiếu (VND/cổ phiếu): 1.973",
        notes: "Matches VNStock candidate (1973)."
      });
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "sharesOutstanding",
        value: 7675465855,
        unit: "shares",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "139",
        tableOrSection: "Thuyết minh 38",
        extractionMethod: "manual_map",
        evidenceSnippet: "Số bình quân gia quyền của cổ phiếu phổ thông đang lưu hành (cổ phiếu): 7.675.465.855",
        notes: "Matches VNStock candidate (7,675,465,855)."
      });
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "totalDebt",
        value: 92174151302217,
        unit: "VND",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "derived_preview",
        page: "97",
        tableOrSection: "Bảng cân đối kế toán hợp nhất - Nguồn vốn",
        extractionMethod: "derived_from_lines",
        evidenceSnippet: "Vay và nợ thuê tài chính ngắn hạn: 64.694.957.245.143 + Vay và nợ thuê tài chính dài hạn: 27.479.194.057.074",
        notes: "Derived safely from explicit short and long-term borrowings. VNStock candidate was null."
      });
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "totalAssets",
        value: 257899200817547,
        unit: "VND",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "96",
        tableOrSection: "Bảng cân đối kế toán hợp nhất - Tài sản",
        extractionMethod: "manual_map",
        evidenceSnippet: "TỔNG CỘNG TÀI SẢN: 257.899.200.817.547",
        notes: "Explicitly defined."
      });
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "equity",
        value: 131220010876575,
        unit: "VND",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "97",
        tableOrSection: "Bảng cân đối kế toán hợp nhất - Nguồn vốn",
        extractionMethod: "manual_map",
        evidenceSnippet: "VỐN CHỦ SỞ HỮU: 131.220.010.876.575",
        notes: "Explicitly defined."
      });
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "revenue",
        value: 156116094618482,
        unit: "VND",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "98",
        tableOrSection: "Báo cáo kết quả hoạt động kinh doanh hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "Doanh thu thuần về bán hàng và cung cấp dịch vụ: 156.116.094.618.482",
        notes: "Net revenue used."
      });
      previews.push({
        ticker: "HPG",
        pdfFile: pdfName,
        field: "netIncome",
        value: 15514931571606,
        unit: "VND",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "98",
        tableOrSection: "Báo cáo kết quả hoạt động kinh doanh hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "Lợi nhuận sau thuế thu nhập doanh nghiệp: 15.514.931.571.606",
        notes: "Explicitly defined."
      });
      continue;
    }

    if (ticker === "VNM") {
      // VNM Specific Manual Provenance Map
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "eps",
        value: 4070,
        unit: "vnd_per_share",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "109",
        tableOrSection: "Báo cáo kết quả hoạt động kinh doanh và thu nhập toàn diện khác hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "Lãi cơ bản trên cổ phiếu (VND): 4.070",
        notes: "Explicitly defined."
      });
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "sharesOutstanding",
        value: 2089955445,
        unit: "shares",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "12",
        tableOrSection: "Cổ phần và cơ cấu cổ đông",
        extractionMethod: "manual_map",
        evidenceSnippet: "Khối lượng cổ phiếu đang lưu hành: 2.089.955.445 cổ phần.",
        notes: "Matches VNStock candidate (2,089,955,445)."
      });
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "totalDebt",
        value: 9456645,
        unit: "million_vnd",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "derived_preview",
        page: "108",
        tableOrSection: "Báo cáo tình hình tài chính hợp nhất",
        extractionMethod: "derived_from_lines",
        evidenceSnippet: "Vay ngắn hạn: 9.393.737 Triệu VND + Vay dài hạn: 62.908 Triệu VND",
        notes: "Derived safely from explicit short and long-term borrowings."
      });
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "totalAssets",
        value: 56091826,
        unit: "million_vnd",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "108",
        tableOrSection: "Báo cáo tình hình tài chính hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "TỔNG TÀI SẢN: 56.091.826 Triệu VND",
        notes: "Explicitly defined."
      });
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "equity",
        value: 31695270,
        unit: "million_vnd",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "108",
        tableOrSection: "Báo cáo tình hình tài chính hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "Vốn chủ sở hữu của cổ đông Công ty: 31.695.270 Triệu VND",
        notes: "Explicitly defined."
      });
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "revenue",
        value: 54248830,
        unit: "million_vnd",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "109",
        tableOrSection: "Báo cáo kết quả hoạt động kinh doanh và thu nhập toàn diện khác hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "Doanh thu: 54.248.830 Triệu VND",
        notes: "Net revenue used."
      });
      previews.push({
        ticker: "VNM",
        pdfFile: pdfName,
        field: "netIncome",
        value: 8505216,
        unit: "million_vnd",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "109",
        tableOrSection: "Báo cáo kết quả hoạt động kinh doanh và thu nhập toàn diện khác hợp nhất",
        extractionMethod: "manual_map",
        evidenceSnippet: "Lợi nhuận thuần: 8.505.216 Triệu VND",
        notes: "Explicitly defined."
      });
      continue;
    }

    if (ticker === "MWG") {
      previews.push({
        ticker: "MWG",
        pdfFile: pdfName,
        field: "eps",
        value: null,
        unit: null,
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "missing",
        page: null,
        tableOrSection: null,
        extractionMethod: "not_found",
        evidenceSnippet: null,
        notes: "EPS is not explicitly listed in the sustainability report."
      });
      previews.push({
        ticker: "MWG",
        pdfFile: pdfName,
        field: "sharesOutstanding",
        value: 1468456763,
        unit: "shares",
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview",
        page: "68",
        tableOrSection: "Thông tin liên hệ",
        extractionMethod: "manual_map",
        evidenceSnippet: "Số lượng cổ phiếu đang lưu hành: 1.468.456.763 (Tính đến 31/12/2025)",
        notes: "Explicitly defined."
      });
      previews.push({
        ticker: "MWG",
        pdfFile: pdfName,
        field: "totalDebt",
        value: null,
        unit: null,
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "missing",
        page: null,
        tableOrSection: null,
        extractionMethod: "not_found",
        evidenceSnippet: null,
        notes: "Total debt (short/long-term borrowings) is not available in the sustainability report."
      });
      continue;
    }

    for (const field of FIELDS_TO_EXTRACT) {
      let status: ExtractionPreview["status"] = "needs_review";
      const value: number | null = null;
      const unit: string | null = null;
      let notes = "Page number cannot be verified automatically; PDF binary requires manual visual check.";

      if (field === "totalDebt" && ticker === "VCB") {
        notes = "Banking caveat: Bank liabilities/deposits are not standard corporate debt. Marked null/needs_review to avoid forcing industrial-company totalDebt mapping.";
        status = "needs_review";
      } else if (field === "totalDebt") {
        notes = "totalDebt must only be derived from short-term + long-term borrowings. totalLiabilities must never be used. Marked needs_review pending manual check.";
      }

      previews.push({
        ticker,
        pdfFile: pdfName,
        field,
        value,
        unit,
        fiscalYear: 2025,
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status,
        page: null,
        tableOrSection: null,
        extractionMethod: "manual_map",
        evidenceSnippet: null,
        notes,
      });
    }
  }

  return previews;
}

export function evaluateExtractionSafety(preview: Partial<ExtractionPreview>): string[] {
  const violations: string[] = [];
  
  if (preview.productionApproved === true) {
    violations.push("productionApproved must remain false for PDF previews.");
  }

  if (preview.value === 0 && preview.status === "missing") {
    violations.push("Missing values must not be converted to 0.");
  }

  if (preview.field === "eps" && preview.value !== null && preview.unit !== "vnd_per_share") {
    violations.push("EPS unit must be vnd_per_share.");
  }

  if (preview.field === "sharesOutstanding" && preview.value !== null && preview.unit !== "shares") {
    violations.push("sharesOutstanding unit must be shares.");
  }

  if (preview.field === "totalDebt" && preview.notes?.includes("total liabilities")) {
    violations.push("totalLiabilities is blocked and never maps to totalDebt.");
  }

  if (preview.field === "totalDebt" && preview.ticker === "VCB" && preview.value !== null) {
    if (!preview.notes?.includes("Banking caveat")) {
      violations.push("VCB banking caveat blocks unsafe totalDebt mapping.");
    }
  }

  if (["preview", "derived_preview"].includes(preview.status as string) && !preview.page) {
    violations.push("Missing page provenance prevents reviewed-ready status.");
  }

  return violations;
}

async function run() {
  const previews = buildManualPreviewMap();
  
  console.log("Phase 139F — VNM PDF 2025 manual provenance extraction preview");
  console.log("=================================================================\n");
  
  const pdfDir = path.join(process.cwd(), "docs/product/evidence/source-pdfs");
  if (!fs.existsSync(pdfDir)) {
    console.log("PDF directory not found. Assuming empty local environment for script execution.");
  }

  for (const [ticker, pdfName] of Object.entries(TICKER_PDF_MAP)) {
    if (ticker !== "HPG" && ticker !== "VNM" && ticker !== "MWG") continue;

    console.log(`\nTicker: ${ticker} | Source: ${pdfName}`);
    console.log("---------------------------------------------------------");
    const tickerPreviews = previews.filter(p => p.ticker === ticker);
    
    for (const p of tickerPreviews) {
      console.log(`- ${p.field}: ${p.value ?? "null"} ${p.unit ? `(${p.unit})` : ""}`);
      console.log(`  Status: ${p.status} | Provenance: Page ${p.page ?? "Unknown"} | Source: ${p.sourceLabel}`);
      console.log(`  Caveat: ${p.notes}`);
    }
  }

  // Create JSON output
  const hpgPreviews = previews.filter(p => p.ticker === "HPG");
  const jsonPathHPG = path.join(process.cwd(), "docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json");
  fs.writeFileSync(jsonPathHPG, JSON.stringify(hpgPreviews, null, 2));

  const vnmPreviews = previews.filter(p => p.ticker === "VNM");
  const jsonPathVNM = path.join(process.cwd(), "docs/product/evidence/PHASE139F_VNM_PDF_2025_PREVIEW.json");
  fs.writeFileSync(jsonPathVNM, JSON.stringify(vnmPreviews, null, 2));

  const mwgPreviews = previews.filter(p => p.ticker === "MWG");
  const jsonPathMWG = path.join(process.cwd(), "docs/product/evidence/PHASE139H_MWG_PDF_2025_PREVIEW.json");
  fs.writeFileSync(jsonPathMWG, JSON.stringify(mwgPreviews, null, 2));

  console.log(`\nPreview mapping complete. JSON generated. No DB writes or schema changes were performed.`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || require.main === module) {
  run().catch(console.error);
}
