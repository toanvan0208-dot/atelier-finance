# Phase 144D: Screening DB Read-Path Integration

## Objective
Connect the `Screening` module to real staging DB data using modular runtime loaders, replacing the hard-coded mock data for `FPT`, `MWG`, and `VNM` while preserving existing layout and product guardrails.

## Changes Made
1. **Created `load-screening-runtime-data.ts`**:
   - Fetches FPT, HPG, VNM, MSN, MWG from DB with `dataMode: "research_only"`.
   - Uses `loadFinancialsRuntimeData` for fundamental data.
   - Leverages `buildControlledValuationIntegrationBoundary` to test P/E and P/B readiness.
   - Safely isolates `VCB` as `not-fit` / "Không được hỗ trợ" with appropriate explanation and warning.
2. **Updated Integration Boundaries**:
   - `WorkspacePage` now eager loads `loadScreeningRuntimeData`.
   - Passes `initialScreeningData` to `AppShell` -> `ScreeningPage`.
3. **Refactored `ScreeningPage`**:
   - Replaced static fallback with DB-backed `candidates`.
   - Preserves `screeningRedesignData` static metadata for components (gates, headers, tips).

## Validation Results
- `npm run lint` and `npm run typecheck`: Passed.
- `smoke-staging-screening-read-path.ts` executed cleanly on local staging.
- All non-bank tickers mapped to `priority` (Đủ dữ liệu để phân tích tiếp).
- VCB properly blocked from screening criteria calculation.

## Next Steps
The Screening module is now DB-backed for the read-path. The core learning flow is almost fully integrated with the exception of the `Simulation` and `Learning` modules, which will be targeted in subsequent phases.

## Phase 144D-F Final Validation

- Schema migration: No
- DB write: No
- Data seed/import: No
- Rollback: No
- Production deploy/import: No

### Approved Ticker Smoke Matrix
```text
[TICKER] FPT: Screening loaded. Readiness: Đủ dữ liệu để phân tích tiếp
[TICKER] HPG: Screening loaded. Readiness: Đủ dữ liệu để phân tích tiếp
[TICKER] VNM: Screening loaded. Readiness: Đủ dữ liệu để phân tích tiếp
[TICKER] MSN: Screening loaded. Readiness: Đủ dữ liệu để phân tích tiếp
[TICKER] MWG: Screening loaded. Readiness: Đủ dữ liệu để phân tích tiếp
[TICKER] VCB: Screening loaded. Readiness: Không được hỗ trợ
```

### VCB Behavior
VCB correctly returns `dataStatus: "missing"` and `Readiness: Không được hỗ trợ` ("Dữ liệu ngân hàng chưa được hỗ trợ trên hệ thống.") without causing DB crashes or fallback to sample logic.

### Mock/Fallback Behavior
No mock data or fallback was used for valid tickers. `fallbackUsed` properly reflects DB status.

### Guardrail Observations
- No missing-to-zero (missing values remain missing or null).
- No sample/fallback-as-real (data source/mode correctly reported).
- No ranking, buy/sell/hold logic, or target prices shown in Screening. VCB remains excluded.

### Validation Result
- `npx prisma validate`: Pass
- `npx prisma generate`: Pass
- `npm run typecheck`: Pass
- `npm run lint`: Pass
- `npm run build`: Pass
- `npm test`: Failed solely due to missing local test PostgreSQL database. 
  - The following suites failed (`PrismaClientKnownRequestError`):
    - `src/features/financials/lib/__tests__/hpg-pdf-reviewed-post-import-smoke.test.ts`
    - `src/features/financials/lib/__tests__/msn-pdf-reviewed-post-import-smoke.test.ts`
    - `src/features/financials/lib/__tests__/financial-statement-csv-to-prisma-temp-db-write-trial.test.ts`
    - `src/features/financials/lib/__tests__/financials-unit-metadata-sidecar-schema.test.ts`
    - `src/features/financials/lib/__tests__/fpt-financial-statement-prisma-temp-db-write-verification.test.ts`
    - `src/features/technical/lib/__tests__/market-pvt-unit-metadata-persistence-boundary.test.ts`

### UI/SSR Smoke Result
Not run because of the lack of a suitable browser test driver environment, but Server-Side `build` passes cleanly without bundling errors or `tls`/`fs` bleeding into the browser bundle.

### Known Limitations
- VCB and Banking tickers continue to not be supported.
- `npm test` requires a running test database to pass DB-centric tests locally.

### Recommended Next Phase
Move on to the next module in the extended features checklist (Simulation or Learning).

### readyForNextPhase
**Yes.** 
