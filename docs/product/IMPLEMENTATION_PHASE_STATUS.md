# Implementation Phase Status

## 1. Current latest phase

Phase 114 - Reviewed Source Record Import Activation for Debt/EPS/Shares

## 2. Latest commit

Commit: Phase 114 import reviewed source records (this phase commit)

## 3. Current branch expectation

Continue work on `main` unless a future prompt explicitly requests another branch.

The working tree should be clean before starting a new phase.

## 4. Completed capability summary

- FinancialStatementUnitMetadata persistence exists.
- Market/PVT unit metadata persistence exists.
- Financials CSV parser boundary exists.
- CSV parser to Prisma temp DB write/read verification exists.
- FPT controlled local research trial path exists as test-only/research-only.
- Financials transparency UI/readiness card exists.
- Valuation boundary remains `canClaimValuationDbBacked:false` where appropriate.
- `productionApproved:false` remains visible for local/research/manual data.
- Macro/Industry boundary helper exists for field candidates, explicit units, source/evidence metadata, readiness states, blocked reasons, and future gates.
- Macro/Industry readiness UI copy is polished in the existing Macro and Industry workspace modules.
- Overview cross-module readiness summary exists for Financials, Valuation, Technical/PVT, Macro, and Industry.
- Product demo flow browser smoke evidence exists across Overview, Financials, Valuation, Technical/PVT, Macro, and Industry.
- Productization evidence index and safe demo narrative now connect Overview, Financials, Valuation, Technical/PVT, Macro, Industry, AI/RAG, browser smoke, guardrails, known limitations, and future gates.
- Safe Financial Statement CSV import MVP exists for controlled local/research CSV text: preview/dry-run, valid/invalid separation, confirmed local DB write, duplicate skip, and import summary reporting.
- Financials UI runtime now tries the local DB-backed read path first and safely falls back to static sample data when no usable local/imported financial statement rows are available.
- Valuation can consume verified Financials runtime fields only when the Financials read path is DB-backed/local DB with source, period/as-of, and explicit unit metadata; otherwise it fails closed or uses existing persisted bridges.
- Market/PVT CSV text import MVP exists for controlled local/research rows: preview/dry-run, valid/invalid separation, confirmed local DB write, duplicate skip, explicit unit metadata persistence, and `productionApproved:false`.
- Technical/PVT DB-backed read path now requires usable local/imported market rows plus ready Market/PVT unit metadata before preferring DB data; otherwise it keeps sample fallback behavior.
- Shared local import audit result exists for Financial Statement and Market/PVT import MVPs with deterministic job metadata, row counts, duplicate/skipped tracking, warning/error status, and safety flags.
- Internal `/data-import` UI now exposes a local CSV text preview-confirm flow for Financial Statement and Market/PVT imports: dry-run preview first, audit summary review, then explicit confirm write.
- Local import UI and API route are gated behind a runtime kill switch (`ATELIER_LOCAL_IMPORTS_ENABLED`): disabled by default (fail closed), enabled only when env is exactly `true`. The existing `x-atelier-local-import` header guard remains as a lightweight internal guard (not real production auth).
- A controlled Market/PVT external fetch module exists, which accepts an injected fetcher, normalizes candidate response shapes into CSV text, and pipes them through the existing Market/PVT validation and audit pipeline.
- The controlled external Market/PVT fetch service remains dry-run by default and can write validated rows to a local/dev DB only with explicit confirmation and `ATELIER_LOCAL_IMPORTS_ENABLED=true`; Technical/PVT can select the preserved imported source label for its DB-backed read path.
- A single-ticker, bounded-range Market/PVT provider adapter accepts an injected provider fetcher, normalizes an explicit provider response into the Phase 100/101 candidate shape, and delegates dry-run or guarded confirmed local writes to the existing pipeline.
- Controlled provider coverage now verifies one ticker with 20 trading rows inside a 30-day request, while provider responses above 31 observations fail closed.
- Controlled VNStock ingestion supports only FPT, MWG, and VNM, with explicit network opt-in, a bounded date/row scope, an installed Python `vnstock` local client, and deterministic injected-client tests.
- Controlled VNStock Market/PVT CLI can run the small allowlisted ticker set in one bounded smoke command, remains dry-run by default, and can optionally verify the Technical/PVT DB-backed read path after a guarded confirmed write.
- VNStock Market/PVT data is activated in the intended local app SQLite DB for the small allowlisted ticker set, and `/workspace?module=technical` can be smoke-tested against DB-backed VNStock-candidate rows via explicit Technical/PVT query parameters.

