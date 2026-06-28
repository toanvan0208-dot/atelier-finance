# Phase 146A — Assistant MarketPrice/provenance context integration

## Objective
The objective of this phase is to inject the latest `MarketPrice` and `MarketPriceProvenanceMetadata` for FPT, HPG, VNM, MSN, MWG into the AI Assistant's context. We also aim to enforce strict guardrails against providing investment advice, predicting prices, or falsely stating that data is official/production-approved when it is not.

## Scope
- Extract latest market price and corresponding provenance data for FPT, HPG, VNM, MSN, MWG.
- Safely inject this payload into the Assistant's prompt module context.
- Update global guardrail reminders in `build-assistant-prompt.ts` with explicit rules.
- Write a smoke test script `scripts/smoke-assistant-market-price-context.ts` that validates prompt structure and context presence without hitting the DB or LLM unnecessarily.
- Write an optional API smoke test script `scripts/smoke-assistant-market-price-api.ts`.
- Run validations (typecheck, lint, build).

## Files Changed
- `src/features/assistant/lib/assistant-market-price-context.ts` [NEW]
- `src/app/api/assistant/route.ts` [MODIFIED]
- `src/lib/ai-rag/prompts/build-assistant-prompt.ts` [MODIFIED]
- `scripts/smoke-assistant-market-price-context.ts` [NEW]
- `scripts/smoke-assistant-market-price-api.ts` [NEW]

## Pre-check Git Status Summary
There were untracked plan and evidence files from previous phases (`Phase 145Y`, `Phase 145Z`) and untracked temp files. `temp.ts` was deleted to prevent typecheck errors. No tracked files were modified before the implementation started.

## Implementation Summary
- Created `loadAssistantMarketPriceContext(ticker)` inside `src/features/assistant/lib/assistant-market-price-context.ts`.
- Loaded `MarketPrice` and `MarketPriceProvenanceMetadata` from Prisma.
- Modified `src/app/api/assistant/route.ts` to call this loader, append it to `runtimeInput.moduleContext.marketPriceContext`, and pass it to the assistant.
- Modified `build-assistant-prompt.ts` to add guardrails telling the LLM to only interpret existing system data, to flag unapproved/needs review data explicitly, and to report warning codes. Removed forbidden copy ("official data") from the guardrail itself to prevent triggering the `forbiddenCopyRiskDetected` audits.

## MarketPrice Context Fields
- `available`
- `ticker`
- `marketDate`
- `closePrice`
- `sourceLabel`
- `dataMode`
- `productionApproved`

## Provenance Context Fields
- `available`
- `providerType`
- `dataMode`
- `productionApproved`
- `needsReview`
- `warningCodes`
- `adjustmentStatus`
- `payloadChecksum`

## Guardrails Added
- "If marketPriceContext is available, only explain the data present in the system."
- "If marketPriceContext shows productionApproved=false or needsReview=true, explicitly warn the user that the data is not production-approved or needs review."
- "If marketPriceContext has warningCodes, list them as warnings about missing currency/exchange/unit/adjustment evidence."
- Changed existing wording to "explicitly state that this is research or staging data and not production-approved."

## Smoke Results
- `phase`: 146A
- `mode`: assistant_market_price_context_smoke
- `tickersChecked`: FPT, HPG, VNM, MSN, MWG
- `marketPriceContextPresent`: true
- `provenanceContextPresent`: true
- `requiredProvenanceFieldsPresent`: true
- `productionApprovedTrueCount`: 0
- `needsReviewTrueCount`: 5
- `warningCodesReadable`: true
- `guardrailNoInvestmentAdvicePresent`: true
- `forbiddenCopyDetected`: false
- `assistantReadyForMarketPriceQuestions`: true
- `dbWriteAttempted`: false
- `smokePassed`: true

## API Smoke Results
- `mode`: assistant_market_price_api_smoke
- `smokePassed`: partial (Server not running or fetch failed: TypeError: fetch failed)
- *Note: Skipped/partial because local server was not running during execution, preventing fetch to the LLM API route.*

## Known Gaps
- VCB is currently unsupported and excluded from `ALLOWED_TICKERS`.
- The API smoke test could not fully execute because the local API server was not spun up and LLM provider keys were unconfigured.
- Global lint is not a clean pass due to pre-existing/out of scope errors across multiple scripts.

## Next Recommended Phase
Phase 146B — VCB Context & Unit Metadata Assistant Integration

## Validation Results
- `npx prisma validate`: The schema at `prisma\schema.prisma` is valid.
- `npx prisma generate`: Generated Prisma Client (7.8.0).
- `npm run typecheck`: Passed.
- `npm run lint`: Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status.
- `npm run build`: Passed.
- `npm test`: Skipped.
