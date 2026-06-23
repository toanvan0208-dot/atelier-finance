# Phase 138I: Valuation and AI Candidate Guardrail Smoke

## Objective

Verify that the VNStock financials candidate data (imported in Phase 138G) correctly feeds into the Valuation and AI Assistant context boundary, and that the missing `totalDebt` field is safely handled without fabricating data.

## Actions Performed

1. Fixed an integration TypeError in `scripts/verify-vnstock-candidate-smoke.ts` that attempted to access undefined risk/valuation boundary properties.
2. Ran the smoke script across the 6 tickers to observe the output of the integration boundaries.
3. Verified the AI prompt builder safely incorporates data quality guardrails for candidate financials.

## Results

### FPT, MWG, VNM (Legacy controlled financials)
- Continue to function exactly as before.
- `totalDebt` is loaded correctly from the `phase109_controlled_local_financials` source.
- P/E ratio, Market Cap, and Risk boundaries behave appropriately.

### HPG, VCB, MSN (VNStock financials candidate)
- **Candidate Data Feed:** Valuation and Risk boundaries successfully consume candidate EPS and sharesOutstanding from the `dev.db`.
- **Valuation Readiness:** Valuation source mode reports `mixed_source`. P/E value and Market Cap successfully calculate based on the candidate fields.
- **Missing Debt Handling:** `totalDebt` safely resolves to `null`.
- **Risk Guardrail:** Risk module metric (e.g., `debtToEquity`) correctly resolves to `undefined` or remains disabled due to the lack of `totalDebt`. Zero-filling does not occur.
- **AI Context Payload:** The `buildAssistantScreenContextPacket` successfully flags the payload with `productionApproved: false`. The system prompt outputs the source payload and explicit warning labels indicating the data is not production-approved.

## Conclusion

The candidate financials data successfully passes the integration boundary smoke checks without violating explicit rules:
- No DB schema or migration changes were made.
- Missing values like totalDebt remained null instead of 0.
- AI system correctly receives all data quality metadata to output appropriate disclaimers.

The Phase 138I implementation is confirmed safe.
