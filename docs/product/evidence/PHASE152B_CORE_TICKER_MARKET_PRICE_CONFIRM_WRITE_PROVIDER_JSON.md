# Phase 152B - Core Ticker MarketPrice Confirm-Write Provider JSON

## Goal

Confirm-write `MarketPrice` rows for the six core tickers from the local normalized VNStock provider snapshot JSON:

- `FPT`
- `HPG`
- `VNM`
- `MSN`
- `MWG`
- `VCB`

## Scope

- DB write allowed only to `MarketPrice`.
- Default script mode remains dry-run/no-write.
- `--confirm-write` is required before any write attempt.
- No schema change.
- No provider fetch; local JSON read only.
- No UI change.
- No Assistant change.
- No Company write.
- No `ScreeningCandidate` write.
- No `FinancialStatement` write.
- No `CompanyIndustry` write.
- No `IndustryMetric`.
- No benchmark, ranking, scoring, or stock attractiveness score.
- HSG/NKG untouched.
- TVN absent.
- Raw JSON not committed.
- `productionApprovedTrueCount=0`.

## Files Changed

- `scripts/confirm-write-core-ticker-market-price-provider-json.ts`
- `scripts/smoke-core-ticker-market-price-provider-json-read-path.ts`
- `docs/product/evidence/PHASE152B_CORE_TICKER_MARKET_PRICE_CONFIRM_WRITE_PROVIDER_JSON.md`

Note: two unrelated Financials UI files were already modified in the worktree before this phase and were not staged or committed by Phase 152B.

## JSON Path Inspected

`data/manual-review/market-price/core-ticker-vnstock-market-price-snapshot-2026-07-02.json`

The raw JSON remains a local manual/provider review input and is not committed.

## MarketPrice Model / Schema Storage Note

`MarketPrice` safely supports:

- `ticker`
- `companyId`
- `tradingDate`
- `periodType`
- `period`
- `closePrice`
- `volume`
- `tradingValue`
- `currency`
- `sourceId`
- `sourceLabel`
- `sourceType`
- `dataMode`
- `asOf`
- `collectedAt`
- `qualityStatus`
- `readiness`
- `missingFields`
- `warningCodes`
- `errorCodes`

Storage limitations:

- The schema `SourceType` enum does not include `provider_snapshot`; the script would store `sourceType=unknown` in `MarketPrice` and preserve provider snapshot semantics in `sourceLabel`, `warningCodes`, script output, and evidence.
- Raw unit normalization fields (`rawClosePrice`, `rawPriceUnit`, `priceScaleFactor`, `priceUnit`, `volumeUnit`, `liquidityUnit`) do not have safe columns in `MarketPrice`; they are validated and preserved in evidence only.
- `liquidity` has a safe equivalent column: `tradingValue`.
- `exchange=HOSE` is not stored in `MarketPrice`; it remains a controlled metadata detail in the JSON/evidence.
- `MarketPrice.sourceId` is required and references `DataSource`.

## Dry-Run Result

Command:

`npx tsx scripts/confirm-write-core-ticker-market-price-provider-json.ts`

Summary:

```json
{
  "phase": "152B",
  "mode": "dry_run",
  "jsonFound": true,
  "marketPriceRowsPrepared": 6,
  "marketPriceRowsWritten": 0,
  "marketPriceRowsCreated": 0,
  "marketPriceRowsUpdated": 0,
  "marketPriceRowsSkipped": 6,
  "readyTickers": [],
  "blockedTickers": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "sourceDependencyAvailable": false,
  "dbWriteAttempted": false,
  "providerFetchAttempted": false,
  "productionApprovedTrueCount": 0,
  "rawJsonCommitted": false,
  "smokePassed": true
}
```

Blocker for all six tickers:

`datasource_dependency_missing`

The JSON rows are valid, but the local PostgreSQL `DataSource` table is empty. Because Phase 152B allows DB writes only to `MarketPrice`, the script must not create a `DataSource` row and therefore blocks the write.

## Confirm-Write Result

Command:

`npx tsx scripts/confirm-write-core-ticker-market-price-provider-json.ts --confirm-write`

Summary:

```json
{
  "phase": "152B",
  "mode": "confirm_write",
  "jsonFound": true,
  "marketPriceRowsPrepared": 6,
  "marketPriceRowsWritten": 0,
  "marketPriceRowsCreated": 0,
  "marketPriceRowsUpdated": 0,
  "marketPriceRowsSkipped": 6,
  "readyTickers": [],
  "blockedTickers": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "sourceDependencyAvailable": false,
  "dbWriteAttempted": true,
  "nonMarketPriceWritesDetected": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "productionApprovedTrueCount": 0,
  "rawJsonCommitted": false,
  "smokePassed": false
}
```

