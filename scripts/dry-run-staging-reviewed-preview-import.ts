import fs from "fs";
import path from "path";

type NormalizedImportRow = {
  ticker: string;
  fiscalYear: number;
  eps: number | null;
  epsUnit: string;
  sharesOutstanding: number | null;
  sharesOutstandingUnit: string;
  totalDebt: number | null;
  totalDebtUnit: string;
};

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const REJECTED_TICKERS = ["VCB"];

const STATIC_CANDIDATES: NormalizedImportRow[] = [
  {
    ticker: "FPT",
    fiscalYear: 2025,
    eps: 5216,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 1460,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 33306,
    totalDebtUnit: "billion_vnd"
  },
  {
    ticker: "HPG",
    fiscalYear: 2025,
    eps: 1332,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 6396,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 88924,
    totalDebtUnit: "billion_vnd"
  },
  {
    ticker: "VNM",
    fiscalYear: 2025,
    eps: 4212,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 2089,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 18671,
    totalDebtUnit: "billion_vnd"
  },
  {
    ticker: "MWG",
    fiscalYear: 2025,
    eps: 2661,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 1462,
    sharesOutstandingUnit: "million_shares",
    totalDebt: 23514,
    totalDebtUnit: "billion_vnd"
  },
  {
    ticker: "MSN",
    fiscalYear: 2025,
    eps: 2710,
    epsUnit: "vnd_per_share",
    sharesOutstanding: 1520491927,
    sharesOutstandingUnit: "shares",
    totalDebt: 64877.178,
    totalDebtUnit: "billion_vnd"
  }
];

async function main() {
  const argv = process.argv.slice(2);
  const confirmWrite = argv.includes("--confirm-write");

  console.log("=== Phase 142H-S: Staging Reviewed-Preview Import ===");
  console.log(`Mode: ${confirmWrite ? "CONFIRM-WRITE (Blocked in this phase)" : "DRY-RUN"}`);

  // Safety checks
  const envPath = path.join(process.cwd(), ".env.staging.local");
  if (!fs.existsSync(envPath)) {
    console.error("[FATAL] .env.staging.local not found. Cannot determine staging database.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  let dbUrl = "";
  for (const line of envContent.split("\n")) {
    if (line.startsWith("DATABASE_URL=")) {
      dbUrl = line.split("=")[1].replace(/"/g, "").trim();
    }
  }

  if (!dbUrl) {
    console.error("[FATAL] DATABASE_URL not found in .env.staging.local");
    process.exit(1);
  }

  const lowerUrl = dbUrl.toLowerCase();
  
  if (lowerUrl.includes("localhost") || lowerUrl.includes("127.0.0.1")) {
    console.error("[FATAL] DATABASE_URL points to localhost. Staging script requires remote staging DB.");
    process.exit(1);
  }

  if (lowerUrl.includes("production") || lowerUrl.includes("prod")) {
    console.error("[FATAL] DATABASE_URL points to production. Rejected.");
    process.exit(1);
  }

  if (lowerUrl.startsWith("file:")) {
    console.error("[FATAL] DATABASE_URL is SQLite. Rejected.");
    process.exit(1);
  }

  if (!lowerUrl.startsWith("postgres://") && !lowerUrl.startsWith("postgresql://")) {
    console.error("[FATAL] DATABASE_URL must be PostgreSQL. Rejected.");
    process.exit(1);
  }

  // Mask connection string
  const maskedUrl = dbUrl.replace(/\/\/([^:@/]+):([^@/]+)@/, "//***:***@");
  console.log(`[OK] Staging database recognized. URL: ${maskedUrl}`);

  console.log("\n=== DRY RUN SUMMARY ===");
  console.log(`Approved Tickers: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`Excluded Tickers: ${REJECTED_TICKERS.join(", ")}`);
  console.log(`Allowed Fields: eps, sharesOutstanding, totalDebt`);
  console.log(`Rejected Fields: revenue, netIncome, totalAssets, equity, cashAndEquivalents, capitalExpenditure, operatingCashFlow`);
  console.log(`Missing fields will be null. No zero-filling.`);
  
  console.log("\nCandidate Rows to Import:");
  STATIC_CANDIDATES.forEach(r => {
    console.log(`- ${r.ticker} (FY ${r.fiscalYear}): EPS=${r.eps} ${r.epsUnit}, Shares=${r.sharesOutstanding} ${r.sharesOutstandingUnit}, TotalDebt=${r.totalDebt} ${r.totalDebtUnit}`);
  });
  console.log(`Total rows projected: ${STATIC_CANDIDATES.length}`);
  
  console.log("\nGuardrails Applied:");
  console.log("- productionApproved = false");
  console.log("- dataMode = 'research_only'");
  console.log("- sourceLabel = 'annual_report_2025_pdf_reviewed_preview'");

  console.log("\nRollback Criteria (for next phase):");
  console.log(`DELETE FROM "FinancialStatement"`);
  console.log(`WHERE "sourceLabel" = 'annual_report_2025_pdf_reviewed_preview'`);
  console.log(`  AND "ticker" IN ('FPT', 'HPG', 'VNM', 'MSN', 'MWG')`);
  console.log(`  AND "productionApproved" = false`);
  console.log(`  AND "dataMode" = 'research_only';`);
  
  console.log(`\nWrite Enabled: false`);
  console.log(`Confirm Write flag provided: ${confirmWrite}`);
  
  if (confirmWrite) {
    console.log("\n[BLOCKED] Phase 142H-S-S does not execute writes. Run without --confirm-write to see dry-run. Script will exit.");
    process.exit(1);
  }

  console.log("\n[SUCCESS] Dry run finished safely.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
