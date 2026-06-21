# Product Demo Flow Browser Smoke Verification

## 1. Phase Purpose

Phase 91 verifies the main product demo flow across the core workspace modules after the recent transparency/readiness UI work.

The phase is evidence-only: it checks the browser-visible state of the existing product routes and records the result. No source approval, ingestion, parser, schema, DB write, upload flow, new metric, recommendation, target, fair value, or risk scoring capability is added.

## 2. Routes Verified

Browser smoke verification covered these workspace routes:

| Route | Result |
| --- | --- |
| `/workspace?module=overview` | Loaded normally |
| `/workspace?module=financials` | Loaded normally |
| `/workspace?module=valuation` | Loaded normally |
| `/workspace?module=technical` | Loaded normally |
| `/workspace?module=macro` | Loaded normally |
| `/workspace?module=industry` | Loaded normally |

## 3. Browser/Dev Workflow Used

- Dev server: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Browser workflow: Codex in-app Browser against `http://127.0.0.1:3000`
- Smoke method: route navigation, visible text/DOM checks, console warning/error check, framework overlay text scan, and forbidden wording scan.
- Screenshots: not committed.

## 4. Overview Readiness Result

`/workspace?module=overview` rendered the Overview workspace normally.

Observed browser-visible evidence:

- Overview readiness summary is visible.
- Financials, Valuation, Technical/PVT, Macro, and Industry readiness entries are visible.
- `productionApproved:false` is visible.
- Overview states that Financials runtime can inform Overview but does not make Overview fully DB-backed.
- Missing, source, unit, and blocked/boundary states remain visible through the module summary cards.

Result: pass.

## 5. Financials Transparency Result

`/workspace?module=financials` rendered the Financials workspace normally.

Observed browser-visible evidence:

- `productionApproved:false` is visible.
- The data mode/source transparency card shows sample fallback/local research boundaries.
- Unit metadata status is visible as unknown where appropriate.
- Missing fields remain visible and are not zero-filled.
- Blocked Valuation handoff reasons remain visible.
- `canClaimValuationDbBacked:false` remains visible.

Result: pass.

## 6. Valuation Boundary Result

`/workspace?module=valuation` rendered the Valuation workspace normally.

Observed browser-visible evidence:

- `productionApproved:false` is visible.
- `canClaimValuationDbBacked:false` is visible.
- Valuation stays in a mixed/controlled partial source state.
- Blocked states and missing input coverage are visible.
- The UI does not claim Valuation is fully DB-backed.

Result: pass.

## 7. Technical/PVT Result

`/workspace?module=technical` rendered the Technical/PVT workspace normally.

Observed browser-visible evidence:

- `productionApproved:false` is visible.
- Price/volume source transparency is visible.
- Sample/static source metadata remains visible.
- Derived PVT metrics are described as computed only from the active market price series and unavailable when insufficient.
- No trading signal or action instruction wording was observed.

Result: pass.

## 8. Macro Readiness Result

`/workspace?module=macro` rendered the Macro workspace normally.

Observed browser-visible evidence:

- Macro readiness panel is visible.
- Source/evidence status is visible as missing/incomplete.
- Explicit unit requirements are visible.
- `productionApproved:false` is visible.
- The readiness state remains blocked/not-ready until source evidence and unit metadata exist.

Result: pass.

## 9. Industry Readiness Result

`/workspace?module=industry` rendered the Industry workspace normally.

Observed browser-visible evidence:

- Industry readiness panel is visible.
- Source/evidence status is visible as missing/incomplete.
- Explicit unit requirements are visible.
- `productionApproved:false` is visible.
- The readiness state remains blocked/not-ready until source evidence and unit metadata exist.

Result: pass.

## 10. Forbidden Wording Scan Result

The browser-visible scan checked the verified routes for forbidden recommendation, target, fair value, risk scoring, official/realtime, and production-approved wording.

Checked routes:

- `/workspace?module=overview`
- `/workspace?module=financials`
- `/workspace?module=valuation`
- `/workspace?module=technical`
- `/workspace?module=macro`
- `/workspace?module=industry`

Forbidden browser-visible hits: none observed.

Result: pass.

## 11. Console/Framework Overlay Result

The in-app Browser smoke pass reported:

- No blocking browser console errors.
- No relevant browser warnings.
- No framework/runtime overlay text.
- No route failed to render meaningful app content.

Result: pass.

## 12. What Was Not Done

Real data imported: no

DB write performed: no

Migration/schema changed: no

External API/vnstock used: no

Parser/importer added: no

Upload UI/API added: no

New metrics added: no

Recommendation/target/fair value/risk scoring added: no

productionApproved/source approval added: no

No raw CSV, generated browser screenshot, DB file, generated Prisma output, or temp JSON output is intended for commit.

## 13. Validation Results

Phase 91 validation commands:

- `npx prisma validate`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass, 93 files and 780 tests
- `npm run build`: pass

Focused tests: not added because the browser smoke pass found no UI/copy defect and Phase 91 made docs/evidence changes only.

## 14. Future Phase 92 Recommendation

Prefer an approved source adapter pilot planning phase or a narrow source-evidence persistence design phase. The next phase should keep the same fail-closed posture: no source should become production-approved until evidence, ownership, terms/license, caching/storage permission, runtime display permission, and review notes are complete.
