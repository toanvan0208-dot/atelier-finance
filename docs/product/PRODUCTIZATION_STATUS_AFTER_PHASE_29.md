# Productization Status After Phase 29

Date: 2026-06-19

Scope: Productization evidence after Phases 29E through 29I. This document is a status and thesis-defense record only. It does not add runtime behavior, connect an external data provider, or approve any production data source.

## 1. Current Productization Status

Atelier Finance now has a real backend/database foundation for local productization work:

- Prisma schema and generated-client workflow exist.
- Local development database workflow exists with SQLite.
- PostgreSQL remains the intended production database target.
- Database migration and seed workflow exist for an empty local SQLite database.
- Backend service layer exists between API routes and Prisma.
- Backend API routes read database-backed company, financial-statement, and market-price data.
- Manual import API persists user-provided upload sessions and records.
- `/data-import` can save manual sessions server-side.
- Financials, Valuation, and Overview can read from API/database-backed records.
- Financial statements now have a local/research-only read-service and adapter foundation for future safe DB-backed financials work.
- Financial statements now also have a local import dry-run contract that validates parsed rows, preserves missing values as `null`, reports duplicates, and keeps `productionApproved:false` without writing DB rows.
- Financial statements now have a CSV/text parser dry-run bridge that maps supported headers into the Phase 39 dry-run contract without writing DB rows.
- Technical/PVT can read local DB-backed market prices in explicit research mode and now separates market price source lineage from company/issuer metadata status.
- Technical/PVT has a local/research-only issuer metadata foundation for safe source transparency; it is not official or production-approved metadata.
- Technical/PVT now prevents static/sample-derived support/resistance, volume ratio, and FOMO values from leaking into DB-backed mode.
- Technical/PVT now prevents presentation/sample chart series, MA lines, volume bars, and annotations from leaking into DB-backed mode.
- Bridged modules do not silently fall back to legacy mock/static records when API data is missing.

This is not yet a production data product. The current database can store local sample/lab data and user-provided manual upload evidence, but there is no production-approved real data source, no external source adapter, and no production database/cloud deployment confirmed in the repo.

## 2. Implemented

### Database and local workflow

- `prisma/schema.prisma` defines the database foundation.
- `prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql` creates the local schema for an empty SQLite dev database.
- `prisma/seed.sql` seeds safe sample/lab data.
- `scripts/reset-local-db.mjs` resets the local SQLite database path used by development workflow.
- `package.json` includes `prisma:generate`, `prisma:migrate`, `prisma:studio`, `db:migrate`, `db:seed`, and `db:reset`.
- `.env.example` documents the local `DATABASE_URL` pattern.

### Service and API foundation

- `src/lib/database/client.ts` centralizes Prisma client creation.
- `src/lib/database/services/*` provides reusable service boundaries for company, financial-statement, market-price, and manual-import workflows.
- `src/lib/database/index.ts` exports database services for API use.
- `src/app/api/companies/route.ts` lists companies from the service layer.
- `src/app/api/companies/[ticker]/route.ts` reads one company by ticker.
- `src/app/api/companies/[ticker]/financials/route.ts` reads financial statements and latest financial statement data.
- `src/app/api/companies/[ticker]/market-prices/route.ts` reads market prices and latest market-price data.
- `src/app/api/manual-imports/route.ts` persists manual user-provided import sessions.

### Frontend API bridges

- `/data-import` can submit manual CSV-derived payloads to `POST /api/manual-imports`.
- Financials reads API/database-backed statement data.
- Valuation reads latest financials and market-price APIs for bridged inputs.
- Overview reads company, latest financials, and latest market-price APIs.
- Missing or unknown tickers surface empty/insufficient states instead of silently showing legacy sample content.

## 3. Not Implemented Yet

- No production-approved market or financial data source exists yet.
- No external source adapter exists yet.
- No legal/source-evidence approval workflow has been completed for a real provider.
- No production PostgreSQL database has been deployed or documented as live.
- Manual CSV is not promoted into canonical production data.
- Manual import persistence does not replace source-provider ingestion.
- Risk, Technical/PVT, Checklist, Watchlist, Simulation, and broader AI data context are not fully bridged to database-backed product data.
- Phase 38 adds a local/research-only financial statement read/adapter foundation, but does not import real BCTC data, approve a financial data source, or complete Financials DB-backed UI wiring. See `FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`.
- Phase 39 adds a financial statement local import dry-run contract, but does not parse raw CSV text, import real BCTC data, write DB rows, approve a financial data source, or wire Financials UI runtime behavior. See `FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`.
- Phase 40 adds a financial statement CSV/text parser dry-run bridge, but does not read files from disk, parse Excel/PDF, import real BCTC data, write DB rows, approve a financial data source, or wire Financials UI runtime behavior. See `FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`.
- Technical/PVT company/issuer metadata is not production verified; Phase 34 prevents static sample metadata reuse, and Phase 35 only adds a local/research-only seed foundation. Phase 36 prevents sample-derived PVT metrics from leaking into DB-backed mode. Phase 37 prevents sample chart series from leaking into DB-backed mode. These phases do not implement full technical analysis. See `TECHNICAL_PVT_COMPANY_METADATA_BOUNDARY.md`, `COMPANY_ISSUER_METADATA_FOUNDATION.md`, `TECHNICAL_PVT_DERIVED_METRICS_BOUNDARY.md`, and `TECHNICAL_PVT_CHART_SERIES_BOUNDARY.md`.
- No authenticated multi-user workspace layer exists yet.
- No production monitoring, jobs, queues, cache policy, or provider retry policy exists yet.

