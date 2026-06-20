# Financials UI Evidence Hardening And Module Consistency

Phase: 49 - Financials DB-backed UI Evidence Hardening & Module Consistency

Date: 2026-06-20

## 1. Summary

Phase 49 hardens Financials UI evidence wording after Phase 48 wired the runtime boundary into `/workspace?module=financials`.

This phase does not add data import, DB writes, cleanup/delete behavior, production source approval, external API calls, Excel/PDF parsing, or public upload behavior.

## 2. Files Changed

- `src/components/shared/DataQualityBanner.tsx`
- `src/features/financials/components/FinancialsPage.tsx`
- `src/features/financials/components/FinancialsSourceTransparency.tsx`
- `src/features/financials/components/__tests__/FinancialsPage.runtime-boundary.test.ts`
- `docs/product/FINANCIALS_UI_EVIDENCE_HARDENING_AND_MODULE_CONSISTENCY.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 3. What Was Audited

Audited code paths:

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/shared/DataQualityBanner.tsx`
- `src/features/financials/components/FinancialsPage.tsx`
- `src/features/financials/components/FinancialsSourceTransparency.tsx`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/overview/components/OverviewPage.tsx`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/risk/components/RiskPage.tsx`

Audit result:

- Financials runtime metadata remains server-loaded and serialized into the client.
- Financials client components do not import Prisma, DB read services, Node `fs`, or the runtime loader.
- Overview, Valuation, and Risk do not import or render the Financials-specific Phase 45 source label, `db_backed`, or `local_db` claims.

## 4. Financials Fallback Evidence

Unit/static verification covers fallback rendering:

- `runtimeStatus:sample_fallback`
- `sourceLabel:static_sample_financials`
- `readPath:sample_static`
- `fallbackUsed:true`
- `productionApproved:false`
- no Phase 45 local DB-backed source label

UI wording now explicitly labels fallback as:

- static sample fallback
- fallback enabled
- not production-approved
- missing values stay `null/unavailable`, not `0`

## 5. Financials DB-backed Evidence

Unit/static verification covers DB-backed rendering:

- `runtimeStatus:db_backed`
- `readPath:local_db`
- `dataMode:research_only`
- `fallbackUsed:false`
- `productionApproved:false`
- `sourceLabel:phase45_synthetic_financial_statement_local_write`

UI wording now explicitly labels DB-backed Financials as:

- local DB research-only
- synthetic/local research evidence
- not production-approved
- not real BCTC import
- missing fields listed as missing/null-unavailable

## 6. DataQualityBanner Hardening

`DataQualityBanner` now supports `isResearchOnly`.

For Financials DB-backed local research data, the banner shows:

- `Du lieu local research-only`
- `productionApproved:false`
- guidance to read the source transparency block

This avoids treating local DB research-only Financials as a broadly connected or approved source.

## 7. Module Consistency

Financials DB-backed status is scoped to Financials only.

The source transparency block now states that the boundary applies to the Financials module and does not automatically make Overview, Valuation, or Risk DB-backed.

Static tests verify that these module entry components do not claim the Financials DB-backed source:

- `src/features/overview/components/OverviewPage.tsx`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/risk/components/RiskPage.tsx`

## 8. Browser Verification

Browser verification was not run in this pass.

Reason:

- The in-app Browser plugin rejected the localhost page inspection action under its URL policy during the Phase 49 pass.
- No alternate browser surface was used to avoid working around that policy.

Evidence used instead:

- targeted component tests
- static source scans
- TypeScript validation
- lint
- full test suite

No browser verification result is claimed for Phase 49.

## 9. Safety Result

Phase 49 preserves these safety properties:

- no DB write
- no DB cleanup/delete
- no `db:reset`
- no `db:seed`
- no real financial statement import
- no production source approval
- no Excel/PDF parsing
- no public upload API
- no external API call
- no raw CSV/JSON/report output committed
- no screenshots committed
- `productionApproved` remains false for sample/local/research-only data
- sample fallback remains clearly labeled
- local research-only wording is explicit
- missing/null data is not converted to `0`
- no recommendation or trading-signal wording is added

## 10. Validation Evidence

Final Phase 49 validation:

- `npx tsc --noEmit`: passed
- `npx prisma validate`: passed
- `npm run lint`: passed
- `npm test`: passed (`62` files / `440` tests)

Targeted test already passed:

- `npm test -- --run src/features/financials/components/__tests__/FinancialsPage.runtime-boundary.test.ts`
- result: `1` file / `7` tests passed

## 11. Non-goals

Phase 49 does not:

- make Financials data real BCTC data
- make local DB data production-approved
- make Overview, Valuation, or Risk inherit the Financials DB-backed status
- add a production provider
- change write/cleanup policy
- add a public ingestion path
