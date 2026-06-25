# Phase 142B: PostgreSQL Compatibility Audit & Local Setup Plan

## 1. Phase Summary
This phase audited the Atelier Finance repository to assess its readiness for migrating from the local SQLite (`dev.db`) database to a PostgreSQL production environment. The audit reviewed Prisma configurations, existing migrations, data models, and import scripts to identify blockers and establish a safe transition strategy without modifying the existing codebase or database.

## 2. Current Prisma/Provider State
- **Current Provider:** `sqlite` (defined in `prisma/schema.prisma`).
- **DATABASE_URL Fallback:** `process.env.DATABASE_URL ?? "file:./dev.db"` (defined in `prisma.config.ts`).
- **SQLite-Specific Configs:** The repository relies heavily on SQLite file-based configurations and default behaviors (e.g., simulating Enums with `TEXT` strings).

## 3. Migration Portability Audit
- **Result:** **NOT PORTABLE.**
- Existing files in `prisma/migrations/` contain syntax highly specific to SQLite, such as mapping Enums to `TEXT` strings with default constraints (e.g., `DEFAULT 'unknown'`) and using SQLite's `DATETIME` syntax.
- Prisma cannot apply these SQLite-generated SQL files directly to a PostgreSQL database.
- **Recommendation:** When switching to PostgreSQL, the entire `prisma/migrations` folder must be safely removed, the provider switched to `postgresql`, and a fresh baseline migration generated via `npx prisma migrate dev --name init_postgres`.

## 4. Model Compatibility Audit
- **Enums:** Prisma simulates Enums in SQLite using `TEXT` fields. Moving to PostgreSQL allows Prisma to use native database `ENUM` types, which is a major upgrade but confirms the need for a fresh migration.
- **DateTime:** Handled abstraction cleanly by Prisma, but the underlying column type will switch from SQLite's `DATETIME` to PostgreSQL's `timestamp(3)`.
- **Decimal:** Fully supported in PostgreSQL as `DECIMAL`.
- **JSON:** Current schema uses `String @default("[]")` for arrays instead of `Json` type (as SQLite has limited JSON type support). This is compatible with PostgreSQL, though migrating these fields to native `Json` arrays later would be beneficial.
- **Relations:** Cascade deletes and relations are correctly abstracted by Prisma and will translate smoothly to PostgreSQL.

## 5. Script Portability Audit
- **Result:** **NOT PORTABLE.**
- **`scripts/reset-local-db.mjs`:** Hardcodes the deletion of SQLite files (`dev.db`, `dev.db-journal`). This will crash or be useless in a PostgreSQL environment.
- **Import Scripts (e.g., `import-reviewed-source-records.ts`):** The underlying library `financial-statement-local-write-guard.ts` **explicitly rejects** any remote database URLs (like `postgres://` or `postgresql://`) and strictly enforces that `DATABASE_URL` starts with `file:`.
- **Recommendation:** A new PostgreSQL-compatible deterministic seed/import script (or an update to the current guard) is required to allow controlled writes to the PostgreSQL instance.

## 6. PostgreSQL Local/Staging Setup Recommendation
- **Infrastructure:** Use Docker (local) or a managed service like Neon/Supabase for staging.
- **Connection String:** Define `DATABASE_URL` in `.env.local` pointing to the PostgreSQL instance (e.g., `postgresql://user:password@localhost:5432/atelier`).
- **Action Plan:** Switch `provider = "postgresql"`, delete old migrations, generate a fresh migration, and run Prisma generate.

## 7. Dual SQLite/PostgreSQL Strategy
- **Should we keep SQLite for local dev and PostgreSQL for production?** **NO.**
- Maintaining parity between SQLite and PostgreSQL in a single Prisma schema is notoriously complex due to type discrepancies (Native Enums, JSON support, etc.).
- **Strategy:** The repository should fully transition local development to use PostgreSQL (via Docker or remote dev DBs) to ensure Dev/Prod parity and prevent insidious bugs.

## 8. Production Data Guardrails
Regardless of the database provider, any data migration or script execution must adhere to:
- `productionApproved: false` for all imported data.
- `dataMode: research_only`.
- **No missing-to-zero conversions.**
- **No `totalLiabilities-as-totalDebt`:** Prevent naive mapping.
- **VCB Caveat:** VCB must strictly use the bank-specific candidate path, keeping `totalDebt` as `null` or `needs_bank_mapping`. It must not be imported via the standard corporate path.
- **No sample/fallback-as-real.**
- **No Investment Advice Wording:** The product remains strictly for research.

## 9. Risks and Blockers
- **Blocker:** Import scripts actively block PostgreSQL URLs.
- **Blocker:** Existing SQLite migrations will crash if run against PostgreSQL.
- **Risk:** Developers accidentally pushing `dev.db` data to production via third-party tools instead of using deterministic, provenance-backed scripts.

## 10. Recommended Next Phases
- **142C:** Create a PostgreSQL-compatible deterministic import script for the reviewed-preview data, bypassing the SQLite-only write guard.
- **142D:** Perform a full local staging dry-run of the PostgreSQL transition (switch schema, generate migration, run import script) against a temporary local Postgres DB.
- **142E:** Deploy to production.

## 11. Non-Write / Non-Schema Confirmations
- No database writes were performed.
- No schema changes were made.
- No migrations were created or deleted.
- No data was imported.
