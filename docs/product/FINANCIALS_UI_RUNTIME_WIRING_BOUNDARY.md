# Financials UI Runtime Wiring Boundary

Phase: 48 - Financials UI Wiring Boundary / Default-off Browser Verification

Date: 2026-06-20

## 1. Goal

Phase 48 wires the Financials runtime loader from Phase 47 into the `/workspace?module=financials` UI through a server boundary.

The goal is controlled UI rendering, not data import. Default behavior stays on sample/static fallback. DB-backed Financials can render only when `ATELIER_FINANCIALS_DB_SOURCE=enabled` is set for the server runtime.

## 2. Why This Follows Phase 47

Phase 47 added `loadFinancialsRuntimeData()` and verified its default-off local DB read behavior. Phase 48 uses that loader at the server page boundary and passes serialized runtime data into the client shell.

Flow:

`workspace server page -> loadFinancialsRuntimeData() -> AppShell prop -> FinancialsPage initialRuntimeData -> source transparency UI`

## 3. UI Wiring Design

Server boundary:

- `src/app/workspace/page.tsx` reads optional `ticker` query.
- The page calls `loadFinancialsRuntimeData({ ticker })`.
- The page passes `initialFinancialsRuntimeData` into `AppShell`.

Client boundary:

- `src/components/layout/AppShell.tsx` only receives serialized props.
- `src/features/financials/components/FinancialsPage.tsx` renders `initialRuntimeData`.
- `src/features/financials/components/FinancialsSourceTransparency.tsx` displays source metadata.

Client Financials components do not import Prisma, `@prisma/client`, Node `fs`, the financial statement read service, or the runtime loader.

## 4. Default Sample/Fallback Behavior

When `ATELIER_FINANCIALS_DB_SOURCE` is not `enabled`:

- the loader returns `runtimeStatus:sample_fallback`
- the UI shows `sourceLabel:static_sample_financials`
- the UI shows `readPath:sample_static`
- the UI shows `fallbackUsed:true`
- the UI shows `productionApproved:false`
- no DB-backed success is claimed

The default page render does not read local DB financial statements.

## 5. Explicit DB-backed Behavior

When the server runs with:

- `DATABASE_URL=file:./dev.db`
- `ATELIER_FINANCIALS_DB_SOURCE=enabled`

the UI can render local DB-backed runtime data if the Phase 45 rows are present.

Expected metadata:

- `runtimeStatus:db_backed`
- `readPath:local_db`
- `sourceLabel:phase45_synthetic_financial_statement_local_write`
- `dataMode:research_only`
- `fallbackUsed:false`
- `productionApproved:false`

These rows are synthetic/local research evidence only. They are not real BCTC imports, not official data, not realtime data, and not production-approved data.

## 6. Source Transparency UI

The Financials source transparency block displays:

- source label
- data mode
- read path
- runtime status
- data quality status
- `fallbackUsed`
- `productionApproved:false`
- ticker
- fiscal year / period type / as-of when present
- missing fields when status is partial
- local research / synthetic warning for the Phase 45 source label

Safe wording used by the UI:

- local research / synthetic
- sample fallback
- not production-approved
- missing values stay null/unavailable, not zero

## 7. Missing Data Rendering Policy

Missing values remain missing:

- no missing field is replaced with `0`
- MWG `revenue:null` remains missing
- MWG `operatingCashFlow:null` remains missing
- source transparency lists partial missing fields
- metric cards built from unavailable inputs render insufficient/unavailable logic output

## 8. Browser Verification

Fallback browser verification:

- URL: `http://localhost:3000/workspace?module=financials`
- Env: `DATABASE_URL=file:./dev.db`; `ATELIER_FINANCIALS_DB_SOURCE` not enabled
- Result: page rendered
- Observed: source transparency visible
- Observed: `runtimeStatus:sample_fallback`
- Observed: `sourceLabel:static_sample_financials`
- Observed: `readPath:sample_static`
- Observed: `fallbackUsed:true`
- Observed: `productionApproved:false`
- Observed: no DB-backed source label or `db_backed` claim
- Observed: no restricted recommendation/trading-signal wording

DB-backed browser verification:

- URL: `http://localhost:3000/workspace?module=financials`
- URL: `http://localhost:3000/workspace?module=financials&ticker=MWG`
- Env: `DATABASE_URL=file:./dev.db`; `ATELIER_FINANCIALS_DB_SOURCE=enabled`
- Result: page rendered
- Observed: source transparency visible
- Observed: `runtimeStatus:db_backed`
- Observed: `readPath:local_db`
- Observed: `sourceLabel:phase45_synthetic_financial_statement_local_write`
- Observed: `dataMode:research_only`
- Observed: `fallbackUsed:false`
- Observed: `productionApproved:false`
- Observed: MWG rendered partial/missing status
- Observed: MWG missing fields included `revenue` and `operatingCashFlow`
- Observed: missing MWG revenue/CFO did not render as `0 ty` / `0 tỷ`
- Observed: local research / synthetic warning visible
- Observed: no official/realtime/production data claim
- Observed: no restricted recommendation/trading-signal wording

No screenshots are committed in this phase.

## 9. Tests

Phase 48 adds component/runtime-boundary tests for:

- default sample fallback source transparency
- DB-backed local research source metadata
- missing fields remaining visible instead of zero-filled
- client component static guard against Prisma/read-service/fs/runtime-loader imports
- restricted recommendation/source-approval wording guard

## 10. Validation Evidence

Validation commands for the final Phase 48 pass:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test`

Final Phase 48 validation results:

- `npx tsc --noEmit`: passed
- `npx prisma validate`: passed
- `npm run lint`: passed
- `npm test`: passed (`62` files / `438` tests)

## 11. Safety Observations

Phase 48 does not:

- write DB rows
- cleanup/delete DB rows
- run `db:reset`
- run `db:seed`
- import real BCTC data
- call external APIs
- scrape/download data
- parse Excel/PDF
- add public upload API behavior
- set a production-approved flag/state
- approve a production provider
- claim official/realtime/production financial data
- commit `dev.db`, raw CSV/JSON/report output, or screenshots
- add recommendation or trading-signal wording

## 12. Limitations

- DB-backed Financials UI is local research only.
- DB-backed rendering depends on local Phase 45 synthetic rows being present.
- No production financial statement source has been reviewed or approved.
- No real BCTC import is added.
- No production provider is connected.

## 13. Files Changed

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/features/financials/components/FinancialsPage.tsx`
- `src/features/financials/components/FinancialsSourceTransparency.tsx`
- `src/features/financials/components/__tests__/FinancialsPage.runtime-boundary.test.ts`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/index.ts`
- documentation cross-references listed in this phase commit
