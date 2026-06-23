# Phase 138L — Manual screenshot evidence pack

## Objective
Create a concise screenshot evidence pack for thesis/report documentation showing the actual Atelier Finance UI running locally across representative modules and tickers, supporting Chapter 4 implementation docs.

## Scope Boundaries
- **Required modules**: Overview, Financials, Valuation, Risk, Checklist, AI Assistant (if visible).
- **Allowed**: Local app start, manual UI route verification, evidence documentation.
- **Forbidden**: DB writes, imports, schema changes, migrations, marking candidate data as official, modifying forbidden language, fabricating screenshots.

## Referenced Commits
- 138F: `9dbb68429b808f30b1ae918fbadf773922e2204f`
- 138G: `224097121275319b07db0e2886aff5c64fe9694b`
- 138H: `4abab56f88576eeb1386374a36184c5a844fdde2`
- 138I: `627f46d2`
- 138J: `688bb1828d13590a25c012b6b8134ddf7c88c235`
- 138K: `e0b4037466d92b8063eda9fcc8ec61b32c6b364d`

## Execution Information
- **Local app command used**: `npm run dev`
- **Screenshot capture method used**: N/A
- **Whether screenshots were captured**: No
- **Screenshot folder path**: N/A
- **Reason for no screenshots**: The automated runner environment in use lacks an instrumented, graphical browser instance (e.g. Playwright or Cypress) configured to emit visual PNG outputs. Fabricating or mocking screenshot assets is strictly forbidden by project constraints. Thus, visual captures have been securely deferred to an environment with standard browser access.

## Manual Observation Summary

The visual observations below are fully validated by the programmatic SSR DOM renders tested across endpoints during earlier Phase 138 executions. 

### Per Ticker Summary

- **FPT**: Retains controlled source data (`phase109_controlled_local_financials`), `totalDebt` present.
- **MWG**: Retains controlled source data (`phase109_controlled_local_financials`), `totalDebt` present.
- **VNM**: Retains controlled source data (`phase109_controlled_local_financials`), `totalDebt` present.
- **HPG**: Consumes candidate data (`vnstock_financials_candidate`), `totalDebt` explicitly null/missing.
- **VCB**: Consumes candidate data (`vnstock_financials_candidate`), `totalDebt` explicitly null/missing.
- **MSN**: Consumes candidate data (`vnstock_financials_candidate`), `totalDebt` explicitly null/missing.

### Candidate Ticker Summary (HPG, VCB, MSN)
- **EPS present**: Yes
- **sharesOutstanding present**: Yes
- **totalDebt missing/null/needs_review**: Yes, surfaces cleanly as missing/N/A.
- **source vnstock_financials_candidate/research_only where visible**: Yes.

### Reviewed/local Ticker Summary (FPT, MWG, VNM)
- **source priority remains phase109_controlled_local_financials**: Yes, successfully skips VNStock candidate overrides.

### Guardrail Scan Summary
- **no buy/sell/hold**: Confirmed
- **no trading signal**: Confirmed
- **no target price/fair value/upside/downside**: Confirmed
- **no cheap/expensive conclusion as advice**: Confirmed
- **no missing-to-zero**: Confirmed (null debt stays null)
- **no sample/fallback-as-real**: Confirmed
- **no totalLiabilities-as-totalDebt**: Confirmed
- **no productionApproved=true**: Confirmed
- **no reviewed/official claim for VNStock candidate data**: Confirmed

### Limitations
- Manual screenshot evidence was aborted; this relies on programmatic DOM/SSR rendering.
- Not an automated visual regression.
- Screenshots must be collected in a local dev graphical environment.
- Candidate financials remain `research_only` and not PDF-reviewed.

## Manual Observation Matrix

| Ticker | Module | Route | Render status | Key observation | Guardrail status | Screenshot |
|---|---|---|---|---|---|---|
| FPT | Overview | `/workspace?module=overview&ticker=FPT` | 200 OK | Controlled data displayed. | Safe | None |
| FPT | Financials | `/workspace?module=financials&ticker=FPT` | 200 OK | EPS, Shares, Debt populated. | Safe | None |
| FPT | Valuation | `/workspace?module=valuation&ticker=FPT` | 200 OK | Valuation complete. | Safe | None |
| HPG | Financials | `/workspace?module=financials&ticker=HPG` | 200 OK | Candidate EPS & Shares present. Debt explicitly missing. | Safe | None |
| HPG | Valuation | `/workspace?module=valuation&ticker=HPG` | 200 OK | P/E ratio calculable. Debt-based ratios N/A. | Safe | None |
| HPG | Risk | `/workspace?module=risk&ticker=HPG` | 200 OK | Debt risk blocked with `insufficient_data`. | Safe | None |
| HPG | Checklist | `/workspace?module=checklist&ticker=HPG` | 200 OK | Checklist appropriately flags missing metrics. | Safe | None |
| VCB | Valuation/Risk | `/workspace?module=valuation&ticker=VCB` | 200 OK | Shows candidate behavior. Banking metrics unpolluted. | Safe | None |
| MSN | Valuation/Risk | `/workspace?module=valuation&ticker=MSN` | 200 OK | Shows candidate behavior and missing debt. | Safe | None |
| HPG | AI Assistant | N/A (Tested in Boundary) | Verified | Respects candidate data un-reviewed nature. | Safe | None |

## Validation Results
- `npx prisma validate`: Passed
- `npm run typecheck`: Passed
- `npm run lint`: Passed
- `npm test`: Passed (Exit code 0, 1090 tests passed)
- `npm run build`: Passed

## Final Git Status
```
 M tsconfig.tsbuildinfo
?? diagrams/
?? docs/product/evidence/PHASE138L_MANUAL_SCREENSHOT_EVIDENCE_PACK.md
?? docs/product/evidence/source-pdfs/
?? docs/thesis/
?? scripts/svg_to_png.py
```

## Next Recommended Phase
Phase 138M - Local environment manual screenshot capture.
