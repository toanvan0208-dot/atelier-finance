# MarketPrice Daily Refresh Production-Readiness Gates

## Current Status
- `readyForProductionApproval`: **false**
- `readyForScheduledJobPhase`: **false** (in production context)

## Why not production-ready yet
The system has a functional dry-run orchestration layer and the ability to fetch data. However, the data source (`vnstock`) is currently classified as `undocumented_provider` with `needsReview=true` and `productionApproved=false`. Furthermore, critical unit and evidence metadata (currency, exchange, price/volume units, adjustment evidence) are entirely missing from the provider's payload. The environment relies on a workaround (`NODE_TLS_REJECT_UNAUTHORIZED=0`) that is unacceptable for production. Also, VCB/Bank data is unsupported.

## Required Gates Before Enabling Real Schedule

### 1. Required Provider Documentation
- `providerProfileDocumented=true`: The data provider (`vnstock`) must have a fully documented profile detailing its source reliability, usage terms, and API stability guarantees.

### 2. Required Metadata Verification
The following metadata fields must be populated accurately and verified:
- `currencyAvailable=true`
- `exchangeAvailable=true`
- `priceUnitAvailable=true`
- `volumeUnitAvailable=true`

### 3. Required Adjustment Evidence
- `adjustmentEvidenceAvailable=true`: Historical prices must clearly document whether they are split/dividend adjusted or unadjusted.

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
