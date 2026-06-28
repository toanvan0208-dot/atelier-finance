# Phase 145Z — MarketPrice daily refresh confirm-write and assistant-readiness smoke

## Objective
The goal of this phase was to verify that the backend job can persist 25 rows of `MarketPrice` and corresponding `MarketPriceProvenanceMetadata` directly into the staging database and perform an audit on the AI assistant context readiness to consume this data, specifically checking whether the required guardrails and provenance metadata injections are in place.

## Constraints & Context
- **No Production Write/Deploy**: This test was isolated to the staging database using a manual script.
- **Strict Provenance**: Used `"candidate_provider_data"` (for `MarketPriceProvenanceMetadata.dataMode` and `"research_only"` for `MarketPrice.dataMode`) and `"undocumented_provider"`. `needsReview` was explicitly forced to `true`.
- **No Investment Advice Guardrail Verification**: Ensure there is no hallucination of target prices, recommendations, or official statuses within the assistant.
- **Expected Metrics**: 
  - `postWriteMarketPriceRowCount`: 110 (up from 85).
  - `postWriteProvenanceRowCount`: 115 (up from 90).

## Execution

### 1. Confirm-Write Script (`scripts/confirm-write-market-price-daily-provider-refresh.ts`)
The script successfully pulled the last 5 days of data for the 5 target tickers (FPT, HPG, MSN, MWG, VNM) using the vnstock Python library. It correctly avoided duplicate rows and successfully mapped the data models.

Execution summary:
```text
phase: 145Z
mode: market_price_daily_refresh_confirm_write
confirmWrite: true
providerFetchAttempted: true
providerFetchSucceeded: true
tickersChecked: FPT, HPG, VNM, MSN, MWG
candidateMarketPriceRows: 25
candidateProvenanceRows: 25
candidateRowsValidForSchema: 25
preWriteMarketPriceRowCount: 85
preWriteProvenanceRowCount: 90
rowsAlreadyExist: 0
rowsWouldInsert: 25
rowsWouldUpdate: 0
rowsBlocked: 0
rowsInsertedMarketPrice: 25
rowsInsertedProvenance: 25
postWriteMarketPriceRowCount: 110
postWriteProvenanceRowCount: 115
productionApprovedTrueCount: 0
needsReviewTrueCount: 25
```

### 2. Post-Write Smoke Verification (`scripts/smoke-market-price-daily-refresh-after-write.ts`)
The read-path smoke script successfully verified that the exact expected number of rows existed in staging.

Execution summary:
```text
marketPriceRowCount: 110
provenanceRowCount: 115
expectedMarketPriceRowCount: 110
expectedProvenanceRowCount: 115
rowCountMatched: true
tickersChecked: FPT, HPG, VNM, MSN, MWG
marketPriceRowsAvailableForTickers: FPT, HPG, MSN, MWG, VNM
provenanceRowsAvailableForTickers: FPT, HPG, MSN, MWG, VNM
productionApprovedTrueCount: 0
needsReviewTrueCount: 20
technicalReadPathChecked: true
technicalReadPathOk: true
marketPriceUnitMetadataRowsChanged: 0
readOnlySmokePassed: true
dbWriteAttempted: false
```

### 3. Assistant Readiness Audit (`scripts/audit-assistant-market-price-context-readiness.ts`)
We audited the AI Assistant's code path to check its readiness for `MarketPrice` queries and its guardrail compliance.

Execution summary:
```text
phase: 145Z
mode: assistant_market_price_context_readiness_audit

assistantRouteFound: true
tickerContextSupported: true
marketPriceContextPresent: false
provenanceContextPresent: false
provenanceFieldsPresent: true
guardrailNoInvestmentAdvicePresent: false
forbiddenCopyRiskDetected: false
assistantReadyForMarketPriceQuestions: false
assistantReadyForProductionApproval: false
gaps: MarketPrice data is not being injected into assistant context. | MarketPrice provenance metadata is not being injected into assistant context. | No explicit guardrail found against giving investment advice (buy/sell/hold).
recommendedNextPhase: Phase 146A — Assistant MarketPrice/provenance context integration
```

## Conclusions
- **Ingestion Pipeline**: The daily auto-refresh pipeline logic is successfully mapping `MarketPrice` and `MarketPriceProvenanceMetadata` schemas in a strict format compatible with our "real product" requirements.
- **Database Integrity**: Staging database correctly persists relationships between `MarketPrice` and provenance metadata through the `@@unique([ticker, marketDate, sourceLabel])` key.
- **AI Assistant Read Path**: As highlighted in the audit gaps, the Assistant is currently disconnected from `MarketPrice`. Before users can query prices or before we deploy to production, we must explicitly inject `MarketPrice` + Provenance metadata and enforce non-investment-advice guardrails.

## Next Steps
Proceed to **Phase 146A — Assistant MarketPrice/provenance context integration** to inject `MarketPrice` data into the assistant payload and establish explicit guardrails preventing investment advice generation.
