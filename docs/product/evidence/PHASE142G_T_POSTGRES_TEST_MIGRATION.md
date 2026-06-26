# Phase 142G-T — PostgreSQL test migration and skipped-test elimination

## Context
During the PostgreSQL transition, several test files using `dev.db` (SQLite) were skipped (`describe.skip`) because they performed writes or deeply integrated reads that were incompatible with Postgres schemas. In this phase, we completed the migration of all remaining tests to run successfully against the local PostgreSQL test disposable database (`atelier_finance_test`).

## Actions Performed
1. Verified that there were 7 skipped files.
2. Created `src/test-utils/smoke-test-seeder.ts` to idempotently seed records needed by tests hitting Postgres without raising `P2002` Unique Constraint Violations.
3. Updated the smoke test files:
   - `fpt-pdf-reviewed-post-import-smoke.test.ts`
   - `hpg-pdf-reviewed-post-import-smoke.test.ts`
   - `msn-pdf-reviewed-post-import-smoke.test.ts`
   to dynamically inject `deps: { readSeries }` so `loadFinancialsRuntimeData` would read from `atelier_finance_test` instead of the global `dev.db` prisma instance.
4. Corrected parallelization cross-contamination where `runFinancialStatementLocalWriteTrial` tests (such as `fpt-financial-statement-prisma-temp-db-write-verification.test.ts`) were truncating the database via `env.reset()` during their teardown, causing the concurrent smoke tests to fail. Swapped `reset()` for targeted `deleteMany()` by unique `sourceLabel`s.
5. Seeded dummy values for `eps` and `sharesOutstanding` for VCB in the seeder, preventing its status from evaluating as "unavailable", which had caused tests asserting its default source priority to fail.
6. Removed `describe.skip` from all tests. Run `npm run test` ensuring `142 files` and `1185 tests` completely passed.

## Outcome
The local testing suite is fully compatible with PostgreSQL and no tests are skipped. The Vitest parallel processing operates cleanly against `atelier_finance_test` without cross-test data wiping.
