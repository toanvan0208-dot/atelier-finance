# Implementation Phase Status

## 1. Current latest phase

Phase 94 - Financials DB-backed UI Read Path Hardening

## 2. Latest commit

Commit: Phase 94 harden financials db backed read path (this phase commit)

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
