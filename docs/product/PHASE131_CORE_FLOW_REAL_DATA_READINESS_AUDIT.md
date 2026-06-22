# Phase 131 Core Flow Real-Data Readiness Audit

## 1. Scope
- HEAD: `26ff45e9df7ea9dfd895b218b7d520070d95ae09` (`Phase 130 stabilize validation and copy guardrails`)
- Date/time: `2026-06-23 02:13:44 +07:00`
- Audit mode: audit-first only. No data import, no DB write, no DB reset, no seed, no schema change, no API/persistence change, no runtime calculation change.
- Browser target: `http://127.0.0.1:3000`. Port 3000 was already running from this repo. A second dev server on 3001 was blocked by Next because an existing dev server PID was active for `D:\Codex\atelier-finance`.
- Browser method: in-app Browser DOM smoke with `document.body.innerText`, route URL checks, console error reads, Next/framework overlay scan, forbidden wording scan, and raw/internal label scan.

## 2. Validation baseline
| Command | Result | Notes |
|---|---|---|
| `npx prisma validate` | Pass | Schema valid. |
| `npx tsc --noEmit` | Pass | No TypeScript errors. |
| `npm run lint` | Pass | ESLint completed. |
| `npm test` | Pass | 125 files, 1053 tests passed. |
| `npm run build` | Pass | Completed after report creation. |

## 3. FPT full-flow audit matrix
| Module | Route | Render | Ticker correct | Data status | Missing / limitation | Raw leak | Overclaim | Notes |
|---|---|---|---|---|---|---|---|---|
| Macro | `/workspace?module=macro&ticker=FPT` | Yes | Partial | Static/readiness skeleton; not ticker-specific | No FPT ticker shown; macro data is in preparation state, missing source/evidence/unit readiness | No | No production claim | Literal forbidden scan hit `co phieu tot` from global/user-facing copy. No console error or overlay. |
| Industry | `/workspace?module=industry&ticker=FPT` | Yes | Yes | Research-only/static sector context | Industry data shown as preparation/research context, not production data | No | No production claim | FPT appears correctly. Friendly source/readiness copy. No console error or overlay. |
| Screening | `/workspace?module=screening&ticker=FPT` | Yes | Yes, but multi-ticker by design | Static/readiness MVP for FPT/MWG/VNM | Screening is a readiness table, not a DB-backed screener | No | No production claim | Literal forbidden scan hit `khuyen nghi` and `co phieu tot` in disclaimer copy. No console error or overlay. |
| Business | `/workspace?module=business&ticker=FPT` | Yes | **No** | Static/sample fallback | Renders MWG sample content while URL is FPT; FPT not shown after extended wait | No | No production claim | Major readiness blocker: fallback/sample ticker mismatch. DOM says sample MWG when URL has FPT. No console error or overlay. |
| Financials | `/workspace?module=financials&ticker=FPT` | Yes | Yes | Local DB-backed/research/manual-reviewed financials | EPS, shares outstanding, total debt remain unavailable; data remains research-only and not production-approved | No | No production claim | Friendly labels: `Da co trong he thong`, `Dung cho nghien cuu`, `Chua phe duyet san xuat`, missing kept unavailable/null. Literal forbidden scan hit `khuyen nghi` in disclaimer copy. |
| Valuation | `/workspace?module=valuation&ticker=FPT` | Yes, but stuck in loading/default state | **No** | Client bridge/default placeholder | Shows loading for `FPTLAB`, not FPT; no valuation data rendered for requested ticker | No | No production claim | Major readiness blocker: URL ticker not reflected in displayed valuation request. No console error or overlay. |
| Risk | `/workspace?module=risk&ticker=FPT` | Yes | Yes | Research-only/manual local risk readiness consuming financials snapshot/status | Missing EPS, debt, shares, market price, P/E and related valuation inputs; risk is not a full DB-backed calculation claim | No | No production claim | Friendly missing copy and source caveat. Literal forbidden scan hit `khuyen nghi` and `co phieu tot` in explanatory/disclaimer copy. No console error or overlay. |

## 4. MWG/VNM sanity smoke matrix
| Ticker | Module | Render | Ticker correct | Fallback issue | Raw leak | Overclaim | Notes |
|---|---|---|---|---|---|---|---|
| MWG | Business | Yes | Yes | Sample/demo still shown even with ticker in URL | No | No production claim | MWG is the default business journey. DOM still says sample MWG when URL has ticker, so sample labeling is noisy but ticker is not cross-ticker. |
| MWG | Financials | Yes | Yes | None observed | No | No production claim | DB/research financials render; missing fields stay unavailable. |
| MWG | Valuation | Yes, but loading/default | **No** | Shows `FPTLAB`, not MWG | No | No production claim | Same valuation URL ticker readiness blocker. |
| MWG | Risk | Yes | Yes | None observed | No | No production claim | Research/local status and missing data render friendly. |
| VNM | Business | Yes | **No** | Renders MWG sample content for VNM | No | No production claim | Major cross-ticker fallback issue. VNM has company profile metadata but no detailed business journey data. |
| VNM | Financials | Yes | Yes | None observed | No | No production claim | DB/research financials render; missing fields stay unavailable. |
| VNM | Valuation | Yes, but loading/default | **No** | Shows `FPTLAB`, not VNM | No | No production claim | Same valuation URL ticker readiness blocker. |
| VNM | Risk | Yes | Yes | None observed | No | No production claim | Research/local status and missing data render friendly. |
| MWG | Technical extra smoke | Yes | Yes | None observed | No | No production claim | Technical/PVT shows research source and correct MWG. Literal forbidden scan hit `hap dan` in copy. |
| VNM | Technical extra smoke | Yes | Yes | None observed | No | No production claim | Technical/PVT shows research source and correct VNM. Literal forbidden scan hit `hap dan` in copy. |
| MWG | Overview extra smoke | Yes | Partial | Shows default `FPTLAB` loading text, not MWG | No | No production claim | Overview is not core Phase 131 scope, but ticker-specific overview is not ready. |
| VNM | Overview extra smoke | Yes | Partial | Shows default `FPTLAB` loading text, not VNM | No | No production claim | Overview is not core Phase 131 scope, but ticker-specific overview is not ready. |

