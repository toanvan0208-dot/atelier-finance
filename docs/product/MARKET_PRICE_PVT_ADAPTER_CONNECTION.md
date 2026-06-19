# Market Price PVT Adapter Connection

Phase: 31S - Connect Market Price Read Path To Technical/PVT Adapter

## 1. Purpose

This document records Phase 31S connection from the local MarketPrice DB read path into a Technical/PVT adapter-ready layer.

This is not UI wiring, not a public API, not a direct Vnstock fetcher, and not production data integration. It proves the existing Technical/PVT builder can consume market price data derived from the local DB read service while keeping source and data-quality boundaries intact.

## 2. Current Data Lineage

`user-provided Vnstock CSV outside repo -> local import command -> MarketPrice local DB rows -> getMarketPriceSeries() -> adaptMarketPriceSeriesToPvt() / toPvtMarketPriceInput() -> buildTechnicalFromMarketPriceSeries() -> Technical/PVT adapter-ready output`

Current architecture finding:

- Technical/PVT UI still uses existing static/sample data from `src/features/technical/data/pvtObservation.data.ts`.
- Existing PVT builder logic lives in `src/features/technical/lib/build-technical-desk-data.ts`.
- Phase 31S adds an adapter/builder helper path, but it does not change the UI data source.

## 3. Adapter Behavior

Phase 31S adds:

- `src/lib/data-sources/market-price-pvt-adapter.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`

The adapter:

- Accepts output from `getMarketPriceSeries()`.
- Defensively sorts rows by date ascending.
- Preserves `null` numeric values.
- Does not replace missing values with `0`.
- Does not infer missing prices, volume, or `tradingValue`.
- Computes only descriptive fields: count, date span, latest close, previous close, price change percent when safe, latest volume, and latest trading value.
- Returns `priceChangePercent:null` when previous close is `null` or `0`.
- Carries `sourceLabel`, `dataMode`, and `productionApproved:false`.
- Does not create recommendation, rating, target price, or action-signal fields.

The Technical helper:

- Converts adapter output into the existing `TechnicalMarketSnapshot` shape.
- Calls the existing `buildTechnicalDeskData()` builder.
- Keeps the existing UI/static path unchanged.

## 4. Verification Results

Tests added:

- `src/lib/data-sources/__tests__/market-price-pvt-adapter.test.ts`
- `src/features/technical/lib/__tests__/build-technical-from-market-price-series.test.ts`

The tests verify:

- MarketPrice read series converts into sorted PVT adapter output.
- Safe descriptive values are computed only when inputs are valid.
- Missing numeric values remain unavailable instead of becoming `0`.
- Division by zero is avoided.
- Metadata carries `sourceLabel:vnstock`, `dataMode:research_only`, and `productionApproved:false`.
- Insufficient data returns a non-success adapter result.
- Existing Technical/PVT builder can consume adapter output.
- No recommendation/rating/target/action fields are emitted.
- No network call is made.

Optional actual DB adapter verification was run without import `--write` and without DB write:

| Field | Value |
| --- | --- |
| Read service status | `completed` |
| Adapter status | `completed` |
| Count | `17` |
| Date span | `2025-01-02` to `2025-01-24` |
| Latest date | `2025-01-24` |
| Latest close | `129.12` |
| `sourceLabel` | `vnstock` |
| `dataMode` | `research_only` |
| `productionApproved` | `false` |
| PVT input created | `true` |
| Errors | `[]` |

Phase 31S did not run import `--write`, did not write DB rows, did not call Vnstock, did not call network, did not add UI/API/cron behavior, and did not commit CSV or DB files.

## 5. Follow-Up

Phase 31T can connect adapter-ready output to the Technical/PVT module/page with clear source and data-quality display.

Follow-up constraints:

- Keep UI copy educational and descriptive.
- Do not add recommendations or trading signals.
- Do not add a direct Vnstock fetcher.
- Do not add public API/UI/cron/auto import without separate review.
- Keep source metadata academic/local/research with `productionApproved:false`.
