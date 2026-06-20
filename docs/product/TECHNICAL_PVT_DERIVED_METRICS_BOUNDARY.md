# Technical PVT Derived Metrics Boundary

Phase: 36 - PVT Derived Metrics Boundary

Date: 2026-06-20

## 1. Goal

Phase 36 prevents static/sample-derived PVT metrics from leaking into DB-backed Technical/PVT mode.

When Technical/PVT renders DB-backed market price data, derived PVT metrics such as support/resistance ranges, volume ratio, and FOMO must either be computed from the active market price series or marked unavailable/insufficient. They must not be borrowed from static sample fallback data.

This phase does not build a complete technical-analysis engine.

## 2. Why This Follows Phase 35 Browser Evidence

Phase 35 browser verification confirmed that DB-backed FPT renders:

- current price from local DB / `vnstock` / `research_only`
- issuer metadata from local research seed
- `productionApproved:false`
- no sample industry/sector reuse

The same browser pass surfaced a separate issue: support/resistance style PVT derived levels still appeared while DB-backed current price was `129.12`.

## 3. Problem Observed

In DB-backed FPT mode, the UI still showed sample-style derived values such as:

- support range `38.000 - 40.000`
- resistance range `44.000 - 46.000`
- volume `1.4x TB20`
- FOMO `3/6`

Those values were not proven to be computed from the active FPT DB-backed market price series. They could mislead users by mixing DB-backed current market data with static/sample derived context.

## 4. Boundary Rule

Derived PVT metrics must follow this rule:

- computed from the active market price series, with source/status preserved; or
- marked `insufficient_data`, `unavailable`, `not_available`, or equivalent.

Sample/static derived metrics may remain in sample fallback mode, but they must not flow into DB-backed mode.

## 5. DB-backed Behavior

When Technical/PVT uses DB-backed market price series:

- current price remains sourced from the active DB-backed series
- market source remains local DB / `vnstock` / `research_only`
- `productionApproved:false` remains unchanged
- support/resistance ranges are unavailable unless computed from the active series
- volume TB20 is insufficient when fewer than 20 observations are available
- FOMO is unavailable unless computed from the active series
- sample support/resistance/FOMO/volume ratio is not reused

The runtime data includes `pvtDerivedMetrics` with:

- `sourceLabel`
- `dataMode`
- `productionApproved:false`
- `dataStatus`
- `calculationBasis`
- `requiredObservations`
- `availableObservations`
- support/resistance/volume/FOMO status
- limitations/warnings

## 6. Sample Fallback Behavior

When Technical/PVT uses sample/static fallback:

- sample UI can continue rendering sample support/resistance/FOMO values
- `pvtDerivedMetrics.dataStatus` is `static_sample`
- `calculationBasis` is `static_sample`
- `productionApproved:false`
- the UI keeps sample/static fallback source transparency

Sample fallback values are not official, not production-ready, and not trading signals.

## 7. UI Transparency

TechnicalPage now surfaces derived-metrics status in the source transparency strip:

- `derived:insufficient_data` for DB-backed insufficient/unavailable derived metrics
- `derived:static_sample` for sample fallback derived metrics

DB-backed unavailable states render as user-visible labels such as:

- `Chưa đủ dữ liệu`
- `Chưa đủ 20 phiên`
- `Không khả dụng`
- `FOMO chưa khả dụng`

The chart no longer draws hardcoded support/resistance bands when support/resistance labels are unavailable/insufficient.

Manual browser evidence for Phase 36 observed these labels rendered correctly in the UI as `Chưa đủ dữ liệu`, `Chưa đủ 20 phiên`, `Không khả dụng`, and `FOMO chưa khả dụng`.

## 8. Tests And Validation Evidence

Phase 36 adds/updates tests for:

- DB-backed market price output keeps ticker/current price while not reusing sample support/resistance.
- DB-backed derived metrics expose insufficient/unavailable statuses.
- A 17-observation DB-backed series marks volume TB20 as insufficient.
- DB-backed FOMO does not reuse sample score.
- Sample fallback keeps static sample derived status.
- UI displays unavailable/insufficient messaging and does not show sample ranges, `1.4x TB20`, or `3/6` in DB-backed mode.
- Recommendation/trading-signal wording remains absent.

Automated validation passed before manual browser evidence was recorded:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`51` files / `363` tests)

## 9. Manual Browser Evidence

Manual browser verification on 2026-06-20 confirmed the Phase 36 DB-backed derived-metrics boundary.

DB-backed mode:

- URL: `http://localhost:3000/workspace?module=technical`
- Env: `DATABASE_URL=file:./dev.db`
- Env: `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`

Observed:

- Page rendered.
- FPT current price rendered from local DB / `vnstock` / `research_only` as `129.12`.
- Price/volume source displayed as Local DB manual import / `vnstock` / `research_only`.
- `productionApproved:false` remained visible.
- Source transparency displayed `derived:insufficient_data`.
- Support sample range `38.000 - 40.000` was no longer shown.
- Resistance sample range `44.000 - 46.000` was no longer shown.
- Volume sample value `1.4x TB20` was no longer shown.
- FOMO sample score `Trung bình, 3/6` was no longer shown.
- Support/resistance cards displayed `Chưa đủ dữ liệu`.
- Volume displayed `Chưa đủ 20 phiên`.
- FOMO displayed `Không khả dụng`.
- Risk/reward section displayed support/resistance/upside/downside as `Không khả dụng`.
- FOMO thermometer stated that FOMO is not available because it was not computed from the same DB-backed series.
- No recommendation/trading-signal wording was observed.

This verification was read-only browser verification against existing local DB evidence. It did not run a DB import, write DB rows, call an external API, scrape, download, or approve production use.

## 10. Safety Notes

Phase 36 did not:

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

- Phase 36 does not implement full support/resistance calculation.
- FOMO remains unavailable in DB-backed mode until a safe same-series calculation exists.
- Volume TB20 requires at least 20 observations.
- Existing chart price/volume points, MA lines, volume bars, and annotations such as `KQKD` / `Ngành` can still come from sample chart presentation until a later phase wires full DB-backed chart points.
- Phase 37 should handle the PVT Chart Series Boundary so DB-backed mode no longer mixes DB-backed price transparency with presentation/sample chart series.

Phase 37 addresses this chart-series limitation by adding `pvtChartSeries` source/status metadata and preventing sample chart points, MA lines, volume bars, and annotations from rendering in DB-backed mode. See `TECHNICAL_PVT_CHART_SERIES_BOUNDARY.md`.

## 12. Files Changed

- `src/features/technical/types.ts`
- `src/features/technical/lib/map-technical-to-logic-input.ts`
- `src/features/technical/lib/build-technical-from-market-price-series.ts`
- `src/features/technical/lib/build-technical-desk-data.ts`
- `src/features/technical/components/TechnicalPage.tsx`
- `src/features/technical/components/PVTHeroStatus.tsx`
- `src/features/technical/components/PVTMainChart.tsx`
- `src/features/technical/components/PVTRiskRewardZone.tsx`
- `src/features/technical/components/PVTFomoThermometer.tsx`
- `src/features/technical/components/__tests__/TechnicalPage.test.ts`
- `src/features/technical/lib/__tests__/build-technical-from-market-price-series.test.ts`
- `src/features/technical/lib/__tests__/load-technical-desk-data.test.ts`
- `docs/product/TECHNICAL_PVT_DERIVED_METRICS_BOUNDARY.md`
