# ADR: Market Price Adjustment Evidence

**Status**: accepted-for-staging-only  
**Decision Date**: 2026-06-28

## Context
Atelier Finance fetches historical daily market prices to support beginner-friendly financial education. We are currently utilizing `vnstock` as a candidate provider to fetch this data for a small universe of tickers (FPT, HPG, VNM, MSN, MWG). During Phase 146E, we successfully normalized basic metadata (currency, exchange, price, and volume units). However, the provider payload fundamentally lacks any explicit flags or fields indicating whether historical prices are adjusted for stock splits or dividends.

## Problem
In financial analysis, knowing whether historical prices are adjusted or unadjusted is critical. A sudden drop in an unadjusted price due to a 2:1 stock split might falsely be interpreted as a massive sell-off. Without explicit evidence from the provider payload, we cannot safely guarantee the adjustment status of the data.

## Options Considered

1. **Keep `needsReview=true` and `MISSING_ADJUSTMENT_EVIDENCE`**: Continue to flag the data as lacking evidence and enforce non-production status. The Assistant warns users accordingly.
2. **Manual Mapping JSON**: Create a hardcoded mapping that forces adjustment status for specific tickers based on manual verification of corporate actions.
3. **Change Provider**: Seek an alternative API or data vendor that officially documents its adjustment methodology and explicitly includes adjustment status in its payloads.
4. **Ignore the Missing Data**: Assume the prices are adjusted without evidence. (Rejected immediately due to safety guardrails).

## Decision
**Option 1** is accepted for now. We will keep `MISSING_ADJUSTMENT_EVIDENCE` and `needsReview=true` for `vnstock` candidate MarketPrice data. We will not use this data to make official or verified claims, and we will continue to rely on the Assistant's guardrails to explicitly warn users about the lack of production-readiness. 

## Consequences
- The system remains completely safe and does not mislead users with unverified data.
- The `vnstock` provider remains classified as `candidate_provider_data`.
- The `readyForScheduledJobPhase` and `readyForProductionApproval` gates remain strictly `false`.
- The Assistant must continuously output warnings when citing market price data.

## Production Gates Affected
- `adjustmentEvidenceAvailable=false`
- `providerProfileDocumented=false`
- `readyForProductionApproval=false`
- `readyForScheduledJobPhase=false`

## What Would Change This Decision
- Procuring a new data vendor that provides SLA-backed historical market prices with explicit adjustment flags.
- Establishing a reliable, automated, and verified manual mapping pipeline that cross-references corporate actions from an official source.

## Next Steps
- Implement the staging scheduled dry-run orchestration to prepare the infrastructure without violating the safety guardrails.
- In future phases, investigate implementing a scalable ticker universe registry or evaluating alternative robust data providers.
