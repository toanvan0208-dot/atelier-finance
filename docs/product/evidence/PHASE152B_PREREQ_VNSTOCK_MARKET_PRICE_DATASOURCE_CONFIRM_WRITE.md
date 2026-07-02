# Phase 152B-prereq — VNStock MarketPrice DataSource Confirm-Write

## Goal
Create or confirm-write the required `DataSource` row for the VNStock market price snapshot. This ensures that the Phase 152B MarketPrice confirm-write script can be safely rerun afterward, satisfying the foreign key constraint (`marketPrice.sourceId`).

## Why this phase is needed after 152B
Phase 152B successfully validated the VNStock JSON snapshot and prepared 6 valid MarketPrice rows. However, the confirm-write step fail-closed because `MarketPrice.sourceId` is a required field referencing a valid `DataSource` row, which was missing in the local PostgreSQL database. The 152B scope strictly restricted any writes other than `MarketPrice`, preventing the script from dynamically creating the missing `DataSource`. This prerequisite phase resolves the blocker by securely inserting the missing `DataSource` dependency.

## Scope
- Create one `DataSource` row representing the VNStock local snapshot.
- No `MarketPrice` rows written.
- No schema change.
- No provider fetch.
- No UI/Assistant change.
- No changes to `Company`, `ScreeningCandidate`, `FinancialStatement`, or `CompanyIndustry`.
- HSG/NKG remain untouched.
- TVN remains absent.
- No IndustryMetric or benchmark/ranking/scoring introduced.
- Strict avoidance of any prohibited investment advice wording.

## Files Changed
- `scripts/confirm-write-vnstock-market-price-datasource.ts`
- `scripts/smoke-vnstock-market-price-datasource-read-path.ts`
- `docs/product/evidence/PHASE152B_PREREQ_VNSTOCK_MARKET_PRICE_DATASOURCE_CONFIRM_WRITE.md`

## DataSource Model & Schema Storage Note
The `DataSource` schema does not natively have an explicit `provider_snapshot` for `SourceType`, nor does it support boolean flags for `productionApproved` or `needsReview` directly on the model.
As documented in the script and this evidence:
- **`sourceType`**: Mapped to `curated_internal` (closest safe semantic match for a locally pulled, normalized snapshot).
- **`usageStatus`**: Mapped to `research_only` (captures the dataMode requirement).
- **`productionApproved`**: Remains effectively `false` contextually.
- **`needsReview`**: Remains `true` contextually.
- **`provider`**: VNStock (recorded in `name` and `notes`).

## Execution Results

### Dry-run Result
The dry-run validated the schema mapping constraints and successfully verified that a candidate row could be prepared. No DB write was executed in dry-run mode.

### Confirm-write Result
Executed with `--confirm-write`, the script successfully created the `DataSource` row and outputted the generated ID.

### Idempotency Rerun Result
Re-running the confirm-write script accurately detected the pre-existing row and successfully skipped creation, proving idempotency without error.

### Smoke Result
The smoke test successfully verified:
- Exactly 1 VNStock MarketPrice snapshot DataSource was found.
- `usageStatus` is accurately set to `research_only`.
- Data structure can safely be used as `MarketPrice.sourceId`.

## DataSource Row Identity
- **Name**: VNStock market price snapshot
- **SourceType**: `curated_internal`
- **SupportedDataGroups**: `["market_price"]`
- **UsageStatus**: `research_only`

## Source Semantics and Caveat Summary
Local normalized VNStock provider snapshot for core ticker MarketPrice research data. Raw provider close prices were normalized from thousand VND/share to VND/share before MarketPrice insertion. This DataSource is not production approved and does not imply audited market data.

## Confirmations
- **DataSource wrote only DataSource**: Confirmed.
- **No MarketPrice write**: Confirmed.
- **No schema change**: Confirmed.
- **No provider fetch**: Confirmed.
- **No UI change**: Confirmed.
- **No Assistant change**: Confirmed.
- **No Company write**: Confirmed.
- **No ScreeningCandidate write**: Confirmed.
- **No FinancialStatement write**: Confirmed.
- **No CompanyIndustry write**: Confirmed.
- **HSG/NKG untouched**: Confirmed.
- **TVN absent**: Confirmed.
- **Raw JSON not committed**: Confirmed.
- **No IndustryMetric**: Confirmed.
- **No benchmark/ranking/scoring**: Confirmed.
- **No forbidden advice wording**: Confirmed.
- **productionApprovedTrueCount=0**: Confirmed.

## Next Recommended Phase
**Phase 152B-retry** — Rerun Core Ticker MarketPrice Confirm-Write after DataSource dependency is available.
