# Phase 142D: PostgreSQL Schema Transition Preparation

## Phase Summary

Phase 142D performed a read-only technical audit of the Prisma schema, SQLite migrations, database client, package commands, local seed/reset behavior, test assumptions, and controlled-write guards. It defines the exact expected change surface and safety checklist for a future PostgreSQL provider-switch phase.

This phase did not change the Prisma provider, schema, migration history, database, runtime logic, reviewed-preview data, or import behavior.

## Inputs From Prior Phases

- Phase 142A: PostgreSQL is the production target; `dev.db` is a local artifact and must not be copied to production.
- Phase 142B: current SQLite migrations and controlled import/write paths are not PostgreSQL-portable.
- Phase 142C:
  - `docs/product/AGENT_STANDING_RULES.md`
  - `docs/product/POSTGRES_TRANSITION_PLAN.md`

The Phase 142C standing rules and transition plan were treated as mandatory policy for this audit.

## Files Inspected

- `docs/product/AGENT_STANDING_RULES.md`
- `docs/product/POSTGRES_TRANSITION_PLAN.md`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql`
- `prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql`
- `prisma/migrations/20260621093000_phase_75_market_pvt_unit_metadata_sidecar/migration.sql`
- `prisma/seed.sql`
- `package.json`
- `.env.example`
- `.gitignore`
- `src/lib/database/client.ts`
- `src/lib/data-sources/financial-statement-local-write-guard.ts`
- `scripts/reset-local-db.mjs`
- SQLite-specific import, smoke, test, and verification references under `scripts/`, `src/lib/`, and `src/features/financials/lib/`
- CI/Vercel configuration presence: no tracked `.github` workflow or `vercel.json` was found during the audit.

No migration, reset, seed, import, confirm-write, `db push`, or database command was executed.

## Current Technical State

- Prisma datasource provider: `sqlite`.
- Prisma Client generator: `prisma-client`, output to ignored `src/generated/prisma`.
- Runtime database adapter: `@prisma/adapter-better-sqlite3`.
- Runtime client rejects every URL that does not start with `file:`.
- Prisma config defaults missing `DATABASE_URL` to `file:./dev.db`.
- Build command runs `prisma generate && next build`.
- Active migration directory contains three SQLite SQL migrations.
- `db:migrate` directly executes the first SQLite migration SQL file rather than using a provider-neutral deploy flow.
- `db:reset` deletes SQLite files and runs the SQLite-oriented migrate/seed commands.
- `prisma/seed.sql` is sample/demo local seed SQL and is not a reviewed-preview production dataset.
- Current controlled financial write guard explicitly rejects `postgres://` and `postgresql://`.

## Provider-Switch Impact Map

| Group | Current dependency | Minimum future change | Risk / review point |
| :--- | :--- | :--- | :--- |
| `prisma/schema.prisma` | `provider = "sqlite"` | Change to `postgresql` in an explicit switch phase | Must not combine with unrelated schema cleanup |
| `prisma/migrations/` | Three SQLite-specific SQL migrations using `TEXT`, `DATETIME`, inline primary keys and SQLite FK syntax | Replace active migration history on transition branch with fresh `init_postgres` baseline | Never apply current SQL to PostgreSQL; preserve old history in Git/tag |
| `prisma.config.ts` | Falls back to `file:./dev.db` | Require PostgreSQL `DATABASE_URL`; remove SQLite fallback | Fail closed if env is absent; no secrets in source |
| `src/lib/database/client.ts` | `PrismaBetterSqlite3`; `file:` URL check | Use validated PostgreSQL adapter/client initialization | Prisma 7 adapter/version compatibility must be confirmed |
| `package.json` / lockfile | `@prisma/adapter-better-sqlite3`; SQLite reset/migrate scripts | Add PostgreSQL adapter/driver; revise commands; eventually remove SQLite adapter | Expected candidates are `@prisma/adapter-pg` and `pg`, subject to pinned-version verification |
| Generated Prisma Client | Generated for current schema/provider and ignored | Regenerate after provider switch | Do not accidentally commit generated output |
| `.env.example` / local docs | SQLite example | PostgreSQL placeholder and Docker setup | Never commit `.env.local` or real credentials |
| `prisma/seed.sql` | Local sample/demo SQL | Review separately for PostgreSQL/local-only use or replace with provider-safe local seed | Must not become production reviewed-preview import |
| `scripts/reset-local-db.mjs` | Deletes `dev.db` and journal files | Replace with explicit disposable PostgreSQL reset workflow | Destructive DB reset must remain local and fail closed |
| Package DB scripts | `db:migrate` executes one SQLite SQL file; `db:seed` executes raw SQL | Adopt explicit Prisma migrate commands and local-only seed strategy | Avoid applying sample seed to production |
| CI/build | No tracked CI workflow; build runs Prisma generation | Provide PostgreSQL URL wherever build/runtime initializes Prisma | Vercel must use protected production PostgreSQL env |
| Tests/smokes | Many `file:./dev.db` and temporary SQLite assumptions | Classify provider-neutral unit tests vs PostgreSQL integration tests | Do not rewrite all tests blindly; use disposable PostgreSQL for integration paths |
| Import scripts/write guards | Defaults and guards accept only local SQLite | Handle in dedicated PostgreSQL-compatible import phase | Schema switch is not import authorization |

