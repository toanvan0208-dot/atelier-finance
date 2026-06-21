# Implementation Phase Status

## 1. Current latest phase

Phase 87 - Macro/Industry Data Boundary Using Compressed Prompt Pattern

## 2. Latest commit

Commit: Phase 87 add macro industry data boundary (this phase commit)

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

## 5. Current validated data pipeline state

- Financials runtime can represent local DB-backed research data and sample fallback data with source/readiness metadata.
- Financials unit metadata can be persisted and read back through controlled sidecar boundaries.
- Market/PVT unit metadata can be persisted and handed through controlled Technical/PVT and Valuation boundaries.
- Financial statement CSV parsing is validated for inline string fixtures only.
- Parser-to-Prisma verification uses temporary SQLite databases outside tracked repo paths and cleans them.
- Local/research/manual/synthetic data remains `productionApproved:false`.
- Macro/Industry data boundary validation is helper/test-only and does not import data, write DB rows, add schema, call APIs, or approve sources.

## 6. Current UI/readiness state

- Financials source transparency can show data mode, source/evidence status, unit metadata status, missing fields, blocked reasons, `productionApproved:false`, and Valuation handoff readiness.
- Financials DB-backed status is scoped to the Financials boundary.
- Overview, Valuation, and Risk must not inherit a full DB-backed/source-approved claim from Financials.
- Valuation remains mixed/bounded where market inputs, unit metadata, or source approval are incomplete.
- Macro/Industry UI/browser behavior is unchanged by Phase 87; future UI readiness work must surface source, unit, missing/invalid, and `productionApproved:false` states explicitly.

## 7. Current known limitations

- No production CSV importer yet.
- No public upload UI/API.
- No source approval/legal approval workflow.
- No official/realtime data claim.
- No general real market/BCTC production ingestion.
- Macro/Industry pipelines have a boundary/checklist helper, but no production ingestion, parser, DB persistence, UI integration, or source approval yet.

## 8. Recommended next phase

Prefer choosing one of these based on the next product priority:

- Macro/Industry source evidence and unit metadata persistence design
- Macro/Industry UI transparency/readiness surface
- Approved source adapter pilot planning

Do not force the decision before the next phase goal is known.

## 9. How future prompts should reference this file

Future prompts should cite this file for the latest completed phase, capability summary, current limitations, and likely next-phase direction instead of repeating the full phase chain.

For stable operating rules, cite `docs/product/CODEX_OPERATING_MANUAL.md`.

For product/data safety rules, cite `docs/product/ATELIER_FINANCE_GUARDRAILS.md`.

## 10. Historical governance anchor

Phase 83 - Financials Data Source Transparency UI Readiness

Commit: `3df05d0 Phase 83 improve financials data transparency readiness`

This anchor remains so governance tests can confirm the operating-manual setup still preserves the original status baseline while newer phases update the current latest phase above.
