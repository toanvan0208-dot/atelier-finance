# MarketPrice Daily Refresh Runbook

## Purpose
This runbook outlines the operational steps for managing, monitoring, and executing the daily MarketPrice data refresh job.

## Current Status
- The job operates in **fail-closed, dry-run mode** by default.
- No automated cron scheduling has been enabled yet (future scheduler integration pending).
- The dataset remains as `candidate_provider_data` and is not `productionApproved`.

## Supported Tickers
- FPT
- HPG
- VNM
- MSN
- MWG

## Unsupported Tickers
- VCB (Bank accounting logic requires separate mappings and is strictly excluded).

## Executing the Job

### Dry-run Command
To safely check what data the provider returns without mutating the database:
```bash
npx tsx scripts/orchestrate-market-price-daily-refresh.ts
```

### Confirm-write Command
> **WARNING**: Use this ONLY in local or staging environments. Production execution is disabled until all readiness gates are passed.

To fetch and write the data to the database:
```bash
npx tsx scripts/orchestrate-market-price-daily-refresh.ts --confirm-write
```

## Post-Execution Verification

### 1. How to check row counts
Database row counts are outputted dynamically via the orchestration script. Look for:
- `candidateMarketPriceRows`
- `rowsWouldInsert` / `rowsWouldUpdate`
- `dbWriteAttempted`

### 2. How to check provenance
Data reliability metrics are attached to each row via `MarketPriceProvenanceMetadata`. Observe the orchestration console for:
- `dataModeCounts` (Expect `candidate_provider_data`)
- `providerTypeCounts` (Expect `undocumented_provider`)
- `warningCodeCounts` (Missing currency/exchange/units are logged here).

### 3. How to run Assistant HTTP smoke after refresh
To verify that the AI Assistant processes the newly ingested prices without violating investment advice guardrails:
```bash
node scripts/run-staging.mjs npx tsx scripts/smoke-assistant-market-price-api.ts
```
Ensure `smokePassed: true` and `forbiddenCopyDetected: false`.

### 4. How to interpret warnings
Warnings generated from provenance (e.g. `MISSING_CURRENCY`, `MISSING_EXCHANGE`) indicate an incomplete payload from the upstream provider. The assistant is hardened to explicitly relay these "cảnh báo" / "thiếu" signals to the user.

## Emergency / Maintenance

### Stop / Disable future scheduler
When the cron integration is completed, a feature flag/kill switch will be introduced to suspend execution.

### Failure handling
- **API Unreachable**: The script fails gracefully and skips row creation.
- **Missing Required Ticker**: Handled silently, missing rows are flagged as `needsReview`.

### What NOT to do
- Do not manually execute a `--confirm-write` on Production.
- Do not manually flip `productionApproved` to `true` directly in the database.
- Do not remove the `--confirm-write` safeguard flag from the core logic.