## Exact Expected File/Diff Surface for the Actual Switch

The minimum provider-switch commit is expected to modify:

1. `prisma/schema.prisma`
2. `prisma.config.ts`
3. `src/lib/database/client.ts`
4. `package.json`
5. `package-lock.json`
6. `.env.example`
7. `scripts/reset-local-db.mjs` or its replacement
8. Package database commands and local PostgreSQL setup documentation
9. The active files under `prisma/migrations/`
10. Tests directly coupled to the runtime adapter, SQLite URLs, reset flow, or migration behavior

The switch should delete the three SQLite SQL migrations from the active migration path only on the isolated transition branch and add a reviewed PostgreSQL `init_postgres` migration. Existing SQLite migrations remain recoverable in Git history and a recorded pre-switch commit/tag.

Import guards and deterministic reviewed-preview imports should remain a separate 142E concern unless the actual phase explicitly scopes and reviews them.

## Schema Compatibility Checklist

### Cross-Cutting Types

| Type/group | Current usage | Type change required? | PostgreSQL risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `DateTime` | Audit timestamps, report dates, trading dates, as-of dates, review dates | No Prisma type change required | PostgreSQL will use timestamp semantics instead of SQLite `DATETIME`; timezone assumptions can surface | Keep `DateTime`; review generated `timestamp(3)` SQL and continue storing/reading UTC |
| `Decimal` | Financial statements, market prices, shares, market cap, paper trades | No Prisma type change required for baseline | Generated PostgreSQL precision/scale must accommodate large VND values and fractional normalized debt | Review every generated Decimal column; consider explicit native precision only in a later scoped phase if needed |
| `Int` | Fiscal year/quarter, row indexes, counters | No | PostgreSQL `integer` range is sufficient for current uses | Keep `Int`; do not change to `BigInt` without evidence |
| `BigInt` | None in current schema | No | Accidental conversion would change JS serialization behavior | Do not introduce in baseline |
| `Float` | None in current schema | No | Floating-point storage would weaken exact financial values | Do not introduce; retain Decimal |
| JSON-like `String` | Arrays and payloads encoded as text | No for baseline | PostgreSQL supports native JSON, but changing now would alter defaults and application parsing | Retain String/Text for parity; consider Prisma `Json` only in a separate migration |
| Enums | 12 Prisma enums across source, quality, company, period, import, and paper-trade state | No Prisma model change | PostgreSQL emits native enums; labels/defaults and future enum changes require careful migration | Review generated enum SQL and exact labels, especially `PermissionFlag.true/false/unknown` |
| Nullable fields | Extensive optional metadata and financial values | No | Missing values must remain null; defaults must not create false values | Preserve nullability exactly; no missing-to-zero |

### Model-Level Review

