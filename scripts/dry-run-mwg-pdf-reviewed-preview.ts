import { mwgAnnualReport2025ManualPreview } from "../src/lib/data-sources/mwg-annual-report-2025-manual-preview";

async function main() {
  const data = mwgAnnualReport2025ManualPreview;
  console.log(`ticker: ${data.ticker}`);
  console.log(`sourceFile: ${data.sourceFile}`);
  console.log(`manualVisualAudit: ${data.manualVisualAudit}`);
  console.log(`entityStatus: ${data.entityStatus}`);
  console.log(`documentTypeStatus: ${data.documentTypeStatus}`);
  console.log(`auditStatus: ${data.auditStatus}`);
  console.log(`consolidatedScopeStatus: ${data.consolidatedScopeStatus}`);
  
  const eps = data.financials.EPS;
  console.log(`epsPreview: ${eps.value ?? "null"}/${eps.unit}/${eps.status}/${eps.provenance}/${eps.confidence}`);
  
  const shares = data.financials.sharesOutstanding;
  console.log(`sharesOutstandingPreview: ${shares.value ?? "null"}/${shares.unit}/${shares.status}/${shares.provenance}/${shares.confidence}`);
  
  const debt = data.financials.totalDebt;
  console.log(`totalDebtPreview: ${debt.value ?? "null"}/${debt.unit}/${debt.status}/${debt.provenance}/${debt.conversion}/${debt.confidence}`);
  
  // Dry run logic, no DB writes
  const dbWrites = 0;
  console.log(`dbWrites: ${dbWrites}`);
  
  console.log(`sourceLabel proposed: ${data.source}`);
  console.log(`dataMode: ${data.dataMode}`);
  console.log(`productionApproved: ${data.productionApproved}`);
  console.log(`importReadiness: ${data.importReadiness}`);
}

main().catch((e) => {
  console.error("Dry run failed:", e);
  process.exit(1);
});
