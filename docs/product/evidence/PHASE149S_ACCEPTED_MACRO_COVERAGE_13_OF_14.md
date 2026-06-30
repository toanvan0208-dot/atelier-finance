# Phase 149S - Accepted Macro Coverage 13 Of 14

## Phase Objective

Lock the accepted macro coverage state at 13 of 14 frontend-locked indicators.

This phase intentionally does not:

- write DB rows,
- fetch providers,
- import CSV files,
- populate `GLOBAL_FLOW`,
- change the Phase 149R `GLOBAL_FLOW` definition,
- substitute a proxy for `GLOBAL_FLOW`,
- expand the indicator universe,
- set `productionApproved=true`.

## Starting Commit

`7f1655dc703ea8cc5a371834740e9d28354aadd9`

## Product Owner Decision

Accepted macro coverage is `13/14`.

The product owner decided not to import sparse `GLOBAL_FLOW` points. `GLOBAL_FLOW` remains unavailable until a reliable continuous monthly emerging-market equity fund-flow source is available.

## Current Covered 13 Indicators

World:

- `FED_FUNDS_RATE`
- `DXY`
- `BRENT_OIL_PRICE`

Vietnam:

- `GDP_GROWTH`
- `PMI_MANUFACTURING`
- `EXPORT_GROWTH`
- `CPI_YOY`
- `POLICY_RATE`
- `USD_VND`
- `FOREIGN_NET_FLOW`
- `CREDIT_GROWTH`
- `PUBLIC_INVESTMENT`
- `MARKET_TRADING_VALUE`

## Unavailable GLOBAL_FLOW Decision

`GLOBAL_FLOW` remains unavailable.

Phase 149R selected this definition:

```text
indicatorCode=GLOBAL_FLOW
definitionKey=emerging_market_equity_fund_flow
productDefinition=Emerging-market equity fund net flow.
displayLabel=Dòng vốn quỹ thị trường mới nổi
unit=usd_billion
period_type=monthly preferred
positiveValue=net inflow
negativeValue=net outflow
```

Phase 149S does not change that definition.

## Why Sparse GLOBAL_FLOW Points Were Rejected

Public/news search found only sparse, non-continuous EM equity fund-flow points.

These were rejected because:

- the app needs a coherent monthly time series, not isolated points;
- sparse points could overstate precision and reduce product clarity;
- the source continuity and methodology would be hard to explain to low-finance-literacy users;
- filling only scattered months would invite accidental over-interpretation;
- zero-fill or interpolation would violate the missing-data guardrail.

Decision:

```text
Do not import sparse GLOBAL_FLOW points.
Keep GLOBAL_FLOW unavailable until continuous monthly EM equity fund-flow source is available.
Do not substitute DXY/VIX or other risk proxies.
```

## Runtime / Assistant Expected Behavior

Runtime and UI:

- keep 13 covered indicators readable from DB/runtime;
- keep candidate/manual warning paths visible;
- keep `GLOBAL_FLOW` as unavailable/source-needed;
- do not show fake, proxy, inferred, interpolated, or zero-filled `GLOBAL_FLOW`.

Assistant:

- may explain that `GLOBAL_FLOW` is defined as emerging-market equity fund net flow;
- must say the system does not yet have `GLOBAL_FLOW` observation data;
- must not infer `GLOBAL_FLOW` from DXY, VIX, liquidity, or other existing indicators;
- must not turn the unavailable state into any market action or deterministic conclusion.

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Validation and smoke:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/smoke-accepted-macro-coverage-13-of-14.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-accepted-macro-coverage-13-of-14.ts
```

## Files Changed

- `docs/product/evidence/PHASE149S_ACCEPTED_MACRO_COVERAGE_13_OF_14.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `scripts/smoke-accepted-macro-coverage-13-of-14.ts`

## Guardrail Results

```text
acceptedMacroCoverage=13/14
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
globalFlowPopulated=false
globalFlowObservationCount=0
globalFlowProvenanceCount=0
frontendIndicatorUniverseExpanded=false
productionApprovedTrueCount=0
missingDataZeroFilled=false
mockOrSampleAsReal=false
fallbackAsReal=false
```

## Validation Results

```text
npx prisma validate: pass
npx prisma generate: pass
npx prisma migrate status: pass
npm run typecheck: pass after sequential rerun
npm run build: pass
npx eslint scripts/smoke-accepted-macro-coverage-13-of-14.ts: pass
npx tsx scripts/smoke-accepted-macro-coverage-13-of-14.ts: pass
npm run lint: fail due to pre-existing/out-of-scope lint debt
```

Smoke result:

```text
acceptedMacroCoverage=13/14
globalFlowObservationCount=0
globalFlowProvenanceCount=0
globalFlowRemainsUnpopulated=true
coveredIndicatorsRemainReadable=true
assistantTreatsGlobalFlowAsUnavailable=true
candidateWarningPathVisible=true
frontendIndicatorUniverseExpanded=false
productionApprovedTrueCount=0
smokePassed=true
```

Note: an initial parallel typecheck invocation raced with Prisma client generation and reported a missing generated Prisma file. A sequential rerun after generation passed.

Global lint is not a clean pass. The failures are existing repository-wide lint debt in older scripts/source files and do not list the new Phase 149S smoke file.

## Known Limitations

- Coverage is intentionally accepted at 13/14.
- `GLOBAL_FLOW` remains unavailable until a continuous monthly EM equity fund-flow source exists.
- All candidate/manual/provider/proxy rows remain subject to review and are not production-approved.

## Next Recommended Phase

Move from macro coverage expansion to product hardening:

- improve display clarity for candidate/manual data;
- clean legacy lint debt;
- or, only if a reliable monthly EM equity fund-flow source becomes available, run a separate `GLOBAL_FLOW` acquisition dry-run phase.

## Commit

Phase 149S commit is the final `HEAD` commit for this evidence file; the exact hash is recorded in the final report and `git log`.
