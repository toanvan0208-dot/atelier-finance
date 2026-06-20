# Cross-module Runtime Consumption Browser Verification

## 1. Phase 57 Summary

Phase 57 is a browser/manual verification sweep after Phase 56. The goal is to inspect the real local UI and source transparency after Risk gained controlled partial Financials runtime consumption.

This phase does not add a feature, does not wire new calculations, and does not change data architecture. Result: pass for all checked fallback and DB-backed routes.

## 2. Environment

- Date: 2026-06-20.
- Node: `v24.16.0`.
- npm: `11.13.0`.
- Local DB observed: `dev.db` exists in the repo root.
- Fallback command: `npm run dev -- --hostname 127.0.0.1 --port 3100`.
- Fallback env: no `ATELIER_FINANCIALS_DB_SOURCE` set by the launched command.
- DB-backed command: `DATABASE_URL=file:./dev.db ATELIER_FINANCIALS_DB_SOURCE=enabled npm run dev -- --hostname 127.0.0.1 --port 3100`.
- DB-backed env: `DATABASE_URL=file:./dev.db`, `ATELIER_FINANCIALS_DB_SOURCE=enabled`.
- Browser path: regular Playwright fallback.
- Browser fallback reason: the in-app Browser plugin is present in the session, but tool search did not expose an in-app browser navigation/screenshot tool. Playwright was used for localhost verification.
- Viewport: Chromium headless, `1440x1000`.

No DB write, seed, reset, cleanup, import, external API call, parser, or upload path was run.