## 5. Current validated data pipeline state

- Financials runtime can represent local DB-backed research data and sample fallback data with source/readiness metadata.
- Financials unit metadata can be persisted and read back through controlled sidecar boundaries.
- Market/PVT unit metadata can be persisted and handed through controlled Technical/PVT and Valuation boundaries.
- Financial statement CSV parsing is validated for inline string fixtures only.
- Parser-to-Prisma verification uses temporary SQLite databases outside tracked repo paths and cleans them.
- Local/research/manual/synthetic data remains `productionApproved:false`.
- Macro/Industry data boundary validation is helper/test-only and does not import data, write DB rows, add schema, call APIs, or approve sources.
- Macro/Industry readiness UI uses boundary/sample readiness states only and does not add ingestion, parser, DB persistence, or source approval.
- Macro/Industry readiness copy exposes `productionApproved:false`, missing source/evidence, explicit unit requirements, blocked readiness, and future gates without raw helper labels.
- Overview can summarize major module readiness states without importing data, writing DB rows, changing calculations, or approving sources.
- Phase 91 browser smoke verification confirmed the core workspace demo routes render without source approval or ingestion changes.
- Phase 92 adds docs-only evidence organization and a safe walkthrough; it does not add runtime behavior, ingestion, writes, metrics, APIs, source approval, or browser-visible UI changes.
- Phase 93 reuses the existing Phase 81 parser boundary and local write service to write only valid research-only rows after code-level confirmation; invalid rows remain out of DB and imported rows remain `productionApproved:false`.
- Phase 94 hardens the Financials UI read path so verified local/imported DB rows are preferred when usable, missing numeric values remain null/unavailable, and sample fallback remains safe when DB rows are absent or insufficient.
- Phase 95 gates Valuation Financials input consumption behind verified local DB metadata, keeps market/share-dependent metrics unavailable when inputs are missing or invalid, and preserves `canClaimValuationDbBacked:false`.
- Phase 96 adds controlled local Market/PVT CSV text import and keeps imported/local market data research-only with explicit unit checks, duplicate skip, no source approval, no public upload/API, and no official/realtime claim.
- Phase 97 adds a service-level local import audit trail return object for Financials and Market/PVT import runs without schema changes, durable persistence, public UI/API, or source approval.
- Phase 98 wires those local import helpers into an internal guarded API and `/data-import` UI panel; confirm stays disabled until a successful dry-run preview returns usable rows.

## 6. Current UI/readiness state

