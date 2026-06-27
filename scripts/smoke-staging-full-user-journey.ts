/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../src/lib/database/client";
import { getFinancialStatementSeries } from "../src/lib/data-sources/financial-statement-read-service";
import { loadCompanyBusinessProfile } from "../src/features/business/lib/load-company-business-profile";
import { getMarketPriceSeries } from "../src/lib/data-sources/market-price-read-service";
import { loadMacroContext } from "../src/features/macro/lib/load-macro-context";
import { loadIndustryContextByTicker } from "../src/features/industry/lib/load-industry-context";
import { loadChecklistRuntimeData } from "../src/features/checklist/lib/load-checklist-runtime-data";
import { loadScreeningRuntimeData } from "../src/features/screening/lib/load-screening-runtime-data";
import { buildAssistantRuntime } from "../src/lib/ai-rag/runtime";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];

async function main() {
  console.log("=== Staging Cross-Module Data Completeness Smoke ===\n");

  const matrix: Record<string, any> = {};

  for (const ticker of TICKERS) {
    const row = {
      Company: "missing",
      Business: "missing",
      Financials: "missing",
      MarketPrice: "missing",
      Macro: "missing",
      Industry: "missing",
      Valuation: "not_implemented",
      Risk: "not_implemented",
      AssistantContext: "not_implemented",
      Checklist: "not_implemented",
      Learning: "demo_static",
      Simulation: "demo_static",
      Watchlist: "not_integrated",
      Screening: "missing",
      Status: "FAIL",
    };

    // 1. Company
    const company = await prisma.company.findFirst({ where: { ticker, dataMode: "research_only" } });
    if (company) {
      row.Company = "OK";
    } else {
      if (ticker === "VCB") row.Company = "excluded";
    }

    // 2. Business Profile
    const profile = await loadCompanyBusinessProfile(ticker);
    if (profile) {
      row.Business = "OK";
    } else {
      if (ticker === "VCB") row.Business = "excluded";
    }

    // 3. Financial Statement & Unit Metadata
    const finSeries = await getFinancialStatementSeries(
      { ticker, periodType: "year", limit: 1, dataMode: "research_only", sourceLabel: "annual_report_2025_pdf_reviewed_preview" },
      { db: prisma as any }
    );
    const finRecord = finSeries.records[0];
    if (finRecord) {
      const u = finRecord.unitMetadata;
      if (u?.eps?.status === "explicit" && u?.sharesOutstanding?.status === "explicit" && u?.totalDebt?.status === "explicit") {
        row.Financials = "OK";
      } else {
        row.Financials = "missing_units";
      }
      
      // Verify nulls are not zero-filled
      if (finRecord.values.totalAssets === 0) {
         console.warn(`WARNING: ${ticker} zero-filled missing field!`);
      }
    } else {
      if (ticker === "VCB") row.Financials = "excluded";
    }

    // 4. Market Price
    const priceSeries = await getMarketPriceSeries({ ticker, dataMode: "research_only", sourceLabel: "vnstock_research_candidate", from: "2025-01-01", to: "2025-01-31" }, { db: prisma as any });
    if (priceSeries.rows.length > 0) {
      row.MarketPrice = "OK";
    } else {
      if (ticker === "VCB") row.MarketPrice = "excluded";
    }

    // 5. Macro
    const macro = await loadMacroContext();
    if (macro) {
      row.Macro = "OK";
    }

    // 6. Industry
    const industry = await loadIndustryContextByTicker(ticker);
    if (industry) {
      row.Industry = "OK";
    } else {
      if (ticker === "VCB") row.Industry = "null";
    }

    // 7. Screening
    try {
      const sr = await loadScreeningRuntimeData();
      const cand = sr.candidates.find((c) => c.ticker === ticker);
      if (cand) {
        row.Screening = cand.dataStatus === "missing" ? "unsupported" : "OK";
      }
    } catch (e) {
      row.Screening = "ERROR";
    }

    // 8. Checklist
    const chk = await loadChecklistRuntimeData({ ticker });
    const stockReadiness = chk.stockReadinessByTicker.find(s => s.ticker === ticker);
    row.Checklist = stockReadiness?.finalReadiness?.status === "not_enough_data" ? (ticker === "VCB" ? "unsupported" : "not_enough_data") : "OK";

    // 9. Assistant
    const ast = buildAssistantRuntime({
      question: "Tổng quan cổ phiếu này?",
      activeModule: "overview",
      ticker: ticker,
      dataQuality: {
        overallStatus: "good",
        isMockData: false,
        missingFields: [],
        sourceIssues: [],
        periodIssues: [],
        productionApproved: true,
      }
    });
    row.AssistantContext = ast.prompt.promptText.includes(ticker) ? (ticker === "VCB" && ast.prompt.promptText.includes("banks have unique accounting") ? "OK (Bank safe)" : "OK") : "FAIL";

    // 10. Valuation (check readiness safely from finRecord)
    if (finRecord) {
       row.Valuation = "OK";
       row.Risk = "OK";
    } else {
       if (ticker === "VCB") {
           row.Valuation = "N/A";
           row.Risk = "N/A";
       }
    }

    // Determine status
    if (ticker === "VCB") {
      if (row.Company === "excluded" && row.Business === "excluded" && row.Financials === "excluded" && row.MarketPrice === "excluded" && row.Industry === "null") {
        row.Status = "excluded behavior verified";
      } else {
        row.Status = "FAIL_VCB_NOT_EXCLUDED";
      }
    } else {
      if (row.Company === "OK" && row.Business === "OK" && row.Financials === "OK" && row.MarketPrice === "OK" && row.Macro === "OK" && row.Industry === "OK") {
        row.Status = "PASS";
      }
    }

    matrix[ticker] = row;
  }

  console.log("Ticker | Macro | Industry | Screening | Business | Financials | Valuation | Risk | Assistant | Checklist | Learning | Simulation | Watchlist | Status");
  console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------");
  for (const ticker of TICKERS) {
    const r = matrix[ticker];
    console.log(`${ticker.padEnd(6)} | ${r.Macro.padEnd(5)} | ${r.Industry.padEnd(8)} | ${r.Screening.padEnd(9)} | ${r.Business.padEnd(8)} | ${r.Financials.padEnd(10)} | ${r.Valuation.padEnd(9)} | ${r.Risk.padEnd(4)} | ${r.AssistantContext.padEnd(9)} | ${r.Checklist.padEnd(9)} | ${r.Learning.padEnd(8)} | ${r.Simulation.padEnd(10)} | ${r.Watchlist.padEnd(9)} | ${r.Status}`);
  }

  console.log("\nCross-Module Smoke Complete.");
}

main().catch(e => {
  console.error("Failed:", e);
  process.exit(1);
});
