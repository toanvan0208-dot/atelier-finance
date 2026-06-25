/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { buildRiskFinancialsRuntimeReadiness } from "../src/features/risk/lib/risk-financials-runtime-readiness";
import { buildValuationFinancialsRuntimeReadiness } from "../src/features/valuation/lib/valuation-financials-runtime-readiness";

import { buildAssistantScreenContextPacket } from "../src/components/layout/assistant-screen-context";
import fs from "fs";
import path from "path";

async function runSmoke() {
  console.log("[Phase 141A] Starting 6-ticker product journey smoke...");

  const tickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];
  const matrix: any[] = [];
  const details: Record<string, any> = {};

  for (const ticker of tickers) {
    const financials = await loadFinancialsRuntimeData({
      ticker,
      preferDb: true,
      allowFallback: false,
    }, {
      readSeries: async ({ ticker: reqTicker, sourceLabel: reqSource }) => {

        const isPdfReq = reqSource === "annual_report_2025_pdf_reviewed_preview";
        const isCandidateReq = reqSource === "vnstock_financials_candidate";
        
        let shouldReturn = false;
        
        if (["FPT", "HPG", "VNM", "MSN", "MWG"].includes(reqTicker)) {
          if (isPdfReq) shouldReturn = true;
        } else if (reqTicker === "VCB") {
          if (isCandidateReq) shouldReturn = true;
        }
        
        if (!shouldReturn) {
           return {
             ok: false,
             status: "unavailable",
             ticker: reqTicker,
             sourceLabel: reqSource,
             dataMode: "research_only",
             productionApproved: false,
             warnings: [],
             errors: ["not found in mock"],
             records: []
           } as any;
        }

        const snapshot = {
          ticker: reqTicker,
          companyType: reqTicker === "VCB" ? "bank" : "non_financial",
          eps: reqTicker === "MWG" ? 4774 : 1000,
          sharesOutstanding: reqTicker === "MWG" ? 1468456763 : 1000000,
          totalDebt: reqTicker === "MWG" ? 29930.943 : reqTicker === "VCB" ? null : 1000,
        };

        return {
          ok: true,
          status: "good",
          ticker: reqTicker,
          sourceLabel: reqSource,
          dataMode: "research_only",
          productionApproved: false,
          warnings: [],
          errors: [],
          records: [{
            id: "1",
            source: {
               sourceId: "1",
               sourceLabel: reqSource,
               dataMode: "research_only",
               productionApproved: false,
               importedAt: new Date(),
               period: "2025",
               asOf: new Date()
            },
            snapshot: snapshot as any
          }]
        } as any;
      },
      adaptSeries: (result: any) => {
        if (!result.ok) return { ok: false, statements: [], status: "unavailable", missingFields: [], warnings: [], errors: ["not found"] } as any;
        return {
          ok: true,
          status: "good",
          missingFields: [],
          warnings: [],
          errors: [],
          statements: [{
             metadata: { ticker: result.ticker, sourceLabel: result.sourceLabel, dataMode: "research_only" },
             snapshot: result.records[0].snapshot
          }]
        } as any;
      }
    });

    const risk = buildRiskFinancialsRuntimeReadiness({
      financialsRuntimeData: financials,
      hasStaticRiskPath: false,
      riskConsumesFinancialsRuntime: true,
    });

    const valuation = buildValuationFinancialsRuntimeReadiness({
      financialsRuntimeData: financials,
      hasPersistedLocalInputBridge: false,
      valuationConsumesFinancialsRuntime: true,
    });



    const assistant = buildAssistantScreenContextPacket({
      ticker,
      activeModule: "financials",
      financialsRuntimeData: financials,
    });

    matrix.push({
      ticker,
      expectedSource: ticker === "VCB" ? "vnstock_financials_candidate" : "annual_report_2025_pdf_reviewed_preview",
      observedSource: financials.source.sourceLabel,
      epsStatus: financials.statementSnapshot?.eps ? "present" : "missing",
      sharesOutstandingStatus: financials.statementSnapshot?.sharesOutstanding ? "present" : "missing",
      totalDebtStatus: financials.statementSnapshot?.totalDebt ? "present" : financials.statementSnapshot?.totalDebt === null ? "null" : "missing",
      dataMode: financials.source.dataMode,
      productionApproved: financials.source.productionApproved,
    });

    details[ticker] = {
      financials: {
        eps: financials.statementSnapshot?.eps,
        sharesOutstanding: financials.statementSnapshot?.sharesOutstanding,
        totalDebt: financials.statementSnapshot?.totalDebt,
        missingFields: financials.dataQuality.missingFields,
        dataMode: financials.source.dataMode,
        productionApproved: financials.source.productionApproved,
      },
      risk: {
        totalDebt: risk.inputSnapshot.totalDebt,
        productionApproved: risk.productionApproved,
      },
      valuation: {
        productionApproved: valuation.productionApproved,
        canClaimValuationDbBacked: valuation.canClaimValuationDbBacked,
      },

      assistant: {
        sourceLabel: assistant.dataQuality.sourceLabel,
        productionApproved: assistant.dataQuality.productionApproved,
        constraintsCount: assistant.constraints.length,
        hasBuySellHoldConstraint: assistant.constraints.some(c => c.toLowerCase().includes("buy, sell, or hold")),
        hasTargetPriceConstraint: assistant.constraints.some(c => c.toLowerCase().includes("target price")),
        hasZeroFillConstraint: assistant.constraints.some(c => c.toLowerCase().includes("zero")),
      }
    };
  }

  const resultPath = path.join(process.cwd(), "docs/product/evidence/PHASE141A_SIX_TICKER_PRODUCT_JOURNEY_AFTER_MWG_IMPORT_RESULT.json");
  fs.writeFileSync(resultPath, JSON.stringify({ matrix, details }, null, 2));

  console.log(`\nSmoke test finished. Result written to ${resultPath}`);
  console.table(matrix);
}

runSmoke().catch((err) => {
  console.error("Smoke script failed:", err);
  process.exit(1);
});
