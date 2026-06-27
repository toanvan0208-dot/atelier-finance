# Phase 145V — MarketPrice provenance UI transparency integration

## Objective
The goal of this phase is to integrate the newly read provenance metadata into the UI transparently, ensuring users are explicitly aware that the underlying `MarketPrice` data is `candidate_provider_data`, is not production-approved, and still requires manual review.

## Initial State (from Phase 145U)
- A read-only runtime loader was successfully implemented to read 90 metadata records from the `MarketPriceProvenanceMetadata` table.
- All records had `productionApproved=false` and `needsReview=true`.
- The data is still safely segmented in the staging database as candidate data.

## UI / Runtime Integration
- **Runtime Loader**: We developed `src/features/technical/lib/technical-provenance-runtime.ts` which uses the read-path logic and returns formatted labels for UI consumption without mutating data or changing the `productionApproved` flag.
- **Data Integration**: We wired the `provenance` data structure into `TechnicalPageRuntimeData` so that the React page component has access to the full suite of metadata.
- **UI Component Updates**: We modified `SourceTransparencyStrip` inside `src/features/technical/components/TechnicalPage.tsx` to display a dedicated red-colored "Warning" section if provenance data indicates it is not production-approved.
- **Copy Restrictions**: We converted the generic term "verified" to "approved" to comply with restrictions on words that suggest certainty or official status (e.g., "official", "trusted price", "verified", etc.).
- **Warning Code Translation**: 
  - `MISSING_CURRENCY` -> "Thiếu đơn vị tiền tệ"
  - `MISSING_EXCHANGE` -> "Thiếu thông tin sàn giao dịch"
  - `MISSING_PRICE_UNIT` -> "Thiếu đơn vị giá"
  - `MISSING_VOLUME_UNIT` -> "Thiếu đơn vị khối lượng"
  - `MISSING_ADJUSTMENT_EVIDENCE` -> "Thiếu bằng chứng điều chỉnh giá"

## Smoke Result
Executed `scripts/smoke-market-price-provenance-ui-transparency.ts`:

```text
phase: 145V
mode: market_price_provenance_ui_transparency_smoke
tickersChecked: FPT, HPG, MSN, MWG, VNM
runtimeProvenanceAvailable: true
uiTransparencyLabelsPresent: true
warningLabelsPresent: true
forbiddenCopyDetected: false
forbiddenCopyMatches: 
productionApprovedTrueCount: 0
needsReviewTrueCount: 90
marketPriceProvenanceRowCount: 90
marketPriceRowCountBefore: 85
marketPriceRowCountAfter: 85
marketPriceRowsChanged: 0
dbWriteAttempted: false
importAttempted: false
seedAttempted: false
migrationAttempted: false
uiTransparencySafe: yes
readyForUserFacingSmoke: yes
readyForProductionApproval: false
recommendedNextPhase: Phase 145W — MarketPrice provenance user-facing UI/SSR smoke
```

## Guardrail Checks
- **No DB write**: Verified.
- **No MarketPrice write**: Verified. `marketPriceRowsChanged: 0`.
- **No MarketPriceUnitMetadata write**: Verified.
- **No candidate promotion**: Verified. `productionApprovedTrueCount: 0`.
- **No investment advice copy**: Verified. The script strictly checks for buy/sell/hold/fair value terms in the UI code.
- **No import/seed/migration/deploy**: Verified.

## Readiness Decision
- `uiTransparencySafe`: **yes**. The integration correctly propagates warnings without making the data appear official.
- `readyForUserFacingSmoke`: **yes**.
- `readyForProductionApproval`: **no**.

**Reason for No Production Approval**: The data remains `candidate_provider_data` from an `undocumented_provider`, retaining `needsReview=true` and missing critical metadata like currency and unit evidence.

## Recommended Next Phase
**Phase 145W — MarketPrice provenance user-facing UI/SSR smoke**
