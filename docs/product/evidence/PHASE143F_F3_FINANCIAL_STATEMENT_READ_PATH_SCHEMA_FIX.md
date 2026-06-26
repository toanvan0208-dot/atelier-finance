# Phase 143F-F3: Financial Statement Read-Path Schema Fix

## Objective
Fix the schema/read-path mismatch where `FinancialStatementUnitMetadata` read queries incorrectly selected a `warningCodes` field that is absent from the Prisma schema. This caused a silent DB read error and forced runtime fallback to static/sample data, breaking the entire financial statement read-path in staging/production for reviewed-preview data.

## Root Cause
In `src/lib/data-sources/financial-statement-read-service.ts`, the query `db.financialStatement.findMany` requested `warningCodes: true` on the `unitMetadata` relation. However, the `FinancialStatementUnitMetadata` table in `prisma/schema.prisma` does not have this column (and product logic does not require it). The resulting Prisma exception was caught, causing `database_error` and a fallback to static/sample data, bypassing the seeded PDF records.

## Fix
The fix was extremely narrow and safe:
Removed `warningCodes: true` from the `unitMetadata` select paths in `src/lib/data-sources/financial-statement-read-service.ts` (lines 548, 620).
Removed `warningCodes: string;` from the `StoredFinancialStatementUnitMetadata` local type (line 147).

Schema migration: **None**. The database schema is correct; the read path simply requested an outdated/non-existent field.

## Tests Reproduced Before Fix
`hpg-pdf-reviewed-post-import-smoke.test.ts` and `msn-pdf-reviewed-post-import-smoke.test.ts` were run before the fix and resulted in 13 failures due to fallback to `static_sample_financials` and `phase109_controlled_local_financials`.

## Tests Passed After Fix
Both test files now pass cleanly (8/8 tests passed). The DB-backed read-path successfully retrieves and maps the `annual_report_2025_pdf_reviewed_preview` staging rows.

## Read-Path Smoke Results
All smoke tests passed:
- `scripts/verify-staging-reviewed-preview-import.mjs`
- `scripts/smoke-staging-reviewed-preview-read-path.ts`
- `scripts/smoke-staging-market-price-read-path.ts`
- `scripts/smoke-staging-company-business-profile-read-path.ts`
- `scripts/smoke-staging-macro-industry-read-path.ts`

VCB remains correctly excluded from the corporate reviewed-preview path.

## Operational Checks
- DB write: No
- Data seed/import: No
- Rollback: No
- Production deploy/import: No

## Remaining Risks
None. The read-path is now cleanly aligned with the Postgres schema for staging and production usage.