- Financials source transparency can show data mode, source/evidence status, unit metadata status, missing fields, blocked reasons, `productionApproved:false`, and Valuation handoff readiness.
- Financials DB-backed status is scoped to the Financials boundary.
- Overview, Valuation, and Risk must not inherit a full DB-backed/source-approved claim from Financials.
- Valuation remains mixed/bounded where market inputs, unit metadata, or source approval are incomplete.
- Macro/Industry UI now surfaces source/evidence gaps, explicit unit requirements, future gates, blocked readiness, and `productionApproved:false` in clearer browser-facing copy for the existing `macro` and `industry` modules.
- Overview now surfaces Financials, Valuation, Technical/PVT, Macro, and Industry readiness in one compact browser-visible summary while keeping `productionApproved:false` and blocked/boundary-only states clear.
- Phase 91 verified Overview, Financials, Valuation, Technical/PVT, Macro, and Industry routes load normally with no framework overlay, no blocking console errors, and no forbidden browser-visible wording observed in the smoke pass.
- Phase 92 documents how to present that UI in a thesis/demo without overclaiming production source status or investment conclusions.
- Phase 93 does not change UI/browser-visible behavior and does not make Valuation or Overview inherit production/source approval from imported Financials rows.
- Phase 94 changes Financials runtime behavior to prefer usable local DB rows, but Financials DB-backed status still remains scoped to Financials and does not make Overview or Valuation fully DB-backed or production-approved.
- Phase 95 allows verified Financials inputs to feed the controlled Valuation boundary, but Valuation remains partial/mixed unless market inputs, shares, units, and source boundaries are also safe.
- Phase 98 adds a browser-visible local/internal import panel showing audit counts, warning/error review, `productionApproved:false`, and local/imported source boundaries before confirm write.
- Phase 99 adds a runtime kill switch (`ATELIER_LOCAL_IMPORTS_ENABLED`) gating the local import UI and API route. Disabled by default (fail closed). The `x-atelier-local-import` header guard is preserved as a lightweight internal guard only.
- Phase 100 adds a controlled dry-run-only trial for external Market/PVT fetching. It validates that fetched candidate data can safely route through the existing Phase 96 import rules and Phase 97 audit result, writing zero rows to the DB.
- Phase 101 extends that trial with a Phase 99-guarded confirmed mode that still delegates validation, duplicate handling, unit persistence, writes, and audit counts to the Phase 96/97 pipeline; imported external rows remain local research data with `productionApproved:false`.
- Phase 102 adds a provider-response boundary for one ticker and at most 31 days. It preserves provider metadata, performs no direct DB writes, uses deterministic injected fetchers in tests, and keeps all output `productionApproved:false`.
- Phase 103 expands the controlled proof from 2 to 20 provider-like rows: all 20 write through the guarded Phase 101 pipeline and Technical/PVT consumes the 20 DB-backed observations without sample fallback when unit metadata is ready.
- Phase 104 adds an opt-in local Python VNStock history client and normalizer. The successful controlled test writes 20 FPT rows through the Phase 96/97/101 pipeline; Technical/PVT reads FPT without fallback and does not mix absent MWG data.
- Phase 105 proves the opt-in live VNStock path can confirmed-write bounded local/dev rows with both guards enabled. The live smoke wrote 21 FPT rows and 63 total rows for FPT/MWG/VNM on a temp local DB, then Technical/PVT read each ticker as DB-backed VNStock-candidate data with fallback disabled.
- Phase 106 applies the existing Phase 75 sidecar migration SQL to the intended local app DB (`file:./dev.db`), writes 63 live VNStock rows for FPT/MWG/VNM into that DB through the guarded import pipeline, and verifies the production app route renders Technical/PVT from DB-backed VNStock-candidate rows with fallback disabled for FPT.
- Phase 107 adds a controlled local/research company metadata backbone for FPT/MWG/VNM using the existing issuer metadata runtime path. It exposes company name, exchange, industry, source label, as-of, data mode, `productionApproved:false`, and keeps `sharesOutstanding` null/unavailable because no traceable shares source is stored in the repo.
- Phase 108 adds a controlled local/research FPT financials activation path that routes inline reviewed FPT financial rows through the existing Financial Statement safe import MVP, writes to the intended local app DB only by explicit confirm, and lets Financials runtime prefer the DB-backed `phase108_controlled_local_financials` rows without sample fallback. EPS and sharesOutstanding remain null/unavailable.
- Phase 109 generalizes the controlled Financials activation path to the small FPT/MWG/VNM set. The new `phase109_controlled_local_financials` source remains controlled local/research data, writes through the existing Financial Statement safe import MVP only by explicit confirmation, returns per-ticker audit counts, and lets Financials runtime read each imported ticker from local DB without sample fallback when rows exist.
- Phase 110 adds a derived portfolio readiness backbone for FPT/MWG/VNM and wires it into Watchlist. It summarizes controlled company metadata, VNStock research-candidate Technical/PVT status, Phase 109 controlled local/research Financials status, missing shares/EPS, and guarded Valuation/Risk readiness without creating a new data source or approval claim.
- Phase 111 activates Phase 109 total-liabilities values through the Financials read path without relabeling them as total debt, adds explicit per-field Financial Statement coverage to Portfolio Readiness, and exposes cash-flow, liquidity, and leverage readiness separately. Existing FPT/MWG/VNM local DB rows already contained the controlled values, so no new DB write was required.
- Phase 112 adds a per-ticker source-decision layer for total debt, EPS, and shares outstanding. No repo-local value met the required source, explicit-unit, as-of, ticker, and period-alignment gates, so no DB write or activation occurred; Watchlist now shows each deferred decision and its metric blockers while keeping Risk leverage and Valuation fail-closed.
- Phase 113 runs a traceable total-debt pilot assessment for FPT/MWG/VNM. No debt value met source, explicit-unit, as-of, period, ticker, and research-data-mode gates, so no DB write or activation occurred; Watchlist now shows checked pilot paths for Financials runtime, the official-disclosure adapter boundary, and the manual-import boundary while keeping leverage fail-closed unless a valid totalDebt candidate is supplied.
- Phase 114 imports reviewed official-report-based candidate source records for FPT/MWG/VNM total debt, EPS, and shares outstanding into the intended local app DB through an explicit guarded CLI. The records remain `research_only` with `productionApproved:false`; Portfolio Readiness now reads them as activated traceable candidates, Risk leverage can move to ready, and Valuation metric readiness opens only where EPS, shares, market price, and financial inputs are valid while `canClaimValuationDbBacked:false` remains enforced.

