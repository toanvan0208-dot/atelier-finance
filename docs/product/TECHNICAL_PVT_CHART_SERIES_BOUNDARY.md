# Technical PVT Chart Series Boundary

Phase: 37 - PVT Chart Series Boundary

Date: 2026-06-20

## 1. Goal

Phase 37 prevents presentation/sample chart series from leaking into DB-backed Technical/PVT mode.

When Technical/PVT renders DB-backed market price data, chart price/volume points must come from the active market price series or the chart must be marked unavailable/insufficient. DB-backed mode must not reuse sample chart points, sample MA20/MA50 lines, sample volume bars, or sample event annotations.

This phase prioritizes correctness and source transparency over visual polish.

## 2. Why This Follows Phase 36

Phase 36 fixed the derived-metrics boundary for support/resistance, volume ratio, FOMO, and risk/reward display.

Manual Phase 36 browser evidence still recorded one limitation: the chart could display presentation/sample chart points, MA lines, volume bars, and annotations such as `KQKD` / `Ngành`. That could make DB-backed FPT output look like it had a real DB-backed chart even when the chart series still came from sample presentation data.

## 3. Boundary Rule

PVT chart series must follow this rule:

- rendered from the active market price series, with chart source/status preserved; or
- marked `insufficient_data`, `unavailable`, `presentation_only`, or equivalent.

Sample/static chart series may remain in sample fallback mode, but it must not flow into DB-backed mode.

## 4. DB-backed Behavior

When Technical/PVT uses DB-backed market price series:

- chart points are built from active local DB market price rows
- price points use row `close`
- volume bars use row `volume` only when volume is available
- `productionApproved:false` remains unchanged
- chart status is `computed_from_market_price_series` when at least two close-price observations are available
- MA20 is unavailable until at least 20 same-series observations exist
- MA50 is unavailable until at least 50 same-series observations exist
- annotations are unavailable until an event source is connected
- sample chart points are not reused
- sample MA20/MA50 are not reused
- sample volume bars are not reused
- sample annotations such as `KQKD` / `Ngành` are not reused

For the current 17-observation FPT local DB series, Phase 37 renders 17 chart points from the active DB-backed series and keeps MA20/MA50/annotations unavailable.

## 5. Sample Fallback Behavior

When Technical/PVT uses sample/static fallback:

- existing sample chart may continue to render
- chart status/source is `static_sample` or `presentation_only`
- `productionApproved:false`
- the UI does not claim the chart is official, realtime, verified, or production data

## 6. Runtime Data Shape

Phase 37 adds `pvtChartSeries` metadata to Technical/PVT data:

- `sourceLabel`
- `dataMode`
- `productionApproved:false`
- `status`
- `ticker`
- `availableObservations`
- `requiredObservations`
- point count/status
- volume count/status
- MA20/MA50 status and required observations
- annotation count/status
- limitations
- warnings

Supported chart statuses include:

- `computed_from_market_price_series`
- `insufficient_data`
- `unavailable`
- `static_sample`
- `presentation_only`

## 7. UI Transparency

Technical/PVT source transparency now includes `chart:<status>`.

DB-backed chart rendering displays a small note:

- `Chart uses active local DB market price series.`

If the chart cannot be rendered from the active DB-backed series, the UI displays an unavailable state and does not render the sample chart.

Sample fallback displays `chart:static_sample` and keeps `productionApproved:false`.

## 8. Tests And Validation Evidence

Phase 37 adds/updates tests for:

- DB-backed chart does not reuse sample chart points.
- DB-backed chart does not reuse sample MA20/MA50.
- DB-backed chart does not reuse sample annotations such as `KQKD` / `Ngành`.
- DB-backed 17-observation series produces 17 chart points from active DB rows.
- Latest chart point matches the latest DB close in the active series.
- MA20 and MA50 remain `insufficient_data` for 17 observations.
- Annotations are unavailable/null for DB-backed mode.
- Sample fallback keeps chart status `static_sample`.
- UI displays chart source/status.
- Prohibited recommendation/trading-signal wording remains absent from updated tests.

Targeted validation run:

- `npx tsc --noEmit`
- `npm test -- --run src/features/technical/lib/__tests__/build-technical-from-market-price-series.test.ts src/features/technical/lib/__tests__/build-technical-desk-data.test.ts src/features/technical/components/__tests__/TechnicalPage.test.ts`

Full validation passed before manual browser evidence was recorded:

- `npx prisma validate`
- `npm run lint`
- `npm test` (`51` files / `365` tests)

## 9. Manual Browser Evidence

Manual browser verification on 2026-06-20 confirmed the Phase 37 DB-backed chart-series boundary.

DB-backed mode:

- URL: `http://localhost:3000/workspace?module=technical`
- Env: `DATABASE_URL=file:./dev.db`
- Env: `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`

Observed:

- Page rendered.
- FPT current price rendered from local DB / `vnstock` / `research_only` as `129.12`.
- Price/volume source displayed as Local DB manual import / `vnstock` / `research_only`.
- `productionApproved:false` remained visible.
- Source transparency displayed `chart:computed_from_market_price_series`.
- Chart section displayed `computed_from_market_price_series`.
- Chart displayed a note that it uses the active local DB market price series.
- DB-backed chart no longer displayed sample annotations such as `KQKD` / `Ngành`.
- MA20/MA50 were hidden because they were not computed from the same series/source and the active DB-backed series has only 17 observations.
- Sample support/resistance/FOMO/volume values remained unavailable or `insufficient_data` in DB-backed mode.
- Support/resistance labels on the chart were shown only as unavailable/insufficient-data placeholders, not as computed technical levels.
- No recommendation/trading-signal wording was observed.

Fallback mode was not re-verified in this browser pass. Existing automated tests cover sample fallback chart `static_sample` behavior.

This verification was read-only browser verification against existing local DB evidence. It did not run a DB import, write DB rows, call an external API, scrape, download, or approve production use.

## 10. Safety Notes

Phase 37 did not:

- call external APIs
- scrape or download data
- import new data
- write DB rows
- add cron, public API, or auto sync
- set `productionApproved:true`
- claim official/realtime/production market data
- create trading signals
- add buy/sell/hold recommendation wording

## 11. Limitations

- Phase 37 does not implement a complete technical-analysis engine.
- Phase 37 does not compute support/resistance.
- MA20/MA50 only render when enough same-series observations are available.
- Chart annotations remain unavailable in DB-backed mode until an event source is connected.
- Fallback mode was not re-verified in the Phase 37 manual browser pass; automated tests cover sample fallback chart `static_sample` behavior.

## 12. Files Changed

- `src/features/technical/types.ts`
- `src/features/technical/lib/map-technical-to-logic-input.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/features/technical/lib/build-technical-desk-data.ts`
- `src/features/technical/components/PVTMainChart.tsx`
- `src/features/technical/components/TechnicalPage.tsx`
- `src/features/technical/components/__tests__/TechnicalPage.test.ts`
- `src/features/technical/lib/__tests__/build-technical-desk-data.test.ts`
- `src/features/technical/lib/__tests__/build-technical-from-market-price-series.test.ts`
- `docs/product/TECHNICAL_PVT_CHART_SERIES_BOUNDARY.md`
