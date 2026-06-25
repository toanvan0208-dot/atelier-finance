import {
  buildMsnDebtComponents,
  buildMsnDryRunImportCandidate,
  buildMsnIdentityEvidence,
  buildMsnPreview,
  normalizeToBillionVnd,
} from "../src/lib/data-sources/annual-report-2025-msn-manual-preview";

export function buildMsnDryRunOutput() {
  const identity = buildMsnIdentityEvidence();
  const previews = buildMsnPreview(identity);
  const candidate = buildMsnDryRunImportCandidate(identity, previews);
  const normalizedPreviews = previews.map((preview) => {
    const normalized =
      preview.field === "eps" || preview.field === "sharesOutstanding"
        ? { value: preview.value, unit: preview.unit, conversionRule: "none" }
        : normalizeToBillionVnd(preview.value, preview.unit);

    return {
      ...preview,
      normalizedValue: normalized.value,
      normalizedUnit: normalized.unit,
      conversionRule: normalized.conversionRule,
    };
  });

  return {
    phase: "139K",
    mode: "preview_dry_run_only",
    identity,
    debtComponents: buildMsnDebtComponents(),
    previews: normalizedPreviews,
    dryRunImportCandidate: candidate,
    safeguards: {
      databaseWrite: false,
      importExecuted: false,
      confirmWriteExecuted: false,
      schemaChanged: false,
      migrationCreated: false,
      runtimePriorityChanged: false,
      productionApproved: false,
    },
  };
}

function run() {
  console.log(
    "Phase 139K - MSN PDF 2025 provenance and reviewed-preview dry run",
  );
  console.log("No DB writes, imports, schema changes, or priority changes.\n");
  console.log(JSON.stringify(buildMsnDryRunOutput(), null, 2));
}

if (
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
  require.main === module
) {
  run();
}