No `MarketPrice` rows were written. This is the intended fail-closed behavior because writing would require a `DataSource` dependency that is outside this phase's allowed write scope.

## Idempotency Rerun Result

Command:

`npx tsx scripts/confirm-write-core-ticker-market-price-provider-json.ts --confirm-write`

Rerun result:

- `marketPriceRowsWritten=0`
- `marketPriceRowsCreated=0`
- `marketPriceRowsUpdated=0`
- `marketPriceRowsSkipped=6`
- `idempotencyPassed=true`
- No duplicate rows created.

## Read-Path Smoke Result

Command:

`npx tsx scripts/smoke-core-ticker-market-price-provider-json-read-path.ts`

Summary:

```json
{
  "phase": "152B",
  "marketPriceRowsFound": 0,
  "fptMarketPricePresent": false,
  "hpgMarketPricePresent": false,
  "vnmMarketPricePresent": false,
  "msnMarketPricePresent": false,
  "mwgMarketPricePresent": false,
  "vcbMarketPricePresent": false,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "productionApprovedTrueCount": 0,
  "rawJsonCommitted": false,
  "smokePassed": false
}
```

Smoke correctly reports that no `MarketPrice` rows exist yet because confirm-write was blocked.

## MarketPrice Rows Written

None.

| Ticker | JSON candidate valid | MarketPrice row written | Blocker |
| --- | --- | --- | --- |
| FPT | Yes | No | `datasource_dependency_missing` |
| HPG | Yes | No | `datasource_dependency_missing` |
| VNM | Yes | No | `datasource_dependency_missing` |
| MSN | Yes | No | `datasource_dependency_missing` |
| MWG | Yes | No | `datasource_dependency_missing` |
| VCB | Yes | No | `datasource_dependency_missing` |

## Source / Caveat Summary

Required warning codes were validated and documented:

- `PROVIDER_SNAPSHOT`
- `NEEDS_REVIEW`
- `RESEARCH_ONLY`
- `MARKET_PRICE_NOT_AUDITED`
- `STALE_SNAPSHOT_CHECK_REQUIRED`
- `RAW_PRICE_UNIT_THOUSAND_VND_PER_SHARE`
- `PRICE_SCALED_TO_VND_PER_SHARE`

Source semantics:

- `sourceType=provider_snapshot` in JSON.
- `sourceLabel=VNStock market price snapshot`.
- `dataMode=research_only`.
- `needsReview=true`.
- `productionApproved=false`.
- Provider P/E/price data remains not audited and not production approved.

## Unit Normalization Summary

- `closePrice` is already normalized to VND/share.
- `rawClosePrice` is in thousand VND/share.
- `priceScaleFactor=1000`.
- `priceUnit=vnd_per_share`.
- `volumeUnit=shares`.
- `liquidityUnit=vnd`.
- `liquidity=closePrice * volume` validated in Phase 152A.
- `liquidity` would be stored as `MarketPrice.tradingValue` if the `DataSource` dependency exists.

## Guardrail Confirmation

- DB write: attempted with `--confirm-write`, but no rows written due to missing `DataSource` dependency.
- MarketPrice write: no rows written.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- Company write: no.
- `ScreeningCandidate` write: no.
- `FinancialStatement` write: no.
- `CompanyIndustry` write: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- Raw JSON committed: no.
- Ranking/scoring created: no.
- Benchmark created: no.
- `IndustryMetric` created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.

## Validation

- `npx eslint scripts/confirm-write-core-ticker-market-price-provider-json.ts scripts/smoke-core-ticker-market-price-provider-json-read-path.ts` - passed.
- `npx tsx scripts/confirm-write-core-ticker-market-price-provider-json.ts` - passed; dry-run prepared 6 rows and blocked writes due to missing `DataSource`.
- `npx tsx scripts/confirm-write-core-ticker-market-price-provider-json.ts --confirm-write` - fail-closed; no rows written.
- `npx tsx scripts/confirm-write-core-ticker-market-price-provider-json.ts --confirm-write` - idempotency rerun; no duplicates.
- `npx tsx scripts/smoke-core-ticker-market-price-provider-json-read-path.ts` - smoke reported `smokePassed=false` because no rows were written.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

Phase 152B-retry or Phase 152B-prereq - create or confirm-write the required `DataSource` row for `VNStock market price snapshot` under a separately approved scope, then rerun Phase 152B MarketPrice confirm-write.

After MarketPrice rows are written, continue with:

Phase 152C - Core ticker FinancialStatement/CompanyIndustry blocker closure dry-run before ScreeningCandidate backfill.
