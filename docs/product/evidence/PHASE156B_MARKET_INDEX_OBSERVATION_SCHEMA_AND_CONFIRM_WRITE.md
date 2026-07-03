# Phase 156B — MarketIndexObservation Schema And Confirm-Write

## Goal
Create a dedicated schema model for market/sector index observations and confirm-write the validated index time-series rows.

## Scope
- Prisma schema change to introduce the `MarketIndexObservation` model.
- Migration script for the new model.
- Script for safely parsing local CSVs and idempotently writing the data.

## Why a separate MarketIndexObservation model is used
Instead of overloading the `MarketPrice` model, a separate `MarketIndexObservation` model was designed specifically for broader market/sector metrics. This separation ensures we do not mix units (`index_points` vs `vnd`) or muddy the context between aggregate economic benchmarks and individual company stock valuations.

## Schema/Migration Summary
- Added `MarketIndexObservation` model to `prisma/schema.prisma` with robust tracking for `symbol`, `tradingDate`, `openPoint`, `highPoint`, `lowPoint`, `closePoint`, `volume`, and `pointUnit`.
- Appended a relation array in `DataSource`.
- Generated and ran Prisma migration: `20260703123609_market_index_observation`.

## Source CSV Path Note
The source CSV files were correctly kept locally on `D:\` outside the repository to comply with standard security and git rules.
Raw CSV was not committed.

## Import Process & Validation Results

### DataSource
- A DataSource for `"VNStock market and sector index time-series"` was created correctly (flagged as `research_only` and not production approved).

### Rows Processed
- **Total CSV Rows:** 6,796
- **VNINDEX:** 1,699 rows (2019-09-13 to 2026-07-03)
- **VN30:** 1,699 rows (2019-09-13 to 2026-07-03)
- **VNMAT:** 1,699 rows (2019-09-12 to 2026-07-03)
- **VNCONS:** 1,699 rows (2019-09-12 to 2026-07-03)
- **Total Rows Created:** 6,796
- **Final Row Count:** 6,796

### Idempotency Result
- **Second Run `rowsSkipped`:** 6,796
- **Second Run `rowsCreated`:** 0
- **Duplicate Rows after Write:** 0

### Unit Validation
- Validation confirmed the correct use of `"index_points"` and `"shares"` without any zero-fill records (`zeroFillDetected` = false).

## Intended Future Mapping
- **HPG** -> VNMAT sector proxy
- **VNM** -> VNCONS broad consumer proxy
- **MWG** -> VNCONS broad consumer proxy, not exact retail benchmark
- **HPG/VNM/MWG** -> VNINDEX/VN30 market comparison

## Guardrail Confirmations
- **Provider Fetch Attempted:** No
- **Forbidden trading/advice wording introduced:** No
- **Benchmark/ranking/scoring introduced:** No
- **productionApprovedTrueCount:** 0
- **HSG/NKG touched:** No (Untouched, rejected directly in pipeline if encountered)
- **TVN absent:** Yes

## Recommended Next Phase
Phase 156C — Technical/PVT Relative Market And Sector Read-Path Dry Run
