# Phase 143F-F2: Legacy PDF Smoke Test Classification

## Objective
Classify the root cause of 13 failures in the legacy PDF smoke test suites (`hpg-pdf-reviewed-post-import-smoke.test.ts` and `msn-pdf-reviewed-post-import-smoke.test.ts`).

## Failing Suites Reproduced
Run command:
`node scripts/run-staging.mjs npx vitest run src/features/financials/lib/__tests__/hpg-pdf-reviewed-post-import-smoke.test.ts src/features/financials/lib/__tests__/msn-pdf-reviewed-post-import-smoke.test.ts`

**Reproduced Failures:**
1. HPG: `resolves to annual_report_2025_pdf_reviewed_preview with expected values`
   - Expected: `"annual_report_2025_pdf_reviewed_preview"`
   - Received: `"static_sample_financials"`
2. MSN: `preserves both MSN source rows and resolves reviewed PDF values`
   - Expected: `"annual_report_2025_pdf_reviewed_preview"`
   - Received: `"phase109_controlled_local_financials"`

## Root Cause Classification
**Classification: B. Legitimate regression from Phase 143/142 schema/read-path changes.**

**Details:**
The test failures are NOT stale expectations. They are symptoms of a silent database query error affecting the entire `getFinancialStatementSeries` read path.

In `src/lib/data-sources/financial-statement-read-service.ts`, the Prisma query attempts to `select` a field called `warningCodes` from the `unitMetadata` relation:
```typescript
unitMetadata: {
  select: {
    ...
    warningCodes: true, // <--- This field does not exist in Prisma schema
    ...
  }
}
```
The `FinancialStatementUnitMetadata` table in `prisma/schema.prisma` does not have a `warningCodes` field. Because of this schema mismatch, the Prisma query throws:
`Unknown field warningCodes for select statement on model FinancialStatementUnitMetadata.`

This exception is caught by the `try/catch` block in `getFinancialStatementSeries`, returning a `database_error`.
`loadFinancialsRuntimeData` receives this error and silently engages its fallback mechanism:
- For HPG (where `allowFallback` is true), it falls back to `"static_sample_financials"`.
- For MSN (where `allowFallback` is false), it defaults back to its starting placeholder `"phase109_controlled_local_financials"`.

This indicates that **all local DB reads for financial statements are currently failing** and silently returning fallbacks or empty results.

## Resolution
As instructed ("If failures indicate real regression, stop and report"), no code has been modified. The bug requires a narrow fix to `src/lib/data-sources/financial-statement-read-service.ts` to remove the invalid `warningCodes: true` selections, but it must be approved as it alters production read-path code.

- **DB write:** No.
- **Data seed/import:** No.
- **Rollback:** No.
- **Production deploy/import:** No.
- **Final validation result:** Remaining failures block full clean pass.
- **Remaining risks:** Financial statement read path is completely broken in staging/production due to the Prisma schema mismatch.