| Model/group | Notable fields/constraints | Change required? | Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `User` | Nullable unique `email`; timestamps | No schema change | Unique-null behavior and timestamp mapping | Verify generated unique index and multiple-null behavior |
| `Company` | `CompanyType`, `DataMode`, nullable `exchange`, unique `(ticker, exchange)`, optional profile source | No | Multiple rows with null exchange remain possible; relation delete action must match intent | Preserve baseline; review composite unique and `SET NULL` relation |
| `FinancialStatement` | Many Decimal fields; nullable reviewed values; source/data-quality enums; String arrays | No | Precision, null preservation, source provenance, accidental liabilities/debt conflation | Preserve all fields; verify Decimal SQL, indexes, FKs; `totalLiabilities` remains a runtime distinction and must not be mapped to `totalDebt` |
| `FinancialStatementUnitMetadata` | Unique `(financialStatementId, field)`; Boolean `productionApproved`; cascade delete | No | Sidecar uniqueness and cascade are safety-critical | Verify unique index, Boolean default false, and `ON DELETE CASCADE` |
| `MarketPrice` | DateTime trading/as-of dates; Decimal prices/volume/value; source enums | No | Date/time and large trading-value precision | Preserve; review timestamp and Decimal columns plus indexes |
| `MarketPriceUnitMetadata` | Unique `(marketPriceId, field)`; optional as-of; cascade delete | No | Same sidecar safety concerns | Verify unique/index/cascade and false approval default |
| `DataSource` | Unique `(name, sourceType)`; many permission enums; String supported groups | No | Native enum labels and uniqueness affect provenance | Preserve exact values; review native enum SQL |
| `SourceEvidence` | Permission enums, evidence enum, String risks | No | Enum/default fidelity and optional dates | Preserve; keep risks as String for baseline |
| `DataQualityReport` | Status Strings, enums, multiple String arrays | No | JSON-like text must stay parse-compatible | Preserve String representation |
| `ManualImportSession` | Int counters, status/readiness enums, optional relations | No | Relation actions and local-import production exposure | Preserve; local import remains disabled/fail-closed in production |
| `ManualImportRecord` | Raw/normalized JSON-like Strings, unique `(sessionId, rowIndex)`, optional links | No | Payload parsing and FK `SET NULL` behavior | Preserve String payloads and unique/FK behavior |
| `Watchlist` | Optional user, required company, status/notes Strings | No | Relation delete actions | Review generated `SET NULL` for user and restrictive company FK |
| `PaperTrade` | Decimal prices/quantity, action/status enums, DateTime | No | Precision and enum mapping | Preserve Decimal and enums; no action language is introduced by migration |
| `AssistantInteraction` | Context and allowed values stored as JSON-like Strings; optional user/company | No | Large text payloads and JSON parse compatibility | Preserve String/Text baseline; verify indexes and nullable FKs |

### Relations, Indexes, and Delete Actions

- All declared `@@index`, `@@unique`, and `@unique` definitions must appear in generated SQL.
- Unit metadata relations must retain `ON DELETE CASCADE`.
- Optional relations should retain generated `SET NULL` behavior.
- Required relations should remain restrictive unless an explicit product requirement changes them.
- PostgreSQL identifier length and generated index names should be reviewed, though current names appear within normal limits.
- No relation should silently gain a destructive cascade during baseline generation.

## Migration Baseline Plan

The recommended future procedure is:

1. Record/tag the last validated SQLite commit.
2. Create an explicit transition branch/phase.
3. Provision an empty disposable Docker PostgreSQL database.
4. Configure a local uncommitted PostgreSQL `DATABASE_URL`.
5. Change the Prisma provider and runtime adapter in the scoped branch.
6. Remove SQLite migrations from the active migration path on that branch; rely on Git history/tag for archival.
7. Generate:

```bash
npx prisma migrate dev --name init_postgres
```

8. Do not continue automatically. Review the generated SQL line by line.
9. Validate native enums, timestamps, Decimal definitions, defaults, nullability, unique constraints, indexes, relations, and cascade actions.
10. Apply only to the disposable local PostgreSQL database.
11. Run `npx prisma generate` and the full validation suite.
12. Do not import reviewed-preview data in the baseline migration phase.

Current SQLite migrations must never be applied to PostgreSQL.

## Environment Plan

Local placeholder:

```text
postgresql://atelier:atelier@localhost:5432/atelier_finance?schema=public
```

Rules:

- Store the actual URL in uncommitted local environment configuration.
- Do not commit `.env` or `.env.local`.
- Remove the production SQLite fallback; production must fail closed if PostgreSQL `DATABASE_URL` is absent.
- Vercel production must use a separate protected PostgreSQL `DATABASE_URL`.
- Local, staging, and production credentials must be distinct.
- Do not expose connection strings in logs, evidence, screenshots, or commit messages.

## CI and Build Plan

- No tracked GitHub Actions workflow currently defines database setup.
- `npm run build` invokes `prisma generate` before Next.js build.
- The provider-switch phase must verify whether build-time route evaluation initializes the Prisma client and therefore requires a reachable PostgreSQL URL.
- CI should use a disposable PostgreSQL service/database for integration tests.
- Provider-neutral unit tests should remain isolated from database connectivity.
- Vercel build/runtime environment must provide the production PostgreSQL URL through protected settings.

