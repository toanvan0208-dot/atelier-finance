import { runPhase108FptFinancialsActivation } from "../src/features/financials/lib/phase108-fpt-controlled-financials-activation";

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

if (hasFlag("--help")) {
  process.stdout.write(
    [
      "Usage: npm run financials:fpt:controlled -- [--confirm-write] [--verify-runtime-read] [--json]",
      "",
      "Dry-run is the default. Confirmed local write requires --confirm-write and a local SQLite DATABASE_URL.",
    ].join("\n"),
  );
  process.exit(0);
}

void runPhase108FptFinancialsActivation({
  confirmWrite: hasFlag("--confirm-write"),
  verifyRuntimeRead: hasFlag("--verify-runtime-read"),
})
  .then((report) => {
    if (hasFlag("--json")) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    process.stdout.write(
      [
        "Phase 108 FPT controlled financials activation",
        `confirmWrite: ${report.confirmWrite}`,
        `dryRun: ${report.dryRun}`,
        `ticker: ${report.ticker}`,
        `sourceLabel: ${report.sourceLabel}`,
        `dataMode: ${report.dataMode}`,
        `productionApproved: ${report.productionApproved}`,
        `inputRows: ${report.inputRows}`,
        `validRows: ${report.validRows}`,
        `invalidRows: ${report.invalidRows}`,
        `skippedRows: ${report.skippedRows}`,
        `writtenRows: ${report.writtenRows}`,
        `runtimeChecked: ${report.runtimeProof.checked}`,
        `runtimeStatus: ${report.runtimeProof.runtimeStatus ?? "not_checked"}`,
        `fallbackUsed: ${String(report.runtimeProof.fallbackUsed)}`,
        `readPath: ${report.runtimeProof.readPath ?? "not_checked"}`,
        `sharesOutstanding: ${report.runtimeProof.sharesOutstanding ?? "unavailable"}`,
        `eps: ${report.runtimeProof.eps ?? "unavailable"}`,
      ].join("\n") + "\n",
    );
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Phase 108 financials activation failed."}\n`);
    process.exitCode = 1;
  });
