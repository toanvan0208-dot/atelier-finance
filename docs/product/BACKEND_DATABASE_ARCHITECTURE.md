# Backend & Database Architecture

Date: 2026-06-18

Phase: 29A - Backend & Database Architecture Plan

This document defines the backend and database direction for Atelier Finance after the Manual Data Import Workspace. It is an architecture plan only. It does not add runtime code, create a database, call external APIs, add packages, or connect frontend modules to persisted data.

## Current Baseline

Atelier Finance is currently a Next.js application with:

- `src/app` for routes, including `/workspace`, `/data-import`, and the existing `/api/assistant` route.
- `src/features` for module UI and module-specific static/sample data.
- `src/lib/data-contract` for normalized record types, readiness checks, source metadata, and module bridge logic.
- `src/lib/data-sources` for source policy, source evidence, adapter contracts, mock/manual upload adapters, CSV parsing, and validation/reporting.
- `src/components/data-import` for the manual CSV workspace.
- `docs/product` for data-source policy, manual import scope, and product roadmap.

The current package stack is frontend-first: Next.js, React, TypeScript, Tailwind, Vitest, and Playwright. No database client, ORM, migration tool, or persistence layer is installed yet.

## Goals

The backend/database layer should become the main product data spine for Atelier Finance. It should:

- persist company, statement, market, source, quality, watchlist, simulation, and assistant interaction data;
- expose controlled API boundaries for frontend modules;
- preserve `source`, `asOf`, `period`, missing-field, stale, and warning metadata at record level;
- separate mock/static data, user-provided manual data, and production-approved data;
- enforce source evidence and data-quality guardrails on the server side;
- allow modules to fetch canonical records through a stable contract instead of reading static feature data forever;
- prepare for future approved source adapters without treating manual CSV as the primary architecture.

## Role Of The Backend

The backend should be the controlled boundary between UI modules, source adapters, validation logic, and persisted data.

Its responsibilities:

- API routing for module data reads and manual import writes.
- Server-side validation using the existing data-contract and data-source rules.
- Data service orchestration for companies, financials, market prices, valuation inputs, manual imports, watchlists, paper trades, and assistant context.
- Source approval checks before any data enters production-approved paths.
- Auditability for who/what created a record, when it was collected, which period it covers, and which source evidence supports it.
- Response shaping so frontend modules receive canonical records plus readiness and warnings, not raw database rows.

The backend should not bypass the existing guardrails. It should call them earlier and more consistently.

## Role Of The Database

The database should store durable, queryable records with explicit lineage. It is not just a cache for frontend state.

Its responsibilities:

- Store canonical entities and source metadata.
- Preserve raw/imported payload references where allowed.
- Track normalized records separately from user-provided import rows.
- Support duplicate detection by ticker, period, source, and `asOf`.
- Support data-quality reports and manual review status.
- Provide enough historical depth for Financials, Valuation, Risk, PVT, Watchlist, Simulation, and AI/RAG context.
- Avoid silently mixing sample, user-provided, and production-approved records.

## Data Classes

### Mock / Static Data

Mock/static data is local product scaffolding. It may exist in `src/features/**/data` and tests, but it must remain labeled as sample/demo/static when surfaced.

Rules:

- Must not be promoted to production-approved data.
- Must not be used as fallback when a real source is blocked or unavailable.
- Should be replaceable behind API-driven module bridges over time.

### Manual User-Provided Data

Manual data is supplied by the user, currently through CSV preview. It is useful for thesis verification, learning workflows, and user-owned data checks.

Rules:

- `sourceType` should remain `user_input`.
- Records must carry `source`, `asOf`, `period`, missing fields, readiness, and warnings.
- Persistence must store the import session, row-level parse results, validation report, and normalized records separately.
- Manual data should not become production-approved automatically.

### Production-Approved Data

Production-approved data is data whose source evidence, license/ToS status, runtime display rights, caching rights, and derived-data rights have been reviewed.

Rules:

- Must have verified `DataSource` and `SourceEvidence` records.
- Must pass source policy checks for the current runtime mode.
- Must include record-level `source`, `asOf`, and `period`.
- Must expose data quality/readiness in API responses.
- Must not be inferred from missing, stale, blocked, or user-provided records.

