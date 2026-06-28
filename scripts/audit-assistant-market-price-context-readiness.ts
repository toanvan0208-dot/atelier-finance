import fs from 'fs';
import path from 'path';

function auditAssistant() {
    const mode = "assistant_market_price_context_readiness_audit";
    console.log(`phase: 145Z\nmode: ${mode}\n`);

    const routePath = path.join(__dirname, '../src/app/api/assistant/route.ts');
    const routeContent = fs.existsSync(routePath) ? fs.readFileSync(routePath, 'utf8') : '';
    
    const contextBuilderPath = path.join(__dirname, '../src/lib/ai-rag/context.ts');
    const contextBuilderContent = fs.existsSync(contextBuilderPath) ? fs.readFileSync(contextBuilderPath, 'utf8') : '';

    const promptsPath = path.join(__dirname, '../src/lib/ai-rag/prompts.ts');
    const promptsContent = fs.existsSync(promptsPath) ? fs.readFileSync(promptsPath, 'utf8') : '';

    const assistantRouteFound = fs.existsSync(routePath);
    const tickerContextSupported = routeContent.includes('body.ticker') || routeContent.includes('contextPacket?.ticker');
    
    const marketPriceContextPresent = contextBuilderContent.includes('MarketPrice') || promptsContent.includes('MarketPrice');
    const provenanceContextPresent = contextBuilderContent.includes('MarketPriceProvenance') || promptsContent.includes('MarketPriceProvenance');
    
    // Check if provenance fields are in context builder
    const provenanceFieldsPresent = 
        contextBuilderContent.includes('dataMode') || 
        promptsContent.includes('dataMode') ||
        routeContent.includes('dataMode');

    // Guardrail against investment advice
    const guardrailNoInvestmentAdvicePresent = 
        promptsContent.toLowerCase().includes('investment advice') || 
        promptsContent.toLowerCase().includes('not a financial advisor') ||
        promptsContent.toLowerCase().includes('buy/sell/hold');

    const forbiddenCopyRiskDetected = 
        promptsContent.toLowerCase().includes('official data') || 
        promptsContent.toLowerCase().includes('verified data');

    const assistantReadyForMarketPriceQuestions = marketPriceContextPresent && provenanceContextPresent;
    
    const gaps: string[] = [];
    if (!marketPriceContextPresent) gaps.push("MarketPrice data is not being injected into assistant context.");
    if (!provenanceContextPresent) gaps.push("MarketPrice provenance metadata is not being injected into assistant context.");
    if (!guardrailNoInvestmentAdvicePresent) gaps.push("No explicit guardrail found against giving investment advice (buy/sell/hold).");

    console.log(`assistantRouteFound: ${assistantRouteFound}`);
    console.log(`tickerContextSupported: ${tickerContextSupported}`);
    console.log(`marketPriceContextPresent: ${marketPriceContextPresent}`);
    console.log(`provenanceContextPresent: ${provenanceContextPresent}`);
    console.log(`provenanceFieldsPresent: ${provenanceFieldsPresent}`);
    console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
    console.log(`forbiddenCopyRiskDetected: ${forbiddenCopyRiskDetected}`);
    console.log(`assistantReadyForMarketPriceQuestions: ${assistantReadyForMarketPriceQuestions}`);
    console.log(`assistantReadyForProductionApproval: false`);
    console.log(`gaps: ${gaps.length > 0 ? gaps.join(" | ") : "none"}`);
    console.log(`recommendedNextPhase: Phase 146A — Assistant MarketPrice/provenance context integration`);
}

auditAssistant();
