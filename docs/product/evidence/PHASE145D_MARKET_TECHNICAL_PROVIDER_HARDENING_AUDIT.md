# Phase 145D — MarketPrice / Technical Provider Hardening Audit + Read-Path Contract

## 1. Phase Summary
- Phase 145D is purely an audit and read-path contract definition phase.
- No data import, no DB write, no schema migration.
- No deployment to production.
- `productionApproved` remains `false`.
- Data remains classified as `research_candidate` or `fallback`.

## 2. Current MarketPrice / Technical Source Inventory
- **sourceLabel**: `vnstock_research_candidate`
- **dataMode**: `research_only`
- **productionApproved status**: `false`
- **tickers covered**: Variable (currently seeded for FPT, HPG, MWG, etc., via candidate scripts)
- **fields covered**: `openPrice`, `highPrice`, `lowPrice`, `closePrice`, `previousClose`, `adjustedClosePrice`, `volume`, `tradingValue`, `marketCap`
- **unit metadata**: Tracked in `MarketPvtFieldUnitMetadata` (`vnd_per_share`, `shares`, `billion_vnd`)
- **freshness timestamp**: Tracked via `asOf` and `tradingDate`

## 3. Current Read-Path Map
- **Overview**: Uses `closePrice` and `volume` for top-level summary.
- **Valuation**: Uses `marketPrice` (typically `closePrice`) and `sharesOutstanding` to calculate P/E, P/B, Market Cap.
- **Risk**: Uses historical `closePrice` arrays for drawdown and volatility metrics.
- **Technical/PVT**: Uses `closePrice`, `volume`, `tradingValue` for momentum and liquidity analysis.
- **Assistant context**: Ingests snapshot via context packet if module is active.
- **Fallback behavior**: `load-technical-runtime-data.ts` and `load-financials-runtime-data.ts` use `allowFallback` to load static `sample_fallback` or `persisted_bridge` when DB is unavailable or empty.
- **Risk if stale/missing**: Valuations will be `insufficient_data` or `not_applicable`. No silent corruption.

## 4. Fallback / Mock / Sample Leak Audit
- **Mock/Sample to Real**: Fallbacks like `sample_fallback` and `persisted_bridge` exist, but they are properly labeled via `dataMode="sample"`, `fallbackUsed=true`, and `productionApproved=false`.
- **Missing-to-zero**: Audited boundaries (`valuation-financials-runtime-readiness.ts`) strictly enforce `substituteZeroForMissing: false`. Missing values are correctly returned as `null` and treated as `insufficient_data`.
- **UI Labeling**: Modules lacking `productionApproved=true` are gated by the `AppShell` or clearly show data source disclaimers.
- **Result**: **No leak found in audited paths.**

## 5. Provider Risk Classification
- **Current classification**: `vnstock_research_candidate` is strictly `candidate_provider_data`. It is **not** a `production_provider_candidate` yet.
- **Automatable**: Yes (via Python extraction scripts).
- **Provider stability**: Low/Moderate (relies on undocumented external APIs).
- **Licensing/terms clarity**: Needs legal review (`not_checked`).
- **Unit consistency**: Good, provided boundary validation (VND vs Thousand VND) is strictly applied.
- **Missing data behavior**: Often missing trailing metrics; handled safely by our boundaries.

## 6. Production Provider Contract
To be considered `production_provider_candidate`, the provider must fulfill:
- `providerName` & `providerType` (e.g., licensed_vendor, official_api)
- `sourceLabel` and `dataMode` (`production_approved`)
- `fetchedAt` (Collection timestamp)
- `tradingDate` (Market date)
- `currency` and precise `priceUnit` / `volumeUnit`
- `adjustmentStatus` (Is price split-adjusted?)
- `stalenessStatus`
- `rawPayloadChecksum` or equivalent audit marker
- **Strict Rule**: Missing fields must be `null`, never `0`.
- **Rollback plan**: Idempotent overwrites by `tradingDate`.

## 7. Staleness / Freshness Rules
- **Acceptable latency**: End-of-Day (EOD) or near real-time provider frequency is acceptable.
- **Weekend/Holiday**: If there is no active trading day, the last close price is `fresh`, not `stale`.
- **Stale definition**: Data is `stale` only if an expected EOD file/API payload is missing for a known trading day.
- **Zero-fill prohibition**: If volume or price is missing, it is `N/A` or `null`, never `0`.
- **Statuses**: `fresh`, `provider_delayed`, `stale`, `missing`, `unsupported`.

## 8. Production Approval Gate
Before `productionApproved=true` can be set for MarketPrice/Technical:
1. Provider is legally/operationally acceptable (or formally risk-accepted as a vendor).
2. Automated, reproducible import script exists.
3. No sample/fallback path is reachable without explicit UI indication.
4. No missing-to-zero behavior exists in DB ingestion.
5. Unit metadata is strictly validated upon import.
6. Freshness/Staleness logic is implemented in the read-path.
7. Rollback plan exists.
8. Smoke tests pass against staging database.

## 9. Recommended Next Phase
**Phase 145E — MarketPrice / Technical provenance metadata schema/read-path design**
- Update schema to capture precise adjustment status, staleness markers, and unit enforcement specifically for the production contract defined above.