## 3. Files Audited

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/shared/DataQualityBanner.tsx`
- `src/features/financials/components/FinancialsPage.tsx`
- `src/features/financials/components/FinancialsSourceTransparency.tsx`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/overview/components/OverviewPage.tsx`
- `src/features/overview/lib/overview-financials-runtime-boundary.ts`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/lib/valuation-financials-runtime-readiness.ts`
- `src/features/valuation/lib/valuation-financials-runtime-consumption.ts`
- `src/features/risk/components/RiskPage.tsx`
- `src/features/risk/lib/risk-financials-runtime-readiness.ts`
- `src/features/risk/lib/risk-financials-runtime-consumption.ts`

## 4. Routes Checked

| Route | Mode | Rendered | Source status observed | Overclaim found | Notes |
| --- | --- | --- | --- | --- | --- |
| `/workspace?module=financials` | fallback | yes | `sample_fallback`, `sample_static`, `fallbackUsed:true`, `productionApproved:false` | no | Source transparency visible. |
| `/workspace?module=overview` | fallback | yes | `sample_fallback`, partial Financials runtime, `canClaimOverviewDbBacked:false` | no | Contains safe negative wording that Financials does not make Overview fully DB-backed. |
| `/workspace?module=valuation` | fallback | yes | `sample_fallback`, `controlled partial`, bridge note | no | No valuation action wording observed. |
| `/workspace?module=risk` | fallback | yes | `sample_fallback`, `controlled partial`, `canClaimRiskDbBacked:false` | no | Phase 56 Risk note visible. |
| `/workspace?module=financials&ticker=FPT` | fallback | yes | Same fallback Financials state | no | Ticker route rendered. |
| `/workspace?module=overview&ticker=FPT` | fallback | yes | Same fallback Overview state | no | Safe negative Overview DB-backed wording only. |
| `/workspace?module=valuation&ticker=FPT` | fallback | yes | Same fallback Valuation state | no | Ticker route rendered. |
| `/workspace?module=risk&ticker=FPT` | fallback | yes | Same fallback Risk state | no | Ticker query does not make Risk DB-backed. |
| `/workspace?module=financials&ticker=FPT` | DB-backed | yes | `db_backed`, `local_db`, `research_only`, `fallbackUsed:false`, `productionApproved:false` | no | Local synthetic row rendered. |
| `/workspace?module=financials&ticker=MWG` | DB-backed | yes | `db_backed`, `local_db`, `research_only`, partial/missing | no | `revenue`, `operatingCashFlow` listed missing; no zero-fill observed. |
| `/workspace?module=overview&ticker=FPT` | DB-backed | yes | `mixed_source`, Financials `db_backed/local_db/research_only`, `canClaimOverviewDbBacked:false` | no | Partial runtime note visible. |
| `/workspace?module=overview&ticker=MWG` | DB-backed | yes | `mixed_source`, Financials missing fields listed | no | MWG missing fields surfaced as unavailable/null. |
| `/workspace?module=valuation&ticker=FPT` | DB-backed | yes | `mixed_source`, `controlled partial`, `canClaimRuntimeBacked:false` | no | Persisted input bridge note visible. |
| `/workspace?module=valuation&ticker=MWG` | DB-backed | yes | `mixed_source`, unavailable `revenue`, `operatingCashFlow`, `sharesOutstanding`, `eps` | no | No zero-fill observed. |
| `/workspace?module=risk&ticker=FPT` | DB-backed | yes | `mixed_source`, `controlled partial`, `canClaimRiskDbBacked:false` | no | Risk cards remain static/sample. |
| `/workspace?module=risk&ticker=MWG` | DB-backed | yes | `mixed_source`, unavailable `revenue`, `operatingCashFlow`, `totalDebt`, `currentAssets`, `currentLiabilities` | no | `cashFlowQuality:insufficient_data`; no zero-fill observed. |

All checked routes had HTTP 200, no Playwright-captured console errors, and no framework/runtime overlay text.

## 5. Financials Verification

Fallback:

- Observed source label: `static_sample_financials`.
- Observed data mode: `sample`.
- Observed read path: `sample_static`.
- Observed runtime: `sample_fallback`.
- Observed `fallbackUsed`: `true`.
- Observed `productionApproved`: `false`.
- Missing/null behavior: UI states missing data remains null/unavailable and is not replaced with `0`.
- Overclaim check: no official, realtime, production-ready, positive production-approved, workspace-wide DB-backed, recommendation, or trading-signal claim observed.

DB-backed:

- FPT source label: `phase45_synthetic_financial_statement_local_write`.
- FPT data mode: `research_only`.
- FPT read path: `local_db`.
- FPT runtime: `db_backed`.
- FPT `fallbackUsed`: `false`.
- FPT `productionApproved`: `false`.
- MWG missing fields: `revenue`, `operatingCashFlow`.
- MWG missing/null behavior: fields were shown as missing/unavailable and not observed as `0 VND` or `0 ty`.
- Overclaim check: no official, realtime, production-ready, positive production-approved, recommendation, or trading-signal claim observed.

## 6. Overview Verification

- Fallback source note: `overview runtime boundary`, `sample_fallback`, `productionApproved:false`, `partial financials runtime`.
- DB-backed source note: `overviewRuntimeStatus mixed_source`, `financialsRuntimeStatus db_backed`, `financialsReadPath local_db`, `dataMode research_only`, `fallbackUsed false`.
- Mixed-source/partial-runtime status: visible.
- `canClaimOverviewDbBacked` expectation: `false`, visible in the boundary table.
- Overclaim check: no unsafe overclaim. The text "does not make Overview fully DB-backed" is a safe negative-context hit.
- MWG partial behavior: `Financials missing fields: revenue, operatingCashFlow` was visible; null/unavailable and no zero-fill observed.

## 7. Valuation Verification

- Fallback source note: `valuation runtime boundary`, `sample_fallback`, `productionApproved:false`, `controlled partial`.
- DB-backed source note: `valuationSourceMode mixed_source`, `runtimeStatus db_backed`, `readPath local_db`, `dataMode research_only`, `fallbackUsed false`.
- Mixed-source/controlled partial status: visible.
- `canClaimValuationDbBacked` expectation: false via `canClaimRuntimeBacked false`.
- Calculation path: visible text says Valuation still uses the persisted input bridge.
- Forbidden valuation wording: no unsafe browser-visible hit.
- Unavailable/not_applicable behavior: FPT showed unavailable `sharesOutstanding`, `eps`; MWG showed unavailable `revenue`, `operatingCashFlow`, `sharesOutstanding`, `eps`; no zero-fill observed.

## 8. Risk Verification

- Fallback source note: `risk runtime boundary`, `sample_fallback`, `productionApproved:false`, `controlled partial`, `canClaimRiskDbBacked false`.
- DB-backed source note: `riskSourceMode mixed_source`, `runtimeStatus db_backed`, `readPath local_db`, `dataMode research_only`, `fallbackUsed false`.
- Mixed-source/controlled partial status: visible.
- Display cards still static/sample: visible note states static/sample display cards plus controlled Financials runtime metadata.
- `canClaimRiskDbBacked` expectation: `false`, visible in the boundary table.
- Overclaim check: no unsafe overclaim.
- Unavailable fields behavior:
  - FPT unavailable: `totalDebt`, `currentAssets`, `currentLiabilities`.
  - MWG unavailable: `revenue`, `operatingCashFlow`, `totalDebt`, `currentAssets`, `currentLiabilities`.
  - MWG `cashFlowQuality` was `insufficient_data`.
  - No zero-fill observed.
- Forbidden risk wording: no unsafe browser-visible hit.

## 9. Forbidden Wording Scan

Commands used:

```powershell
rg -n --fixed-strings --glob '!node_modules/**' --glob '!.next/**' --glob '!tsconfig.tsbuildinfo' --glob '!dev.db' --glob '!package-lock.json' --glob '!src/generated/prisma/**' -- <pattern> src docs
```

Patterns included:

- `nen mua`, `nen ban`, `nen nam giu`, `tin hieu mua`, `tin hieu ban`, `diem mua`
- `co phieu an toan`, `chac chan re`, `chac chan xau`, `rui ro thap chac chan`
- `dinh gia hap dan`, `dang re`, `dang mua`, `an toan`, `rui ro thap`, `rat an toan`, `khong dang lo`
- accented Vietnamese equivalents
- `official`, `realtime`, `production-ready`, `production-approved`

Result:

- Unsafe browser-visible hits in checked routes: none.
- Safe negative-context hits: Overview text uses "does not make Overview fully DB-backed"; docs/tests contain denied-claim wording, forbidden phrase lists, and `expect(...).not...` assertions.
- Existing pre-Phase-57 docs include source-boundary phrases such as "not official", "not realtime", and "not production-approved"; these are denial contexts.
- No code wording changes were required.

## 10. Issues Found And Fixes

No UI/source overclaim issue found.

No code wording changes were required.

## 11. Limitations

- The in-app Browser plugin path was unavailable because no navigation/screenshot tool was exposed by tool search.
- Playwright fallback was used instead.
- Browser verification was limited to Chromium headless at `1440x1000`.
- DB-backed verification depends on the current local synthetic `dev.db`.
- No screenshots, traces, raw reports, or database files were committed.

## 12. Non-goals

- No DB write.
- No DB cleanup/delete.
- No `db:reset`.
- No `db:seed`.
- No real BCTC import.
- No official source.
- No external API call.
- No Excel/PDF parser.
- No public upload API.
- No Risk DB-backed scoring.
- No Valuation calculation wiring.
- No production source approval.
- No recommendation/trading-signal wording.

## 13. Final Result

Result: pass.

Both fallback and DB-backed Financials modes were browser-verified across Financials, Overview, Valuation, and Risk. Phase 56's Risk source note remained controlled partial/mixed-source, and no new UI/source overclaim issue was found.

Recommended next phase: Controlled Valuation Calculation Wiring Readiness Plan. Valuation already displays Financials runtime metadata, but calculations still use the persisted bridge; a planning phase can define prerequisites and guardrails before any deeper wiring.

## 14. Phase 58 Follow-up

Phase 58 implements that recommended planning step in `CONTROLLED_VALUATION_CALCULATION_WIRING_READINESS_PLAN.md`. It records the Valuation metric/input/guardrail matrix for Phase 59 and confirms no new browser pass is required in Phase 58 because no UI or calculation behavior changed.

## 15. Phase 61 Follow-up

Phase 61 records the next Valuation-specific browser pass in `CONTROLLED_VALUATION_UI_READ_ONLY_DISPLAY_BOUNDARY.md`. Playwright fallback verified the new controlled Valuation read-only status panel in fallback and local DB-backed Financials modes, with blocked EV/EV/EBITDA/DCF/fair-value-range states and no browser-visible valuation interpretation wording.
