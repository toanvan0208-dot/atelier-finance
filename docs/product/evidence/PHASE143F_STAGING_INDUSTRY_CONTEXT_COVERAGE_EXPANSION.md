# Phase 143F: Staging Industry Context Coverage Expansion

## Objective
To seed additional `IndustryContext` records into the staging database for the missing approved tickers (HPG, VNM, MSN, MWG) to ensure full coverage on the read-path. The process must strictly adhere to the project's data safety guidelines, using guarded non-production flags.

## Execution Details
- **Environment:** Staging PostgreSQL.
- **Tickers Addressed:** HPG, VNM, MSN, MWG.
- **Source of Data:** Mock short contexts created explicitly for staging research to satisfy the read path.
- **Schema Bypass:** A temporary type modification of `DataMode` to `SourceUsageStatus` was used locally to bypass Prisma type drift (matching the Phase 143D approach) during seed, then reverted.

## Validated Guards
All contexts have been seeded using the staging-specific parameters to explicitly mark the data as non-production:
- `dataMode`: `"research_only"`
- `productionApproved`: `false`
- `needsReview`: `true`
- `sourceLabel`: `"staging_macro_industry_research_seed"`

## Coverage Matrix Result
The read path `scripts/smoke-staging-macro-industry-read-path.ts` confirms full coverage:

```text
Global Macro Context: available

Coverage Matrix:
Ticker | Macro context | Industry context | Status
---------------------------------------------------------
FPT    | available     | available        | OK
HPG    | available     | available        | OK
VNM    | available     | available        | OK
MSN    | available     | available        | OK
MWG    | available     | available        | OK
VCB    | not applicable/excluded | null | excluded
```

## Security & Best Practices
- `NODE_TLS_REJECT_UNAUTHORIZED="0"` was used purely for local staging connection verification.
- **No Production Impact:** This was executed exclusively against the staging database without production deployment or import.
- **No VCB Integration:** VCB remains excluded from related industry context processing.

## Conclusion
Phase 143F is complete. All 5 approved tickers now have successfully connected `MacroContext` and `IndustryContext` read-paths in staging, fulfilling the requirements.
