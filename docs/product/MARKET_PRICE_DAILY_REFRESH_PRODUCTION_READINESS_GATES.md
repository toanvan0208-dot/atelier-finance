# MarketPrice Daily Refresh Production-Readiness Gates

## Current Status
- `readyForProductionApproval`: **false**
- `readyForScheduledJobPhase`: **false** (in production context)
- `stagingScheduledDryRunReady`: **true** (via Phase 146F wrapper)

## Why not production-ready yet
The system has a functional staging scheduled dry-run orchestration layer and the ability to fetch data. In Phase 146E, basic provider metadata (currency, exchange, price/volume units) was normalized at a **candidate** level based on logical inferences for the Vietnam market. However, the data source (`vnstock`) remains classified as `undocumented_provider` with `needsReview=true` and `productionApproved=false` (see [VNSTOCK Profile](file:///D:/Codex/atelier-finance/docs/product/VNSTOCK_MARKET_PRICE_PROVIDER_PROFILE.md)). Critical adjustment evidence (split/dividend adjustment status) is still fundamentally missing from the provider's payload and cannot be safely inferred (see [ADR Adjustment Evidence](file:///D:/Codex/atelier-finance/docs/product/decisions/ADR_MARKET_PRICE_ADJUSTMENT_EVIDENCE.md)). The environment relies on a workaround (`NODE_TLS_REJECT_UNAUTHORIZED=0`) that is unacceptable for production. Also, VCB/Bank data is unsupported.

## Required Gates Before Enabling Real Schedule

### 1. Required Provider Documentation
- `providerProfileDocumented=false`: The data provider (`vnstock`) must have a fully documented profile detailing its source reliability, usage terms, and API stability guarantees. An undocumented profile has been drafted.

### 2. Required Metadata Verification
The following metadata fields have been populated at a candidate level but still need formal verification against a documented provider profile:
- `currencyAvailable=true` (inferred as VND)
- `exchangeAvailable=true` (inferred from known tickers)
- `priceUnitAvailable=true` (inferred as vnd_per_share)
- `volumeUnitAvailable=true` (inferred as shares)

### 3. Required Adjustment Evidence
- `adjustmentEvidenceAvailable=false`: Historical prices must clearly document whether they are split/dividend adjusted or unadjusted. Currently marked as `needs_review` with `MISSING_ADJUSTMENT_EVIDENCE` warning code.

### 4. Required Monitoring & Logging
- `monitoringAndAlertingDefined=true`: A robust monitoring system must be in place to detect failed fetch attempts, stale data anomalies, or database write failures.

### 5. Required Rollback / Kill Switch
- `rollbackPlanDefined=true`: A documented plan to roll back faulty daily updates.
- `scheduledJobKillSwitchAvailable=true`: An easily accessible flag/environment variable to quickly disable the scheduled cron job.

### 6. Required Data Review Workflow
- `productionApprovalWorkflowDefined=true`: A manual or semi-automated pipeline must exist to review staging data before flipping `productionApproved` to `true`.

### 7. Required Production Env Handling
- `tlsNoVerifyDisabledInProduction=true`: The `NODE_TLS_REJECT_UNAUTHORIZED=0` workaround must be strictly disabled or scoped only to local/staging. It cannot be present in the production environment.
- `staleDataPolicyDefined=true`: The logic must define an acceptable threshold before data is rejected as hopelessly stale.

### 8. VCB / Bank Coverage
- VCB/bank handling remains unsupported. A separate mapping or exclusion guarantee must be explicitly defined and verified for banking equities.