## 7. Current known limitations

- No production CSV importer yet.
- No public upload UI/API.
- No source approval/legal approval workflow.
- No official/realtime data claim.
- No general real market/BCTC production ingestion.
- Macro/Industry pipelines have a boundary/checklist helper and polished readiness UI, but no production ingestion, parser, DB persistence, or source approval yet.
- Overview readiness is a summary only; users still need to inspect each source module before relying on module-specific data.
- Browser smoke evidence is local verification only; it does not replace a future deployed environment QA pass.
- Productization evidence docs are an index/narrative only; they do not replace source/legal approval or deployed QA.
- Phase 93 import MVP is code-level/local only; no public upload UI/API, production CSV importer, source approval workflow, real web/API fetcher, or official/realtime data claim exists.
- Phase 94 does not add public upload UI/API, filesystem CSV import, source approval, production provider ingestion, or new valuation metrics; local DB reads still depend on rows already present in the dev/local database.
- Phase 95 does not add new valuation methods, source approval, public upload UI/API, external API/Vnstock import, schema/migration, or production data claims.
- Phase 96 does not add public upload UI/API, external API/Vnstock/web import, schema/migration, source/legal approval workflow, seed data, or production data claims.
- Phase 97 audit results are returned by local import helpers only; they are not durable DB audit logs and do not approve sources or make imported data production-approved.
- Phase 98 does not add external API/Vnstock/web import, public investor upload, schema/migration, durable audit DB tables, source approval, or production data claims.
- Phase 99 does not add external API/Vnstock/web import, public investor upload, schema/migration, full auth/admin system, durable audit DB tables, source approval, or production data claims. The `x-atelier-local-import` header is a lightweight internal guard, not real production auth.
- Phase 101 adds only controlled confirmed local/dev writes. It does not add live provider integration, scheduled or bulk crawling, public upload, durable audit storage, or source/legal approval; fetched and imported results remain `productionApproved:false`.
- Phase 102 does not select or automatically call a live provider endpoint. A reviewed real fetcher can be plugged into the adapter later; no crawler, schedule, broad ticker import, source approval, or production data claim was added.
- Phase 103 remains a deterministic single-ticker provider-like dataset; it does not add a live endpoint, broad ticker coverage, scheduling, source approval, or production data claims.
- Phase 104 live execution remains local/manual and disabled unless `VNSTOCK_RESEARCH_ALLOW_NETWORK=true`; VNStock rows remain research candidates with `productionApproved:false`, and no scheduled ingestion or source approval is added.
- Phase 105 live smoke used a temp local SQLite DB outside the repo because the checked-in dev DB copy is not a phase artifact and may not carry the latest sidecar table. No DB file, generated Prisma client, schema migration, crawler, scheduled job, source approval workflow, or approval claim was added.
- Phase 106 mutates only the local ignored `dev.db` runtime database for activation/smoke evidence. The DB file remains ignored and uncommitted; VNStock rows remain research candidates with `productionApproved:false`, and no source approval, scheduled ingestion, crawler, or production data claim was added.
- Phase 107 does not add a source/legal approval workflow, schema migration, scheduled ingestion, crawler, official profile source, or share-count source. Missing `sharesOutstanding` remains null/unavailable and does not unlock market-cap, BVPS/share metrics, or a fully DB-backed Valuation state.
- Phase 108 controlled FPT financials are local/research data only. Applying the existing FinancialStatementUnitMetadata sidecar migration to ignored `dev.db` may be required before local activation; no reset, seed, db push, schema change, source approval, external financials fetch, or share-count source is added. Valuation remains partial where EPS, sharesOutstanding, market inputs, or source approvals are missing.
- Phase 109 controlled FPT/MWG/VNM financials are local/research data only. They are not official, realtime, source-approved, or production-approved. EPS and sharesOutstanding remain unavailable/null, so Valuation cannot claim a fully DB-backed state and share-based metrics remain insufficient. Risk consumes available runtime fields only as partial/mixed readiness; Watchlist remains intentionally unwired.
- Phase 110 portfolio readiness is a derived status layer only. It does not add sharesOutstanding/EPS sources, source/legal approval, market-wide coverage, valuation unlocks, or new ingestion. Watchlist can display FPT/MWG/VNM readiness, but shares/EPS remain unavailable and Valuation/Risk remain guarded.
- Phase 111 does not add new financial values or a traceable shares/EPS source. Controlled liabilities use the existing legacy storage bridge and remain distinct from total debt; leverage readiness therefore remains insufficient while cash-flow and liquidity readiness can reflect available inputs. Valuation remains guarded and all local/research data stays `productionApproved:false`.
- Phase 112 finds no traceable repo-local total-debt, EPS, or shares-outstanding values for FPT/MWG/VNM. The source-decision layer is derived readiness only, keeps all three fields null/unavailable, does not relabel liabilities as debt, and does not make any source or production approval claim.
- Phase 113 does not add activated debt, EPS, or shares data. Official-disclosure and manual-import paths remain boundary-only until reviewed source records are supplied; total liabilities remain separate from total debt, Risk leverage remains insufficient for FPT/MWG/VNM, and Valuation stays guarded.
- Phase 114 source records are reviewed candidates from official-report disclosures, not product official/realtime/source-approved data. The local `dev.db` write is an ignored runtime activation artifact and must not be committed. The importer is limited to FPT/MWG/VNM and the reviewed CSV shape; no crawler, scheduled ingestion, source/legal approval workflow, PDF storage, or production approval is added.

## 8. Recommended next phase

Prefer choosing one of these based on the next product priority:

- Approved source adapter pilot planning
- Macro/Industry source evidence and unit metadata persistence design
- Deployed demo flow QA after an approved source workflow exists
- Narrow local file importer/CLI hardening after explicit approval, still research-only and fail-closed

Do not force the decision before the next phase goal is known.

## 9. How future prompts should reference this file

Future prompts should cite this file for the latest completed phase, capability summary, current limitations, and likely next-phase direction instead of repeating the full phase chain.

For stable operating rules, cite `docs/product/CODEX_OPERATING_MANUAL.md`.

For product/data safety rules, cite `docs/product/ATELIER_FINANCE_GUARDRAILS.md`.

## 10. Historical governance anchor

Phase 83 - Financials Data Source Transparency UI Readiness

Commit: `3df05d0 Phase 83 improve financials data transparency readiness`

This anchor remains so governance tests can confirm the operating-manual setup still preserves the original status baseline while newer phases update the current latest phase above.
