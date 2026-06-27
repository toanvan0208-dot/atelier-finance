# Phase 145H — MarketPrice Metadata Gap and DB Migration Readiness

## 1. Phase Summary
- Phase 145H combines provider metadata gap closure and DB migration readiness.
- No provider import.
- No data seed.
- No `productionApproved=true`.
- No production deploy.
- DB data write: no.
- Schema migration deferred due to database drift.

## 2. 145G Starting Point
- real provider payload succeeded
- 90 real payload candidate rows
- fallback not used
- adjustmentEvidenceFound=false
- readyForWritePath=false

## 3. Provider Metadata Gap Result
- **payloadRowsInspected**: 90
- **tickersChecked**: FPT, HPG, VNM, MSN, MWG
- **Price/Volume coverage**: `priceFieldsFound=true`, `volumeFieldsFound=true`
- **Timestamp/TradingDate coverage**: `timestampFieldsFound=true`, `tradingDateFieldsFound=true`
- **Currency/Exchange/Unit coverage**: Missing (`currencyEvidenceFound=false`, `exchangeEvidenceFound=false`, `unitEvidenceFound=false`)
- **Adjustment evidence**: Missing (`adjustmentEvidenceFound=false`)
- **Staleness rule applied**: compare latest tradingDate to current market close.
- **Checksum/importRunId result**: checksumGeneratedCount=90, importRunIdGenerated=true
- **Metadata gaps remaining**: 4 gaps (currency, exchange, unit, adjustment).

## 4. Adjustment Status Decision
- **adjustmentStatusDecision**: needs_review
- **Reason**: The raw provider payload from VNStock does not explicitly flag if the `close` values are adjusted for dividends/splits or unadjusted.
- **Default Avoidance**: The default assumption of `adjusted` was avoided. Valuation models will fail safely rather than calculating incorrect P/E ratios on unadjusted denominators.

## 5. Staleness/Freshness Decision
- **Staleness rule applied**: Compare latest `tradingDate` to current market close.
- **Result**: `needs_review`
- Data is not guaranteed real-time; it is provider-frequency updated.

## 6. DB Migration Readiness Result
- **prismaValidate result**: true
- **migrateStatus result**: false (Drift detected)
- **driftDetected**: true
- **driftSummary**: `IndustryContext` and `MacroContext` tables and indices exist in the staging DB but are not synchronized with the Prisma migration history.
- **dataLossRisk**: true (Running `prisma migrate dev` attempts to drop/reset the database)
- **sidecarMigrationSafe**: false (Schema is dirty)
- **migrationRecommendedNow**: false
- **migrationBlockedReason**: Database schema drift detected by migrate status. Staging DB contains tables not tracked in migrations, preventing a clean `migrate dev --create-only` without data loss.

## 7. Schema Decision
- **Migration created**: no
- **Reason**: Schema migration deferred because `prisma migrate status` detected drift. Forcing a migration would prompt a database reset and cause data loss on staging.
- **Files changed**: none (Reverted `prisma/schema.prisma` edits to keep workspace clean).
- **Data write**: no
- **productionApproved changed**: no

## 8. Guardrail Checks
- No DB data write
- No `productionApproved=true`
- No `research_only` promotion
- No fallback-as-real
- No missing-to-zero
- No default `adjusted` assumption
- No real-time guarantee
- `VCB` excluded/unsupported

## 9. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/inspect-market-technical-provider-metadata-gaps.ts
node scripts/run-staging.mjs npx tsx scripts/check-market-price-provenance-migration-readiness.ts
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm test
```
All static validations pass cleanly. `npm test` is not a clean pass.
Failure classified as local PostgreSQL temp test DB infrastructure issue only.

## 10. Recommended Next Phase
Phase 145I — Staging DB drift cleanup / migration readiness fix
