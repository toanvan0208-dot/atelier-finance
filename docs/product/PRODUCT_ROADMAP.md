# Product Roadmap

Date: 2026-06-18

Phase: 28G - Product Roadmap Realignment for Backend/Database Direction

Atelier Finance is intended to become a full-stack product with frontend, backend, database, data pipeline, approved source adapters, and AI/RAG guardrails. Phases 26-28 remain part of that foundation, but they do not replace the need for a backend and database spine.

## Current Foundation

Phases 26-28 should be kept because they establish the product's data safety layer:

- Phase 26: data documentation, source registry, data dictionary, quality/legal checklist, and data contract direction.
- Phase 27: source evidence policy and candidate-source review rules.
- Phase 28: manual upload adapter, validation report, preview bridge, workspace UX, and Overview entry point.

These phases define how data should be named, validated, traced, reviewed, and presented. They are not a production data warehouse, production backend, or automatic market-data integration.

## Manual Import Positioning

Manual Data Import is a user-provided source adapter. It is useful for:

- local thesis verification;
- student/project workflows;
- checking user-owned CSV data;
- previewing Financials and Valuation readiness before server persistence exists;
- testing data-contract guardrails with user-provided records.

Manual Data Import is not:

- the production database;
- the primary product data provider;
- an approved automatic data source;
- a verified market data feed;
- a substitute for backend source approval, persistence, auditing, and access control.

Manual uploads must continue to carry metadata and warnings such as `source`, `asOf`, `period`, `isDemoData`, `isStale`, missing fields, and readiness status.

## Productization Direction

After Phase 28F, the main productization axis should move to backend and database foundation. Manual Import should become a secondary user-provided source path that plugs into the same contract and policy layer, not the central data architecture.

The backend/database direction should establish:

- persistent entities for companies, instruments, statements, market observations, source metadata, and validation reports;
- API boundaries for frontend data fetching;
- server-side validation and source policy checks;
- auditability for source/asOf/period lineage;
- separation between user-provided data, approved internal data, and future approved automatic adapters;
- AI/RAG guardrails that can cite stored source metadata instead of loose frontend state.

## Roadmap

### Phase 29A: Backend & Database Architecture

Define the backend architecture, persistence boundaries, deployment assumptions, runtime modes, and source approval gates. Decide where manual upload records may be stored and how source metadata is preserved.

### Phase 29B: Database Schema Foundation

Create the first database schema for core entities such as companies, securities, financial statements, market observations, valuation inputs, source metadata, validation reports, and user-provided import batches.

### Phase 29C: Backend API Foundation

Create API boundaries for reading stored product data and submitting validated manual import payloads. Keep APIs behind the same data contract and source evidence rules.

### Phase 29D: Manual Import Server-side Persistence

Move manual import beyond frontend-only preview by allowing user-provided records to be persisted with explicit ownership, metadata, validation status, and non-production-source flags.

### Phase 29E: Frontend Data Fetch Bridge

Bridge frontend modules to backend APIs so Overview, Financials, Valuation, Risk, and related modules can read server-backed records without bypassing data quality/readiness checks.

### Phase 30A: Approved Source Adapter Pilot

Implement the first approved-source adapter pilot only after source evidence is reviewed. The pilot must preserve source/asOf/period metadata, legal constraints, and data-contract validation.

## Current Non-Claims

The product must not claim that it already has:

- a production backend/database;
- an approved automatic data provider;
- verified automatic market data;
- production-ready source ingestion;
- server-side persistence for manual imports;
- generated price conclusions without valid supporting data.

## Safety Language

Product copy should continue to use readiness and data-quality language:

- data is sufficient or insufficient;
- data needs review;
- a metric is not applicable;
- source/asOf/period is missing or stale;
- preview reflects user-provided data.

Product copy should not present manual upload data as verified system data or use transaction guidance wording.
