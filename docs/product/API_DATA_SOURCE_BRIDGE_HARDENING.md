# API/Data Source Bridge Hardening

Phase 29I audits the current API/data-source bridge state before any approved source adapter pilot.

## Current Bridge State

- `/data-import` persists manual user-provided CSV sessions through `POST /api/manual-imports`.
- Financials reads persisted database records through `/api/companies/[ticker]/financials`.
- Valuation reads persisted financials and market prices through latest financials and market-price APIs.
- Overview reads company, latest financials, and latest market-price APIs.
- Current local seed data is sample/demo data. Manual upload data is user-provided. Neither is production-approved financial data.

## Source Semantics

- `sample` and `demo` data must be displayed as sample/demo or needs-review data.
- `user_input` data must remain user-provided and needs review.
- `productionApproved` must not be claimed by frontend clients unless a future backend contract explicitly returns it.
- `fallback:false` means no silent mock/static fallback is used for API-driven modules.
- Missing ticker/API 404 states must surface as empty or insufficient data states.

## Guardrails

- Missing numeric values remain `null`/insufficient/not available. They are not converted to `0`.
- Empty strings and invalid numeric values are not parsed into `0`.
- EPS `<= 0` keeps P/E out of ordinary interpretation.
- EPS missing keeps P/E in insufficient/not-available state.
- Missing price keeps price-dependent valuation metrics insufficient/not available.
- Equity missing or non-positive blocks ordinary ROE/P/B/BVPS interpretation in downstream logic.
- No fair value, target price, recommendation, signal, or action conclusion is created in this phase.

## Manual Import Guardrails

- Frontend manual import payloads do not send `sourceType`, `dataMode`, or `productionApproved` claims.
- Backend remains the authority for `sourceType:user_input`, `dataMode:user_input`, and `productionApproved:false`.
- Manual import persistence stores an audit/session trail only. It does not promote data into production-approved module data.

## Smoke Checklist

- `POST /api/manual-imports` with CSV sample returns a session id and user-input metadata.
- `/workspace?module=financials` with `FPTLAB` displays sample metadata and `fallback:false`.
- `/workspace?module=valuation` with `FPTLAB` displays sample/demo metadata and `fallback:false`.
- `/workspace?module=overview` with `FPTLAB` displays sample/demo metadata and `fallback:false`.
- Missing ticker such as `NOPELAB` must show empty/insufficient states, not legacy mock content.
- Direct API checks should cover company, financials latest, and market-prices latest for both `FPTLAB` and a missing ticker.

## Remaining Before 30A

- No approved production source adapter exists yet.
- No external API provider is connected.
- Risk, Technical/PVT, and Checklist are not connected to database APIs in this phase.
- Source licensing, provider evidence, and production approval workflow still need a controlled adapter pilot.
