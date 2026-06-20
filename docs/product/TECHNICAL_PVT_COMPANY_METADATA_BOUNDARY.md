# Technical PVT Company Metadata Boundary

Phase: 34 - Company/Issuer Metadata Boundary For Technical/PVT

Date: 2026-06-20

## 1. Objective

Phase 34 separates Technical/PVT market price data from company/issuer metadata. The goal is to prevent a DB-backed ticker from accidentally reusing static sample company, industry, or sector metadata when no verified issuer metadata source exists for that ticker.

This is a local academic/research boundary only. It does not approve any production data source.

## 2. Problem After Phase 33

Phase 33 verified that Technical/PVT can render DB-backed FPT market price data from the local database with:

- `sourceLabel:vnstock`
- `dataMode:research_only`
- `productionApproved:false`
- `ticker:FPT`

The remaining risk was metadata leakage: the UI could show DB-backed FPT price data while still borrowing sample/static issuer context such as a retail industry from the MWG sample fallback.

## 3. Boundary

Technical/PVT runtime data now distinguishes two layers:

1. Market price data:
   - ticker
   - source label
   - data mode
   - fallback state
   - date span/as-of when available
   - `productionApproved:false`

2. Company/issuer metadata:
   - ticker
   - display/issuer name
   - industry
   - sector
   - source label
   - data mode
   - verification status
   - limitations/warnings
   - `productionApproved:false`

Issuer metadata verification status can be `verified`, `local_research_seed`, `static_sample`, `limited`, `unavailable`, or `unknown`.

Phase 35 adds the first local/research-only issuer metadata foundation behind this boundary. See `COMPANY_ISSUER_METADATA_FOUNDATION.md`. The Phase 35 foundation does not make issuer metadata official or production-approved.

## 4. DB-backed Behavior

When DB-backed market price rows are used:

- The ticker, price, volume, and date range come from the local DB read service.
- The market source remains `local_db_manual_import`, `vnstock`, `research_only`, and `productionApproved:false`.
- If the DB-backed ticker differs from the static sample base ticker, sample company name, industry, and sector are not reused.
- Missing issuer metadata is represented as unavailable/unknown rather than filled with sample values.
- The UI displays that company/industry metadata has not been verified.

For the Phase 34 FPT path, this means FPT market price can render while issuer metadata remains unavailable until a verified metadata source is added.

## 5. Fallback Behavior

When Technical/PVT uses the static sample fallback:

- The fallback remains renderable.
- The market source is labeled `sample_static_fallback`.
- Static sample issuer metadata can render only as `verificationStatus:static_sample`.
- `productionApproved:false` remains visible.
- The UI does not claim sample metadata is verified production metadata.

## 6. Remaining Limitations

- Phase 34 does not add a real company/issuer metadata source.
- Phase 34 does not verify FPT issuer profile, industry, or sector.
- Phase 34 does not connect external APIs or scrape/download metadata.
- Phase 34 only prevents misleading reuse of sample metadata when a DB-backed ticker has no verified metadata source.

## 7. Safety Notes

- No external API calls.
- No scrape/download/import of new data.
- No `import --write`.
- No DB write.
- No cron, public API, or auto-import.
- No `productionApproved:true`.
- No official/realtime/production data claim.
- No buy/sell/hold recommendation wording or trading-signal wording.

## 8. Validation Evidence

Automated validation added/updated:

- DB-backed FPT market price data does not reuse sample industry/sector when the fallback sample ticker differs.
- Fallback sample data still renders and is labeled as sample/static fallback.
- TechnicalPage displays a company/industry metadata limitation for unavailable issuer metadata.
- Prohibited recommendation wording remains absent from Technical/PVT builder output.

Commands run during Phase 34 implementation:

- `npx vitest run src/features/technical/lib/__tests__/build-technical-desk-data.test.ts src/features/technical/lib/__tests__/load-technical-desk-data.test.ts src/features/technical/lib/__tests__/load-technical-runtime-data.test.ts src/features/technical/components/__tests__/TechnicalPage.test.ts`
- `npx tsc --noEmit`

Full validation status is recorded in the final implementation report for the phase.

## 9. Manual Browser Verification Evidence

Manual browser verification was completed locally on 2026-06-20.

DB-backed mode:

- URL: `http://localhost:3000/workspace?module=technical`
- Env: `DATABASE_URL=file:./dev.db`
- Env: `ATELIER_TECHNICAL_PVT_DB_SOURCE=enabled`
- Page rendered.
- FPT market price rendered from local DB / `vnstock` / `research_only`.
- `productionApproved:false` remained visible.
- Issuer metadata was shown as unavailable/not verified.
- Static sample industry/sector was not reused for FPT.
- No recommendation or trading-signal wording was observed.

Fallback mode:

- URL: `http://localhost:3000/workspace?module=technical`
- Env: `DATABASE_URL=file:./dev.db`
- Env: `ATELIER_TECHNICAL_PVT_DB_SOURCE` disabled
- Page rendered.
- Sample/static fallback rendered.
- Metadata was marked as `static_sample`.
- `productionApproved:false` remained visible.
- No DB-backed `vnstock` source was shown.
- No recommendation or trading-signal wording was observed.

This browser evidence does not verify FPT issuer profile, industry, or sector. It only verifies that the Phase 34 boundary prevents misleading sample metadata reuse in DB-backed Technical/PVT mode.

## 10. Files Changed

- `src/features/technical/types.ts`
- `src/features/technical/lib/build-technical-desk-data.ts`
- `src/features/technical/lib/load-technical-desk-data.ts`
- `src/features/technical/components/TechnicalPage.tsx`
- `src/features/technical/components/__tests__/TechnicalPage.test.ts`
- `src/features/technical/lib/__tests__/build-technical-desk-data.test.ts`
- `src/features/technical/lib/__tests__/load-technical-desk-data.test.ts`
- `src/features/technical/lib/__tests__/load-technical-runtime-data.test.ts`
- `docs/product/TECHNICAL_PVT_COMPANY_METADATA_BOUNDARY.md`
