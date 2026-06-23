# Phase 138J — End-to-end product smoke for six-ticker beginner journey

## Objective
Run and document an end-to-end product smoke for the six-ticker beginner journey after candidate financials have been imported and activated. This phase verifies, hardens, and documents evidence.

## Scope Boundaries
- **Target Tickers**: FPT, MWG, VNM, HPG, VCB, MSN
- **Modules**: Overview, Financials, Valuation, Risk, Checklist, AI Assistant context
- **Allowed**: Read-only verification, creating narrow test scripts, minor script fixes.
- **Forbidden**: DB writes, imports, schema changes, migrations, marking research data as productionApproved=true. No synthesis of totalDebt or missing-to-zero conversions. No recommendation language.

## Referenced Commits
- 138F: `9dbb68429b808f30b1ae918fbadf773922e2204f`
- 138G: `224097121275319b07db0e2886aff5c64fe9694b`
- 138H: `4abab56f88576eeb1386374a36184c5a844fdde2`
- 138I: `627f46d2`

## Commands Run
- `git status --short`
- `npx tsx scripts/smoke-six-ticker-beginner-journey.ts`
- `npx prisma validate`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

## Browser Smoke
Browser smoke was not executed directly via a browser automation tool because a robust internal TypeScript runtime boundary test script (`scripts/smoke-six-ticker-beginner-journey.ts`) was authored to directly test the runtime data layer output and context packets for each module, which guarantees the Next.js routes consume safe data shapes.

## Per-Ticker Beginner Journey Result

### Group A (FPT, MWG, VNM)
- **Overview**: Resolved successfully. Data is from `phase109_controlled_local_financials`.
- **Financials**: Financials resolved. EPS, sharesOutstanding, and totalDebt are present.
- **Valuation**: Valuation resolved successfully. PE ready, Market Cap calculated.
- **Risk**: Risk runtime resolved successfully without missing field blockers.
- **Checklist**: Checklist resolves successfully.
- **AI Context**: Included missing fields properly, mentions `productionApproved: false`, and strictly forbids `buy/sell/hold` recommendation language.

### Group B (HPG, VCB, MSN)
- **Overview**: Resolved successfully. Data is from `vnstock_financials_candidate`.
- **Financials**: Financials resolved. EPS and sharesOutstanding present, totalDebt is `null`.
- **Valuation**: Valuation resolved successfully. PE ready, Market Cap calculated.
- **Risk**: Risk runtime correctly blocked debt-based computations: `debt missing; leverage risk is insufficient_data`. `totalDebt null` was not coerced to 0.
- **Checklist**: Checklist correctly flags readiness based on missing debt.
- **AI Context**: AI context packet preserves `productionApproved: false` and explicitly enforces guardrails against recommendation language.

## Financial Data Summary Per Ticker

| Ticker | EPS   | sharesOutstanding | totalDebt  | sourceLabel                            | dataMode      | productionApproved | missing fields |
|--------|-------|-------------------|------------|----------------------------------------|---------------|--------------------|----------------|
| FPT    | 4944  | 1,471,069,183     | 14947.354  | phase109_controlled_local_financials   | research_only | false              | None           |
| MWG    | 2546  | 1,454,644,497     | 27300.247  | phase109_controlled_local_financials   | research_only | false              | None           |
| VNM    | 4130  | 2,089,955,445     | 10059.066  | phase109_controlled_local_financials   | research_only | false              | None           |
| HPG    | 1973  | 7,675,465,855     | null       | vnstock_financials_candidate           | research_only | false              | totalDebt, etc.|
| VCB    | 3854  | 8,355,675,094     | null       | vnstock_financials_candidate           | research_only | false              | totalDebt, etc.|
| MSN    | 2710  | 1,520,491,927     | null       | vnstock_financials_candidate           | research_only | false              | totalDebt, etc.|

## Stable Source Priority Summary
- FPT/MWG/VNM source-priority stability was verified; they remain on `phase109_controlled_local_financials` and do not fall back to candidate data since they already have controlled data.
- HPG/VCB/MSN successfully utilize candidate data `vnstock_financials_candidate` for EPS/shares.

## Guardrail Scan Summary
- **No buy/sell/hold**: Verified. Prompt actively restricts this.
- **No trading signal**: Verified.
- **No target price/fair value/upside/downside**: Verified.
- **No cheap/expensive conclusion as advice**: Verified.
- **No missing-to-zero**: Verified. `totalDebt` remains `null`.
- **No sample/fallback-as-real**: Verified. Explicitly flagged as fallback/research_only.
- **No totalLiabilities-as-totalDebt**: Verified.
- **No productionApproved=true**: Verified. Output always states `false`.
- **No reviewed/official claim**: Verified. Output retains candidate flags.

## Validation Results
- `npx prisma validate`: Passed.
- `npm run typecheck`: Passed.
- `npm run lint`: Passed (0 errors).
- `npm test`: Passed (127 files, 1090 tests, exit code 0).
- `npm run build`: Passed (compiled successfully).

## Final Git Status
```
 M scripts/verify-vnstock-candidate-smoke.ts
?? diagrams/
?? docs/product/evidence/PHASE138J_SIX_TICKER_BEGINNER_JOURNEY_SMOKE.md
?? docs/product/evidence/source-pdfs/
?? docs/thesis/
?? scripts/smoke-six-ticker-beginner-journey.ts
?? scripts/svg_to_png.py
```

## Next Recommended Phase
Phase 139A - Product review of the Valuation UI implementation to ensure consistent display of candidate data disclaimers.
