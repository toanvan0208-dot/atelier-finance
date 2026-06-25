import {
  buildVcbIdentityEvidence,
  buildVcbPreview,
} from "../src/lib/data-sources/annual-report-2025-vcb-manual-preview";

export function buildVcbDryRunOutput() {
  const identity = buildVcbIdentityEvidence();
  const previews = buildVcbPreview(identity);

  const epsPreview = previews.find(p => p.field === "eps")?.value ?? null;
  const sharesOutstandingPreview = previews.find(p => p.field === "sharesOutstanding")?.value ?? null;
  const totalDebtPreview = previews.find(p => p.field === "totalDebt")?.value ?? null;
  const debtMappingStatus = previews.find(p => p.field === "totalDebt")?.debtMappingStatus ?? "needs_bank_mapping";

  const invalidRows = previews.filter(p => (p.productionApproved as boolean) === true || (p.field === "totalDebt" && p.value !== null));

  return {
    ticker: "VCB",
    entityStatus: identity.status,
    annualReportStatus: identity.annualReportStatus,
    auditStatus: identity.auditStatus,
    consolidatedScopeStatus: identity.consolidatedScopeStatus,
    epsPreview,
    sharesOutstandingPreview,
    totalDebtPreview,
    debtMappingStatus,
    invalidRows: invalidRows.length > 0 ? invalidRows : undefined,
    issues: [],
    warnings: ["VCB is a bank. Do not apply corporate total debt logic."],
    dbWrites: 0,
    productionApproved: false,
    dataMode: "research_only"
  };
}

function run() {
  console.log("Phase 139M - VCB bank-specific annual report/source-quality preview");
  console.log("No DB writes, imports, schema changes, or priority changes.\n");
  console.log(JSON.stringify(buildVcbDryRunOutput(), null, 2));
}

if (
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
  require.main === module
) {
  run();
}