## 4. Data Truth Table

| Data class | Current examples | Storage / path | Allowed use now | Production-approved? | Required treatment |
| --- | --- | --- | --- | --- | --- |
| Sample/demo/lab data | `FPTLAB` local seed rows | `prisma/seed.sql`, local SQLite database | Local development, API bridge checks, thesis/productization evidence | No | Must be labeled as sample/demo/lab and needs-review; must not be described as real licensed market data. |
| User-provided manual data | Uploaded CSV rows saved through `/data-import` | `ManualImportSession`, `ManualImportRecord`, optional quality report | User upload audit, validation, review workflow | No | Must remain `user_input`, `needs_review`, and `productionApproved:false`; missing values remain missing metadata/null. |
| Production-approved data | Future approved provider/source records | Future source adapter and production database workflow | Future public/product runtime only after approval | Not present yet | Requires source evidence, license/ToS review, record-level source/asOf/period metadata, quality checks, and explicit approval. |
| Blocked/unapproved source data | Unknown, blocked, or research-only external sources | Not connected for runtime use | Planning and policy review only | No | Must not be used as product runtime data; must not fall back to mock data when blocked. |

`FPTLAB` is a local lab/sample ticker and is not a real security ticker.

## 5. Architecture Evidence

Current implemented architecture follows this path for bridged modules:

`frontend -> API routes/backend -> database service layer -> Prisma/database -> data contract/readiness metadata -> module bridge`

Evidence by layer:

| Layer | Evidence |
| --- | --- |
| Frontend bridge | `/data-import`, Financials, Valuation, and Overview module code paths now call backend APIs for bridged data. |
| API routes | `src/app/api/companies/**`, `src/app/api/manual-imports/route.ts` |
| API response helper | `src/lib/api/response.ts` |
| Service layer | `src/lib/database/services/company-service.ts`, `financial-statement-service.ts`, `market-price-service.ts`, `manual-import-service.ts` |
| Prisma client helper | `src/lib/database/client.ts` |
| Schema | `prisma/schema.prisma` |
| Migration | `prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql` |
| Seed workflow | `prisma/seed.sql`, `scripts/reset-local-db.mjs`, package database scripts |
| Source policy | `docs/product/SOURCE_EVIDENCE_POLICY.md`, `docs/product/DATA_SOURCE_REGISTRY.md`, `docs/product/DATA_QUALITY_AND_LEGAL_CHECKLIST.md` |
| Bridge hardening | `docs/product/API_DATA_SOURCE_BRIDGE_HARDENING.md` |

## 6. Guardrails Evidence

- Manual upload payloads are treated as user-provided input, not approved provider data.
- Manual import persistence keeps `productionApproved:false`.
- Missing numeric values remain missing/null/metadata; they are not converted to zero.
- Source, `asOf`, period, readiness, missing-field, and warning metadata remain part of service/API/module bridge semantics where available.
- `FPTLAB` seed data is sample/lab data and must stay clearly marked.
- API-driven Financials, Valuation, and Overview do not silently fall back to legacy static/mock records when the database response is missing.
- The product does not create fair value, target price, trading cue, or action conclusion outputs in these phases.
- EPS `<= 0`, missing EPS, missing price, and non-positive/missing equity remain guarded by downstream readiness/metric logic.
- Source evidence and legal review remain required before any source can move to production-approved status.

## 7. Thesis Defense Wording

### "Da co database chua?"

Yes. Atelier Finance has a Prisma-backed database foundation, a local SQLite development workflow, migration/seed scripts, service layer, and database-backed API routes. PostgreSQL is still the intended production database target, but the repo does not yet show a deployed production database.

### "Da co du lieu that chua?"

Not yet for production use. The app currently has local sample/lab data and user-provided manual upload records. It does not yet have an approved real data provider, completed source/legal review, or production-approved financial/market dataset.

