# Atelier Finance PostgreSQL Transition Plan

## 1. Current State

- Prisma currently uses `provider = "sqlite"`.
- Local development uses the SQLite `dev.db` artifact.
- PostgreSQL is the intended production database.
- Existing migrations were generated for SQLite and are not portable to PostgreSQL.
- Current controlled import scripts are not PostgreSQL-portable because the local write guard rejects `postgresql://` and `postgres://` URLs.
- Phase 142C does not change the provider, schema, migrations, database, import scripts, or runtime behavior.

## 2. Target State

- Local development, staging, and production use PostgreSQL for Dev/Prod parity.
- Prisma uses `provider = "postgresql"`.
- PostgreSQL starts from a fresh, reviewed baseline migration rather than applying SQLite SQL.
- Reviewed-preview data is loaded by deterministic, idempotent import scripts.
- Reviewed-preview records remain:
  - `dataMode: research_only`
  - `productionApproved: false`
- Duplicate import runs skip safely and do not overwrite unrelated source rows.

## 3. Why `dev.db` Must Not Be Copied

The local SQLite database is not a production seed:

- It may contain local, test, sample, temporary, duplicate, or polluted rows.
- A SQLite-to-PostgreSQL lift-and-shift introduces type, enum, decimal, date/time, relation, and provenance mapping risks.
- It cannot prove that only approved reviewed-preview fields were transferred.
- It can bypass current missing-data, source-label, unit, idempotency, and production-approval guardrails.
- A copied database would make the production dataset difficult to reproduce and audit.

The correct path is a fresh PostgreSQL database plus reviewed migrations and deterministic provenance-backed imports.

## 4. Proposed Phase Roadmap

### Phase 142D - PostgreSQL Schema Transition Preparation

- Work on an explicit transition branch/phase.
- Prepare the provider-switch and fresh-baseline migration plan.
- Audit Prisma client/adapter and package implications.
- Do not write to production.
- Do not delete existing migrations casually on `main`.
- Require explicit confirmation before changing the provider or migration history.

### Phase 142E - PostgreSQL-Compatible Reviewed-Preview Import

- Create or adapt a deterministic PostgreSQL-compatible import path.
- Remove the SQLite-only assumption only inside an explicitly guarded PostgreSQL workflow.
- Dry-run first.
- Limit corporate imports to the approved five tickers and three fields.
- Preserve idempotency, source provenance, units, `research_only`, and `productionApproved: false`.

### Phase 142F - Local Docker PostgreSQL Dry Run

- Start a disposable local PostgreSQL instance.
- Apply the fresh PostgreSQL baseline migration.
- Run Prisma generation.
- Run reviewed-preview import dry-run and controlled write.
- Re-run import to prove duplicate skip.
- Run runtime, HTTP, and product smoke checks.

### Phase 142G - Staging PostgreSQL Dry Run

- Use Neon, Supabase, or another approved staging PostgreSQL service if available.
- Apply migrations and deterministic reviewed-preview imports in staging only.
- Verify environment configuration, connection security, idempotency, and application smoke.
- Do not treat staging data as production-approved.

### Phase 142H - Production PostgreSQL Setup and Import

- Proceed only after explicit confirmation.
- Provision a fresh production PostgreSQL database.
- Apply the reviewed PostgreSQL migration baseline.
- Run deterministic reviewed-preview dry-run.
- Execute the controlled import only after dry-run approval.
- Verify duplicate skip, source preservation, and production environment guardrails.

### Phase 142I - Vercel Live URL Smoke

- Verify the deployed Vercel application against production PostgreSQL.
- Check runtime reads, API/HTTP routes, source metadata, missing-data behavior, assistant boundaries, and six-ticker behavior.
- Confirm no SQLite/local import path is active in production.

This roadmap supersedes earlier tentative phase numbering in the Phase 142A/142B audit documents.

## 5. PostgreSQL Setup Recommendation

- Use Docker PostgreSQL for local development parity.
- Use Neon or Supabase for staging when a managed environment is useful.
- Example local placeholder only:

```text
postgresql://atelier:atelier@localhost:5432/atelier_finance?schema=public
```

- Do not commit `.env` or `.env.local`.
- Vercel must receive a PostgreSQL `DATABASE_URL` through protected environment configuration.
- Never place a real password, token, or hosted connection string in repository documentation or source code.

## 6. Migration Handling

- Do not apply the existing SQLite migrations to PostgreSQL.
- Generate and review a fresh PostgreSQL baseline migration after the provider switch is explicitly authorized.
- Do not delete or rewrite existing migration history casually on `main`.
- Preserve the SQLite migration history until a dedicated transition phase defines branch strategy, archival approach, and cutover procedure.
- Provider switch, migration replacement, and baseline generation must occur in an explicit phase with confirmation and rollback planning.

## 7. Deterministic Data Import Plan

### Corporate Tickers

The deterministic reviewed-preview import covers:

- FPT
- HPG
- VNM
- MSN
- MWG

Required source:

```text
annual_report_2025_pdf_reviewed_preview
```

Allowed imported fields:

- `eps`
- `sharesOutstanding`
- `totalDebt`

Excluded fields:

- `revenue`
- `netIncome`
- `totalAssets`
- `equity`
- `cashAndEquivalents`
- `capitalExpenditure`
- `operatingCashFlow`

Required metadata and behavior:

- `dataMode: research_only`
- `productionApproved: false`
- explicit accepted units;
- deterministic values and ticker allowlist;
- dry-run before write;
- explicit confirm-write;
- idempotent duplicate skip;
- no overwrite or deletion of unrelated source rows;
- no missing-to-zero;
- no `totalLiabilities`-as-`totalDebt`;
- no double-counted debt components.

### VCB Banking Caveat

- Do not import VCB through the corporate path.
- Keep VCB on the bank-specific/candidate path.
- Keep `totalDebt` as `null` / `needs_bank_mapping`.
- Do not map deposits, customer deposits, accounts payable, or total liabilities to debt.
- A future dedicated bank model and provenance phase is required before any VCB debt mapping.

## 8. Required Production Environment

- `DATABASE_URL`: required and must point to PostgreSQL.
- `OPENAI_API_KEY`: optional when required by the selected assistant provider.
- Assistant provider environment variables: configure explicitly for the deployed provider.
- Local/manual import write guard: disabled or fail-closed in production.
- VNStock SSL bypass: disabled; never use `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.
- No local SQLite fallback in production.
- No secrets, `.env`, or `.env.local` in Git.

## 9. Readiness Criteria Before Production Import

All criteria must pass:

- PostgreSQL provider/schema transition reviewed and approved.
- Fresh PostgreSQL baseline migration applies successfully.
- `npx prisma generate` succeeds.
- `npx prisma validate`, typecheck, lint, tests, and build pass.
- Reviewed-preview import dry-run accepts only the approved rows and fields.
- Confirm-write inserts exactly the intended rows.
- Duplicate re-run skips safely.
- Unit metadata is preserved.
- Existing source rows are not overwritten or deleted unexpectedly.
- Runtime and HTTP smoke tests pass.
- Vercel environment uses PostgreSQL.
- `productionApproved: true` is absent for reviewed-preview data.
- Missing values remain missing and are never converted to zero.
- VCB remains outside the corporate import path.
- Product and AI output contain no investment recommendation language.

## 10. Cutover Principle

Do not maintain SQLite local development and PostgreSQL production as a long-term dual-provider architecture. After a successful transition dry run, move local development to PostgreSQL so local, staging, and production exercise the same database semantics.
