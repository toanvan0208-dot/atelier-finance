import { readFile } from "node:fs/promises";
import { runReviewedFinancialMissingFieldsImport } from "../src/lib/data-sources/reviewed-financial-missing-fields-import";

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const valueFor = (flag: string): string | null => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
};

if (hasFlag("--help")) {
  process.stdout.write(
    [
      "Usage: npx tsx scripts/import-reviewed-financial-missing-fields.ts --file docs/product/data/phase116_reviewed_financial_missing_fields.csv [--confirm-write] [--verify-runtime-read] [--json]",
      "",
      "Dry-run is the default. Confirmed writes require --confirm-write, ATELIER_LOCAL_IMPORTS_ENABLED=true, and a PostgreSQL/Supabase DATABASE_URL.",
    ].join("\n"),
  );
  process.exit(0);
}

const file = valueFor("--file");
if (!file) {
  process.stderr.write("--file is required.\n");
  process.exit(1);
}

void readFile(file, "utf8")
  .then((csvText) =>
    runReviewedFinancialMissingFieldsImport({
      confirmWrite: hasFlag("--confirm-write"),
      csvText,
      verifyRuntimeRead: hasFlag("--verify-runtime-read"),
    }),
  )
  .then((report) => {
    if (hasFlag("--json")) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    process.stdout.write(
      [
        "Phase 116 reviewed financial missing-fields import",
        `confirmWrite: ${report.confirmWrite}`,
        `dryRun: ${report.dryRun}`,
        `sourceLabel: ${report.sourceLabel}`,
        `dataMode: ${report.dataMode}`,
        `productionApproved: ${report.productionApproved}`,
        `inputRows: ${report.inputRows}`,
        `validRows: ${report.validRows}`,
        `invalidRows: ${report.invalidRows}`,
        `skippedRows: ${report.skippedRows}`,
        `writtenRows: ${report.writtenRows}`,
        `breakdownByTicker: ${JSON.stringify(report.breakdownByTicker)}`,
        `breakdownByField: ${JSON.stringify(report.breakdownByField)}`,
        ...(report.errors.length ? [`errors: ${report.errors.join("; ")}`] : []),
      ].join("\n") + "\n",
    );
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Phase 116 import failed."}\n`);
    process.exitCode = 1;
  });
