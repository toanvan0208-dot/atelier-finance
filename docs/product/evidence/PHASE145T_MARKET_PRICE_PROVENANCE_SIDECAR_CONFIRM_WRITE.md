# Phase 145T — Explicitly approved MarketPrice provenance sidecar confirm-write on staging

## Objective
Execute the explicit confirm-write of candidate provenance metadata into the `MarketPriceProvenanceMetadata` table in the Staging environment.

## Context and Guardrails
- **Environment:** Staging
- **Goal:** Populate the provenance sidecar for 5 approved tickers (FPT, HPG, VNM, MSN, MWG) without altering any existing business data (`MarketPrice` or `MarketPriceUnitMetadata`).
- **Real Product Mindset constraints applied:**
  - `productionApproved` remains `false`.
  - Staging database is strictly preserved.
  - Required `--confirm-write` flag to enable actual writing.

## Execution Details
- We rewrote the write and smoke scripts to leverage `pg.Client` directly, bypassing Prisma client initialization issues (TLS self-signed certificate constraints in Node/NextJS scripts connecting to Supabase Pooler).
- Executed `scripts/confirm-write-market-price-provenance-sidecar.ts` with `--confirm-write` flag.
- Executed `scripts/smoke-market-price-provenance-sidecar-after-write.ts` to validate.

## Execution Output

### Write Script Results
```text
Phase 145T - MarketPrice provenance sidecar confirm write

--- RUNNING IN WRITE MODE --- (--confirm-write flag detected)

--- Write Summary ---
phase: 145T
mode: market_price_provenance_sidecar_confirm_write
confirmWrite: true
providerFetchAttempted: true
providerFetchSucceeded: true
tickersChecked: FPT, HPG, VNM, MSN, MWG
candidateProvenanceRows: 90
candidateRowsValidForSchema: 90
preWriteRowCount: 0
rowsInsertedOrUpserted: 90
postWriteRowCount: 90
productionApprovedTrueCount: 0
needsReviewTrueCount: 90
adjustmentStatusCounts: {"needs_review":90}
stalenessStatusCounts: {"stale":90}
dataModeCounts: {"candidate_provider_data":90}
providerTypeCounts: {"undocumented_provider":90}
warningCodeCounts: {"MISSING_CURRENCY":90,"MISSING_EXCHANGE":90,"MISSING_PRICE_UNIT":90,"MISSING_VOLUME_UNIT":90,"MISSING_ADJUSTMENT_EVIDENCE":90}
payloadChecksumGeneratedCount: 90
importRunId: run_1782577818841
targetTable: MarketPriceProvenanceMetadata
tablesWritten: MarketPriceProvenanceMetadata
marketPriceRowsChanged: 0
marketPriceUnitMetadataRowsChanged: 0
dbWriteAttempted: true
businessDataWriteAttempted: true
importAttempted: false
seedAttempted: false
migrationAttempted: false
readyForPostWriteSmoke: true
readyForProductionApproval: false
recommendedNextPhase: Phase 145U — MarketPrice provenance sidecar read-path integration smoke
```

### Post-Write Smoke Test Results
```text
Phase 145T - MarketPrice provenance sidecar post-write smoke

--- Smoke Summary ---
phase: 145T
mode: market_price_provenance_sidecar_post_write_smoke
tableExists: true
rowCount: 90
productionApprovedTrueCount: 0
needsReviewTrueCount: 90
adjustmentStatusCounts: {"needs_review":90}
dataModeCounts: {"candidate_provider_data":90}
providerTypeCounts: {"undocumented_provider":90}
stalenessStatusCounts: {"stale":90}
distinctTickers: FPT, HPG, VNM, MSN, MWG
marketPriceRowCount: 85
marketPriceUnitMetadataRowCount: 0
readOnlySmokePassed: true
```

## Guardrail Verifications
- `rowCount` correctly reflects 90 inserted rows.
- `marketPriceRowCount` remains exactly **85** (0 rows written to core pricing table).
- `productionApprovedTrueCount` is **0** (strictly maintained as `false`).
- `needsReviewTrueCount` is **90** (all candidates require review).
- Correct mapping applied for complex fields (e.g. `warningCodes` as proper `JSONB`).

## Conclusion
Phase 145T is strictly completed. Staging database has successfully received the sidecar records. No production data or core business logic was violated. 

**Recommended Next Phase:** Phase 145U — MarketPrice provenance sidecar read-path integration smoke
