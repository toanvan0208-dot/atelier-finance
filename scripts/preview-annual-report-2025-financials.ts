import fs from "fs";
import path from "path";

type ExtractionPreview = {
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
        sourceLabel: "annual_report_2025_pdf_preview",
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

  if (preview.status === "preview" && preview.page === null) {
    violations.push("Missing page provenance prevents reviewed-ready status.");
  }

  return violations;
}

async function run() {
  const previews = buildManualPreviewMap();
  
  console.log("Phase 139A — PDF 2025 reviewed financial extraction preview-only");
  console.log("=================================================================\n");
  
  const pdfDir = path.join(process.cwd(), "docs/product/evidence/source-pdfs");
  if (!fs.existsSync(pdfDir)) {
    console.log("PDF directory not found. Assuming empty local environment for script execution.");
  }

  for (const [ticker, pdfName] of Object.entries(TICKER_PDF_MAP)) {
    console.log(`\nTicker: ${ticker} | Source: ${pdfName}`);
    console.log("---------------------------------------------------------");
    const tickerPreviews = previews.filter(p => p.ticker === ticker);
    
    for (const p of tickerPreviews) {
      console.log(`- ${p.field}: ${p.value ?? "null"} ${p.unit ? `(${p.unit})` : ""}`);
      console.log(`  Status: ${p.status} | Provenance: Page ${p.page ?? "Unknown"} | Source: ${p.sourceLabel}`);
      console.log(`  Caveat: ${p.notes}`);
    }
  }

  console.log("\nPreview mapping complete. No DB writes or schema changes were performed.");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || require.main === module) {
  run().catch(console.error);
}
