process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { loadScreeningRuntimeData } from "../src/features/screening/lib/load-screening-runtime-data";

async function smokeStagingScreeningReadPath() {
  const approvedTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];
  const matrix: Record<string, string>[] = [];
  let hasError = false;

  console.log("SMOKING SCREENING READ PATH...");
  try {
    const data = await loadScreeningRuntimeData({ preferDb: true });
    
    for (const ticker of approvedTickers) {
      const candidate = data.candidates.find(c => c.ticker === ticker);
      const isMissing = candidate?.dataStatus === "missing";
      
      const peReady = candidate?.metrics["P/E"] === "Có thể tính";
      const riskReady = candidate?.metrics["Rủi ro"] === "Có thể rà soát";

      let status = "PASS";
      if (!candidate) status = "FAIL";
      else if (ticker === "VCB" && !isMissing) status = "FAIL_VCB_NOT_EXCLUDED";
      else if (ticker !== "VCB" && isMissing) status = "PARTIAL";

      matrix.push({
        Ticker: ticker,
        RuntimeRow: candidate ? "OK" : "MISSING",
        Company: candidate?.companyName !== "N/A" ? "OK" : "MISSING",
        Financials: candidate?.availableFields.includes("Dữ liệu tài chính nghiên cứu") ? "OK" : "MISSING",
        ValuationReadiness: peReady ? "OK" : "PARTIAL",
        RiskReadiness: riskReady ? "OK" : "PARTIAL",
        MissingFields: candidate?.missingFields.length ? candidate.missingFields.join(", ") : "None",
        Guardrails: candidate?.warnings.length ? "OK" : "MISSING",
        Status: status
      });
      
      console.log(`[TICKER] ${ticker}: Screening loaded. Readiness: ${candidate?.readinessLabel}`);
    }
  } catch (err) {
    console.error(`[ERROR] Screening runtime load failed:`, err);
    hasError = true;
  }

  console.table(matrix);

  if (hasError) {
    process.exit(1);
  } else {
    console.log("SMOKE PASS");
  }
}

smokeStagingScreeningReadPath().catch(err => {
  console.error(err);
  process.exit(1);
});
