import fs from "fs";
import path from "path";

export type RawPreviewData = {
  ticker: string;
  field: string;
  value: number | null;
  unit: string | null;
  status: string;
  notes: string;
};

export type NormalizedImportRow = {
  ticker: string;
  fiscalYear: number;
  periodType: "annual";
  sourceLabel: string;
  dataMode: string;
  productionApproved: boolean;
  eps?: number | null;
  epsUnit?: string | null;
  sharesOutstanding?: number | null;
  sharesOutstandingUnit?: string | null;
  totalDebt?: number | null;
  totalDebtUnit?: string | null;
  status?: string;
  collisionAnalysis?: string;
};

export function normalizeBillionVnd(value: number | null, unit: string | null): { value: number | null; unit: string | null; conversionRule?: string } {
  if (value === null) return { value: null, unit: null };
  if (unit === "VND" || unit === "vnd") {
    return {
      value: Number((value / 1_000_000_000).toFixed(9)),
      unit: "billion_vnd",
      conversionRule: "divide by 1,000,000,000",
    };
  }
  return { value, unit };
}

export function buildDryRunImport(rawPreviews: RawPreviewData[]): NormalizedImportRow[] {
  const rowMap = new Map<string, NormalizedImportRow>();

  for (const p of rawPreviews) {
    if (p.ticker !== "HPG") continue;

    let row = rowMap.get(p.ticker);
    if (!row) {
      row = {
        ticker: p.ticker,
        fiscalYear: 2025,
        periodType: "annual",
        sourceLabel: "annual_report_2025_pdf_reviewed_preview",
        dataMode: "research_only",
        productionApproved: false,
        status: "preview_import_candidate",
      };
      rowMap.set(p.ticker, row);
    }

    if (p.field === "eps") {
      row.eps = p.value;
      row.epsUnit = p.unit;
    } else if (p.field === "sharesOutstanding") {
      row.sharesOutstanding = p.value;
      row.sharesOutstandingUnit = p.unit;
    } else if (p.field === "totalDebt") {
      const normalized = normalizeBillionVnd(p.value, p.unit);
      row.totalDebt = normalized.value;
      row.totalDebtUnit = normalized.unit;
      if (p.status === "derived_preview") {
        row.status = "derived_preview_import_candidate";
      }
    }
  }

  return Array.from(rowMap.values());
}

async function analyzeCollisions(rows: NormalizedImportRow[]) {
  const { prisma } = await import("../src/lib/database/client");
  for (const row of rows) {
    const existing = await prisma.financialStatement.findMany({
      where: { ticker: row.ticker, fiscalYear: row.fiscalYear }
    });

    const candidate = existing.find(e => e.sourceLabel === "vnstock_financials_candidate");
    if (candidate) {
      row.collisionAnalysis = `Found existing vnstock_financials_candidate row. Proposed behavior: prefer PDF-backed preview over VNStock candidate. This dry-run does not alter read-path priority or write to DB.`;
    } else {
      row.collisionAnalysis = `No existing candidate row found. Safe to insert.`;
    }
  }
}

async function run() {
  console.log("Phase 139C — HPG PDF reviewed preview-to-import dry-run only");
  console.log("=================================================================\n");

  const jsonPath = path.join(process.cwd(), "docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Phase 139B preview JSON not found!");
    process.exit(1);
  }

  const rawPreviews: RawPreviewData[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  
  const importRows = buildDryRunImport(rawPreviews);
  await analyzeCollisions(importRows);

  console.log("=== DRY RUN IMPORT CANDIDATES ===");
  console.log(JSON.stringify(importRows, null, 2));

  console.log("\n[INFO] Dry-run complete. No DB writes or schema changes were performed.");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || require.main === module) {
  run().catch(console.error);
}
