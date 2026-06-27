# Phase 145U — MarketPrice provenance sidecar read-path integration smoke

## Objective
Verify the read-path integration for the newly populated `MarketPriceProvenanceMetadata` table in Staging. Ensure the new sidecar table can be read correctly by the application (via Prisma) without any DB writes, data mutation, or alteration of the core `MarketPrice` table.

## Initial State (from Phase 145T)
- Phase 145T successfully inserted 90 candidate provenance rows into Staging.
- `MarketPrice` row count remained exactly 85 rows.
- `MarketPriceUnitMetadata` row count remained exactly 0 rows.
- All provenance rows have `productionApproved=false` and `needsReview=true`.

## Read-Path Implementation
- We created a new dedicated loader `src/features/technical/lib/market-price-provenance-read-path.ts`.
- The loader accesses `MarketPriceProvenanceMetadata` using `prisma.marketPriceProvenanceMetadata.findMany`.
- The loader performs safe fallback casting to ensure JSON fields (like `warningCodes`) are parsed gracefully into strings without modifying DB records.
- The loader respects data guardrails: no mutation is performed, and original statuses (`needsReview`, `productionApproved`, `dataMode`) are returned verbatim without arbitrary suppression.

## Execution and Guardrail Verification
- Executed `scripts/smoke-market-price-provenance-read-path.ts`.
- The script successfully utilized the loader, bypassing the `pg` client manually and directly hitting the database with the schema integration.

### Smoke Results
```text
Phase 145U - MarketPrice provenance sidecar read-path smoke

--- Smoke Summary ---
phase: 145U
mode: market_price_provenance_sidecar_read_path_smoke
tableExists: true
rowCount: 90
distinctTickers: FPT, HPG, MSN, MWG, VNM
expectedTickersPresent: true
productionApprovedTrueCount: 0
needsReviewTrueCount: 90
dataModeCounts: {"candidate_provider_data":90}
providerTypeCounts: {"undocumented_provider":90}
adjustmentStatusCounts: {"needs_review":90}
stalenessStatusCounts: {"stale":90}
warningCodeCounts: {"MISSING_CURRENCY":90,"MISSING_EXCHANGE":90,"MISSING_PRICE_UNIT":90,"MISSING_VOLUME_UNIT":90,"MISSING_ADJUSTMENT_EVIDENCE":90}
warningCodesReadable: true
payloadChecksumPresentCount: 90
importRunIdPresentCount: 90
loaderCreated: true
loaderReadPathChecked: true
loaderReadPathOk: true
marketPriceRowCountBefore: 85
marketPriceRowCountAfter: 85
marketPriceRowsChanged: 0
marketPriceUnitMetadataRowCountBefore: 0
marketPriceUnitMetadataRowCountAfter: 0
marketPriceUnitMetadataRowsChanged: 0
dbWriteAttempted: false
importAttempted: false
seedAttempted: false
migrationAttempted: false
readPathIntegrationSafe: yes
readyForUiTransparencyPhase: yes
readyForProductionApproval: false
recommendedNextPhase: Phase 145V — MarketPrice provenance UI transparency integration
```

### Guardrail Integrity Checklist
- **No DB write:** Verified (`dbWriteAttempted: false`)
- **No MarketPrice write:** Verified (`marketPriceRowsChanged: 0`)
- **No MarketPriceUnitMetadata write:** Verified (`marketPriceUnitMetadataRowsChanged: 0`)
- **No productionApproved=true:** Verified (`productionApprovedTrueCount: 0`)
- **No research/candidate promotion:** Verified (`dataModeCounts` contains exactly 90 `candidate_provider_data`)
- **No import/seed/migration/deploy:** Verified.

## Readiness Decision
- `readPathIntegrationSafe`: **yes** (Table exists, readable via Prisma, payloads retain structural integrity).
- `readyForUiTransparencyPhase`: **yes**
- `readyForProductionApproval`: **no**

**Reasoning for NO production approval:**
The dataset consists exclusively of `candidate_provider_data` from an `undocumented_provider` that still requires manual review (`needsReview=true`). Furthermore, critical financial validation metrics are currently missing (`MISSING_CURRENCY`, `MISSING_EXCHANGE`, `MISSING_PRICE_UNIT`, `MISSING_VOLUME_UNIT`, `MISSING_ADJUSTMENT_EVIDENCE`).

## Recommended Next Phase
**Phase 145V — MarketPrice provenance UI transparency integration**
