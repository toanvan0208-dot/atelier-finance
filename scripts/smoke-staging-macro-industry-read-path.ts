import { loadMacroContext } from "../src/features/macro/lib/load-macro-context";
import { loadIndustryContextByTicker } from "../src/features/industry/lib/load-industry-context";

async function main() {
  console.log("=== Staging Macro/Industry Read Path Coverage Audit ===");

  const tickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];

  const macroContext = await loadMacroContext();
  const macroStatus = macroContext ? "available" : "missing";
  console.log(`Global Macro Context: ${macroStatus}`);

  console.log("\nCoverage Matrix:");
  console.log("Ticker | Macro context | Industry context | Status");
  console.log("---------------------------------------------------------");

  for (const ticker of tickers) {
    if (ticker === "VCB") {
      console.log(`VCB    | not applicable/excluded | null | excluded`);
      continue;
    }

    const indCtx = await loadIndustryContextByTicker(ticker);
    const indStatus = indCtx ? "available" : "missing";

    const paddedTicker = ticker.padEnd(6, " ");
    const paddedMacro = macroStatus.padEnd(13, " ");
    const paddedInd = indStatus.padEnd(16, " ");

    console.log(`${paddedTicker} | ${paddedMacro} | ${paddedInd} | ${indStatus === "available" ? "OK" : "Needs seed"}`);
  }

  console.log("\nAudit complete.");
}

main().catch((e: unknown) => {
  console.error("Audit failed:", (e as Error).message);
  process.exit(1);
});
