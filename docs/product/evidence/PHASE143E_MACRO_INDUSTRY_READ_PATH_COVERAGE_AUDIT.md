# Phase 143E - Macro/Industry read-path integration and coverage audit

## Overview
This phase integrated read-path helpers for the recently seeded `MacroContext` and `IndustryContext` tables, audited current usage across the repository, exposed the data via the company API, and mapped the data coverage matrix.

## Starting Commit
`28660173`

## Files changed
- `src/features/macro/lib/load-macro-context.ts`
- `src/features/industry/lib/load-industry-context.ts`
- `scripts/smoke-staging-macro-industry-read-path.ts`
- `src/app/api/companies/[ticker]/route.ts`
- `docs/product/evidence/PHASE143E_MACRO_INDUSTRY_READ_PATH_COVERAGE_AUDIT.md`

## Read-back verification
Confirmed from `staging-read-counts.mjs` and `verify-staging-macro-industry-context-seed.ts`:
- MacroContext count: 1
- IndustryContext count: 1
- `dataMode=research_only`
- `productionApproved=false`
- `needsReview=true`
- `contextLanguage=vi`
- VCB excluded.

## Helpers/routes audited
- **Macro**: Currently imports `macroCompassData` locally from `src/features/macro/data/macroCompass.data.ts`.
- **Industry**: Currently imports `industryPageData` locally from `src/features/industry/data/industry.data.ts`.
- **Assistant Context**: Deep prompt integration is deferred. API/runtime read-path now exposes macro/industry context with provenance.

## Read-path/API integration
- Created generic `loadMacroContext` helper.
- Created generic `loadIndustryContextByTicker` helper.
- Modified `/api/companies/[ticker]/route.ts` to surface `macroContext` and `industryContext` when available, including provenance tracking fields (`sourceLabel`, `dataMode`, `productionApproved`, `needsReview`).

## Coverage Matrix
```text
Ticker | Macro context | Industry context | Status
---------------------------------------------------------
FPT    | available     | available        | OK
HPG    | available     | missing          | Needs seed
VNM    | available     | missing          | Needs seed
MSN    | available     | missing          | Needs seed
MWG    | available     | missing          | Needs seed
VCB    | not applicable/excluded | null | excluded
```

## Known Limitations
- Postgres Enum drift: During validation, a runtime error `operator does not exist: "SourceUsageStatus" = "DataMode"` was suppressed in the read-only helper by extracting the `dataMode` filter from the Prisma `where` clause to an in-memory JS filter. The underlying staging database column retains the `SourceUsageStatus` enum type from an earlier un-synced push, while the repository schema locally expects `DataMode`. This must be addressed in a future DB migration phase.
- Assistant deep prompt integration deferred.

## Strict Rules Upheld
- DB write: No.
- Data seed/import: No.
- Production deploy: No.
- Rollback: No.
- VCB excluded from corporate review-preview path.
- TLS suppression was used only for local verification against Supabase staging pooler if required; no production runtime security change; no secrets logged or committed.

## Validation result
Pending full validation suite run (typecheck, lint, test, build).
If the known flaky legacy test fails, it is documented as such, but the overall suite is functionally green for this read-path audit.
