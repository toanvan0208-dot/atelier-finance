# Technical PVT Runtime Data Flow Wiring

Phase: 31U - Wire Technical/PVT Runtime To Safe Data Loader

## 1. What Changed

Phase 31U starts routing the Technical/PVT runtime through the safe loader path.

New server-side runtime wrapper:

- `src/features/technical/lib/load-technical-runtime-data.ts`

Runtime wiring:

- `src/app/workspace/page.tsx` calls `loadTechnicalRuntimeData()` on the server.
- The resulting serializable Technical/PVT data is passed into the client `AppShell`.
- `AppShell` passes the initial Technical/PVT result into `TechnicalPage`.
- `TechnicalPage` renders the provided runtime data when present and keeps the existing static/sample data as the in-component fallback.

This keeps Prisma/local DB read code out of client components.

## 2. Default Behavior

DB-backed mode is disabled by default.

Without explicit DB preference, the runtime wrapper calls the safe loader with:

- `ticker:FPT`
- `from:2025-01-01`
- `to:2025-01-31`
- `preferDb:false`
- `allowFallback:true`

The default page experience remains the current static/sample fallback.

## 3. Explicit DB Mode

DB-backed Technical/PVT runtime data is enabled only when one of these is true:

- A caller passes `preferDb:true` to `loadTechnicalRuntimeData()`.
- The server environment has `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`.

The env flag is disabled by default and is not a secret.

When enabled, the path is:

`workspace server page -> loadTechnicalRuntimeData() -> loadTechnicalDeskData({ preferDb:true }) -> getMarketPriceSeries() -> Technical/PVT builder -> client props`

The DB-backed result keeps:

- `sourceLabel:vnstock`
- `dataMode:research_only`
- `productionApproved:false`

Phase 34 adds a serializable metadata boundary to this runtime result; see `TECHNICAL_PVT_COMPANY_METADATA_BOUNDARY.md`:

- `marketDataSource` describes price/volume source lineage.
- `issuerMetadata` describes company/industry/sector metadata status.
- When the DB-backed ticker differs from the static sample ticker and no issuer metadata source exists, sample issuer metadata is not reused and `issuerMetadata.verificationStatus` remains unavailable/unknown.

Phase 35 adds `getIssuerMetadata(ticker)` as a local/research-only issuer metadata foundation; see `COMPANY_ISSUER_METADATA_FOUNDATION.md`. In DB-backed mode, Technical/PVT keeps `marketDataSource` on local DB / `vnstock` / `research_only` while `issuerMetadata` can come from `local_issuer_metadata_seed` or remain unavailable.

Phase 36 adds `pvtDerivedMetrics` to keep support/resistance, volume ratio, and FOMO source/status separate from both market price source and issuer metadata. In DB-backed mode, derived PVT metrics must come from the active market price series or render as insufficient/unavailable. See `TECHNICAL_PVT_DERIVED_METRICS_BOUNDARY.md`.

Phase 37 adds `pvtChartSeries` to keep chart points, volume bars, moving averages, and annotations source/status separate from sample presentation data. In DB-backed mode, chart points must come from the active local DB market price series or render as unavailable/insufficient. See `TECHNICAL_PVT_CHART_SERIES_BOUNDARY.md`.

Manual browser verification on 2026-06-20 confirmed DB-backed FPT renders `chart:computed_from_market_price_series`, displays the active local DB market price series note, hides sample annotations, and keeps MA20/MA50 hidden for the 17-observation local DB series.

## 4. Fallback Behavior

Fallback remains mandatory for runtime safety.

The runtime falls back when:

- DB mode is not enabled.
- Input is invalid.
- Local DB read returns no usable rows.
- DB read or builder path fails.
- Runtime wrapper catches an unexpected loader error.

Fallback result keeps:

- `sourceType:sample_static_fallback`
- `dataMode:sample`
- `productionApproved:false`

## 5. UI Wiring Status

The Technical/PVT page now receives initial runtime data from the server wrapper through `AppShell` props.

There is no large UI redesign. The existing data-quality banner still renders using the received data-quality object. If DB mode is off or fallback is used, the page looks like the existing static/sample experience.

## 6. Client/Server Boundary

Client files must not import:

- `load-technical-desk-data`
- `load-technical-runtime-data`
- `market-price-read-service`
- `getMarketPriceSeries`
- Prisma/database client code

Phase 31U adds an architectural test that reads the client files and checks that these server-only imports are absent.

## 7. Safety Notes

Phase 31U did not:

- Call Vnstock directly.
- Add a real fetcher.
- Call network, scrape, or download.
- Run import `--write`.
- Write DB rows.
- Reset or seed DB.
- Add a public API.
- Add cron, scheduler, or app-start import.
- Change source approval.
- Add recommendation, rating, target-price, or trading-action fields.

## 8. Phase 32 UI Verification

Phase 32 is tracked in `docs/product/TECHNICAL_PVT_DB_BACKED_UI_VERIFICATION.md`.

It adds a small Technical/PVT source transparency strip and verifies, through runtime/test evidence, that both sample fallback and DB-backed metadata can carry `productionApproved:false`. DB-backed mode remains explicit and default-off.

Phase 33 browser verification is tracked in `docs/product/TECHNICAL_PVT_BROWSER_VERIFICATION_RECORD.md`.

## 9. Phase 70 Market/PVT Unit Metadata Contract

Phase 70 is tracked in `docs/product/MARKET_PVT_UNIT_METADATA_CONTRACT.md`.

It adds a helper/type contract for Market/PVT numeric unit metadata without changing the Technical/PVT runtime loader or UI. Market price remains Market/PVT-owned, explicit unit metadata remains required for Valuation handoff, and local/research runtime data remains `productionApproved:false`.

## 10. Phase 72 Market/PVT Unit Metadata Capture Boundary

Phase 72 is tracked in `docs/product/MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`.

The Technical/PVT runtime loader can now return a `marketUnitMetadata` sidecar. Existing local DB market price rows without explicit unit fields are represented as `unknown_unit` instead of being assigned a default unit by magnitude.

## 11. Phase 73 Controlled Market/PVT Metadata Write Trial

Phase 73 is tracked in `docs/product/CONTROLLED_MARKET_PVT_METADATA_WRITE_TRIAL.md`.

The Technical/PVT builder now supports controlled capture overrides for synthetic/local read-through trials. Because `MarketPrice` has no field-level unit metadata storage, Market/PVT metadata persistence is deferred and no DB write is performed.

## 12. Phase 74 Market/PVT Metadata Persistence Design

Phase 74 is tracked in `docs/product/MARKET_PVT_METADATA_PERSISTENCE_DESIGN.md`.

The recommended future storage path is an additive `MarketPriceUnitMetadata` sidecar. Runtime behavior remains unchanged in Phase 74.

## 13. Phase 75 Additive Market/PVT Metadata Persistence

Phase 75 implements the additive sidecar path from Phase 74.

`getMarketPriceSeries()` now selects `MarketPrice.unitMetadata` rows when present and converts them through the Market/PVT unit contract into `marketUnitMetadata`. `buildTechnicalFromMarketPriceSeries()` uses persisted `marketUnitMetadata` from the DB-backed series when no explicit capture override is supplied.

Rows without sidecar metadata remain readable as `unknown_unit`. Invalid sidecar units fail closed and emit warnings; numeric market values alone do not unlock unit-sensitive Valuation calculations. This does not add a provider, parser, real import, source approval, UI change, or new metric.