## Rollback Plan

If the provider-switch dry run fails:

1. Stop before any production write or data import.
2. Preserve sanitized failure output.
3. Revert the provider, active migrations, adapter/client, dependencies, config, and scripts together.
4. Return to the recorded pre-switch commit or branch.
5. Drop only the disposable local PostgreSQL database if cleanup is necessary.
6. Do not change production.
7. Do not proceed to import work until migration, generate, tests, and build pass again.

## Import Dependency Warning

PostgreSQL schema readiness is not data-import readiness.

- Phase 142D does not bypass the SQLite-only write guard.
- Current reviewed-preview import scripts remain SQLite-bound.
- A dedicated PostgreSQL-compatible deterministic import phase is still required.
- Only FPT, HPG, VNM, MSN, and MWG may later use the corporate reviewed-preview import path.
- The allowed corporate fields remain `eps`, `sharesOutstanding`, and `totalDebt`.
- Reviewed-preview data remains `dataMode: research_only` and `productionApproved: false`.
- Missing fields remain null and are never converted to zero.
- `totalLiabilities`, accounts payable, bank deposits, and customer deposits must not become `totalDebt`.
- VCB remains excluded from the corporate path with `totalDebt: null` / `needs_bank_mapping`.

## Readiness Criteria for the Actual Provider Switch

The next switch phase may proceed only when:

- a disposable local/staging PostgreSQL target is ready;
- Docker or an approved connection string is available;
- the expected schema/client/package/migration diff is reviewed;
- the baseline migration is generated and reviewed;
- Prisma validate and generate pass;
- typecheck, lint, tests, and build pass;
- CI/build environment assumptions are documented;
- no production database write occurs;
- rollback steps are documented and tested conceptually;
- data import remains out of scope until its own phase.

## Non-Write and Non-Schema Confirmations

- DB write: No.
- Data import: No.
- Confirm-write: No.
- Prisma provider change: No.
- `prisma/schema.prisma` modification: No.
- Migration created, deleted, modified, or applied: No.
- `prisma migrate dev/deploy`, `prisma db push`, reset, or seed command: No.
- Runtime logic/source priority modification: No.
- Import script/write-guard modification: No.
- Reviewed-preview data modification: No.
- VCB banking behavior modification: No.
- `productionApproved: true`: No.
- Binary, local DB, env, secret, PDF, source-PDF, diagram, thesis, image, OCR, or temporary artifact committed: No.
- Investment advice wording introduced: No.

## Guardrails Reaffirmed

- No DB write or import.
- No schema, provider, or migration change.
- Reviewed-preview data remains `research_only` and not production-approved.
- No missing-to-zero.
- No `totalLiabilities`-as-`totalDebt`.
- VCB remains excluded from corporate import.
- No buy/sell/hold, trading signal, target price, fair value, upside/downside advice, or attractive/cheap/expensive recommendation.

## Validation Results

- `npx prisma validate`: passed, exit code 0.
- `npm run typecheck`: passed, exit code 0.
- `npm run lint`: passed, exit code 0, with one pre-existing out-of-scope warning in `scripts/smoke-real-http-six-ticker-workspace.ts` for unused `_e`.
- `npm test`: passed on the first run, exit code 0; 142 test files and 1,185 tests passed.
- `npm run build`: passed, exit code 0; Prisma Client generation and Next.js production build completed successfully.
- Result JSON parse check: passed.

## Final Git Status

Pre-commit status:

- No tracked modification exists outside Phase 142D.
- Three new Phase 142D documentation/evidence files are intended for selective staging.
- Allowed pre-existing untracked assets remain under `diagrams/`, `docs/product/evidence/source-pdfs/`, and `docs/thesis/`.
- `tsconfig.tsbuildinfo` was restored after validation.
- `prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/`, package files, runtime code, import scripts, write guards, generated Prisma output, local DB files, env files, and reviewed-preview data are unchanged.

## Recommended Next Phase

Recommended Phase 142E:

- **Option A - safest default:** create an isolated PostgreSQL schema-switch branch and executable dry-run instructions, without production write or reviewed-preview import.
- **Option B - if Docker PostgreSQL is already available:** perform the provider-switch and fresh `init_postgres` baseline dry run against a disposable local Docker PostgreSQL database in an explicitly controlled phase.

Option A is preferred unless the local Docker PostgreSQL target and connection details are confirmed before the phase begins.
