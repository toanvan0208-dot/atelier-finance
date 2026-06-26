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
The local testing suite is fully compatible with PostgreSQL and no tests are skipped (`0 skippedFiles, 0 skipped tests`). The Vitest parallel processing operates cleanly against `atelier_finance_test` without cross-test data wiping.

## Phase 142G-T-R Additions (VCB Fixture Guardrail Audit)
1. **VCB Test Fixture Isolation:** Updated `src/test-utils/smoke-test-seeder.ts` to assign VCB's dummy data specifically to a `postgres_test_fixture` source label rather than a production-like or candidate label.
2. **VCB Total Debt Safety:** Verified that VCB dummy total debt remains `null` (matching its bank mapping guardrail `needs_bank_mapping`), and it is never forcibly injected as corporate debt.
3. **VCB Production Status:** Verified that `productionApproved` stays `false` and `dataMode` is `research_only`/`test-only`.
4. Added VCB guardrail checks directly into `msn-pdf-reviewed-post-import-smoke.test.ts` so regressions are caught immediately.
5. Removed an outdated import in `fpt-financial-statement-prisma-temp-db-write-verification.test.ts` to resolve a typecheck error.
6. Ran full validation (`npx prisma validate`, `npx prisma generate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`) which succeeded entirely.
