import { loadAssistantMarketPriceContext } from "../src/features/assistant/lib/assistant-market-price-context";
import { buildAssistantPrompt } from "../src/lib/ai-rag/prompts/build-assistant-prompt";
import { prisma } from "../src/lib/database/client";

async function smokeTest() {
  console.log("phase: 146A");
  console.log("mode: assistant_market_price_context_smoke");

  const tickersToCheck = ["FPT", "HPG", "VNM", "MSN", "MWG"];
  console.log(`tickersChecked: ${tickersToCheck.join(", ")}`);

  let marketPriceContextPresent = false;
  let provenanceContextPresent = false;
  let requiredProvenanceFieldsPresent = false;
  let productionApprovedTrueCount = 0;
  let needsReviewTrueCount = 0;
  let warningCodesReadable = false;
  let guardrailNoInvestmentAdvicePresent = false;
  let forbiddenCopyDetected = false;

  for (const ticker of tickersToCheck) {
    const context = await loadAssistantMarketPriceContext(ticker);
    if (context.available) {
      marketPriceContextPresent = true;
      if (context.provenance && context.provenance.available) {
        provenanceContextPresent = true;
        if (
          context.provenance.dataMode !== undefined &&
          context.provenance.productionApproved !== undefined &&
          context.provenance.needsReview !== undefined &&
          context.provenance.warningCodes !== undefined &&
          context.latestMarketPrice?.sourceLabel !== undefined &&
          context.provenance.providerType !== undefined
        ) {
          requiredProvenanceFieldsPresent = true;
        }

        if (context.provenance.productionApproved === true) {
          productionApprovedTrueCount++;
        }
        if (context.provenance.needsReview === true) {
          needsReviewTrueCount++;
        }
        if (Array.isArray(context.provenance.warningCodes)) {
          warningCodesReadable = true;
        }
      }
    }
  }

  // Test prompt guardrails
  const promptInput = {
    userQuestion: "Giá FPT hiện tại là bao nhiêu? Có nên mua không?",
    activeModule: "overview" as const,
    ticker: "FPT",
    moduleContext: {
      ticker: "FPT",
      marketPriceContext: await loadAssistantMarketPriceContext("FPT")
    }
  };

  const promptResult = buildAssistantPrompt(promptInput);
  const promptText = promptResult.promptText.toLowerCase();

  if (
    promptText.includes("never recommend buy/sell/hold") &&
    promptText.includes("not production-approved or needs review") &&
    promptText.includes("warningcodes")
  ) {
    guardrailNoInvestmentAdvicePresent = true;
  }

  if (
    promptText.includes("official data") ||
    promptText.includes("verified data") ||
    promptText.includes("bạn nên mua") ||
    promptText.includes("đây là dữ liệu chính thức")
  ) {
    forbiddenCopyDetected = true;
  }

  const assistantReadyForMarketPriceQuestions =
    marketPriceContextPresent &&
    provenanceContextPresent &&
    requiredProvenanceFieldsPresent &&
    guardrailNoInvestmentAdvicePresent &&
    !forbiddenCopyDetected;

  const smokePassed = assistantReadyForMarketPriceQuestions && productionApprovedTrueCount === 0;

  console.log(`marketPriceContextPresent: ${marketPriceContextPresent}`);
  console.log(`provenanceContextPresent: ${provenanceContextPresent}`);
  console.log(`requiredProvenanceFieldsPresent: ${requiredProvenanceFieldsPresent}`);
  console.log(`productionApprovedTrueCount: ${productionApprovedTrueCount}`);
  console.log(`needsReviewTrueCount: ${needsReviewTrueCount}`);
  console.log(`warningCodesReadable: ${warningCodesReadable}`);
  console.log(`guardrailNoInvestmentAdvicePresent: ${guardrailNoInvestmentAdvicePresent}`);
  console.log(`forbiddenCopyDetected: ${forbiddenCopyDetected}`);
  console.log(`assistantReadyForMarketPriceQuestions: ${assistantReadyForMarketPriceQuestions}`);
  console.log(`dbWriteAttempted: false`);
  console.log(`smokePassed: ${smokePassed}`);
  
  await prisma.$disconnect();
}

smokeTest().catch(console.error);
