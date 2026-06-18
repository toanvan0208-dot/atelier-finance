# Database Service Layer

Date: 2026-06-18

Phase: 29C - Prisma Client & Data Service Skeleton

This phase adds a reusable Prisma client helper and a thin database service layer. It does not add API routes, connect frontend modules to the database, create a production data provider, call external APIs, add real authentication, or create migrations.

## Purpose

The service layer sits between future API routes and Prisma. API routes should stay thin: validate request shape, call a service, and return a safe response. They should not grow dense business logic, source-policy decisions, or module calculations.

The service layer is responsible for:

- centralizing Prisma access;
- keeping query ordering and filters consistent;
- preserving source, `asOf`, period, readiness, missing-field, and warning metadata;
- preventing silent fallback to mock/static data;
- keeping manual import persistence separate from production-approved records;
- giving later phases a stable boundary for adding data-contract validation before writes or responses.

## Client Helper

`src/lib/database/client.ts` exports a shared Prisma client instance. In development, it stores the instance on `globalThis` to avoid creating multiple clients during hot reload. It does not hardcode secrets and relies on `DATABASE_URL`.

Phase 29F.1 configures the Prisma 7 local runtime with `@prisma/adapter-better-sqlite3` for SQLite `file:` URLs. The helper fails clearly if `DATABASE_URL` is missing or not a local SQLite file URL. This keeps local API routes operational without changing the production target documented for later PostgreSQL work.

The generated Prisma client remains in `src/generated/prisma`, which is ignored by Git. The generated Prisma client is not committed. Developers must run `npm run prisma:generate` after installing dependencies or changing `prisma/schema.prisma`.

Regenerate it with:

```bash
npm run prisma:generate
```

## Services

Phase 29C adds:

- `listCompanies`
- `getCompanyByTicker`
- `getFinancialStatementsByTicker`
- `getLatestFinancialStatement`
- `getMarketPricesByTicker`
- `getLatestMarketPrice`
- `createManualImportSession`

These functions are skeletons for later API routes. They query or create database records through Prisma, but they do not connect any UI module to database data yet.

## Guardrails

The service layer keeps the Phase 26-29 guardrails intact:

- no silent mock fallback;
- no generated price conclusion fields;
- no transaction-guidance vocabulary in service code;
- no missing-to-zero conversion;
- financial and market fields remain nullable in the schema;
- canonical records keep source, `asOf`, period, data mode, readiness, `missingFields`, and `warningCodes`;
- manual import sessions default to `sourceType: user_input` and `dataMode: user_input`.

The services do not replace `src/lib/data-contract` or `src/lib/data-sources`. Later write/read services should call those existing guardrails before persisting normalized records or shaping API responses.

## Current Non-Scope

Phase 29C does not:

- create API routes;
- run a migration;
- connect Overview, Financials, Valuation, Risk, Watchlist, or Simulation to Prisma;
- ingest production data;
- approve a source;
- persist manual import rows end to end;
- create auth;
- commit or push changes.

## Next Step

Phase 29D can build on this layer by adding server-side manual import validation and persistence. Phase 29E can then bridge frontend modules to API responses while keeping sample/static data mode explicit.
