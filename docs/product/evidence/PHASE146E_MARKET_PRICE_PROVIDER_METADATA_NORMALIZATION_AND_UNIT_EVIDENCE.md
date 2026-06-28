# Phase 146E — MarketPrice Provider Metadata Normalization and Unit Evidence Hardening

## Overview
Phase 146E addressed the critical missing metadata from the `vnstock` market price provider payload. The raw provider data lacked currency, exchange, price/volume unit definitions, and adjustment evidence. We introduced a normalization layer to heuristically infer candidate metadata based on known constraints of the Vietnam stock market, while leaving the rigorous adjustment evidence as `needsReview`.

## Accomplishments

### 1. MarketPrice Provider Metadata Normalization (`candidate_provider_data`)
- Created `market-price-provider-metadata-normalization.ts` which maps undocumented `vnstock` payload to a formal `MarketPriceProvenanceMetadata` structure.
- **Inferred Candidate Metadata**:
  - `currency`: Inferred as `VND`
  - `priceUnit`: Inferred as `vnd_per_share`
  - `volumeUnit`: Inferred as `shares`
  - `exchange`: Inferred as `HOSE` based on the accepted tickers (`FPT`, `HPG`, `VNM`, `MSN`, `MWG`, excluding `VCB`)
- **Metadata State**: Normalization output forces `needsReview=true` and `productionApproved=false` with the `MISSING_ADJUSTMENT_EVIDENCE` warning code.
- Successfully applied the dry-run and confirm-write updates to the staging DB (115 rows updated).

### 2. Evidence Hardening & Safety Integrity
- **Staging Verification**: Executed `smoke-market-price-provider-metadata-normalization.ts` to verify the state of DB entries post-write. All expected `needsReview` and `warningCodes` are correctly enforced.
- **Assistant API Guardrails**: Ran `smoke-assistant-market-price-api.ts`. The assistant seamlessly continues to mention "dữ liệu hiện có", and explicitly warns the user that the data is not production approved and needs review, upholding the core guardrail against giving unverified or misleading advice. The LLM appropriately captured the missing evidence warnings by stating the data needs "lưu ý", "xem xét", "kiểm tra thêm". 
- Validated that the Assistant does NOT attempt to output exact trading actions (buy/sell).

### 3. Readiness Gates Updated
- Updated `docs/product/MARKET_PRICE_DAILY_REFRESH_PRODUCTION_READINESS_GATES.md` to formally document the current state.
- `readyForScheduledJobPhase`: remains **false** because adjustment evidence is still fundamentally missing from the `vnstock` provider and `NODE_TLS_REJECT_UNAUTHORIZED=0` is required for local execution.

## Next Phase Recommendation (Phase 146F)
Based on the success of the metadata inference layer, the system has achieved maximum normalization without a formal data vendor contract. The Assistant behaves safely, warning the user about the remaining unverified gaps.

**Recommendation for Phase 146F**:
1. Evaluate if a robust metadata provider or a manual mapping JSON can be introduced to formally supply the missing adjustment evidence for the specific tickers.
2. Consider whether a cron scheduling orchestration layer (staging-only) should be built next, operating under the known `needsReview` constraints.
3. Keep `productionApproved=false` and `readyForScheduledJobPhase=false` until a secure environment without `NODE_TLS_REJECT_UNAUTHORIZED=0` is available and formal provider documentation exists.
