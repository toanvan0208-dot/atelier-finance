# Technical PVT DB-backed UI Verification

Phase: 32 - Technical/PVT DB-backed UI Verification And Source Transparency

## 1. Purpose

Phase 32 verifies and documents the Technical/PVT runtime path after Phase 31U. It also adds a small source transparency strip to the Technical/PVT page.

This phase does not add a fetcher, call Vnstock, call network, scrape, download, import with `--write`, write DB rows, reset/seed DB, add a public API, add cron/scheduler behavior, or change source approval.

## 2. Runtime Modes

Default mode remains safe:

- `ATELIER_TECHNICAL_PVT_DB_SOURCE` unset or not `enabled`
- `loadTechnicalRuntimeData()` calls the safe loader with `preferDb:false`
- Technical/PVT renders static/sample fallback data
- Source transparency shows `Sample/static fallback`, `sample`, and `productionApproved:false`

Explicit DB-backed mode:

- `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`
- `loadTechnicalRuntimeData()` calls the safe loader with `preferDb:true`
- If local DB has valid MarketPrice rows, Technical/PVT can render DB-backed data
- Source transparency shows `Local DB manual import`, `vnstock`, `research_only`, and `productionApproved:false`

Fallback mode:

- DB empty, invalid input, read error, or builder failure
- Technical/PVT keeps rendering static/sample fallback
- Source transparency keeps `productionApproved:false`

## 3. UI Source Transparency

`src/features/technical/components/TechnicalPage.tsx` now renders a small source transparency strip near `DataQualityBanner`.

The strip displays:

- Source mode: local DB manual import or sample/static fallback
- Source label
- Data mode
- `productionApproved:false`
- Runtime state: `researchOnly` or `sampleFallback`

Phase 34 extends this strip with a separate company/issuer metadata layer; see `TECHNICAL_PVT_COMPANY_METADATA_BOUNDARY.md`. DB-backed market price data and issuer metadata now have separate source/status fields. If DB-backed FPT prices are present but issuer metadata is not verified, the UI labels metadata as unavailable/not verified instead of reusing static sample industry or sector values.

This is intentionally small and does not redesign the Technical/PVT module.

## 3A. Phase 34 Browser Evidence

Manual browser verification on 2026-06-20 confirmed:

- DB-backed mode at `http://localhost:3000/workspace?module=technical` with `DATABASE_URL=file:./dev.db` and `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled` rendered FPT market price data from local DB / `vnstock` / `research_only`.
- DB-backed mode kept `productionApproved:false`, showed issuer metadata as unavailable/not verified, and did not reuse static sample industry/sector for FPT.
- Fallback mode at the same route with the DB source flag disabled rendered sample/static fallback, marked metadata as `static_sample`, kept `productionApproved:false`, and did not show DB-backed `vnstock` source.
- No recommendation or trading-signal wording was observed in either mode.

This evidence does not verify FPT issuer metadata. It verifies only the UI/source-boundary behavior.

## 4. Client/Server Boundary

Server-side loader path:

`src/app/workspace/page.tsx -> loadTechnicalRuntimeData() -> loadTechnicalDeskData()`

Client-side render path:

`AppShell -> TechnicalPage`

Client files receive serialized runtime data through props. Client files must not import Prisma, `getMarketPriceSeries()`, `market-price-read-service`, `loadTechnicalDeskData()`, or `loadTechnicalRuntimeData()`.

## 5. Tests

Phase 32 adds:

- `src/features/technical/components/__tests__/TechnicalPage.test.ts`

The tests verify:

- Fallback source transparency renders.
- DB-backed source transparency renders.
- `productionApproved:false` appears in both modes.
- Existing runtime tests still verify env flag behavior and client boundary scans.

## 6. Manual Local Verification

Phase 32 automated/read-only runtime verification was run with:

- `DATABASE_URL=file:./dev.db`
- `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`

Observed result:

| Field | Value |
| --- | --- |
| `ok` | `true` |
| `fallbackUsed` | `false` |
| `sourceType` | `local_db_manual_import` |
| `sourceLabel` | `vnstock` |
| `dataMode` | `research_only` |
| `productionApproved` | `false` |
| `ticker` | `FPT` |
| `currentPrice` | `129.12` |

This verification read local DB-backed runtime output only. It did not run an import command and did not write DB rows.

Manual DB-backed UI verification should be done only on a local machine that already has Phase 31Q dev DB evidence. Do not commit DB or CSV files.

PowerShell example:

```powershell
$env:DATABASE_URL = "file:./dev.db"
$env:ATELIER_TECHNICAL_PVT_DB_SOURCE = "enabled"
npm run dev
```

Open:

```text
/workspace?module=technical
```

Expected when local DB has reviewed FPT MarketPrice rows:

- Technical/PVT page renders.
- Source transparency shows local DB manual import, `vnstock`, `research_only`, and `productionApproved:false`.
- No direct Vnstock/network/scrape/download call occurs.
- No DB write occurs.
- No import command runs.

Expected when DB evidence is unavailable or the env flag is off:

- Technical/PVT page still renders.
- Static/sample fallback remains visible.
- Source transparency shows sample/static fallback and `productionApproved:false`.

Manual DB-backed browser verification is pending when the local environment does not provide Phase 31Q dev DB evidence.

## 7. Safety Notes

Phase 32 did not add:

- Direct Vnstock calls.
- Network, scrape, or download behavior.
- DB writes or import `--write`.
- App-start import.
- Public API triggers.
- Cron or scheduler behavior.
- `productionApproved:true`.
- Recommendation, rating, target-price, or trading-action fields.

## 8. Phase 33 Browser Verification Status

Phase 33 is tracked in `docs/product/TECHNICAL_PVT_BROWSER_VERIFICATION_RECORD.md`.

Phase 33 records local browser/dev-server verification evidence for Technical/PVT DB-backed and fallback rendering. It confirms the source transparency strip renders in both modes, with the known limitation that DB-backed company/industry metadata is still limited and not a reviewed company-profile source.
