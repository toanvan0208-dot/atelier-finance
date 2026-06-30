# Phase 149Q - Full Macro Coverage Final Smoke

## Phase Objective

Verify final macro coverage across the frontend-locked indicator universe after Phase 149P confirm-wrote the remaining Vietnam manual candidate rows.

Phase 149Q is read-only:

- No DB writes.
- No provider fetch/import.
- No CSV mutation.
- No indicator universe expansion.
- No production approval changes.

## Starting Commit

`c90e79175e9c6517594edd7cda1085977206c445`

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
node scripts/run-staging.mjs npx eslint scripts/smoke-full-macro-coverage-final.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-full-macro-coverage-final.ts
```

## Files Changed

- `scripts/smoke-full-macro-coverage-final.ts`
- `docs/product/evidence/PHASE149Q_FULL_MACRO_COVERAGE_FINAL_SMOKE.md`

## Full Frontend-Locked Indicator List

World:

- `FED_FUNDS_RATE`
- `DXY`
- `BRENT_OIL_PRICE`
- `GLOBAL_FLOW`

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

## Available / DB-Backed Indicator Summary

Phase 149Q read-back confirmed 13 of 14 frontend-locked indicators have DB observations and provenance:

| Indicator | Observations | Provenance | Runtime readable | Assistant context |
| --- | ---: | ---: | --- | --- |
| `FED_FUNDS_RATE` | 5 | 5 | yes | yes |
| `DXY` | 5 | 5 | yes | yes |
| `BRENT_OIL_PRICE` | 5 | 5 | yes | yes |
| `GDP_GROWTH` | 1 | 1 | yes | yes |
| `CPI_YOY` | 1 | 1 | yes | yes |
| `USD_VND` | 1 | 1 | yes | yes |
| `EXPORT_GROWTH` | 2 | 2 | yes | yes |
| `PUBLIC_INVESTMENT` | 34 | 34 | yes | yes |
| `CREDIT_GROWTH` | 10 | 10 | yes | yes |
| `FOREIGN_NET_FLOW` | 12 | 12 | yes | yes |
| `PMI_MANUFACTURING` | 29 | 29 | yes | yes |
| `POLICY_RATE` | 30 | 30 | yes | yes |
| `MARKET_TRADING_VALUE` | 12 | 12 | yes | yes |

Totals read:

- Observations: 147
- Provenance rows: 147

## Unavailable / Decision Needed Indicator Summary

`GLOBAL_FLOW` remains unresolved.

The smoke verified:

- No `GLOBAL_FLOW` observation was invented.
- Runtime keeps `GLOBAL_FLOW` in source-assessment-needed / missing-observation state.
- Assistant macro context includes `GLOBAL_FLOW` as missing/decision-needed rather than a filled proxy.

No proxy such as DXY, VIX, ETF flow, liquidity, or financial conditions was substituted for `GLOBAL_FLOW`.

## Runtime / UI Verification

`loadMacroRuntimeData` includes all available indicators and did not drop later indicators after the Phase 149P monthly manual rows were added.

Confirmed runtime coverage:

- `FED_FUNDS_RATE`
- `DXY`
- `BRENT_OIL_PRICE`
- `GDP_GROWTH`
- `CPI_YOY`
- `USD_VND`
- `EXPORT_GROWTH`
- `PUBLIC_INVESTMENT`
- `CREDIT_GROWTH`
- `FOREIGN_NET_FLOW`
- `PMI_MANUFACTURING`
- `POLICY_RATE`
- `MARKET_TRADING_VALUE`

UI/runtime warning path remains visible for candidate/manual data:

- `productionApproved=false`
- `needsReview=true`
- candidate/manual caveats are present in runtime limitations/provenance.

Specific caveats verified:

- `USD_VND`: Vietcombank commercial-bank transfer quote, not SBV central rate.
- `EXPORT_GROWTH`: derived YoY from GSO export value CSV, not directly published growth.
- `PUBLIC_INVESTMENT`: unit distinguishes `billion_vnd` from `percent_of_plan_ytd`.
- `CREDIT_GROWTH`: manually aggregated from SBV/news/publication sources, not official machine-readable SBV CSV.
- `FOREIGN_NET_FLOW`: HOSE-only manual aggregated net flow; positive/negative terms are market-flow terminology, not recommendation wording.
- `PMI_MANUFACTURING`: unit `index` preserved.
- `POLICY_RATE`: monthly carry-forward snapshot of the SBV refinancing rate.
- `MARKET_TRADING_VALUE`: average daily/session trading value by month, not total monthly trading value.

## Assistant Context Verification

Assistant macro context includes all 13 available indicators with observations/caveats.

The smoke verified context coverage for:

- `FED_FUNDS_RATE`
- `DXY`
- `BRENT_OIL_PRICE`
- `GDP_GROWTH`
- `CPI_YOY`
- `USD_VND`
- `EXPORT_GROWTH`
- `PUBLIC_INVESTMENT`
- `CREDIT_GROWTH`
- `FOREIGN_NET_FLOW`
- `PMI_MANUFACTURING`
- `POLICY_RATE`
- `MARKET_TRADING_VALUE`

`GLOBAL_FLOW` remains missing/decision-needed in Assistant context and is not inferred.

## Guardrail Results

```text
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
frontendIndicatorUniverseExpanded=false
productionApprovedTrueCount=0
needsReviewRowsCount=147
missingDataZeroFilled=false
mockOrSampleAsReal=false
fallbackAsReal=false
investmentAdviceAdded=false
```

Market-flow terminology note:

- Terms equivalent to net buying/net selling for `FOREIGN_NET_FLOW` are treated as data semantics, not user action recommendations.

## Smoke Results

`scripts/smoke-full-macro-coverage-final.ts` passed.

Key output:

```text
missingExpectedIndicators=[]
runtimeMissingAvailableIndicators=[]
globalFlowDecisionNeeded=true
globalFlowInvented=false
candidateManualWarningPathVisible=true
assistantIncludesGlobalFlowAsMissingOrDecisionNeeded=true
smokePassed=true
```

## Validation Results

```text
npx prisma validate: pass
npx prisma generate: pass
npx prisma migrate status: pass
npm run typecheck: pass
npm run build: pass
npx eslint scripts/smoke-full-macro-coverage-final.ts: pass
npm run lint: fail due to pre-existing/out-of-scope lint debt
```

Global lint is not a clean pass. The failures are existing repository-wide lint debt in older scripts/source files and do not list the new Phase 149Q smoke file.

## Known Limitations

- `GLOBAL_FLOW` still needs a product definition and source decision.
- All candidate/manual/provider/proxy rows remain not production-approved and require review before any stronger production gate.

## Recommended Next Phase

Phase 149R should decide the product definition for `GLOBAL_FLOW` before any data acquisition:

- global equity fund flow,
- ETF flow,
- risk-on/risk-off proxy,
- global liquidity / financial conditions proxy,
- or another explicitly approved definition.

Do not populate `GLOBAL_FLOW` until that definition/source decision is made.

## Commit

Phase 149Q commit is the final `HEAD` commit for this evidence file; the exact hash is recorded in the final report and `git log`.
