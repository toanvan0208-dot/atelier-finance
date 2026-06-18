# Local Database Workflow

Date: 2026-06-18

Phase: 29E - Local Database Migration & Seed Workflow

This document explains how to create a local SQLite database, apply the schema migration, seed safe sample/demo records, and test the Phase 29D read-only API routes. This workflow is for local development only. It is not a production data provider and does not connect frontend modules to the database.

## Database Target

Local development uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

Production target remains PostgreSQL. The SQLite workflow is only a low-friction development path for validating schema, services, and API route shape.

Phase 29F.1 uses Prisma 7 with the official `@prisma/adapter-better-sqlite3` driver adapter for local SQLite runtime access. The API runtime expects a `file:` SQLite `DATABASE_URL` in local development.

## Local Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

For local SQLite, keep:

```env
DATABASE_URL="file:./dev.db"
```

Do not commit `.env.local` or any real database credentials.

## Scripts

Phase 29E adds:

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

Existing Prisma scripts remain available:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Migration

Migration file:

```text
prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql
```

In this environment, `prisma migrate dev` and `prisma db push` returned a Prisma schema engine error without actionable detail. To keep the local workflow usable, Phase 29E creates the initial SQLite migration SQL with:

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql
```

Apply it locally with:

```bash
npm run db:migrate
```

`db:migrate` uses:

```bash
prisma db execute --file prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql
```

This creates the local SQLite schema but does not create production infrastructure.

## Seed

Seed file:

```text
prisma/seed.sql
```

Run:

```bash
npm run db:seed
```

The seed creates sample/demo records only:

- `DataSource`: `Atelier Finance sample dataset`
- `Company`: `FPTLAB`
- two `FinancialStatement` rows
- two `MarketPrice` rows
- one `SourceEvidence` row
- one `DataQualityReport` row

`FPTLAB` is a local lab/sample ticker and is not a real security ticker.

Seed records are explicitly marked as sample/demo/research-only:

- `dataMode`: `sample` or `demo`
- `sourceType`: `curated_internal`
- `usageStatus`: `research_only`
- `qualityStatus`: `sample` or `demo`
- `readiness`: `needs_review`
- warning codes include `DEMO_DATA`

The seed does not claim production approval and does not use official financial data.

## Reset

To rebuild the local database from scratch:

```bash
npm run db:reset
```

This removes local SQLite database files and then runs:

```bash
npm run db:migrate
npm run db:seed
```

Use this only for local development data.

## API Smoke Tests

Start the app:

```bash
npm run dev
```

Then test:

```bash
curl http://localhost:3000/api/companies
curl http://localhost:3000/api/companies/FPTLAB
curl http://localhost:3000/api/companies/FPTLAB/financials
curl "http://localhost:3000/api/companies/FPTLAB/financials?latest=true"
curl http://localhost:3000/api/companies/FPTLAB/market-prices
curl "http://localhost:3000/api/companies/FPTLAB/market-prices?latest=true"
```

The API responses should include `ok`, `status`, `data`, and source/readiness metadata from the database records. The routes do not fall back to static or mock feature data when the database is empty.

## Files Not To Commit

Do not commit:

- `.env.local`
- `dev.db`
- `dev.db-journal`
- `prisma/dev.db`
- `prisma/dev.db-journal`
- `.next-dev.log`
- `.next-dev.err.log`
- `src/generated/prisma`

The generated Prisma client is not committed. Run:

```bash
npm run prisma:generate
```

after installing dependencies or changing `prisma/schema.prisma`.

## Guardrails

The local seed and workflow keep the existing product guardrails:

- no production-approved source claim;
- no external API call;
- no frontend module integration;
- no manual import persistence;
- no missing-to-zero conversion;
- numeric fields remain nullable where data may be unavailable;
- sample/demo data stays labeled through `dataMode`, `qualityStatus`, `readiness`, `missingFields`, and `warningCodes`.
