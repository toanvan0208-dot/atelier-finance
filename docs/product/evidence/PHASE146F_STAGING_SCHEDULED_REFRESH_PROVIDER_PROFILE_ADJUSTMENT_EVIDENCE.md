# Phase 146F Evidence: Staging scheduled refresh dry-run wiring, provider profile hardening, and adjustment-evidence decision record

## Goal
Implement a staging scheduled refresh dry-run entrypoint without database mutation capabilities, document the `vnstock` provider profile, formulate a Decision Record (ADR) on missing adjustment evidence, and ensure readiness checks pass for the new staging mode but restrict production usage.

## Changes Made
1. **Staging Entrypoint (`scripts/staging-scheduled-market-price-daily-refresh.ts`)**: Created a wrapper that calls the underlying job but enforces `confirmWrite: false` and explicitly rejects the `--confirm-write` flag.
2. **Smoke Test (`scripts/smoke-staging-scheduled-market-price-refresh-dry-run.ts`)**: Verifies that the new entrypoint executes without mutating the database and confirms safety guards are intact.
3. **VNSTOCK Provider Profile (`docs/product/VNSTOCK_MARKET_PRICE_PROVIDER_PROFILE.md`)**: Formally documented the candidate status, usage scopes, unsupported tickers, and missing adjustment evidence limitations of `vnstock`.
4. **ADR Adjustment Evidence (`docs/product/decisions/ADR_MARKET_PRICE_ADJUSTMENT_EVIDENCE.md`)**: Accepted the `MISSING_ADJUSTMENT_EVIDENCE` status for staging purposes, ensuring strict safety guardrails.
5. **Readiness Gates Audit (`scripts/audit-market-price-scheduled-readiness-gates.ts`)**: Evaluates documentation and code, asserting that `stagingScheduledDryRunReady=true` while `readyForProductionCron=false`.
6. **Documentation**: Updated Runbook, Readiness Gates, and Environment policies to reflect the new staging schedule mode without enabling any production deployments.

## Verification Results

### Validation Commands Run
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run lint
```

### Validation Outcomes
- `prisma validate`: **Passed**. Schema is valid.
- `prisma generate`: **Passed**. Prisma Client generated successfully.
- `typecheck`: **Passed** after a minor fix to an out-of-scope Phase 146E script that threw an error (`Type '{}' is not assignable to type 'never'`).
- `build`: **Passed**. Compiled successfully in 9.5s.
- `lint`: **Failed** due to numerous pre-existing out-of-scope issues (e.g., `prefer-const`, `any` type usage, unused variables across multiple scripts like `smoke-learning-runtime-data.ts`, `smoke-market-price-daily-refresh-job-no-auto-run.ts`, etc.). As requested, this is documented honestly and NOT claimed as a clean pass. The issues are completely unrelated to Phase 146F.

### Script Checks
- `scripts/smoke-staging-scheduled-market-price-refresh-dry-run.ts`: **Passed**. The script successfully bypassed TLS issues, verified row counts remained unchanged (`noWriteVerified: true`), and verified the rejection of `--confirm-write`.
- `scripts/audit-market-price-scheduled-readiness-gates.ts`: **Passed**. Correctly identified that `readyForStagingScheduledDryRun` is true, but `readyForProductionCron` and `readyForProductionApproval` remain false.

## Boundaries Maintained
- **NO production cron**: Not enabled in any file.
- **NO production deploy**: The process is isolated locally/staging.
- **NO DB write**: The dry-run entrypoint strictly prevents database mutations.
- **NO `productionApproved=true`**: Data remains flagged as candidate data requiring review.
- **`MISSING_ADJUSTMENT_EVIDENCE` Kept**: Retained and properly documented in the ADR.
- **VCB Unsupported**: Remains strictly excluded.
- **No Secrets**: No secrets introduced.
