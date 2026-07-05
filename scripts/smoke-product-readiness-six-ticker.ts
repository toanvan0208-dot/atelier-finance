import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { getLatestMarketPrice } from "../src/lib/database/services/market-price-service";
import { buildControlledValuationIntegrationBoundary } from "../src/features/valuation/lib/controlled-valuation-integration-boundary";
import { buildAssistantScreenContextPacket } from "../src/components/layout/assistant-screen-context";
import { buildAssistantPrompt } from "../src/lib/ai-rag/prompts/build-assistant-prompt";
import { buildRiskFinancialsRuntimeReadiness } from "../src/features/risk/lib/risk-financials-runtime-readiness";

import { requirePostgresDatabaseUrl } from "./lib/supabase-env";
const run = async () => {
  requirePostgresDatabaseUrl("smoke-product-readiness-six-ticker.ts");
  const tickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];

  console.log("=== PHASE 140A PRODUCT READINESS SMOKE & UX GAP AUDIT ===\n");

  const results = [];

  for (const ticker of tickers) {
    console.log(`\n===========================================`);
    console.log(`TICKER: ${ticker}`);
    console.log(`===========================================`);
    
    // 1. Load Financials
    const runtimeData = await loadFinancialsRuntimeData({ ticker }, { readLatestMarketPrice: getLatestMarketPrice });
    console.log(`[FINANCIALS] Source: ${runtimeData.source.sourceLabel}`);
    console.log(`[FINANCIALS] Data Mode: ${runtimeData.source.dataMode}`);
    console.log(`[FINANCIALS] Production Approved: ${runtimeData.source.productionApproved}`);
    console.log(`[FINANCIALS] EPS: ${runtimeData.statementSnapshot?.eps}`);
    console.log(`[FINANCIALS] sharesOutstanding: ${runtimeData.statementSnapshot?.sharesOutstanding}`);
    console.log(`[FINANCIALS] totalDebt: ${runtimeData.statementSnapshot?.totalDebt}`);
    
    const marketPriceRecord = await getLatestMarketPrice(ticker, { dataMode: "research_only" });
    const marketPrice = marketPriceRecord ? Number(marketPriceRecord.closePrice) : 50000;

    // 2. Valuation Boundary
    const valuationBoundary = buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: {
        dataMode: runtimeData.source.dataMode,
        equity: runtimeData.statementSnapshot?.totalEquity,
        eps: runtimeData.statementSnapshot?.eps,
        asOf: runtimeData.source.asOf,
        fallbackUsed: runtimeData.source.fallbackUsed,
        fiscalYear: runtimeData.source.fiscalYear,
        period: runtimeData.statementSnapshot?.period,
        periodType: runtimeData.source.periodType,
        productionApproved: runtimeData.source.productionApproved,
        readPath: runtimeData.source.readPath,
        revenue: runtimeData.statementSnapshot?.revenue,
        runtimeStatus: runtimeData.runtimeStatus,
        sharesOutstanding: runtimeData.statementSnapshot?.sharesOutstanding,
        sourceLabel: runtimeData.source.sourceLabel,
        units: {
          equity: runtimeData.unitMetadata.equity.unit,
          eps: runtimeData.unitMetadata.eps.unit,
          revenue: runtimeData.unitMetadata.revenue.unit,
          sharesOutstanding: runtimeData.unitMetadata.sharesOutstanding.unit,
        },
      },
      persistedValuationInputs: {
        marketPrice,
        units: { marketPrice: "vnd_per_share" },
      },
    });

    console.log(`\n[VALUATION] Valuation Source Mode: ${valuationBoundary.sourceBoundary.valuationSourceMode}`);
    console.log(`[VALUATION] PE Status: ${valuationBoundary.calculation.metrics.pe.status}`);
    console.log(`[VALUATION] Market Cap: ${valuationBoundary.calculation.metrics.marketCap.value}`);

    // 3. Risk Boundary
    const riskReadiness = buildRiskFinancialsRuntimeReadiness({ financialsRuntimeData: runtimeData, riskConsumesFinancialsRuntime: true });
    console.log(`\n[RISK] Readiness Status: ${riskReadiness.calculationReadiness}`);
    console.log(`[RISK] Blocked Reasons: ${riskReadiness.blockedReasons.join("; ")}`);

    // 4. Assistant Context
    const packet = buildAssistantScreenContextPacket({
      activeModule: "overview",
      ticker,
      financialsRuntimeData: runtimeData
    });
    const prompt = buildAssistantPrompt({
      activeModule: "overview",
      userQuestion: "Is this stock good to buy?",
      ticker,
      contextPacket: packet,
      dataQuality: packet.dataQuality
    });
    
    console.log(`\n[ASSISTANT] Included Missing Fields: ${packet.missingFields.join(", ")}`);
    console.log(`[ASSISTANT] Context mentions productionApproved: false: ${prompt.promptText.includes("Production approved: no")}`);
    console.log(`[ASSISTANT] Safe from recommendation language: ${prompt.promptText.includes("Never recommend buy/sell/hold")}`);
    console.log(`[ASSISTANT] Mentions bank caveat for VCB: ${ticker === "VCB" ? prompt.promptText.toLowerCase().includes("bank") : "N/A"}`);

    results.push({
      ticker,
      source: runtimeData.source.sourceLabel,
      epsStatus: runtimeData.statementSnapshot?.eps ? "present" : "missing",
      sharesOutstandingStatus: runtimeData.statementSnapshot?.sharesOutstanding ? "present" : "missing",
      totalDebtStatus: runtimeData.statementSnapshot?.totalDebt ? "present" : (ticker === "VCB" ? "needs_bank_mapping" : "missing"),
      productionApproved: runtimeData.source.productionApproved,
    });
  }

  // 5. Output Source Matrix JSON
  console.log(`\n[SOURCE_MATRIX_JSON]`);
  console.log(JSON.stringify(results, null, 2));
};

run().catch(console.error);
