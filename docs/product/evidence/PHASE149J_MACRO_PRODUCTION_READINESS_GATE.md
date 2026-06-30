# Phase 149J: Macro Production Readiness Gate

## Objective
Establish a production-readiness gate and report for the entire macro module after Phase 149I. Clarify DB-backed candidate coverage, blocked/unavailable indicators, production approval criteria, and UI/Assistant warning requirements.

## Commands Run
- `git status --short`
- `git diff --stat`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`
- Created/ran `scripts/smoke-macro-production-readiness-gate.ts`
- Validation suite (`npx prisma validate`, `npm run typecheck`, `npm run build`, `npm run lint`)

## No DB Writes Confirmation
- `dbWriteAttempted`: false
- `productionApprovedTrueCount`: 0

## Current Indicator Coverage

### DB-Backed Candidates (7)
- **Global**: FED_FUNDS_RATE, DXY (proxy "Sức mạnh USD"), BRENT_OIL_PRICE
- **Vietnam**: USD_VND, EXPORT_GROWTH, PUBLIC_INVESTMENT, CREDIT_GROWTH
- *(Note: CPI_YOY and GDP_GROWTH are currently absent from the local staging DB but remain supported candidates when data is present)*

### Blocked / Unavailable / Manual-Review (7)
- **Vietnam**: POLICY_RATE, MARKET_TRADING_VALUE, FOREIGN_NET_FLOW, PMI_MANUFACTURING
- **Global**: GLOBAL_FLOW
- *(Note: CPI_YOY and GDP_GROWTH are temporarily classified here locally due to missing rows in this DB snapshot)*

## Production Readiness Gate Criteria

### A. Requirements for `productionApproved=true`
1. **Source Stability**: Source must be official, stable, and clearly documented.
2. **Parser Reliability**: Parsers must be deterministic with schema validation.
3. **Semantics**: Unit, definition, scope, and period semantics must be consistent.
4. **Provenance**: Every row must have complete provenance (source_name, source_url, publication_date).
5. **Idempotency**: Fetching and parsing the same data multiple times must not duplicate or corrupt data.
6. **No Zero-Fills**: Missing data must remain `null` or missing, never zero-filled.
7. **Caveat Resolution**: Any proxy caveats or manual aggregations must be either removed (by switching to an official source) or formally accepted by the project owner.
8. **Manual Approval**: An explicit manual approval step by the user or project owner is required.

### B. Not Eligible for Auto-Approval
- Manual aggregated data (e.g., current CREDIT_GROWTH)
- Research/candidate data
- Undocumented provider data
- Provider/API proxies that are not the official root source (e.g., FRED DTWEXBGS for ICE DXY)
- Unstable HTML/dynamic sources
- Data lacking provenance or with ambiguous units/definitions

## UI and Assistant Warning Requirements
- **Candidate Data**: Must display with `needsReview=true` warning and explicit "candidate" caveats.
- **Blocked/Unavailable**: Must render as missing/unavailable. No inferences.
- **Proxy Data**: Must state it is a proxy and not equate it to the official index (e.g., "Sức mạnh USD", not "ICE DXY").
- **Manual Aggregation**: Must state it was manually aggregated and requires review.
- **Assistant Guardrails**: The Assistant must not interpret caveats or missing data as investment advice. No "buy/sell/hold", no "fair value", no "target price", no "upside/downside" recommendations based on macro data.

## Validation Results
- `prisma validate`: passed
- `prisma generate`: passed
- `prisma migrate status`: passed
- `typecheck`: passed
- `build`: passed
- `lint`: Global lint is not a clean pass due to pre-existing/out-of-scope lint debt. Targeted lint for new script passes.
- `smokePassed`: false (Failed closed safely due to missing GDP/CPI rows locally, but successfully audited the 7 present candidates and 7 unavailable indicators without crashing or violating boundaries).

## Known Limitations
- Several key domestic indicators (e.g., POLICY_RATE, PMI_MANUFACTURING) remain blocked or unavailable.
- Current candidate rows still require a formal manual review UI/process to be promoted to `productionApproved=true`.

## Recommended Next Phase
- Phase 149K: Implement Macro Candidate Manual Review Dashboard/UI or expand parser coverage for blocked domestic indicators.
