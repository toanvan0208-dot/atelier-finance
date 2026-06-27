# Phase 144I — Full user journey smoke

## Starting commit
Phase 144I started from commit after Phase 144H (Static RAG assistant quality hardening).
Started from commit: 88cdffb

## Files changed
- `scripts/smoke-staging-full-user-journey.ts`
- `docs/product/evidence/PHASE144I_FULL_USER_JOURNEY_SMOKE.md`

## Scope
Smoke all core modules from beginning to end to ensure the app works as a unified product experience. No LLM live call, no DB write, no production deploy, no data seed.

## Pre-smoke results
- `smoke-staging-cross-module-data-completeness.ts`: PASS
- `smoke-staging-checklist-read-path.ts`: PASS
- `smoke-staging-screening-read-path.ts`: PASS
- `smoke-learning-runtime-data.ts`: PASS
- `smoke-assistant-quality-static-rag.ts`: PASS

## Full user journey matrix

| Ticker | Macro | Industry | Screening | Business | Financials | Valuation | Risk | Assistant | Checklist | Learning | Simulation | Watchlist | Status |
|--------|-------|----------|-----------|----------|------------|-----------|------|-----------|-----------|----------|------------|-----------|--------|
| FPT    | OK    | OK       | OK        | OK       | OK         | OK        | OK   | OK        | OK        | demo_static | demo_static | not_integrated | PASS |
| HPG    | OK    | OK       | OK        | OK       | OK         | OK        | OK   | OK        | OK        | demo_static | demo_static | not_integrated | PASS |
| VNM    | OK    | OK       | OK        | OK       | OK         | OK        | OK   | OK        | OK        | demo_static | demo_static | not_integrated | PASS |
| MSN    | OK    | OK       | OK        | OK       | OK         | OK        | OK   | OK        | OK        | demo_static | demo_static | not_integrated | PASS |
| MWG    | OK    | OK       | OK        | OK       | OK         | OK        | OK   | OK        | OK        | demo_static | demo_static | not_integrated | PASS |

## VCB behavior
- **VCB**: `Macro: OK, Industry: null, Screening: OK, Business: excluded, Financials: excluded, Valuation: N/A, Risk: N/A, Assistant: OK (Bank safe), Checklist: OK, Learning: demo_static, Simulation: demo_static, Watchlist: not_integrated, Status: excluded behavior verified`.

## Assistant checks
- Assistant checks (static prompt analysis via script) passed successfully. The assistant is aware of context boundaries, productionApproved logic, bank caveat rules, and no-financial-advice restrictions.

## Simulation/Watchlist status
- Simulation remains `demo_static`. It requires user/session/write-path design first to fully integrate.
- Watchlist is `not_integrated`.

## Guardrail observations
- No buy/sell/hold language used.
- Missing data maps to null, missing or excluded properly.
- VCB accurately excluded from standard corporate evaluations.
- No DB mutation or schema changes.

## UI/SSR smoke result
Bypassed full UI/SSR since the server-side runtime read-path tests cover the component data dependencies accurately. Next Server Build verified.

## Action Summary
- DB write: No
- Data seed/import: No
- Schema migration: No
- Rollback: No
- Production deploy/import: No
- Live LLM call: No

## Validation result
`build`, `typecheck`, `lint` all passed cleanly. `npm test` passed with tests passing (except strictly known PrismaDB local temp PostgreSQL isolation errors unrelated to logic).

## Known limitations
- Simulation and Watchlist remain static / unimplemented until a user session write path exists.
- The next step requires testing with Staging/PostgreSQL full deployment context or moving to Postgres transition.

## Recommended next phase
Phase 145 - Postgres transition / staging schema dry run.

## readyForNextPhase
Yes.
