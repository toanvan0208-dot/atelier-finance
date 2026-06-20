# Technical PVT Browser Verification Record

Phase: 33 - Technical/PVT Manual Browser Verification Evidence

## 1. Objective

This phase records local browser/dev-server verification for the Technical/PVT UI after Phase 32 source transparency work.

This is verification/evidence only. It does not add a fetcher, call Vnstock, call external network, scrape, download, import with `--write`, write DB rows, reset/seed DB, add a public API, add cron/scheduler behavior, or change source approval.

## 2. Baseline

- Branch: `main`
- Latest commit before Phase 33: `e528dae docs: mark Phase 33 browser verification as pending`
- Initial worktree status: clean after restoring generated `next-env.d.ts`
- Local DB evidence source: existing local `dev.db` evidence from Phase 31Q FPT manual CSV write trial

## 3. DB-backed Browser Verification

Command used:

```powershell
$env:DATABASE_URL="file:./dev.db"
$env:ATELIER_TECHNICAL_PVT_DB_SOURCE="enabled"
npm run dev
```

Route checked:

```text
http://localhost:3000/workspace?module=technical
```

Observed result:

| Check | Result |
| --- | --- |
| Page rendered | Pass |
| Crash observed | No |
| Source transparency | `Local DB manual import - vnstock - research_only` |
| Approval flag | `productionApproved:false` |
| Runtime state badge | `researchOnly` |
| Ticker/company | `FPT - FPT - Ban le` |
| Current price | `129.12 VND/share` |
| Sample fallback shown in DB-backed mode | No |
| Investment recommendation wording observed | No |

## 4. Fallback Browser Verification

Command used:

```powershell
Remove-Item Env:ATELIER_TECHNICAL_PVT_DB_SOURCE -ErrorAction SilentlyContinue
$env:DATABASE_URL="file:./dev.db"
npm run dev -- -p 3002
```

Route checked:

```text
http://localhost:3002/workspace?module=technical
```

Observed result:

| Check | Result |
| --- | --- |
| Page rendered | Pass |
| Crash observed | No |
| Source transparency | `Sample/static fallback - sample` |
| Approval flag | `productionApproved:false` |
| Runtime state badge | `sampleFallback` |
| Sample ticker/company | `MWG - CTCP Dau tu The Gioi Di Dong - Ban le` |
| Current price | `42,000 VND/share` |
| DB-backed source shown in fallback mode | No |
| Investment recommendation wording observed | No |

## 5. Known Limitations

- Manual browser verification was local-only, not deployed verification.
- DB-backed UI depends on the local `dev.db` retaining Phase 31Q FPT evidence rows.
- Screenshots were not committed.
- DB-backed market price data rendered successfully, but company/industry metadata is still limited and may come from fallback/static context. The observed industry label `Ban le` for FPT requires a future company-metadata source or safer unknown/limited metadata handling.

## 6. Safety Confirmations

Phase 33 did not:

- Call Vnstock directly.
- Add or configure a real fetcher.
- Call external network, scrape, or download.
- Run import `--write`.
- Write DB rows.
- Reset or seed DB.
- Add a public API.
- Add cron, scheduler, or app-start import.
- Add `productionApproved:true`.
- Add recommendation, rating, target-price, or trading-action fields.
- Remove static/sample fallback.
- Commit screenshots, DB files, CSV/JSON files, logs, or generated cache.
