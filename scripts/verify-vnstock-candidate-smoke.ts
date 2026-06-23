import { loadFinancialsRuntimeData } from "../src/features/financials/lib/load-financials-runtime-data";
import { getLatestMarketPrice } from "../src/lib/database/services/market-price-service";
import { buildControlledValuationIntegrationBoundary } from "../src/features/valuation/lib/controlled-valuation-integration-boundary";

import { buildAssistantScreenContextPacket } from "../src/components/layout/assistant-screen-context";
import { buildAssistantPrompt } from "../src/lib/ai-rag/prompts/build-assistant-prompt";


const run = async () => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
  const tickers = ["FPT", "MWG", "VNM", "HPG", "VCB", "MSN"];

  console.log("=== PHASE 138I VERIFICATION SCRIPT ===\n");

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
    console.log(`[VALUATION] Can Claim Valuation DB Backed: ${valuationBoundary.sourceBoundary.canClaimValuationDbBacked}`);
    console.log(`[VALUATION] PE Status: ${valuationBoundary.calculation.metrics.pe.status}`);
    console.log(`[VALUATION] PE Value: ${valuationBoundary.calculation.metrics.pe.value}`);
    console.log(`[VALUATION] Market Cap: ${valuationBoundary.calculation.metrics.marketCap.value}`);
    // Only access if defined
    console.log(`[VALUATION] Has Debt/Equity calc: ${valuationBoundary.calculation.metrics.debtToEquity !== undefined}`);



    // 4. Assistant Context
    const packet = buildAssistantScreenContextPacket({
      activeModule: "valuation",
      ticker,
      financialsRuntimeData: runtimeData
    });
    const prompt = buildAssistantPrompt({
      activeModule: "valuation",
      userQuestion: "Is this stock cheap?",
      ticker,
      contextPacket: packet,
      dataQuality: packet.dataQuality
    });
    
    console.log(`\n[ASSISTANT] Included Missing Fields: ${packet.missingFields.join(", ")}`);
    console.log(`[ASSISTANT] Prompt includes "productionApproved: false": ${prompt.promptText.includes("Production approved: no")}`);
    console.log(`[ASSISTANT] Prompt includes "vnstock_financials_candidate" or "phase109": ${prompt.promptText.includes("vnstock_financials_candidate") || prompt.promptText.includes("phase109_controlled_local_financials")}`);
    console.log(`[ASSISTANT] Prompt block "Missing fields" lists totalDebt (if applicable): ${prompt.promptText.includes("- totalDebt")}`);
  }
};

run().catch(console.error);