## Proposed Architecture

```text
frontend modules
  -> API routes / backend handlers
  -> data service layer
  -> database
  -> data contract validation/readiness
  -> module bridge
  -> module-specific view models
```

### Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| Frontend modules | Render module views, request canonical data, show readiness/warnings, avoid local source policy decisions. |
| API routes/backend | Authenticate later, validate request shape, call services, return safe JSON responses. |
| Data service | Query DB, resolve source priority, normalize records, call validation, compose module inputs. |
| Database | Persist canonical records, metadata, evidence, import sessions, reports, user workflows, and interaction logs. |
| Data contract | Keep missing values as missing, assess metadata, validate EPS/equity/denominators, produce readiness. |
| Module bridge | Convert canonical records into `financial-logic` and feature module inputs without duplicating calculations. |

## Proposed Stack

Preferred stack:

- Prisma as the ORM and migration layer.
- PostgreSQL for production.

Practical development option:

- Prisma + SQLite for local development.
- Prisma + PostgreSQL for production and staging.

Decision note:

- PostgreSQL should be the production target because Atelier Finance needs relational integrity, historical records, source lineage, JSON metadata where useful, and future query growth.
- SQLite can reduce local setup friction in Phase 29B/29C, but schemas must be designed so they migrate cleanly to PostgreSQL.
- No package should be added in Phase 29A. Prisma/database setup belongs to Phase 29B.

## Proposed Entities

### Company

Purpose: canonical company/security identity used across modules.

Suggested fields:

- `id`
- `ticker`
- `exchange`
- `companyName`
- `companyType`
- `industryCode`
- `industryName`
- `country`
- `currency`
- `profileSourceId`
- `profileAsOf`
- `createdAt`
- `updatedAt`

### FinancialStatement

Purpose: normalized financial statement observations by company and period.

Suggested fields:

- `id`
- `companyId`
- `ticker`
- `periodType`
- `period`
- `fiscalYear`
- `fiscalQuarter`
- `reportDate`
- `publishedDate`
- `currency`
- `unit`
- `revenue`
- `grossProfit`
- `netIncome`
- `operatingCashFlow`
- `totalAssets`
- `equity`
- `totalDebt`
- `currentAssets`
- `currentLiabilities`
- `sourceId`
- `asOf`
- `collectedAt`
- `qualityStatus`
- `missingFields`
- `warningCodes`
- `createdAt`
- `updatedAt`

### MarketPrice

Purpose: market observations used by Overview, Valuation, Risk, PVT, Watchlist, and Simulation.

Suggested fields:

- `id`
- `companyId`
- `ticker`
- `tradingDate`
- `openPrice`
- `highPrice`
- `lowPrice`
- `closePrice`
- `previousClose`
- `adjustedClosePrice`
- `volume`
- `tradingValue`
- `marketCap`
- `currency`
- `sourceId`
- `asOf`
- `collectedAt`
- `qualityStatus`
- `missingFields`
- `warningCodes`
- `createdAt`
- `updatedAt`

### DataSource

Purpose: registry entry for source identity, status, allowed modes, and source type.

Suggested fields:

- `id`
- `name`
- `sourceType`
- `supportedDataGroups`
- `usageStatus`
- `licenseStatus`
- `tosStatus`
- `accessMethod`
- `cachingAllowed`
- `redistributionAllowed`
- `runtimeDisplayAllowed`
- `derivedDataAllowed`
- `attributionText`
- `notes`
- `createdAt`
- `updatedAt`

### SourceEvidence

Purpose: evidence record required before production-approved use.

Suggested fields:

- `id`
- `sourceId`
- `homepageUrl`
- `documentationUrl`
- `licenseName`
- `licenseUrl`
- `termsUrl`
- `allowsCommercialUse`
- `allowsRuntimeDisplay`
- `allowsCaching`
- `allowsRedistribution`
- `allowsDerivedData`
- `requiresAttribution`
- `evidenceStatus`
- `reviewedAt`
- `reviewedBy`
- `reviewNote`
- `risks`
- `blockedReason`
- `createdAt`
- `updatedAt`