### "Manual CSV co phai database chinh khong?"

No. Manual CSV is a user-provided source adapter and audit workflow. It can persist upload sessions and records, but it is not the primary product database source and does not create production-approved financial data.

### "Production-ready chua?"

Not yet. The backend/database and frontend API bridges are productization foundations. Production readiness still requires an approved source adapter, source/legal evidence, production PostgreSQL deployment, monitoring/ops workflow, broader module bridging, and final safety/product QA.

## 7A. Academic/non-commercial data boundary after Phase 30H

Atelier Finance remains a real capstone application, not a demo-only artifact. Data can be used locally for academic validation, manual review, source-evidence checks, and research workflows. External/research data is not approved for deployed commercial production use unless a later evidence record explicitly confirms the required rights.

The main UI should stay user-friendly and avoid heavy legal-warning surfaces. Detailed source, reliability, realtime, and usage-limit explanations should be handled by AI disclosure when the user asks, using backend/source metadata such as provider, source type, usage scope, review status, source URL, `asOf`, and collection time.

## 7B. Vnstock research connector planning after Phase 31A

Vnstock may improve local academic validation by helping plan market, profile, and fundamental data pipeline checks. It is not approved as a commercial production data source. No runtime Vnstock connector exists after Phase 31A.

Any future implementation should be fail-closed, disabled by default, metadata-first, and limited to academic/local research boundaries until explicit review allows more.

Phase 31B adds a fail-closed Vnstock research connector skeleton only; it does not add live data fetch or source approval for deployed product use.

Phase 31C adds controlled local market price fetch/normalization for Vnstock research use only; it has no database persistence, no real-data seed, and no source approval for deployed product use.

Phase 31D adds controlled local DB persistence for normalized Vnstock research market prices only; it has no automatic fetch, no public runtime import trigger, and no production source approval.

Phase 31E adds a local-only import command/runner for controlled Vnstock research market price imports; it requires explicit safety flags and acknowledgement, supports dry-run, and does not expose public API/UI/cron or production source approval.

Phase 31F documents safe local usage, dry-run/write workflows, verification checklists, and troubleshooting for the Vnstock research market price import command; it does not add a real fetcher or production source approval.

Phase 31G audits local script runner wiring for Vnstock research market price import; it does not add a real fetcher, public trigger, dependency, npm script, or production data approval.

Phase 31H wires an explicit local TypeScript script runner for the Vnstock research market price import command; it does not add a real fetcher, public trigger, automatic import, or production data approval.

Phase 31I verifies the local Vnstock market price import npm script fails closed under safe smoke-test scenarios; no real fetcher, network call, DB write, public trigger, or production approval was added.

Phase 31J audits real local Vnstock fetcher integration options without adding dependencies, calling data sources, or approving production use.

Phase 31K defines an offline fetcher contract and fake/sample fixture for future Vnstock research market price integration; no real fetcher, network call, DB write, or production approval is added.

Phase 31L adds a manual Vnstock export-to-local-import bridge for market price research data; it reads user-provided local CSV/JSON files, keeps dry-run default, and does not add a real fetcher, network call, public trigger, or production approval.

Phase 31M verifies the manual Vnstock export/import bridge end-to-end with fake CSV dry-run only; no real data, DB write, network call, public trigger, or production approval is added.

Phase 31N adds a first real manual export trial guide for dry-run-only validation of user-provided Vnstock CSV/JSON outside the repo; it does not add a fetcher, run `--write`, write DB data, or approve production use.

Phase 31O records the first real user-provided Vnstock CSV dry-run for FPT over `2025-01-01` to `2025-01-31`; `17` records normalized, `0` rejected, no DB write, no `--write`, no direct Vnstock fetcher, and `productionApproved` remains `false`.

Phase 31P plans the first local DB write trial for the reviewed FPT CSV dry-run, including backup/reset and repo hygiene checklists; it does not run `--write`, write DB data, add a fetcher, or approve production use.

Phase 31Q executes the first local DB write trial for reviewed user-provided Vnstock CSV data, limited to FPT over `2025-01-01` to `2025-01-31`; DB write counts are verified locally, CSV/DB files are not committed, no direct fetcher/public trigger is added, and `productionApproved` remains `false`.

Phase 31R verifies a local DB read path for manually imported Vnstock market price data, preserving `research_only`/source metadata and null-safe behavior; it does not add a direct fetcher, public API/UI trigger, DB write, or production approval.

Phase 31S connects the local MarketPrice DB read path to a Technical/PVT adapter-ready layer, preserving `research_only`/source metadata and null-safe behavior; it does not add UI, public API, direct fetcher, DB write, or production approval.

