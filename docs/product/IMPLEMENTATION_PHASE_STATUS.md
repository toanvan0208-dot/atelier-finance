# Implementation Phase Status

## 1. Current latest phase

Phase 99 - Local Import Access Guard and Runtime Kill Switch

## 2. Latest commit

Commit: Phase 99 add local import access guard (this phase commit)

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