## 5. AI Assistant safety check
- Provider state: `.env.local` sets `AI_ASSISTANT_PROVIDER=none`; no real OpenAI provider call was made.
- Panel render: Right assistant panel rendered on the checked workspace routes, including `/workspace?module=risk&ticker=FPT`.
- Safety: Panel stayed in contextual guidance mode. No assistant prompt was submitted. No production-approved claim was observed.
- Caveat: DOM literal forbidden scan finds some guardrail/disclaimer phrases such as `khuyen nghi`; these are safety disclaimers, not advice, but they still violate the strict Phase 131 DOM forbidden-term checklist as written.

## 6. Data readiness summary
- DB-backed modules:
  - Financials renders local DB-backed/research/manual-reviewed financial data for FPT/MWG/VNM.
  - Risk consumes financials runtime metadata/snapshot, but does not claim full risk DB-backed production readiness.
  - Technical/PVT extra smoke shows local/research source metadata and correct ticker for MWG/VNM.
- Reviewed/research-only modules:
  - Financials: reviewed/manual/local research data, not production-approved.
  - Risk: local/research-only readiness, manual review context, not production-approved.
  - Industry: research-only/static sector context, not production-approved.
- Static/sample/fallback modules:
  - Macro: static/readiness skeleton, no ticker-specific real macro data.
  - Screening: static readiness MVP across FPT/MWG/VNM.
  - Business: detailed business journey is effectively MWG sample/default; FPT/VNM route readiness fails because ticker-specific detail is not rendered.
  - Valuation: URL ticker path is not ready; loading/default `FPTLAB` blocks real ticker audit.
- Missing fields/gaps:
  - FPT Financials/Risk: EPS, shares outstanding, total debt, market price/P/E related fields remain unavailable.
  - Valuation: requested ticker bridge/read path is the primary blocker before metric readiness can be trusted.
  - Business: FPT and VNM need ticker-correct detailed business journey or a friendly no-data state.

## 7. Next data bottlenecks
1. Valuation URL ticker bridge/readiness: product impact is highest because the core flow cannot audit valuation data for FPT/MWG/VNM while the UI remains on `FPTLAB`.
2. Business cross-ticker fallback: high impact because FPT/VNM routes can show MWG sample content, violating the no-wrong-ticker rule.
3. Financials missing core fields: EPS, shares outstanding, total debt, and market price inputs block Valuation and Risk from becoming complete.
4. Strict DOM wording guardrail: several routes use forbidden terms in safety disclaimers. The intent is safe, but the literal Phase 131 scan still flags them.
5. Macro/Industry/Screening static-data boundary: these modules render clearly, but they are not yet real DB-backed/reviewed macro/screener datasets.

## 8. Recommended next phases
- Phase 132: Fix ticker fidelity for Business and Valuation read paths. Scope should focus on URL ticker consumption, no cross-ticker fallback, and friendly unavailable states.
- Phase 133: Fill reviewed financial input gaps for valuation/risk readiness. Scope should target EPS, shares outstanding, debt, and market price provenance without changing formulas.
- Phase 134: DOM copy guardrail hardening. Replace literal forbidden trading/recommendation terms in user-facing disclaimers with neutral educational wording.
- Phase 135: Macro/Industry/Screening real-data boundary plan. Define reviewed source requirements and DB/read-path ownership before importing data.

## 9. Browser/DOM smoke result
- Browser path: in-app Browser was available and used through the Browser plugin runtime.
- Checked routes:
  - FPT full flow: Macro, Industry, Screening, Business, Financials, Valuation, Risk.
  - MWG/VNM sanity: Business, Financials, Valuation, Risk.
  - Extra: MWG/VNM Technical and Overview.
- Console errors: none observed on the audited routes.
- Next/framework overlay: none observed on the audited routes.
- Raw/internal label scan: no user-facing `productionApproved`, `research_only`, `dataMode`, `sourceType`, `local_db_manual_import`, `vnstock_research_candidate`, `phase116_reviewed_financial_missing_fields`, `manual_reviewed_financial_statement_2024`, or `phase109_controlled_local_financials` leaks observed in DOM.
- Ticker fidelity:
  - Passed: Industry, Screening, Financials, Risk, Technical extra smoke.
  - Failed: Business for FPT/VNM; Valuation for FPT/MWG/VNM; Overview extra smoke for MWG/VNM.
- Navigation:
  - Code-level helper `buildModuleNavigationUrl` preserves existing `ticker` when `onNavigate` is used, and its unit test passes.
  - Browser DOM did not expose normal `a[href]` module links for static href inspection; module movement is mostly button/history driven.
  - Because Business and Valuation fail direct URL ticker fidelity, end-to-end navigation into those modules cannot yet be claimed ticker-safe.

## 10. Phase 131 constraints confirmation
- No data import performed.
- No DB write performed.
- No DB reset performed.
- No seed performed.
- No schema change performed.
- No API/persistence added.
- No runtime financial/technical/valuation/risk calculation changed.
- No AI Assistant runtime behavior changed.
- No UI redesign performed.
- No production-approved claim added.
