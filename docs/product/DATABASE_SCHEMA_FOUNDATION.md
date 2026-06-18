# Database Schema Foundation

Date: 2026-06-18

Phase: 29B - Database Schema Foundation

This phase adds the first Prisma schema foundation for Atelier Finance. It does not connect frontend modules to the database, add production data providers, call external APIs, add real authentication, migrate existing module data, or create backend API routes.

## Stack Decision

Development setup:

- Prisma schema in `prisma/schema.prisma`.
- Prisma CLI config in `prisma.config.ts`.
- SQLite as the low-friction development database provider.
- Local connection example: `DATABASE_URL="file:./dev.db"`.
- If `DATABASE_URL` is not set locally, `prisma.config.ts` falls back to `file:./dev.db`.

Production target:

- PostgreSQL remains the intended production database.
- The current schema keeps JSON-like collections as serialized strings for SQLite compatibility. When moving to PostgreSQL, fields such as `missingFields`, `warningCodes`, `errorCodes`, `topIssues`, `fieldCoverage`, `rawPayload`, and `normalizedPayload` can be reviewed for migration to `Json` or typed join tables.

## Package Scripts

Phase 29B adds:

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

No migration file is created in this phase. The schema is validated and Prisma Client can be generated, but database creation/migration can wait until the team is ready to create the first local dev database.

## Entity Overview

The schema includes the required foundation entities:

| Entity | Purpose |
| --- | --- |
| `User` | Placeholder owner for future user-scoped imports, watchlists, paper trades, and assistant interactions. No real auth is implemented in this phase. |
| `Company` | Canonical company identity with `ticker`, `exchange`, `companyName`, `companyType`, industry, currency, and profile source metadata. |
| `FinancialStatement` | Normalized financial records by company, period, source, and `asOf`; financial numeric fields are nullable. |
| `MarketPrice` | Market observations by company, trading date, source, and `asOf`; price/volume fields are nullable. |
| `DataSource` | Source registry with source type, usage status, license/ToS status, access method, caching/runtime/display/derived-data flags. |
| `SourceEvidence` | Evidence and review metadata required before a source can be treated as production-approved. |
| `DataQualityReport` | Stored readiness, quality, issue, field coverage, and safe-next-step output for future services/imports. |
| `ManualImportSession` | User-provided import attempt metadata with source mode, counts, status, readiness, and report link. |
| `ManualImportRecord` | Row-level manual import raw/normalized payloads, missing fields, warnings, errors, and links to normalized records. |
| `Watchlist` | User-scoped watchlist workflow state with data mode and readiness. |
| `PaperTrade` | Simulation/paper trade state without real execution integration. |
| `AssistantInteraction` | AI/RAG audit record with module context, data-quality context, allowed numeric values, source mode, and readiness. |

## Data Mode Separation

The schema uses `DataMode` to keep product data classes separate:

- `sample`
- `demo`
- `user_input`
- `research_only`
- `production_approved`
- `blocked`
- `unknown`

`DataSource.usageStatus` separately tracks source policy state:

- `approved`
- `needs_legal_review`
- `blocked`
- `research_only`
- `unknown`

This prevents manual CSV records or research-only sources from being silently promoted into production-approved data.

## Source And Evidence Semantics

Canonical financial and market records require:

- `sourceId`
- `sourceLabel`
- `sourceType`
- `dataMode`
- `asOf`
- `period`
- `periodType`

`DataSource` and `SourceEvidence` preserve source rights and review state before production use. `PermissionFlag` tracks `true`, `false`, and `unknown` states for runtime display, caching, redistribution, commercial use, and derived data.

## Guardrails Reflected In Schema

The schema preserves current data-contract semantics:

- Financial and market numeric fields are nullable so missing data remains missing instead of becoming `0`.
- `FinancialStatement.companyType` and `Company.companyType` support `non_financial`, `bank`, `securities`, `insurance`, and `unknown`, so future services can avoid applying non-financial ratios mechanically to financial companies.
- `qualityStatus` and `readiness` appear on canonical records and workflow records.
- `missingFields`, `warningCodes`, and `errorCodes` are stored as serialized arrays for SQLite compatibility.
- Manual import records store `warnings`, `errors`, `unmappedFields`, and `missingFields` separately from normalized canonical records.
- `DataMode` and `SourceUsageStatus` separate sample/demo/user/research/approved/blocked states.
- The schema does not add default `targetPrice`, `fairValue`, `recommendation`, or `signal` fields.

The database schema is not a replacement for runtime validation. Phase 29C/29D services should still call existing `src/lib/data-contract` and `src/lib/data-sources` guardrails before writing or returning records.

## Manual Import Positioning

Manual CSV remains a secondary user-provided source adapter:

- `ManualImportSession.dataMode` defaults to `user_input`.
- `ManualImportRecord.dataMode` defaults to `user_input`.
- `ManualImportRecord.sourceType` defaults to `user_input`.
- Row-level payloads and diagnostics are stored separately from canonical `FinancialStatement` and `MarketPrice` records.

Manual imports must not become the main database source or production-approved data without explicit review and promotion rules in a later phase.

## What This Phase Does Not Do

Phase 29B does not:

- connect UI modules to Prisma;
- create API routes;
- call a real data provider;
- run a production migration;
- create real authentication;
- migrate existing static feature data;
- persist manual import submissions through the app;
- stage, commit, or push changes.

## Next Steps

Recommended sequence:

1. Phase 29C: add thin API/data-service foundation that reads through Prisma and returns data-contract-shaped responses.
2. Phase 29D: persist manual import sessions server-side with existing validation/reporting logic.
3. Phase 29E: bridge frontend modules to API responses while keeping sample/static mode explicit.
4. Phase 30: pilot a source adapter only after source evidence is reviewed.
