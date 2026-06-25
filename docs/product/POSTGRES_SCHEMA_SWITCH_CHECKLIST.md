# PostgreSQL Schema Switch Checklist

This checklist prepares the future provider-switch phase. It does not authorize a provider change, migration generation, database write, or data import by itself.

## 1. Preconditions

- [ ] Work occurs in an explicit PostgreSQL transition branch/phase.
- [ ] `main` is clean and protected from unrelated changes.
- [ ] The pre-switch commit is tagged or otherwise recorded for rollback.
- [ ] A disposable local Docker PostgreSQL instance is available.
- [ ] A non-secret local connection string is configured outside Git:

```text
postgresql://atelier:atelier@localhost:5432/atelier_finance?schema=public
```

- [ ] No production database credentials are used.
- [ ] No production database write is allowed.
- [ ] Existing SQLite migration history is preserved in Git history before replacement.
- [ ] The planned PostgreSQL adapter/client strategy is confirmed against the pinned Prisma version.

## 2. Expected Minimum Provider-Switch Diff

The actual provider-switch phase should expect to touch at least:

- [ ] `prisma/schema.prisma`
  - change only the datasource provider from `sqlite` to `postgresql`;
  - avoid unrelated model/type cleanup in the baseline switch.
- [ ] `prisma/migrations/`
  - remove the three SQLite SQL migrations from the active migration path on the transition branch;
  - add one reviewed PostgreSQL baseline migration named `init_postgres`;
  - never apply SQLite SQL to PostgreSQL.
- [ ] `prisma.config.ts`
  - remove the `file:./dev.db` fallback for PostgreSQL workflows;
  - fail closed when `DATABASE_URL` is absent.
- [ ] `src/lib/database/client.ts`
  - replace `PrismaBetterSqlite3`;
  - remove the `file:`-only runtime check;
  - use the selected PostgreSQL Prisma adapter/client initialization.
- [ ] `package.json` and `package-lock.json`
  - add the PostgreSQL adapter/driver required by Prisma 7 (expected candidates: `@prisma/adapter-pg` and `pg`, subject to version verification);
  - remove `@prisma/adapter-better-sqlite3` only after no runtime/test path depends on it;
  - revise SQLite-specific `db:migrate`, `db:reset`, and possibly `db:seed` commands.
- [ ] `.env.example`
  - replace the local SQLite example with a PostgreSQL placeholder;
  - never add a real secret.
- [ ] Generated Prisma Client
  - run `npx prisma generate`;
  - generated output remains ignored and should not be committed unless repository policy changes.
- [ ] Local setup documentation
  - document Docker PostgreSQL startup, migration, reset, and troubleshooting.
- [ ] CI/Vercel assumptions
  - provide a PostgreSQL `DATABASE_URL` for build/test environments that initialize Prisma;
  - verify Vercel uses a separate protected PostgreSQL URL.
- [ ] Tests and smoke scripts
  - identify tests that require disposable PostgreSQL instead of temporary SQLite files;
  - remove accidental dependency on `file:./dev.db` from provider-neutral tests.

## 3. Files That Must Not Be Combined Into the Baseline Switch

- [ ] No reviewed-preview data import in the schema-switch commit.
- [ ] No runtime source-priority change.
- [ ] No VCB corporate mapping.
- [ ] No `productionApproved: true`.
- [ ] No conversion of String-encoded JSON payloads to Prisma `Json` in the same baseline.
- [ ] No unrelated metric, UI, AI, or investment-language change.

## 4. Migration Baseline Procedure

The future phase should use a disposable database and an isolated branch:

1. Record the pre-switch commit and create the transition branch.
2. Confirm Docker PostgreSQL is empty and disposable.
3. Change the Prisma datasource provider to PostgreSQL.
4. Point `DATABASE_URL` to the disposable local PostgreSQL instance.
5. Remove SQLite migrations from the active `prisma/migrations/` path only on the transition branch.
6. Generate a fresh baseline:

```bash
npx prisma migrate dev --name init_postgres
```

7. Stop and review the generated SQL before further work.
8. Verify:
   - native enum creation;
   - `timestamp(3)` DateTime columns and defaults;
   - Decimal precision/scale;
   - nullable columns;
   - unique constraints and indexes;
   - foreign-key delete/update actions;
   - cascade behavior for unit metadata;
   - all table and index names.
9. Run `npx prisma generate`.
10. Run the full validation suite.
11. Do not import data in this baseline phase.

## 5. Generated SQL Review Checklist

- [ ] All Prisma enums are emitted and contain the exact current values.
- [ ] `PermissionFlag` values `true`, `false`, and `unknown` are represented safely as enum labels.
- [ ] `DateTime` maps consistently and UTC application assumptions remain valid.
- [ ] Decimal columns do not truncate large VND values, shares, or fractional billion-VND debt.
- [ ] `Int` columns remain sufficient for fiscal years, quarters, counters, and row indexes.
- [ ] No `BigInt` or `Float` conversion is introduced accidentally.
- [ ] String fields containing JSON-like text retain String/Text storage for baseline parity.
- [ ] `User.email` unique behavior is acceptable with nullable values.
- [ ] `Company(ticker, exchange)` nullable-exchange uniqueness behavior is reviewed.
- [ ] Composite unique constraints for sidecars and manual rows are present.
- [ ] All declared indexes are present.
- [ ] Required relations use restrictive behavior unless explicitly optional.
- [ ] Optional relations use `SET NULL` where Prisma generates it.
- [ ] Unit metadata relations retain `ON DELETE CASCADE`.

## 6. Environment and Command Checklist

- [ ] `.env.local` is not committed.
- [ ] Local `DATABASE_URL` points to disposable Docker PostgreSQL.
- [ ] Staging and production use separate protected URLs.
- [ ] No SQLite fallback is active in production.
- [ ] `db:migrate` no longer executes a SQLite migration file directly.
- [ ] `db:reset` no longer deletes `dev.db` files.
- [ ] Sample seed behavior is explicitly local-only and reviewed separately.
- [ ] `npm run build` can run with the intended CI/Vercel environment.

## 7. Rollback

If the provider-switch dry run fails:

1. Stop before any production action or data import.
2. Preserve failure logs without committing secrets.
3. Revert the provider, adapter, package, config, and active migration changes as one scoped rollback.
4. Restore the last validated SQLite commit/branch state.
5. Drop only the disposable local PostgreSQL database if cleanup is needed.
6. Do not modify production.
7. Do not proceed to reviewed-preview import until migration and full validation pass.

## 8. Exit Criteria

- [ ] PostgreSQL baseline migration reviewed.
- [ ] Migration applies to an empty disposable PostgreSQL database.
- [ ] Prisma validate and generate pass.
- [ ] Typecheck, lint, tests, and build pass.
- [ ] No production DB write occurred.
- [ ] Rollback was documented and remains possible.
- [ ] Import work remains deferred to its dedicated phase.