Phase 31T adds a Technical/PVT module-level loader/helper that can prefer local DB market price rows and falls back safely to existing static/sample data; rendered UI data remains unchanged, and no public API, direct fetcher, network call, DB write, automatic import, or production approval is added.

Phase 31U wires `/workspace` initial Technical/PVT data through a server-side runtime wrapper and passes the serialized result to the client shell; DB-backed mode remains explicit/default-off, static fallback is preserved, and no public API, direct fetcher, network call, DB write, automatic import, or production approval is added.

Phase 32 adds Technical/PVT source transparency for fallback and local DB manual import modes, plus tests/docs for explicit DB-backed UI verification; it does not add a fetcher, network call, DB write, public trigger, automatic import, or production approval.

Phase 33 records local browser/dev-server verification evidence for Technical/PVT DB-backed and fallback rendering; it confirms source transparency in both modes while keeping the known limitation that DB-backed company/industry metadata is still not a reviewed company-profile source.

Phase 34 adds a Technical/PVT company/issuer metadata boundary so DB-backed market price data no longer reuses static sample company/industry metadata when issuer metadata is unavailable or not verified.

Phase 35 adds a local/research-only issuer metadata foundation for source transparency. It remains `productionApproved:false`, is not official metadata, and does not fill industry/sector unless source evidence exists.

Phase 36 adds and browser-verifies the PVT derived metrics boundary. DB-backed FPT mode now renders `derived:insufficient_data`, does not show sample support `38.000 - 40.000`, sample resistance `44.000 - 46.000`, sample volume `1.4x TB20`, or sample FOMO `Trung bình, 3/6`, and displays insufficient/unavailable states instead. Chart series/sample presentation points were deferred to Phase 37.

Phase 37 adds the PVT chart series boundary. DB-backed chart points are built from the active local DB market price series when available; sample chart points, sample MA20/MA50, sample volume bars, and sample annotations such as `KQKD` / `Ngành` are not reused. For the 17-observation FPT series, MA20/MA50 remain insufficient and annotations remain unavailable.

Phase 37 browser verification on 2026-06-20 confirmed DB-backed FPT renders `chart:computed_from_market_price_series`, shows the active local DB market price series note, hides sample annotations such as `KQKD` / `Ngành`, hides MA20/MA50 for the 17-observation series, keeps support/resistance/FOMO/volume unavailable or insufficient, and keeps `productionApproved:false`. Fallback mode was not re-verified in that browser pass; automated tests cover sample fallback chart `static_sample` behavior.

Phase 38 adds a Financial Statements local data foundation. It reuses the existing Prisma `FinancialStatement` model, adds a local/research-only read service, adds a Financials adapter foundation, preserves missing values as `null`, keeps `productionApproved:false`, and does not import real financial statement data or change UI behavior.

Phase 39 adds a Financial Statements local import dry-run contract. It accepts parsed object rows, validates ticker/year/period/numeric fields, preserves missing values as `null`, reports duplicates as skipped rows, keeps `productionApproved:false`, and has no DB write path or UI runtime wiring.

Phase 40 adds a Financial Statements CSV/text parser dry-run bridge. It parses CSV text with header mapping and quoted-cell handling, passes parsed rows into the Phase 39 dry-run contract, preserves missing cells for null-safe normalization, keeps `productionApproved:false`, and has no DB write path or UI runtime wiring.

## 8. Roadmap After Phase 29

### Phase 30A - Approved Source Adapter Pilot

The next major step should be an approved source adapter pilot:

- Select one narrow data group, such as company profile, end-of-day market price, or financial statement snapshots.
- Complete source evidence, license, Terms of Service, caching, redistribution, and runtime-display review.
- Implement adapter output with source/asOf/period/readiness/missing/warning metadata.
- Store provider-ingested records separately from manual user-provided uploads.
- Keep blocked/unapproved sources out of runtime data.
- Add tests for source status, missing values, duplicate rows, stale data, EPS/equity edge cases, and no silent fallback.

### Later productization steps

- Move production database target to PostgreSQL with environment-specific configuration.
- Add production deployment, secrets management, monitoring, and backup policy.
- Add a controlled approval workflow for source evidence.
- Expand API/database bridges to Risk, Technical/PVT, Checklist, Watchlist, Simulation, and AI context only after the source adapter pilot is safe.
- Keep manual import as a secondary user-provided workflow, not the main provider pipeline.

## 9. Current Status Statement

Atelier Finance is now beyond mock-only architecture: it has a real backend/database foundation, local persistence workflow, server-side manual import persistence, and API-driven bridges for core read modules. The honest status is still "productization foundation in progress", not "production real-data product".
