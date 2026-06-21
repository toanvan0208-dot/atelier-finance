import { runPhase109ControlledFinancialsActivation } from "../src/features/financials/lib/phase109-controlled-financials-activation";
import { PHASE109_CONTROLLED_FINANCIALS_TICKERS } from "../src/features/financials/lib/phase109-controlled-financials-constants";

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const valueFor = (flag: string): string | null => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
};

const tickersFromArgs = (): string[] => {
  const tickerValue = valueFor("--ticker") ?? valueFor("--tickers");
  if (!tickerValue) return [...PHASE109_CONTROLLED_FINANCIALS_TICKERS];
  return tickerValue
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);
};

if (hasFlag("--help")) {
  process.stdout.write(
    [
      "Usage: npm run financials:controlled -- [--ticker FPT,MWG,VNM] [--confirm-write] [--verify-runtime-read] [--json]",
      "",
      "Dry-run is the default. Confirmed local write requires --confirm-write and a local SQLite DATABASE_URL.",
      "Only the controlled Phase 109 ticker set is available; unavailable tickers are skipped with a reason.",
    ].join("\n"),
  );
  process.exit(0);
}

void runPhase109ControlledFinancialsActivation({
  confirmWrite: hasFlag("--confirm-write"),
  tickers: tickersFromArgs(),
  verifyRuntimeRead: hasFlag("--verify-runtime-read"),
})
  .then((report) => {
    if (hasFlag("--json")) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    const tickerLines = report.tickerAudits.flatMap((audit) => [
      `ticker: ${audit.ticker}`,
      `  skippedReason: ${audit.skippedReason ?? "none"}`,
      `  inputRows: ${audit.inputRows}`,
      `  validRows: ${audit.validRows}`,
      `  invalidRows: ${audit.invalidRows}`,
      `  skippedRows: ${audit.skippedRows}`,
      `  writtenRows: ${audit.writtenRows}`,
      `  runtimeStatus: ${audit.runtimeProof.runtimeStatus ?? "not_checked"}`,
      `  fallbackUsed: ${String(audit.runtimeProof.fallbackUsed)}`,
      `  readPath: ${audit.runtimeProof.readPath ?? "not_checked"}`,
      `  overviewFinancialsStatus: ${audit.crossModuleReadiness.overviewFinancialsStatus ?? "not_checked"}`,
      `  valuationMarketCapReadiness: ${audit.crossModuleReadiness.valuationMarketCapReadiness ?? "not_checked"}`,
      `  riskSourceMode: ${audit.crossModuleReadiness.riskSourceMode ?? "not_checked"}`,
      `  sharesOutstanding: ${audit.runtimeProof.sharesOutstanding ?? "unavailable"}`,
      `  eps: ${audit.runtimeProof.eps ?? "unavailable"}`,
    ]);

    process.stdout.write(
      [
        "Phase 109 controlled financials activation",
        `confirmWrite: ${report.confirmWrite}`,
        `dryRun: ${report.dryRun}`,
        `sourceLabel: ${report.sourceLabel}`,
        `dataMode: ${report.dataMode}`,
        `productionApproved: ${report.productionApproved}`,
        `totalInputRows: ${report.totals.inputRows}`,
        `totalValidRows: ${report.totals.validRows}`,
        `totalInvalidRows: ${report.totals.invalidRows}`,
        `totalSkippedRows: ${report.totals.skippedRows}`,
        `totalWrittenRows: ${report.totals.writtenRows}`,
        ...tickerLines,
      ].join("\n") + "\n",
    );
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Phase 109 financials activation failed."}\n`);
    process.exitCode = 1;
  });
