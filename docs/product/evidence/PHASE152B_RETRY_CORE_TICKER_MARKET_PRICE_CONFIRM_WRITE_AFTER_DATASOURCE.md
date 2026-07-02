# Phase 152B-retry — Core Ticker MarketPrice Confirm-Write After DataSource Dependency

## Goal
Rerun the existing Phase 152B `MarketPrice` confirm-write script now that the required `DataSource` dependency (`VNStock market price snapshot`) has been created in Phase 152B-prereq. The objective is to safely write 6 `MarketPrice` rows for the core tickers (FPT, HPG, VNM, MSN, MWG, VCB) without modifying any other data or schema.

## Why retry is needed after 152B-prereq
The initial Phase 152B execution fail-closed because `MarketPrice.sourceId` requires a valid `DataSource` foreign key, which was missing from the local database. After explicitly creating the required `DataSource` in Phase 152B-prereq, this phase retries the insertion.

## Scope
- Re-run `MarketPrice` dry-run and confirm-write for 6 core tickers.
- Leverage the existing `DataSource` dependency (`VNStock market price snapshot`).
- Preserve normalization and verification rules.
- No `DataSource` creation or modification in this phase.
- No schema change.
- No provider fetch.
- No UI/Assistant change.
- No changes to `Company`, `ScreeningCandidate`, `FinancialStatement`, or `CompanyIndustry`.
- HSG/NKG remain untouched.
- TVN remains absent.
- No IndustryMetric or benchmark/ranking/scoring introduced.
- Strict avoidance of any prohibited investment advice wording.

## Files Changed
- `scripts/confirm-write-core-ticker-market-price-provider-json.ts`
- `scripts/smoke-core-ticker-market-price-provider-json-read-path.ts`
- `docs/product/evidence/PHASE152B_RETRY_CORE_TICKER_MARKET_PRICE_CONFIRM_WRITE_AFTER_DATASOURCE.md`

## DataSource Dependency Used
- **Name**: `VNStock market price snapshot`
- **SourceType**: `curated_internal`
- **UsageStatus**: `research_only`

## JSON Path Inspected
`data/manual-review/market-price/core-ticker-vnstock-market-price-snapshot-2026-07-02.json`

## MarketPrice Model & Schema Storage Note
- `sourceId` refers directly to the existing `DataSource`.
- `dataMode: research_only` and `needsReview: true` applied conceptually as per `DataSource` mapping but without forcing incompatible schema enums.
- Normalization (e.g. `thousand_vnd_per_share` to `vnd_per_share`) preserves values at standard scales.

## Execution Results

### Dry-run Result
The dry-run located the `DataSource`, successfully linked `companyId` for the 6 target tickers, and prepared 6 valid candidates. No DB write was executed.

### Confirm-write Result
Executed with `--confirm-write`, successfully created 6 new `MarketPrice` rows with correct linking to both `Company` and `DataSource`.

### Idempotency Rerun Result
Re-running the confirm-write script bypassed the creation step appropriately by updating/verifying the 6 pre-existing rows without duplicating or raising errors.

### Read-path Smoke Result
The smoke test successfully verified:
- Exact matches for all 6 tickers' closePrice, volume, and derived liquidity compared with the raw JSON.
- `sourceId` points accurately to the `VNStock market price snapshot`.
- Data rows match 2026-07-02.
- HSG and NKG remain untouched; TVN is absent.
- No other models or schemas mutated.

## MarketPrice Rows Written
- **FPT**
- **HPG**
- **VNM**
- **MSN**
- **MWG**
- **VCB**

## Source / Caveat Summary by Ticker
- FPT / HPG / VNM / MSN / MWG / VCB: Data sourced from local normalized VNStock provider snapshot. Not production approved. `needs_review: true`.

## Unit Normalization Summary
- **closePrice**: VND/share
- **rawClosePrice**: thousand_vnd_per_share
- **volume**: shares
- **liquidity/tradingValue**: VND (closePrice * volume)

## Storage Limitations
- `exchange=HOSE` isn't strictly stored if unsupported by `MarketPrice` schema.
- `provider_snapshot` sourceType falls back to closest enum `curated_internal`.
- Unit conversions are preserved in this evidence rather than raw tables unless explicitly schema-supported.

## Confirmations
- **No schema change**: Confirmed.
- **No provider fetch**: Confirmed.
- **No UI change**: Confirmed.
- **No Assistant change**: Confirmed.
- **No DataSource write in this retry**: Confirmed.
- **No Company write**: Confirmed.
- **No ScreeningCandidate write**: Confirmed.
- **No FinancialStatement write**: Confirmed.
- **No CompanyIndustry write**: Confirmed.
- **HSG/NKG untouched**: Confirmed.
- **TVN absent**: Confirmed.
- **Raw JSON not committed**: Confirmed.
- **No ranking/scoring/benchmark**: Confirmed.
- **No IndustryMetric**: Confirmed.
- **No forbidden advice wording**: Confirmed.
- **productionApprovedTrueCount=0**: Confirmed.

## Next Recommended Phase
**Phase 152C** — Screening Display Backfill For Six Core Tickers With Full Analysis Gating
