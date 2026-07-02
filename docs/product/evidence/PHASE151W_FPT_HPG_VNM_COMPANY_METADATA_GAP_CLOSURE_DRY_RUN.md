# Phase 151W - FPT HPG VNM Company Metadata Gap Closure Dry Run

## Goal

Find or prepare reviewed `Company` metadata source packages for:

- `FPT`
- `HPG`
- `VNM`

This phase tries to close the remaining Company metadata gap from Phase 151V before any later bounded Company metadata confirm-write.

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No `ScreeningCandidate` write.
- No `MarketPrice` write.
- No `FinancialStatement` write.
- No `CompanyIndustry` write.
- No ranking, scoring, benchmark, stock attractiveness score, or `IndustryMetric`.
- No static UI/runtime copy as real data.
- No test fixture as real data.
- No evidence text alone as real data unless tied to reviewed source/provenance artifacts.
- No issuer local seed as reviewed metadata when it explicitly lacks source/legal approval.
- Missing data remains null/N/A/needs_review.
- `productionApproved=true` remains zero.
- MSN/MWG/VCB untouched.
- HSG/NKG untouched.
- TVN absent.

## Files Changed

- `scripts/dry-run-fpt-hpg-vnm-company-metadata-gap-closure.ts`
- `docs/product/evidence/PHASE151W_FPT_HPG_VNM_COMPANY_METADATA_GAP_CLOSURE_DRY_RUN.md`

## Sources Inspected

- `src/lib/data-sources/issuer-metadata-service.ts`
- `docs/product/evidence/PHASE151V_CORE_TICKER_COMPANY_METADATA_SOURCE_PACKAGE_DRY_RUN.md`
- `docs/product/evidence/PHASE139I_FPT_PDF_2025_PROVENANCE_DRY_RUN.md`
- `docs/product/evidence/PHASE139I_FPT_PDF_2025_PREVIEW.json`
- `docs/product/evidence/PHASE139J_FPT_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md`
- `docs/product/evidence/PHASE139B_HPG_PDF_2025_MANUAL_PROVENANCE_PREVIEW.md`
- `docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json`
- `docs/product/evidence/PHASE139D_HPG_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md`
- `docs/product/evidence/PHASE139F_VNM_PDF_2025_PROVENANCE_DRY_RUN.md`
- `docs/product/evidence/PHASE139F_VNM_PDF_2025_PREVIEW.json`
- `docs/product/evidence/PHASE139G_VNM_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md`
- `prisma/schema.prisma`

## Dry-Run Summary

```json
{
  "phase": "151W",
  "mode": "dry_run",
  "targetTickers": ["FPT", "HPG", "VNM"],
  "companyCandidatesPrepared": 3,
  "eligibleCompanyCandidates": 0,
  "blockedCompanyCandidates": 3,
  "readyForCompanyConfirmWriteByTicker": {
    "FPT": false,
    "HPG": false,
    "VNM": false
  },
  "tickersReadyForCompanyConfirmWrite": [],
  "tickersBlocked": ["FPT", "HPG", "VNM"],
  "wouldAllowAllCoreCompanyConfirmWrite": false,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "uiChanged": false,
  "assistantChanged": false,
  "screeningCandidateWriteAttempted": false,
  "marketPriceWriteAttempted": false,
  "financialStatementWriteAttempted": false,
  "companyIndustryWriteAttempted": false,
  "productionApprovedTrueCount": 0,
  "msnMwgVcbUntouched": true,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "forbiddenAdviceDetected": false,
  "smokePassed": true
}
```

## Company Metadata Candidates

| Ticker | Company candidate | Company name | Exchange | Source decision |
| --- | --- | --- | --- | --- |
| FPT | Blocked | null | null | Existing artifacts support financial statement provenance, not structured Company metadata identity. |
| HPG | Blocked | null | null | Existing artifacts support financial statement provenance, not structured Company metadata identity. |
| VNM | Blocked | null | null | Existing artifacts support financial statement provenance, not structured Company metadata identity. |

## Missing Company Metadata Fields

| Ticker | Missing fields |
| --- | --- |
| FPT | companyName, exchange, country, market, sector, industryLabel |
| HPG | companyName, exchange, country, market, sector, industryLabel |
| VNM | companyName, exchange, country, market, sector, industryLabel |

Missing values remain null/N/A/needs_review and were not inferred from local seed, static UI copy, runtime copy, or test fixtures.

## Source Decision By Ticker

### FPT

Inspected artifacts:

- `PHASE139I_FPT_PDF_2025_PROVENANCE_DRY_RUN.md`
- `PHASE139I_FPT_PDF_2025_PREVIEW.json`
- `PHASE139J_FPT_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md`

Decision: blocked. These artifacts are useful for reviewed financial statement values, but they do not provide a structured Company metadata identity package with companyName/exchange provenance. The issuer local seed is not eligible because it explicitly says no source/legal approval has been recorded.

### HPG

Inspected artifacts:

- `PHASE139B_HPG_PDF_2025_MANUAL_PROVENANCE_PREVIEW.md`
- `PHASE139B_HPG_PDF_2025_PREVIEW.json`
- `PHASE139D_HPG_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md`

Decision: blocked. These artifacts are useful for reviewed financial statement values, but they do not provide a structured Company metadata identity package with companyName/exchange provenance.

### VNM

Inspected artifacts:

- `PHASE139F_VNM_PDF_2025_PROVENANCE_DRY_RUN.md`
- `PHASE139F_VNM_PDF_2025_PREVIEW.json`
- `PHASE139G_VNM_PDF_REVIEWED_PREVIEW_CONTROLLED_IMPORT.md`

Decision: blocked. These artifacts are useful for reviewed financial statement values, but they do not provide a structured Company metadata identity package with companyName/exchange provenance. The issuer local seed is not eligible because it explicitly says no source/legal approval has been recorded.

## Does This Enable One Later Confirm-Write For All Six Core Tickers?

No.

Phase 151V left `MSN`, `MWG`, and `VCB` ready for Company metadata confirm-write. Phase 151W keeps `FPT`, `HPG`, and `VNM` blocked. Therefore a single all-six Company metadata confirm-write is not ready.

The next product decision is either:

- collect manual reviewed identity source packages for FPT/HPG/VNM; or
- confirm-write only the already-ready tickers from Phase 151V, while leaving FPT/HPG/VNM blocked.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- `ScreeningCandidate` write: no.
- `MarketPrice` write: no.
- `FinancialStatement` write: no.
- `CompanyIndustry` write: no.
- MSN/MWG/VCB untouched: yes.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.

## Validation

- `npx eslint scripts/dry-run-fpt-hpg-vnm-company-metadata-gap-closure.ts` - passed.
- `npx tsx scripts/dry-run-fpt-hpg-vnm-company-metadata-gap-closure.ts` - passed.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

Some tickers remain blocked.

Recommended next step:

- Decide whether to collect manual reviewed identity source packages for FPT/HPG/VNM, or proceed with a bounded Company metadata confirm-write for only the ready tickers from Phase 151V (`MSN`, `MWG`, `VCB`).
