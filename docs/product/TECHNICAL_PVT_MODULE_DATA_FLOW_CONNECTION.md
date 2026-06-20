# Technical PVT Module Data Flow Connection

Phase: 31T - Connect PVT Adapter To Technical Module Data Flow

## 1. Purpose

This document records the Phase 31T module-level helper that can load Technical/PVT data from local MarketPrice rows when explicitly preferred.

The helper is local and fail-safe. It does not add UI wiring, a public API, cron behavior, app-start import, a real Vnstock fetcher, network access, scrape/download behavior, database writes, or source approval.

## 2. Data Flow

The Phase 31T path is:

`getMarketPriceSeries() -> buildTechnicalFromMarketPriceSeries() -> existing Technical/PVT builder -> Technical/PVT data shape`

The helper lives at:

- `src/features/technical/lib/load-technical-desk-data.ts`

It accepts:

- `ticker`
- `from`
- `to`
- `preferDb`
- `allowFallback`

Default behavior remains conservative:

- `preferDb` defaults to `false`.
- `allowFallback` defaults to `true`.
- Without explicit DB preference, it returns the existing static/sample fallback.
- Invalid input does not read the database.
- Empty DB results, read errors, and adapter/builder failures fall back when fallback is allowed.
- If fallback is disabled, failures return `ok:false` and no fabricated data.

## 3. Source Boundary

When the DB-backed path succeeds, the helper reports:

- `sourceType:local_db_manual_import`
- `provider:vnstock`
- `sourceLabel` from the local read service
- `dataMode` from the local read service
- `productionApproved:false`

This means the data is still local academic/research evidence from manual import workflow. It is not deployed product data and is not approved for commercial runtime use.

## 4. Fallback Boundary

When DB data is not preferred, unavailable, invalid, or cannot be converted, the helper returns:

- `sourceType:sample_static_fallback`
- `provider:sample_static`
- `dataMode:sample`
- `productionApproved:false`
- `fallbackUsed:true`

The fallback keeps the current Technical/PVT static sample behavior available without silently claiming DB-backed data.

## 5. UI Wiring Status

The Technical/PVT page still imports the existing static data module directly. Phase 31T does not change the rendered UI data source.

Future UI/server wiring should decide the client/server boundary separately. The helper imports the DB read service, so it should not be imported into a client component.

## 6. Verification

Tests added:

- `src/features/technical/lib/__tests__/load-technical-desk-data.test.ts`

The tests verify:

- DB-backed data is used only when `preferDb:true`.
- Static fallback is used by default.
- Empty DB results fall back safely.
- Invalid input does not read DB and does not call `fetch`.
- Missing numeric values remain unavailable instead of becoming `0`.
- Output keeps `productionApproved:false`.
- Prohibited investment-output fields are not exposed.

## 7. Safety Notes

Phase 31T did not:

- Call Vnstock.
- Call network, scrape, or download.
- Run import `--write`.
- Write database records.
- Add a public API.
- Add UI controls or visible runtime behavior.
- Add cron, scheduler, or app-start import.
- Add recommendation, rating, target-price, or trading-action fields.
- Change source approval status.

## 8. Phase 31U Runtime Wiring

Phase 31U is tracked in `docs/product/TECHNICAL_PVT_RUNTIME_DATA_FLOW_WIRING.md`.

It adds a server-side runtime wrapper and routes the `/workspace` Technical/PVT initial data through the safe loader path. DB-backed mode remains disabled by default and can only be enabled explicitly. The client Technical/PVT components receive serialized data through props and do not import DB/server loader code.

## 9. Phase 32 UI Verification

Phase 32 is tracked in `docs/product/TECHNICAL_PVT_DB_BACKED_UI_VERIFICATION.md`.

It adds minimal Technical/PVT source transparency for sample fallback and local DB manual import modes, while keeping DB-backed mode explicit/default-off.
