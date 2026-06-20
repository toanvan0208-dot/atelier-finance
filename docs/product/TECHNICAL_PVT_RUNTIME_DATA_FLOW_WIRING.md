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

It adds a small Technical/PVT source transparency strip and verifies, through tests, that both sample fallback and DB-backed runtime metadata render with `productionApproved:false`. DB-backed mode remains explicit and default-off.
