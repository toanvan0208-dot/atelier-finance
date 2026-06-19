# Market Price DB Read Path Verification

Phase: 31R - Market Price DB Read Path Verification

## 1. Purpose

This document records Phase 31R verification of a local DB read path for `MarketPrice` rows.

The read path lets backend code read manually imported market price rows from the local database and map them into an adapter-ready market price series. This is not production data integration. It does not add UI, a public API, a direct Vnstock fetcher, cron, scheduler, or app-start import behavior.

## 2. Input Evidence From Phase 31Q

Phase 31Q wrote reviewed user-provided CSV data into the local DB:

| Field | Value |
| --- | --- |
| Ticker | `FPT` |
| Requested range | `2025-01-01` to `2025-01-31` |
| Rows written | `17` |
| Imported date span | `2025-01-02` to `2025-01-24` |
| `sourceLabel` | `vnstock` |
| `dataMode` | `research_only` |
| `productionApproved` | `false` |

The CSV stayed outside the repo at `D:\fpt-market-prices.csv` and is not committed.

## 3. Read Service Behavior

Phase 31R adds `src/lib/data-sources/market-price-read-service.ts`.

The service:

- Normalizes ticker input by trimming and uppercasing.
- Validates `from` and `to` dates.
- Rejects empty ticker, invalid dates, and `from > to` with `invalid_input`.
- Reads `MarketPrice` rows by ticker, date range, `dataMode`, and `sourceLabel`.
- Defaults to `dataMode:research_only` and `sourceLabel:vnstock`.
- Orders rows by trading date ascending.
- Maps DB fields into market price series rows.
- Preserves `null` numeric fields.
- Does not convert missing values to `0`.
- Does not fill prices or infer `tradingValue`.
- Includes `productionApproved:false` at the service output layer.
- Returns adapter-ready PVT market snapshot input through `toPvtMarketPriceInput`.
- Does not add investment recommendation, rating, target price, or signal fields.

The current `MarketPrice` schema does not store `productionApproved` as a direct column. Production approval is enforced at the import command/source metadata layer and carried in the read service output as `productionApproved:false`.

## 4. Verification Results

Tests added:

- `src/lib/data-sources/__tests__/market-price-read-service.test.ts`

The tests verify:

- Research-only MarketPrice rows are read ordered by date.
- Ticker, date range, source label, and data mode are filtered.
- `null` numeric values remain `null` and are not converted to `0`.
- Invalid input is handled without reading the database.
- Empty result returns `not_found`.
- Metadata remains local/research and `productionApproved:false`.
- Adapter-ready PVT input can be derived without UI wiring.
- Output does not expose recommendation/rating/target/signal fields.
- No network call is made.

Optional actual local DB read verification was run with `DATABASE_URL=file:./dev.db` and no DB write:

| Field | Value |
| --- | --- |
| `status` | `completed` |
| `count` | `17` |
| First row date | `2025-01-02` |
| Last row date | `2025-01-24` |
| `sourceLabel` | `vnstock` |
| `dataMode` | `research_only` |
| `productionApproved` | `false` |
| `errors` | `[]` |

Phase 31R did not run import `--write`, did not write DB rows, did not call network, did not call Vnstock, did not commit CSV, and did not add a public trigger.

## 5. Follow-Up

Phase 31S can connect this read path to the Technical/PVT module or adapter if explicitly approved.

Follow-up constraints:

- Do not add recommendations or trading signals.
- Do not add a direct Vnstock fetcher.
- Do not add public API/UI/cron/auto import without separate review.
- UI connection should display source and data-quality context clearly.
- Source metadata must remain academic/local/research with `productionApproved:false`.

## 6. Phase 31S PVT Adapter Connection

Phase 31S connects this read path to a Technical/PVT adapter-ready layer. The review is recorded in `docs/product/MARKET_PRICE_PVT_ADAPTER_CONNECTION.md`.

Summary:

- `adaptMarketPriceSeriesToPvt()` converts read-service series output into descriptive PVT adapter output.
- `buildTechnicalFromMarketPriceSeries()` passes adapter output into the existing Technical/PVT builder.
- Existing UI/static data behavior is unchanged.
- Optional local DB adapter verification completed with `17` FPT rows and `productionApproved:false`.