### DataQualityReport

Purpose: stores validation/readiness output for a dataset, import session, or canonical record group.

Suggested fields:

- `id`
- `scopeType`
- `scopeId`
- `status`
- `readiness`
- `missingFields`
- `warningCodes`
- `errorCodes`
- `topIssues`
- `fieldCoverage`
- `safeNextSteps`
- `generatedAt`
- `calculationVersion`

### ManualImportSession

Purpose: server-side record of a user-provided import attempt.

Suggested fields:

- `id`
- `userId`
- `mode`
- `sourceLabel`
- `targetTicker`
- `targetPeriod`
- `fileName`
- `rowCount`
- `validRowCount`
- `warningRowCount`
- `errorRowCount`
- `status`
- `dataQualityReportId`
- `createdAt`
- `updatedAt`

### ManualImportRecord

Purpose: row-level imported data, parse result, normalized output links, and errors.

Suggested fields:

- `id`
- `sessionId`
- `rowIndex`
- `rawPayload`
- `normalizedPayload`
- `ticker`
- `period`
- `asOf`
- `readiness`
- `warnings`
- `errors`
- `unmappedFields`
- `missingFields`
- `financialStatementId`
- `marketPriceId`
- `createdAt`
- `updatedAt`

### Watchlist

Purpose: persisted user watchlist and analysis workflow state.

Suggested fields:

- `id`
- `userId`
- `companyId`
- `ticker`
- `status`
- `priority`
- `notes`
- `thesisSummary`
- `dataMode`
- `createdAt`
- `updatedAt`

### PaperTrade

Purpose: simulation/paper trading state without representing real execution.

Suggested fields:

- `id`
- `userId`
- `companyId`
- `ticker`
- `action`
- `quantity`
- `entryPrice`
- `exitPrice`
- `openedAt`
- `closedAt`
- `status`
- `thesisSnapshot`
- `reflection`
- `sourceMode`
- `createdAt`
- `updatedAt`

### AssistantInteraction

Purpose: audit AI/RAG interactions, module context, data quality context, and provider status.

Suggested fields:

- `id`
- `userId`
- `activeModule`
- `ticker`
- `question`
- `answer`
- `provider`
- `llmStatus`
- `moduleContext`
- `dataQualityContext`
- `allowedNumericValues`
- `source`
- `createdAt`

## Proposed API Routes

Route names can follow Next.js App Router conventions under `src/app/api`.

### `GET /api/companies`

Purpose: list companies available to the product runtime.

Response should include:

- company identity;
- latest source/data mode;
- basic data-quality summary;
- no unreviewed source promotion.

### `GET /api/companies/[ticker]`

Purpose: fetch one company profile by ticker.

Response should include:

- `Company` fields;
- source metadata;
- latest readiness summary for linked data groups.

### `GET /api/companies/[ticker]/financials`

Purpose: fetch normalized financial statements for a ticker.

Response should include:

- canonical `FinancialStatement` records;
- record-level `source`, `asOf`, `period`;
- readiness, missing fields, and warnings;
- optional module bridge output for Financials when requested.

### `GET /api/companies/[ticker]/valuation-inputs`

Purpose: fetch valuation input records derived from financial statements and market prices.

Response should include:

- close price, EPS, BVPS, shares outstanding, market cap, and supporting metadata;
- blocked/missing reasons when inputs are insufficient;
- no fair value or target price output when required data is missing.

### `POST /api/manual-import`

Purpose: accept a user-provided manual import payload after server-side validation.

Request should include:

- CSV text or parsed rows;
- optional `targetTicker`;
- optional `targetPeriod`;
- user-provided source label;
- runtime mode, initially `thesis_verification`.

Response should include:

- `ManualImportSession`;
- row-level `ManualImportRecord` summary;
- `DataQualityReport`;
- selected canonical record previews when valid.

### `GET /api/manual-import/[sessionId]`

Purpose: retrieve a manual import session and its validation/report state.

Response should include:

- session metadata;
- row summaries;
- data-quality report;
- links to normalized records if persisted;
- clear `user_input` source mode.

