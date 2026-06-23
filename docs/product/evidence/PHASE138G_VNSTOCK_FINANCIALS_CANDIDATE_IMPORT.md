# Phase 138G: VNStock Financials Candidate Import

## Objective
Create a controlled local import path for VNStock financials candidate data, importing only safe candidate fields (`eps`, `sharesOutstanding`) while strictly blocking unavailable or ambiguous fields (`totalDebt`).

## Scope Boundaries
- Only `eps` and `sharesOutstanding` were allowed.
- `totalDebt` was explicitly excluded as Phase 138F proved it ambiguous or unavailable.
- No schema or migration changes were made.
- Candidate records were written purely as `research_only`, `candidate`, with `productionApproved = false`.
- Existing FPT/MWG/VNM reviewed/local data paths were safely preserved (duplicates are skipped if identical or inserted alongside via `sourceLabel` isolation).
- No missing values were rewritten as 0.

## Rationale
- **Why only EPS and sharesOutstanding:** These fields map cleanly directly to integers/finite numbers from VNStock's explicit payload with accepted units (`vnd_per_share` and `shares`).
- **Why totalDebt remains blocked:** For non-banks it's fragmented across short/long term, and for banks (like VCB) it's entirely misrepresented via total liabilities. Blocking prevents catastrophic misrepresentations in the product.

## Execution Details
- **VNStock Version:** 4.0.4
- **Commands Run:**
  - `npx tsx scripts/import-vnstock-financials-candidate.ts --allow-network`
  - `npx tsx scripts/import-vnstock-financials-candidate.ts --allow-network --confirm-write`

## Dry-Run Summary
The dry-run generated candidate rows perfectly matching the constraints:
- Total rows generated: 6
- Accepted: 6
- Skipped: 0
- Rejected: 0
- Candidates selected: EPS, sharesOutstanding. totalDebt was forcefully mapped to null.

## Confirm-Write Summary
The write process successfully inserted rows into the local `dev.db` database using the `vnstock_financials_candidate` source label.

- Total rows written: 6
- Total rows skipped: 0
- Rejected: 0
- Execution status: `write_completed`

### Per Ticker Result

- FPT: 1 row inserted (EPS: 5216, sharesOutstanding: 1,703,507,121)
- MWG: 1 row inserted (EPS: 4774, sharesOutstanding: 1,468,423,529)
- VNM: 1 row inserted (EPS: 4028, sharesOutstanding: 2,089,955,445)
- HPG: 1 row inserted (EPS: 1973, sharesOutstanding: 7,675,465,855)
- VCB: 1 row inserted (EPS: 3854, sharesOutstanding: 8,355,675,094)
- MSN: 1 row inserted (EPS: 2710, sharesOutstanding: 1,520,491,927)

### Duplicate/Idempotency Behavior
- If run again, the script skips insertion, logging `skippedExistingCount` because it checks against existing `ticker, fiscalYear, periodType, sourceId, dataMode` combinations.

## Confirmations
- **No totalDebt imported:** Confirmed. `totalDebt` was `null` across all candidate rows.
- **No schema/migration change:** Confirmed. `prisma/schema.prisma` is untouched.
- **No productionApproved=true:** Confirmed. Hardcoded to `false`.
- **No reviewed/official claim:** Confirmed. Labeled `vnstock_financials_candidate` under `research_only`.
- **No missing-to-zero:** Confirmed. Missing fields remained `undefined` and mapped to `null` in DB.
- **No totalLiabilities-as-totalDebt:** Confirmed. The VNStock candidate normalizer blocks this.
- **VCB banking caveat:** Preserved in candidate metadata/evidence.

## Next Recommended Phase
Phase 138H: Implement UI and guardrails for exposing `research_only` financial candidate data safely to the user (displaying EPS and sharesOutstanding, and clearly warning about missing totalDebt).
