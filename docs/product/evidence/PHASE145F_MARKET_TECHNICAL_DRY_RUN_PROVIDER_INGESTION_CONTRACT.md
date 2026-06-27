# Phase 145F — MarketPrice / Technical Dry-Run Provider Ingestion Contract

## 1. Phase Summary
- Phase 145F is a thin dry-run provider ingestion contract.
- No DB write.
- No seed/import.
- No schema migration.
- No `productionApproved=true`.
- No production deploy.
- A dry-run script was created (`scripts/dry-run-market-technical-provider-ingestion-contract.ts`) to validate the schema gap between existing reads and the new provenance contract.

## 2. Inputs Audited
- Audited scripts: Existing MarketPrice read-paths, Prisma read attempts (`prisma.marketPrice.findMany`).
- Approved tickers: `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
- Excluded ticker: `VCB`
- Provider fetch attempted: `true` (via Prisma local read as a proxy)
- Provider fetch succeeded: `false`
- Source used: `existing_local_contract` (mock fallback) due to known `TlsConnectionError` from the local PostgreSQL test database.

## 3. Candidate Normalization Result
- **candidateRowsNormalized:** 5
- **Fields mapped:** `ticker`, `tradingDate`, `closePrice`, `adjustedClosePrice`, `volume`, `dataMode`, `fallbackUsed`
- **Missing Data Handling:**
  - `missingPriceCount`: 1 (Gracefully parsed as `null`, handled downstream safely)
  - `missingVolumeCount`: 1
  - `missingTimestampCount`: 1
- **Null handling:** Safely bypassed. Empty strings or undefined are forced to `null` to respect Prisma schema. No missing-to-zero conversions were made.

## 4. Provenance Candidate Result
- **provenanceRowsPrepared:** 5
- **DataMode distribution:** `research_only`: 4, `sample`: 1
- **ProviderType:** `undocumented_provider` (since `vnstock` is a web scraper without explicit licensing bounds encoded)
- **StalenessStatus distribution:** `fresh`: 2, `provider_delayed`: 1, `missing`: 1, `stale`: 1
- **AdjustmentStatus distribution:** `adjusted`: 3, `unknown`: 2
- **Checksum / importRunId status:** `checksumGeneratedCount`: 5
- **ProductionApproved Count:** 0
- **FallbackUsed Count:** 1

## 5. Readiness Assessment
- **readyForWritePath:** `false (needs_review due to missing fields/unknown adjustment)`
- **Reason:** Missing fields and `unknown` adjustment statuses prevent automated promotion. The ingestion layer must close the gap on whether the data is actually adjusted or unadjusted, and how to fill timestamps accurately. `productionApprovedCount` correctly remains `0`.

## 6. Guardrail Checks
- No DB write
- No `productionApproved=true`
- No `research_only` promotion
- No `sample/fallback-as-real`
- No missing-to-zero
- No real-time guarantee
- `VCB` excluded/unsupported

## 7. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/dry-run-market-technical-provider-ingestion-contract.ts
node scripts/run-staging.mjs npm test
```
All static validations pass cleanly. `npm test` is not a clean pass.
Failure classified as local PostgreSQL temp test DB infrastructure issue only (`TlsConnectionError`).

## 8. Recommended Next Phase
Phase 145G — MarketPrice / Technical provider payload gap closure