## Migration Roadmap

### Phase 29B: Schema Foundation

- Add Prisma setup and initial schema.
- Define core entities and relationships.
- Create local dev database workflow.
- Add migration scripts and seed only safe sample data if needed.
- Do not connect feature modules directly yet.

### Phase 29C: API Foundation

- Add backend API route boundaries for companies, financials, valuation inputs, and manual import session reads.
- Introduce data service functions that query through Prisma and return canonical data-contract records.
- Keep source policy and data-quality checks server-side.
- Test API response shape and blocked/missing-data behavior.

### Phase 29D: Manual Import Persistence

- Move manual import from frontend-only preview to server-side validation plus persistence.
- Store `ManualImportSession`, `ManualImportRecord`, and `DataQualityReport`.
- Persist normalized records only with `sourceType: user_input` and non-production flags.
- Keep manual imports separated from production-approved data.

### Phase 29E: Frontend Fetch Bridge

- Add frontend fetch helpers for module data.
- Bridge Overview, Financials, Valuation, Risk, Watchlist, and Simulation toward API responses.
- Keep existing static data as fallback only when explicitly in demo/sample mode.
- Render source/asOf/period/readiness in module UI where relevant.

### Phase 30: Source Adapter Pilot

- Implement the first approved source adapter only after source evidence review.
- Store `DataSource` and `SourceEvidence` before ingestion.
- Ingest through the same data service, database, data-contract, and module bridge path.
- Add tests for blocked, research-only, manual, and approved source modes.

## Data Quality And Guardrails

These rules must be enforced in backend services and API responses, not only in UI:

- Missing values must remain `null`, `insufficient_data`, `not_available`, or `not_applicable`; missing must never become `0`.
- Denominator `0`, missing, or non-finite values must block ratio calculation.
- EPS `<= 0` means P/E is not applicable and must not be interpreted as normal.
- Equity `<= 0` means ROE, P/B, and BVPS interpretation is not normal and needs review.
- `source`, `asOf`, and `period` are required for production runtime records.
- Stale data must carry warnings and reduce readiness.
- Demo/static data must carry demo/sample status.
- User-provided manual data must carry `user_input` source mode.
- No fair value or target price output should be returned when required supporting data is missing or blocked.
- API responses should include `missingFields`, `warningCodes`, and readiness status so modules do not invent local meanings.

## Not In This Phase

Phase 29A does not:

- add Prisma or any package;
- create database files or migrations;
- add API routes;
- modify runtime code;
- persist manual imports;
- call external APIs;
- select or approve a real data provider;
- connect modules to backend data;
- change UI behavior;
- commit or push changes.

## Technical Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Static/mock data becomes mixed with real records. | Store `dataMode`, `sourceType`, `isDemoData`, and source status explicitly; block automatic fallback from approved paths to mock paths. |
| Manual imports are mistaken for approved system data. | Persist manual sessions separately, preserve `sourceType: user_input`, and require explicit UI/API labels. |
| Source rights are unclear. | Require `DataSource` and `SourceEvidence` records before production-approved ingestion. |
| Missing data creates misleading calculations. | Keep existing data-contract rules server-side; never coerce missing to zero. |
| API responses drift away from module contracts. | Shape responses through data-contract records and module bridges before module-specific view models. |
| SQLite dev schema diverges from PostgreSQL production. | Keep Prisma schema PostgreSQL-compatible, avoid SQLite-only assumptions, and validate migrations against PostgreSQL before production. |
| Historical data creates duplicate or conflicting rows. | Use unique constraints by company/ticker, period, source, and `asOf`; store conflict status in quality reports. |
| Assistant responses cite loose frontend state. | Store assistant interactions with data-quality context and source metadata; only pass allowed numeric values and canonical context. |
| Backend grows into route-level business logic. | Keep route handlers thin and move source/data/validation orchestration into data service modules. |

## Architecture Decision Summary

Atelier Finance should move toward a Prisma-backed relational data layer with PostgreSQL as the production database. Manual CSV remains a secondary user-provided source adapter. The main architecture should be backend/API driven, with persisted canonical records flowing through data contracts and module bridges before reaching product modules.
