import { mwgAnnualReport2025ManualPreview } from "../src/lib/data-sources/mwg-annual-report-2025-manual-preview";

async function main() {
  const data = mwgAnnualReport2025ManualPreview;
  console.log(`ticker: ${data.ticker}`);
  console.log(`sourceFile: ${data.sourceFile}`);
  console.log(`entityStatus: ${data.entityStatus}`);
  console.log(`documentTypeStatus: ${data.documentTypeStatus}`);
  console.log(`consolidatedScopeStatus: ${data.consolidatedScopeStatus}`);
  console.log(`auditStatus: ${data.auditStatus}`);
  
  // Dry run logic, no DB writes
  const acceptedRows = 0;
  const invalidRows = 0;
  const dbWrites = 0;

  console.log(`acceptedRows: ${acceptedRows}`);
  console.log(`invalidRows: ${invalidRows}`);
  console.log(`dbWrites: ${dbWrites}`);

  console.log(`EPS preview: ${data.financials.EPS.value ?? "null"}/needs_review`);
  console.log(`sharesOutstanding preview: ${data.financials.sharesOutstanding.value ?? "null"}/needs_review`);
  console.log(`totalDebt preview: ${data.financials.totalDebt.value ?? "null"}/needs_review`);
  
  console.log(`sourceLabel đề xuất: ${data.source}`);
  console.log(`dataMode: ${data.dataMode}`);
  console.log(`productionApproved: ${data.productionApproved}`);
  console.log(`importReadiness: ${data.importReadiness}`);
  
  console.log("\n--- Runtime Comparison ---");
  console.log("Current MWG runtime (phase109_controlled_local_financials):");
  console.log("  EPS: 2546");
  console.log("  sharesOutstanding: 1454644497");
  console.log("  totalDebt: 27300.247");
  console.log("Preview MWG runtime (annual_report_2025_pdf_reviewed_preview):");
  console.log(`  EPS: ${data.financials.EPS.value}`);
  console.log(`  sharesOutstanding: ${data.financials.sharesOutstanding.value}`);
  console.log(`  totalDebt: ${data.financials.totalDebt.value}`);
  console.log("Difference: The current runtime uses controlled local financials because the new PDF is scanned and requires manual review before it can replace the current runtime.");
}

main().catch((e) => {
  console.error("Dry run failed:", e);
  process.exit(1);
});
