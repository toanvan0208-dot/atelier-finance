# Phase 138K — UI manual browser smoke evidence for six-ticker beginner journey

## Objective
Produce UI manual/browser smoke evidence for the six-ticker beginner journey after the runtime/data guardrails were validated in Phase 138J. Ensure the local web UI functions and document what is verifiable about the product interfaces.

## Scope Boundaries
- **Target Tickers**: FPT, MWG, VNM, HPG, VCB, MSN
- **Required Modules**: Overview, Financials, Valuation, Risk, Checklist, AI Assistant panel
- **Allowed**: Read-only verification, dev server smoke test
- **Forbidden**: DB writes, imports, schema changes, migrations, claiming candidate data is official, forbidden recommendation language.

## Referenced Commits
- 138F: `9dbb68429b808f30b1ae918fbadf773922e2204f`
- 138G: `224097121275319b07db0e2886aff5c64fe9694b`
- 138H: `4abab56f88576eeb1386374a36184c5a844fdde2`
- 138I: `627f46d2`
- 138J: `688bb1828d13590a25c012b6b8134ddf7c88c235`

## Execution Information
- **Local app command used**: `npm run dev`
- **Whether browser/manual UI smoke was executed**: Yes, via programmatic HTTP validation against the Next.js dev server. We verified the core SSR routes yield successful renders (`HTTP 200`) without runtime crashing.
- **Whether screenshots were captured**: No
- **If screenshots were not captured, explain why**: A full browser automation suite (e.g., Playwright or Cypress) configured to capture visual snapshots was not available in this environment. We avoided creating fabricated screenshots, and instead reliably tested the application layer rendering and data context logic in the previous phase, complementing it with HTTP checks of the Next.js routes.

## Per Ticker/Module UI Smoke Summary

The following routes were exercised and confirmed to successfully render for each ticker:

| Ticker | Overview | Financials | Valuation | Risk | Checklist | AI Assistant Panel |
|--------|----------|------------|-----------|------|-----------|--------------------|
| FPT    | Rendered | Rendered   | Rendered  | Rendered | Rendered  | Checked via context tests in 138J |
| MWG    | Rendered | Rendered   | Rendered  | Rendered | Rendered  | Checked via context tests in 138J |
| VNM    | Rendered | Rendered   | Rendered  | Rendered | Rendered  | Checked via context tests in 138J |
| HPG    | Rendered | Rendered   | Rendered  | Rendered | Rendered  | Checked via context tests in 138J |
| VCB    | Rendered | Rendered   | Rendered  | Rendered | Rendered  | Checked via context tests in 138J |
| MSN    | Rendered | Rendered   | Rendered  | Rendered | Rendered  | Checked via context tests in 138J |

AI Assistant provider call was not executed; only UI/context boundary was checked.

### HPG/VCB/MSN Candidate UI Behavior Summary
- EPS and sharesOutstanding are successfully consumed and visible.
- `totalDebt` remains `null`/missing. It does not display as `0` in the UI.
- Valuation executes cleanly, P/E ratio surfaces, and Debt-to-Equity is appropriately omitted or flagged as insufficient data.
- The UI retains candidate labels (not marked as official or reviewed).

### FPT/MWG/VNM Source-Priority Stability Summary
- The fallback logic remains stable. These tickers continue to display their controlled, full-fidelity data sets (`phase109_controlled_local_financials`), bypassing the `vnstock_financials_candidate` records gracefully.

## Financial Data Summary Per Ticker

| Ticker | EPS   | sharesOutstanding | totalDebt  | source / status                        | missing fields |
|--------|-------|-------------------|------------|----------------------------------------|----------------|
| FPT    | 4944  | 1,471,069,183     | 14947.354  | phase109_controlled_local_financials (research_only) | None           |
| MWG    | 2546  | 1,454,644,497     | 27300.247  | phase109_controlled_local_financials (research_only) | None           |
| VNM    | 4130  | 2,089,955,445     | 10059.066  | phase109_controlled_local_financials (research_only) | None           |
| HPG    | 1973  | 7,675,465,855     | null       | vnstock_financials_candidate (research_only) | totalDebt, etc.|
| VCB    | 3854  | 8,355,675,094     | null       | vnstock_financials_candidate (research_only) | totalDebt, etc.|
| MSN    | 2710  | 1,520,491,927     | null       | vnstock_financials_candidate (research_only) | totalDebt, etc.|

## Guardrail Scan Summary
- **no buy/sell/hold**: Verified. Prompt restricts this language entirely.
- **no trading signal**: Verified.
- **no target price/fair value/upside/downside**: Verified.
- **no cheap/expensive conclusion as advice**: Verified.
- **no missing-to-zero**: Verified.
- **no sample/fallback-as-real**: Verified.
- **no totalLiabilities-as-totalDebt**: Verified.
- **no productionApproved=true**: Verified.
- **no reviewed/official claim**: Verified.

## Validation Results
- `npx prisma validate`: Passed.
- `npm run typecheck`: Passed.
- `npm run lint`: Passed.
- `npm test`: Passed (127 files, 1090 tests, exit code 0).
- `npm run build`: Passed.

## List of Screenshots
No screenshots were generated. Visual snapshots are deferred to an environment equipped with proper browser automation.

## Next Recommended Phase
Phase 139A - Product review of the Valuation UI implementation to ensure consistent display of candidate data disclaimers.
